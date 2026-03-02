import { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";

let pgPool: any = null;

async function getPgPool() {
  if (pgPool) return pgPool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  
  try {
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({ 
      connectionString: dbUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const client = await pgPool.connect();
    client.release();
    console.log('[AdminAuth] PostgreSQL connection established');
    return pgPool;
  } catch (e) {
    console.error('[AdminAuth] Failed to connect to PostgreSQL:', e);
    pgPool = null;
    return null;
  }
}

// Middleware to verify admin JWT token
export function requireAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function registerAdminAuthRoutes(app: Express) {
  // POST /admin/auth/login
  app.post('/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Get user with password_hash, role, and 2FA fields
      const result = await pool.query(
        'SELECT id, email, password_hash, name, role, totp_enabled, totp_secret FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      const user = result.rows[0];

      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if 2FA is enabled
      if (user.totp_enabled && user.totp_secret) {
        const { totp_code } = req.body;
        if (!totp_code) {
          // Return a special response indicating 2FA is needed
          return res.status(200).json({ 
            requires_2fa: true, 
            message: 'Two-factor authentication code required' 
          });
        }
        // Verify the TOTP code
        const totp = new OTPAuth.TOTP({
          issuer: 'HaulKind Admin',
          label: user.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(user.totp_secret),
        });
        const delta = totp.validate({ token: totp_code, window: 1 });
        if (delta === null) {
          return res.status(401).json({ error: 'Invalid two-factor authentication code' });
        }
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: 'admin' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );
      
      res.json({ 
        token, 
        admin: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      });
    } catch (err: any) {
      console.error('Admin login error:', err);
      res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
    }
  });

  // GET /admin/auth/me - Get current admin user
  app.get('/admin/auth/me', requireAdmin, async (req: any, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const result = await pool.query(
        'SELECT id, email, name, totp_enabled FROM users WHERE id = $1 LIMIT 1',
        [req.user.userId]
      );
      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        admin: { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          totp_enabled: !!user.totp_enabled
        } 
      });
    } catch (err: any) {
      console.error('Get admin user error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/auth/change-password - Change admin password
  app.post('/admin/auth/change-password', requireAdmin, async (req: any, res) => {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (new_password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Verify current password
      const userResult = await pool.query(
        'SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1',
        [req.user.userId]
      );
      const user = userResult.rows[0];
      if (!user || !user.password_hash) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash and save new password
      const newHash = await bcrypt.hash(new_password, 12);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newHash, req.user.userId]
      );

      console.log(`[AdminAuth] Password changed for user ${req.user.userId}`);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err: any) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/auth/2fa/setup - Generate TOTP secret and QR code
  app.post('/admin/auth/2fa/setup', requireAdmin, async (req: any, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const userResult = await pool.query(
        'SELECT id, email, totp_enabled FROM users WHERE id = $1 LIMIT 1',
        [req.user.userId]
      );
      const user = userResult.rows[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.totp_enabled) {
        return res.status(400).json({ error: '2FA is already enabled. Disable it first to re-setup.' });
      }

      // Generate new TOTP secret
      const secret = new OTPAuth.Secret({ size: 20 });
      const totp = new OTPAuth.TOTP({
        issuer: 'HaulKind Admin',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Save the secret temporarily (not enabled yet until verified)
      await pool.query(
        'UPDATE users SET totp_secret = $1, totp_enabled = false WHERE id = $2',
        [secret.base32, req.user.userId]
      );

      // Generate QR code as data URL
      const otpauthUrl = totp.toString();
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

      console.log(`[AdminAuth] 2FA setup initiated for user ${req.user.userId}`);
      res.json({
        secret: secret.base32,
        qr_code: qrDataUrl,
        otpauth_url: otpauthUrl,
      });
    } catch (err: any) {
      console.error('2FA setup error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/auth/2fa/verify - Verify TOTP code and enable 2FA
  app.post('/admin/auth/2fa/verify', requireAdmin, async (req: any, res) => {
    try {
      const { totp_code } = req.body;
      if (!totp_code) {
        return res.status(400).json({ error: 'TOTP code is required' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const userResult = await pool.query(
        'SELECT id, email, totp_secret, totp_enabled FROM users WHERE id = $1 LIMIT 1',
        [req.user.userId]
      );
      const user = userResult.rows[0];
      if (!user || !user.totp_secret) {
        return res.status(400).json({ error: 'No 2FA setup in progress. Please start setup first.' });
      }

      // Verify the code
      const totp = new OTPAuth.TOTP({
        issuer: 'HaulKind Admin',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.totp_secret),
      });

      const delta = totp.validate({ token: totp_code, window: 1 });
      if (delta === null) {
        return res.status(401).json({ error: 'Invalid code. Please try again.' });
      }

      // Enable 2FA
      await pool.query(
        'UPDATE users SET totp_enabled = true WHERE id = $1',
        [req.user.userId]
      );

      console.log(`[AdminAuth] 2FA ENABLED for user ${req.user.userId}`);
      res.json({ success: true, message: 'Two-factor authentication enabled successfully' });
    } catch (err: any) {
      console.error('2FA verify error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/auth/2fa/disable - Disable 2FA
  app.post('/admin/auth/2fa/disable', requireAdmin, async (req: any, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Password is required to disable 2FA' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Verify password before disabling
      const userResult = await pool.query(
        'SELECT id, password_hash, totp_enabled FROM users WHERE id = $1 LIMIT 1',
        [req.user.userId]
      );
      const user = userResult.rows[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.totp_enabled) {
        return res.status(400).json({ error: '2FA is not enabled' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Disable 2FA and clear secret
      await pool.query(
        'UPDATE users SET totp_enabled = false, totp_secret = NULL WHERE id = $1',
        [req.user.userId]
      );

      console.log(`[AdminAuth] 2FA DISABLED for user ${req.user.userId}`);
      res.json({ success: true, message: 'Two-factor authentication disabled' });
    } catch (err: any) {
      console.error('2FA disable error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

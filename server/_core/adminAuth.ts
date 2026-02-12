import { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

      // Get user with password_hash
      // For now, we'll use the users table and check if email is an admin email
      // In production, you'd want a separate admin_users table or a role column
      const result = await pool.query(
        'SELECT id, email, password_hash, name FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      const user = result.rows[0];

      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if this is an admin email (hardcoded for now)
      // TODO: Add proper role management
      const adminEmails = [
        'admin@haulkind.com',
        'negocios@haulkind.com'
      ];
      if (!adminEmails.includes(email.toLowerCase())) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
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
        'SELECT id, email, name FROM users WHERE id = $1 LIMIT 1',
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
          name: user.name 
        } 
      });
    } catch (err: any) {
      console.error('Get admin user error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

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
    console.log("[DriverAuth] PostgreSQL connection established");
    return pgPool;
  } catch (e) {
    console.error("[DriverAuth] Failed to connect to PostgreSQL:", e);
    pgPool = null;
    return null;
  }
}

async function ensureDriverColumns(pool: any) {
  const columnsToAdd = [
    { name: "first_name", type: "TEXT DEFAULT ''" },
    { name: "last_name", type: "TEXT DEFAULT ''" },
    { name: "address", type: "TEXT DEFAULT ''" },
    { name: "city", type: "TEXT DEFAULT ''" },
    { name: "state", type: "TEXT DEFAULT ''" },
    { name: "zip_code", type: "TEXT DEFAULT ''" },
    { name: "vehicle_type", type: "TEXT DEFAULT ''" },
    { name: "vehicle_capacity", type: "TEXT DEFAULT ''" },
    { name: "lifting_limit", type: "INTEGER DEFAULT 0" },
    { name: "services", type: "TEXT DEFAULT '[]'" },
  ];
  for (const col of columnsToAdd) {
    try {
      await pool.query(
        `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
      );
    } catch (e) {
      // Column may already exist, ignore
    }
  }
}

export function registerDriverAuthRoutes(app: Express) {
  // POST /driver/auth/signup
  app.post("/driver/auth/signup", async (req, res) => {
    try {
      const { email, password, name, phone, firstName, lastName, address, city, state, zipCode } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Ensure extra columns exist
      await ensureDriverColumns(pool);

      // Check if user already exists
      const existingResult = await pool.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingDriver = await pool.query(
        "SELECT id FROM drivers WHERE email = $1 LIMIT 1",
        [email]
      );
      if (existingDriver.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered as driver" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const fullName = name || `${firstName || ""} ${lastName || ""}`.trim();

      // Insert into users table
      const insertResult = await pool.query(
        `INSERT INTO users (email, name, phone, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [email, fullName, phone || null, hashedPassword]
      );
      const userId = insertResult.rows[0]?.id;

      // Insert into drivers table with ALL fields
      const driverResult = await pool.query(
        `INSERT INTO drivers (name, phone, email, password_hash, status, first_name, last_name, address, city, state, zip_code, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING id`,
        [
          fullName,
          phone || "",
          email,
          hashedPassword,
          "pending",
          firstName || "",
          lastName || "",
          address || "",
          city || "",
          state || "",
          zipCode || "",
        ]
      );
      const driverId = driverResult.rows[0]?.id;

      const token = jwt.sign(
        { userId, email, role: "driver", driverId },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        driver: { id: driverId, userId, email, status: "pending" },
      });
    } catch (error: any) {
      console.error("Driver signup error:", error);
      res.status(500).json({
        error: "Failed to create account",
        details: error?.message || String(error),
      });
    }
  });

  // POST /driver/auth/login
  app.post("/driver/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const result = await pool.query(
        "SELECT id, email, password_hash, name FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      const user = result.rows[0];
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const driverResult = await pool.query(
        "SELECT id, status FROM drivers WHERE email = $1 LIMIT 1",
        [email]
      );
      const driver = driverResult.rows[0];
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: "driver", driverId: driver.id },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
        driver: { id: driver.id, status: driver.status },
      });
    } catch (err: any) {
      console.error("Driver login error:", err);
      res.status(500).json({
        error: "Internal server error",
        details: err?.message || String(err),
      });
    }
  });

  // POST /driver/profile/vehicle - Save vehicle info from onboarding
  app.post("/driver/profile/vehicle", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }
      const token = authHeader.replace("Bearer ", "");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const driverId = decoded.driverId;

      if (!driverId) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const { vehicleType, vehicleCapacity, liftingLimit, services } = req.body;

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      await ensureDriverColumns(pool);

      await pool.query(
        `UPDATE drivers SET vehicle_type = $1, vehicle_capacity = $2, lifting_limit = $3, services = $4, updated_at = NOW() WHERE id = $5`,
        [
          vehicleType || "",
          vehicleCapacity || "",
          liftingLimit || 0,
          JSON.stringify(services || []),
          driverId,
        ]
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Save vehicle error:", error);
      res.status(500).json({ error: "Failed to save vehicle info" });
    }
  });

  // POST /driver/documents/upload - Upload driver documents
  app.post("/driver/documents/upload", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
      }
      const token = authHeader.replace("Bearer ", "");
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const driverId = decoded.driverId;

      if (!driverId) {
        return res.status(401).json({ error: "Invalid token" });
      }

      // For now, just acknowledge the upload
      // In production, this would save to S3/cloud storage
      res.json({ success: true, message: "Document received" });
    } catch (error: any) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });
}

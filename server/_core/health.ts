import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.get("/health/db", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl ? dbUrl.replace(/\/\/[^@]+@/, "//***:***@").substring(0, 80) : "NOT SET";
  
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ status: "timeout", DATABASE_URL_MASKED: masked });
    }
  }, 8000);

  try {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: dbUrl, max: 2, connectionTimeoutMillis: 5000 });
    
    // Get all tables
    const tablesResult = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    const tables = tablesResult.rows.map((r: any) => r.table_name);

    // Get users columns
    const colsResult = await pool.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
    const usersColumns = colsResult.rows.map((r: any) => `${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`);

    // Get drivers columns
    const driverColsResult = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'drivers' ORDER BY ordinal_position`);
    const driversColumns = driverColsResult.rows.map((r: any) => `${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`);

    await pool.end();
    clearTimeout(timeout);
    
    if (!res.headersSent) {
      res.json({ status: "ok", DATABASE_URL_MASKED: masked, tables, usersColumns, driversColumns });
    }
  } catch (error: any) {
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: error?.message || String(error), DATABASE_URL_MASKED: masked });
    }
  }
});

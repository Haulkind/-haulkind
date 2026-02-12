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

    // Get columns for each main table
    const getColumns = async (tableName: string) => {
      const result = await pool.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [tableName]
      );
      return result.rows.map((r: any) => `${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`);
    };

    const usersColumns = await getColumns('users');
    const driversColumns = await getColumns('drivers');
    const customersColumns = await getColumns('customers');
    const ordersColumns = await getColumns('orders');

    await pool.end();
    clearTimeout(timeout);
    
    if (!res.headersSent) {
      res.json({ 
        status: "ok", 
        DATABASE_URL_MASKED: masked, 
        tables, 
        usersColumns, 
        driversColumns,
        customersColumns,
        ordersColumns
      });
    }
  } catch (error: any) {
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: error?.message || String(error), DATABASE_URL_MASKED: masked });
    }
  }
});

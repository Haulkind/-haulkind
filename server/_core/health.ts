import { Router } from "express";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.get("/health/db", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl ? dbUrl.replace(/\/\/[^@]+@/, "//***:***@").substring(0, 80) : "NOT SET";
  
  // Set a timeout so the endpoint doesn't hang forever
  const timeout = setTimeout(() => {
    res.status(504).json({ 
      status: "timeout", 
      message: "Database query timed out after 8 seconds",
      DATABASE_URL_MASKED: masked,
    });
  }, 8000);

  try {
    const db = await getDb();
    if (!db) {
      clearTimeout(timeout);
      return res.json({ 
        status: "no_db", 
        message: "Database not available - getDb() returned null",
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_MASKED: masked
      });
    }

    // Test basic connectivity
    const result = await db.execute(sql`SELECT 1 as test`);
    clearTimeout(timeout);

    // Check tables
    let tables: string[] = [];
    try {
      const tablesResult = await db.execute(sql`SHOW TABLES`);
      const tablesRows = Array.isArray(tablesResult) ? (tablesResult as any)[0] : tablesResult;
      tables = Array.isArray(tablesRows) ? tablesRows.map((r: any) => Object.values(r)[0] as string) : [];
    } catch (e: any) {
      tables = ["ERROR: " + (e?.message || String(e))];
    }

    // Check users columns
    let usersColumns: string[] = [];
    try {
      const colsResult = await db.execute(sql`SHOW COLUMNS FROM users`);
      const colsRows = Array.isArray(colsResult) ? (colsResult as any)[0] : colsResult;
      usersColumns = Array.isArray(colsRows) ? colsRows.map((r: any) => `${r.Field} (${r.Type})`) : [];
    } catch (e: any) {
      usersColumns = ["ERROR: " + (e?.message || String(e))];
    }

    res.json({
      status: "ok",
      DATABASE_URL_MASKED: masked,
      dbConnected: true,
      tables,
      usersColumns,
    });
  } catch (error: any) {
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.status(500).json({ 
        status: "error", 
        message: error?.message || String(error),
        code: error?.code,
        errno: error?.errno,
        DATABASE_URL_MASKED: masked,
      });
    }
  }
});

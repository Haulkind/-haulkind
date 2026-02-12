import { Router } from "express";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.get("/health/db", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl ? dbUrl.replace(/\/\/[^@]+@/, "//***:***@") : "NOT SET";
  
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ 
        status: "no_db", 
        message: "Database not available - getDb() returned null",
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_MASKED: masked
      });
    }

    // Test basic connectivity with raw mysql2
    let rawTestResult = null;
    let rawTestError = null;
    try {
      const result = await db.execute(sql`SELECT 1 as test`);
      rawTestResult = result;
    } catch (e: any) {
      rawTestError = e?.message || String(e);
      // Try to get the underlying cause
      if (e?.cause) rawTestError += " | cause: " + String(e.cause);
      if (e?.code) rawTestError += " | code: " + e.code;
      if (e?.errno) rawTestError += " | errno: " + e.errno;
      if (e?.sqlState) rawTestError += " | sqlState: " + e.sqlState;
    }

    // Check tables
    let tables: string[] = [];
    try {
      const tablesResult = await db.execute(sql`SHOW TABLES`);
      const tablesRows = Array.isArray(tablesResult) ? (tablesResult as any)[0] : tablesResult;
      tables = Array.isArray(tablesRows) ? tablesRows.map((r: any) => Object.values(r)[0] as string) : [];
    } catch (e: any) {
      tables = ["ERROR: " + (e?.message || String(e))];
    }

    res.json({
      status: rawTestError ? "db_error" : "ok",
      DATABASE_URL_MASKED: masked,
      dbConnected: !rawTestError,
      rawTestResult: rawTestResult ? "OK" : null,
      rawTestError,
      tables,
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: "error", 
      message: error?.message || String(error),
      DATABASE_URL_MASKED: masked,
    });
  }
});

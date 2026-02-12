import { Router } from "express";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.get("/health/db", async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ status: "no_db", message: "Database not available", DATABASE_URL_SET: !!process.env.DATABASE_URL });
    }

    // Test basic query
    const testResult = await db.execute(sql`SELECT 1 as test`);
    const testRows = Array.isArray(testResult) ? (testResult as any)[0] : testResult;

    // Check if users table exists
    let usersTableExists = false;
    let usersColumns: string[] = [];
    try {
      const tablesResult = await db.execute(sql`SHOW TABLES LIKE 'users'`);
      const tablesRows = Array.isArray(tablesResult) ? (tablesResult as any)[0] : tablesResult;
      usersTableExists = Array.isArray(tablesRows) && tablesRows.length > 0;

      if (usersTableExists) {
        const colsResult = await db.execute(sql`SHOW COLUMNS FROM users`);
        const colsRows = Array.isArray(colsResult) ? (colsResult as any)[0] : colsResult;
        usersColumns = Array.isArray(colsRows) ? colsRows.map((r: any) => `${r.Field} (${r.Type})`) : [];
      }
    } catch (e) {
      // table doesn't exist
    }

    // Check drivers table
    let driversTableExists = false;
    let driversColumns: string[] = [];
    try {
      const tablesResult = await db.execute(sql`SHOW TABLES LIKE 'drivers'`);
      const tablesRows = Array.isArray(tablesResult) ? (tablesResult as any)[0] : tablesResult;
      driversTableExists = Array.isArray(tablesRows) && tablesRows.length > 0;

      if (driversTableExists) {
        const colsResult = await db.execute(sql`SHOW COLUMNS FROM drivers`);
        const colsRows = Array.isArray(colsResult) ? (colsResult as any)[0] : colsResult;
        driversColumns = Array.isArray(colsRows) ? colsRows.map((r: any) => `${r.Field} (${r.Type})`) : [];
      }
    } catch (e) {
      // table doesn't exist
    }

    res.json({
      status: "ok",
      dbConnected: true,
      testQuery: testRows,
      usersTableExists,
      usersColumns,
      driversTableExists,
      driversColumns,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: String(error) });
  }
});

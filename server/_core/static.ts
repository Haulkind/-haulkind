import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Try multiple possible locations for the public folder
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "../..", "dist", "public"),
    path.resolve(process.cwd(), "server/_core/public"),
    path.resolve(process.cwd(), "public"),
  ];
  
  let distPath = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      console.log(`[Static] Using public folder at: ${distPath}`);
      break;
    }
  }
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the public directory in any of these locations:`,
      possiblePaths
    );
    // Only serve root path, don't capture all routes
    app.get("/", (_req, res) => {
      res.send(`<!DOCTYPE html><html><head><title>Haulkind API</title></head><body><h1>Haulkind API Server</h1><p>Backend is running. Public folder not found.</p></body></html>`);
    });
    return;
  }
  
  app.use(express.static(distPath));
  // Serve index.html for root path only (not for API routes)
  app.get("/", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`<!DOCTYPE html><html><head><title>Haulkind API</title></head><body><h1>Haulkind API Server</h1><p>Backend is running.</p></body></html>`);
    }
  });
}

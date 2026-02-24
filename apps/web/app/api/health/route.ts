import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    project: process.env.RAILWAY_PROJECT_ID || 'unknown',
    env: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    project: process.env.VERCEL_PROJECT_ID || 'unknown',
    env: process.env.VERCEL_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BASE_URL = 'https://haulkind-api-production-b00f.up.railway.app';
const TIMEOUT_MS = 10000;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    console.log('[JOB_STATUS_PROXY] Getting status for job:', jobId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${RAILWAY_BASE_URL}/jobs/${jobId}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    console.log('[JOB_STATUS_PROXY] Railway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[JOB_STATUS_PROXY] Railway error:', {
        status: response.status,
        body: errorText.substring(0, 500),
      });
      return NextResponse.json(
        { error: 'Failed to get job status', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[JOB_STATUS_PROXY] Railway success:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[JOB_STATUS_PROXY] Timeout after', TIMEOUT_MS, 'ms');
      return NextResponse.json(
        { error: 'Job status check timed out' },
        { status: 504 }
      );
    }
    console.error('[JOB_STATUS_PROXY] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to get job status', details: error.message },
      { status: 500 }
    );
  }
}

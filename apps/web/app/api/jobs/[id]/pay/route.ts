import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BASE_URL = 'https://haulkind-api-production-b00f.up.railway.app';
const TIMEOUT_MS = 15000;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    console.log('[PAY_PROXY] Processing payment for job:', jobId, body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${RAILWAY_BASE_URL}/jobs/${jobId}/pay`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    console.log('[PAY_PROXY] Railway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PAY_PROXY] Railway error:', {
        status: response.status,
        body: errorText.substring(0, 500),
      });
      return NextResponse.json(
        { error: 'Payment failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[PAY_PROXY] Railway success:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[PAY_PROXY] Timeout after', TIMEOUT_MS, 'ms');
      return NextResponse.json(
        { error: 'Payment timed out' },
        { status: 504 }
      );
    }
    console.error('[PAY_PROXY] Error:', error.message);
    return NextResponse.json(
      { error: 'Payment failed', details: error.message },
      { status: 500 }
    );
  }
}

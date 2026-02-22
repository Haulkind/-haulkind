import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BASE_URL = 'https://haulkind-api-production-b00f.up.railway.app';
const TIMEOUT_MS = 10000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[QUOTES_PROXY] Request body:', JSON.stringify(body));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${RAILWAY_BASE_URL}/quotes`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    console.log('[QUOTES_PROXY] Railway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[QUOTES_PROXY] Railway error:', {
        status: response.status,
        body: errorText.substring(0, 500),
      });
      return NextResponse.json(
        { error: 'Quote calculation failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[QUOTES_PROXY] Railway success:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[QUOTES_PROXY] Timeout after', TIMEOUT_MS, 'ms');
      return NextResponse.json(
        { error: 'Quote calculation timed out' },
        { status: 504 }
      );
    }
    console.error('[QUOTES_PROXY] Error:', error.message);
    return NextResponse.json(
      { error: 'Quote calculation failed', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app';
const TIMEOUT_MS = 30000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[UPLOAD_PROXY] Uploading photos, count:', body.photos?.length || 0);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${RAILWAY_BASE_URL}/upload-photos`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[UPLOAD_PROXY] Railway error:', response.status, errorText.substring(0, 500));
      return NextResponse.json(
        { error: 'Photo upload failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[UPLOAD_PROXY] Success:', data.photoUrls?.length, 'photos');
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Upload timed out' }, { status: 504 });
    }
    console.error('[UPLOAD_PROXY] Error:', error.message);
    return NextResponse.json(
      { error: 'Photo upload failed', details: error.message },
      { status: 500 }
    );
  }
}

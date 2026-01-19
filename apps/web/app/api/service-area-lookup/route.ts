import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_BASE_URL = 'https://haulkind-production.up.railway.app';
const TIMEOUT_MS = 8000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!lat || !lng) {
    console.error('[SERVICE_AREA_PROXY] Missing parameters:', { lat, lng });
    return NextResponse.json(
      { error: 'Missing lat or lng parameters' },
      { status: 400 }
    );
  }
  
  const url = `${RAILWAY_BASE_URL}/service-areas/lookup?lat=${lat}&lng=${lng}`;
  console.log('[SERVICE_AREA_PROXY] Calling Railway:', url);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('[SERVICE_AREA_PROXY] Railway response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SERVICE_AREA_PROXY] Railway error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500)
      });
      
      return NextResponse.json(
        { 
          error: 'Service area check failed',
          details: `Railway returned ${response.status}`,
          covered: false
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('[SERVICE_AREA_PROXY] Railway success:', data);
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[SERVICE_AREA_PROXY] Timeout after', TIMEOUT_MS, 'ms');
      return NextResponse.json(
        { error: 'Service area check timed out', covered: false },
        { status: 504 }
      );
    }
    
    console.error('[SERVICE_AREA_PROXY] Unexpected error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Service area check failed', covered: false },
      { status: 500 }
    );
  }
}

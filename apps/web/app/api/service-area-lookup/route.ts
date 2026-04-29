import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const RAILWAY_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app';
const TIMEOUT_MS = 8000;

// Approved states - all addresses in these states are automatically covered
// NJDEP compliance: NJ removed from approved states. HaulKind does not service
// New Jersey for hauling/junk-removal. Drivers in NJ may still pass through NJ
// addresses for Donation Pickup pickup-in-PA-deliver-in-NY style flows, but
// this API is for service-area approval and must not auto-approve NJ.
const APPROVED_STATES = ['MA', 'PA', 'NY', 'CT'];

export async function GET(request: NextRequest) {
  // Rate limit: 30 lookups per minute per IP
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`service-area:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const state = searchParams.get('state'); // Optional state parameter
  
  if (!lat || !lng) {
    console.error('[SERVICE_AREA_PROXY] Missing parameters:', { lat, lng });
    return NextResponse.json(
      { error: 'Missing lat or lng parameters' },
      { status: 400 }
    );
  }
  
  // If state is provided and is in approved list, auto-approve
  if (state && APPROVED_STATES.includes(state.toUpperCase())) {
    console.log('[SERVICE_AREA_PROXY] Auto-approved state:', state);
    return NextResponse.json({
      covered: true,
      state: state.toUpperCase(),
      message: 'Service available in this area'
    });
  }
  
  // Otherwise, use geocoding to determine state from coordinates
  try {
    // Reverse geocode to get state from coordinates
    const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en-US`;
    console.log('[SERVICE_AREA_PROXY] Reverse geocoding:', geocodeUrl);
    
    const geocodeResponse = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'Haulkind/1.0'
      }
    });
    
    if (geocodeResponse.ok) {
      const geocodeData = await geocodeResponse.json();
      const addressState = geocodeData.address?.state;
      
      console.log('[SERVICE_AREA_PROXY] Detected state:', addressState);
      
      // Check if detected state is in approved list
      if (addressState) {
        // Map full state names to abbreviations
        const stateMap: { [key: string]: string } = {
          'New Jersey': 'NJ',
          'Massachusetts': 'MA',
          'Pennsylvania': 'PA',
          'New York': 'NY',
          'Connecticut': 'CT'
        };
        
        const stateAbbr = stateMap[addressState] || addressState;
        
        if (APPROVED_STATES.includes(stateAbbr)) {
          console.log('[SERVICE_AREA_PROXY] Auto-approved by geocoding:', stateAbbr);
          return NextResponse.json({
            covered: true,
            state: stateAbbr,
            message: 'Service available in this area'
          });
        }
      }
    }
  } catch (geocodeError) {
    console.error('[SERVICE_AREA_PROXY] Geocoding failed:', geocodeError);
    // Continue to Railway fallback
  }
  
  // Fallback: Call Railway backend for other states or if geocoding fails
  const url = `${RAILWAY_BASE_URL}/service-areas/lookup?lat=${lat}&lng=${lng}`;
  console.log('[SERVICE_AREA_PROXY] Calling Railway fallback:', url);
  
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

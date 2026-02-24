import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const zip = searchParams.get('zip') || '19103';
  
  const steps: any[] = [];
  
  try {
    // Step 1: Geocode
    steps.push({ step: 1, action: 'geocoding', input: zip });
    
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zip)}&countrycodes=us&limit=1`;
    steps.push({ step: 1.1, url: geocodeUrl });
    
    const geocodeResponse = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'Haulkind/1.0' }
    });
    
    steps.push({
      step: 1.2,
      status: geocodeResponse.status,
      ok: geocodeResponse.ok,
      statusText: geocodeResponse.statusText
    });
    
    if (!geocodeResponse.ok) {
      const errorText = await geocodeResponse.text();
      steps.push({ step: 1.3, error: 'Geocoding HTTP error', body: errorText });
      return NextResponse.json({ success: false, steps }, { status: 500 });
    }
    
    const geocodeData = await geocodeResponse.json();
    steps.push({ step: 1.4, resultCount: geocodeData.length });
    
    if (!geocodeData || geocodeData.length === 0) {
      steps.push({ step: 1.5, error: 'No geocoding results' });
      return NextResponse.json({ success: false, steps }, { status: 404 });
    }
    
    const lat = parseFloat(geocodeData[0].lat);
    const lng = parseFloat(geocodeData[0].lon);
    const formattedAddress = geocodeData[0].display_name;
    
    steps.push({
      step: 1.6,
      geocoded: { lat, lng, formattedAddress }
    });
    
    // Step 2: Check service area
    steps.push({ step: 2, action: 'check_service_area', input: { lat, lng } });
    
    const serviceAreaUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app'}/service-areas/lookup?lat=${lat}&lng=${lng}`;
    steps.push({ step: 2.1, url: serviceAreaUrl });
    
    const serviceAreaResponse = await fetch(serviceAreaUrl, {
      headers: {
        'Origin': 'https://haulkind.com',
        'Content-Type': 'application/json'
      }
    });
    
    steps.push({
      step: 2.2,
      status: serviceAreaResponse.status,
      ok: serviceAreaResponse.ok,
      statusText: serviceAreaResponse.statusText
    });
    
    if (!serviceAreaResponse.ok) {
      const errorText = await serviceAreaResponse.text();
      steps.push({ step: 2.3, error: 'Service area check HTTP error', body: errorText });
      return NextResponse.json({ success: false, steps }, { status: 500 });
    }
    
    const serviceAreaData = await serviceAreaResponse.json();
    steps.push({ step: 2.4, result: serviceAreaData });
    
    return NextResponse.json({
      success: true,
      covered: serviceAreaData.covered,
      serviceArea: serviceAreaData.serviceArea,
      steps
    });
    
  } catch (error: any) {
    steps.push({
      step: 'ERROR',
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({ success: false, steps }, { status: 500 });
  }
}

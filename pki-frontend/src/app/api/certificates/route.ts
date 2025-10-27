import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    console.log('Proxy: Forwarding certificates GET request to backend...');
    
    const backendUrl = `https://localhost:8443/api/certificates${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch certificates', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy: Error forwarding certificates request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();
    
    console.log('Proxy: Forwarding certificates POST request to backend...');
    
    const response = await fetch('https://localhost:8443/api/certificates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create certificate', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy: Error forwarding certificate creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
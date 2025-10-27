import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Proxy: Forwarding login request to backend...');
    
    const response = await fetch('https://localhost:8443/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('Proxy: Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: Backend error:', errorText);
      return NextResponse.json(
        { error: 'Authentication failed', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Proxy: Login successful, returning tokens');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy: Error forwarding request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
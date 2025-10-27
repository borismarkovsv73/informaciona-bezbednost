import { NextRequest, NextResponse } from 'next/server';

// Now using proper SSL verification with PKI certificates!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    console.log('Proxy: Forwarding logout request to backend...');
    
    const response = await fetch('https://localhost:8443/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: Backend error:', errorText);
      return NextResponse.json(
        { error: 'Logout failed', details: errorText },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Proxy: Error forwarding logout request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
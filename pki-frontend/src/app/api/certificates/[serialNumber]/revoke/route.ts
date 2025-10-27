import { NextRequest, NextResponse } from 'next/server';

// Now using proper SSL verification with PKI certificates!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { serialNumber } = await params;
    
    console.log(`Proxy: Forwarding revoke request for certificate ${serialNumber}...`);
    
    const response = await fetch(`https://localhost:8443/api/certificates/${serialNumber}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });
    
    console.log('Proxy: Revoke response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to revoke certificate', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.text(); // Backend returns plain text message
    console.log('Proxy: Certificate revoked successfully');
    
    return NextResponse.json({ message: data || 'Certificate revoked successfully' });
  } catch (error) {
    console.error('Proxy: Error forwarding revoke request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
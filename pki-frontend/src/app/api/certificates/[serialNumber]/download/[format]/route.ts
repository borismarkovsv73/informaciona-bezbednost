import { NextRequest, NextResponse } from 'next/server';

// Now using proper SSL verification with PKI certificates!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serialNumber: string; format: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { serialNumber, format } = await params;
    
    console.log(`Proxy: Forwarding download request for certificate ${serialNumber} in ${format} format...`);
    
    const response = await fetch(`https://localhost:8443/api/certificates/${serialNumber}/download/${format}`, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });
    
    console.log('Proxy: Download response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to download certificate', details: errorText },
        { status: response.status }
      );
    }
    
    // Get the response as a blob for binary data
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    
    // Get the content type from the backend response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="${serialNumber}.${format}"`;
    
    console.log('Proxy: Certificate download successful');
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error('Proxy: Error forwarding download request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
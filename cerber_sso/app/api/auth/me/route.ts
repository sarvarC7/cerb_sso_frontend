import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cerberustechinc.com/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    console.log('Proxying /auth/me request to:', `${API_BASE_URL}/auth/me`);
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    const data = await response.text();
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      console.error('API error response:', data);
      return NextResponse.json(
        { error: 'Failed to get user information', details: data },
        { status: response.status }
      );
    }

    // Parse the response data and return it
    const jsonData = JSON.parse(data);
    return NextResponse.json(jsonData);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
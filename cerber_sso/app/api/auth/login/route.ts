import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cerberustechinc.com/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    console.log('Proxying login request to:', `${API_BASE_URL}/auth/login`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    const data = await response.text();
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      console.error('API error response:', data);
      return NextResponse.json(
        { error: 'Authentication failed', details: data },
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
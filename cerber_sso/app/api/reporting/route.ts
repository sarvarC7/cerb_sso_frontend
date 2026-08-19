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

    // Get query parameters from the original request
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Build the API URL with query parameters
    const apiUrl = new URL(`${API_BASE_URL}/reporting`);
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    console.log('Proxying reporting request to:', apiUrl.toString());
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      console.error('API error response:', data);
      return NextResponse.json(
        { error: 'Failed to get reports', details: data },
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
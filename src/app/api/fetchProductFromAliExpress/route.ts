/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<Response> {
  const host = process.env.NEXT_PUBLIC_RAPID_API_HOST;
  const key = process.env.NEXT_PUBLIC_RAPID_API_KEY;
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID is required.' },
      { status: 400 },
    );
  }

  if (!host || !key) {
    return NextResponse.json(
      { error: 'API host and key are required.' },
      { status: 500 },
    );
  }

  const apiUrl = `https://aliexpress-datahub.p.rapidapi.com/item_detail?itemId=${productId}`;
  const headers = {
    'x-rapidapi-host': host,
    'x-rapidapi-key': key,
  };

  try {
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product details.' },
      { status: 500 },
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  const apiToken = process.env.SENDER_API_TOKEN;
  try {
    const body = await request.json();

    console.log('Request body:', body);

    const response = await fetch('https://api.sender.net/v2/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sender API error:', errorText);
      throw new Error(
        `Failed to fetch audience information: ${response.statusText}`,
      );
    }

    const responseData = await response.json();

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request.' },
      { status: 500 },
    );
  }
}

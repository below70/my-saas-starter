/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.NEXT_PUBLIC_CHATGPT_API_KEY;
  try {
    const body = await request.json();
    const productData = body.productData;

    if (!productData) {
      return NextResponse.json(
        { error: 'Product data is required.' },
        { status: 400 },
      );
    }

    // Extract the first 4 essential fields
    const simplifiedProductData = {
      title: productData.item?.title || '',
      category:
        productData.item?.breadcrumbs?.map(
          (breadcrumb: any) => breadcrumb.title,
        ) || [],
      image: productData.item?.images?.[0] || '',
      price: productData.item?.sku?.def?.price || 'Unknown',
      promotionPrice: productData.item?.sku?.def?.promotionPrice || 'Unknown',
    };

    const chatGptResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'ft:gpt-4o-mini-2024-07-18:personal:target-genie-5:Ahf26gFD',
          messages: [
            {
              role: 'user',
              content: `
                Generate a detailed target audience description and ad strategy for the following product: ${JSON.stringify(
                  simplifiedProductData,
                )}.
                
                
              `,
            },
          ],
          max_tokens: 1000,
        }),
      },
    );

    if (!chatGptResponse.ok) {
      const errorText = await chatGptResponse.text();
      console.error('ChatGPT API error:', errorText);
      throw new Error(
        `Failed to fetch audience information: ${chatGptResponse.statusText}`,
      );
    }

    const chatGptData = await chatGptResponse.json();

    return NextResponse.json(chatGptData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request.' },
      { status: 500 },
    );
  }
}

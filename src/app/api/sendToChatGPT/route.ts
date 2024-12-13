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
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert marketing assistant specializing in creating effective ad targeting strategies for Meta and TikTok. Always format your response clearly and include titles enclosed in double asterisks (e.g., **Title**).',
            },
            {
              role: 'user',
              content: `
                Generate a detailed target audience description and ad strategy for the following product: ${JSON.stringify(
                  simplifiedProductData,
                )}.
                
                Your response should include the following sections, each with a title enclosed in double asterisks (e.g., **Title**):
                - **Ideal Audience Demographics**: Include details like age, gender, location, and income level.
                - **Psychographics**: Include interests, hobbies, and behaviors of the target audience.
                - **Specific Interests and Behaviors on Meta and TikTok**: Provide platform-specific insights.
                - **Suggestions for Ad Content and Tone for TikTok**: Include creative ideas for TikTok ads.
                - **Suggestions for Ad Content and Tone for Meta**: Include creative ideas for Meta ads.
                - **Example Call-to-Action (CTA) Phrases**: Provide suitable CTA phrases for both platforms.
                
                Ensure each section begins with the corresponding title enclosed in double asterisks, followed by the relevant content.
              `,
            },
          ],
          max_tokens: 1000,
          stream: true,
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

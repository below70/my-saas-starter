/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Input, Layout, Typography } from 'antd';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [productResult, setProductResult] = useState<any>(null);
  const [audienceResult, setAudienceResult] = useState<string | null>(null);
  const [loadingFetch, setLoadingFetch] = useState<boolean>(false);
  const [loadingAudience, setLoadingAudience] = useState<boolean>(false);

  const extractProductId = (url: string): string | null => {
    const regex = /item\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchProductInfo = async (productId: string) => {
    try {
      setLoadingFetch(true);
      const response = await fetch(
        `/api/fetchProductFromAliExpress?productId=${productId}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch product information');
      }
      const data = await response.json();
      setProductResult(data.result);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingFetch(false);
    }
  };

  const fetchAudienceInfo = async (productData: any) => {
    try {
      setLoadingAudience(true);
      const response = await fetch('/api/sendToChatGPT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server API error:', errorText);
        throw new Error(
          `Failed to fetch audience information: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log('Audience data:', data);
      setAudienceResult(
        data.choices?.[0]?.message?.content || 'No audience data returned.',
      );
    } catch (error: any) {
      console.error('Error:', error.message);
      alert(error.message);
    } finally {
      setLoadingAudience(false);
    }
  };

  const handleGetInfo = async (): Promise<void> => {
    if (!url) {
      alert('Please enter an AliExpress product URL.');
      return;
    }

    const productId = extractProductId(url);

    if (!productId) {
      alert('Invalid URL. Please enter a valid AliExpress product URL.');
      return;
    }

    await fetchProductInfo(productId);
  };

  const handleGenerateAudience = async (): Promise<void> => {
    if (!productResult) {
      alert('Please get the product info first.');
      return;
    }

    await fetchAudienceInfo(productResult);
  };

  interface ParsedData {
    [key: string]: string[];
  }

  const parseDynamicData = (data: string): ParsedData => {
    const regex = /\*\*(.*?)\*\*([\s\S]*?)(?=\*\*|$)/g;
    const result: ParsedData = {};
    let match: RegExpExecArray | null;

    while ((match = regex.exec(data)) !== null) {
      const title = match[1].trim();
      const details = match[2].trim();
      result[title] = details
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => line.trim());
    }

    return result;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor: '#001529', padding: '0 20px' }}>
        <Title style={{ color: '#fff', margin: 0 }} level={3}>
          AliExpress Audience Tool
        </Title>
      </Header>
      <Content style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={2}>Generate Your Target Audience</Title>
        <Paragraph>
          Paste the AliExpress product URL below and click &quot;Get Info&quot;
          to generate a target audience for your ads on Meta and TikTok.
        </Paragraph>
        <Input
          placeholder="Paste your AliExpress product URL here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '50%', marginBottom: '20px' }}
        />
        <br />
        <button
          onClick={handleGetInfo}
          disabled={loadingFetch}
          style={{
            backgroundColor: '#1890ff',
            color: '#fff',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px',
          }}>
          {loadingFetch ? 'Getting Info' : 'Get Info'}
        </button>

        {productResult && (
          <div style={{ marginTop: '30px', textAlign: 'left' }}>
            <Title level={4}>Product Details:</Title>
            <Paragraph>
              <b>Title:</b> {productResult.item?.title}
            </Paragraph>
            <Paragraph>
              <b>Price:</b> {productResult.item?.sku?.def?.price}
            </Paragraph>
            <Paragraph>
              <b>Promotion Price:</b>{' '}
              {productResult.item?.sku?.def?.promotionPrice}
            </Paragraph>
            <button
              onClick={handleGenerateAudience}
              disabled={loadingAudience}
              style={{
                backgroundColor: '#1890ff',
                color: '#fff',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px',
              }}>
              {loadingAudience
                ? 'Generating Audience Info...'
                : 'Generate Audience Info'}
            </button>
          </div>
        )}

        {audienceResult && (
          <div
            style={{
              marginTop: '30px',
              textAlign: 'left',
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            }}>
            <Title level={4}>Audience Insights</Title>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '20px',
              }}>
              <tbody>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                    }}>
                    Category
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                    }}>
                    Details
                  </th>
                </tr>
                {Object.entries(parseDynamicData(audienceResult)).map(
                  ([title, details]) => (
                    <tr key={title}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <b>{title}</b>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {details.map((detail, index) => (
                          <p
                            key={index}
                            style={{ margin: 0, padding: '0 0 5px 0' }}>
                            {detail}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Designed By{' '}
        <a href="https://klikdex.com" target="_blank" rel="noopener noreferrer">
          Klikdex Digital Agency
        </a>
      </Footer>
    </Layout>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Card, Col, Input, Layout, Row, Space, Table, Typography } from 'antd';

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
      // Remove colons from the title
      const title = match[1].trim().replace(/:$/, '');
      // Split details into rows, removing unwanted characters
      const details = match[2]
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map(
          (line) => line.trim().replace(/^[:,\-\s]+/, ''), // Remove leading ':', '-', or whitespace
        )
        .join('\n'); // Join details with a newline character for rows
      result[title] = [details];
    }

    return result;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor: '#001529', padding: '20px' }}>
        <Title style={{ color: '#fff', margin: 0 }} level={3}>
          AliExpress Audience Tool
        </Title>
      </Header>

      <Content style={{ padding: '50px' }}>
        <Row justify="center">
          <Col xs={24} sm={18} md={16} lg={12}>
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
              <Title level={2} style={{ textAlign: 'center' }}>
                Generate Your Target Audience
              </Title>
              <Paragraph style={{ textAlign: 'center' }}>
                Paste the AliExpress product URL below and click &quot;Get
                Info&quot; to generate a target audience for your ads on Meta
                and TikTok.
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="Paste your AliExpress product URL here"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ borderRadius: '4px' }}
                />
                <button
                  onClick={handleGetInfo}
                  disabled={loadingFetch}
                  style={{
                    borderRadius: '4px',
                    backgroundColor: '#1890ff',
                    color: '#fff',
                    padding: '10px 16px',
                    border: 'none',
                    cursor: loadingFetch ? 'not-allowed' : 'pointer',
                    width: '100%',
                  }}>
                  {loadingFetch ? 'Getting Info' : 'Get Info'}
                </button>
              </Space>

              {productResult && (
                <Card
                  style={{
                    marginTop: '20px',
                    borderRadius: '8px',
                    backgroundColor: '#f6f6f6',
                  }}>
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
                      marginTop: '10px',
                      borderRadius: '4px',
                      backgroundColor: '#1890ff',
                      color: '#fff',
                      padding: '10px 16px',
                      border: 'none',
                      cursor: loadingAudience ? 'not-allowed' : 'pointer',
                      width: '100%',
                    }}>
                    {loadingAudience
                      ? 'Generating Audience Info...'
                      : 'Generate Audience Info'}
                  </button>
                </Card>
              )}

              {audienceResult && (
                <Card
                  style={{
                    marginTop: '20px',
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9',
                  }}>
                  <Title level={4}>Audience Insights</Title>
                  <Table
                    dataSource={Object.entries(
                      parseDynamicData(audienceResult),
                    ).map(([key, value]) => ({
                      key,
                      category: key,
                      details: value.join(', '),
                    }))}
                    columns={[
                      {
                        title: 'Category',
                        dataIndex: 'category',
                        key: 'category',
                        render: (text) => (
                          <span style={{ fontSize: '12px' }}>{text}</span>
                        ),
                      },
                      {
                        title: 'Details',
                        dataIndex: 'details',
                        key: 'details',
                      },
                    ]}
                    pagination={false}
                    bordered
                    style={{ fontSize: '12px' }}
                  />
                </Card>
              )}
            </Card>
          </Col>
        </Row>
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

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import {
  Card,
  Col,
  Input,
  Layout,
  Row,
  Space,
  Table,
  Typography,
  Modal,
} from 'antd';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [productResult, setProductResult] = useState<any>(null);
  const [audienceResult, setAudienceResult] = useState<string | null>(null);
  const [loadingFetch, setLoadingFetch] = useState<boolean>(false);
  const [loadingAudience, setLoadingAudience] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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

  const handleSubscribe = async (): Promise<void> => {
    try {
      if (!phone) {
        alert('Please enter your phone number.');
        return;
      }
      if (!email) {
        alert('Please enter your email.');
        return;
      }
      const phoneWithCountryCodeRegex = /^\+\d{1,4}\d{9,14}$/;
      if (!phoneWithCountryCodeRegex.test(phone)) {
        alert(
          'Please enter a valid phone number with the country code (e.g., +1234567890).',
        );
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe.');
      }

      alert('Successfully subscribed!');
      setEmail('');
      setPhone('');

      setModalVisible(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const showSubscribeModal = (): void => {
    setModalVisible(true);
  };

  const handleModalCancel = (): void => {
    setModalVisible(false);
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
      <Header
        style={{
          backgroundColor: '#001529', // Ant Design primary color
          padding: '12px 16px',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)', // Subtle shadow at the top
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center',
          zIndex: 1000,
        }}>
        <Row align="middle" justify="center">
          <Title
            level={3}
            style={{
              color: '#ffffff', // White text for contrast
              margin: 0,
              fontSize: '16px', // Default font size for mobile
            }}>
            AliExpress Target Audience Generator
          </Title>
          <Text
            style={{
              color: '#ffffff', // White text for contrast
              marginLeft: 10,
              fontSize: '16px', // Default font size for mobile
            }}>
            By{' '}
            <a
              href="https://klikdex.com"
              target="_blank"
              rel="noopener noreferrer">
              Klikdex Digital Agency
            </a>
          </Text>
        </Row>
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
                  {loadingFetch ? 'Getting Info...' : 'Get Info'}
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
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      style={{
                        marginTop: '10px',
                        borderRadius: '4px',
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        padding: '10px 16px',
                        border: 'none',
                        cursor: loadingAudience ? 'not-allowed' : 'pointer',
                        width: '100%',
                      }}
                      onClick={showSubscribeModal}>
                      Subscribe to See More
                    </button>
                  </div>
                </Card>
              )}
            </Card>
          </Col>
        </Row>

        <Modal
          title="Subscribe for Better Results"
          open={modalVisible}
          onOk={handleSubscribe}
          onCancel={handleModalCancel}>
          <Input
            placeholder="Enter your Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <Input
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Modal>
      </Content>
    </Layout>
  );
}

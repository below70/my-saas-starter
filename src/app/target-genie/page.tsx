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
import { parseStrategies } from '@/utils';
import { ColumnsType } from 'antd/es/table';

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

  const detailsColumns: ColumnsType<{ detail: string }> = [
    {
      title: 'Details',
      dataIndex: 'detail',
      key: 'detail',
      render: (text) => <span style={{ fontSize: '14px' }}>{text}</span>,
    },
  ];

  // Columns for the "Key Tactics" table
  const tacticsColumns: ColumnsType<{ tactic: string }> = [
    {
      title: 'Key Tactics',
      dataIndex: 'tactic',
      key: 'tactic',
      render: (text) => <span style={{ fontSize: '14px' }}>{text}</span>,
    },
  ];

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

  const { strategies, additionalMetaDetails, additionalTikTokDetails } =
    parseStrategies(audienceResult || '');

  console.log('strategies:', strategies);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <Header
        style={{
          background: 'linear-gradient(90deg, #001529 0%, #004080 100%)',
          padding: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
        <Row align="middle" justify="center">
          <Title
            level={3}
            style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
            }}>
            AliExpress Target Audience Generator
          </Title>
          <Text
            style={{
              color: '#ffffff',
              marginLeft: '10px',
              fontSize: '14px',
              fontStyle: 'italic',
            }}>
            By{' '}
            <a
              href="https://klikdex.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#f0f0f0', textDecoration: 'underline' }}>
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
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
              }}>
              <Title
                level={2}
                style={{ textAlign: 'center', fontWeight: '700' }}>
                Generate Your Target Audience
              </Title>
              <Paragraph style={{ textAlign: 'center', color: '#555' }}>
                Paste the AliExpress product URL below and click &quot;Get
                Info&quot; to generate a target audience for your ads on Meta
                and TikTok.
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="Paste your AliExpress product URL here"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #d9d9d9',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <button
                  onClick={handleGetInfo}
                  disabled={loadingFetch}
                  style={{
                    borderRadius: '8px',
                    background:
                      'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
                    color: '#fff',
                    padding: '12px 16px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: loadingFetch ? 'not-allowed' : 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease',
                  }}>
                  {loadingFetch ? 'Getting Info...' : 'Get Info'}
                </button>
              </Space>

              {productResult && (
                <Card
                  style={{
                    marginTop: '20px',
                    borderRadius: '12px',
                    background: '#f6f6f6',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}>
                  <Title level={4} style={{ color: '#333' }}>
                    Product Details:
                  </Title>
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
                      borderRadius: '8px',
                      background:
                        'linear-gradient(90deg, #52c41a 0%, #73d13d 100%)',
                      color: '#fff',
                      padding: '12px 16px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: loadingAudience ? 'not-allowed' : 'pointer',
                      width: '100%',
                      transition: 'all 0.3s ease',
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
                    borderRadius: '12px',
                    background: '#f9f9f9',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}>
                  <Title level={4} style={{ color: '#333' }}>
                    Audience Insights
                  </Title>

                  <div>
                    {/* Loop over each strategy */}
                    {strategies.map((strategy) => (
                      <div
                        key={strategy.strategyName}
                        style={{ marginBottom: '3rem' }}>
                        <h3
                          style={{ fontSize: '18px', marginBottom: '0.5rem' }}>
                          {strategy.strategyName} {strategy.title}
                        </h3>

                        {/* Details Table */}
                        {!!strategy.details.length && (
                          <div style={{ marginBottom: '1.5rem' }}>
                            <Table
                              dataSource={strategy.details.map((d, index) => ({
                                key: index,
                                detail: d,
                              }))}
                              columns={detailsColumns}
                              pagination={false}
                              bordered
                              size="small"
                            />
                          </div>
                        )}

                        {/* Key Tactics Table */}
                        {!!strategy.keyTactics.length && (
                          <div>
                            <Table
                              dataSource={strategy.keyTactics.map(
                                (t, index) => ({
                                  key: index,
                                  tactic: t,
                                }),
                              )}
                              columns={tacticsColumns}
                              pagination={false}
                              bordered
                              size="small"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Additional Meta Details */}
                    {additionalMetaDetails.length > 0 && (
                      <div style={{ marginBottom: '2rem' }}>
                        <h3
                          style={{ fontSize: '18px', marginBottom: '0.5rem' }}>
                          Additional Meta
                        </h3>
                        <Table
                          dataSource={additionalMetaDetails.map((m, index) => ({
                            key: index,
                            detail: m,
                          }))}
                          columns={detailsColumns}
                          pagination={false}
                          bordered
                          size="small"
                        />
                      </div>
                    )}

                    {/* Additional TikTok Details */}
                    {additionalTikTokDetails.length > 0 && (
                      <div style={{ marginBottom: '2rem' }}>
                        <h3
                          style={{ fontSize: '18px', marginBottom: '0.5rem' }}>
                          Additional TikTok
                        </h3>
                        <Table
                          dataSource={additionalTikTokDetails.map(
                            (t, index) => ({
                              key: index,
                              detail: t,
                            }),
                          )}
                          columns={detailsColumns}
                          pagination={false}
                          bordered
                          size="small"
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      style={{
                        marginTop: '10px',
                        borderRadius: '8px',
                        background:
                          'linear-gradient(90deg, #fa541c 0%, #ff7a45 100%)',
                        color: '#fff',
                        padding: '12px 16px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.3s ease',
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
          onCancel={handleModalCancel}
          centered>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Enter your Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
              }}
            />
            <Input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
              }}
            />
          </Space>
        </Modal>
      </Content>
    </Layout>
  );
}

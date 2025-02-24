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
  Typography,
  Modal,
  message,
} from 'antd';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface Strategy {
  strategy: string;
  title: string;
  demographics: {
    label: string;
    value: string;
  }[];
  tactics: string[];
}

interface AdditionalDetails {
  isAdditional: true;
  meta: string[];
  tiktok: string[];
}

type ParsedStrategy = Strategy | AdditionalDetails;

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Failed to fetch product information',
        );
      }
      const data = await response.json();
      setProductResult(data.result);
    } catch (error: any) {
      message.error(error.message);
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

  const parseDynamicData = (data: string): ParsedStrategy[] => {
    const strategies = data.split('---').filter(Boolean);
    const parsedStrategies = strategies
      .map((strategy) => {
        const strategyMatch = strategy.match(/\*\*Strategy \d+\*\*/);
        if (!strategyMatch) return null;

        const titleMatch = strategy.match(/\*\*Title\*\*: (.*?)(?=\n)/);
        const demographicsMatches =
          strategy.match(/\*\*(.*?)\*\*: (.*?)(?=\n|$)/g) || [];
        const tacticsSection = strategy.match(
          /\*\*Key Tactics\*\*:([\s\S]*?)(?=\*\*Additional|$)/,
        );

        const demographics = demographicsMatches.map((match) => {
          const [_, label, value] = match.match(/\*\*(.*?)\*\*: (.*)/) || [];
          return { label, value };
        });

        const tactics = tacticsSection
          ? tacticsSection[1]
              .split('\n')
              .filter(Boolean)
              .map((line) => line.replace(/^-\s*/, ''))
          : [];

        return {
          strategy: strategyMatch[0].replace(/\*\*/g, ''),
          title: titleMatch ? titleMatch[1].trim() : '',
          demographics,
          tactics,
        };
      })
      .filter(Boolean);

    const additionalMetaMatch = data.match(
      /### Additional Meta Details:([\s\S]*?)(?=###|$)/,
    );
    const additionalTikTokMatch = data.match(
      /### Additional TikTok Details:([\s\S]*?)(?=###|$)/,
    );

    if (additionalMetaMatch || additionalTikTokMatch) {
      const additionalDetails = {
        isAdditional: true,
        meta: additionalMetaMatch
          ? additionalMetaMatch[1]
              .split('\n')
              .filter(Boolean)
              .map((line) => line.replace(/^-\s*/, ''))
          : [],
        tiktok: additionalTikTokMatch
          ? additionalTikTokMatch[1]
              .split('\n')
              .filter(Boolean)
              .map((line) => line.replace(/^-\s*/, ''))
          : [],
      };

      parsedStrategies.push(additionalDetails);
    }

    return parsedStrategies;
  };

  console.log('productResult:', audienceResult);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #003a75 100%)',
          padding: '16px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          textAlign: 'center',
          zIndex: 1000,
          position: 'sticky',
          top: 0,
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

      <Content
        style={{
          padding: '50px 20px',
          background: 'linear-gradient(135deg, #f6f8fa 0%, #f0f2f5 100%)',
          minHeight: 'calc(100vh - 64px)',
        }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={18} lg={14}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0, 21, 41, 0.07)',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}>
              <Title
                level={2}
                style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  background:
                    'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
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
                  style={{
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e8e8e8',
                    transition: 'all 0.3s ease',
                  }}
                />
                <button
                  onClick={handleGetInfo}
                  disabled={loadingFetch}
                  style={{
                    borderRadius: '8px',
                    background:
                      'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    color: '#fff',
                    padding: '12px 24px',
                    border: 'none',
                    cursor: loadingFetch ? 'not-allowed' : 'pointer',
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0)',
                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.2)',
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(24, 144, 255, 0.3)',
                    },
                  }}>
                  {loadingFetch ? 'Getting Info...' : 'Get Info'}
                </button>
              </Space>

              {productResult && (
                <Card
                  style={{
                    marginTop: '24px',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
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
                    marginTop: '24px',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                  }}>
                  <Title level={4}>Marketing Strategies</Title>
                  {parseDynamicData(audienceResult).map((strategy, index) => (
                    <Card
                      key={index}
                      style={{
                        marginBottom: '20px',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                        animation: 'fadeIn 0.5s ease-out',
                        animationFillMode: 'backwards',
                        animationDelay: `${index * 0.1}s`,
                      }}>
                      <div
                        style={{
                          background:
                            'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                          margin: '-24px',
                          marginBottom: '16px',
                          padding: '20px 24px',
                          borderTopLeftRadius: '12px',
                          borderTopRightRadius: '12px',
                        }}>
                        <Text strong style={{ fontSize: '16px' }}>
                          {strategy.strategy}
                        </Text>
                        <br />
                        <Text type="secondary">{strategy.title}</Text>
                      </div>

                      {strategy.demographics && (
                        <div style={{ marginBottom: '20px' }}>
                          <Text
                            strong
                            style={{
                              fontSize: '14px',
                              color: '#1890ff',
                              display: 'block',
                              marginBottom: '8px',
                            }}>
                            Demographics
                          </Text>
                          <ul
                            style={{
                              listStyle: 'none',
                              padding: 0,
                              margin: 0,
                            }}>
                            {strategy.demographics.map((item, idx) => (
                              <li
                                key={idx}
                                style={{
                                  padding: '8px 12px',
                                  marginBottom: '8px',
                                  backgroundColor: 'white',
                                  borderRadius: '4px',
                                  border: '1px solid #f0f0f0',
                                }}>
                                <b>{item.label}:</b> {item.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {strategy.tactics && (
                        <div>
                          <Text
                            strong
                            style={{
                              fontSize: '14px',
                              color: '#1890ff',
                              display: 'block',
                              marginBottom: '8px',
                            }}>
                            Key Tactics
                          </Text>
                          <ul
                            style={{
                              listStyle: 'none',
                              padding: 0,
                              margin: 0,
                            }}>
                            {strategy.tactics.map((tactic, idx) => (
                              <li
                                key={idx}
                                style={{
                                  padding: '8px 12px',
                                  marginBottom: '8px',
                                  backgroundColor: 'white',
                                  borderRadius: '4px',
                                  border: '1px solid #f0f0f0',
                                }}>
                                {tactic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      style={{
                        marginTop: '10px',
                        borderRadius: '4px',
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        padding: '10px 16px',
                        border: 'none',
                        cursor: 'pointer',
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
          title={
            <div
              style={{
                textAlign: 'center',
                color: '#1890ff',
                fontSize: '24px',
                fontWeight: 600,
              }}>
              Subscribe for Better Results
            </div>
          }
          open={modalVisible}
          onOk={handleSubscribe}
          onCancel={handleModalCancel}
          okText="Subscribe"
          cancelText="Cancel"
          style={{ top: 20 }}
          styles={{
            body: { padding: '24px' },
          }}
          okButtonProps={{
            style: {
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              borderRadius: '6px',
            },
          }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Enter your phone number (e.g., +1234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </Space>
        </Modal>
      </Content>
    </Layout>
  );
}

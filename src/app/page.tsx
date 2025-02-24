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

type ParsedStrategy =
  | Strategy
  | { isAdditional: boolean; meta: string[]; tiktok: string[] };

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
          const [, label, value] = match.match(/\*\*(.*?)\*\*: (.*)/) || [];
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

      parsedStrategies.push(additionalDetails as any);
    }

    return parsedStrategies as any;
  };

  console.log('productResult:', audienceResult);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #003a75 100%)',
          padding: '16px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>
        <Row align="middle" justify="center" gutter={16}>
          <Col>
            <Title
              level={3}
              style={{
                color: '#ffffff',
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
              }}>
              AliExpress Target Audience Generator
            </Title>
          </Col>
          <Col>
            <Text
              style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>
              By{' '}
              <a
                href="https://klikdex.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1890ff', fontWeight: 500 }}>
                Klikdex Digital Agency
              </a>
            </Text>
          </Col>
        </Row>
      </Header>

      <Content
        className="glass-effect"
        style={{
          padding: '50px 20px',
          background: 'linear-gradient(135deg, #f6f8fa 0%, #f0f2f5 100%)',
          minHeight: 'calc(100vh - 64px)',
        }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={18} lg={14}>
            <Card
              className="hover-card glass-effect"
              style={{
                borderRadius: '16px',
                border: 'none',
              }}>
              <Title
                level={2}
                className="gradient-text"
                style={{ textAlign: 'center', marginBottom: '24px' }}>
                Generate Your Target Audience
              </Title>
              <Paragraph style={{ textAlign: 'center' }}>
                Paste the AliExpress product URL below and click &quot;Get
                Info&quot; to generate a target audience for your ads on Meta
                and TikTok.
              </Paragraph>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  className="custom-input"
                  placeholder="Paste your AliExpress product URL here"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
                <button
                  onClick={handleGetInfo}
                  disabled={loadingFetch}
                  className="gradient-button"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginTop: '16px',
                    color: '#fff',
                  }}>
                  {loadingFetch ? 'Getting Info...' : 'Get Info'}
                </button>
              </Space>

              {productResult && (
                <Card
                  className="hover-card card-enter card-enter-active"
                  style={{
                    marginTop: '24px',
                    borderRadius: '12px',
                    border: 'none',
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
                  className="hover-card card-enter card-enter-active"
                  style={{
                    marginTop: '24px',
                    borderRadius: '12px',
                    border: 'none',
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
                          {'strategy' in strategy ? strategy.strategy : ''}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {'title' in strategy ? strategy.title : ''}
                        </Text>
                      </div>

                      {'demographics' in strategy && (
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

                      {'tactics' in strategy && (
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
              className="gradient-text"
              style={{
                textAlign: 'center',
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
          className="custom-modal"
          styles={{
            body: { padding: '32px' },
            mask: { backdropFilter: 'blur(4px)' },
            content: {
              borderRadius: '16px',
              overflow: 'hidden',
            },
          }}
          okButtonProps={{
            className: 'gradient-button',
            style: {
              borderRadius: '6px',
              height: '40px',
              fontWeight: 600,
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

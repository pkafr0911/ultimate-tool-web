import { pages } from '@/consants';
import { Button, Card, Col, Row, Typography } from 'antd';
import React from 'react';
import { history } from 'umi';
import './styles.less';

const { Title, Paragraph } = Typography;

const categories = [
  {
    title: 'Utility Tools',
    keys: [
      'QR Generator',
      'Video Watch',
      'Epoch Converter',
      'Regex Tester',
      'UUID Generator',
      'Password Generator',
      'JWT Encrypt/Decrypt',
      'Color Picker',
    ],
  },
  {
    title: 'Image Converter',
    keys: ['SVG Viewer', 'PNG / JPEG Converter', 'Image Base64 Converter', 'Text Art Generator'],
  },
  { title: 'Editor', keys: ['Readme Editor', 'Json Formatter', 'HTML Editor'] },
  { title: 'Randomizer', keys: ['🎡 Wheel of Names', 'Random Generator'] },
  { title: 'Playground', keys: ['Playground'] },
  { title: 'Game', keys: ['Tic-Tac-Toe', 'snake-xenzia'] },
  { title: 'Docs / Commands', keys: ['Commands', 'Emojis /  Kaomojis '] },
];

const WelcomePage: React.FC = () => {
  return (
    <div className="welcome-container">
      <Title level={2} className="welcome-title">
        Ultimate Tools & Utilities
      </Title>
      <Paragraph className="welcome-subtitle">
        Explore our tools and features. Click on any card to get started!
      </Paragraph>

      {categories.map((category) => {
        const items = pages.filter((p) => category.keys.includes(p.name));
        return (
          <div key={category.title} className="category-section">
            <Title level={3} className="category-title">
              {category.title}
            </Title>
            <Row gutter={[16, 16]}>
              {items.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.name}>
                  <Card hoverable className="feature-card" onClick={() => history.push(item.path)}>
                    <div className="feature-icon">{item.icon}</div>
                    <Title level={5}>{item.name}</Title>
                    <Paragraph className="feature-desc">{item.desc}</Paragraph>
                    <Button type="primary" block>
                      Go
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      })}
    </div>
  );
};

export default WelcomePage;

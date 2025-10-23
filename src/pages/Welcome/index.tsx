import { pages } from '@/consants';
import { Button, Card, Col, Row, Typography } from 'antd';
import { motion } from 'framer-motion';
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
  { title: 'Game', keys: ['Tic-Tac-Toe', 'Snake xenzia', 'Minesweeper', 'Sudoku', 'Chess'] },
  { title: 'Docs / Commands', keys: ['Commands', 'Emojis /  Kaomojis '] },
];

const WelcomePage: React.FC = () => {
  return (
    <motion.div
      className="welcome-container light-theme"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header Section */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Title level={2} className="welcome-title">
          🌤️ Ultimate Tools & Utilities
        </Title>
        <Paragraph className="welcome-subtitle">
          Explore our tools and features. Click on any card to get started!
        </Paragraph>
      </motion.div>

      {/* Categories */}
      {categories.map((category, i) => {
        const items = pages.filter((p) => category.keys.includes(p.name));
        return (
          <motion.div
            key={category.title}
            className="category-section"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <motion.div
              className="category-header"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Title level={3} className="category-title">
                {category.title}
              </Title>
            </motion.div>

            <Row gutter={[16, 16]}>
              {items.map((item, idx) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.name}>
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                  >
                    <Card
                      hoverable
                      className="feature-card light-card"
                      onClick={() => history.push(item.path)}
                    >
                      <div className="feature-icon">{item.icon}</div>
                      <Title level={5}>{item.name}</Title>
                      <Paragraph className="feature-desc">{item.desc}</Paragraph>
                      <Button type="primary" block>
                        Go
                      </Button>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default WelcomePage;

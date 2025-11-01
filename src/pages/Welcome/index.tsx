import { pages } from '@/consants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button, Card, Col, Row, Typography } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';
import './styles.less';

const { Title, Paragraph } = Typography;

const categories = [
  { title: 'Playground', keys: ['Playground'] },
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
  { title: 'Game', keys: ['Tic-Tac-Toe', 'Snake xenzia', 'Minesweeper', 'Sudoku', 'Chess'] },
  { title: 'Docs / Commands', keys: ['Commands', 'Emojis /  Kaomojis '] },
];

const phrases = [
  'Too many tabs. Too many tools.',
  'Generate, convert, and format — without switching windows.',
  'All your favorite tools, in one place.',
  'Play, build, and test smarter.',
  'Ultimate Tools. Zero friction.',
];

const WelcomePage: React.FC = () => {
  const isMobile = useIsMobile(); // Check in using Mobile
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="welcome-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Hero Section */}
      <motion.div
        className="hero-section"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Animated Background Blobs */}
        <div className="blob-container">
          <div className="blob blob1" />
          <div className="blob blob2" />
          <div className="blob blob3" />
        </div>

        {/* Hero Text */}
        <Title level={1} className="hero-title">
          🌤️ Ultimate Tools & Utilities
        </Title>

        <div className="hero-phrase-container">
          <AnimatePresence mode="wait">
            <motion.p
              key={phrases[index]}
              className="hero-phrase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              {phrases[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <Paragraph className="hero-subtitle">
          A single place for converters, editors, generators, and playgrounds — made for speed and
          simplicity.
        </Paragraph>
      </motion.div>

      {/* Categories */}
      <div className="categories-container">
        {categories.map((category, i) => {
          const items = pages.filter((p) => category.keys.includes(p.name));

          // Special design for Playground
          if (category.title === 'Playground') {
            return (
              <motion.div
                key="playground-section"
                className="playground-section"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="playground-header">
                  <Title level={2} className="playground-title">
                    🚀 Playground
                  </Title>
                  <Paragraph className="playground-subtitle">
                    Experiment, code, and create — directly in your browser.
                  </Paragraph>
                </div>

                <motion.div
                  className="playground-cards"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.15 }}
                >
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.name}
                      className="playground-card"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{ scale: 1.03, rotate: 1 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 10 }}
                    >
                      <Card
                        hoverable
                        bordered={false}
                        className="playground-card-inner"
                        onClick={() => history.push(item.path)}
                      >
                        <div className="playground-icon">{item.icon}</div>
                        <Title level={4}>{item.name}</Title>
                        <Paragraph className="playground-desc">{item.desc}</Paragraph>
                        <Button type="primary" ghost>
                          Open Playground
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            );
          }

          // Default category render
          return (
            <motion.div
              key={category.title}
              className="category-section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Title level={3} className="category-title">
                {category.title}
              </Title>

              <Row gutter={[24, 24]}>
                {items.map((item, idx) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={item.name}>
                    <motion.div
                      className="feature-card-wrapper"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * idx, duration: 0.5 }}
                    >
                      <Card
                        hoverable
                        className="feature-card"
                        onClick={() => history.push(item.path)}
                      >
                        <div className="feature-icon">{item.icon}</div>
                        <Title level={5}>{item.name}</Title>
                        <Paragraph className="feature-desc">{item.desc}</Paragraph>
                        <Button type="primary" block ghost>
                          Explore
                        </Button>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WelcomePage;

import { pages } from '@/consants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button, Card, Carousel, Col, Row, Typography } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';
import './styles.less';

const { Title, Paragraph } = Typography;

const categories = [
  {
    title: 'Playground',
    keys: ['Playground'],
    desc: 'Experiment, code, and create — directly in your browser.',
  },
  {
    title: 'Utility Tools',
    keys: [
      'QR Generator',
      'Password Generator',
      'UUID Generator',
      'Color Picker',
      'Regex Tester',
      'JWT Encrypt/Decrypt',
      'Epoch Converter',
      'Video Analyzer',
    ],
    desc: 'From quick conversions to encryption — everything you need for everyday dev work.',
  },
  {
    title: 'Image Converter',
    keys: [
      'Pics Editor',
      'SVG Viewer',
      'Image Base64 Converter',
      'Text Art Generator',
      'Image To Text',
    ],
    desc: 'Convert, preview, and transform your images with a click.',
  },
  {
    title: 'Editor',
    keys: ['Json Formatter', 'Readme Editor', 'HTML Editor'],
    desc: 'Edit JSON, Markdown, or HTML instantly with built-in formatters.',
  },
  {
    title: 'Randomizer',
    keys: ['🎡 Wheel of Names', 'Random Generator'],
    desc: 'Spin, randomize, and pick — perfect for quick ideas and fun experiments.',
  },
  {
    title: 'Game',
    keys: ['Chess', 'Sudoku', 'Tic-Tac-Toe', 'Minesweeper', 'Snake xenzia'],
    desc: 'Relax and recharge with built-in classic games.',
  },
  {
    title: 'Docs / Commands',
    keys: ['Commands', 'Emojis /  Kaomojis '],
    desc: 'Quick access to useful documentation and expressive emoji tools.',
  },
];

const phrases = [
  'Too many tabs. Too many tools.',
  'Generate, convert, and format — without switching windows.',
  'All your favorite tools, in one place.',
  'Play, build, and test smarter.',
  'Ultimate Tools. Zero friction.',
];

const WelcomePage: React.FC = () => {
  const isMobile = useIsMobile();
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
      {/* 💡 Feature / Category Sections */}
      <div className="story-sections">
        {categories.map((category, i) => {
          const items = pages.filter((p) => category.keys.includes(p.name));
          const isReverse = i % 2 !== 0; // Alternate layout

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
                        variant={'borderless'}
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
          return (
            <motion.section
              key={category.title}
              className={`story-section ${isReverse ? 'reverse' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Row gutter={[48, 48]} align="middle">
                <Col xs={24} md={12}>
                  <div className="story-text">
                    <Title level={2}>{category.title}</Title>
                    <Paragraph className="story-desc">{category.desc}</Paragraph>
                    <div className="story-buttons">
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => history.push(items[0]?.path)}
                      >
                        Explore {category.title}
                      </Button>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <motion.div
                    className="story-preview"
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {/* ✅ If more than 4 items → Carousel */}
                    {items.length > 4 ? (
                      <Carousel
                        autoplay
                        // autoplaySpeed={5000}
                        dots
                        draggable
                        swipeToSlide
                        arrows
                        infinite
                        adaptiveHeight
                        className="story-carousel"
                      >
                        {Array.from({ length: Math.ceil(items.length / 4) }).map((_, pageIndex) => {
                          const pageItems = items.slice(pageIndex * 4, pageIndex * 4 + 4);
                          return (
                            <div key={`page-${pageIndex}`}>
                              <Row gutter={[16, 16]}>
                                {pageItems.map((item) => (
                                  <Col xs={12} key={item.name}>
                                    <Card
                                      hoverable
                                      className="story-card"
                                      onClick={() => history.push(item.path)}
                                    >
                                      <div className="story-icon">{item.icon}</div>
                                      <Title className="story-name" level={5}>
                                        {item.name}
                                      </Title>
                                      {!isMobile && (
                                        <Paragraph className="story-card-desc">
                                          {item.desc}
                                        </Paragraph>
                                      )}
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          );
                        })}
                      </Carousel>
                    ) : (
                      // ✅ Normal layout if <= 4 items
                      <Row gutter={[16, 16]}>
                        {items.map((item) => (
                          <Col xs={12} key={item.name}>
                            <Card
                              hoverable
                              className="story-card"
                              onClick={() => history.push(item.path)}
                            >
                              <div className="story-icon">{item.icon}</div>
                              <Title className="story-name" level={5}>
                                {item.name}
                              </Title>
                              {!isMobile && (
                                <Paragraph className="story-card-desc">{item.desc}</Paragraph>
                              )}
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </motion.div>
                </Col>
              </Row>
            </motion.section>
          );
        })}
      </div>

      {/* 🗣️ Testimonial Footer */}
      <motion.div
        className="testimonial-section"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <blockquote>
          “All your essential tools, beautifully organized. It’s like having a digital Swiss Army
          knife — without the clutter”
        </blockquote>
        <div className="author">
          <strong>Thanh Nguyen</strong>
          <span>Developer & Creator of Ultimate Tools</span>
          <div>{`t ko nói thế =))`}</div>
        </div>
      </motion.div>

      {/* 🌤️ Hero Section */}
      <motion.div
        className="hero-section"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="blob-container">
          <div className="blob blob1" />
          <div className="blob blob2" />
          <div className="blob blob3" />
        </div>

        <Title level={1} className="hero-title gradient-text">
          Ultimate Tools & Utilities
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
    </motion.div>
  );
};

export default WelcomePage;

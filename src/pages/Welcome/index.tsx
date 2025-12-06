import { pages } from '@/consants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button, Typography } from 'antd';
import { TargetAndTransition, Transition, VariantLabels, motion } from 'framer-motion';
import React from 'react';
import { history } from 'umi';
import './styles.less';

const { Title, Paragraph, Text } = Typography;

interface HeroVisualConfig {
  key: string;
  className: string;
  initial: boolean | TargetAndTransition | VariantLabels;
  animate: boolean | TargetAndTransition | VariantLabels;
  transition: Transition;
  whileHover: TargetAndTransition | VariantLabels;
  iconAnimate: TargetAndTransition | VariantLabels;
  iconTransition: Transition;
}

const heroVisuals: HeroVisualConfig[] = [
  {
    key: 'Pics Editor',
    className: 'featured-left',
    initial: { opacity: 0, x: -100, rotateY: -15 },
    animate: { opacity: 1, x: 0, rotateY: 0 },
    transition: { delay: 0.9, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
    whileHover: {
      scale: 1.12,
      rotateY: 5,
      rotateZ: -2,
      y: -15,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    iconAnimate: { rotateZ: [0, 5, -5, 0] },
    iconTransition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'Playground',
    className: 'featured-center',
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: { opacity: 1, y: [0, -10, 0], scale: 1 },
    transition: {
      opacity: { delay: 1.0, duration: 0.8 },
      scale: { delay: 1.0, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
      y: { delay: 1.8, duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    whileHover: {
      scale: 1.15,
      y: -20,
      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
      transition: { duration: 0.3 },
    },
    iconAnimate: { scale: [1, 1.1, 1] },
    iconTransition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    key: 'SVG Viewer',
    className: 'featured-right',
    initial: { opacity: 0, x: 100, rotateY: 15 },
    animate: { opacity: 1, x: 0, rotateY: 0 },
    transition: { delay: 1.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
    whileHover: {
      scale: 1.12,
      rotateY: -5,
      rotateZ: 2,
      y: -15,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    iconAnimate: { rotateZ: [0, 360] },
    iconTransition: { duration: 20, repeat: Infinity, ease: 'linear' },
  },
];

const categories = [
  {
    title: 'Playground',
    keys: ['Playground'],
    desc: 'Experiment, code, and create — directly in your browser.',
    tagline: 'Build amazing things',
    testimonial: {
      quote: 'The playground feature lets me prototype ideas instantly without any setup.',
      author: 'Developer & Creator',
      role: 'Full-stack Developer',
    },
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
      'Video Watch',
    ],
    desc: 'From quick conversions to encryption — everything you need for everyday dev work.',
    tagline: 'Essential tools, instant access',
    features: [
      'Generate secure passwords and UUIDs instantly',
      'Test regex patterns in real-time',
      'Encode and decode JWT tokens with ease',
    ],
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
    tagline: 'Transform images effortlessly',
    testimonial: {
      quote: 'Image conversion has never been this simple. Everything I need in one place.',
      author: 'Design Professional',
      role: 'UI/UX Designer',
    },
  },
  {
    title: 'Editor',
    keys: ['Json Formatter', 'Readme Editor', 'HTML Editor'],
    desc: 'Edit JSON, Markdown, or HTML instantly with built-in formatters.',
    tagline: 'Edit and format with precision',
    features: [
      'Format JSON with syntax highlighting',
      'Preview Markdown in real-time',
      'Edit HTML with live preview',
    ],
  },
  {
    title: 'Randomizer',
    keys: ['🎡 Wheel of Names', 'Random Generator'],
    desc: 'Spin, randomize, and pick — perfect for quick ideas and fun experiments.',
    tagline: 'Make decisions fun',
  },
  {
    title: 'Game',
    keys: ['Chess', 'Sudoku', 'Tic-Tac-Toe', 'Minesweeper', 'Snake xenzia'],
    desc: 'Relax and recharge with built-in classic games.',
    tagline: 'Take a break, play smart',
    testimonial: {
      quote: 'Perfect for quick breaks. These games help me reset and come back more focused.',
      author: 'Software Engineer',
      role: 'Product Developer',
    },
  },
  {
    title: 'Docs / Commands',
    keys: ['Commands', 'Emojis /  Kaomojis '],
    desc: 'Quick access to useful documentation and expressive emoji tools.',
    tagline: 'Find what you need, fast',
  },
];

const WelcomePage: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <motion.div
      className="welcome-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 🌤️ Hero Section */}
      <motion.div
        className="hero-section"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-content">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Title level={1} className="hero-title">
              Your tools are essential.
              <br />
              Your workspace should be too.
            </Title>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Paragraph className="hero-subtitle">
              Build, convert, and create with a complete suite of professional tools — all in one
              place, designed for speed and simplicity.
            </Paragraph>
          </motion.div>

          <motion.div
            className="hero-cta"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button type="primary" size="large" onClick={() => history.push('/playground')}>
              Get started — it's free
            </Button>
            <Button
              size="large"
              // ghost
              onClick={() => window.scrollBy({ top: 800, behavior: 'smooth' })}
            >
              Explore features
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <div className="visual-grid">
            {heroVisuals.map((visual) => {
              const item = pages.find((p) => p.name === visual.key);
              if (!item) return null;

              return (
                <motion.div
                  key={item.name}
                  className={`visual-item ${visual.className}`}
                  initial={visual.initial}
                  animate={visual.animate}
                  transition={visual.transition}
                  whileHover={visual.whileHover}
                  onClick={() => history.push(item.path)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="visual-item-inner">
                    <motion.div
                      className="visual-icon"
                      animate={visual.iconAnimate}
                      transition={visual.iconTransition}
                    >
                      {item.icon}
                    </motion.div>
                    <Text className="visual-name">{item.name}</Text>
                    <Text className="visual-desc">{item.desc}</Text>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

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
                className="feature-section feature-hero"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
              >
                <div className="feature-content">
                  <motion.div
                    className="feature-text-block"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <Text className="feature-eyebrow">{category.tagline}</Text>
                    <Title level={2} className="feature-title">
                      {category.title}
                    </Title>
                    <Paragraph className="feature-description">{category.desc}</Paragraph>
                    <ul className="feature-list">
                      <li>Write and execute code instantly in multiple languages</li>
                      <li>Real-time preview and output display</li>
                      <li>No setup required — start coding immediately</li>
                    </ul>
                    {category.testimonial && (
                      <div className="inline-testimonial">
                        <blockquote>"{category.testimonial.quote}"</blockquote>
                        <div className="testimonial-author">
                          <strong>{category.testimonial.author}</strong>
                          <span>{category.testimonial.role}</span>
                        </div>
                      </div>
                    )}
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => history.push(items[0]?.path)}
                    >
                      Try Playground
                    </Button>
                  </motion.div>

                  <motion.div
                    className="feature-visual"
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <div className="visual-showcase stacked">
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.name}
                          className="showcase-card"
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, amount: 0.4 }}
                          transition={{
                            delay: 0.5 + idx * 0.12,
                            duration: 0.6,
                            ease: [0.215, 0.61, 0.355, 1],
                          }}
                          whileHover={{
                            scale: 1.08,
                            y: -10,
                            zIndex: 10,
                            transition: { duration: 0.3 },
                          }}
                          onClick={() => history.push(item.path)}
                          role="button"
                          tabIndex={0}
                          style={{
                            zIndex: items.length - idx,
                          }}
                        >
                          <div className="showcase-icon">{item.icon}</div>
                          <Text className="showcase-name">{item.name}</Text>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          }
          return (
            <motion.section
              key={category.title}
              className={`feature-section ${isReverse ? 'reverse' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
            >
              <div className="feature-content">
                <motion.div
                  className="feature-text-block"
                  initial={{ opacity: 0, x: isReverse ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {category.tagline && <Text className="feature-eyebrow">{category.tagline}</Text>}
                  <Title level={2} className="feature-title">
                    {category.title}
                  </Title>
                  <Paragraph className="feature-description">{category.desc}</Paragraph>
                  {category.features && (
                    <ul className="feature-list">
                      {category.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  )}
                  {category.testimonial && (
                    <div className="inline-testimonial">
                      <blockquote>"{category.testimonial.quote}"</blockquote>
                      <div className="testimonial-author">
                        <strong>{category.testimonial.author}</strong>
                        <span>{category.testimonial.role}</span>
                      </div>
                    </div>
                  )}
                  <Button type="primary" size="large" onClick={() => history.push(items[0]?.path)}>
                    Explore {category.title}
                  </Button>
                </motion.div>

                <motion.div
                  className="feature-visual"
                  initial={{ opacity: 0, x: isReverse ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div className="visual-grid-section">
                    {items.length > 4 ? (
                      <div className="tool-grid-stacked">
                        {items.slice(0, 6).map((item, idx) => (
                          <motion.div
                            key={item.name}
                            className="tool-card"
                            initial={{ opacity: 0, y: 40, scale: 0.92 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{
                              delay: idx * 0.1,
                              duration: 0.6,
                              ease: [0.215, 0.61, 0.355, 1],
                            }}
                            whileHover={{
                              scale: 1.06,
                              y: -12,
                              zIndex: 20,
                              transition: { duration: 0.3 },
                            }}
                            onClick={() => history.push(item.path)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="tool-icon">{item.icon}</div>
                            <Title level={5} className="tool-name">
                              {item.name}
                            </Title>
                            {!isMobile && <Paragraph className="tool-desc">{item.desc}</Paragraph>}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="tool-grid">
                        {items.map((item, idx) => (
                          <motion.div
                            key={item.name}
                            className="tool-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{
                              delay: idx * 0.1,
                              duration: 0.6,
                              ease: [0.215, 0.61, 0.355, 1],
                            }}
                            whileHover={{
                              scale: 1.06,
                              y: -10,
                              transition: { duration: 0.3 },
                            }}
                            onClick={() => history.push(item.path)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="tool-icon">{item.icon}</div>
                            <Title level={5} className="tool-name">
                              {item.name}
                            </Title>
                            {!isMobile && <Paragraph className="tool-desc">{item.desc}</Paragraph>}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* 🎯 Final CTA Section */}
      <motion.div
        className="cta-section"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="cta-content">
          <Title level={2} className="cta-title">
            Get started for free
          </Title>
          <Paragraph className="cta-description">
            Try Ultimate Tools with no signup required. Access all features instantly and boost your
            productivity today.
          </Paragraph>
          <div className="cta-buttons">
            <Button type="primary" size="large" onClick={() => history.push('/playground')}>
              Start building now
            </Button>
            <Button size="large" ghost>
              View all tools
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomePage;

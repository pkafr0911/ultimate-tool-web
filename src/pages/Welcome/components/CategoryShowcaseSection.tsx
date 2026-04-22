import React from 'react';
import { motion } from 'framer-motion';
import { history } from 'umi';
import { Typography, Button } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import { categories } from '../constants';
import { pages } from '@/constants';
import styles from '../styles.less';

const { Title, Paragraph, Text } = Typography;

const CategoryShowcaseSection: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div id="category-showcase" className={styles.categoryShowcaseSection}>
      {categories.map((category, i) => {
        const items = pages.filter((p) => p.path.startsWith(category.pathPrefix));
        const isReverse = i % 2 !== 0;
        const accent = category.accent;
        const accentStyle = { '--cat-accent': accent } as React.CSSProperties;

        // Special design for Playground
        if (category.title === 'Playground') {
          return (
            <motion.div
              key="playground-section"
              className="feature-section feature-hero"
              style={accentStyle}
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
                  <Text className="feature-eyebrow" style={{ color: accent }}>
                    {category.tagline}
                  </Text>
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
                    <div className="inline-testimonial" style={{ borderLeftColor: accent }}>
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
                    style={{ background: accent, borderColor: accent }}
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
                          boxShadow: `0 20px 60px ${accent}25`,
                          transition: { duration: 0.3 },
                        }}
                        onClick={() => history.push(item.path)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${item.name}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            history.push(item.path);
                          }
                        }}
                        style={{
                          zIndex: items.length - idx,
                          borderTop: `3px solid ${accent}`,
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
            style={accentStyle}
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
                {category.tagline && (
                  <Text className="feature-eyebrow" style={{ color: accent }}>
                    {category.tagline}
                  </Text>
                )}
                <Title level={2} className="feature-title">
                  {category.title}
                </Title>
                <Paragraph className="feature-description">{category.desc}</Paragraph>
                {category.features && (
                  <ul className="feature-list">
                    {category.features.map((feature, idx) => (
                      <li key={idx} style={{ '--check-color': accent } as React.CSSProperties}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                {category.testimonial && (
                  <div className="inline-testimonial" style={{ borderLeftColor: accent }}>
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
                  style={{ background: accent, borderColor: accent }}
                  onClick={() => history.push(items[0]?.path)}
                >
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
                          style={{ borderTop: `3px solid ${accent}` }}
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
                            boxShadow: `0 16px 48px ${accent}25`,
                            transition: { duration: 0.3 },
                          }}
                          onClick={() => history.push(item.path)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open ${item.name}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              history.push(item.path);
                            }
                          }}
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
                          style={{ borderTop: `3px solid ${accent}` }}
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
                            boxShadow: `0 16px 48px ${accent}25`,
                            transition: { duration: 0.3 },
                          }}
                          onClick={() => history.push(item.path)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open ${item.name}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              history.push(item.path);
                            }
                          }}
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
  );
};

export default CategoryShowcaseSection;

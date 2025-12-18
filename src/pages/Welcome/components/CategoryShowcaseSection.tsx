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
    <div className={styles.categoryShowcaseSection}>
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
                  <Button type="primary" size="large" onClick={() => history.push(items[0]?.path)}>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            history.push(item.path);
                          }
                        }}
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
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

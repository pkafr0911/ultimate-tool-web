import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { history } from 'umi';
import styles from './styles.less';
import {
  stickyCards,
  horizontalScrollItems,
  featureSections,
  marqueeRows,
  heroVisuals,
  categories,
} from './constants';
import { pages } from '@/constants';
import '../Welcome/styles.less'; // Import original styles for hero visuals
import { Typography, Button } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';

const { Title, Paragraph, Text } = Typography;

// --- Components from WebflowScroll ---

const MarqueeCard = ({ item }: { item: any }) => {
  return (
    <div
      className={`${styles.marqueeCard} ${styles[item.className] || ''}`}
      onClick={() => item.path && history.push(item.path)}
    >
      {item.type === 'image' && <img src={item.src} alt={item.title || 'Image'} />}
      {(item.type === 'text' || item.type === 'gradient') && (
        <div className={styles.cardContent}>
          <div>
            <h3>{item.title}</h3>
            {item.desc && <p>{item.desc}</p>}
          </div>
          {item.button && <button className={styles.btn}>{item.button}</button>}
        </div>
      )}
    </div>
  );
};

const MarqueeRow = ({
  items,
  direction = 'left',
  speed = 20,
}: {
  items: any[];
  direction?: 'left' | 'right';
  speed?: number;
}) => {
  return (
    <div className={styles.marqueeRow}>
      <motion.div
        className={styles.marqueeTrack}
        animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{
          duration: speed,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {[...items, ...items, ...items, ...items].map((item, index) => (
          <MarqueeCard key={`${index}-${item.title}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
};

const CatButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.catButtonWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => history.push('/playground')}
    >
      <motion.div
        className={styles.catPaw}
        initial={{ y: 35, rotate: 0 }}
        animate={{
          y: isHovered ? [-5, 10, -5] : 35,
          rotate: isHovered ? [0, -5, 5, 0] : 0,
          x: isHovered ? [0, 2, -2, 0] : 0,
        }}
        transition={{
          y: isHovered
            ? {
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            : { duration: 0.3 },
          rotate: isHovered
            ? {
                duration: 0.6,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            : { duration: 0.3 },
          x: isHovered
            ? {
                duration: 0.4,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            : { duration: 0.3 },
        }}
      >
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M268.3 397.9c-48.6 28-112.2 11.7-140.2-36.9-28-48.6-11.7-112.2 36.9-140.2 48.6-28 112.2-11.7 140.2 36.9 28 48.6 11.7 112.2-36.9 140.2z"
            fill="#333"
          />
          <path
            d="M165.5 260.8c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3zM224.6 226.7c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3zM283.7 260.8c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3zM283.7 329c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3z"
            fill="#fff"
          />
        </svg>
      </motion.div>
      <button className={styles.catBtn}>Get Started</button>
    </div>
  );
};

const FramerMarqueeSection = () => {
  return (
    <div className={styles.framerMarqueeSection}>
      <h2>Launch faster with community resources</h2>
      <MarqueeRow items={marqueeRows[0]} direction="left" speed={40} />
      <MarqueeRow items={marqueeRows[1]} direction="right" speed={50} />
      <MarqueeRow items={marqueeRows[2]} direction="left" speed={45} />
    </div>
  );
};

const FeatureCategorySection: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className={styles.storySections}>
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
  );
};

const FeatureTextBlock = ({ feature, index, setActive, isActive }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-50% 0px -50% 0px' });

  useEffect(() => {
    if (isInView) setActive(index);
  }, [isInView, index, setActive]);

  return (
    <div ref={ref} className={`${styles.featureTextBlock} ${isActive ? styles.active : ''}`}>
      <h2>{feature.title}</h2>
      <p>{feature.desc}</p>
    </div>
  );
};

const SellProductsSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className={styles.stickyFeatureSection}>
      <div className={styles.featureContent}>
        {featureSections.map((feature, index) => (
          <FeatureTextBlock
            key={feature.id}
            feature={feature}
            index={index}
            setActive={setActiveFeature}
            isActive={activeFeature === index}
          />
        ))}
      </div>
      <div className={styles.featureImages}>
        {featureSections.map((feature, index) => (
          <motion.div
            key={feature.id}
            className={styles.imageWrapper}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: activeFeature === index ? 1 : 0,
              scale: activeFeature === index ? 1 : 0.95,
              zIndex: activeFeature === index ? 1 : 0,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <img src={feature.image} alt={feature.title} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Components from Welcome Page ---

const HeroSection = () => {
  return (
    <div className={`${styles.hero} welcome-container`}>
      <div className={styles.blobContainer}>
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>
      <div className={`${styles.heroContent} hero-section`}>
        <h1 className={styles.heroTitle}>Ultimate Developer Tools</h1>
        <p className={styles.heroSubtitle}>
          A collection of powerful tools for developers. From code formatting to image editing,
          everything you need in one place.
        </p>
        <div className={styles.heroCta}>
          <CatButton />
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
                    <div className="visual-name">{item.name}</div>
                    <div className="visual-desc">{item.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ToolsGridSection = () => {
  return (
    <div className={styles.cardsSection}>
      <div className={styles.sectionHeader}>
        <h2>Explore Our Tools</h2>
        <p>Everything you need to boost your productivity</p>
      </div>

      {/* We can map through some categories or tools here */}
      <div className={styles.toolsGrid}>
        {pages.slice(0, 6).map((page, index) => (
          <div key={page.name} className={styles.toolCard} onClick={() => history.push(page.path)}>
            <div className={styles.toolIcon}>{page.icon || '🛠️'}</div>
            <h3>{page.name}</h3>
            <p>{page.desc || 'A useful tool for developers'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FooterSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.8, 1]);

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <motion.div
        className={styles.footer}
        style={{
          scale,
          opacity,
          width: '100%',
          transformOrigin: 'bottom center',
        }}
      >
        <h2>Ready to get started?</h2>
        <CatButton />
      </motion.div>
    </div>
  );
};

const WelcomeNew: React.FC = () => {
  return (
    <div className={styles.container}>
      <HeroSection />

      {/* Sticky Cards Effect from WebflowScroll */}
      <div className={styles.cardsSection}>
        {stickyCards.map((card, index) => (
          <div
            key={card.id}
            className={styles.cardContainer}
            style={{ top: `${100 + index * 40}px` }} // Staggered sticky top
          >
            <div
              className={styles.card}
              style={{ backgroundColor: card.color, cursor: 'pointer' }}
              onClick={() => history.push(card.path)}
            >
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          </div>
        ))}
      </div>
      <SellProductsSection />
      <FeatureCategorySection />
      <FramerMarqueeSection />
      <FooterSection />
    </div>
  );
};

export default WelcomeNew;

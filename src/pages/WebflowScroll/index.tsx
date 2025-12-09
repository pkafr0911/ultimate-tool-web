import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import styles from './styles.less';
import { cards, cartVariants, marqueeRows, productFeatures, resources } from './constants';

const MarqueeCard = ({ item }: { item: any }) => {
  return (
    <div className={`${styles.marqueeCard} ${styles[item.className] || ''}`}>
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

const CommunityResourcesSection = () => {
  return (
    <div className={styles.marqueeSection}>
      <h2>Launch faster with community resources</h2>
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <motion.div
          className={styles.marqueeTrack}
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 20,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {[...resources, ...resources].map((item, index) => (
            <div key={`${item.id}-${index}`} className={styles.resourceCard}>
              <img src={item.image} alt={item.title} />
              <div className={styles.resourceInfo}>
                <h4>{item.title}</h4>
                <span>by {item.author}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const CustomizeCartSection: React.FC = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-60%']);

  return (
    <div ref={targetRef} className={styles.horizontalScrollSection}>
      <div className={styles.horizontalStickyWrapper}>
        <div className={styles.horizontalHeader}>
          <h2>Customize your cart</h2>
          <p>Scroll to see different styles</p>
        </div>
        <motion.div style={{ x }} className={styles.horizontalTrack}>
          {cartVariants.map((item) => (
            <div key={item.id} className={styles.horizontalCard}>
              <div className={styles.mockUI} style={{ backgroundColor: item.color }} />
              <h3>{item.title}</h3>
            </div>
          ))}
        </motion.div>
      </div>
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
        {productFeatures.map((feature, index) => (
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
        {productFeatures.map((feature, index) => (
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

const WebflowScroll: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Ecommerce Feature</h1>
        <p>Scroll to explore</p>
      </div>

      <div className={styles.cardsSection}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={styles.cardContainer}
            style={{ top: `${100 + index * 40}px` }} // Staggered sticky top
          >
            <div className={styles.card} style={{ backgroundColor: card.color }}>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <CustomizeCartSection />
      <SellProductsSection />
      <CommunityResourcesSection />
      <FramerMarqueeSection />

      <div className={styles.footer}>
        <h2>Ready to get started?</h2>
        <CatButton />
      </div>
    </div>
  );
};

export default WebflowScroll;

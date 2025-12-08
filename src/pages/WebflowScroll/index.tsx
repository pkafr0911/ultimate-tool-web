import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import styles from './styles.less';

const cards = [
  {
    id: 1,
    title: 'Customize your store',
    description: 'Design your store exactly how you want.',
    color: '#4353ff',
  },
  {
    id: 2,
    title: 'Manage your products',
    description: 'Add, edit, and organize your inventory with ease.',
    color: '#2d2d2d',
  },
  {
    id: 3,
    title: 'Secure payments',
    description: 'Accept payments from all major providers.',
    color: '#ff4081',
  },
  {
    id: 4,
    title: 'Ship everywhere',
    description: 'Reach customers around the globe.',
    color: '#00c853',
  },
];

const cartVariants = [
  { id: 1, title: 'Minimal Cart', color: '#FF5733' },
  { id: 2, title: 'Dark Mode Cart', color: '#33FF57' },
  { id: 3, title: 'Sidebar Cart', color: '#3357FF' },
  { id: 4, title: 'Modal Cart', color: '#F333FF' },
  { id: 5, title: 'Full Page Cart', color: '#FF33A8' },
];

const productFeatures = [
  {
    id: 1,
    title: 'Physical Products',
    desc: 'Sell apparel, goods, and more with automatic shipping calculations. Manage inventory and variants with ease.',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: 'Digital Goods',
    desc: 'Deliver files securely immediately after purchase. Perfect for ebooks, software, music, and digital art.',
    image:
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: 'Services',
    desc: 'Book appointments and sell services directly from your site. Integrate with your calendar and manage bookings.',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
  },
];

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

      <div className={styles.footer}>
        <h2>Ready to get started?</h2>
      </div>
    </div>
  );
};

export default WebflowScroll;

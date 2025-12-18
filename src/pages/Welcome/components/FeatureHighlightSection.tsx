import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from '../styles.less';
import { featureSections } from '../constants';

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

const FeatureHighlightSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className={styles.featureHighlightSection}>
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
            style={{ willChange: 'opacity, transform' }}
          >
            <img src={feature.image} alt={feature.title} loading="lazy" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeatureHighlightSection;

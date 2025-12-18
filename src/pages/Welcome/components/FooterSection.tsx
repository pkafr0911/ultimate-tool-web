import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from '../styles.less';
import { ToolsMarqueeSection } from './Marquee';
import CatButton from './CatButton';

const FooterSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.75, 1]);

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
        <ToolsMarqueeSection />
        <h2>Ready to get started?</h2>
        <CatButton />
        <div style={{ marginBottom: 100 }}></div>
      </motion.div>
    </div>
  );
};

export default FooterSection;

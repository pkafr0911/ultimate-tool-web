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
        <motion.div
          className={styles.footerCta}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Stop tab-hopping.</h2>
          <p className={styles.footerSubtitle}>
            Everything you need as a developer — converters, editors, generators, games — all in one
            lightning-fast, private, browser-based toolkit.
          </p>
          <CatButton />
          <p className={styles.footerNote}>Free &amp; open source. No account needed.</p>
        </motion.div>
        <div style={{ marginBottom: 100 }}></div>
      </motion.div>
    </div>
  );
};

export default FooterSection;

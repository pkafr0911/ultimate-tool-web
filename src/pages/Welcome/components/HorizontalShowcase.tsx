import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';
import { pages } from '@/constants';
import { getToolAccent } from '../constants';

const HorizontalShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-55%']);

  const featuredPaths = [
    '/playground',
    '/visual-tools/photo-editor',
    '/utility/password',
    '/editor/json-formatter',
    '/utility/regex',
  ];
  const featuredTools = featuredPaths
    .map((p) => pages.find((page) => page.path === p))
    .filter(Boolean) as typeof pages;

  return (
    <section ref={containerRef} className={styles.horizontalSection}>
      <div className={styles.horizontalWrapper}>
        <div className={styles.horizontalHeader}>
          <span className={styles.sectionEyebrow}>Featured tools</span>
          <h2>Explore the Collection</h2>
        </div>
        <motion.div className={styles.horizontalTrack} style={{ x }}>
          {featuredTools.map((tool, i) => {
            const accent = getToolAccent(tool.path);
            return (
              <motion.div
                key={tool.name}
                className={styles.horizontalCard}
                style={
                  {
                    '--card-accent': accent,
                    '--card-accent-10': `${accent}18`,
                    '--card-accent-20': `${accent}30`,
                  } as React.CSSProperties
                }
                onClick={() => history.push(tool.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    history.push(tool.path);
                  }
                }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
                whileHover={{
                  y: -12,
                  transition: { duration: 0.3 },
                }}
              >
                <div className={styles.horizontalCardAccentBar} style={{ background: accent }} />
                <div className={styles.horizontalCardIcon}>{tool.icon}</div>
                <h3 className={styles.horizontalCardName}>{tool.name}</h3>
                <p className={styles.horizontalCardDesc}>{tool.desc}</p>
                <span className={styles.horizontalCardArrow} style={{ color: accent }}>
                  →
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HorizontalShowcase;

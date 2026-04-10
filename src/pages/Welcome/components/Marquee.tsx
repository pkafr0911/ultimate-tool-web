import React from 'react';
import { motion } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';
import { marqueeRows, categories, getToolAccent } from '../constants';

/** Derive a short category label from a tool path */
function getCategoryLabel(path: string): string {
  for (const cat of categories) {
    if (path.startsWith(cat.pathPrefix)) return cat.title;
  }
  return 'Tool';
}

export const MarqueeCard = ({ item }: { item: any }) => {
  const handleClick = () => {
    if (item.path) history.push(item.path);
  };

  const accent = item.path ? getToolAccent(item.path) : '#6366f1';
  const label = item.path ? getCategoryLabel(item.path) : '';

  return (
    <motion.div
      className={styles.marqueeCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      style={{ '--card-accent': accent } as React.CSSProperties}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
    >
      {item.type === 'image' ? (
        <div className={styles.marqueeImageCard}>
          <img src={item.src} alt={item.title || 'Tool preview'} loading="lazy" />
          {item.title && (
            <div className={styles.marqueeImageOverlay}>
              <span>{item.title}</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* accent bar at the top */}
          <div className={styles.marqueeAccentBar} />

          <div className={styles.marqueCardContent}>
            {label && <span className={styles.marqueeCategoryBadge}>{label}</span>}
            <h3>{item.title}</h3>
            {item.desc && <p>{item.desc}</p>}
            {item.button && (
              <button className={styles.marqueeBtn} tabIndex={-1}>
                {item.button}
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export const MarqueeRow = ({
  items,
  direction = 'left',
  speed = 20,
}: {
  items: any[];
  direction?: 'left' | 'right';
  speed?: number;
}) => {
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className={styles.marqueeRow}>
      <motion.div
        className={styles.marqueeTrack}
        animate={{ x: direction === 'left' ? ['0%', '-33.33%'] : ['-33.33%', '0%'] }}
        transition={{
          duration: speed,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{ willChange: 'transform' }}
      >
        {duplicatedItems.map((item, index) => (
          <MarqueeCard key={`${index}-${item.title}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
};

export const ToolsMarqueeSection = () => {
  return (
    <div className={styles.toolsMarqueeSection}>
      <div className={styles.marqueeHeader}>
        <span className={styles.sectionEyebrow}>Every tool, at a glance</span>
        <h2>Explore All Tools</h2>
        <p>Browse the full collection — click any card to jump straight in.</p>
      </div>
      <MarqueeRow items={marqueeRows[0]} direction="left" speed={40} />
      <MarqueeRow items={marqueeRows[1]} direction="right" speed={50} />
      <MarqueeRow items={marqueeRows[2]} direction="left" speed={45} />
    </div>
  );
};

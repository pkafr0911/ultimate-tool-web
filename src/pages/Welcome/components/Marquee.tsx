import React from 'react';
import { motion } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';
import { marqueeRows } from '../constants';

export const MarqueeCard = ({ item }: { item: any }) => {
  const handleClick = () => {
    if (item.path) history.push(item.path);
  };

  return (
    <div
      className={`${styles.marqueeCard} ${styles[item.className] || ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {item.type === 'image' && <img src={item.src} alt={item.title || 'Image'} loading="lazy" />}
      {(item.type === 'text' || item.type === 'gradient') && (
        <div className={styles.cardContent}>
          <div>
            <h3>{item.title}</h3>
            {item.desc && <p>{item.desc}</p>}
          </div>
          {item.button && (
            <button className={styles.btn} tabIndex={-1}>
              {item.button}
            </button>
          )}
        </div>
      )}
    </div>
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
  // Optimization: Only duplicate enough to fill the screen + buffer.
  // Assuming 4 copies is safe for now, but we can reduce if needed.
  // Using 3 copies instead of 4 to reduce DOM nodes slightly while maintaining loop.
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
      <h2>Explore All Tools</h2>
      <MarqueeRow items={marqueeRows[0]} direction="left" speed={40} />
      <MarqueeRow items={marqueeRows[1]} direction="right" speed={50} />
      <MarqueeRow items={marqueeRows[2]} direction="left" speed={45} />
    </div>
  );
};

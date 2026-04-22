import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from '../styles.less';
import { pages } from '@/constants';
import { categories } from '../constants';

const useCounter = (end: number, duration: number = 2000, inView: boolean) => {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (end === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return count;
};

interface StatCardProps {
  stat: {
    value: number;
    suffix: string;
    label: string;
    description: string;
    gradient: string;
  };
  index: number;
  inView: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ stat, index, inView }) => {
  const count = useCounter(stat.value, 2000, inView);
  return (
    <motion.div
      className={styles.statCard}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        className={styles.statNumber}
        style={{ backgroundImage: stat.gradient }}
        aria-label={`${stat.value}${stat.suffix} ${stat.label}`}
      >
        {count}
        {stat.suffix}
      </div>
      <div className={styles.statLabel}>{stat.label}</div>
      <div className={styles.statDesc}>{stat.description}</div>
      <div className={styles.statGlow} style={{ backgroundImage: stat.gradient }} />
    </motion.div>
  );
};

const stats = [
  {
    value: pages.length,
    suffix: '+',
    label: 'Developer Tools',
    description: 'From code playground to image editors',
    gradient: 'linear-gradient(135deg, #ff718b, #ff4081)',
  },
  {
    value: categories.length,
    suffix: '',
    label: 'Categories',
    description: 'Organized for quick discovery',
    gradient: 'linear-gradient(135deg, #41b3ff, #4353ff)',
  },
  {
    value: 0,
    suffix: '',
    label: 'Install Required',
    description: 'Everything runs in your browser',
    gradient: 'linear-gradient(135deg, #00c853, #69f0ae)',
  },
  {
    value: 100,
    suffix: '%',
    label: 'Client-Side',
    description: 'Your data never leaves your device',
    gradient: 'linear-gradient(135deg, #ffab40, #ff6d00)',
  },
];

const StatsCounterSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className={styles.statsSection}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2
        className={styles.statsSectionTitle}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Built for developers who value their time
      </motion.h2>
      <motion.p
        className={styles.statsSectionSubtitle}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        No signups. No downloads. No data collection. Just tools that work.
      </motion.p>
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} inView={isInView} />
        ))}
      </div>
    </motion.div>
  );
};

export default StatsCounterSection;

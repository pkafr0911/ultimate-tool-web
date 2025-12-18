import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';
import { heroVisuals } from '../constants';
import { pages } from '@/constants';
import CatButton from './CatButton';

const phrases = [
  'Too many tabs. Too many tools.',
  'Generate, convert, and format — without switching windows.',
  'All your favorite tools, in one place.',
  'Play, build, and test smarter.',
  'Ultimate Tools. Zero friction.',
];

const HeroSection = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${styles.hero} welcome-container`}>
      <div className={styles.blobContainer}>
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>
      <div className={`${styles.heroContent} hero-section`}>
        <h1 className={styles.heroTitle}>Ultimate Developer Tools</h1>

        <div style={{ height: '60px', marginBottom: '40px', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              className={styles.heroSubtitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{ position: 'absolute', width: '100%', left: 0, right: 0 }}
            >
              {phrases[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

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

              const handleClick = () => history.push(item.path);

              return (
                <motion.div
                  key={item.name}
                  className={`visual-item ${visual.className}`}
                  initial={visual.initial}
                  animate={visual.animate}
                  transition={visual.transition}
                  whileHover={visual.whileHover}
                  onClick={handleClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleClick();
                    }
                  }}
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

export default HeroSection;

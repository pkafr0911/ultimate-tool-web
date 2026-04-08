import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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

const trustBadges = [
  { icon: '🔒', label: '100% Client-Side' },
  { icon: '⚡', label: 'Zero Setup' },
  { icon: '🌙', label: 'Dark Mode' },
  { icon: '📱', label: 'Mobile Ready' },
];

const TerminalTyper = () => {
  const lines = [
    { prompt: '~', cmd: 'npx ultimate-tools --start', delay: 0 },
    { prompt: '', cmd: '✓ 35+ tools loaded', delay: 1.2, isOutput: true },
    { prompt: '', cmd: '✓ 7 categories ready', delay: 1.8, isOutput: true },
    { prompt: '', cmd: '✓ All running in browser — no install needed', delay: 2.4, isOutput: true },
    { prompt: '~', cmd: 'echo "Ready to build something amazing?"', delay: 3.2 },
  ];

  return (
    <motion.div
      className={styles.terminalBlock}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
    >
      <div className={styles.terminalHeader}>
        <span className={styles.terminalDot} style={{ background: '#ff5f57' }} />
        <span className={styles.terminalDot} style={{ background: '#ffbd2e' }} />
        <span className={styles.terminalDot} style={{ background: '#28c840' }} />
        <span className={styles.terminalTitle}>ultimate-tools</span>
      </div>
      <div className={styles.terminalBody}>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className={`${styles.terminalLine} ${line.isOutput ? styles.terminalOutput : ''}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: line.delay, duration: 0.4 }}
          >
            {line.prompt && <span className={styles.terminalPrompt}>{line.prompt} $</span>}
            <span className={line.isOutput ? styles.terminalSuccess : ''}>{line.cmd}</span>
            {i === lines.length - 1 && (
              <motion.span
                className={styles.terminalCursor}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                █
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const HeroSection = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      ref={heroRef}
      className={`${styles.hero} welcome-container`}
      style={{ opacity: heroOpacity, scale: heroScale }}
    >
      <div className={styles.blobContainer}>
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>

      {/* Floating particles */}
      <div className={styles.particlesContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * 600,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * -200 - 100],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      <div className={`${styles.heroContent} hero-section`}>
        <motion.div
          className={styles.heroBadge}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className={styles.heroBadgeDot} />
          Open Source &middot; Free Forever
        </motion.div>

        <h1 className={styles.heroTitle}>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Your entire dev toolkit,
          </motion.span>
          <br />
          <motion.span
            className={styles.heroTitleAccent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            one tab away.
          </motion.span>
        </h1>

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
          <motion.button
            className={styles.heroSecondaryBtn}
            onClick={() => {
              const el = document.getElementById('category-showcase');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Tools ↓
          </motion.button>
        </div>

        {/* Trust Badges */}
        <motion.div
          className={styles.trustBadges}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {trustBadges.map((badge) => (
            <div key={badge.label} className={styles.trustBadge}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Terminal Block */}
        <TerminalTyper />

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
    </motion.div>
  );
};

export default HeroSection;

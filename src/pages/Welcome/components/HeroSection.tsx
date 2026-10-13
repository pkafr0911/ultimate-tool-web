import React, { lazy, Suspense, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'umi';
import { Button } from 'antd';
import { ArrowRightOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { pages } from '@/constants';
import { categories, heroVisuals } from '../constants';
import styles from '../neural.less';

const NeuralCore = lazy(() => import('./NeuralCore'));
const phrases = [
  'Too many tabs. Too many tools.',
  'Generate, convert, and format — without switching windows.',
  'All your favorite tools, in one place.',
  'Play, build, and test smarter.',
  'Ultimate Tools. Zero friction.',
];

export default function HeroSection() {
  const reducedMotion = !!useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [rotateCopy, setRotateCopy] = useState(true);
  useEffect(() => {
    if (reducedMotion || !rotateCopy) return;
    const timer = window.setInterval(
      () => setPhraseIndex((value) => (value + 1) % phrases.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion, rotateCopy]);
  const entrance = (delay: number) => ({
    initial: reducedMotion ? (false as const) : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay },
  });
  return (
    <header className={styles.hero}>
      <div className={styles.heroTopline}>
        <span>ULTIMATE TOOLS & UTILITIES</span>
        <span>YOUR BROWSER. YOUR WORKSPACE.</span>
      </div>
      <div className={styles.heroComposition}>
        <div className={styles.heroCopy}>
          <motion.div {...entrance(0)} className={styles.eyebrow}>
            <i /> Open Source · Free Forever
          </motion.div>
          <h1>
            <motion.span {...entrance(0.1)}>
              Your entire
              <br />
              dev toolkit,
            </motion.span>
            <motion.span {...entrance(0.2)} data-neural-title className={styles.titleAccent}>
              one tab away.
            </motion.span>
          </h1>
          <motion.div {...entrance(0.3)} className={styles.tagline}>
            <p>{phrases[phraseIndex]}</p>
            {!reducedMotion && (
              <button
                type="button"
                aria-label={rotateCopy ? 'Pause rotating tagline' : 'Resume rotating tagline'}
                onClick={() => setRotateCopy(!rotateCopy)}
              >
                {rotateCopy ? 'Ⅱ' : '▷'}
              </button>
            )}
          </motion.div>
          <motion.div {...entrance(0.4)} className={styles.heroActions}>
            <Link to="/playground" data-neural-primary className={styles.primaryLink}>
              Get Started <ArrowRightOutlined />
            </Link>
            <Button
              type="text"
              onClick={() =>
                document
                  .getElementById('category-showcase')
                  ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
              }
            >
              Explore Tools <ArrowDownOutlined />
            </Button>
          </motion.div>
          <motion.div {...entrance(0.5)} className={styles.trust}>
            <span>100% Client-Side</span>
            <span>Zero Setup</span>
            <span>Dark Mode</span>
            <span>Mobile Ready</span>
          </motion.div>
        </div>
        <Suspense
          fallback={
            <div className={styles.coreStage}>
              <div className={styles.coreFallback} aria-hidden="true">
                <i />
                <i />
                <i />
                <span />
              </div>
            </div>
          }
        >
          <NeuralCore reducedMotion={reducedMotion} />
        </Suspense>
      </div>
      <div className={styles.heroBottom}>
        <div className={styles.directoryIndex}>
          <span>THE TOOLKIT</span>
          <strong>
            {String(pages.length).padStart(2, '0')}
            <small> tools / </small>
            {String(categories.length).padStart(2, '0')}
            <small> categories</small>
          </strong>
        </div>
        <div className={styles.featuredTools}>
          {heroVisuals.map((visual) => {
            const item = pages.find((page) => page.name === visual.key);
            return (
              item && (
                <Link key={item.path} to={item.path}>
                  <span className={styles.featuredIcon}>{item.icon}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.desc}</small>
                  </span>
                  <ArrowRightOutlined />
                </Link>
              )
            );
          })}
        </div>
      </div>
    </header>
  );
}

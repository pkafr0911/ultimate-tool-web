import React, { useEffect, useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import { cancelFrame, frame, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import 'lenis/dist/lenis.css';
import styles from './styles.less';
import '../Welcome/styles.less'; // Import original styles for hero visuals
import { pages } from '@/constants';

// Components
import HeroSection from './components/HeroSection';
import StatsCounterSection from './components/StatsCounterSection';
import ScrollTextReveal from './components/ScrollTextReveal';
import FeatureHighlightSection from './components/FeatureHighlightSection';
import HowItWorksSection from './components/HowItWorksSection';
import VelocityText from './components/VelocityText';
import HorizontalShowcase from './components/HorizontalShowcase';
import CategoryShowcaseSection from './components/CategoryShowcaseSection';
import QuickAccessSection from './components/QuickAccessSection';
import FooterSection from './components/FooterSection';
import Scene3D from './components/Scene3D';

const WelcomeNew: React.FC = () => {
  const lenisRef = useRef<LenisRef>(null);

  // Sync Lenis smooth scroll with Framer Motion's frame loop
  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  // Scroll progress bar + 3D scene opacity
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  // Scene fades out slowly as user scrolls — fully gone past 70%
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.5, 0.75], [1, 0.6, 0]);

  return (
    <>
      <ReactLenis root options={{ autoRaf: false, lerp: 0.1, duration: 1.2 }} ref={lenisRef} />
      <motion.div className={styles.scrollProgress} style={{ scaleX }} />
      {/* 3D spinning background scene */}
      <motion.div style={{ opacity: sceneOpacity }}>
        <Scene3D />
      </motion.div>
      <div className={styles.container}>
        <HeroSection />
        <StatsCounterSection />
        <ScrollTextReveal
          text={`${pages.length}+ powerful developer tools. Zero installs. 100% private. Built for developers who ship fast.`}
        />
        <FeatureHighlightSection />
        <HowItWorksSection />
        <VelocityText />
        <HorizontalShowcase />
        <CategoryShowcaseSection />
        <QuickAccessSection />
        <FooterSection />
      </div>
    </>
  );
};

export default WelcomeNew;

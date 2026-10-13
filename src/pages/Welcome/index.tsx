import React from 'react';
import styles from './styles.less';
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
import { MotionConfig } from 'framer-motion';
import neural from './neural.less';

const WelcomeNew: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <div data-neural-homepage className={`${styles.container} ${neural.neuralPage}`}>
        <HeroSection />
        <CategoryShowcaseSection />
        <StatsCounterSection />
        <ScrollTextReveal
          text={`${pages.length}+ powerful developer tools. Zero installs. 100% private. Built for developers who ship fast.`}
        />
        <FeatureHighlightSection />
        <HowItWorksSection />
        <VelocityText />
        <HorizontalShowcase />
        <QuickAccessSection />
        <FooterSection />
      </div>
    </MotionConfig>
  );
};

export default WelcomeNew;

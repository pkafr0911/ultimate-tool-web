import React from 'react';
import styles from './styles.less';
import '../Welcome/styles.less'; // Import original styles for hero visuals

// Components
import HeroSection from './components/HeroSection';
import FeatureHighlightSection from './components/FeatureHighlightSection';
import CategoryShowcaseSection from './components/CategoryShowcaseSection';
import QuickAccessSection from './components/QuickAccessSection';
import FooterSection from './components/FooterSection';

const WelcomeNew: React.FC = () => {
  return (
    <div className={styles.container}>
      <HeroSection />
      <FeatureHighlightSection />
      <CategoryShowcaseSection />
      <QuickAccessSection />
      <FooterSection />
    </div>
  );
};

export default WelcomeNew;

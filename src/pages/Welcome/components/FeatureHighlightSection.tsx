import React from 'react';
import styles from '../styles.less';
import { featureSections } from '../constants';

const FeatureHighlightSection: React.FC = () => (
  <section className={styles.featureHighlightSection} aria-label="Toolkit capabilities">
    {featureSections.map((feature) => (
      <article key={feature.id} className={styles.featureTextBlock}>
        <span className={styles.sectionEyebrow}>0{feature.id} / CAPABILITIES</span>
        <h2>{feature.title}</h2>
        <p>{feature.desc}</p>
        <img src={feature.image} alt={feature.title} loading="lazy" />
      </article>
    ))}
  </section>
);
export default FeatureHighlightSection;

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles.less';

const steps = [
  {
    number: '01',
    title: 'Pick a Tool',
    description: 'Browse 35+ tools across 7 categories — or search for exactly what you need.',
    icon: '🔍',
    color: '#4353ff',
  },
  {
    number: '02',
    title: 'Use Instantly',
    description:
      'No signups, no installs. Every tool runs directly in your browser, ready in milliseconds.',
    icon: '⚡',
    color: '#ff718b',
  },
  {
    number: '03',
    title: 'Stay Private',
    description: 'All processing happens client-side. Your data never touches a server.',
    icon: '🔒',
    color: '#00c853',
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <div className={styles.howItWorksSection}>
      <motion.div
        className={styles.howItWorksHeader}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.sectionEyebrow}>Simple by design</span>
        <h2>How it works</h2>
        <p>Three steps. That's it. No accounts, no friction.</p>
      </motion.div>

      <div className={styles.stepsContainer}>
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            className={styles.stepCard}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.2, duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
            whileHover={{
              y: -12,
              transition: { duration: 0.3 },
            }}
          >
            <div className={styles.stepNumber} style={{ color: step.color }}>
              {step.number}
            </div>
            <div className={styles.stepConnector}>
              <motion.div
                className={styles.stepLine}
                style={{ backgroundColor: step.color }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 + 0.5, duration: 0.6 }}
              />
            </div>
            <motion.div
              className={styles.stepIcon}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            >
              {step.icon}
            </motion.div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksSection;

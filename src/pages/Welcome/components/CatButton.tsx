import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';

const CatButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.catButtonWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => history.push('/playground')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          history.push('/playground');
        }
      }}
    >
      <motion.div
        className={styles.catPaw}
        initial={{ y: 35, rotate: 0 }}
        animate={{
          y: isHovered ? [-5, 10, -5] : 35,
          rotate: isHovered ? [0, -5, 5, 0] : 0,
          x: isHovered ? [0, 2, -2, 0] : 0,
        }}
        transition={{
          y: isHovered
            ? {
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            : { duration: 0.3 },
          rotate: isHovered
            ? {
                duration: 0.6,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            : { duration: 0.3 },
          x: isHovered
            ? {
                duration: 0.4,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
            : { duration: 0.3 },
        }}
      >
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M268.3 397.9c-48.6 28-112.2 11.7-140.2-36.9-28-48.6-11.7-112.2 36.9-140.2 48.6-28 112.2-11.7 140.2 36.9 28 48.6 11.7 112.2-36.9 140.2z"
            fill="#333"
          />
          <path
            d="M165.5 260.8c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3zM224.6 226.7c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3zM283.7 260.8c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3zM283.7 329c-11.6 6.7-26.6 2.8-33.3-8.8-6.7-11.6-2.8-26.6 8.8-33.3 11.6-6.7 26.6-2.8 33.3 8.8 6.7 11.6 2.8 26.6-8.8 33.3z"
            fill="#fff"
          />
        </svg>
      </motion.div>
      <button className={styles.catBtn} tabIndex={-1}>
        Get Started
      </button>
    </div>
  );
};

export default CatButton;

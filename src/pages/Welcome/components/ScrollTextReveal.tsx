import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import styles from '../styles.less';

interface ScrollTextRevealProps {
  text: string;
}

const Word = ({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [8, 0]);

  return (
    <motion.span className={styles.scrollRevealWord} style={{ opacity, y }}>
      {children}
    </motion.span>
  );
};

const ScrollTextReveal: React.FC<ScrollTextRevealProps> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'start 0.25'],
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={styles.scrollRevealSection}>
      <p className={styles.scrollRevealText}>
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return (
            <Word key={`${i}-${word}`} progress={scrollYProgress} range={[start, end]}>
              {word}
            </Word>
          );
        })}
      </p>
    </div>
  );
};

export default ScrollTextReveal;

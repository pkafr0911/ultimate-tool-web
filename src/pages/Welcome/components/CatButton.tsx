import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';

// A single cat paw SVG — retracted (fingers curled) vs extended (reaching)
const PawSVG = ({ grabbing }: { grabbing: boolean }) => (
  <svg
    viewBox="0 0 80 100"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: '100%' }}
  >
    {/* Palm */}
    <ellipse cx="40" cy="72" rx="22" ry="20" fill="#c9956c" />
    <ellipse cx="40" cy="72" rx="18" ry="16" fill="#e8b89a" />

    {/* Toe beans — shift upward when grabbing */}
    {/* Pinky toe */}
    <motion.ellipse
      cx="18"
      cy="50"
      rx="7"
      ry="9"
      fill="#c9956c"
      animate={grabbing ? { cy: 44, ry: 10 } : { cy: 50, ry: 9 }}
      transition={{ duration: 0.18 }}
    />
    <motion.ellipse
      cx="18"
      cy="50"
      rx="5"
      ry="7"
      fill="#e8b89a"
      animate={grabbing ? { cy: 44 } : { cy: 50 }}
      transition={{ duration: 0.18 }}
    />

    {/* Ring toe */}
    <motion.ellipse
      cx="30"
      cy="42"
      rx="7"
      ry="10"
      fill="#c9956c"
      animate={grabbing ? { cy: 35, ry: 11 } : { cy: 42, ry: 10 }}
      transition={{ duration: 0.15 }}
    />
    <motion.ellipse
      cx="30"
      cy="42"
      rx="5"
      ry="8"
      fill="#e8b89a"
      animate={grabbing ? { cy: 35 } : { cy: 42 }}
      transition={{ duration: 0.15 }}
    />

    {/* Middle toe */}
    <motion.ellipse
      cx="40"
      cy="39"
      rx="7"
      ry="11"
      fill="#c9956c"
      animate={grabbing ? { cy: 32, ry: 12 } : { cy: 39, ry: 11 }}
      transition={{ duration: 0.14 }}
    />
    <motion.ellipse
      cx="40"
      cy="39"
      rx="5"
      ry="9"
      fill="#e8b89a"
      animate={grabbing ? { cy: 32 } : { cy: 39 }}
      transition={{ duration: 0.14 }}
    />

    {/* Index toe */}
    <motion.ellipse
      cx="50"
      cy="42"
      rx="7"
      ry="10"
      fill="#c9956c"
      animate={grabbing ? { cy: 35, ry: 11 } : { cy: 42, ry: 10 }}
      transition={{ duration: 0.15 }}
    />
    <motion.ellipse
      cx="50"
      cy="42"
      rx="5"
      ry="8"
      fill="#e8b89a"
      animate={grabbing ? { cy: 35 } : { cy: 42 }}
      transition={{ duration: 0.15 }}
    />

    {/* Thumb toe */}
    <motion.ellipse
      cx="62"
      cy="50"
      rx="7"
      ry="9"
      fill="#c9956c"
      animate={grabbing ? { cy: 44, ry: 10 } : { cy: 50, ry: 9 }}
      transition={{ duration: 0.18 }}
    />
    <motion.ellipse
      cx="62"
      cy="50"
      rx="5"
      ry="7"
      fill="#e8b89a"
      animate={grabbing ? { cy: 44 } : { cy: 50 }}
      transition={{ duration: 0.18 }}
    />

    {/* Claws — only show when grabbing */}
    <AnimatePresence>
      {grabbing && (
        <>
          {([18, 30, 40, 50, 62] as number[]).map((cx, i) => (
            <motion.line
              key={cx}
              x1={cx}
              y1={32 - (i % 2) * 4}
              x2={cx + (i - 2) * 1.5}
              y2={18 - (i % 2) * 3}
              stroke="#8b6553"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.12, delay: i * 0.03 }}
              style={{ transformOrigin: `${cx}px 32px` }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  </svg>
);

const CatButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={styles.catButtonWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={() => history.push('/playground')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          history.push('/playground');
        }
      }}
    >
      {/* Left side paw — reaches from left bottom */}
      <motion.div
        className={styles.catPawLeft}
        initial={false}
        animate={
          isPressed
            ? { y: -22, x: 6, rotate: -30, scale: 1.15 }
            : isHovered
              ? {
                  y: [-30, -22, -28, -24, -30],
                  x: [0, 5, 2, 6, 0],
                  rotate: [-42, -28, -35, -25, -42],
                  scale: 1,
                }
              : { y: 30, x: -10, rotate: -55, scale: 0.9 }
        }
        transition={
          isPressed
            ? { duration: 0.12, ease: 'easeOut' }
            : isHovered
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
        }
      >
        <PawSVG grabbing={isPressed} />
      </motion.div>

      {/* Right side paw — reaches from right bottom */}
      <motion.div
        className={styles.catPawRight}
        initial={false}
        animate={
          isPressed
            ? { y: -18, x: -6, rotate: 28, scale: 1.15 }
            : isHovered
              ? {
                  y: [-26, -18, -24, -16, -26],
                  x: [0, -4, -1, -6, 0],
                  rotate: [40, 26, 34, 22, 40],
                  scale: 1,
                }
              : { y: 30, x: 10, rotate: 52, scale: 0.9 }
        }
        transition={
          isPressed
            ? { duration: 0.12, ease: 'easeOut' }
            : isHovered
              ? { duration: 2.1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }
              : { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
        }
      >
        <PawSVG grabbing={isPressed} />
      </motion.div>

      {/* The actual button */}
      <motion.button
        className={styles.catBtn}
        tabIndex={-1}
        animate={
          isPressed
            ? { y: 6, boxShadow: '0 0px 0 #000' }
            : isHovered
              ? { y: 2, boxShadow: '0 2px 0 #000' }
              : { y: 0, boxShadow: '0 6px 0 #000' }
        }
        transition={{ duration: 0.1 }}
      >
        Get Started
      </motion.button>
    </div>
  );
};

export default CatButton;

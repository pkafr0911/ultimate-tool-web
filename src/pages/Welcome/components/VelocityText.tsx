import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useMotionValue,
  useAnimationFrame,
} from 'framer-motion';
import styles from '../styles.less';

function wrapValue(min: number, max: number, v: number): number {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

interface VelocityRowProps {
  text: string;
  baseVelocity: number;
  outline?: boolean;
}

const VelocityRow: React.FC<VelocityRowProps> = ({ text, baseVelocity, outline }) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(baseX, (v) => `${wrapValue(-25, -50, v)}%`);

  const directionFactor = useRef<number>(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * Math.abs(velocityFactor.get()) * (delta / 1000);
    baseX.set(baseX.get() + moveBy);
  });

  const cls = outline
    ? `${styles.velocityText} ${styles.velocityTextOutline}`
    : styles.velocityText;

  return (
    <motion.div className={styles.velocityRow} style={{ x }}>
      <span className={cls}>{text}</span>
      <span className={cls}>{text}</span>
      <span className={cls}>{text}</span>
      <span className={cls}>{text}</span>
    </motion.div>
  );
};

const VelocityText: React.FC = () => {
  return (
    <div className={styles.velocitySection}>
      <VelocityRow baseVelocity={-2} text="ULTIMATE TOOLS · BUILD FASTER · STAY PRIVATE · " />
      <VelocityRow baseVelocity={2} text="ZERO INSTALLS · 100% BROWSER · OPEN SOURCE · " outline />
    </div>
  );
};

export default VelocityText;

import React from 'react';
import styles from '../styles.less';
export default function VelocityText() {
  return (
    <div className={styles.velocitySection}>
      <div className={styles.velocityText}>ULTIMATE TOOLS · BUILD FASTER · STAY PRIVATE ·</div>
      <div className={`${styles.velocityText} ${styles.velocityTextOutline}`}>
        ZERO INSTALLS · 100% BROWSER · OPEN SOURCE ·
      </div>
    </div>
  );
}

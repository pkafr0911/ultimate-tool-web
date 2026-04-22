import React from 'react';
import { motion } from 'framer-motion';
import { history } from 'umi';
import styles from '../styles.less';
import { stickyCards } from '../constants';

const cardIcons: Record<string, string> = {
  Playground: '🚀',
  'Utility Tools': '🛠️',
  'Visual Tools': '🎨',
  Editor: '📝',
};

const QuickAccessSection = () => {
  return (
    <div className={styles.quickAccessSection}>
      <motion.div
        className={styles.quickAccessHeader}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.sectionEyebrow}>Jump right in</span>
        <h2>Quick Access</h2>
        <p>Your most-used categories, one click away.</p>
      </motion.div>
      {stickyCards.map((card, index) => {
        const isFolder = index % 2 === 0;
        return (
          <div
            key={card.id}
            className={styles.cardContainer}
            style={{ top: `${100 + index * 40}px` }}
          >
            <div className={styles.folderGrip}>
              {/* Folder tab ear */}
              {isFolder && <div className={styles.folderTab} style={{ background: card.color }} />}

              <motion.div
                className={`${styles.card} ${isFolder ? styles.folderCard : styles.fileCard}`}
                style={{ backgroundColor: card.color, cursor: 'pointer' }}
                onClick={() => history.push(card.path)}
                role="button"
                tabIndex={0}
                aria-label={`Open ${card.title} — ${card.description}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    history.push(card.path);
                  }
                }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
                  transition: { duration: 0.3 },
                }}
              >
                {/* File dog-ear fold */}
                {!isFolder && <div className={styles.fileEar} />}

                {/* Folder: ghost file lines decoration */}
                {isFolder && (
                  <div className={styles.folderLines}>
                    <span />
                    <span />
                    <span />
                  </div>
                )}

                {/* File: ruled lines decoration */}
                {!isFolder && <div className={styles.fileRulings} />}

                <motion.span
                  className={styles.cardIcon}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                >
                  {cardIcons[card.title] || '📦'}
                </motion.span>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <span className={styles.cardArrow}>→</span>
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickAccessSection;

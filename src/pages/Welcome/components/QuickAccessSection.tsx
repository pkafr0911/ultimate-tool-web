import React from 'react';
import { history } from 'umi';
import styles from '../styles.less';
import { stickyCards } from '../constants';

const QuickAccessSection = () => {
  return (
    <div className={styles.quickAccessSection}>
      {stickyCards.map((card, index) => (
        <div
          key={card.id}
          className={styles.cardContainer}
          style={{ top: `${100 + index * 40}px` }} // Staggered sticky top
        >
          <div
            className={styles.card}
            style={{ backgroundColor: card.color, cursor: 'pointer' }}
            onClick={() => history.push(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                history.push(card.path);
              }
            }}
          >
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickAccessSection;

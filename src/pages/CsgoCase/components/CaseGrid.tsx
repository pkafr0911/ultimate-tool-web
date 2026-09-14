import React from 'react';
import { DownOutlined, StarFilled } from '@ant-design/icons';
import { CaseItem, RARITY_CONFIG } from '../types';

interface CaseGridProps {
  items: CaseItem[];
  onSelectItem?: (item: CaseItem) => void;
}

export const CaseGrid: React.FC<CaseGridProps> = ({ items, onSelectItem }) => {
  return (
    <div className="case-grid-wrapper">
      {/* Indicator Banner */}
      <div className="grid-header-banner">
        <DownOutlined className="down-arrow-icon" />
        <span className="banner-title">Items that might be in this case:</span>
      </div>

      {/* Grid List */}
      <div className="items-grid">
        {items.map((item) => {
          const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG['mil-spec'];
          const isGold = item.rarity === 'gold';

          return (
            <div
              key={item.id}
              className={`grid-item-card ${isGold ? 'is-gold-item' : ''}`}
              onClick={() => onSelectItem && onSelectItem(item)}
            >
              {/* Background ambient glow */}
              <div
                className="item-glow"
                style={{
                  background: `radial-gradient(ellipse at bottom, ${config.color}22 0%, transparent 75%)`,
                }}
              />

              {/* Item Graphic / Icon */}
              <div className="item-image-container">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="grid-item-img" />
                ) : isGold ? (
                  <div className="gold-wreath-badge">
                    <StarFilled className="star-icon" />
                    <div className="gold-badge-text">RARE ITEM</div>
                  </div>
                ) : (
                  <div className="gun-placeholder">
                    <svg viewBox="0 0 100 50" className="gun-svg">
                      <path
                        d="M10 25 L40 25 L50 15 L80 15 L90 25 L85 35 L50 35 L40 45 L30 45 L35 35 L10 35 Z"
                        fill={config.color}
                        fillOpacity="0.85"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Item Text Info */}
              <div className="item-details">
                <div className="weapon-title">{item.name}</div>
                <div className="skin-title">{item.skin}</div>
              </div>

              {/* Bottom Rarity Color Footer Bar */}
              <div className="rarity-bar" style={{ backgroundColor: config.color }}>
                {isGold && <span className="gold-star-text">★ Rare Special Item ★</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

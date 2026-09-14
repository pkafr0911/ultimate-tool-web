import React, { useEffect, useRef, useState } from 'react';
import { CaseItem, RARITY_CONFIG } from '../types';
import { soundManager } from '../utils/soundEffects';

interface ReelSpinnerProps {
  items: CaseItem[];
  isSpinning: boolean;
  targetItem: CaseItem | null;
  onSpinEnd: (winner: CaseItem) => void;
  fastSpin?: boolean;
}

const ITEM_WIDTH = 180; // width of each item card + gap
const TOTAL_REEL_ITEMS = 60;
const WINNER_INDEX = 48; // position of winning item in reel strip

export const ReelSpinner: React.FC<ReelSpinnerProps> = ({
  items,
  isSpinning,
  targetItem,
  onSpinEnd,
  fastSpin = false,
}) => {
  const [reelItems, setReelItems] = useState<CaseItem[]>([]);
  const reelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  const lastTickIndexRef = useRef<number>(-1);

  // Generate random reel strip with target item placed at WINNER_INDEX
  useEffect(() => {
    if (items.length === 0) return;

    const newReel: CaseItem[] = [];
    for (let i = 0; i < TOTAL_REEL_ITEMS; i++) {
      if (i === WINNER_INDEX && targetItem) {
        newReel.push(targetItem);
      } else {
        const randomIndex = Math.floor(Math.random() * items.length);
        newReel.push(items[randomIndex]);
      }
    }
    setReelItems(newReel);
  }, [items, targetItem]);

  // Handle spin animation trigger
  useEffect(() => {
    if (!isSpinning || !targetItem || !reelRef.current || !containerRef.current) return;

    soundManager.playUnlock();

    const duration = fastSpin ? 1800 : 5500;
    const startTime = performance.now();

    // Container center offset
    const containerWidth = containerRef.current.clientWidth;
    const centerOffset = containerWidth / 2;

    // Target position: WINNER_INDEX * ITEM_WIDTH + (ITEM_WIDTH / 2) + slight random jitter (-35px to +35px) for realism!
    const jitter = (Math.random() - 0.5) * 70;
    const targetX = WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - centerOffset + jitter;
    const startX = 0;

    lastTickIndexRef.current = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Quartic Ease-Out curve for authentic CS:GO friction feel: 1 - Math.pow(1 - progress, 4)
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentX = startX + (targetX - startX) * ease;

      if (reelRef.current) {
        reelRef.current.style.transform = `translate3d(-${currentX}px, 0, 0)`;
      }

      // Check ticks: calculate which item is under center line
      const currentCenterPos = currentX + centerOffset;
      const currentItemIdx = Math.floor(currentCenterPos / ITEM_WIDTH);

      if (currentItemIdx !== lastTickIndexRef.current && currentItemIdx >= 0) {
        soundManager.playTick();
        lastTickIndexRef.current = currentItemIdx;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete!
        onSpinEnd(targetItem);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSpinning]);

  return (
    <div className="csgo-reel-container" ref={containerRef}>
      {/* Outer Golden Indicator Line & Triangles */}
      <div className="reel-indicator-top" />
      <div className="reel-indicator-line" />
      <div className="reel-indicator-bottom" />

      {/* Reel Items Viewport */}
      <div className="reel-viewport">
        <div className="reel-strip" ref={reelRef}>
          {reelItems.map((item, idx) => {
            const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG['mil-spec'];
            return (
              <div
                key={`${item.id}-${idx}`}
                className={`reel-item-card rarity-${item.rarity}`}
                style={{ width: `${ITEM_WIDTH - 8}px` }}
              >
                {/* Ambient Rarity Radial Glow */}
                <div
                  className="card-ambient-glow"
                  style={{
                    background: `radial-gradient(circle at center, ${config.color}33 0%, transparent 70%)`,
                  }}
                />

                {/* Item Graphics / Icon */}
                <div className="card-image-wrap">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="card-img" />
                  ) : item.rarity === 'gold' ? (
                    <div className="gold-knife-icon">★</div>
                  ) : (
                    <div className="gun-svg-placeholder">
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

                {/* Item Name & Skin */}
                <div className="card-info">
                  <div className="item-weapon-name">{item.name}</div>
                  <div className="item-skin-name">{item.skin}</div>
                </div>

                {/* Rarity Bar Footer */}
                <div className="card-rarity-bar" style={{ backgroundColor: config.color }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlocking Container Status Bar */}
      {isSpinning && (
        <div className="unlocking-bar-container">
          <div className="unlocking-bar-pulse" />
          <div className="unlocking-text">Unlocking Container...</div>
        </div>
      )}
    </div>
  );
};

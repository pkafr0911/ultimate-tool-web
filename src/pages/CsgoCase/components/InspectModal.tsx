import React, { useEffect, useRef } from 'react';
import { Modal, Button, Tag, Space } from 'antd';
import { EyeOutlined, ReloadOutlined, ShoppingCartOutlined, TrophyOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import { CaseItem, RARITY_CONFIG, UnboxedItem } from '../types';

interface InspectModalProps {
  open: boolean;
  unboxedItem: UnboxedItem | null;
  onClose: () => void;
  onOpenAgain: () => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({
  open,
  unboxedItem,
  onClose,
  onOpenAgain,
}) => {
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !unboxedItem || !threeCanvasRef.current) return;

    const canvas = threeCanvasRef.current;
    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create 3D Rarity Ambient Floating Particles
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const rarityConfig = RARITY_CONFIG[unboxedItem.item.rarity] || RARITY_CONFIG['mil-spec'];
    const baseColor = new THREE.Color(rarityConfig.color);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    let animId: number;
    const animate = () => {
      particles.rotation.y += 0.003;
      particles.rotation.x += 0.001;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [open, unboxedItem]);

  if (!unboxedItem) return null;

  const item = unboxedItem.item;
  const config = RARITY_CONFIG[item.rarity] || RARITY_CONFIG['mil-spec'];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      className="inspect-win-modal"
      width={540}
    >
      <div className="inspect-modal-content">
        {/* Three.js Particle Background Canvas */}
        <canvas ref={threeCanvasRef} className="three-bg-canvas" />

        <div className="modal-header-badge">
          <Tag color={config.color} className="rarity-tag">
            {config.name.toUpperCase()}
          </Tag>
          {unboxedItem.isStatTrak && (
            <Tag color="#ff6600" className="stattrak-tag">
              StatTrak™
            </Tag>
          )}
        </div>

        {/* Item Name */}
        <div className="item-title-section">
          <h2 className="weapon-name">{item.name}</h2>
          <h1 className="skin-name" style={{ color: config.color }}>
            {item.skin}
          </h1>
        </div>

        {/* Visual Item Rendering */}
        <div className="weapon-preview-container">
          {item.image ? (
            <img src={item.image} alt={item.name} className="preview-img" />
          ) : item.rarity === 'gold' ? (
            <div className="gold-reveal-badge">
              <TrophyOutlined className="gold-trophy-icon" />
              <div className="gold-item-title">SPECIAL ITEM UNLOCKED</div>
            </div>
          ) : (
            <div className="preview-gun-placeholder">
              <svg viewBox="0 0 100 50" className="gun-svg-large">
                <path
                  d="M10 25 L40 25 L50 15 L80 15 L90 25 L85 35 L50 35 L40 45 L30 45 L35 35 L10 35 Z"
                  fill={config.color}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Item Stats & Float */}
        <div className="item-wear-stats">
          <div className="wear-label">
            Wear: <span className="wear-val">{unboxedItem.wear}</span>
          </div>
          <div className="float-label">
            Float Value: <span className="float-val">{unboxedItem.floatValue.toFixed(7)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              block
              icon={<ReloadOutlined />}
              onClick={onOpenAgain}
              className="open-again-btn"
            >
              TRY AGAIN / OPEN ANOTHER
            </Button>
            <Button block icon={<ShoppingCartOutlined />} onClick={onClose}>
              CLAIM TO INVENTORY
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

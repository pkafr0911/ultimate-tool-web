import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useLenis } from 'lenis/react';
import styles from '../styles.less';

const Scene3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const innerMeshRef = useRef<THREE.Mesh | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const frameRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const isDarkRef = useRef<boolean>(false);

  // Track dark mode
  useEffect(() => {
    const check = () => {
      isDarkRef.current = document.body.classList.contains('dark-mode');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Subscribe to Lenis scroll to update rotation
  useLenis(({ progress }) => {
    scrollProgressRef.current = progress;
  });

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    // ── Outer icosahedron (wireframe) ──
    const geoOuter = new THREE.IcosahedronGeometry(1.6, 1);
    const matOuter = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const outerMesh = new THREE.Mesh(geoOuter, matOuter);
    scene.add(outerMesh);
    meshRef.current = outerMesh;

    // ── Inner solid icosahedron ──
    const geoInner = new THREE.IcosahedronGeometry(0.9, 0);
    const matInner = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      emissive: 0x2d1b69,
      shininess: 80,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
    });
    const innerMesh = new THREE.Mesh(geoInner, matInner);
    scene.add(innerMesh);
    innerMeshRef.current = innerMesh;

    // ── Ambient + directional lights ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0x6366f1, 2);
    dir1.position.set(3, 3, 3);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xf43f5e, 1.5);
    dir2.position.set(-3, -2, 2);
    scene.add(dir2);

    // ── Orbital rings ──
    const ringAccents = [0x6366f1, 0xa855f7, 0xf43f5e];
    const ringTilts = [0, Math.PI / 3, Math.PI / 1.5];
    const rings: THREE.Mesh[] = [];
    ringAccents.forEach((color, ri) => {
      const geoRing = new THREE.TorusGeometry(2.2 + ri * 0.25, 0.008, 8, 80);
      const matRing = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5 - ri * 0.1,
      });
      const ring = new THREE.Mesh(geoRing, matRing);
      ring.rotation.x = ringTilts[ri];
      ring.rotation.y = (ri * Math.PI) / 4;
      scene.add(ring);
      rings.push(ring);
    });
    ringsRef.current = rings;

    // ── Particle cloud ──
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.8 + Math.random() * 1.2;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geoParticles = new THREE.BufferGeometry();
    geoParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const matParticles = new THREE.PointsMaterial({
      color: 0x8b85ff,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(geoParticles, matParticles);
    scene.add(particles);

    // ── Resize observer ──
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(canvas);

    // ── Animation loop ──
    let last = performance.now();
    const animate = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      timeRef.current += delta;
      const t = timeRef.current;
      const sp = scrollProgressRef.current;

      // Color shift with dark mode
      const dark = isDarkRef.current;
      (matOuter as THREE.MeshBasicMaterial).color.set(dark ? 0x8b5cf6 : 0x6366f1);
      (matInner as THREE.MeshPhongMaterial).color.set(dark ? 0xc084fc : 0xa855f7);

      // Scroll drives rotation: full scroll = 2 full turns on Y, 1 on X
      const scrollRotY = sp * Math.PI * 4;
      const scrollRotX = sp * Math.PI * 2;

      outerMesh.rotation.y = scrollRotY + t * 0.15;
      outerMesh.rotation.x = scrollRotX + Math.sin(t * 0.2) * 0.3;
      outerMesh.rotation.z = t * 0.08;

      innerMesh.rotation.y = -scrollRotY * 0.8 - t * 0.2;
      innerMesh.rotation.x = scrollRotX * 0.6 + Math.cos(t * 0.3) * 0.2;

      // Rings orbit
      rings[0].rotation.z = scrollRotY * 0.5 + t * 0.1;
      rings[1].rotation.z = -scrollRotY * 0.4 + t * 0.07;
      rings[1].rotation.y = scrollRotX * 0.3 + t * 0.05;
      rings[2].rotation.x = scrollRotY * 0.3 - t * 0.09;
      rings[2].rotation.z = t * 0.06;

      // Particle cloud drifts
      particles.rotation.y = t * 0.03 + sp * 1.5;
      particles.rotation.x = t * 0.02;

      // Breathe scale
      const breathe = 1 + Math.sin(t * 0.8) * 0.04;
      outerMesh.scale.setScalar(breathe);

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const cleanup = init();
    return () => {
      cleanup?.();
    };
  }, [init]);

  return <canvas ref={canvasRef} className={styles.scene3d} />;
};

export default Scene3D;

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Block, HEIGHT, RETAINED_LAYERS, TowerGame } from './model';
import styles from './styles.less';

export default function Scene({ game }: { game: TowerGame }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setClearColor('#f4eee5');
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff7eb', '#b9a8bf', 2.8));
    const sun = new THREE.DirectionalLight('#fff2da', 3);
    sun.position.set(5, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    scene.add(sun.target);
    const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 300);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.64 });
    const tower = new THREE.InstancedMesh(geometry, material, RETAINED_LAYERS);
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.frustumCulled = false;
    scene.add(tower);
    const movingMaterial = material.clone();
    const moving = new THREE.Mesh(geometry, movingMaterial);
    moving.castShadow = true;
    moving.receiveShadow = true;
    scene.add(moving);
    const debris = Array.from({ length: 8 }, () => {
      const m = new THREE.Mesh(geometry, material.clone());
      m.castShadow = true;
      scene.add(m);
      return m;
    });
    const supportMaterial = new THREE.MeshStandardMaterial({ color: '#c0b4b5', roughness: 0.9 });
    const support = new THREE.Mesh(geometry, supportMaterial);
    support.castShadow = true;
    support.receiveShadow = true;
    scene.add(support);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: '#e9e0d7', roughness: 1 });
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.35, 64), groundMaterial);
    ground.position.y = -0.47;
    ground.receiveShadow = true;
    scene.add(ground);
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: '#fffaf1',
      transparent: true,
      opacity: 0,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    scene.add(edges);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let revision = -1;
    let frame = 0;
    let previous = performance.now();
    let center = new THREE.Vector3(0, 1, 0);
    let half = 7;
    let resetScore = 0;
    const palette = [
      '#c78879',
      '#e3a083',
      '#deb792',
      '#c9baa4',
      '#b4afc4',
      '#959cbe',
      '#87abb8',
      '#9eb8ab',
    ];
    function tint(level: number) {
      const t = level / 5;
      color.set(palette[Math.floor(t) % palette.length]);
      return color.lerp(new THREE.Color(palette[(Math.floor(t) + 1) % palette.length]), t % 1);
    }
    // Long runs retain the latest layers and a consolidated lower support.
    const offset = () => Math.max(0, game.layers[0].level * HEIGHT - 8);
    const y = (block: Block) => block.level * HEIGHT - offset();
    const resize = () => {
      renderer.setSize(element.clientWidth, element.clientHeight, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const place = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || failed) return;
      event.preventDefault();
      element.focus({ preventScroll: true });
      game.place();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!event.repeat) game.pause();
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat) game.place();
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      if (!game.paused) game.pause();
      setFailed(true);
    };
    renderer.domElement.addEventListener('pointerdown', place);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    element.addEventListener('keydown', key);
    const animate = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      game.tick(delta);
      if (revision !== game.revision) {
        revision = game.revision;
        tower.count = game.layers.length;
        game.layers.forEach((block, i) => {
          dummy.position.set(block.x, y(block), block.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(block.w, HEIGHT, block.d);
          dummy.updateMatrix();
          tower.setMatrixAt(i, dummy.matrix);
          tower.setColorAt(i, tint(block.level));
        });
        tower.instanceMatrix.needsUpdate = true;
        if (tower.instanceColor) tower.instanceColor.needsUpdate = true;
        const first = game.layers[0];
        const supportHeight = y(first) - HEIGHT / 2 + 0.3;
        support.visible = first.level > 0;
        support.position.set(first.x, supportHeight / 2 - 0.3, first.z);
        support.scale.set(first.w, Math.max(0.01, supportHeight), first.d);
      }
      const active = game.moving;
      moving.visible = game.phase === 'playing' || game.phase === 'ready';
      moving.position.set(active.x, y(active), active.z);
      moving.scale.set(active.w, HEIGHT, active.d);
      movingMaterial.color.copy(tint(active.level));
      if (game.phase === 'ready') {
        moving.position.x = Math.sin(now / 1700) * 3;
        if (reduced.matches) moving.position.x = 1.3;
      }
      debris.forEach((mesh, i) => {
        const slice = game.slices[i];
        mesh.visible = !!slice && !reduced.matches;
        if (!slice) return;
        const t = slice.age;
        mesh.position.set(
          slice.x + (slice.axis === 'x' ? slice.direction * t : 0),
          y(slice) - 4 * t * t,
          slice.z + (slice.axis === 'z' ? slice.direction * t : 0),
        );
        mesh.scale.set(slice.w, HEIGHT, slice.d);
        mesh.rotation.set(
          slice.axis === 'z' ? t * slice.direction : 0,
          0,
          slice.axis === 'x' ? -t * slice.direction : 0,
        );
        (mesh.material as THREE.MeshStandardMaterial).color.copy(tint(slice.level));
      });
      const top = game.top;
      edges.position.set(top.x, y(top), top.z);
      edges.scale.set(top.w + 0.015, HEIGHT + 0.015, top.d + 0.015);
      edgesMaterial.opacity = game.streak > 0 ? Math.max(0, game.feedbackTime) * 0.65 : 0;
      const end = game.phase === 'gameOver';
      const target = new THREE.Vector3(
        top.x * 0.7,
        end ? Math.max(1, y(top) / 2) : Math.max(1, y(top) - 0.8),
        top.z * 0.7,
      );
      const aspect = element.clientWidth / Math.max(1, element.clientHeight);
      const targetHalf = end
        ? Math.max(7, y(top) * 0.5 + 3, 7 / aspect)
        : Math.max(6.5, 7 / aspect);
      if (game.score < resetScore || reduced.matches) {
        center.copy(target);
        half = targetHalf;
      }
      // Camera only rises between placements, then locks for precise timing.
      if (game.phase !== 'playing' || game.score === 0) {
        const factor = reduced.matches ? 1 : 1 - Math.exp(-delta * (end ? 2.5 : 16));
        center.lerp(target, factor);
        half += (targetHalf - half) * factor;
      }
      // Resizing must reframe even while a block is moving.
      const viewHalf = Math.max(half, 7 / aspect);
      camera.left = -viewHalf * aspect;
      camera.right = viewHalf * aspect;
      camera.top = viewHalf;
      camera.bottom = -viewHalf;
      camera.position.copy(center).add(new THREE.Vector3(18, 17, 18));
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      sun.position.set(center.x + 5, center.y + 15, center.z + 8);
      sun.target.position.copy(center);
      resetScore = game.score;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', place);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      element.removeEventListener('keydown', key);
      tower.dispose();
      geometry.dispose();
      material.dispose();
      movingMaterial.dispose();
      debris.forEach((m) => (m.material as THREE.Material).dispose());
      ground.geometry.dispose();
      groundMaterial.dispose();
      supportMaterial.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [game]);
  return (
    <div
      className={styles.scene}
      ref={host}
      tabIndex={0}
      role="group"
      aria-label="Stack Tower play area. Tap, click, or press Space or Enter to place a block. Escape pauses."
    >
      {failed && (
        <div className={styles.fallback} role="alert">
          <span>▱</span>
          <h2>3D graphics unavailable</h2>
          <p>
            Enable WebGL or hardware acceleration and reload to play. Your saved best score stays on
            this device.
          </p>
        </div>
      )}
    </div>
  );
}

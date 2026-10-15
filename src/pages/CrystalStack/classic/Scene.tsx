import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { cells, ClassicGame, ClassicInput, Command, ghost, pieces } from './model';
import styles from './styles.less';
const keyMap: Record<string, Command> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'cw',
  a: 'left',
  d: 'right',
  s: 'down',
  x: 'cw',
  z: 'ccw',
  ' ': 'drop',
  c: 'hold',
  Shift: 'hold',
  Escape: 'pause',
};
export default function Scene({ game, input }: { game: ClassicGame; input: ClassicInput }) {
  const host = useRef<HTMLDivElement>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor('#0d1722');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-6, 6, 11, -11, 0.1, 100);
    camera.position.set(0, 9.5, 35);
    camera.lookAt(0, 9.5, 0);
    scene.add(new THREE.HemisphereLight('#f0f8ff', '#28384a', 2.4));
    const sun = new THREE.DirectionalLight('#ffffff', 3);
    sun.position.set(-7, 20, 12);
    scene.add(sun);
    const geometry = new RoundedBoxGeometry(0.92, 0.92, 0.65, 2, 0.07),
      material = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.13 });
    const blocks = new THREE.InstancedMesh(geometry, material, 208);
    blocks.frustumCulled = false;
    scene.add(blocks);
    const highlightGeometry = new THREE.BoxGeometry(0.7, 0.06, 0.015),
      highlightMaterial = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.32,
      });
    const highlights = new THREE.InstancedMesh(highlightGeometry, highlightMaterial, 208);
    highlights.frustumCulled = false;
    scene.add(highlights);
    const ghostGeometry = new THREE.EdgesGeometry(geometry),
      ghostMaterial = new THREE.LineBasicMaterial({
        color: '#defff6',
        transparent: true,
        opacity: 0.8,
      });
    const ghosts = Array.from({ length: 4 }, () => {
      const line = new THREE.LineSegments(ghostGeometry, ghostMaterial);
      scene.add(line);
      return line;
    });
    const gridPositions: number[] = [];
    for (let x = -5; x <= 5; x++) gridPositions.push(x, -0.5, -0.4, x, 19.5, -0.4);
    for (let y = -0.5; y <= 19.5; y++) gridPositions.push(-5, y, -0.4, 5, y, -0.4);
    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
    const gridMaterial = new THREE.LineBasicMaterial({ color: '#25394c' });
    scene.add(new THREE.LineSegments(gridGeometry, gridMaterial));
    const frameGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(10.25, 20.25, 0.85)),
      frameMaterial = new THREE.LineBasicMaterial({ color: '#708d9d' });
    const frameMesh = new THREE.LineSegments(frameGeometry, frameMaterial);
    frameMesh.position.set(0, 9.5, 0);
    scene.add(frameMesh);
    const dummy = new THREE.Object3D(),
      color = new THREE.Color();
    const resize = () => {
      const aspect = el.clientWidth / Math.max(el.clientHeight, 1),
        half = Math.max(10.5, 5.5 / aspect);
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const paint = () => {
      let count = 0;
      const add = (x: number, y: number, id: number) => {
        if (y < 2) return;
        dummy.position.set(x - 4.5, 21 - y, 0);
        dummy.updateMatrix();
        blocks.setMatrixAt(count, dummy.matrix);
        blocks.setColorAt(count, color.set(pieces[id].color));
        dummy.position.y += 0.33;
        dummy.position.z = 0.34;
        dummy.updateMatrix();
        highlights.setMatrixAt(count, dummy.matrix);
        count++;
      };
      game.board.forEach((id, i) => {
        if (id) add(i % 10, Math.floor(i / 10), id - 1);
      });
      if (game.active) cells(game.active).forEach((c) => add(c.x, c.y, game.active!.id));
      blocks.count = count;
      highlights.count = count;
      blocks.instanceMatrix.needsUpdate = true;
      highlights.instanceMatrix.needsUpdate = true;
      if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
      const landing = game.active ? cells(ghost(game.board, game.active)) : [];
      ghosts.forEach((m, i) => {
        m.visible = !!landing[i] && landing[i].y >= 2;
        if (landing[i]) m.position.set(landing[i].x - 4.5, 21 - landing[i].y, 0);
      });
      frameMaterial.color.set(game.flash > 0 ? '#baf3df' : '#708d9d');
      renderer.render(scene, camera);
    };
    game.renderInput = paint;
    const physical = new Map<string, Command>();
    const commandFor = (e: KeyboardEvent) =>
      keyMap[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    const down = (e: KeyboardEvent) => {
      const command = commandFor(e);
      if (!command) return;
      e.preventDefault();
      if (e.repeat || physical.has(e.code)) return;
      physical.set(e.code, command);
      input.press(command);
    };
    const up = (e: KeyboardEvent) => {
      const command = physical.get(e.code);
      physical.delete(e.code);
      if (command && ![...physical.values()].includes(command)) input.release(command);
    };
    const blur = () => {
      physical.clear();
      input.clear();
    };
    const pointer = () => el.focus({ preventScroll: true });
    const lost = (e: Event) => {
      e.preventDefault();
      input.clear();
      if (!game.paused) game.pause();
      setFailed(true);
    };
    el.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    el.addEventListener('blur', blur);
    renderer.domElement.addEventListener('pointerdown', pointer);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    let frame = 0,
      previous = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      input.tick(dt);
      game.tick(dt);
      paint();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      game.renderInput = () => {};
      input.clear();
      el.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      el.removeEventListener('blur', blur);
      renderer.domElement.removeEventListener('pointerdown', pointer);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      blocks.dispose();
      highlights.dispose();
      [geometry, highlightGeometry, ghostGeometry, gridGeometry, frameGeometry].forEach((g) =>
        g.dispose(),
      );
      [material, highlightMaterial, ghostMaterial, gridMaterial, frameMaterial].forEach((m) =>
        m.dispose(),
      );
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [game, input]);
  return (
    <div
      className={styles.scene}
      ref={host}
      tabIndex={0}
      role="group"
      aria-label="Classic block board. Left and right move, down soft drops, up or X rotates clockwise, Z rotates counterclockwise, Space hard drops, C or Shift holds, Escape pauses."
    >
      {failed && (
        <div className={styles.fallback} role="alert">
          WebGL is unavailable. Enable hardware acceleration and reload to play.
        </div>
      )}
    </div>
  );
}

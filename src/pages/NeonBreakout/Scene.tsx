import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BreakoutGame, RADIUS } from './model';
import styles from './styles.less';
const colors: Record<string, string> = {
  standard: '#f361b9',
  armored: '#69d7fa',
  explosive: '#ffbe65',
  barrier: '#7985a3',
  wide: '#68ead1',
  slow: '#8ca9ff',
  multi: '#f78acd',
};
export default function Scene({ game, sound }: { game: BreakoutGame; sound: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const [failed, setFailed] = useState(false);
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
    renderer.setClearColor('#080c19');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-10, 10, 13, -13, 0.1, 100);
    camera.position.set(0, 8, 40);
    camera.lookAt(0, 12, 0);
    scene.add(new THREE.HemisphereLight('#dbe5ff', '#192444', 2.4));
    const light = new THREE.DirectionalLight('#ffffff', 3);
    light.position.set(-8, 15, 15);
    scene.add(light);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const sphere = new THREE.SphereGeometry(RADIUS, 16, 12);
    const materials: THREE.Material[] = [];
    const material = (color: string, emission = 0.3) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: emission,
        roughness: 0.3,
        metalness: 0.2,
      });
      materials.push(m);
      return m;
    };
    const mats = Object.fromEntries(
      Object.entries(colors).map(([key, color]) => [key, material(color)]),
    );
    const white = material('#f8ffff', 1);
    const dark = material('#131c33', 0);
    const line = material('#344467', 0.4);
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(geometry, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      scene.add(mesh);
      return mesh;
    };
    box(0, 12, -0.5, 18.2, 24, 0.4, dark);
    for (let x = -9; x <= 9; x += 1.5) box(x, 12, -0.28, 0.012, 24, 0.01, line);
    for (let y = 0; y <= 24; y += 1.5) box(0, y, -0.28, 18, 0.012, 0.01, line);
    box(-9.15, 12, 0, 0.15, 24.3, 0.5, mats.slow);
    box(9.15, 12, 0, 0.15, 24.3, 0.5, mats.slow);
    box(0, 24.15, 0, 18.4, 0.15, 0.5, mats.slow);
    const paddle = box(0, 1.4, 0.18, 2.8, 0.35, 0.5, mats.wide);
    const bricks = Array.from({ length: 45 }, () => box(0, 0, 0.1, 1, 1, 0.4, mats.standard));
    const marks = Array.from({ length: 90 }, () => box(0, 0, 0.34, 0.4, 0.06, 0.03, white));
    const balls = Array.from({ length: 3 }, () => {
      const m = new THREE.Mesh(sphere, white);
      scene.add(m);
      return m;
    });
    const drops = Array.from({ length: 24 }, () => box(0, 0, 0.25, 0.55, 0.55, 0.25, mats.wide));
    const particles = Array.from({ length: 100 }, () => ({
      mesh: box(0, 0, 0.2, 0.08, 0.08, 0.08, mats.standard),
      life: 0,
      vx: 0,
      vy: 0,
    }));
    let particleCursor = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let audio: AudioContext | undefined;
    let lastTone = 0;
    const unlock = () => {
      if (soundRef.current)
        try {
          audio ??= new AudioContext();
          void audio.resume();
        } catch {
          /* Optional audio. */
        }
    };
    game.onHit = (x, y, kind) => {
      if (kind !== 'paddle' && !reduced.matches)
        for (let i = 0; i < 8; i++) {
          const p = particles[particleCursor++ % particles.length];
          p.life = 0.4;
          p.mesh.position.set(x, y, 0.4);
          p.mesh.material = mats[kind] ?? mats.standard;
          p.vx = Math.cos((i * Math.PI) / 4) * 3;
          p.vy = Math.sin((i * Math.PI) / 4) * 3;
        }
      if (soundRef.current && audio && performance.now() - lastTone > 35) {
        lastTone = performance.now();
        const oscillator = audio.createOscillator(),
          gain = audio.createGain();
        oscillator.connect(gain);
        gain.connect(audio.destination);
        const now = audio.currentTime;
        oscillator.frequency.setValueAtTime(kind === 'paddle' ? 260 : 550, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      }
    };
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight,
        aspect = w / Math.max(h, 1),
        half = Math.max(12.7, 9.8 / aspect);
      renderer.setSize(w, h, false);
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const ray = new THREE.Raycaster(),
      plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const worldX = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((event.clientY - rect.top) / rect.height) * 2,
        ),
        camera,
      );
      return ray.ray.intersectPlane(plane, new THREE.Vector3())?.x ?? game.target;
    };
    let pointer: number | null = null,
      touchX = 0,
      touchPaddle = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      e.preventDefault();
      unlock();
      el.focus({ preventScroll: true });
      pointer = e.pointerId;
      renderer.domElement.setPointerCapture(pointer);
      touchX = worldX(e);
      touchPaddle = game.target;
      if (e.pointerType === 'mouse') game.move(touchX);
      game.launch();
    };
    const move = (e: PointerEvent) => {
      if (game.paused || !['serve', 'playing'].includes(game.phase)) return;
      if (e.pointerType === 'mouse') game.move(worldX(e));
      else if (pointer === e.pointerId) game.move(touchPaddle + worldX(e) - touchX);
    };
    const up = (e: PointerEvent) => {
      if (pointer === e.pointerId) pointer = null;
    };
    const keys = new Set<string>();
    const syncKeys = () => {
      game.axis =
        (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) -
        (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
    };
    const keydown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' ', 'Escape'].includes(key)) {
        e.preventDefault();
        unlock();
        if (key === ' ' && !e.repeat) game.launch();
        else if (key === 'Escape' && !e.repeat) {
          keys.clear();
          game.pause();
        } else {
          keys.add(key);
          syncKeys();
        }
      }
    };
    const keyup = (e: KeyboardEvent) => {
      keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      syncKeys();
    };
    const blur = () => {
      keys.clear();
      game.axis = 0;
    };
    const lost = (e: Event) => {
      e.preventDefault();
      if (!game.paused) game.pause();
      setFailed(true);
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('webglcontextlost', lost);
    el.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    el.addEventListener('blur', blur);
    let frame = 0,
      previous = performance.now();
    const render = (now: number) => {
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      game.tick(dt);
      paddle.position.x = game.paddle;
      paddle.scale.x = game.paddleWidth;
      bricks.forEach((m, i) => {
        const b = game.bricks[i];
        m.visible = !!b && b.hp > 0;
        if (b) {
          m.position.set(b.x, b.y, 0.1);
          m.scale.set(b.w, b.h, 0.4);
          m.material = b.kind === 'barrier' ? dark : mats[b.kind];
        }
        for (let j = 0; j < 2; j++) {
          const mark = marks[i * 2 + j];
          mark.visible =
            !!b && b.hp > 0 && b.kind !== 'standard' && (b.kind !== 'armored' || j < b.hp);
          if (b) {
            mark.position.set(b.x + (b.kind === 'armored' ? (j - 0.5) * 0.55 : 0), b.y, 0.34);
            mark.rotation.z = b.kind === 'explosive' && j === 1 ? Math.PI / 2 : 0;
            mark.scale.set(b.kind === 'barrier' ? 1.3 : 0.4, 0.07, 0.03);
            mark.material = mats[b.kind];
            if (b.kind === 'barrier') mark.position.y += (j - 0.5) * 0.55;
          }
        }
      });
      balls.forEach((m, i) => {
        const b = game.balls[i];
        m.visible = !!b;
        if (b) m.position.set(b.x, b.y, 0.4);
      });
      drops.forEach((m, i) => {
        const drop = game.drops[i];
        m.visible = !!drop;
        if (drop) {
          m.position.set(drop.x, drop.y, 0.3);
          m.rotation.z = now / 700;
          m.material = mats[drop.kind];
          m.scale.set(drop.kind === 'wide' ? 0.9 : 0.45, drop.kind === 'slow' ? 0.7 : 0.4, 0.2);
        }
      });
      particles.forEach((p) => {
        if (!game.paused) {
          p.life -= dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
        }
        p.mesh.visible = p.life > 0 && !reduced.matches;
      });
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      game.onHit = () => {};
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('webglcontextlost', lost);
      el.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      el.removeEventListener('blur', blur);
      geometry.dispose();
      sphere.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      canvas.remove();
      void audio?.close();
    };
  }, [game]);
  return (
    <div
      className={styles.scene}
      ref={host}
      tabIndex={0}
      role="group"
      aria-label="Neon Breakout arena. Move the mouse, drag on touch, or use left and right arrows. Click or Space launches. Escape pauses."
    >
      {failed && (
        <div className={styles.fallback} role="alert">
          <h2>WebGL unavailable</h2>
          <p>
            Enable hardware acceleration and reload to play. Saved progress remains on this device.
          </p>
        </div>
      )}
    </div>
  );
}

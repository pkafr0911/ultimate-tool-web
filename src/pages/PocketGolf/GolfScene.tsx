import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gateAt } from './course';
import { GolfGame } from './game';
import { aimPath, BALL_RADIUS, walls } from './physics';
import styles from './styles.less';

export default function GolfScene({ game }: { game: GolfGame }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8e9db');
    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    camera.position.set(14, 23.6, 14);
    camera.lookAt(0, 0, 0);
    const ambient = new THREE.HemisphereLight('#fff9e9', '#829b79', 2.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight('#fff2d8', 3.2);
    sun.position.set(-8, 18, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    let course = new THREE.Group();
    scene.add(course);
    const materials: THREE.Material[] = [];
    const mat = (color: string, roughness = 0.8) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness });
      materials.push(m);
      return m;
    };
    const grass = mat('#6f9d5b');
    const grassStripe = mat('#78a663');
    const stone = mat('#eee2c6');
    const soil = mat('#ba9270');
    const wood = mat('#aa6a42');
    const foliage = mat('#427b59');
    const leaves = mat('#76a267');
    const water = mat('#6ebcc0', 0.22);
    const white = mat('#fffdf0', 0.3);
    const coral = mat('#df694b');
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const sphereGeometry = new THREE.SphereGeometry(BALL_RADIUS, 24, 16);
    const coneGeometry = new THREE.ConeGeometry(0.65, 1.7, 7);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32);
    const leafGeometry = new THREE.IcosahedronGeometry(0.7, 1);
    const mesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      parent: THREE.Object3D = course,
    ) => {
      const m = new THREE.Mesh(geometry, material);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      material: THREE.Material,
    ) => {
      const m = mesh(boxGeometry, material, x, y, z);
      m.scale.set(w, h, d);
      return m;
    };
    const ball = mesh(sphereGeometry, white, 0, BALL_RADIUS, 0, scene);
    // A small coral seam makes the ball's roll readable.
    const seamGeometry = new THREE.TorusGeometry(BALL_RADIUS * 0.99, 0.012, 5, 32);
    const seam = new THREE.Mesh(seamGeometry, coral);
    ball.add(seam);
    const markerGeometry = new THREE.RingGeometry(0.29, 0.33, 40);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: '#fff9d6',
      side: THREE.DoubleSide,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.rotation.x = -Math.PI / 2;
    scene.add(marker);
    const dotGeometry = new THREE.SphereGeometry(0.045, 8, 6);
    const dots = Array.from({ length: 17 }, () => mesh(dotGeometry, white, 0, 0.08, 0, scene));
    const cupMaterial = mat('#233e32');
    let gateMesh: THREE.Mesh | null = null;
    let builtIndex = -1;
    let lastX = game.ball.x;
    let lastZ = game.ball.z;
    function fit() {
      const width = element.clientWidth;
      const height = element.clientHeight;
      renderer.setSize(width, height, false);
      // Project course corners into camera space so portrait and landscape both fit.
      camera.updateMatrixWorld();
      let maxX = 0;
      let maxY = 0;
      for (const x of [-game.hole.width / 2 - 1.4, game.hole.width / 2 + 1.4])
        for (const z of [-game.hole.depth / 2 - 1.4, game.hole.depth / 2 + 1.4]) {
          const p = new THREE.Vector3(x, 0, z).applyMatrix4(camera.matrixWorldInverse);
          maxX = Math.max(maxX, Math.abs(p.x));
          maxY = Math.max(maxY, Math.abs(p.y));
        }
      const aspect = width / Math.max(1, height);
      const half = Math.max(maxY + 0.5, (maxX + 0.5) / aspect);
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
    }
    function build() {
      scene.remove(course);
      course.clear();
      course = new THREE.Group();
      scene.add(course);
      builtIndex = game.index;
      const h = game.hole;
      box(0, -0.5, 0, h.width + 1.2, 0.9, h.depth + 1.2, soil);
      box(0, -0.09, 0, h.width, 0.18, h.depth, grass);
      for (let z = -h.depth / 2 + 0.5; z < h.depth / 2; z += 2)
        box(0, 0.003, z, h.width, 0.006, 1, grassStripe);
      for (const r of walls(h)) box(r.x, 0.2, r.z, r.w, 0.4, r.d, stone);
      for (const r of h.water) {
        box(r.x, 0.018, r.z, r.w, 0.025, r.d, water);
        for (let i = 0; i < 3; i++)
          box(
            r.x - r.w * 0.25 + i * r.w * 0.22,
            0.035,
            r.z + (i - 1) * 0.45,
            0.45,
            0.008,
            0.025,
            white,
          );
      }
      // The cup is inset visually; the ball sinks below the turf when captured.
      const cup = mesh(cylinderGeometry, cupMaterial, h.cup.x, 0.015, h.cup.z);
      cup.scale.set(0.34, 0.035, 0.34);
      cup.castShadow = false;
      const pole = mesh(cylinderGeometry, wood, h.cup.x, 0.95, h.cup.z);
      pole.scale.set(0.035, 1.9, 0.035);
      const flag = box(h.cup.x + 0.3, 1.68, h.cup.z, 0.6, 0.34, 0.035, coral);
      flag.rotation.z = -0.08;
      const tee = mesh(cylinderGeometry, stone, h.tee.x, 0.008, h.tee.z);
      tee.scale.set(0.32, 0.012, 0.32);
      tee.castShadow = false;
      gateMesh = h.gate ? box(h.gate.x, 0.33, h.gate.z, h.gate.w, 0.66, h.gate.d, wood) : null;
      for (let i = 0; i < 6; i++) {
        const x = (i % 2 ? 1 : -1) * (h.width / 2 + 0.65);
        const z = -h.depth / 2 + 1 + (Math.floor(i / 2) * (h.depth - 2)) / 2;
        box(x, 0.34, z, 0.13, 0.8, 0.13, wood);
        const tree = mesh(
          i % 2 ? coneGeometry : leafGeometry,
          i % 2 ? foliage : leaves,
          x,
          1.05,
          z,
        );
        tree.scale.setScalar(0.65);
      }
      for (const r of h.blocks)
        if (r.d > 2 && r.w > 2) {
          const shrub = mesh(leafGeometry, foliage, r.x, 0.7, r.z);
          shrub.scale.set(1.4, 0.8, 1.4);
        }
      lastX = game.ball.x;
      lastZ = game.ball.z;
      ball.rotation.set(0, 0, 0);
      fit();
    }
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function ground(event: PointerEvent) {
      const r = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - r.left) / r.width) * 2 - 1,
          (-(event.clientY - r.top) / r.height) * 2 + 1,
        ),
        camera,
      );
      return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    }
    let pointer: number | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || game.phase !== 'ready' || game.paused || pointer !== null) return;
      const projected = new THREE.Vector3(game.ball.x, BALL_RADIUS, game.ball.z).project(camera);
      const r = renderer.domElement.getBoundingClientRect();
      if (
        Math.hypot(
          e.clientX - (r.left + ((projected.x + 1) / 2) * r.width),
          e.clientY - (r.top + ((1 - projected.y) / 2) * r.height),
        ) > 46
      )
        return;
      e.preventDefault();
      element.focus({ preventScroll: true });
      pointer = e.pointerId;
      renderer.domElement.setPointerCapture(pointer);
      game.aiming = true;
      game.power = 0;
      game.notify();
    };
    const move = (e: PointerEvent) => {
      if (pointer !== e.pointerId || !game.aiming || game.paused) return;
      const p = ground(e);
      if (!p) return;
      const dx = game.ball.x - p.x;
      const dz = game.ball.z - p.z;
      game.angle = Math.atan2(dz, dx);
      game.power = Math.min(1, Math.hypot(dx, dz) / 4);
      game.notify();
    };
    const release = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      pointer = null;
      if (game.aiming && e.type === 'pointerup') game.shoot();
      game.aiming = false;
      game.notify();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (game.aiming) {
          game.aiming = false;
          pointer = null;
          game.notify();
        } else game.pause();
        return;
      }
      if (game.phase !== 'ready' || game.paused) return;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) return;
      e.preventDefault();
      if (e.key === ' ') {
        game.shoot();
        return;
      }
      game.aiming = true;
      const increment = e.shiftKey ? 0.015 : 0.055;
      if (e.key === 'ArrowLeft') game.angle -= increment;
      if (e.key === 'ArrowRight') game.angle += increment;
      if (e.key === 'ArrowUp') game.power = Math.min(1, game.power + 0.025);
      if (e.key === 'ArrowDown') game.power = Math.max(0.025, game.power - 0.025);
      game.notify();
    };
    const lost = () => {
      pointer = null;
      game.aiming = false;
      game.notify();
    };
    const contextLost = (e: Event) => {
      e.preventDefault();
      game.paused = true;
      game.notify();
      setError(true);
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', release);
    renderer.domElement.addEventListener('pointercancel', release);
    renderer.domElement.addEventListener('lostpointercapture', lost);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    element.addEventListener('keydown', key);
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    let frame = 0;
    let previous = performance.now();
    let stopped = false;
    const animate = (now: number) => {
      if (stopped) return;
      const dt = Math.min((now - previous) / 1000, 0.06);
      previous = now;
      game.tick(dt);
      if (builtIndex !== game.index) build();
      const b = game.ball;
      ball.position.set(b.x, BALL_RADIUS, b.z);
      ball.rotation.z -= (b.x - lastX) / BALL_RADIUS;
      ball.rotation.x += (b.z - lastZ) / BALL_RADIUS;
      lastX = b.x;
      lastZ = b.z;
      if (game.phase === 'holed') ball.position.y -= Math.min(0.5, game.elapsed * 0.8);
      ball.visible = game.phase !== 'recovering' && game.phase !== 'finished';
      marker.position.set(b.x, 0.025, b.z);
      marker.visible = game.phase === 'ready' && !game.paused;
      const path = aimPath(b, game.hole, game.angle, game.power, game.time);
      dots.forEach((dot, i) => {
        dot.visible = game.aiming && !game.paused;
        dot.position.set(path[i].x, 0.08, path[i].z);
      });
      const gate = gateAt(game.hole, game.time);
      if (gate && gateMesh) gateMesh.position.x = gate.x;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    build();
    frame = requestAnimationFrame(animate);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener('keydown', key);
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', release);
      renderer.domElement.removeEventListener('pointercancel', release);
      renderer.domElement.removeEventListener('lostpointercapture', lost);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      [
        boxGeometry,
        sphereGeometry,
        coneGeometry,
        cylinderGeometry,
        leafGeometry,
        seamGeometry,
        markerGeometry,
        dotGeometry,
      ].forEach((g) => g.dispose());
      [...materials, markerMaterial].forEach((m) => m.dispose());
      sun.shadow.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [game]);
  return (
    <div
      ref={host}
      className={styles.scene}
      tabIndex={0}
      role="group"
      aria-label="Mini golf course. Select the ball and drag backward to shoot. Or use left and right arrows to aim, up and down for power, and Space to shoot."
    >
      {error && (
        <div className={styles.fallback} role="alert">
          <span>⚑</span>
          <h2>The course needs WebGL</h2>
          <p>
            Your browser could not start or lost its 3D graphics context. Enable hardware
            acceleration and reload to play. Your saved round stays on this device.
          </p>
        </div>
      )}
    </div>
  );
}

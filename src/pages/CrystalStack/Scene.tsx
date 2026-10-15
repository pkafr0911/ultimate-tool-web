import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Axis, index, landing, shapes, StackGame, worldCells } from './model';
import styles from './styles.less';
export default function Scene({ game }: { game: StackGame }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor('#101824');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
    scene.add(new THREE.HemisphereLight('#f0f5ff', '#243849', 3));
    const light = new THREE.DirectionalLight('#fff2df', 3);
    light.position.set(7, 15, 8);
    scene.add(light);
    const cube = new THREE.BoxGeometry(0.94, 0.94, 0.94),
      edgesGeometry = new THREE.EdgesGeometry(cube);
    const solidMaterial = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.08 });
    const fadedMaterial = solidMaterial.clone();
    fadedMaterial.transparent = true;
    fadedMaterial.opacity = 0.22;
    fadedMaterial.depthWrite = false;
    const solid = new THREE.InstancedMesh(cube, solidMaterial, 300),
      faded = new THREE.InstancedMesh(cube, fadedMaterial, 300);
    solid.frustumCulled = false;
    faded.frustumCulled = false;
    scene.add(solid, faded);
    const activeMaterial = solidMaterial.clone();
    const active = Array.from({ length: 4 }, () => {
      const m = new THREE.Mesh(cube, activeMaterial);
      scene.add(m);
      return m;
    });
    const ghostMaterial = new THREE.LineBasicMaterial({
      color: '#f5f8ff',
      transparent: true,
      opacity: 0.9,
    });
    const ghost = Array.from({ length: 4 }, () => {
      const line = new THREE.LineSegments(edgesGeometry, ghostMaterial);
      scene.add(line);
      return line;
    });
    const rimMaterial = new THREE.LineBasicMaterial({
      color: '#617c94',
      transparent: true,
      opacity: 0.5,
    });
    const vertices: number[] = [];
    for (let y = -0.5; y <= 11.5; y++)
      for (const [x1, z1, x2, z2] of [
        [-2.5, -2.5, 2.5, -2.5],
        [2.5, -2.5, 2.5, 2.5],
        [2.5, 2.5, -2.5, 2.5],
        [-2.5, 2.5, -2.5, -2.5],
      ])
        vertices.push(x1, y, z1, x2, y, z2);
    for (const x of [-2.5, 2.5]) for (const z of [-2.5, 2.5]) vertices.push(x, -0.5, z, x, 11.5, z);
    const rimGeometry = new THREE.BufferGeometry();
    rimGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    scene.add(new THREE.LineSegments(rimGeometry, rimMaterial));
    const floor = new THREE.GridHelper(5, 5, '#91aec3', '#42576d');
    floor.position.y = -0.51;
    scene.add(floor);
    const baseGeometry = new THREE.BoxGeometry(5.5, 0.25, 5.5),
      baseMaterial = new THREE.MeshStandardMaterial({ color: '#25374c', roughness: 0.5 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.7;
    scene.add(base);
    const highlightGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(5.03, 1, 5.03)),
      highlightMaterial = new THREE.LineBasicMaterial({ color: '#a0e5d0' });
    const highlight = new THREE.LineSegments(highlightGeometry, highlightMaterial);
    scene.add(highlight);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let revision = -1;
    const resize = () => {
      const aspect = el.clientWidth / Math.max(1, el.clientHeight),
        half = Math.max(8, 5 / aspect);
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
    const keys = new Set<string>();
    let repeatTime = 0,
      repeated = false;
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const rotate: Record<string, [Axis, number]> = {
      q: ['y', -1],
      e: ['y', 1],
      a: ['x', -1],
      d: ['x', 1],
      w: ['z', -1],
      s: ['z', 1],
    };
    const down = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (
        !(key in movement) &&
        !(key in rotate) &&
        ![' ', 'Shift', 'c', 'Escape', '[', ']'].includes(key)
      )
        return;
      event.preventDefault();
      if (event.repeat) return;
      if (key in movement) {
        keys.clear();
        keys.add(key);
        repeatTime = 0;
        repeated = false;
        game.move(...movement[key]);
      } else if (key in rotate) game.rotate(...rotate[key]);
      else if (key === ' ') game.hardDrop();
      else if (key === 'c') game.hold();
      else if (key === 'Shift') {
        game.soft = true;
        if (game.mode === 'practice') game.lower();
      } else if (key === 'Escape') {
        keys.clear();
        game.pause();
      } else game.turn(key === '[' ? -1 : 1);
    };
    const up = (event: KeyboardEvent) => {
      keys.delete(event.key);
      if (event.key === 'Shift') game.soft = false;
    };
    const blur = () => {
      keys.clear();
      game.soft = false;
    };
    let pointer: number | null = null,
      pointerX = 0,
      pointerY = 0;
    const pointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary || pointer !== null) return;
      e.preventDefault();
      el.focus({ preventScroll: true });
      pointer = e.pointerId;
      pointerX = e.clientX;
      pointerY = e.clientY;
      renderer.domElement.setPointerCapture(pointer);
    };
    const pointerMove = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      game.orbit(
        game.cameraYaw - (e.clientX - pointerX) * 0.008,
        game.cameraPitch + (e.clientY - pointerY) * 0.006,
      );
      pointerX = e.clientX;
      pointerY = e.clientY;
    };
    const pointerUp = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      pointer = null;
      if (renderer.domElement.hasPointerCapture(e.pointerId))
        renderer.domElement.releasePointerCapture(e.pointerId);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      if (!game.paused) game.pause();
      setError(true);
    };
    el.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    el.addEventListener('blur', blur);
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('lostpointercapture', pointerUp);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    canvas.addEventListener('webglcontextlost', lost);
    let frame = 0,
      previous = performance.now();
    const render = (now: number) => {
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (keys.size && game.canPlay) {
        repeatTime += dt;
        const delay = repeated ? 0.09 : 0.22;
        if (repeatTime >= delay) {
          repeatTime = 0;
          repeated = true;
          const key = [...keys][0];
          game.move(...movement[key]);
        }
      }
      game.tick(dt);
      const angle = game.cameraYaw;
      const distance = Math.hypot(16, 13),
        horizontal = distance * Math.cos(game.cameraPitch);
      camera.position.set(
        Math.sin(angle) * horizontal,
        5 + distance * Math.sin(game.cameraPitch),
        Math.cos(angle) * horizontal,
      );
      camera.lookAt(0, 5, 0);
      if (revision !== game.revision) {
        revision = game.revision;
        const land = game.active ? landing(game.board, game.active) : null;
        const cells = land ? worldCells(land) : [];
        const low = cells.length ? Math.min(...cells.map((c) => c.y)) : 0;
        let solidCount = 0,
          fadedCount = 0,
          bestLayer = 0,
          bestCount = 0;
        for (let y = 0; y < 12; y++) {
          let count = 0;
          for (let z = 0; z < 5; z++)
            for (let x = 0; x < 5; x++) {
              const id = game.board[index(x, y, z)];
              if (!id) continue;
              count++;
              const obstructs =
                !!game.active &&
                y > low &&
                (x - 2) * Math.sin(angle) + (z - 2) * Math.cos(angle) > 0;
              const mesh = obstructs ? faded : solid,
                slot = obstructs ? fadedCount++ : solidCount++;
              dummy.position.set(x - 2, y, z - 2);
              dummy.updateMatrix();
              mesh.setMatrixAt(slot, dummy.matrix);
              mesh.setColorAt(slot, color.set(shapes[id - 1].color));
            }
          if (count > bestCount) {
            bestCount = count;
            bestLayer = y;
          }
        }
        for (const [mesh, count] of [
          [solid, solidCount],
          [faded, fadedCount],
        ] as const) {
          mesh.count = count;
          mesh.instanceMatrix.needsUpdate = true;
          if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
        const activeCells = game.active ? worldCells(game.active) : [];
        active.forEach((m, i) => {
          m.visible = !!activeCells[i];
          if (activeCells[i])
            m.position.set(activeCells[i].x - 2, activeCells[i].y, activeCells[i].z - 2);
        });
        ghost.forEach((m, i) => {
          m.visible = !!cells[i];
          if (cells[i]) m.position.set(cells[i].x - 2, cells[i].y, cells[i].z - 2);
        });
        highlight.visible = bestCount > 0 || game.cleared.length > 0;
        highlight.position.y = game.cleared[0] ?? bestLayer;
      }
      activeMaterial.color.set(game.rejection > 0 ? '#ff7d87' : shapes[game.active?.id ?? 0].color);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      el.removeEventListener('blur', blur);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('webglcontextlost', lost);
      solid.dispose();
      faded.dispose();
      [cube, edgesGeometry, rimGeometry, baseGeometry, highlightGeometry, floor.geometry].forEach(
        (g) => g.dispose(),
      );
      [
        solidMaterial,
        fadedMaterial,
        activeMaterial,
        ghostMaterial,
        rimMaterial,
        baseMaterial,
        highlightMaterial,
        ...(Array.isArray(floor.material) ? floor.material : [floor.material]),
      ].forEach((m) => m.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [game]);
  return (
    <div
      className={styles.scene}
      ref={host}
      tabIndex={0}
      role="group"
      aria-label="3D block well. Arrow keys move. Q E, A D, W S rotate. Space drops. C holds. Escape pauses. Drag to orbit the camera horizontally and vertically."
    >
      {error && (
        <div className={styles.fallback} role="alert">
          <h2>WebGL unavailable</h2>
          <p>
            Enable hardware acceleration and reload to play. Your best score stays on this device.
          </p>
        </div>
      )}
    </div>
  );
}

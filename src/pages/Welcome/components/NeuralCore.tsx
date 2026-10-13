import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from '../neural.less';

/** A self-contained scene; no textures, external models, or postprocessing. */
export default function NeuralCore({ reducedMotion }: { reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const resumeRef = useRef<() => void>(() => {});
  const pulseRef = useRef<() => void>(() => {});
  useEffect(() => {
    pauseRef.current = paused;
    resumeRef.current();
  }, [paused]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0, 9.6);
    const root = new THREE.Group();
    const shell = new THREE.Group();
    scene.add(root);
    root.add(shell);
    scene.add(new THREE.AmbientLight(0x6986ef, 2));
    const light = new THREE.PointLight(0x53e8ff, 30, 12);
    light.position.set(2, 3, 4);
    scene.add(light);
    const violet = new THREE.PointLight(0x9b50ff, 25, 10);
    violet.position.set(-3, -1, 2);
    scene.add(violet);

    const sphere = new THREE.IcosahedronGeometry(1.48, mobile ? 2 : 3);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(sphere),
      new THREE.LineBasicMaterial({ color: 0x55cce8, transparent: true, opacity: 0.22 }),
    );
    shell.add(wire);
    const nodes = new THREE.Points(
      sphere,
      new THREE.PointsMaterial({ color: 0xa2f4ff, size: 0.024, transparent: true, opacity: 0.85 }),
    );
    shell.add(nodes);
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.83, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0x173261,
        metalness: 0.65,
        roughness: 0.23,
        transparent: true,
        opacity: 0.86,
        emissive: 0x2545b7,
        emissiveIntensity: 0.5,
        flatShading: true,
      }),
    );
    root.add(inner);
    const filaments = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const filament = new THREE.Mesh(
        new THREE.TorusGeometry(1.03 + (i % 3) * 0.09, 0.004, 4, 80),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x9277ff : 0x71e6ff,
          transparent: true,
          opacity: 0.38,
        }),
      );
      filament.rotation.set(i * 0.72, i * 0.41, i * 0.3);
      filaments.add(filament);
    }
    root.add(filaments);
    const innerLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(inner.geometry),
      new THREE.LineBasicMaterial({ color: 0x7bdfff, transparent: true, opacity: 0.7 }),
    );
    inner.add(innerLines);
    const rings = new THREE.Group();
    root.add(rings);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.85 + i * 0.24, 0.008 + i * 0.002, 6, mobile ? 100 : 180),
        new THREE.MeshStandardMaterial({
          color: i === 1 ? 0x9c7aff : 0x68e9ff,
          emissive: i === 1 ? 0x6743de : 0x26899e,
          emissiveIntensity: 1.3,
          transparent: true,
          opacity: 0.65,
          metalness: 0.4,
          roughness: 0.25,
        }),
      );
      ring.rotation.set(0.7 + i * 0.6, i * 0.65, -0.4 + i * 0.5);
      rings.add(ring);
    }
    const positions: number[] = [];
    // Deterministic points keep the composition stable across mounts.
    for (let i = 0; i < (mobile ? 90 : 180); i++) {
      const y = 1 - (i / (mobile ? 90 : 180)) * 2;
      const a = i * 2.399963;
      const radius = 2.35 + (Math.sin(i * 17.13) + 1) * 0.35;
      const r = Math.sqrt(1 - y * y);
      positions.push(Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius);
    }
    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      ),
      new THREE.PointsMaterial({ color: 0x91afff, size: 0.018, transparent: true, opacity: 0.65 }),
    );
    scene.add(particles);

    // Keyframe tracks share one mixer, as in the Three.js keyframe example.
    const mixer = new THREE.AnimationMixer(root);
    const clip = new THREE.AnimationClip('core-breath', 8, [
      new THREE.NumberKeyframeTrack(
        '.position[y]',
        [0, 2, 4, 6, 8],
        [0, 0.09, 0, -0.09, 0],
        THREE.InterpolateSmooth,
      ),
      new THREE.VectorKeyframeTrack(
        '.scale',
        [0, 4, 8],
        [1, 1, 1, 1.035, 1.035, 1.035, 1, 1, 1],
        THREE.InterpolateSmooth,
      ),
    ]);
    mixer.clipAction(clip).play();
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let pulse = 0;
    let visible = true;
    let lost = false;
    const pointer = new THREE.Vector2();
    const move = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect();
      pointer.set(
        (event.clientX - bounds.left) / bounds.width - 0.5,
        (event.clientY - bounds.top) / bounds.height - 0.5,
      );
    };
    const leave = () => pointer.set(0, 0);
    pulseRef.current = () => {
      if (!reducedMotion && !pauseRef.current) pulse = 1;
    };
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (!lost) renderer.render(scene, camera);
    };
    const animate = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || lost) return;
      const delta = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      if (!reducedMotion && !pauseRef.current) {
        elapsed += delta;
        mixer.update(delta);
        shell.rotation.set(elapsed * 0.055, elapsed * 0.1, 0.18);
        inner.rotation.set(-elapsed * 0.13, elapsed * 0.16, 0.3);
        rings.rotation.y = elapsed * -0.075;
        filaments.rotation.set(elapsed * 0.07, -elapsed * 0.12, 0);
        particles.rotation.y = elapsed * 0.018;
        pulse *= Math.exp(-delta * 2.6);
        wire.material.opacity = 0.22 + pulse * 0.35;
        inner.material.emissiveIntensity = 0.55 + Math.sin(elapsed * 1.2) * 0.15 + pulse;
        const scroll = Math.max(
          0,
          Math.min(1, -element.getBoundingClientRect().top / window.innerHeight),
        );
        camera.position.x += (pointer.x * 0.55 - camera.position.x) * 0.04;
        camera.position.y += (-pointer.y * 0.4 + scroll * 0.35 - camera.position.y) * 0.04;
        camera.position.z = 8.6 + Math.exp(-elapsed * 1.3) + scroll * 0.65;
      }
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      if (!reducedMotion && !pauseRef.current) frame = requestAnimationFrame(animate);
    };
    const resume = () => {
      previous = 0;
      if (!frame && visible && !document.hidden && !lost) frame = requestAnimationFrame(animate);
    };
    resumeRef.current = resume;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) resume();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(element);
    const sizing = new ResizeObserver(resize);
    sizing.observe(element);
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      setReady(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', resume);
    resize();
    setReady(true);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizing.disconnect();
      document.removeEventListener('visibilitychange', resume);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) =>
            materials.add(material),
          );
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      pulseRef.current = () => {};
      resumeRef.current = () => {};
    };
  }, [reducedMotion]);

  return (
    <div className={styles.coreStage}>
      <div className={styles.coreFallback} aria-hidden="true" style={{ opacity: ready ? 0 : 1 }}>
        <i />
        <i />
        <i />
        <span />
      </div>
      <div
        ref={host}
        className={styles.coreCanvas}
        aria-hidden="true"
        style={{ opacity: ready ? 1 : 0 }}
      />
      <div className={styles.coreCaption}>
        <span>NEURAL CORE</span>
        <span>Geometry in motion</span>
      </div>
      {ready && !reducedMotion && (
        <div className={styles.coreControls}>
          <button type="button" onClick={() => pulseRef.current()} disabled={paused}>
            Pulse ↗
          </button>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
            {paused ? 'Resume motion' : 'Pause motion'}
          </button>
        </div>
      )}
    </div>
  );
}

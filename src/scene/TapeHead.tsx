import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { FRAME_FLOATS, type FaceTape } from '../lib/face-tape';

type Props = {
  tape: FaceTape;
  /** When true, advance through the tape on a loop. When false, show frame 0. */
  playing?: boolean;
};

/**
 * Replay-only counterpart to LiveHead. No camera, no FaceMesh — it just
 * renders the same wireframe materials by streaming through a recorded
 * `FaceTape` on each animation frame. Visual style (lines + glowing dots
 * + ambient rotation) intentionally mirrors LiveHead so the transition
 * from live to recorded is invisible to the viewer.
 */
export default function TapeHead({ tape, playing = false }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = host.clientWidth || 1;
    let h = host.clientHeight || 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    const cv = renderer.domElement;
    cv.style.position = 'absolute';
    cv.style.inset = '0';
    cv.style.width = '100%';
    cv.style.height = '100%';
    cv.style.pointerEvents = 'none';
    host.appendChild(cv);

    const scene = new THREE.Scene();
    const group = new THREE.Group();
    scene.add(group);

    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -2, 4);
    camera.position.z = 1;
    const updateCamera = () => {
      const aspect = w / h;
      camera.left = -0.5 * aspect;
      camera.right = 0.5 * aspect;
      camera.top = 0.5;
      camera.bottom = -0.5;
      camera.updateProjectionMatrix();
    };
    updateCamera();

    const N = 478;
    const positions = new Float32Array(N * 3);
    // Initialize at frame 0 of the tape so the head doesn't pop in at origin.
    if (tape.frameCount > 0) {
      positions.set(tape.data.subarray(0, FRAME_FLOATS));
    }
    const randoms = new Float32Array(N);
    for (let i = 0; i < N; i++) randoms[i] = Math.random();

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    // Tessellation lines.
    const tess = FACEMESH_TESSELATION as Array<[number, number]>;
    const tessIdx = new Uint16Array(tess.length * 2);
    for (let i = 0; i < tess.length; i++) {
      tessIdx[i * 2] = tess[i]![0];
      tessIdx[i * 2 + 1] = tess[i]![1];
    }
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', geom.attributes.position!);
    lineGeom.setIndex(new THREE.BufferAttribute(tessIdx, 1));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xeddabb,
      transparent: true,
      opacity: 0.22,
    });
    group.add(new THREE.LineSegments(lineGeom, lineMat));

    // Glowing dots — same shader as LiveHead.
    const pointMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPixelRatio: { value: dpr },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float aRandom;
        uniform float uPixelRatio;
        uniform float uTime;
        varying float vPulse;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vPulse = 0.78 + 0.22 * sin(uTime * 1.8 + aRandom * 6.283);
          gl_PointSize = (3.4 + 1.4 * vPulse) * uPixelRatio;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vPulse;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float core = smoothstep(0.14, 0.0, d);
          float halo = smoothstep(0.50, 0.16, d) * 0.45;
          float a = clamp(core + halo, 0.0, 1.0);
          gl_FragColor = vec4(0.96, 0.98, 1.0, a * vPulse);
        }
      `,
    });
    group.add(new THREE.Points(geom, pointMat));

    let raf = 0;
    const startedAt = performance.now();
    const playStartRef = { v: performance.now() };
    let lastPlaying = false;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const tNow = (performance.now() - startedAt) / 1000;
      pointMat.uniforms.uTime!.value = tNow;
      // Ambient ±5° head turn.
      group.rotation.y = Math.sin(tNow * 0.22) * 0.09;
      group.rotation.x = Math.sin(tNow * 0.16) * 0.04;

      const p = playingRef.current;
      if (p && tape.frameCount > 0) {
        if (!lastPlaying) {
          // Just started playing — anchor playback timeline.
          playStartRef.v = performance.now();
          lastPlaying = true;
        }
        const elapsedMs = performance.now() - playStartRef.v;
        const idx = Math.floor((elapsedMs * tape.fps) / 1000) % tape.frameCount;
        positions.set(
          tape.data.subarray(idx * FRAME_FLOATS, (idx + 1) * FRAME_FLOATS),
        );
        geom.attributes.position!.needsUpdate = true;
      } else if (lastPlaying) {
        // Just stopped — settle on frame 0 (mouth closed / "listening").
        positions.set(tape.data.subarray(0, FRAME_FLOATS));
        geom.attributes.position!.needsUpdate = true;
        lastPlaying = false;
      }

      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(() => {
      w = host.clientWidth || 1;
      h = host.clientHeight || 1;
      renderer.setSize(w, h);
      updateCamera();
    });
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geom.dispose();
      lineGeom.dispose();
      lineMat.dispose();
      pointMat.dispose();
      renderer.dispose();
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    };
  }, [tape]);

  return (
    <div ref={ref} className="relative w-full h-full" aria-hidden />
  );
}

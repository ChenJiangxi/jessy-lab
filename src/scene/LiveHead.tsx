import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  FaceMesh,
  FACEMESH_TESSELATION,
  type Results,
  type NormalizedLandmark,
} from '@mediapipe/face_mesh';

type Phase =
  | 'idle'
  | 'init-model'
  | 'requesting-camera'
  | 'starting-video'
  | 'tracking'
  | 'failed';

import { FRAME_FLOATS, type FaceTape } from '../lib/face-tape';

type Props = {
  onFailed?: () => void;
  onTapeRecorded?: (tape: FaceTape) => void;
};

const TAPE_FPS = 30;
const TAPE_DURATION_S = 5;
const TAPE_FRAME_COUNT = TAPE_FPS * TAPE_DURATION_S;
const TAPE_FRAME_INTERVAL_MS = 1000 / TAPE_FPS;
const PRE_REC_COUNTDOWN_S = 3;

const PHASE_LABEL: Record<Phase, string> = {
  idle: '',
  'init-model': 'loading model…',
  'requesting-camera': 'requesting camera…',
  'starting-video': 'starting video…',
  tracking: '',
  failed: '',
};

/**
 * Live wireframe head — webcam → MediaPipe FaceMesh (478 3D landmarks
 * with refined iris) → three.js LineSegments + Points using the official
 * FACEMESH_TESSELATION edge list.
 *
 * All MediaPipe assets are served locally from /face_mesh/ (copied from
 * node_modules to public). No external CDN at runtime.
 */
export default function LiveHead({ onFailed, onTapeRecorded }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [recState, setRecState] = useState<
    | { kind: 'idle' }
    | { kind: 'countdown'; secondsLeft: number }
    | { kind: 'recording'; secondsLeft: number }
    | { kind: 'saved' }
  >({ kind: 'idle' });

  const captureBufferRef = useRef<Float32Array | null>(null);
  const captureCountRef = useRef(0);
  const lastCaptureAtRef = useRef(0);
  const recStateRef = useRef<typeof recState>({ kind: 'idle' });
  useEffect(() => {
    recStateRef.current = recState;
  }, [recState]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const cancelledRef = useRef(false);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const pointMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const geomRef = useRef<THREE.BufferGeometry | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const animRef = useRef<number>(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });

  const updateCamera = () => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { w, h } = sizeRef.current;
    const aspect = w / h;
    // Camera frustum maps 1:1 to the container: x ∈ [-aspect/2, +aspect/2],
    // y ∈ [-0.5, +0.5]. Combined with the landmark→scene mapping below,
    // a vertex placed via that mapping lands on the same on-screen pixel
    // as the corresponding pixel in the object-fit:cover'd video.
    camera.left = -0.5 * aspect;
    camera.right = 0.5 * aspect;
    camera.top = 0.5;
    camera.bottom = -0.5;
    camera.updateProjectionMatrix();
  };

  const setupScene = () => {
    const host = containerRef.current!;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = {
      w: host.clientWidth || 1,
      h: host.clientHeight || 1,
    };
    renderer.setPixelRatio(dpr);
    renderer.setSize(sizeRef.current.w, sizeRef.current.h);
    renderer.setClearColor(0x000000, 0);
    // Position canvas absolutely so it overlays the ghost video.
    const cv = renderer.domElement;
    cv.style.position = 'absolute';
    cv.style.inset = '0';
    cv.style.width = '100%';
    cv.style.height = '100%';
    cv.style.pointerEvents = 'none';
    host.appendChild(cv);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const camera = new THREE.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, -2, 4);
    camera.position.z = 1;
    cameraRef.current = camera;
    updateCamera();

    const N = 478;
    const positions = new Float32Array(N * 3);
    positionsRef.current = positions;

    // Per-vertex random for shimmer-out-of-phase pulsing.
    const randoms = new Float32Array(N);
    for (let i = 0; i < N; i++) randoms[i] = Math.random();

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    geomRef.current = geom;

    const buildIdxAttr = (
      conns: ReadonlyArray<readonly [number, number]>,
    ): THREE.BufferAttribute => {
      const arr = new Uint16Array(conns.length * 2);
      for (let i = 0; i < conns.length; i++) {
        arr[i * 2] = conns[i]![0];
        arr[i * 2 + 1] = conns[i]![1];
      }
      return new THREE.BufferAttribute(arr, 1);
    };

    // Tessellation — almost-invisible filaments. Just enough to feel a
    // network, not enough to read as "face wireframe."
    {
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', geom.attributes.position!);
      lg.setIndex(
        buildIdxAttr(FACEMESH_TESSELATION as Array<[number, number]>),
      );
      group.add(
        new THREE.LineSegments(
          lg,
          new THREE.LineBasicMaterial({
            color: 0xeddabb,
            transparent: true,
            opacity: 0.22,
          }),
        ),
      );
    }

    // Glowing dots with out-of-phase pulse — reads like a breathing
    // constellation rather than a static face mask.
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
    pointMatRef.current = pointMat;
    group.add(new THREE.Points(geom, pointMat));

    const ro = new ResizeObserver(() => {
      sizeRef.current = {
        w: host.clientWidth || 1,
        h: host.clientHeight || 1,
      };
      renderer.setSize(sizeRef.current.w, sizeRef.current.h);
      updateCamera();
    });
    ro.observe(host);
  };

  const onResults = (results: Results) => {
    const lm = results.multiFaceLandmarks?.[0];
    landmarksRef.current = lm ?? null;
  };

  const runLoop = () => {
    const fm = faceMeshRef.current;
    const video = videoRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const positions = positionsRef.current;
    const geom = geomRef.current;
    if (!fm || !video || !renderer || !scene || !camera || !positions || !geom) {
      return;
    }

    let busy = false;
    let lastSent = -1;

    const startedAt = performance.now();
    const tick = () => {
      animRef.current = requestAnimationFrame(tick);

      // Drive the dot pulse uniform.
      const tNow = (performance.now() - startedAt) / 1000;
      if (pointMatRef.current) {
        pointMatRef.current.uniforms.uTime!.value = tNow;
      }

      // Subtle ambient rotation so the mesh is "looking around" rather
      // than fixated. Layered on top of landmark tracking — the head
      // still follows her movement, this adds gentle 3D life.
      const group = groupRef.current;
      if (group) {
        group.rotation.y = Math.sin(tNow * 0.22) * 0.09; // ≈±5°
        group.rotation.x = Math.sin(tNow * 0.16) * 0.04;
      }

      // Apply latest landmarks if any. Map each landmark through the same
      // object-fit:cover crop the video uses, then mirror X to match the
      // video's scaleX(-1). The mesh ends up exactly on the visible video.
      const landmarks = landmarksRef.current;
      if (landmarks && video.videoWidth > 0 && video.videoHeight > 0) {
        const VW = video.videoWidth;
        const VH = video.videoHeight;
        const { w: W, h: H } = sizeRef.current;
        const videoAR = VW / VH;
        const containerAR = W / H;

        let cropU = 0;
        let cropV = 0;
        if (videoAR > containerAR) {
          cropU = (1 - containerAR / videoAR) / 2;
        } else if (videoAR < containerAR) {
          cropV = (1 - videoAR / containerAR) / 2;
        }
        const visU = 1 - 2 * cropU;
        const visV = 1 - 2 * cropV;
        const aspect = W / H;

        const n = Math.min(landmarks.length, 478);
        for (let i = 0; i < n; i++) {
          const p = landmarks[i]!;
          const us = (p.x - cropU) / visU;
          const vs = (p.y - cropV) / visV;
          const mu = 1 - us; // mirror to match scaleX(-1) on the video
          positions[i * 3] = (mu - 0.5) * aspect;
          positions[i * 3 + 1] = -(vs - 0.5);
          positions[i * 3 + 2] = -p.z * 0.55;
        }
        geom.attributes.position!.needsUpdate = true;
      }

      renderer.render(scene, camera);

      // Capture frames into the tape buffer if recording is active.
      const rs = recStateRef.current;
      if (
        rs.kind === 'recording' &&
        captureBufferRef.current &&
        landmarksRef.current
      ) {
        const now = performance.now();
        if (now - lastCaptureAtRef.current >= TAPE_FRAME_INTERVAL_MS) {
          const idx = captureCountRef.current;
          if (idx < TAPE_FRAME_COUNT) {
            captureBufferRef.current.set(
              positions.subarray(0, FRAME_FLOATS),
              idx * FRAME_FLOATS,
            );
            captureCountRef.current = idx + 1;
            lastCaptureAtRef.current = now;
          }
          if (captureCountRef.current >= TAPE_FRAME_COUNT) {
            const tape: FaceTape = {
              fps: TAPE_FPS,
              frameCount: TAPE_FRAME_COUNT,
              data: captureBufferRef.current,
            };
            captureBufferRef.current = null;
            captureCountRef.current = 0;
            setRecState({ kind: 'saved' });
            onTapeRecorded?.(tape);
          }
        }
      }

      // Throttle send: only one in-flight frame; skip if same currentTime.
      if (
        !busy &&
        video.readyState >= 2 &&
        video.currentTime !== lastSent
      ) {
        busy = true;
        lastSent = video.currentTime;
        fm.send({ image: video })
          .catch(() => {
            /* swallow per-frame errors */
          })
          .finally(() => {
            busy = false;
          });
      }
    };
    tick();
  };

  const start = async () => {
    setPhase('init-model');
    setErrMsg(null);

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      setPhase('failed');
      setErrMsg('timed out — open DevTools Network tab to see which file stalled');
      onFailed?.();
    }, 25_000);
    const clearT = () => window.clearTimeout(timeoutId);

    try {
      const fm = new FaceMesh({
        locateFile: (file) => {
          const url = `/face_mesh/${file}`;
          console.log('[LiveHead] locateFile:', file, '→', url);
          return url;
        },
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      fm.onResults(onResults);

      console.log('[LiveHead] initialize() …');
      await fm.initialize();
      console.log('[LiveHead] initialize() done');
      if (timedOut || cancelledRef.current) {
        clearT();
        fm.close();
        return;
      }
      faceMeshRef.current = fm;

      setPhase('requesting-camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      if (timedOut || cancelledRef.current) {
        clearT();
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      setPhase('starting-video');
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (timedOut || cancelledRef.current) {
        clearT();
        return;
      }

      clearT();
      setupScene();
      setPhase('tracking');
      runLoop();
    } catch (e: any) {
      clearT();
      console.error('[LiveHead] start failed:', e);
      setErrMsg(e?.message ?? 'unknown error');
      setPhase('failed');
      onFailed?.();
    }
  };

  useEffect(() => {
    // Reset on (re-)mount — StrictMode in dev double-invokes the effect,
    // so without this the cleanup of the first mount leaves cancelledRef
    // permanently `true` and start() silently bails after initialize.
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        faceMeshRef.current?.close();
      } catch {
        /* ignore */
      }
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.dispose();
        const dom = renderer.domElement;
        if (dom.parentNode) dom.parentNode.removeChild(dom);
      }
      geomRef.current?.dispose();
    };
  }, []);

  const startRecording = () => {
    if (phase !== 'tracking' || recStateRef.current.kind !== 'idle') return;

    captureBufferRef.current = new Float32Array(
      TAPE_FRAME_COUNT * FRAME_FLOATS,
    );
    captureCountRef.current = 0;
    lastCaptureAtRef.current = 0;

    let n = PRE_REC_COUNTDOWN_S;
    setRecState({ kind: 'countdown', secondsLeft: n });
    const cdId = window.setInterval(() => {
      n--;
      if (n > 0) {
        setRecState({ kind: 'countdown', secondsLeft: n });
      } else {
        window.clearInterval(cdId);
        setRecState({ kind: 'recording', secondsLeft: TAPE_DURATION_S });
        let r = TAPE_DURATION_S;
        const recId = window.setInterval(() => {
          r--;
          if (r <= 0) {
            window.clearInterval(recId);
          } else if (recStateRef.current.kind === 'recording') {
            setRecState({ kind: 'recording', secondsLeft: r });
          }
        }, 1000);
      }
    }, 1000);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Hidden video — feeds FaceMesh, never displayed. */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
      />

      {/* REC button — only during live tracking, before any recording starts */}
      {phase === 'tracking' && recState.kind === 'idle' && onTapeRecorded && (
        <button
          onClick={startRecording}
          className="absolute top-2 right-2 z-10 font-mono text-[9px] tracking-[0.3em] uppercase text-[#f0e8dc]/60 hover:text-[#f0e8dc] border border-[#f0e8dc]/30 hover:border-[#f0e8dc]/65 rounded-full px-3 py-1 transition-colors pointer-events-auto"
        >
          ● REC
        </button>
      )}

      {/* Recording overlay — countdown + recording indicator */}
      {(recState.kind === 'countdown' ||
        recState.kind === 'recording' ||
        recState.kind === 'saved') && (
        <div className="absolute inset-x-0 top-2 flex items-center justify-center pointer-events-none">
          <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#f0e8dc]/85 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            {recState.kind === 'countdown' &&
              `STARTING IN ${recState.secondsLeft}…`}
            {recState.kind === 'recording' &&
              `● REC · ${recState.secondsLeft}s · 说点什么`}
            {recState.kind === 'saved' && 'SAVED ✓'}
          </div>
        </div>
      )}

      {phase !== 'tracking' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-auto px-4 text-center">
          {phase === 'idle' && (
            <button
              onClick={start}
              className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#f0e8dc]/75 hover:text-[#f0e8dc] border border-[#f0e8dc]/30 hover:border-[#f0e8dc]/65 rounded-full px-7 py-3.5 transition-colors"
            >
              ○&nbsp;&nbsp;scan to begin
            </button>
          )}
          {(phase === 'init-model' ||
            phase === 'requesting-camera' ||
            phase === 'starting-video') && (
            <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#f0e8dc]/65">
              {PHASE_LABEL[phase]}
            </div>
          )}
          {phase === 'failed' && (
            <>
              <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#f0e8dc]/55">
                camera unavailable
              </div>
              {errMsg && (
                <div className="font-mono text-[9px] tracking-[0.15em] text-[#f0e8dc]/35 max-w-[18em] leading-relaxed">
                  {errMsg}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

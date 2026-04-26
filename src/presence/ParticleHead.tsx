import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

/**
 * Particle-portrait head — distilled from sway-lab's particle-renderer.
 *
 * A grid of THREE.Points samples portrait.png as a texture. Each particle's
 * size + alpha is driven by the brightness of the pixel under it; the
 * result reads as a pointillist portrait. Amplitude (TTS RMS) drives a
 * subtle shimmer so the head "breathes" while she's speaking.
 *
 * Knobs you'll likely want to tune by eye:
 *   visHigh / visLow → which luminance range counts as "visible"
 *                      (lower visHigh = harder to see the brightest pixels)
 *   blackClip        → pixels darker than this are also hidden
 *   particleSize     → base dot size (px)
 *   spacing          → 1 = dense (slow), 3 = sparse (fast)
 */
export type ParticleHeadHandle = {
  setAmplitude: (v: number) => void;
  setDepth: (d: number) => void;
  setClarity: (c: number) => void;
};

type Props = {
  className?: string;
  portraitSrc?: string;
};

const VERTEX_SHADER = /* glsl */ `
  attribute vec2 aUv;
  attribute float aRandom;

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uParticleSize;
  uniform float uAmp;
  uniform float uClarity;
  uniform float uDepth;

  uniform float uVisHigh;
  uniform float uVisLow;
  uniform float uBlackClip;
  uniform float uSizeMin;
  uniform float uSizeMax;
  uniform float uSizePow;
  uniform float uAlphaMin;
  uniform float uAlphaPow;
  uniform float uShimmerAmp;
  uniform float uJitter;
  uniform vec3  uRestColor;
  uniform vec3  uHotColor;

  varying float vAlpha;
  varying vec3  vColor;

  float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec4 tex = texture2D(uTexture, aUv);
    float brightness = luma(tex.rgb);

    // visibility: bright pixels (background) fade out;
    //             too-dark pixels also clipped.
    float visibility = smoothstep(uVisLow, uVisHigh, brightness)
                     * smoothstep(0.01, uBlackClip, brightness);

    // base position + per-particle jitter so the grid doesn't read as a grid
    vec3 pos = position;
    pos.x += (aRandom * 2.0 - 1.0) * uJitter;
    pos.y += (fract(aRandom * 137.0) * 2.0 - 1.0) * uJitter;

    // shimmer: amplitude-driven micro-displacement (head breathes when speaking)
    float shimmerScale = uShimmerAmp * (0.30 + 1.4 * uAmp);
    pos.x += sin(position.x * 32.0 + uTime * 0.6 + aRandom * 6.28) * shimmerScale;
    pos.y += cos(position.y * 26.0 + uTime * 0.5 + aRandom * 3.14) * shimmerScale;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Particle size: darker pixels get bigger dots (so features stand out).
    float baseSize = uParticleSize * uPixelRatio;
    float sizeMult = mix(uSizeMin, uSizeMax, pow(1.0 - brightness, uSizePow));
    gl_PointSize = baseSize * sizeMult * visibility;

    // Color: lerp rest → hot by amplitude (subtle warm tint when speaking)
    vColor = mix(uRestColor, uHotColor, uAmp * 0.55);
    // Clarity raises the floor opacity over time.
    float clarityFloor = mix(0.45, 1.0, uClarity);
    vAlpha = visibility
           * mix(uAlphaMin, 1.0, pow(1.0 - brightness, uAlphaPow))
           * clarityFloor;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  varying vec3  vColor;
  uniform float uEdgeInner;
  uniform float uEdgeOuter;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(uEdgeInner, uEdgeOuter, dist);
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

const ParticleHead = forwardRef<ParticleHeadHandle, Props>(function ParticleHead(
  { className, portraitSrc = '/portrait.png' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ampRef = useRef(0);
  const targetAmp = useRef(0);
  const depthRef = useRef(0);
  const targetDepth = useRef(0);
  const clarityRef = useRef(0);
  const targetClarity = useRef(0);

  useImperativeHandle(
    ref,
    () => ({
      setAmplitude(v) {
        targetAmp.current = Math.max(0, Math.min(1, v));
      },
      setDepth(d) {
        targetDepth.current = Math.max(0, Math.min(4, d));
      },
      setClarity(c) {
        targetClarity.current = Math.max(0, Math.min(1, c));
      },
    }),
    [],
  );

  useEffect(() => {
    const container: HTMLDivElement | null = containerRef.current;
    if (!container) return;
    const host: HTMLDivElement = container;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
      });
    } catch {
      return;
    }

    let w = host.clientWidth || 1;
    let h = host.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
    camera.position.z = 1;

    let texture: THREE.Texture | null = null;
    let texW = 0;
    let texH = 0;
    let points: THREE.Points | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let rafId = 0;
    const clock = new THREE.Clock();

    /* spacing (px) — smaller = denser & slower. For a 420×540 box at dpr 2,
       spacing 2 is ~57k particles. Try 3 if you need a perf cushion. */
    const SPACING = 2;

    const PARAMS = {
      particleSize: 1.9,
      visHigh: 0.78,    // high-brightness fade start (above this = invisible bg)
      visLow: 0.98,
      blackClip: 0.06,  // pixels darker than this also hidden
      sizeMin: 0.30,
      sizeMax: 1.85,
      sizePow: 1.45,
      alphaMin: 0.40,
      alphaPow: 0.85,
      shimmerAmp: 0.0014,
      jitter: 0.00025,
      restColor: new THREE.Color('#3a2f45'),     // ink-soft
      hotColor: new THREE.Color('#d97744'),      // warm amber when speaking
      edgeInner: 0.30,
      edgeOuter: 0.50,
    };

    function destroyParticles() {
      if (!points) return;
      scene.remove(points);
      geometry?.dispose();
      material?.dispose();
      points = null;
      geometry = null;
      material = null;
    }

    function build(particleW: number, particleH: number) {
      destroyParticles();

      // Grid sized to fit the container while preserving the texture's
      // native aspect ratio (so the head isn't squashed).
      const viewportAspect = w / h;
      const texAspect = texW / texH;

      let visW = 1;
      let visH = 1;
      if (texAspect > viewportAspect) {
        visH = viewportAspect / texAspect;
      } else {
        visW = texAspect / viewportAspect;
      }

      const cols = Math.max(2, Math.floor(particleW / SPACING));
      const rows = Math.max(2, Math.floor(particleH / SPACING));
      const count = cols * rows;

      const positions = new Float32Array(count * 3);
      const uvs = new Float32Array(count * 2);
      const randoms = new Float32Array(count);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          positions[idx * 3 + 0] = (col / (cols - 1) - 0.5) * visW;
          positions[idx * 3 + 1] = -(row / (rows - 1) - 0.5) * visH;
          positions[idx * 3 + 2] = 0;
          uvs[idx * 2 + 0] = col / (cols - 1);
          uvs[idx * 2 + 1] = 1 - row / (rows - 1);
          randoms[idx] = Math.random();
        }
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
      geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTexture:      { value: texture },
          uTime:         { value: 0 },
          uPixelRatio:   { value: dpr },
          uParticleSize: { value: PARAMS.particleSize },
          uAmp:          { value: 0 },
          uClarity:      { value: 0 },
          uDepth:        { value: 0 },
          uVisHigh:      { value: PARAMS.visHigh },
          uVisLow:       { value: PARAMS.visLow },
          uBlackClip:    { value: PARAMS.blackClip },
          uSizeMin:      { value: PARAMS.sizeMin },
          uSizeMax:      { value: PARAMS.sizeMax },
          uSizePow:      { value: PARAMS.sizePow },
          uAlphaMin:     { value: PARAMS.alphaMin },
          uAlphaPow:     { value: PARAMS.alphaPow },
          uShimmerAmp:   { value: PARAMS.shimmerAmp },
          uJitter:       { value: PARAMS.jitter },
          uEdgeInner:    { value: PARAMS.edgeInner },
          uEdgeOuter:    { value: PARAMS.edgeOuter },
          uRestColor:    { value: PARAMS.restColor },
          uHotColor:     { value: PARAMS.hotColor },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);
    }

    // Load portrait, then build particles to its native aspect.
    const loader = new THREE.TextureLoader();
    loader.load(
      portraitSrc,
      (tex) => {
        texture = tex;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        const img = tex.image as HTMLImageElement;
        texW = img.naturalWidth || img.width;
        texH = img.naturalHeight || img.height;
        if (!texW || !texH) {
          texW = 768;
          texH = 1024;
        }
        build(w * dpr, h * dpr);
      },
      undefined,
      () => {
        /* image failed — leave the canvas blank */
      },
    );

    function animate() {
      rafId = requestAnimationFrame(animate);
      if (!material) return;

      // ease toward targets
      ampRef.current += (targetAmp.current - ampRef.current) * 0.15;
      depthRef.current += (targetDepth.current - depthRef.current) * 0.05;
      clarityRef.current += (targetClarity.current - clarityRef.current) * 0.04;

      const u = material.uniforms;
      u.uTime!.value = clock.getElapsedTime();
      u.uAmp!.value = ampRef.current;
      u.uDepth!.value = depthRef.current;
      u.uClarity!.value = clarityRef.current;

      renderer.render(scene, camera);
    }
    animate();

    function resize() {
      const nw = host.clientWidth || 1;
      const nh = host.clientHeight || 1;
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      renderer.setSize(w, h);
      if (texW && texH) build(w * dpr, h * dpr);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      destroyParticles();
      texture?.dispose();
      renderer.dispose();
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [portraitSrc]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden
      style={{ width: '100%', height: '100%' }}
    />
  );
});

export default ParticleHead;

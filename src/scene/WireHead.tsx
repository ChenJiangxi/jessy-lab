import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = { className?: string; portraitSrc?: string };

/**
 * Wireframe portrait head with depth.
 *
 * Treats portrait.png as a height map: bright pixels = back, dark pixels (eyes,
 * mouth, nose, brows) = forward. Vertices form a regular grid; foreground
 * score (derived from luminance) drives both Z displacement AND per-vertex
 * alpha — so the background fades out smoothly while the face features pop
 * forward in true 3D. Group oscillates ±20° on Y so the relief reads as a
 * rotating bust, not a flat tilt.
 */
export default function WireHead({
  className,
  portraitSrc = '/portrait.png',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

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
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, -2, 4);
    camera.position.z = 1;

    const updateCamera = () => {
      const aspect = w / h;
      const halfV = 0.6;
      if (aspect >= 1) {
        camera.left = -halfV * aspect;
        camera.right = halfV * aspect;
        camera.top = halfV;
        camera.bottom = -halfV;
      } else {
        camera.left = -halfV;
        camera.right = halfV;
        camera.top = halfV / aspect;
        camera.bottom = -halfV / aspect;
      }
      camera.updateProjectionMatrix();
    };
    updateCamera();

    const group = new THREE.Group();
    scene.add(group);

    let pointsObj: THREE.Points | null = null;
    let linesObj: THREE.LineSegments | null = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = portraitSrc;
    img.onload = () => {
      const SAMPLE_W = 100;
      const SAMPLE_H = Math.max(
        2,
        Math.round((SAMPLE_W * img.naturalHeight) / img.naturalWidth),
      );

      const cv = document.createElement('canvas');
      cv.width = SAMPLE_W;
      cv.height = SAMPLE_H;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
      const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;

      const luma = (col: number, row: number): number => {
        const idx = (row * SAMPLE_W + col) * 4;
        const r = data[idx]!;
        const g = data[idx + 1]!;
        const b = data[idx + 2]!;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      };

      // Foreground score: 1 in face/feature regions, 0 in pure background.
      // Smooth ramp avoids hard edge cutoff.
      const fg = (col: number, row: number): number => {
        const v = luma(col, row);
        // Below 0.04 = pure shadow (clip slightly to avoid pure-black noise).
        // Between 0.04 and 0.78 = fade in.
        // Above 0.78 = pure background (fade out).
        const lo = THREE.MathUtils.smoothstep(v, 0.02, 0.10);
        const hi = 1 - THREE.MathUtils.smoothstep(v, 0.62, 0.84);
        return lo * hi;
      };

      // Fit portrait into camera view.
      const SCENE_FILL = 1.0;
      const aspectImg = SAMPLE_W / SAMPLE_H;
      let visH = SCENE_FILL;
      let visW = visH * aspectImg;
      if (visW > SCENE_FILL) {
        visW = SCENE_FILL;
        visH = visW / aspectImg;
      }

      // Build positions + per-vertex alpha attribute.
      const N = SAMPLE_W * SAMPLE_H;
      const positions = new Float32Array(N * 3);
      const alphas = new Float32Array(N);

      for (let row = 0; row < SAMPLE_H; row++) {
        for (let col = 0; col < SAMPLE_W; col++) {
          const i = row * SAMPLE_W + col;
          const x = (col / (SAMPLE_W - 1) - 0.5) * visW;
          const y = -(row / (SAMPLE_H - 1) - 0.5) * visH;
          const f = fg(col, row);
          const v = luma(col, row);
          // Forward displacement: dark face features come toward camera.
          // (1 - v) weights darker pixels heavier; f keeps it inside foreground.
          const z = f * (1 - v) * 0.22;
          positions[i * 3 + 0] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
          alphas[i] = f;
        }
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

      // Line indices: right + down + SE diagonal per cell. Lines auto-fade
      // because the alpha attribute interpolates between endpoints.
      const indices: number[] = [];
      for (let row = 0; row < SAMPLE_H; row++) {
        for (let col = 0; col < SAMPLE_W; col++) {
          const i = row * SAMPLE_W + col;
          if (col + 1 < SAMPLE_W) indices.push(i, i + 1);
          if (row + 1 < SAMPLE_H) {
            indices.push(i, i + SAMPLE_W);
            if (col + 1 < SAMPLE_W) indices.push(i, i + SAMPLE_W + 1);
          }
        }
      }
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', geom.attributes.position!);
      lineGeom.setAttribute('aAlpha', geom.attributes.aAlpha!);
      lineGeom.setIndex(indices);

      const lineMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying float vAlpha;
          void main() {
            // line is visible only where both endpoints are foreground;
            // pow shapes the falloff so background → invisible faster.
            float a = pow(vAlpha, 1.4) * 0.34;
            gl_FragColor = vec4(0.93, 0.86, 0.74, a);
          }
        `,
      });
      linesObj = new THREE.LineSegments(lineGeom, lineMat);
      group.add(linesObj);

      const pointMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uPixelRatio: { value: dpr } },
        vertexShader: /* glsl */ `
          attribute float aAlpha;
          uniform float uPixelRatio;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (0.6 + aAlpha * 2.4) * uPixelRatio;
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying float vAlpha;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float a = smoothstep(0.5, 0.16, d);
            gl_FragColor = vec4(0.98, 0.94, 0.86, a * vAlpha * 0.95);
          }
        `,
      });
      pointsObj = new THREE.Points(geom, pointMat);
      group.add(pointsObj);
    };

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      group.rotation.y = Math.sin(t * 0.28) * 0.36; // ±20°
      group.rotation.x = Math.sin(t * 0.18) * 0.07; // ±4°
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      w = host.clientWidth || 1;
      h = host.clientHeight || 1;
      renderer.setSize(w, h);
      updateCamera();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (pointsObj) {
        pointsObj.geometry.dispose();
        (pointsObj.material as THREE.Material).dispose();
      }
      if (linesObj) {
        linesObj.geometry.dispose();
        (linesObj.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, [portraitSrc]);

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden
      style={{ width: '100%', height: '100%' }}
    />
  );
}

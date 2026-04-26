import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform vec2  uRes;
  uniform vec3  uColA;
  uniform vec3  uColB;
  uniform vec3  uBg;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
    vec2 puv    = (uv - 0.5) * aspect + 0.5;
    vec2 pmouse = (uMouse - 0.5) * aspect + 0.5;

    // soft vortex around mouse
    vec2 toM = puv - pmouse;
    float d  = length(toM);
    float swirl = exp(-d * 4.0);
    float ang   = swirl * 1.4;
    mat2  rot   = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec2  nuv   = pmouse + rot * toM;

    float t = uTime * 0.025;
    float n1 = fbm(nuv * 2.4 + vec2(0.0, -t));
    float n2 = fbm(nuv * 5.2 + vec2(t * 0.7, -t * 0.6) + 100.0);
    float field = n1 * 0.7 + n2 * 0.3;

    // central horizontal band — strongest in middle, fades top/bottom
    float vmask = smoothstep(0.0, 0.45, uv.y) * smoothstep(1.0, 0.45, uv.y);

    vec3 col = uBg;
    col = mix(col, uColB, smoothstep(0.30, 0.65, field) * vmask * 0.85);
    col = mix(col, uColA, smoothstep(0.55, 0.85, field) * vmask * 0.70);

    // warm glow under cursor
    col += uColA * exp(-d * 5.0) * 0.18;

    // subtle film grain
    float g = (hash(uv * uRes + uTime * 60.0) - 0.5) * 0.022;
    col += g;

    gl_FragColor = vec4(col, 1.0);
  }
`;

type Props = { className?: string };

export default function Fluid({ className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    let w = host.clientWidth || 1;
    let h = host.clientHeight || 1;
    renderer.setSize(w, h);
    host.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom   = new THREE.PlaneGeometry(2, 2);
    const mat    = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime:  { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uRes:   { value: new THREE.Vector2(w, h) },
        uColA:  { value: new THREE.Color('#d97744') },
        uColB:  { value: new THREE.Color('#6b4a8f') },
        uBg:    { value: new THREE.Color('#1a1525') },
      },
    });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    const target = { x: 0.5, y: 0.5 };
    const start  = performance.now();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      mat.uniforms.uTime!.value = (performance.now() - start) / 1000;
      const m = mat.uniforms.uMouse!.value as THREE.Vector2;
      m.x += (target.x - m.x) * 0.04;
      m.y += (target.y - m.y) * 0.04;
      renderer.render(scene, camera);
    };
    animate();

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);

    const onResize = () => {
      w = host.clientWidth || 1;
      h = host.clientHeight || 1;
      renderer.setSize(w, h);
      (mat.uniforms.uRes!.value as THREE.Vector2).set(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      ro.disconnect();
      geom.dispose();
      mat.dispose();
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className={className ?? 'absolute inset-0'} aria-hidden />;
}

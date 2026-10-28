"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** A soft four-pointed star, drawn once and shared by every twinkle. */
function starTexture() {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const m = S / 2;

  const glow = ctx.createRadialGradient(m, m, 0, m, m, m * 0.45);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.25, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // Long thin rays, fading to the tips.
  const ray = (horizontal: boolean) => {
    const g = horizontal ? ctx.createLinearGradient(0, m, S, m) : ctx.createLinearGradient(m, 0, m, S);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(0, m);
      ctx.quadraticCurveTo(m, m - 4, S, m);
      ctx.quadraticCurveTo(m, m + 4, 0, m);
    } else {
      ctx.moveTo(m, 0);
      ctx.quadraticCurveTo(m + 4, m, m, S);
      ctx.quadraticCurveTo(m - 4, m, m, 0);
    }
    ctx.fill();
  };
  ray(true);
  ray(false);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const vertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aSpeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Sharp twinkle: mostly dim, briefly flaring bright.
    float s = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
    vAlpha = pow(s, 3.0);
    gl_PointSize = aSize * uPixelRatio * (0.55 + 0.75 * vAlpha) * (10.0 / -mv.z);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uStar;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uStar, gl_PointCoord);
    gl_FragColor = vec4(uColor, tex.a * vAlpha * uOpacity);
  }
`;

/**
 * Tiny star-shaped sparkles that twinkle in place (with a slow drift),
 * scattered through a box of the given size.
 */
export default function Twinkles({
  count = 60,
  scale = [10, 6, 4],
  position = [0, 0, 0],
  size = 14,
  color = "#FFFFFF",
  opacity = 1,
  speed = 1,
}: {
  count?: number;
  scale?: [number, number, number];
  position?: [number, number, number];
  size?: number;
  color?: string;
  opacity?: number;
  /** 0 freezes them (reduced motion). */
  speed?: number;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * scale[0];
      pos[i * 3 + 1] = (Math.random() - 0.5) * scale[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * scale[2];
      phase[i] = Math.random() * Math.PI * 2;
      sizes[i] = size * (0.5 + Math.random());
      speeds[i] = 1.2 + Math.random() * 2.2;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, size, scale[0], scale[1], scale[2]]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uStar: { value: starTexture() },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
        },
      }),
    [color, opacity],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      (material.uniforms.uStar.value as THREE.Texture).dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, dt) => {
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (speed > 0) material.uniforms.uTime.value += dt * speed;
  });

  return <points geometry={geometry} material={material} position={position} />;
}

import {useMemo} from "react";
import * as THREE from "three";
import {lerp, outCubic, ramp, rand} from "@engine/clock";

type V = [number, number, number];
const frac = (x: number) => x - Math.floor(x);
let SOFT: THREE.Texture | null = null;
const soft = () => {
  if (SOFT) return SOFT;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 6, 64, 64, 62); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.55, "rgba(255,255,255,.62)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  SOFT = new THREE.CanvasTexture(c); return SOFT;
};
const Puff: React.FC<{p: V; s: number; color: string; a: number}> = ({p, s, color, a}) => a > 0.005 ? <sprite position={p} scale={[s, s, 1]} renderOrder={18}><spriteMaterial map={soft()} color={color} transparent opacity={a} depthWrite={false} toneMapped={false} /></sprite> : null;

/** A burst of dust at one moment: landings, collapses, digging. */
export const Dust: React.FC<{t: number; at: number; o: V; n?: number; size?: number; spread?: number; color?: string; dur?: number; seed?: number}> = ({t, at, o, n = 14, size = 1.1, spread = 1.2, color = "#B79F7E", dur = 1.5, seed = 1}) => {
  if (t < at || t > at + dur * 1.4) return null;
  return <group>{Array.from({length: n}, (_, i) => {
    const r = (q: number) => rand(i * 3.1 + seed * 7.7 + q), d = dur * (0.7 + 0.5 * r(1)), u = (t - at - r(2) * 0.12) / d;
    if (u <= 0 || u >= 1) return null;
    const e = outCubic(u), a = r(3) * 6.283, R = spread * (0.35 + r(4));
    return <Puff key={i} p={[o[0] + Math.cos(a) * R * e, o[1] + 0.1 + (0.35 + r(5) * 0.7) * spread * 0.7 * e, o[2] + Math.sin(a) * R * e * 0.8]} s={size * (0.45 + 0.75 * e) * (0.7 + 0.6 * r(6))} color={color} a={0.75 * (1 - u) * (1 - u)} />;
  })}</group>;
};

/** Steady smoke: fires, chimneys. */
export const Smoke: React.FC<{t: number; o: V; n?: number; h?: number; size?: number; color?: string; wind?: number; from?: number; to?: number}> = ({t, o, n = 12, h = 3, size = 0.8, color = "#4A4642", wind = 0.5, from = -9, to = 999}) => {
  if (t < from || t > to + 2) return null;
  return <group>{Array.from({length: n}, (_, i) => {
    const k = frac(i / n + t * 0.42), r = rand(i * 2.7);
    const born = t - k / 0.42; if (born < from || born > to) return null;
    return <Puff key={i} p={[o[0] + wind * k * k * 2 + (r - 0.5) * 0.3, o[1] + k * h, o[2] + (rand(i * 5.1) - 0.5) * 0.3]} s={size * (0.4 + 1.3 * k)} color={color} a={0.5 * Math.sin(Math.PI * Math.min(1, k * 1.08))} />;
  })}</group>;
};

/** Bright sparks on a hit, on real ballistic arcs. */
export const Sparks: React.FC<{t: number; at: number; o: V; n?: number; power?: number; color?: string; seed?: number}> = ({t, at, o, n = 16, power = 2.4, color = "#FFC24A", seed = 3}) => {
  if (t < at || t > at + 0.9) return null;
  return <group>{Array.from({length: n}, (_, i) => {
    const r = (q: number) => rand(i * 4.3 + seed + q), dt = t - at, life = 0.4 + 0.45 * r(1); if (dt > life) return null;
    const a = r(2) * 6.283, v = power * (0.4 + r(3));
    return <mesh key={i} position={[o[0] + Math.cos(a) * v * dt, o[1] + (1.4 + 2 * r(4)) * dt - 4.9 * dt * dt, o[2] + Math.sin(a) * v * dt]} scale={0.022 + 0.02 * r(5)} renderOrder={21}><sphereGeometry args={[1, 6, 5]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>;
  })}</group>;
};

/** Droplets and a spreading ring: something hits water. */
export const Splash: React.FC<{t: number; at: number; o: V; n?: number; power?: number; color?: string; ring?: number; seed?: number}> = ({t, at, o, n = 22, power = 1.4, color = "#7CC8FF", ring = 1, seed = 5}) => {
  if (t < at || t > at + 1.2) return null;
  const dt = t - at, u = dt / 1.2;
  return <group>
    {ring > 0 && <mesh position={[o[0], o[1] + 0.012, o[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={0.1 + ring * outCubic(u)} renderOrder={17}><ringGeometry args={[0.8, 1, 40]} /><meshBasicMaterial color="#DDF2FF" transparent opacity={0.8 * (1 - u)} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>}
    {Array.from({length: n}, (_, i) => {
      const r = (q: number) => rand(i * 3.7 + seed + q), a = r(2) * 6.283, v = power * (0.2 + 0.8 * r(3)), up = 1.2 + 2.6 * r(4);
      const y = up * dt - 4.9 * dt * dt; if (y < -0.03) return null;
      return <mesh key={i} position={[o[0] + Math.cos(a) * v * dt, o[1] + y, o[2] + Math.sin(a) * v * dt]} scale={0.022 + 0.03 * r(5)} renderOrder={21}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>;
    })}
  </group>;
};

/** Layered fire with embers and a real light. */
export const Fire: React.FC<{t: number; o: V; size?: number; embers?: boolean; light?: boolean; seed?: number}> = ({t, o, size = 1, embers = true, light = true, seed = 0}) => {
  const tongues = useMemo(() => Array.from({length: 7}, (_, i) => ({x: (rand(i * 2.3 + seed) - 0.5) * 0.3, z: (rand(i * 4.1 + seed) - 0.5) * 0.3, h: 0.55 + 0.5 * rand(i * 5.7 + seed), w: 0.09 + 0.07 * rand(i * 6.1 + seed), ph: rand(i * 7.9 + seed) * 6})), [seed]);
  const f = (i: number) => 1 + 0.24 * Math.sin(t * 21 + tongues[i].ph) + 0.14 * Math.sin(t * 33 + tongues[i].ph * 2);
  return <group position={o} scale={size}>
    {tongues.map((k, i) => <group key={i} position={[k.x, 0, k.z]}>
      <mesh position={[0, 0.5 * k.h * f(i), 0]} scale={[k.w, k.h * f(i), k.w]}><coneGeometry args={[1, 1, 8]} /><meshBasicMaterial color="#FF6A14" toneMapped={false} /></mesh>
      <mesh position={[0, 0.34 * k.h * f(i), 0]} scale={[k.w * 0.6, k.h * 0.62 * f(i), k.w * 0.6]}><coneGeometry args={[1, 1, 8]} /><meshBasicMaterial color="#FFD64A" toneMapped={false} /></mesh>
    </group>)}
    <Puff p={[0, 0.4, 0]} s={1.5} color="#FF8A2A" a={0.42} />
    {light && <pointLight position={[0, 0.7, 0]} color="#FF9A45" intensity={7 + 2 * Math.sin(t * 17)} distance={7} decay={1.8} />}
    {embers && Array.from({length: 7}, (_, i) => {const k = frac(i / 7 + t * 0.6 + rand(i)); return <mesh key={`e${i}`} position={[(rand(i * 3) - 0.5) * 0.5 + 0.2 * k, 0.4 + k * 1.6, (rand(i * 9) - 0.5) * 0.4]} scale={0.02 * (1 - k * 0.6)}><sphereGeometry args={[1, 6, 5]} /><meshBasicMaterial color="#FFB43C" toneMapped={false} /></mesh>;})}
  </group>;
};
void lerp; void ramp;

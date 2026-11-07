import {useMemo} from "react";
import * as THREE from "three";
import {quad} from "@engine/quad";
import {CutGround, rockGeometry, type Layer} from "@engine/primitives";
import {inQuad, lerp, outCubic, outQuad, ramp, rand, sine} from "@engine/clock";
import type {Mats} from "@engine/materials";
import T from "./cues";

export const B = {x: 2.9, z: -5.8, h: 1.75};
export const S = {x: 4.45, z: -7.2, h: 1.2};
const SOFT = -3.6, ROCK = -8.6;
const COURSES = 8;
const LAYERS: Layer[] = [{to: SOFT, mat: "soil"}, {to: ROCK, mat: "mud"}, {to: -30, mat: "rock"}];
const below = (y: number) => [new THREE.Plane(new THREE.Vector3(0, -1, 0), y)];

/** How far the slab and building have gone down under load. */
export const settle = (t: number) => 0.9 * sine(ramp(t, T.squeeze, T.squeezeEnd));

export const Ground: React.FC<{m: Mats; t: number}> = ({m, t}) => (
  <CutGround m={m} layers={LAYERS} hole={{x: S.x, z: S.z, depth: 3, open: t >= T.lift}} />
);

/** The crude first attempt: rocks tipped onto the mud. They are already falling on frame 0. */
export const Rocks: React.FC<{t: number}> = ({t}) => {
  const list = useMemo(() => Array.from({length: 54}, (_, i) => {
    const r = (k: number) => rand(i * 5.7 + k);
    return {g: rockGeometry(i % 5), t0: lerp(-0.5, T.rocksEnd - 0.45, r(1)), x: lerp(-3.5, 3.5, r(2)), z: lerp(-6.3, -0.5, r(3)), s: lerp(0.28, 0.55, r(4)), ry: r(5) * 6, c: lerp(0.62, 1, r(6))};
  }), []);
  if (t >= T.cut1) return null;
  const sunk = 0.6 * outQuad(ramp(t, T.sink, T.sinkEnd));
  return (
    <group>
      {list.map((k, i) => {
        const u = ramp(t, k.t0, k.t0 + 0.42);
        if (u <= 0) return null;
        const y = lerp(10, k.s * 0.45, inQuad(u)) - sunk;
        return <mesh key={i} geometry={k.g} position={[k.x, y, k.z]} rotation={[(1 - u) * 5, k.ry, (1 - u) * 3]} scale={k.s} castShadow receiveShadow><meshStandardMaterial color={new THREE.Color("#8C8378").multiplyScalar(k.c)} roughness={0.92} flatShading /></mesh>;
      })}
    </group>
  );
};

/** Added in the final list: bolts up through the slab and a rubber seal around the wall. */
export const Finish: React.FC<{t: number}> = ({t}) => {
  if (t < T.bolts) return null;
  const y = -settle(t);
  const seal = outCubic(ramp(t, T.seal, T.seal + 0.25));
  return (
    <group position={[0, y, 0]}>
      {[-3.3, -2, -0.7, 0.7, 2, 3.3].map((x, i) => {
        const u = outCubic(ramp(t, T.bolts + i * 0.05, T.bolts + i * 0.05 + 0.2));
        return <mesh key={x} position={[x, 0.3 * u - 0.1, -0.5]} scale={[1, Math.max(0.01, u), 1]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.62, 12]} /><meshStandardMaterial color="#AEB7BE" metalness={0.75} roughness={0.3} /></mesh>;
      })}
      {seal > 0 && <mesh position={[0, 0.05, 0.075]} scale={[seal, 1, 1]}><boxGeometry args={[B.x * 2 + 0.3, 0.12, 0.08]} /><meshStandardMaterial color="#15171A" roughness={0.6} /></mesh>}
    </group>
  );
};

/** The slab pours up from the trench floor, then rides down with the load. */
export const Slab: React.FC<{m: Mats; t: number}> = ({m, t}) => {
  const faces = useMemo(() => ({
    front: quad([-S.x, -S.h, 0.02], [S.x, -S.h, 0.02], [S.x, 0, 0.02], [-S.x, 0, 0.02]),
    top: quad([-S.x, 0, 0], [S.x, 0, 0], [S.x, 0, S.z], [-S.x, 0, S.z]),
    mat: m.slab.clone(),
  }), [m]);
  if (t < T.pour) return null;
  const level = lerp(-S.h, 0, sine(ramp(t, T.pour, T.pourEnd)));
  const y = -settle(t);
  const wet = new THREE.Color("#8F8B84").lerp(new THREE.Color("#FFFFFF"), ramp(t, T.pourEnd, T.pourEnd + 1.2));
  return (
    <group position={[0, y, 0]}>
      <mesh geometry={faces.front}><primitive object={faces.mat} attach="material" color={wet} clippingPlanes={below(level + y)} /></mesh>
      <mesh geometry={faces.top} position={[0, level, 0]} material={m.slab} receiveShadow />
    </group>
  );
};

export const Pour: React.FC<{t: number}> = ({t}) => {
  if (t < T.pour - 0.1 || t > T.pourEnd + 0.1) return null;
  const wob = (k: number) => 0.03 * Math.sin(t * 31 + k);
  return (
    <group>
      {[-3.6, 3.6].map((x, i) => (
        <mesh key={x} position={[x + wob(i), 4.5, -1.2 - i * 1.4]} scale={[1 + 2 * wob(i * 2 + 1), 1, 1]}>
          <cylinderGeometry args={[0.07, 0.12, 10, 10]} />
          <meshStandardMaterial color="#8B8880" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

export const Building: React.FC<{m: Mats; t: number}> = ({m, t}) => {
  const f = useMemo(() => ({
    front: quad([-B.x, 0, 0.04], [B.x, 0, 0.04], [B.x, B.h, 0.04], [-B.x, B.h, 0.04]),
    right: quad([B.x, 0, 0.04], [B.x, 0, B.z], [B.x, B.h, B.z], [B.x, B.h, 0.04]),
    left: quad([-B.x, 0, B.z], [-B.x, 0, 0.04], [-B.x, B.h, 0.04], [-B.x, B.h, B.z]),
    top: quad([-B.x, 0, 0.04], [B.x, 0, 0.04], [B.x, 0, B.z], [-B.x, 0, B.z]),
    mat: m.brick.clone(),
  }), [m]);
  const stack = ramp(t, T.stackStart, T.stackEnd);
  if (t < T.stackStart) return null;
  const c = Math.min(COURSES, Math.ceil(stack * COURSES));
  const top = (c / COURSES) * B.h;
  const clip = stack < 1 ? below(top) : [];
  const sink = 1.05 * outQuad(ramp(t, T.sink, T.sinkEnd));
  const tilt = 0.06 * outQuad(ramp(t, T.sink, T.sinkEnd));
  const lift = sine(ramp(t, T.lift, T.lift + 0.42));
  const hover = 1.35 * (1 - inQuad(ramp(t, T.settle - 0.32, T.settle)));
  const y = lerp(-sink, hover, lift) - settle(t);
  const rz = lerp(tilt, 0, lift);
  return (
    <>
      <group position={[0, y, 0]} rotation={[0, 0, rz]}>
        {[f.front, f.right, f.left].map((q, i) => (
          <mesh key={i} geometry={q} castShadow receiveShadow><primitive object={f.mat} attach="material" clippingPlanes={clip} /></mesh>
        ))}
        <mesh geometry={f.top} position={[0, top, 0]}><meshStandardMaterial color="#9A5A4A" roughness={0.9} /></mesh>
        <mesh position={[0, top + 0.012, B.z / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[B.x * 2 - 0.7, -B.z - 0.7]} /><meshStandardMaterial color="#2C2622" roughness={1} /></mesh>
      </group>
      {/* Bricks landing on each course */}
      {t > T.stackStart - 0.35 && t < T.stackEnd + 0.1 && Array.from({length: COURSES * 6}, (_, i) => {
        const cc = Math.floor(i / 6), land = T.stackStart + (cc * (T.stackEnd - T.stackStart)) / COURSES + (i % 6) * 0.018;
        const u = (t - land + 0.3) / 0.3;
        if (u <= 0 || u >= 1) return null;
        const yy = ((cc + 1) / COURSES) * B.h + 0.1;
        const k = inQuad(u);
        return (
          <mesh key={i} position={[lerp(-2.4, 2.4, rand(i * 3.1)), lerp(yy + 6, yy, k), lerp(-0.5, -5, rand(i * 1.7))]} rotation={[rand(i) * (1 - k) * 4, rand(i + 2) * (1 - k) * 2, rand(i + 5) * (1 - k) * 4]} castShadow>
            <boxGeometry args={[0.72, 0.24, 0.34]} />
            <meshStandardMaterial color="#A84E3C" roughness={0.85} />
          </mesh>
        );
      })}
    </>
  );
};

/** Displaced soil: mounds at the surface and flow arrows on the cut face. */
export const Squeeze: React.FC<{t: number; m: Mats}> = ({t, m}) => {
  const u = sine(ramp(t, T.squeeze, T.squeezeEnd));
  const tri = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-0.34, 0.09); s.lineTo(0.06, 0.09); s.lineTo(0.06, 0.26); s.lineTo(0.42, 0); s.lineTo(0.06, -0.26); s.lineTo(0.06, -0.09); s.lineTo(-0.34, -0.09); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  if (t < T.squeeze) return null;
  const on = t < T.cut2;
  return (
    <group>
      {[-1, 1].map((d) => (
        <mesh key={d} position={[d * (S.x + 1.6), -0.1, -3.25]} scale={[1.65, Math.max(0.01, 0.95 * u) + 0.1, 3.25]} material={m.soil} castShadow receiveShadow>
          <sphereGeometry args={[1, 40, 20]} />
        </mesh>
      ))}
      {on && [-1, 1].flatMap((d) => [-2.5, -3.1].map((y, r) => {
        const off = (t * 1.3 + r * 0.45) % 1;
        return (
          <mesh key={`${d}${y}`} geometry={tri} position={[d * (2.3 + off * 2.6), y - 0.1 * r, 0.06]} scale={[d * 1.7, 1.7, 1]}>
            <meshBasicMaterial color="#F3E7C9" toneMapped={false} side={THREE.DoubleSide} transparent opacity={u * Math.sin(Math.PI * off)} />
          </mesh>
        );
      }))}
    </group>
  );
};

const PILES = [-3.4, -1.7, 0, 1.7, 3.4];
export const pileDepth = (t: number, i: number) => {
  const hits = 6, a = T.drive + i * 0.025, dt = (T.rock - T.drive) / hits;
  const h = (t - a) / dt;
  if (h <= 0) return 0;
  const n = Math.min(hits, Math.floor(h));
  return (n + (n < hits ? outCubic((h - n) / 0.45) : 0)) / hits;
};
export const Piles: React.FC<{t: number}> = ({t}) => {
  if (t < T.drive) return null;
  const y0 = -settle(t) - S.h + 0.1;
  const len = -ROCK + y0;
  return (
    <group>
      {PILES.map((x, i) => {
        const L = Math.max(0.01, pileDepth(t, i) * len);
        return (
          <group key={x} position={[x, y0, 0.07]}>
            <mesh position={[0, -L / 2, 0]}><cylinderGeometry args={[0.26, 0.26, L, 24]} /><meshStandardMaterial color="#9CAEBE" metalness={0.75} roughness={0.34} /></mesh>
            <mesh position={[0, -L - 0.17, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.26, 0.34, 24]} /><meshStandardMaterial color="#6E7E8C" metalness={0.7} roughness={0.4} /></mesh>
          </group>
        );
      })}
      {/* Rock strike dust */}
      {t > T.rock && t < T.rock + 0.55 && PILES.flatMap((x) => [0, 1, 2, 3, 4].map((k) => {
        const u = (t - T.rock) / 0.55;
        return (
          <mesh key={`${x}${k}`} position={[x + (k - 2) * 0.18 * (1 + 3 * u), ROCK + 0.06 + u * 0.32 * rand(k + x), 0.09]} scale={0.12 * (1 - u)}>
            <circleGeometry args={[1, 12]} /><meshBasicMaterial color="#D8CFC2" transparent opacity={1 - u} />
          </mesh>
        );
      }))}
    </group>
  );
};

const CRACK: [number, number][] = [[0.28, -1.18], [0.42, -0.94], [0.2, -0.72], [0.5, -0.46], [0.32, -0.22]];
const Seg: React.FC<{a: [number, number]; b: [number, number]; u: number; w: number; c: string}> = ({a, b, u, w, c}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * u;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return <mesh position={[a[0] + (Math.cos(ang) * L) / 2, a[1] + (Math.sin(ang) * L) / 2, 0.07]} rotation={[0, 0, ang]} scale={[L || 0.001, w, 1]}><planeGeometry /><meshBasicMaterial color={c} toneMapped={false} /></mesh>;
};
export const CrackAndBars: React.FC<{t: number}> = ({t}) => {
  const y = -settle(t) + 0.9;
  const grow = ramp(t, T.crack, T.crack + 0.3) * (CRACK.length - 1);
  const heal = 1 - sine(ramp(t, T.heal, T.heal + 0.3));
  const bar = (i: number) => outCubic(ramp(t, T.bars + i * 0.08, T.barsEnd - 0.15 + i * 0.08));
  return (
    <group position={[0, y - 0.9, 0]}>
      {t >= T.crack && heal > 0 && CRACK.slice(0, -1).map((a, i) => <Seg key={i} a={a} b={CRACK[i + 1]} u={Math.min(1, Math.max(0, grow - i))} w={0.055 * heal} c="#14171B" />)}
      {t >= T.bars && [-0.32, -0.68, -1.02].map((yy, i) => (
        <mesh key={yy} position={[-S.x + 0.15 + (2 * S.x - 0.3) * bar(i) / 2, yy, 0.08]} rotation={[0, 0, Math.PI / 2]} scale={[1, Math.max(0.001, 2 * S.x - 0.3) * bar(i), 1]}>
          <cylinderGeometry args={[0.055, 0.055, 1, 12]} /><meshStandardMaterial color="#B8592B" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      {t >= T.barsEnd - 0.2 && Array.from({length: 11}, (_, i) => {
        const x = -4 + i * 0.8, u = outCubic(ramp(t, T.barsEnd - 0.2 + i * 0.012, T.barsEnd + 0.1 + i * 0.012));
        return <mesh key={i} position={[x, -0.67, 0.081]} scale={[1, Math.max(0.001, 0.82 * u), 1]}><cylinderGeometry args={[0.03, 0.03, 1, 8]} /><meshStandardMaterial color="#9A4A25" metalness={0.5} roughness={0.5} /></mesh>;
      })}
    </group>
  );
};

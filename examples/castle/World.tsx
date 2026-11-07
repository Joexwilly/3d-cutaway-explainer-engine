import {useMemo} from "react";
import * as THREE from "three";
import {useThree} from "@react-three/fiber";
import {mergeGeometries} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {ScaleFigure, rockGeometry} from "@engine/primitives";
import {inQuad, lerp, outCubic, ramp, rand, sine} from "@engine/clock";
import type {Mats} from "@engine/materials";
import cfg from "../../cutaway.json";
import T, {APRON, CONC, MINE, cutZ} from "./cues";

type V = [number, number, number];
const A = 3.6, TH = 0.4, WH = 1.45, B = 2.3, IH = 2.5, K = 1.05, KH = 4.1;
const HT = 1.9, FIG = 0.92;
const frac = (x: number) => x - Math.floor(x);
const lv = (a: V, b: V, u: number): V => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

/** Clips the entire world at the current cut plane. */
export const WorldCut: React.FC<{t: number}> = ({t}) => {
  const gl = useThree((s) => s.gl);
  gl.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), cutZ(t) + 0.03)];
  return null;
};

export const useKit = (m: Mats) => useMemo(() => {
  const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d")!;
  g.fillStyle = "#6F675A"; g.fillRect(0, 0, 1024, 1024);
  const rows = 8, h = 1024 / rows;
  for (let r = 0; r < rows; r++) for (let i = -1; i < 7; i++) {
    const w = 1024 / 6, x = i * w + (r % 2 ? w / 2 : 0), k = rand(r * 13 + i * 7);
    const v = Math.round(lerp(176, 214, k));
    g.fillStyle = `rgb(${v},${v - 8},${v - 24})`; g.fillRect(x + 5, r * h + 5, w - 10, h - 10);
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(0.75, 0.75); map.anisotropy = 12;
  const stone = new THREE.MeshStandardMaterial({map, roughness: 0.92, shadowSide: THREE.DoubleSide});
  const gc = document.createElement("canvas"); gc.width = gc.height = 512; const gg = gc.getContext("2d")!;
  gg.fillStyle = "#5E9C45"; gg.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {gg.fillStyle = i % 2 ? "rgba(46,92,34,.16)" : "rgba(150,196,96,.14)"; gg.fillRect(rand(i * 1.3) * 512, rand(i * 2.7) * 512, 2 + 7 * rand(i * 3.9), 2 + 3 * rand(i * 4.1));}
  const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace; gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(1 / 7, 1 / 7); gt.anisotropy = 12;
  return {
    stone,
    cutStone: new THREE.MeshStandardMaterial({color: "#6E6658", roughness: 1}),
    grass: new THREE.MeshStandardMaterial({map: gt, roughness: 0.95, shadowSide: THREE.DoubleSide}),
    soil: m.soil, mud: m.mud, rock: m.rock, plank: m.plank,
    log: new THREE.MeshStandardMaterial({color: "#7B5230", roughness: 0.85}),
    iron: new THREE.MeshStandardMaterial({color: "#2B2E33", metalness: 0.6, roughness: 0.45}),
    water: new THREE.MeshStandardMaterial({color: "#2C8BE6", roughness: 0.18, metalness: 0.15}),
  };
}, [m]);
export type Kit = ReturnType<typeof useKit>;

/** Terrain height. u grows the pile into a motte; d opens the ditch. */
const heightAt = (r: number, u: number, d: number) => {
  const rT = lerp(0, 5.2, u), rB = lerp(0.01, 6.9, u), H = lerp(0, HT, u);
  let y = 0;
  if (r <= rT) y = H; else if (r < rB) y = H * (1 - sine((r - rT) / (rB - rT)));
  if (r > 7 && r < 9) y -= d * Math.sin(((r - 7) / 2) * Math.PI);
  return y;
};
const hillU = (t: number) => sine(ramp(t, T.throw, T.steeper + 0.4));
const ditchD = (t: number) => 1.1 * sine(ramp(t, T.dig, T.throw + 0.3));
const moatY = (t: number) => lerp(-1.2, -0.28, sine(ramp(t, T.moat - 0.2, T.moat + 0.6)));
const PILE_R = 2.5, PILE_H = 1.15;
const pileAt = (r: number) => (r < PILE_R ? PILE_H * Math.sqrt(1 - (r / PILE_R) ** 2) : 0);
const hAt = (x: number, z: number, t: number) => {const r = Math.hypot(x, z), g = heightAt(r, hillU(t), ditchD(t)); return Math.max(g, pileAt(r));};

const SEG = 128;
const RR = (() => {const a: number[] = []; for (let r = 0; r < 11; r += 0.14) a.push(r); for (let r = 11; r < 150; r += 8) a.push(r); return a;})();
const buildTerrain = (u: number, d: number) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  RR.forEach((r) => {for (let j = 0; j <= SEG; j++) {const a = (j / SEG) * Math.PI * 2, x = r * Math.cos(a), z = r * Math.sin(a); pos.push(x, heightAt(r, u, d), z); uv.push(x, z);}});
  for (let i = 0; i < RR.length - 1; i++) for (let j = 0; j < SEG; j++) {const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, a + 1, b, b, a + 1, b + 1);}
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
};
const faceShape = (f: (x: number) => number, bottom: number) => {
  const s = new THREE.Shape(); s.moveTo(-60, bottom);
  s.lineTo(-60, f(-60)); for (let x = -22; x <= 22; x += 0.14) s.lineTo(x, f(x)); s.lineTo(60, f(60)); s.lineTo(60, bottom); s.closePath();
  return new THREE.ShapeGeometry(s);
};

export const Ground: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const uq = Math.round(hillU(t) * 90) / 90, dq = Math.round(ditchD(t) * 60) / 60, z = cutZ(t);
  const ter = useMemo(() => buildTerrain(uq, dq), [uq, dq]);
  const ditch = useMemo(() => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [], rs = Array.from({length: 15}, (_, i) => 7 + (i / 14) * 2);
    rs.forEach((r) => {for (let j = 0; j <= SEG; j++) {const a = (j / SEG) * Math.PI * 2, x = r * Math.cos(a), z2 = r * Math.sin(a); pos.push(x, heightAt(r, uq, dq) + 0.015, z2); uv.push(x, z2);}});
    for (let i = 0; i < rs.length - 1; i++) for (let j = 0; j < SEG; j++) {const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, a + 1, b, b, a + 1, b + 1);}
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }, [uq, dq]);
  const face = useMemo(() => {
    const f = (x: number) => heightAt(Math.hypot(x, z), uq, dq);
    const skin = new THREE.Shape(); const xs: number[] = []; for (let x = -22; x <= 22; x += 0.14) xs.push(x);
    skin.moveTo(-60, f(-60)); xs.forEach((x) => skin.lineTo(x, f(x))); skin.lineTo(60, f(60)); skin.lineTo(60, f(60) - 0.12); [...xs].reverse().forEach((x) => skin.lineTo(x, f(x) - 0.12)); skin.lineTo(-60, f(-60) - 0.12); skin.closePath();
    return {soil: faceShape(f, -1.7), skin: new THREE.ShapeGeometry(skin)};
  }, [uq, dq, z]);
  return (
    <group>
      <mesh geometry={ter} material={k.grass} receiveShadow />
      {dq > 0.02 && <mesh geometry={ditch} material={k.soil} receiveShadow />}
      {hillU(t) < 0.75 && <mesh position={[0, 0, 0]} scale={[PILE_R, PILE_H, PILE_R]} material={k.soil} castShadow receiveShadow><sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>}
      <mesh geometry={face.soil} material={k.soil} position={[0, 0, z]} />
      <mesh geometry={face.skin} position={[0, 0, z + 0.005]}><meshStandardMaterial color="#4B7F35" roughness={0.9} /></mesh>
      <mesh position={[0, -3.2, z]} material={k.mud}><planeGeometry args={[120, 3]} /></mesh>
      <mesh position={[0, -17, z]} material={k.rock}><planeGeometry args={[120, 25]} /></mesh>
    </group>
  );
};

export const Scenery: React.FC = () => {
  const list = useMemo(() => Array.from({length: 46}, (_, i) => {const r = (n: number) => rand(i * 3.3 + n); return {x: lerp(-46, 46, r(1)), z: lerp(-34, -14, r(2)), s: lerp(1.5, 2.8, r(3)), c: new THREE.Color("#2F5A34").multiplyScalar(lerp(0.75, 1.15, r(4)))};}), []);
  return (
    <group>
      {[[-46, -74, 44, 11], [20, -92, 66, 16], [64, -66, 40, 9]].map(([x, z, w, h], i) => <mesh key={i} position={[x, -0.5, z]} scale={[w, h, 22]}><sphereGeometry args={[1, 36, 18]} /><meshStandardMaterial color="#5E8B59" roughness={1} /></mesh>)}
      {list.map((k, i) => <group key={i} position={[k.x, 0, k.z]}>
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, 0.6, 8]} /><meshStandardMaterial color="#54382A" /></mesh>
        <mesh position={[0, 0.5 + k.s * 0.6, 0]} castShadow><coneGeometry args={[k.s * 0.42, k.s * 1.2, 10]} /><meshStandardMaterial color={k.c} roughness={0.9} /></mesh>
      </group>)}
    </group>
  );
};

const worldUV = (g: THREE.BufferGeometry) => {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), nz = Math.abs(n.getZ(i));
    if (nx > 0.5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (nz > 0.5) uv.setXY(i, p.getX(i), p.getY(i)); else uv.setXY(i, p.getX(i), p.getZ(i));
  }
  return g;
};
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return worldUV(g);
};
const merlons = (x0: number, z0: number, x1: number, z1: number, y: number, t: number) => {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.42)), out: THREE.BufferGeometry[] = [];
  for (let i = 0; i <= n; i += 2) {const u = i / n, x = lerp(x0, x1, u), z = lerp(z0, z1, u), hx = x1 !== x0 ? 0.11 : t / 2, hz = z1 !== z0 ? 0.11 : t / 2; out.push(box(x - hx, x + hx, y, y + 0.24, z - hz, z + hz));}
  return out;
};
const buildCastle = () => {
  const y0 = HT - 0.3, y1 = HT + WH, h = TH / 2;
  const corner = 1.1;
  const outer = mergeGeometries([
    box(-A - h, A + h, y0, y1, -A - h, -A + h), box(-A - h, -A + h, y0, y1, -A, A),
    box(-A - h, -0.9, y0, y1, A - h, A + h), box(0.9, A - corner, y0, y1, A - h, A + h),
    box(A - h, A + h, y0, y1, -A, -0.75), box(A - h, A + h, y0, y1, 0.75, A - corner),
    ...merlons(-A, -A, A, -A, y1, TH), ...merlons(-A, -A, -A, A, y1, TH), ...merlons(-A, A, -0.9, A, y1, TH), ...merlons(0.9, A, A - corner, A, y1, TH), ...merlons(A, -A, A, -0.75, y1, TH), ...merlons(A, 0.75, A, A - corner, y1, TH),
  ]);
  const gate = mergeGeometries([
    box(3.1, 4.4, y0, y1 + 0.75, -0.75, -0.35), box(3.1, 4.4, y0, y1 + 0.75, 0.35, 0.75),
    box(3.1, 3.42, HT + 0.85, HT + 1.2, -0.35, 0.35), box(3.58, 3.84, HT + 0.85, HT + 1.2, -0.35, 0.35), box(4, 4.4, HT + 0.85, HT + 1.2, -0.35, 0.35),
    box(3.1, 3.24, HT + 1.2, y1 + 0.75, -0.35, 0.35), box(4.24, 4.4, HT + 1.2, y1 + 0.75, -0.35, 0.35), box(3.1, 4.4, y1 + 0.66, y1 + 0.75, -0.35, 0.35),
    ...merlons(3.1, -0.75, 4.4, -0.75, y1 + 0.75, 0.2), ...merlons(3.1, 0.75, 4.4, 0.75, y1 + 0.75, 0.2), ...merlons(4.32, -0.75, 4.32, 0.75, y1 + 0.75, 0.16),
  ]);
  const ky = HT + KH, kt = 0.26;
  const keep = mergeGeometries([
    box(-K, K, y0, ky, -K, -K + kt), box(-K, K, y0, ky, K - kt, K), box(-K, -K + kt, y0, ky, -K, K), box(K - kt, K, y0, ky, -K, K),
    box(-K, K, HT + 1.3, HT + 1.42, -K, K), box(-K, K, HT + 2.7, HT + 2.82, -K, K), box(-K, K, ky - 0.04, ky, -K, K),
    ...merlons(-K, -K, K, -K, ky, kt), ...merlons(-K, K, K, K, ky, kt), ...merlons(-K, -K, -K, K, ky, kt), ...merlons(K, -K, K, K, ky, kt),
  ]);
  const iy = HT + IH, it = 0.34;
  const inner = mergeGeometries([
    box(-B - it, B + it, y0, iy, -B - it, -B), box(-B - it, B + it, y0, iy, B, B + it), box(-B - it, -B, y0, iy, -B, B), box(B, B + it, y0, iy, -B, B),
    ...merlons(-B, B + it / 2, B, B + it / 2, iy, it), ...merlons(-B, -B - it / 2, B, -B - it / 2, iy, it), ...merlons(-B - it / 2, -B, -B - it / 2, B, iy, it), ...merlons(B + it / 2, -B, B + it / 2, B, iy, it),
  ]);
  const walk = mergeGeometries([
    box(-A - 0.42, A + 0.42, y1 - 0.2, y1, A + h, A + h + 0.24), box(-A - 0.42, A + 0.42, y1 - 0.2, y1, -A - h - 0.24, -A - h), box(-A - h - 0.24, -A - h, y1 - 0.2, y1, -A, A), box(A + h, A + h + 0.24, y1 - 0.2, y1, 0.75, A), box(A + h, A + h + 0.24, y1 - 0.2, y1, -A, -0.75),
    ...merlons(-A, A + h + 0.2, A, A + h + 0.2, y1, 0.08), ...merlons(-A, -A - h - 0.2, A, -A - h - 0.2, y1, 0.08),
    ...Array.from({length: 14}, (_, i) => box(-3.3 + i * 0.5, -3.16 + i * 0.5, y1 - 0.5, y1 - 0.18, A + h, A + h + 0.2)),
  ]);
  return {outer, gate, keep, inner, walk, cornerA: box(A - corner, A + h, y0, y1, A - h, A + h), cornerB: box(A - h, A + h, y0, y1, A - corner, A - h), breach: box(-0.9, 0.9, y0, y1, A - h, A + h)};
};
const below = (y: number) => [new THREE.Plane(new THREE.Vector3(0, -1, 0), y)];
const stepUp = (u: number, h: number) => Math.ceil(u * 8) / 8 * h;

const useRiser = (k: Kit) => useMemo(() => ({outer: k.stone.clone(), keep: k.stone.clone(), inner: k.stone.clone()}), [k]);

const Cap: React.FC<{k: Kit; x0: number; x1: number; y0: number; y1: number; z?: number}> = ({k, x0, x1, y0, y1, z = 0.015}) => <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, z]} material={k.cutStone} scale={[x1 - x0, y1 - y0, 1]} renderOrder={4}><planeGeometry /></mesh>;

export const Castle: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const g = useMemo(buildCastle, []);
  const r = useRiser(k);
  if (t < T.stoneT) return null;
  const u = ramp(t, T.stoneT, T.stoneEnd);
  const y0 = HT - 0.3;
  const keepTop = y0 + stepUp(u, KH + 0.6), outerTop = y0 + stepUp(u, WH + 0.6);
  const inU = ramp(t, T.inner, T.innerEnd), innerOn = t >= T.inner, innerTop = y0 + stepUp(inU, IH + 0.6);
  const cz = cutZ(t);
  const cornerFall = ramp(t, T.corner - 0.15, T.corner + 0.55);
  const breachU = ramp(t, T.breach - 0.05, T.breach + 0.5);
  const repair = sine(ramp(t, T.inner - 0.1, T.inner + 0.8));
  const walk = ramp(t, T.walk - 0.1, T.hang + 0.2);
  const s = cz === 0;
  const yw = HT + WH;
  return (
    <group>
      <mesh geometry={g.keep} castShadow receiveShadow><primitive object={r.keep} attach="material" clippingPlanes={below(keepTop)} /></mesh>
      <mesh geometry={g.outer} castShadow receiveShadow><primitive object={r.outer} attach="material" clippingPlanes={below(outerTop)} /></mesh>
      <mesh geometry={g.gate} material={r.outer} castShadow receiveShadow />
      {cornerFall < 1 && <group position={[0, -1.6 * inQuad(cornerFall), 0]} rotation={[0.1 * cornerFall, 0, -0.1 * cornerFall]}>
        <mesh geometry={g.cornerA} material={r.outer} castShadow /><mesh geometry={g.cornerB} material={r.outer} castShadow />
      </group>}
      {(breachU < 1 || repair > 0) && <mesh geometry={g.breach} material={r.outer} position={[0, repair > 0 ? lerp(-2.6, 0, repair) : -2.6 * inQuad(breachU), repair > 0 ? 0 : 0.5 * breachU]} rotation={[repair > 0 ? 0 : 0.9 * breachU, 0, 0]} castShadow />}
      {innerOn && <mesh geometry={g.inner} castShadow receiveShadow><primitive object={r.inner} attach="material" clippingPlanes={below(innerTop)} /></mesh>}
      {walk > 0 && <group scale={[1, 1, 1]} position={[0, 0, 0]}><mesh geometry={g.walk} material={k.stone} scale={[1, walk, 1]} position={[0, (1 - walk) * yw, 0]} castShadow /></group>}
      {s && <>
        <Cap k={k} x0={-A - 0.2} x1={-A + 0.2} y0={HT} y1={Math.min(outerTop, HT + WH)} />
        <Cap k={k} x0={3.1} x1={3.42} y0={HT + 0.85} y1={HT + 1.2} />
        <Cap k={k} x0={3.58} x1={3.84} y0={HT + 0.85} y1={HT + 1.2} />
        <Cap k={k} x0={4} x1={4.4} y0={HT + 0.85} y1={HT + 1.2} />
        <Cap k={k} x0={3.1} x1={3.24} y0={HT + 1.2} y1={HT + WH + 0.75} />
        <Cap k={k} x0={4.24} x1={4.4} y0={HT + 1.2} y1={HT + WH + 0.75} />
        <Cap k={k} x0={3.1} x1={4.4} y0={HT + WH + 0.66} y1={HT + WH + 0.75} />
        <Cap k={k} x0={-K} x1={-K + 0.26} y0={HT} y1={Math.min(keepTop, HT + KH)} />
        <Cap k={k} x0={K - 0.26} x1={K} y0={HT} y1={Math.min(keepTop, HT + KH)} />
        <Cap k={k} x0={-K} x1={K} y0={HT + 1.3} y1={HT + 1.42} />
        <Cap k={k} x0={-K} x1={K} y0={HT + 2.7} y1={HT + 2.82} />
        <Cap k={k} x0={-K} x1={K} y0={HT + KH - 0.04} y1={HT + KH} />
      </>}
      {cz === CONC && <>
        {[-1, 1].map((d) => <group key={d}>
          <Cap k={k} x0={d > 0 ? B : -B - 0.34} x1={d > 0 ? B + 0.34 : -B} y0={HT} y1={HT + IH} z={CONC + 0.015} />
          <Cap k={k} x0={d > 0 ? A - 0.2 : -A - 0.2} x1={d > 0 ? A + 0.2 : -A + 0.2} y0={HT} y1={HT + WH} z={CONC + 0.015} />
        </group>)}
      </>}
    </group>
  );
};

const Fall: React.FC<{k: Kit; n: number; o: V; t: number; t0: number; seed: number; spread?: number; drift?: number}> = ({k, n, o, t, t0, seed, spread = 1.1, drift = 0.9}) => {
  const rocks = useMemo(() => [0, 1, 2].map((i) => rockGeometry(i + seed)), [seed]);
  if (t < t0) return null;
  return <group>{Array.from({length: n}, (_, i) => {
    const r = (q: number) => rand(i * 2.3 + seed + q), u = ramp(t, t0 + r(1) * 0.3, t0 + r(1) * 0.3 + 0.55);
    const p: V = [o[0] + (r(2) - 0.5) * spread + (r(3) - 0.2) * 0.8 * u, Math.max(HT + 0.1, lerp(o[1], o[1] - 1.5 - r(4) * 0.5, inQuad(u))), o[2] + (r(5) - 0.3) * drift * u];
    return <mesh key={i} geometry={rocks[i % 3]} position={p} rotation={[r(6) * 6, r(7) * 6, 0]} scale={0.12 + 0.12 * r(8)} material={k.stone} castShadow />;
  })}</group>;
};

const Flame: React.FC<{p: V; s: number; t: number; i: number; flat?: boolean}> = ({p, s, t, i, flat}) => {
  const f = 1 + 0.25 * Math.sin(t * 19 + i * 2.1) + 0.15 * Math.sin(t * 31 + i);
  return <group position={p} scale={[1, 1, flat ? 0.02 : 1]}>
    <mesh position={[0, 0.3 * s * f, 0]} scale={[0.2 * s, 0.6 * s * f, 0.2 * s]}><coneGeometry args={[1, 1, 10]} /><meshBasicMaterial color="#FF7A1A" toneMapped={false} /></mesh>
    <mesh position={[0, 0.2 * s * f, 0.02]} scale={[0.11 * s, 0.36 * s * f, 0.11 * s]}><coneGeometry args={[1, 1, 10]} /><meshBasicMaterial color="#FFD84A" toneMapped={false} /></mesh>
  </group>;
};

const LOGS = (() => {
  const out: {x: number; z: number; d: number; ry: number}[] = [], n = 20;
  for (let s = 0; s < 4; s++) for (let i = 0; i < n; i++) {
    const v = lerp(-A, A, (i + 0.5) / n), p = [[v, -A], [A, v], [-v, A], [-A, -v]][s], ang = s * 0.5 * Math.PI;
    if (s === 1 && Math.abs(v) < 0) continue;
    out.push({x: p[0], z: p[1], d: Math.hypot(p[0] - A, p[1] - A), ry: ang});
  }
  return out;
})();
export const Palisade: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const geo = useMemo(() => {const a = new THREE.CylinderGeometry(0.17, 0.17, 1.3, 8); a.translate(0, 0.65, 0); const b = new THREE.ConeGeometry(0.17, 0.3, 8); b.translate(0, 1.45, 0); return mergeGeometries([a, b]);}, []);
  const charred = useMemo(() => new THREE.MeshStandardMaterial({color: "#1E1712", roughness: 1}), []);
  if (t < T.ring - 0.1 || t > T.stoneEnd) return null;
  return <group>{LOGS.map((l, i) => {
    const land = T.ring + (i / LOGS.length) * (T.logs + 0.2 - T.ring);
    const u = outCubic(ramp(t, land - 0.2, land));
    if (u <= 0) return null;
    const ig = T.fire + (l.d / 11) * (T.fireEnd + 0.4 - T.fire);
    const burn = t >= ig;
    const fall = ramp(t, T.tear + (i % 7) * 0.05, T.tear + (i % 7) * 0.05 + 0.5);
    const gone = fall >= 1;
    const y = HT - 0.05 + lerp(2.5, 0, u) - 1.5 * inQuad(fall);
    if (gone) return null;
    return <group key={i}>
      <mesh geometry={geo} position={[l.x, y, l.z]} rotation={[1.4 * fall * (i % 2 ? 1 : -1), l.ry, 0]} scale={[1, 1 - 0.8 * fall, 1]} material={burn ? charred : k.log} castShadow />
      {burn && fall <= 0 && i % 2 === 0 && <Flame p={[l.x, HT + 1.05 + 0.25 * rand(i), l.z + 0.12]} s={1.1 + rand(i * 3) * 0.6} t={t} i={i} />}
    </group>;
  })}</group>;
};

const Raider: React.FC<{p: V; r?: number; down?: number; h?: number; spear?: boolean}> = ({p, r = 0, down = 0, h = FIG, spear = true}) => (
  <group position={p} rotation={[0, r, 0]}><group rotation={[down * 1.5, 0, 0]}>
    <ScaleFigure position={[0, 0, 0]} h={h} color="#C4271F" />
    {spear && <mesh position={[h * 0.2, h * 0.62, h * 0.12]} rotation={[0.9, 0, 0]} castShadow><cylinderGeometry args={[0.018, 0.018, h * 1.1, 6]} /><meshStandardMaterial color="#3A2A1E" /></mesh>}
  </group></group>
);

/** Red means enemy, in every shot. */
export const Raiders: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  const at = (x: number, z: number) => hAt(x, z, t);
  if (t < T.cDitch + 0.3) for (let i = 0; i < 6; i++) {
    const r = (q: number) => rand(i * 4.3 + q), start: V = [12 + r(1) * 4, 0, -1.5 + r(2) * 3.4], end: V = [0.55 + r(3) * 0.2, 0, -0.5 + i * 0.2];
    const u = sine(ramp(t, r(4) * 0.8, T.stab - 0.1));
    const x = lerp(start[0], end[0], u), z = lerp(start[2], end[2], u);
    const run = 0.05 * Math.abs(Math.sin(t * 12 + i));
    out.push(<Raider key={`a${i}`} p={[x, at(x, z) + run, z]} r={-Math.PI / 2} />);
  }
  if (t >= T.burns - 0.6 && t < T.cStone) for (let i = 0; i < 6; i++) {const x = 9.5 + i * 0.35, z = 2.5 - i * 0.7; out.push(<Raider key={`b${i}`} p={[x, at(x, z), z]} r={-Math.PI / 2} />);}
  if (t >= T.ram - 0.3 && t < T.cMine) {
    const u = sine(ramp(t, T.ram, T.door));
    const xr = lerp(9.5, 4.5, u), hit = t > T.door ? 0.18 * Math.abs(Math.sin((t - T.door) * 7)) * (t < T.drops ? 1 : 0) : 0, rx = xr + hit;
    const crushed = ramp(t, T.drops + 0.15, T.dropEnd);
    out.push(<group key="ram" position={[rx + 0.85, at(rx + 0.85, 0) + 0.34, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.17, 0.19, 2.1, 12]} /><meshStandardMaterial color="#6A4628" roughness={0.85} /></mesh>
      <mesh position={[-1.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.15, 0.16, 12]} /><meshStandardMaterial color="#2B2E33" metalness={0.6} roughness={0.4} /></mesh>
      {[-0.7, 0.7].flatMap((x) => [-0.34, 0.34].map((z) => <mesh key={`${x}${z}`} position={[x, -0.16, z]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.17, 0.17, 0.07, 14]} /><meshStandardMaterial color="#3F2C1C" /></mesh>))}
    </group>);
    [0.5, 1.1, 1.7].forEach((d, i) => {out.push(<Raider key={`r${i}`} p={[rx + d, at(rx + d, -0.42), -0.42]} r={-Math.PI / 2} spear={false} down={crushed * (t > T.rocks ? 1 : 0)} />);});
    const inside = ramp(t, T.boil - 0.5, T.boil + 0.3);
    if (t > T.holes) [0, 1].forEach((i) => {const x = 3.72 + i * 0.3; out.push(<Raider key={`g${i}`} p={[x, HT, -0.18]} r={-Math.PI / 2} down={inside} spear={false} />);});
  }
  if (t >= T.cMine && t < T.cRoch) [0, 1].forEach((i) => {const dig = ramp(t, T.tunnels - 0.5, T.prop); const x = lerp(5.1, 2.9, dig) + i * 0.55; out.push(<Raider key={`m${i}`} p={[x, 0.68, MINE - 0.1]} h={0.55} r={-Math.PI / 2} spear={false} />);});
  if (t >= T.cLadder && t < T.cInner + 1.4) for (let i = 0; i < 3; i++) {
    const lx = -1.9 + i * 1.9, c = sine(ramp(t, T.cLadder + i * 0.25, T.cLadder + 2.4 + i * 0.3));
    const hitU = ramp(t, T.hang + 0.15 + i * 0.2, T.hang + 0.8 + i * 0.2);
    const y = lerp(HT + 0.05, HT + 0.95, c) - 1 * inQuad(hitU);
    if (t < T.cBreach) out.push(<Raider key={`l${i}`} p={[lx + 0.02, Math.max(HT, y), lerp(A + 0.98, A + 0.56, c) + 0.5 * hitU]} r={Math.PI} down={hitU} spear={false} />);
  }
  if (t >= T.cArch && t < T.cConc) for (let i = 0; i < 4; i++) {const x = 5.15 + i * 0.42, d = ramp(t, T.archers + 0.5 + i * 0.25, T.archers + 0.9 + i * 0.25); out.push(<Raider key={`o${i}`} p={[x, hAt(x, -1.75, t), -1.75]} r={-Math.PI / 2} down={d} />);}
  if (t >= T.cBreach && t < T.cEnd) for (let i = 0; i < 7; i++) {
    const r = (q: number) => rand(i * 6.7 + q);
    const inU = sine(ramp(t, T.breach + 0.1 + r(1) * 0.5, T.lost + 0.2 + r(1) * 0.3)), back = sine(ramp(t, T.inner + 0.8, T.inner + 2.2));
    const x = -0.7 + r(2) * 1.4 + (r(3) - 0.5) * 3 * inU, z = lerp(5, 2.95, inU), xf = lerp(x, x + 2.2 * (r(4) - 0.5), back), zf = lerp(z, 6.8, back);
    if (back < 1) out.push(<Raider key={`f${i}`} p={[xf, hAt(xf, zf, t), zf]} r={back > 0 ? 0 : Math.PI} />);
  }
  return <group>{out}</group>;
};

export const Builder: React.FC<{t: number}> = ({t}) => {
  const y = hAt(0, 0, t);
  if (t < T.cDitch) {const fall = ramp(t, T.stab, T.stab + 0.3); return <group position={[0, y + 0.02, 0]} rotation={[0, 0, -1.4 * fall]}><ScaleFigure position={[0, 0, 0]} h={FIG} /></group>;}
  if (t < T.stoneEnd) return <ScaleFigure position={[1.4, y, 2.2]} h={FIG} rotation={0.8} />;
  if (t >= T.cGate && t < T.cMine) return <ScaleFigure position={[3.7, HT + 1.2, -0.2]} h={0.76} rotation={1.5} />;
  return <ScaleFigure position={[-K + 0.35, HT + KH, K - 0.45]} h={FIG} rotation={0.6} />;
};

const Ladder: React.FC<{k: Kit; x: number; t: number}> = ({k, x, t}) => {
  const u = sine(ramp(t, T.cLadder, T.ladders + 0.3));
  const off = ramp(t, T.hang + 0.5, T.hang + 1.1);
  if (t < T.cLadder || t > T.cInner) return null;
  const L = 1.8, tilt = lerp(1.45, -0.42, u) + 1.3 * off;
  return <group position={[x, HT, A + 0.95]} rotation={[tilt, 0, 0]}>
    {[-0.16, 0.16].map((d) => <mesh key={d} position={[d, L / 2, 0]} material={k.log} castShadow><boxGeometry args={[0.05, L, 0.05]} /></mesh>)}
    {Array.from({length: 7}, (_, i) => <mesh key={i} position={[0, 0.2 + i * 0.24, 0]} material={k.log}><boxGeometry args={[0.32, 0.04, 0.04]} /></mesh>)}
  </group>;
};

export const Works: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const z = cutZ(t);
  const drop = inQuad(ramp(t, T.drops, T.dropEnd - 0.2));
  const ptop = t < T.drops ? 1 : 1 - drop;
  const dig = ramp(t, T.tunnels - 0.5, T.prop);
  const propU = ramp(t, T.prop, T.propEnd);
  const pw = 2.9 * dig, X1 = 5.1;
  const cornerD = ramp(t, T.corner - 0.15, T.corner + 0.6);
  const rubble = 1 - ramp(t, T.round, T.round + 0.7);
  const towers = (i: number) => outCubic(ramp(t, T.round + i * 0.12, T.towerEnd + i * 0.05));
  const dirt = t > T.dig - 0.1 && t < T.steeper + 0.6;
  return (
    <group>
      {z === 0 && t >= T.cGate && <mesh position={[4.47, HT + 0.45 + ptop * 0.9, -0.17]} material={k.iron}><boxGeometry args={[0.1, 0.9, 0.3]} /></mesh>}
      {t >= T.cStone && <group position={[4.47, HT + 0.45 + ptop * 0.9, 0]}>
        {[-0.24, -0.08, 0.08, 0.24].map((v) => <mesh key={v} position={[0, 0, v]} material={k.iron}><boxGeometry args={[0.08, 0.86, 0.05]} /></mesh>)}
        {[-0.32, 0, 0.32].map((v) => <mesh key={v} position={[0, v, 0]} material={k.iron}><boxGeometry args={[0.09, 0.05, 0.62]} /></mesh>)}
      </group>}
      {t >= T.cGate && t < T.cMine && <>
        <Fall k={k} n={7} o={[3.5, HT + 1.3, -0.15]} t={t} t0={T.rocks} seed={1} spread={0.1} drift={0} />
        <Fall k={k} n={7} o={[3.92, HT + 1.3, -0.15]} t={t} t0={T.rocks + 0.4} seed={4} spread={0.1} drift={0} />
        {t > T.boil - 0.1 && [3.5, 3.92].flatMap((x, a) => Array.from({length: 10}, (_, i) => {const q = frac(i / 10 + t * 1.5); return <mesh key={`${a}${i}`} position={[x + 0.04 * Math.sin(i * 7), lerp(HT + 1.25, HT + 0.02, q * q), -0.05]} scale={[0.05, 0.1, 0.05]} renderOrder={20}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#58C5FF" toneMapped={false} /></mesh>;}))}
      </>}
      {z === MINE && <group position={[0, 0, MINE + 0.012]}>
        <mesh position={[X1 - pw / 2, 0.97, 0]} scale={[pw, 0.72, 1]} renderOrder={3}><planeGeometry /><meshBasicMaterial color="#1C1410" /></mesh>
        {[2.45, 2.95, 3.45, 3.95, 4.45].map((x, i) => {
          const u = outCubic(ramp(t, T.prop + i * 0.14, T.prop + 0.3 + i * 0.14));
          const burnt = ramp(t, T.burning + i * 0.08, T.burning + 0.9 + i * 0.08);
          return u > 0 && <group key={x}>
            <mesh position={[x, 0.61 + 0.36 * u, 0]} scale={[0.12, 0.72 * u, 1]} renderOrder={4}><planeGeometry /><meshBasicMaterial color={burnt > 0.5 ? "#201008" : "#C9944F"} toneMapped={false} /></mesh>
            {t > T.burning + i * 0.08 && <Flame p={[x, 0.65, 0.01]} s={1.25} t={t} i={i} flat />}
          </group>;
        })}
        {propU >= 1 && <mesh position={[3.45, 1.36, 0]} scale={[2.3, 0.08, 1]} renderOrder={4}><planeGeometry /><meshBasicMaterial color="#C9944F" toneMapped={false} /></mesh>}
      </group>}
      {t >= T.corner - 0.15 && rubble > 0 && <Fall k={k} n={22} o={[A - 0.25, HT + 1.5, A - 0.25]} t={t} t0={T.corner - 0.15} seed={9} spread={1.5} />}
      {t >= T.corner - 0.15 && rubble > 0 && Array.from({length: 18}, (_, i) => <mesh key={i} position={[A - 0.5 + (rand(i) - 0.3) * 1.8, HT + 0.14, A - 0.5 + (rand(i * 2) - 0.3) * 1.8]} rotation={[rand(i * 3), rand(i * 4), 0]} scale={(0.18 + rand(i) * 0.14) * rubble * ramp(t, T.corner + 0.3, T.corner + 0.6)} material={k.stone} castShadow><boxGeometry /></mesh>)}
      {[[A, A], [A, -A], [-A, A], [-A, -A]].map(([x, zz], i) => {
        const u = towers(i);
        if (t < T.round || u <= 0) return null;
        return <Tower key={i} k={k} x={x} z={zz} u={u} />;
      })}
      {[-1.9, 0, 1.9].map((x) => <Ladder key={x} k={k} x={x} t={t} />)}
      {t > T.cWalk && t < T.cBreach && <Fall k={k} n={9} o={[-0.2, HT + WH - 0.1, A + 0.45]} t={t} t0={T.hang + 0.1} seed={13} spread={3.8} />}
      {dirt && Array.from({length: 26}, (_, i) => {
        const r = (q: number) => rand(i * 2.9 + q), t0 = T.dig + r(1) * (T.steeper - T.dig - 0.6), u = ramp(t, t0, t0 + 0.6);
        if (u <= 0 || u >= 1) return null;
        const a = r(2) * 6.28, p: V = [lerp(8 * Math.cos(a), 1.5 * Math.cos(a), u), 0.2 + 3.2 * 4 * u * (1 - u), lerp(8 * Math.sin(a), 1.5 * Math.sin(a), u)];
        return <mesh key={i} position={p} scale={0.16} material={k.soil} castShadow><boxGeometry /></mesh>;
      })}
      {t < T.stab && Array.from({length: 18}, (_, i) => {const r = (q: number) => rand(i * 3.7 + q), t0 = r(1) * 2.2 - 0.6, u = ramp(t, t0, t0 + 0.5); return u > 0 && u < 1 ? <mesh key={i} position={[lerp(2.8 * Math.cos(r(2) * 6), 0.8 * Math.cos(r(2) * 6), u), lerp(0.1, 1, u) + 0.9 * 4 * u * (1 - u), lerp(2.8 * Math.sin(r(2) * 6), 0.8 * Math.sin(r(2) * 6), u)]} scale={0.13} material={k.soil} castShadow><boxGeometry /></mesh> : null;})}
    </group>
  );
};

const Tower: React.FC<{k: Kit; x: number; z: number; u: number}> = ({k, x, z, u}) => {
  const H = WH + 0.95, g = useMemo(() => {
    const a = new THREE.CylinderGeometry(0.62, 0.68, H + 0.3, 28, 1, false);
    const uv = a.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * (H + 0.3));
    a.translate(0, (H + 0.3) / 2, 0);
    const m: THREE.BufferGeometry[] = [a];
    for (let i = 0; i < 10; i++) {const q = (i / 10) * 6.283; const b = new THREE.BoxGeometry(0.2, 0.24, 0.16); b.rotateY(-q + Math.PI / 2); b.translate(0.56 * Math.cos(q), H + 0.42, 0.56 * Math.sin(q)); m.push(worldUV(b));}
    return mergeGeometries(m.map((q) => q.toNonIndexed()));
  }, [H]);
  return <mesh geometry={g} position={[x, HT - 0.3, z]} scale={[1, u, 1]} material={k.stone} castShadow receiveShadow />;
};

export const Finish: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const lvl = moatY(t), z = cutZ(t);
  const bridge = sine(ramp(t, T.bridge - 0.1, T.bridge + 0.55));
  const on = t >= T.moat - 0.2;
  const slit = ramp(t, T.slits, T.slits + 0.3);
  const archersOn = t >= T.innerEnd - 0.4;
  const flag = t >= T.concentric - 0.2;
  const water = useMemo(() => {
    const f = (x: number) => Math.min(heightAt(Math.hypot(x, z), 1, 1.1), lvl);
    const s = new THREE.Shape(); s.moveTo(-14, -1.4); for (let x = -14; x <= 14; x += 0.14) s.lineTo(x, f(x)); s.lineTo(14, -1.4); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [lvl, z]);
  void water;
  return (
    <group>
      {on && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, lvl, 0]} material={k.water} receiveShadow><ringGeometry args={[7, 9, 96]} /></mesh>}
      {t >= T.bridge - 0.2 && <group position={[6.6, 0.32, 0]} rotation={[0, 0, 1.25 * (1 - bridge)]}>
        <mesh position={[1.45, 0, 0]} material={k.log} castShadow receiveShadow><boxGeometry args={[2.9, 0.1, 1.1]} /></mesh>
        {[-0.48, 0.48].map((v) => <mesh key={v} position={[1.45, 0.08, v]} material={k.iron}><boxGeometry args={[2.9, 0.06, 0.05]} /></mesh>)}
      </group>}
      {slit > 0 && [[-2.4, A + 0.21], [-1.5, A + 0.21], [1.5, A + 0.21], [2.3, A + 0.21]].map(([x, zz], i) => <mesh key={i} position={[x, HT + 0.72, zz]} scale={[0.09, 0.62 * slit, 1]}><planeGeometry /><meshBasicMaterial color="#14110E" /></mesh>)}
      {slit > 0 && [-1.5, -0.5, 0.5, 1.5].map((x, i) => <mesh key={i} position={[x, HT + 1.7, B + 0.345]} scale={[0.08, 0.5 * slit, 1]}><planeGeometry /><meshBasicMaterial color="#14110E" /></mesh>)}
      {archersOn && [-1.6, -0.6, 0.4, 1.4].map((v, i) => <ScaleFigure key={i} position={[v, HT + IH, B + 0.17]} h={FIG} rotation={0} />)}
      {archersOn && [-1, 1].map((d, i) => <ScaleFigure key={`r${i}`} position={[d * (B + 0.17), HT + IH, CONC - 0.08]} h={FIG} rotation={d * 1.57} />)}
      {t >= T.archers && t < T.concentric + 1 && Array.from({length: 16}, (_, i) => {
        const r = (q: number) => rand(i * 2.1 + q), per = 0.75, u = frac((t + r(1)) / per), yy = HT + IH + 0.5;
        const p: V = [lerp(2.6, 6.8, u), yy + 1.1 * 4 * u * (1 - u) - 3.4 * u, CONC - 0.05 - r(2) * 0.4];
        return <mesh key={i} position={p} rotation={[0, 0, -0.3 + u * -0.9]} scale={[0.42, 0.035, 0.035]}><boxGeometry /><meshBasicMaterial color="#1A1208" /></mesh>;
      })}
      {flag && <group position={[0, HT + KH, 0]}>
        <mesh position={[0, 0.65, 0]} material={k.iron}><cylinderGeometry args={[0.025, 0.025, 1.3, 8]} /></mesh>
        <mesh position={[0.34, 1.08, 0]} rotation={[0, 0.1 * Math.sin(t * 5), 0]}><planeGeometry args={[0.66, 0.4]} /><meshStandardMaterial color="#1E4FA8" side={THREE.DoubleSide} /></mesh>
      </group>}
    </group>
  );
};

export const FireArrow: React.FC<{t: number}> = ({t}) => {
  if (t < T.arrow - 0.1 || t > T.fire + 0.1) return null;
  const u = ramp(t, T.arrow - 0.1, T.fire);
  const p: V = [lerp(12, A, u), lerp(1, HT + 1.1, u) + 2.6 * 4 * u * (1 - u), lerp(4, A, u)];
  return <group position={p} rotation={[0, 0, -0.5]}>
    <mesh scale={[0.7, 0.03, 0.03]}><boxGeometry /><meshBasicMaterial color="#2A1A0C" /></mesh>
    <mesh position={[-0.34, 0, 0]} scale={0.14}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#FF8A1F" toneMapped={false} /></mesh>
  </group>;
};

const Pig: React.FC<{p: V; r: number}> = ({p, r}) => (
  <group position={p} rotation={[0, r, 0]}>
    <mesh position={[0, 0.2, 0]} scale={[0.26, 0.16, 0.14]} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#F0A3A0" roughness={0.6} /></mesh>
    <mesh position={[0.26, 0.24, 0]} scale={0.1} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#F0A3A0" roughness={0.6} /></mesh>
    <mesh position={[0.36, 0.23, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.045, 0.03, 0.045]}><cylinderGeometry args={[1, 1, 1, 10]} /><meshStandardMaterial color="#D97F7E" /></mesh>
    {[[-0.14, -0.08], [-0.14, 0.08], [0.14, -0.08], [0.14, 0.08]].map(([x, z], i) => <mesh key={i} position={[x, 0.05, z]}><cylinderGeometry args={[0.025, 0.025, 0.1, 6]} /><meshStandardMaterial color="#D97F7E" /></mesh>)}
  </group>
);
export const Pigs: React.FC<{t: number}> = ({t}) => {
  if (t < T.cPigs || t >= T.cRound) return null;
  return <group>{Array.from({length: 14}, (_, i) => {
    const x = 1.2 + (i % 7) * 0.5 + (t - T.cPigs) * 0.5, z = 5.9 + Math.floor(i / 7) * 0.6 + rand(i) * 0.14;
    return <Pig key={i} p={[x, hAt(x, z, t) + 0.03 * Math.abs(Math.sin(t * 12 + i)), z]} r={0} />;
  })}</group>;
};

/** The handle is burned into a supply crate near the front of the hill. */
export const BrandCrate: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 460; const g = c.getContext("2d")!;
    g.fillStyle = "#8C6242"; g.fillRect(0, 0, 1024, 460);
    for (let i = 0; i < 3; i++) {g.fillStyle = i % 2 ? "#946A49" : "#84593A"; g.fillRect(0, i * 153, 1024, 151); g.fillStyle = "#4A3020"; g.fillRect(0, i * 153 + 150, 1024, 4);}
    g.font = "700 138px Georgia, 'Times New Roman', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(40,20,8,.55)"; g.shadowBlur = 10; g.fillStyle = "#23130A"; g.fillText(String(cfg.handle ?? ""), 512, 234);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 12; return tx;
  }, []);
  if (t < T.stoneEnd) return null;
  const x = 4.45, z = 2.55;
  return <group position={[x, hAt(x, z, t), z]} rotation={[0, 0.56, 0]}>
    <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[1.3, 0.6, 0.62]} /><meshStandardMaterial color="#7A5336" roughness={0.9} /></mesh>
    <mesh position={[0, 0.3, 0.312]}><planeGeometry args={[1.28, 0.58]} /><meshStandardMaterial map={face} roughness={0.85} /></mesh>
  </group>;
};
void APRON; void lv;

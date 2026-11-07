import {useMemo} from "react";
import * as THREE from "three";
import {quad} from "@engine/quad";
import {FlowPipe} from "@engine/primitives";
import {inQuad, lerp, outCubic, ramp, rand, sine} from "@engine/clock";
import type {Mats} from "@engine/materials";
import cfg from "../../cutaway.json";
import {Bucket, OUTFITS, Person, STAND, Shovel, carry, cheer, climb, collapse, crank, dig, drink, haul, kneel, mixPose, pump, walk} from "@engine/kit/Person";
import {Dust, Smoke, Sparks, Splash} from "@engine/kit/fx";
import {Bush, Stones, Tufts} from "@engine/kit/Dressing";
import T from "./cues";

type V = [number, number, number];
const R = 0.72, FAR = 70;
const LAYERS: [number, number, string][] = [[0, -1.3, "topsoil"], [-1.3, -4, "clay"], [-4, -8.6, "gravel"], [-8.6, -14.6, "aquifer"], [-14.6, -45, "bed"]];
const frac = (x: number) => x - Math.floor(x);

export const depth = (t: number) => {
  let d = lerp(-0.7, -2.6, sine(ramp(t, -0.5, T.have)));
  d = lerp(d, -1.3, sine(ramp(t, T.cave, T.bury + 0.2)));
  d = lerp(d, -3.4, sine(ramp(t, T.start, T.lining)));
  return lerp(d, -13, sine(ramp(t, T.deeper - 0.1, T.sand)));
};
export const table = (t: number) => lerp(-2.75, -11.6, sine(ramp(t, T.drops, T.bottom + 0.2)));
const lined = (t: number) => (t < T.start ? 0 : depth(t));
const dirty = (t: number) => ramp(t, T.rain + 0.4, T.into + 0.5) * (1 - ramp(t, T.sheds, T.away + 0.4));

const canvasTex = (seed: number, base: string, fleck: string, grains: number, rep: number, gsize = 7) => {
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < grains; i++) {g.fillStyle = `rgba(${fleck},${0.08 + 0.2 * rand(seed + i)})`; g.beginPath(); g.ellipse(rand(seed + i * 2.1) * 512, rand(seed + i * 3.3) * 512, 1.5 + gsize * rand(seed + i * 4.7), 1.5 + gsize * 0.7 * rand(seed + i * 5.9), rand(i) * 3, 0, 7); g.fill();}
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 12;
  return t;
};
export const useKit = (m: Mats) => useMemo(() => {
  const mk = (t: THREE.Texture, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({map: t, roughness: 0.95, shadowSide: THREE.DoubleSide, ...p});
  const s = document.createElement("canvas"); s.width = s.height = 512; const g = s.getContext("2d")!;
  g.fillStyle = "#5C554A"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 5; r++) for (let i = -1; i < 5; i++) {const x = i * 110 + (r % 2 ? 55 : 0) + 8 * rand(r + i), v = Math.round(lerp(150, 200, rand(r * 13 + i * 7))); g.fillStyle = `rgb(${v},${v - 8},${v - 22})`; g.beginPath(); g.roundRect(x + 4, r * 102 + 4, 102, 94, 16); g.fill();}
  const st = new THREE.CanvasTexture(s); st.colorSpace = THREE.SRGBColorSpace; st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(0.9, 0.9); st.anisotropy = 12;
  return {
    ground: mk(canvasTex(1, "#C2A36B", "120,92,52", 2600, 1 / 6, 16)),
    topsoil: mk(canvasTex(2, "#5E3E26", "30,18,10", 2600, 1 / 3, 5)),
    clay: mk(canvasTex(3, "#A8623A", "84,40,20", 1800, 1 / 4, 7)),
    gravel: mk(canvasTex(4, "#A79478", "62,52,42", 1700, 1 / 3, 9)),
    aquifer: mk(canvasTex(5, "#B9A67E", "90,76,54", 5200, 1 / 2.2, 7)),
    bed: mk(canvasTex(6, "#5A5C63", "28,30,34", 900, 1 / 6, 16)),
    stone: mk(st), wood: m.plank,
    log: new THREE.MeshStandardMaterial({color: "#7B5230", roughness: 0.85}),
    iron: new THREE.MeshStandardMaterial({color: "#2F4A52", metalness: 0.55, roughness: 0.42}),
    shaft: new THREE.MeshStandardMaterial({color: "#4E3A2A", roughness: 1, side: THREE.BackSide}),
    mud: new THREE.MeshStandardMaterial({color: "#4A3524", roughness: 0.7}),
  };
}, [m]);
export type Kit = ReturnType<typeof useKit>;

const halfCyl = (r0: number, r1: number, h: number) => new THREE.CylinderGeometry(r0, r1, h, 40, 1, true, Math.PI / 2, Math.PI);
const halfDisk = (r: number) => {const g = new THREE.CircleGeometry(r, 40, 0, Math.PI); g.rotateX(-Math.PI / 2); g.rotateY(0); return g;};

export const Ground: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const qd = Math.round(depth(t) * 30) / 30;
  const g = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-R, 0); s.absarc(0, 0, R, Math.PI, 0, true); s.lineTo(R, R); s.lineTo(-R, R); s.closePath();
    const lip = new THREE.ShapeGeometry(s, 32); lip.rotateX(-Math.PI / 2);
    return {
      top: [quad([-FAR, 0, 0], [-R, 0, 0], [-R, 0, -FAR], [-FAR, 0, -FAR]), quad([R, 0, 0], [FAR, 0, 0], [FAR, 0, -FAR], [R, 0, -FAR]), quad([-R, 0, -R], [R, 0, -R], [R, 0, -FAR], [-R, 0, -FAR])], lip,
      sides: LAYERS.flatMap(([a, b]) => [quad([-FAR, b, 0], [-R, b, 0], [-R, a, 0], [-FAR, a, 0]), quad([R, b, 0], [FAR, b, 0], [FAR, a, 0], [R, a, 0])]),
    };
  }, []);
  const strip = useMemo(() => LAYERS.map(([a, b]) => {const tp = Math.min(a, qd); return tp > b ? quad([-R, b, 0], [R, b, 0], [R, tp, 0], [-R, tp, 0]) : null;}), [qd]);
  const shaft = useMemo(() => halfCyl(R, R, -qd), [qd]);
  const floor = useMemo(() => halfDisk(R), []);
  const wt = table(t), lvl = Math.max(qd, wt), water = wt > qd + 0.02;
  const lq = Math.round(lined(t) * 12) / 12;
  const caps = useMemo(() => lq < -0.05 ? [quad([-R, lq, 0.008], [-R + 0.17, lq, 0.008], [-R + 0.17, 0, 0.008], [-R, 0, 0.008]), quad([R - 0.17, lq, 0.008], [R, lq, 0.008], [R, 0, 0.008], [R - 0.17, 0, 0.008])] : [], [lq]);
  const d = dirty(t);
  const wc = new THREE.Color("#2C8BE6").lerp(new THREE.Color("#7A5A30"), Math.max(d, t < T.lining ? 0.8 : 0));
  return (
    <group>
      {g.top.map((q, i) => <mesh key={i} geometry={q} material={k.ground} receiveShadow />)}
      <mesh geometry={g.lip} material={k.ground} receiveShadow />
      {g.sides.map((q, i) => <mesh key={i} geometry={q} material={k[LAYERS[Math.floor(i / 2)][2] as "clay"]} />)}
      {strip.map((q, i) => q && <mesh key={i} geometry={q} material={k[LAYERS[i][2] as "clay"]} />)}
      <mesh geometry={shaft} material={k.shaft} position={[0, qd / 2, 0]} />
      <mesh geometry={floor} material={k.mud} position={[0, qd + 0.005, 0]} scale={[0.97, 1, 0.97]} />
      {water && <>
        <mesh geometry={floor} position={[0, lvl, 0]} scale={[0.76, 1, 0.76]}><meshStandardMaterial color={wc} roughness={Math.max(d, t < T.lining ? 1 : 0) > 0.3 ? 0.85 : 0.2} /></mesh>
        <mesh position={[0, (qd + lvl) / 2, 0.006]} scale={[R * 2 - 0.02, lvl - qd, 1]} renderOrder={6}><planeGeometry /><meshBasicMaterial color={wc} transparent opacity={0.8} depthWrite={false} /></mesh>
      </>}
      {caps.map((q, i) => <mesh key={i} geometry={q} material={k.stone} />)}
      {/* The saturated ground below the water table. */}
      <mesh position={[0, (wt - 14.6) / 2, 0.012]} scale={[140, -14.6 - wt, 1]} renderOrder={5}><planeGeometry /><meshBasicMaterial color="#1F7BDE" transparent opacity={0.3} depthWrite={false} /></mesh>
      <mesh position={[0, wt, 0.014]} scale={[140, 0.05, 1]} renderOrder={6}><planeGeometry /><meshBasicMaterial color="#BDE6FF" toneMapped={false} /></mesh>
    </group>
  );
};

const STONE_N = 44;
const STONES = (() => {
  const m = new THREE.Object3D(), out: THREE.Matrix4[] = [];
  for (let c = 0; c < STONE_N; c++) for (let i = 0; i < 8; i++) {
    const a = Math.PI + ((i + 0.5 + (c % 2) * 0.5) / 8) * Math.PI;
    m.position.set((R - 0.1) * Math.cos(a), -0.17 - c * 0.31, (R - 0.1) * Math.sin(a)); m.rotation.set(0, -a + Math.PI / 2, 0); m.scale.set(0.27, 0.29, 0.2); m.updateMatrix(); out.push(m.matrix.clone());
  }
  return out;
})();
export const Lining: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const n = Math.min(STONE_N, Math.floor(-lined(t) / 0.31)) * 8;
  const ref = (r: THREE.InstancedMesh | null) => {if (r) {STONES.forEach((q, i) => r.setMatrixAt(i, q)); r.count = n; r.instanceMatrix.needsUpdate = true;}};
  return <instancedMesh ref={ref} args={[geo, k.stone, STONES.length]} castShadow receiveShadow frustumCulled={false} />;
};

export const Scenery: React.FC<{t: number}> = ({t}) => {
  const list = useMemo(() => Array.from({length: 22}, (_, i) => {const r = (n: number) => rand(i * 3.3 + n); return {x: lerp(-42, 42, r(1)), z: lerp(-40, -16, r(2)), s: lerp(1.6, 3, r(3))};}), []);
  const green = ramp(t, T.kitchen - 1.5, T.built);
  return (
    <group>
      {[[-40, -70, 40, 11], [24, -92, 62, 15], [66, -64, 38, 9]].map(([x, z, w, h], i) => <mesh key={i} position={[x, -0.5, z]} scale={[w, h, 22]}><sphereGeometry args={[1, 36, 18]} /><meshStandardMaterial color="#C69B62" roughness={1} /></mesh>)}
      {list.map((k, i) => <group key={i} position={[k.x, 0, k.z]}>
        <mesh position={[0, k.s * 0.4, 0]} castShadow><cylinderGeometry args={[0.1, 0.18, k.s * 0.8, 7]} /><meshStandardMaterial color="#5A402C" /></mesh>
        <mesh position={[0, k.s * 0.92, 0]} scale={[k.s * 0.62, k.s * 0.3, k.s * 0.62]} castShadow><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color="#5F7A3A" roughness={0.95} /></mesh>
      </group>)}
      <Tufts n={700} area={[-16, 16, -16, -0.2]} seed={2} color="#A69445" keep={(s) => Math.hypot(s.x, s.z) > 2.5 && !(s.x > 3.7 && s.x < 8.1 && s.z > -3.6)} />
      <Stones n={46} area={[-14, 14, -13, -0.3]} seed={5} color="#9B8F7C" keep={(s) => Math.hypot(s.x, s.z) > 2.6 && !(s.x > 3.7 && s.x < 8.1 && s.z > -3.6)} />
      <Bush p={[-5.2, 0, -2.6]} s={1.2} color="#6E7E3C" /><Bush p={[3.4, 0, -4.2]} s={1.4} color="#6E7E3C" seed={4} /><Bush p={[-1.7, 0, -5.4]} s={1.1} color="#6E7E3C" seed={7} />
      {green > 0 && <Tufts n={Math.round(900 * green)} area={[-3, 9.5, -7, -0.2]} seed={8} color="#4E9A3C" keep={(s) => Math.hypot(s.x, s.z) > 2.4 && !(s.x > 3.7 && s.x < 8.1 && s.z > -3.6)} />}
    </group>
  );
};

/** Headwall and apron, drawn as a half ring so the cut stays open. */
export const Wall: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const geos = useMemo(() => {
    const scaleUV = (g: THREE.BufferGeometry, u: number, v: number) => {const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * u, a.getY(i) * v); return g;};
    const ringTop = new THREE.RingGeometry(0.72, 1.02, 40, 1, 0, Math.PI); ringTop.rotateX(-Math.PI / 2);
    return {out: scaleUV(halfCyl(1.02, 1.02, 0.84), 3.6, 0.9), inn: scaleUV(halfCyl(0.72, 0.72, 0.84), 2.6, 0.9), ringTop, apron: scaleUV(new THREE.CylinderGeometry(1.03, 2.55, 0.22, 44, 1, true, Math.PI / 2, Math.PI), 6, 1)};
  }, []);
  const rise = sine(ramp(t, T.wall, T.top + 0.15)), ap = sine(ramp(t, T.apron - 0.15, T.sheds));
  if (rise <= 0) return null;
  return (
    <group>
      <group position={[0, 0.42 * rise, 0]} scale={[1, Math.max(0.01, rise), 1]}>
        <mesh geometry={geos.out} material={k.stone} castShadow receiveShadow />
        <mesh geometry={geos.inn}><meshStandardMaterial map={k.stone.map} roughness={0.95} side={THREE.BackSide} /></mesh>
        <mesh geometry={geos.ringTop} material={k.stone} position={[0, 0.42, 0]} />
        {[-1, 1].map((d) => <mesh key={d} position={[d * 0.87, 0, 0.004]} scale={[0.3, 0.84, 1]}><planeGeometry /><meshStandardMaterial color="#A49A86" roughness={1} /></mesh>)}
      </group>
      {ap > 0 && <group position={[0, 0.11, 0]} scale={[lerp(0.5, 1, ap), 1, lerp(0.5, 1, ap)]}>
        <mesh geometry={geos.apron} receiveShadow castShadow><meshStandardMaterial map={k.stone.map} roughness={0.9} side={THREE.DoubleSide} color="#C9C2B4" /></mesh>
        {[-1, 1].map((d) => {const s = new THREE.Shape(); s.moveTo(1.03, 0.22); s.lineTo(2.55, 0); s.lineTo(1.03, 0); s.closePath(); return <mesh key={d} geometry={new THREE.ShapeGeometry(s)} position={[0, -0.11, 0.004]} scale={[d, 1, 1]}><meshStandardMaterial color="#8F8878" side={THREE.DoubleSide} /></mesh>;})}
      </group>}
    </group>
  );
};

const Goat: React.FC<{p: V; r: number; t: number; i: number}> = ({p, r, t, i}) => (
  <group position={[p[0], p[1] + 0.02 * Math.abs(Math.sin(t * 6 + i)), p[2]]} rotation={[0, r, 0]}>
    <mesh position={[0, 0.42, 0]} scale={[0.34, 0.2, 0.17]} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#EDE6D8" roughness={0.9} /></mesh>
    <mesh position={[0.34, 0.56, 0]} scale={[0.13, 0.11, 0.09]} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#E4DCCC" roughness={0.9} /></mesh>
    {[-0.05, 0.05].map((z) => <mesh key={z} position={[0.32, 0.7, z]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.02, 0.17, 6]} /><meshStandardMaterial color="#5A4A38" /></mesh>)}
    {[[-0.22, -0.09], [-0.22, 0.09], [0.22, -0.09], [0.22, 0.09]].map(([x, z], k) => <mesh key={k} position={[x, 0.15, z]} rotation={[0, 0, 0.18 * Math.sin(t * 7 + k * 2 + i)]} castShadow><cylinderGeometry args={[0.024, 0.02, 0.32, 6]} /><meshStandardMaterial color="#D3CAB8" /></mesh>)}
  </group>
);

const Rain: React.FC<{t: number}> = ({t}) => {
  const on = t > T.rain - 0.1 && t < T.wall + 0.4;
  const geo = useMemo(() => {const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(420 * 6), 3)); return g;}, []);
  if (!on) return null;
  const a = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < 420; i++) {const r = (k: number) => rand(i * 2.3 + k), y = 12 - frac(r(1) + t * (1.2 + r(2) * 0.5)) * 12, x = -10 + r(3) * 20, z = -9 + r(4) * 11; a.setXYZ(i * 2, x, y, z); a.setXYZ(i * 2 + 1, x - 0.05, y - 0.42, z);}
  a.needsUpdate = true;
  return <lineSegments geometry={geo} frustumCulled={false}><lineBasicMaterial color="#D6ECFF" transparent opacity={0.6} /></lineSegments>;
};

export const Weather: React.FC<{t: number}> = ({t}) => {
  const out: {p: V; s: number; c: string}[] = [];
  if (t > T.rain && t < T.c1854) {
    const shed = ramp(t, T.apron, T.sheds);
    for (let i = 0; i < 30; i++) {
      const k = frac(i / 30 + t * 0.42), side = i % 2 ? 1 : -1, z = -0.12 - rand(i * 3) * 0.5, c = i % 3 ? "#6A4A22" : "#8A6A32";
      if (t < T.apron) {const u = k * 1.45; if (u < 1) out.push({p: [side * lerp(5.5, R, u), 0.05, z], s: 0.07, c}); else out.push({p: [side * R * 0.6, -(u - 1) * 6, z], s: 0.07, c});}
      else {const x = lerp(6, 2.6, Math.min(1, k * 1.7)), bounce = k * 1.7 > 1 ? (k * 1.7 - 1) * 5 : 0; if (shed > 0.2 || k < 0.5) out.push({p: [side * (x + bounce), 0.06, z - 0.3], s: 0.07, c});}
    }
  }
  return <group>{out.map((k, i) => <mesh key={i} position={k.p} scale={k.s} renderOrder={12}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color={k.c} /></mesh>)}<Rain t={t} /></group>;
};

/** Outhouse and its leaking pit. It gets dragged far away on screen. */
export const Toilet: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const move = sine(ramp(t, T.far - 0.1, T.toilets + 0.25));
  const x = lerp(-2.05, -8.4, move);
  const seep = ramp(t, T.leak - 0.3, T.cholera);
  const fill = ramp(t, T.far, T.toilets);
  return (
    <group>
      <group position={[x, 0, -1.5]}>
        <mesh position={[0, 1.05, 0]} material={k.wood} castShadow receiveShadow><boxGeometry args={[1.1, 2.1, 1.1]} /></mesh>
        <mesh position={[0, 2.22, 0]} rotation={[0, 0, 0.1]} material={k.log} castShadow><boxGeometry args={[1.36, 0.1, 1.36]} /></mesh>
        <mesh position={[0, 1.02, 0.555]}><planeGeometry args={[0.76, 1.84]} /><meshStandardMaterial color="#6A4426" roughness={0.9} /></mesh>
        <mesh position={[0.05, 1.58, 0.56]}><ringGeometry args={[0.06, 0.12, 20, 1, 0.8, 3.6]} /><meshBasicMaterial color="#1C120B" /></mesh>
        <mesh position={[0.28, 1, 0.57]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#333" /></mesh>
      </group>
      {t >= T.c1854 && fill < 1 && <group>
        <mesh position={[-2.05, -0.9, 0.016]} scale={[1.2, 1.8, 1]} renderOrder={7}><planeGeometry /><meshBasicMaterial color="#2A1C0C" transparent opacity={1 - fill} /></mesh>
        <mesh position={[-2.05, -1.1, 0.018]} scale={[1.08, 1.3, 1]} renderOrder={7}><planeGeometry /><meshBasicMaterial color="#5E5219" transparent opacity={1 - fill} /></mesh>
      </group>}
      {seep > 0 && fill < 1 && Array.from({length: 22}, (_, i) => {const q = frac(i / 22 + t * 0.55), xx = lerp(-1.5, -R + 0.05, q), y = -1.2 - 0.35 * Math.sin(i * 2.1) - 0.2 * q; return <mesh key={i} position={[xx, y, 0.02]} scale={0.055 * seep} renderOrder={8}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#9ACD32" toneMapped={false} /></mesh>;})}
      {t > T.three - 0.1 && t < T.far && <mesh position={[-1.13, 0.16, 0.02]} scale={[0.82, 0.05, 1]} renderOrder={9}><planeGeometry /><meshBasicMaterial color="#F4E58E" toneMapped={false} /></mesh>}
    </group>
  );
};

const Windlass: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const up = outCubic(ramp(t, T.wind - 0.3, T.crank));
  const gone = sine(ramp(t, T.cHand, T.cHand + 0.55));
  if (up <= 0 || gone >= 1) return null;
  const y = 2.05, rot = t * 7 * (t > T.crank && t < T.haul ? 1 : 0);
  const load = t < T.cDeep ? -1 : t < T.sand ? frac((t - T.cDeep) * 0.45) : 1;
  const by = load < 0 ? lerp(-2, 1.5, 0.5 + 0.5 * Math.sin((t - T.crank) * 1.1)) : lerp(depth(t) + 0.6, 1.5, Math.abs(1 - 2 * load));
  return (
    <group position={[0, lerp(2.6, 0, up) + 2.6 * gone, -0.08]}>
      {[-1.12, 1.12].map((x) => <mesh key={x} position={[x, y / 2, 0]} material={k.log} castShadow><boxGeometry args={[0.17, y + 0.1, 0.17]} /></mesh>)}
      <group position={[0, y, 0]} rotation={[rot, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={k.log} castShadow><cylinderGeometry args={[0.15, 0.15, 2.36, 14]} /></mesh>
        {[-0.3, -0.12, 0.06, 0.24].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.16, 0.03, 6, 18]} /><meshStandardMaterial color="#D8C79A" roughness={0.9} /></mesh>)}
        <mesh position={[1.3, 0, 0]} material={k.iron}><boxGeometry args={[0.05, 0.05, 0.05]} /></mesh>
        <mesh position={[1.3, -0.2, 0]} material={k.iron}><boxGeometry args={[0.05, 0.42, 0.05]} /></mesh>
        <mesh position={[1.5, -0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={k.iron}><cylinderGeometry args={[0.03, 0.03, 0.42, 8]} /></mesh>
      </group>
      <mesh position={[0, (y - 0.1 + by) / 2, 0]} scale={[1, y - 0.1 - by, 1]}><cylinderGeometry args={[0.018, 0.018, 1, 6]} /><meshStandardMaterial color="#D8C79A" /></mesh>
      <group position={[0, by + 0.28, 0]}><Bucket water={t < T.drops} /></group>
    </group>
  );
};

const HandPump: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const up = sine(ramp(t, T.cHand + 0.45, T.addP));
  const gone = sine(ramp(t, T.lower - 0.1, T.lower + 0.5));
  if (up <= 0 || gone >= 1) return null;
  const lever = 0.32 * Math.sin(t * 8.2);
  return (
    <group position={[0, 2.6 * (1 - up) + 3 * gone + 0.84, -0.14]}>
      <mesh position={[0, -0.03, 0.02]} scale={[2.04, 0.08, 1.05]} material={k.log} castShadow><boxGeometry /></mesh>
      <mesh position={[0, 0.52, 0]} material={k.iron} castShadow><cylinderGeometry args={[0.11, 0.15, 1, 16]} /></mesh>
      <mesh position={[0, 1.04, 0]} material={k.iron}><sphereGeometry args={[0.13, 14, 10]} /></mesh>
      <mesh position={[-0.26, 0.74, 0]} rotation={[0, 0, 1.2]} material={k.iron}><cylinderGeometry args={[0.04, 0.05, 0.42, 10]} /></mesh>
      <group position={[0.08, 1.05, 0]} rotation={[0, 0, lever]}><mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={k.iron}><cylinderGeometry args={[0.03, 0.03, 1.08, 8]} /></mesh></group>
    </group>
  );
};

export const Machines: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const riser = t >= T.cHand + 0.5;
  const pipeTop = 0.84, pipeBot = table(t) - 0.35;
  const stall = t < T.lower;
  const rise = ramp(t, T.addP + 0.3, T.ten);
  const stallY = lerp(table(t), -1.6, rise);
  const low = sine(ramp(t, T.lower - 0.05, T.pushes - 0.3));
  const py = lerp(-8.5, -12.1, low);
  const flow = t >= T.pushes - 0.1;
  const cap = sine(ramp(t, T.sealed - 0.2, T.cap + 0.1)), tank = outCubic(ramp(t, T.tank - 0.3, T.tank + 0.2));
  return (
    <group>
      <Windlass k={k} t={t} />
      {t >= T.cHaul && t < T.cCrank && (() => {
        const by = lerp(-2.4, 1.05, sine(ramp(t, T.cHaul, T.cCrank)));
        const a = new THREE.Vector3(0.62, 1.32, -0.3), b = new THREE.Vector3(0, 1.45, -0.2), c = new THREE.Vector3(0, by + 0.28, -0.2);
        const seg = (p: THREE.Vector3, q: THREE.Vector3, key: string) => {const m = p.clone().add(q).multiplyScalar(0.5), L = p.distanceTo(q), dir = q.clone().sub(p).normalize(); return <mesh key={key} position={m.toArray()} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir).toArray() as [number, number, number, number]} scale={[1, L, 1]}><cylinderGeometry args={[0.018, 0.018, 1, 6]} /><meshStandardMaterial color="#D8C79A" /></mesh>;};
        return <group>{seg(a, b, "h")}{seg(b, c, "v")}<group position={[0, by, -0.2]}><Bucket water /></group></group>;
      })()}
      <HandPump k={k} t={t} />
      {riser && <mesh position={[0, (pipeTop + pipeBot) / 2, -0.14]} scale={[1, pipeTop - pipeBot, 1]}><cylinderGeometry args={[0.06, 0.06, 1, 12]} /><meshStandardMaterial color="#6E7A84" metalness={0.5} roughness={0.4} /></mesh>}
      {riser && <mesh position={[0, 0, 0.018]} scale={[0.1, 0.1, 1]} renderOrder={0} visible={false}><planeGeometry /></mesh>}
      {riser && t < T.lower + 0.3 && t > T.addP && Array.from({length: 26}, (_, i) => {const q = frac(i / 26 + t * 0.5), y = lerp(pipeBot, stallY, q); return <mesh key={i} position={[0, y, 0.03]} scale={0.05} renderOrder={9}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#58C5FF" toneMapped={false} /></mesh>;})}
      {t > T.ten - 0.2 && stall && <mesh position={[1.9, (pipeBot + stallY) / 2, 0.02]} scale={[0.08, stallY - pipeBot, 1]} renderOrder={9}><planeGeometry /><meshBasicMaterial color="#F4E58E" toneMapped={false} /></mesh>}
      {t >= T.lower - 0.05 && <group>
        <mesh position={[0, (py + 0.84) / 2, -0.06]} scale={[1, 0.84 - py, 1]}><cylinderGeometry args={[0.018, 0.018, 1, 6]} /><meshStandardMaterial color="#20262B" /></mesh>
        <group position={[0, py, -0.04]}>
          <mesh material={k.iron}><cylinderGeometry args={[0.15, 0.15, 1, 18]} /></mesh>
          <mesh position={[0, 0.54, 0]}><coneGeometry args={[0.15, 0.2, 18]} /><meshStandardMaterial color="#C8CED4" metalness={0.6} roughness={0.3} /></mesh>
          {[-0.28, -0.1, 0.08, 0.26].map((y) => <mesh key={y} position={[0, y, 0.15]} scale={[0.2, 0.05, 1]} renderOrder={10}><planeGeometry /><meshBasicMaterial color={flow ? "#58C5FF" : "#7D8A94"} toneMapped={false} /></mesh>)}
        </group>
      </group>}
      {flow && Array.from({length: 40}, (_, i) => {const q = frac(i / 40 + t * 1.2), y = lerp(py + 0.6, 0.84, q); return <mesh key={i} position={[0, y, 0.03]} scale={0.055} renderOrder={9}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#58C5FF" toneMapped={false} /></mesh>;})}
      {cap > 0 && <mesh position={[0, lerp(2.4, 0.9, cap), -0.02]} material={k.iron} castShadow><cylinderGeometry args={[1.1, 1.1, 0.14, 32, 1, false, Math.PI / 2, Math.PI]} /></mesh>}
      {tank > 0 && <group position={[2.6, 0, -0.5]} scale={tank}>
        <mesh position={[0, 0.72, 0]} castShadow><capsuleGeometry args={[0.34, 0.8, 8, 20]} /><meshStandardMaterial color="#2B73C7" metalness={0.45} roughness={0.32} /></mesh>
        <mesh position={[0, 0.08, 0]} material={k.iron}><cylinderGeometry args={[0.28, 0.32, 0.16, 16]} /></mesh>
      </group>}
      {t >= T.pipe - 0.2 && <FlowPipe t={t} points={[[0, -0.7, 0.05], [1.3, -0.7, 0.05], [2.6, -0.7, 0.05], [4, -0.7, 0.05], [5.2, -0.7, 0.05], [5.2, 0.4, 0.05], [5.2, 0.92, -0.45]]} grow={[T.pipe - 0.1, T.kitchen + 0.2]} flow={[T.pipe, 70]} radius={0.075} color="#3A4C58" bead="#8FDBFF" speed={0.5} />}
      {t >= T.tank && <mesh position={[2.6, -0.3, 0.05]} scale={[1, 0.8, 1]}><cylinderGeometry args={[0.06, 0.06, 1, 10]} /><meshStandardMaterial color="#3A4C58" /></mesh>}
    </group>
  );
};

/** Open-fronted house, so the kitchen tap is the payoff. */
export const House: React.FC<{k: Kit; t: number}> = ({k, t}) => {
  const tap = t > T.kitchen + 0.2;
  const roof = useMemo(() => {const s = new THREE.Shape(); s.moveTo(-2.35, 0); s.lineTo(0, 1.5); s.lineTo(2.35, 0); s.closePath(); return new THREE.ExtrudeGeometry(s, {depth: 3.1, bevelEnabled: false});}, []);
  return (
    <group position={[5.9, 0, 0]}>
      <mesh position={[0, 1.3, -3]} material={k.stone} castShadow receiveShadow><boxGeometry args={[4.4, 2.6, 0.22]} /></mesh>
      {[-2.1, 2.1].map((x) => <mesh key={x} position={[x, 1.3, -1.5]} material={k.stone} castShadow receiveShadow><boxGeometry args={[0.22, 2.6, 3.1]} /></mesh>)}
      <mesh position={[0, 0.02, -1.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.2, 3]} /><meshStandardMaterial color="#8C6242" roughness={0.9} /></mesh>
      <mesh geometry={roof} position={[0, 2.6, -3.08]} castShadow><meshStandardMaterial color="#8E4B32" roughness={0.9} /></mesh>
      <mesh position={[1.2, 3.6, -2.2]} material={k.stone} castShadow><boxGeometry args={[0.46, 1.5, 0.46]} /></mesh>
      <mesh position={[-0.7, 0.45, -0.6]} material={k.log} castShadow><boxGeometry args={[1.5, 0.9, 0.7]} /></mesh>
      <mesh position={[-0.7, 0.915, -0.6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.8, 0.42]} /><meshStandardMaterial color="#D6DADF" metalness={0.4} roughness={0.3} /></mesh>
      <group position={[-0.7, 0.92, -0.8]}>
        <mesh position={[0, 0.16, 0]} material={k.iron}><cylinderGeometry args={[0.03, 0.03, 0.32, 8]} /></mesh>
        <mesh position={[0, 0.32, 0.09]} rotation={[Math.PI / 2, 0, 0]} material={k.iron}><cylinderGeometry args={[0.03, 0.03, 0.2, 8]} /></mesh>
        {tap && <mesh position={[0, 0.14, 0.19]} scale={[1, 0.34, 1]}><cylinderGeometry args={[0.03, 0.022, 1, 8]} /><meshBasicMaterial color="#8FDBFF" toneMapped={false} /></mesh>}
      </group>
      {tap && <Splash t={t} at={Math.floor((t - T.kitchen) * 2) / 2 + T.kitchen} o={[-0.7, 0.93, -0.61]} n={8} power={0.3} ring={0} seed={Math.floor(t * 2)} />}
      <Smoke t={t} o={[1.2, 4.3, -2.2]} n={9} h={3.4} size={0.75} color="#C9C4BA" />
    </group>
  );
};

export const People: React.FC<{k: Kit; t: number}> = ({t}) => {
  const D = depth(t), out: React.ReactNode[] = [];
  const B = OUTFITS.builder, W2 = OUTFITS.worker, V3 = OUTFITS.villager;
  if (t < T.cCave) out.push(<Person key="b" p={[0, D, -0.32]} r={0.5} h={1.72} pose={mixPose(dig(t), dig(t), 0)} o={B} right={<group scale={0.66}><Shovel /></group>} />);
  else if (t < T.cLine) out.push(<Person key="b" p={[0, -2.6, -0.32]} r={0.2} h={1.72} pose={cheer(t)} o={B} />);
  else if (t < T.cRain) out.push(<Person key="b" p={[0, D, -0.32]} r={0.5} h={1.72} pose={dig(t)} o={B} right={<group scale={0.66}><Shovel /></group>} />);
  else if (t < T.c1854) {
    const c = ramp(t, T.cWall, T.apron);
    out.push(t < T.cWall ? <Person key="b" p={[3.2, 0, -1.1]} r={-0.9} pose={STAND} o={B} /> : <Person key="b" p={[lerp(4, 1.65, Math.min(1, c * 1.2)), 0, -0.7]} r={-Math.PI / 2} pose={c < 0.8 ? carry(t) : kneel(t)} o={B} />);
    if (t >= T.cWall) out.push(<Person key="w" p={[lerp(-4, -1.75, Math.min(1, c * 1.4)), 0, -0.9]} r={Math.PI / 2} pose={c < 0.7 ? carry(t, 1.2) : kneel(t)} o={W2} />);
  } else if (t < T.cHaul) {
    const dead = ramp(t, T.killed, T.killed + 0.5);
    if (t < T.cFar) {out.push(<Person key="v" p={[1.4, 0, -0.8]} r={-1.3} pose={mixPose(drink(t), collapse(t), dead)} o={V3} right={dead < 0.5 ? <Bucket /> : undefined} />); out.push(<Person key="v2" p={[2.4, 0, -1.3]} r={-1.3} pose={mixPose(STAND, collapse(t), ramp(t, T.killed + 0.3, T.killed + 0.8))} o={W2} />);}
    else out.push(<Person key="w" p={[lerp(-6.2, -6.8, 0), 0, -2.1]} r={1.3} pose={haul(t, 1.8)} o={W2} />);
    if (t >= T.cFar) out.push(<Person key="b" p={[-7, 0, -1.3]} r={1.5} pose={haul(t, 1.8)} o={B} />);
  } else if (t < T.cCrank) out.push(<Person key="b" p={[1.45, 0.2, -0.32]} r={-Math.PI / 2} pose={mixPose(haul(t, 0.9), haul(t, 0.9), 0)} o={B} />);
  else if (t < T.cHand) {
    out.push(<Person key="b" p={[2.12, 0.2, -0.16]} r={-Math.PI / 2} pose={t < T.drops || t >= T.cDeep ? crank(t) : STAND} o={B} />);
    if (t >= T.cDeep && t < T.sand) out.push(<Person key="w" p={[0, D, -0.32]} r={0.4} h={1.72} pose={dig(t, 1.6)} o={W2} right={<group scale={0.66}><Shovel /></group>} />);
    if (t >= T.sand) {const u = ramp(t, T.cAqui, T.cHand - 0.4); out.push(<Person key="w" p={[0.28, lerp(D, 0.1, u), -0.3]} r={0.3} h={1.72} pose={climb(t)} o={W2} air />);}
  } else if (t < T.cAdd) {
    const gone = t > T.lower;
    out.push(<Person key="b" p={[1.5, 0.2, -0.18]} r={-Math.PI / 2} pose={gone ? haul(t) : pump(t)} o={B} />);
  } else if (t < T.cEnd) {
    out.push(<Person key="b" p={[2, 0.2, -0.9]} r={-1.2} pose={walk(t)} o={B} />);
    out.push(<Person key="v" p={[5.2, 0.03, -1.55]} r={0} pose={STAND} o={V3} />);
  } else {
    out.push(<Person key="b" p={[2.9, 0, -1.5]} r={0.3} pose={cheer(t)} o={B} />);
    out.push(<Person key="w" p={[1.8, 0, -1.6]} r={0.4} pose={cheer(t + 0.2)} o={W2} />);
    out.push(<Person key="v" p={[5.2, 0.03, -1.55]} r={0} pose={drink(t)} o={V3} />);
  }
  return <group>{out}</group>;
};

export const Goats: React.FC<{t: number}> = ({t}) => <group>{[[-4.4, -1.8, 0.3], [-3.2, -2.9, 2.4], [-5.6, -3.2, 0.9]].map(([x, z, r], i) => <Goat key={i} p={[x + 0.45 * Math.sin(t * 0.5 + i), 0, z]} r={r} t={t} i={i} />)}</group>;

export const Effects: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  const beats = Array.from({length: 7}, (_, i) => i * 0.72 + 0.1).filter((x) => x < T.cCave);
  beats.forEach((b, i) => {if (t > b && t < b + 1.5) out.push(<Dust key={`d${i}`} t={t} at={b} o={[0.5, 0.02, -0.5]} n={8} size={0.6} spread={0.8} seed={i + 1} color="#BFA176" />);});
  out.push(<Dust key="c1" t={t} at={T.cave} o={[0, -1.3, -0.1]} n={18} size={1.1} spread={0.8} seed={9} color="#9A7A52" dur={1.3} />);
  out.push(<Dust key="r" t={t} at={T.top} o={[0.4, 0, -1]} n={10} size={0.7} spread={1.3} seed={11} />);
  out.push(<Sparks key="sk" t={t} at={T.back} o={[1.45, 1.5, -0.3]} n={1} power={0} />);
  out.push(<Dust key="dry" t={t} at={T.bottom} o={[0, -3.4, -0.2]} n={12} size={0.8} spread={0.6} seed={21} color="#A8906E" />);
  out.push(<Splash key="s1" t={t} at={T.sand} o={[0, -11.6, -0.1]} n={34} power={0.9} ring={0.45} seed={3} />);
  out.push(<Dust key="cap" t={t} at={T.cap} o={[0, 0.9, -0.3]} n={8} size={0.6} spread={0.9} seed={31} />);
  const quickDeep = t > T.deeper && t < T.sand; if (quickDeep) out.push(<Dust key="dd" t={t} at={Math.floor(t * 2.5) / 2.5} o={[0, depth(t) + 0.2, -0.2]} n={6} size={0.55} spread={0.35} seed={Math.floor(t * 2.5)} dur={0.7} color="#A79478" />);
  if (t > T.cSponge - 0.4 && t < T.cHand + 0.1) for (let i = 0; i < 60; i++) {const q = frac(i * 0.17 + t * 0.2), y0 = -11.9 - 2.5 * rand(i * 3.1), x = lerp(4.6, R, q); out.push(<mesh key={`p${i}`} position={[x, y0 + 0.08 * Math.sin(i + t * 3), 0.03]} scale={0.04} renderOrder={10}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#BFEBFF" toneMapped={false} /></mesh>);}
  return <group>{out}</group>;
};

export const BrandCrate: React.FC<{k: Kit; t: number}> = ({t}) => {
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 460; const g = c.getContext("2d")!;
    g.fillStyle = "#8C6242"; g.fillRect(0, 0, 1024, 460);
    for (let i = 0; i < 3; i++) {g.fillStyle = i % 2 ? "#946A49" : "#84593A"; g.fillRect(0, i * 153, 1024, 151); g.fillStyle = "#4A3020"; g.fillRect(0, i * 153 + 150, 1024, 4);}
    g.font = "700 138px Georgia, 'Times New Roman', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(40,20,8,.55)"; g.shadowBlur = 10; g.fillStyle = "#23130A"; g.fillText(String(cfg.handle ?? ""), 512, 234);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 12; return tx;
  }, []);
  if (t < T.cHaul) return null;
  return <group position={[0.4, 0, -2.6]} rotation={[0, 0.56, 0]}>
    <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[1.3, 0.6, 0.62]} /><meshStandardMaterial color="#7A5336" roughness={0.9} /></mesh>
    <mesh position={[0, 0.3, 0.312]}><planeGeometry args={[1.28, 0.58]} /><meshStandardMaterial map={face} roughness={0.85} /></mesh>
  </group>;
};
void inQuad;

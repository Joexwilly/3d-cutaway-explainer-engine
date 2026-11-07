import {useMemo} from "react";
import * as THREE from "three";
import {quad} from "@engine/quad";
import {Debris, ScaleFigure, rockGeometry} from "@engine/primitives";
import {clamp01, inQuad, lerp, outCubic, ramp, rand, sine} from "@engine/clock";
import type {Mats} from "@engine/materials";
import cfg from "../../cutaway.json";
import T from "./cues";

type V = [number, number, number];
const FAR = 120, APRON = 5.2, TW = 0.65, X0 = 1.6, X1 = 5.2, X2 = 6.4, D = -1.1;
const RM = 2.4, RI = 2.2;
const QP: V = [2.4, 0, 3.4];
const lv = (a: V, b: V, u: number): V => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const frac = (x: number) => x - Math.floor(x);

const canvasTex = (seed: number, base: string, fleck: string, bands: number, rep: number) => {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {g.fillStyle = `rgba(${fleck},${0.03 + 0.1 * rand(seed + i)})`; g.beginPath(); g.ellipse(rand(seed + i * 2.1) * 512, rand(seed + i * 3.3) * 512, 6 + 34 * rand(seed + i * 4.7), 2 + 9 * rand(seed + i * 5.9), 0, 0, 7); g.fill();}
  for (let i = 0; i < bands; i++) {g.fillStyle = `rgba(${fleck},.16)`; g.fillRect(0, (i * 512) / bands + 14 * rand(seed + i), 512, 2 + 4 * rand(seed + i * 9));}
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 12;
  return t;
};

export const useSnow = (m: Mats) => useMemo(() => {
  const n = m.slab.normalMap;
  const mk = (seed: number, base: string, fleck: string, bands: number, rep: number, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({map: canvasTex(seed, base, fleck, bands, rep), roughness: 0.9, normalMap: n, normalScale: new THREE.Vector2(0.35, 0.35), shadowSide: THREE.DoubleSide, ...p});
  return {
    top: mk(1, "#C4D6E8", "108,142,186", 0, 1 / 9),
    loose: mk(2, "#F6F9FC", "160,185,216", 5, 1 / 4, {side: THREE.DoubleSide}),
    packed: mk(3, "#A9C6E2", "90,130,180", 8, 1 / 4),
    ice: mk(4, "#7FB2D8", "40,90,150", 6, 1 / 6),
    rock: mk(5, "#5D6672", "30,36,46", 4, 1 / 6),
    block: mk(6, "#F4F7FB", "135,165,205", 0, 1.2),
    trench: mk(7, "#AFC6DE", "90,125,170", 6, 1 / 3, {side: THREE.DoubleSide}),
    cave: new THREE.MeshStandardMaterial({color: "#9DB6D2", roughness: 0.95, side: THREE.BackSide}),
    hill: new THREE.MeshStandardMaterial({color: "#DDE6F0", roughness: 0.95}),
  };
}, [m]);
export type Snow = ReturnType<typeof useSnow>;

const top = (x0: number, x1: number, z0: number, z1: number, y = 0) => quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]);
const notch = () => {
  const s = new THREE.Shape();
  s.moveTo(X0, 0); s.lineTo(X0, D); s.lineTo(X1, D); s.lineTo(X2, 0); s.closePath();
  return new THREE.ShapeGeometry(s);
};
export const dig = (t: number) => sine(ramp(t, T.dig, T.digEnd));

/** Snow block with cut faces. The cross-section front is z = 0, the hero front is z = APRON. */
export const Ground: React.FC<{s: Snow; t: number; sec: boolean}> = ({s, t, sec}) => {
  const g = useMemo(() => {
    const prof = new THREE.Shape();
    prof.moveTo(-FAR, 0); prof.lineTo(X0, 0); prof.lineTo(X0, D); prof.lineTo(X1, D); prof.lineTo(X2, 0); prof.lineTo(FAR, 0); prof.lineTo(FAR, -1.5); prof.lineTo(-FAR, -1.5); prof.closePath();
    const layers: [number, number, keyof Snow][] = [[0, -1.5, "loose"], [-1.5, -3.2, "packed"], [-3.2, -7, "ice"], [-7, -30, "rock"]];
    const ramp3 = quad([X1, D, TW], [X2, 0, TW], [X2, 0, -TW], [X1, D, -TW]);
    return {
      back: [top(-FAR, X0, -FAR, 0), top(X2, FAR, -FAR, 0), top(X0, X2, -FAR, -TW)],
      apron: [top(-FAR, X0, 0, APRON), top(X2, FAR, 0, APRON), top(X0, X2, TW, APRON)],
      cut: new THREE.ShapeGeometry(prof), layers,
      faces: layers.map(([a, b]) => quad([-FAR, b, APRON], [FAR, b, APRON], [FAR, a, APRON], [-FAR, a, APRON])),
      sec: layers.slice(1).map(([a, b]) => quad([-FAR, b, 0], [FAR, b, 0], [FAR, a, 0], [-FAR, a, 0])),
      rampGeo: ramp3, notch: notch(),
      endWall: quad([X0, D, TW], [X0, D, -TW], [X0, 0, -TW], [X0, 0, TW]),
      plug: s.loose.clone(),
    };
  }, [s]);
  const u = dig(t), y = lerp(0, D, u), x1 = lerp(X2, X1, u);
  const floor = sec ? top(X0, x1, -TW, 0, y) : top(X0, x1, -TW, TW, y);
  return (
    <group>
      {g.back.map((q, i) => <mesh key={i} geometry={q} material={s.top} receiveShadow castShadow />)}
      {!sec && g.apron.map((q, i) => <mesh key={i} geometry={q} material={s.top} receiveShadow castShadow />)}
      {!sec && g.faces.map((q, i) => <mesh key={i} geometry={q} material={s[g.layers[i][2]] as THREE.Material} />)}
      {sec && <mesh geometry={g.cut} material={s.loose} position={[0, 0, 0]} />}
      {sec && g.sec.map((q, i) => <mesh key={i} geometry={q} material={s[g.layers[i + 1][2]] as THREE.Material} />)}
      <mesh geometry={floor} material={s.top} receiveShadow />
      {u > 0 && <>
        <mesh geometry={g.notch} material={s.trench} position={[0, 0, -TW]} />
        {!sec && <mesh geometry={g.notch} material={s.trench} position={[0, 0, TW]} />}
        <mesh geometry={g.rampGeo} material={s.top} receiveShadow />
        <mesh geometry={g.endWall} material={s.trench} />
      </>}
      {sec && u < 1 && <mesh geometry={g.notch} position={[0, 0, 0.005]}><primitive object={g.plug} attach="material" clippingPlanes={[new THREE.Plane(new THREE.Vector3(0, -1, 0), y)]} /></mesh>}
    </group>
  );
};

export const Hills: React.FC<{s: Snow}> = ({s}) => {
  const list = useMemo(() => [[-34, -78, 38, 26, 1], [10, -96, 52, 34, 2], [52, -82, 40, 24, 3], [-72, -92, 44, 30, 4]].map(([x, z, w, h, k]) => ({x, z, w, h, g: rockGeometry(k)})), []);
  return (
    <group>
      {list.map((k, i) => <mesh key={i} geometry={k.g} position={[k.x, 0, k.z]} scale={[k.w, k.h, 24]}><meshStandardMaterial color="#8A97A8" roughness={0.95} flatShading /></mesh>)}
      {[[-30, -44, 26, 6], [22, -52, 34, 8], [-4, -30, 16, 2.6], [40, -34, 18, 3.4]].map(([x, z, w, h], i) => <mesh key={i} position={[x, -0.2, z]} scale={[w, h, 12]} material={s.hill} castShadow><sphereGeometry args={[1, 40, 20]} /></mesh>)}
    </group>
  );
};

const ring = (ox: number, oy: number, ix: number, iy: number) => {
  const s = new THREE.Shape(); const N = 48;
  s.moveTo(ox, 0);
  for (let i = 1; i <= N; i++) {const a = (i / N) * Math.PI; s.lineTo(ox * Math.cos(a), oy * Math.sin(a));}
  s.lineTo(-ix, 0);
  for (let i = 1; i <= N; i++) {const a = Math.PI - (i / N) * Math.PI; s.lineTo(ix * Math.cos(a), iy * Math.sin(a));}
  s.closePath();
  return new THREE.ShapeGeometry(s);
};

/** The crude first attempt. Dug out on frame 0, sags, then collapses on screen. */
export const Drift: React.FC<{s: Snow; t: number; sec: boolean}> = ({s, t, sec}) => {
  const sag = sine(ramp(t, T.sag, T.sagEnd));
  const ry = lerp(1.4, 0.62, sag);
  const fall = sine(ramp(t, T.collapse, T.collapseEnd));
  const face = useMemo(() => ring(3, 2.1, 2.2, ry), [ry]);
  return (
    <group>
      <Debris t={t} count={64} from={[3, 0.5, 1.1]} to={[5.2, 0.1, 2.2]} spread={1} size={0.22} arc={2} start={-1.6} span={6.2} material={s.block} />
      {t > T.sag && t < T.cOut && <Debris t={t} count={18} from={[0, ry, -0.4]} to={[0, 0.2, -0.4]} spread={2.4} size={0.13} arc={0} start={T.sag - 1} span={3} material={s.block} />}
      {t >= T.collapse && t < T.collapseEnd + 0.5 && <Debris t={t} count={26} from={[0, 1.8, 0]} to={[0, 0, 1]} spread={5} size={0.3} arc={1.2} start={T.collapse - 0.8} span={0.8} material={s.block} />}
      {fall < 1 && <group scale={[1 + 0.08 * fall, 1 - 0.995 * fall, 1 + 0.08 * fall]}>
        <mesh position={[0, 0, 0]} scale={[3, 2.1, 3]} material={s.loose} castShadow receiveShadow>
          {sec ? <sphereGeometry args={[1, 56, 28, Math.PI, Math.PI, 0, Math.PI / 2]} /> : <sphereGeometry args={[1, 56, 28, 0, Math.PI * 2, 0, Math.PI / 2]} />}
        </mesh>
        {sec && <>
          <mesh geometry={face} material={s.loose} />
          <mesh scale={[2.2, ry, 2.2]} material={s.cave}><sphereGeometry args={[1, 48, 24, Math.PI, Math.PI, 0, Math.PI / 2]} /></mesh>
        </>}
        {!sec && <mesh position={[2.62, 0.5, 1.05]} scale={[0.34, 0.62, 0.62]}><sphereGeometry args={[1, 32, 20]} /><meshStandardMaterial color="#2E4058" roughness={1} /></mesh>}
      </group>}
    </group>
  );
};

/** Where the good snow comes from. Stack grows as the saw works, then feeds the dome. */
export const Quarry: React.FC<{s: Snow; t: number; sec: boolean}> = ({s, t, sec}) => {
  if (sec) return null;
  const grow = ramp(t, T.saw - 0.5, T.sawEnd), used = ramp(t, T.spiral, T.dome);
  const n = Math.ceil(16 * grow * (1 - used));
  const sawing = t > T.find && t < T.sawEnd;
  return (
    <group position={QP}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><planeGeometry args={[3.2, 1.7]} /><meshStandardMaterial map={s.packed.map} color="#CFE0F0" roughness={0.8} /></mesh>
      {[-1.05, -0.35, 0.35, 1.05].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.016, 0]}><planeGeometry args={[0.03, 1.7]} /><meshBasicMaterial color="#6F8FB0" /></mesh>)}
      {[-0.28, 0.28].map((z) => <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, z]}><planeGeometry args={[3.2, 0.03]} /><meshBasicMaterial color="#6F8FB0" /></mesh>)}
      {Array.from({length: n}, (_, i) => <mesh key={i} position={[-1.1 + 0.8 * (i % 4), 0.21 + 0.42 * Math.floor(i / 8), -1.35 + 0.42 * (Math.floor(i / 4) % 2)]} material={s.block} castShadow receiveShadow><boxGeometry args={[0.74, 0.41, 0.36]} /></mesh>)}
      {sawing && <mesh position={[0.15 + 0.24 * Math.sin(t * 19), 0.32, 0.3]} rotation={[0, 0, 0.5]} castShadow><boxGeometry args={[1.1, 0.06, 0.03]} /><meshStandardMaterial color="#D8DEE4" metalness={0.8} roughness={0.25} /></mesh>}
    </group>
  );
};

type Item = {p: V; q: THREE.Quaternion; land: number; wall?: {tw: number; th: number; h: number; s: number; rub: V}; size?: V};
const Y = new THREE.Vector3(0, 1, 0);
const SRC: V = [QP[0] - 0.4, 0.4, QP[2] - 1.1];

const buildBlocks = () => {
  const spiral: Item[] = [], door: Item[] = [], vault: Item[] = [];
  const basis = (p: V, th: number, e: number) => {
    const rad = new THREE.Vector3(p[0], p[1], p[2]).normalize();
    const tan = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th));
    const up = new THREE.Vector3().crossVectors(rad, tan).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tan, up.y < 0 ? up.negate() : up, rad)), {e};
  };
  let th = 0.45, e = 0.095, idx = 0;
  const pts: {p: V; q: THREE.Quaternion; door: boolean}[] = [];
  while (e < 1.41) {
    const p: V = [RM * Math.cos(e) * Math.cos(th), RM * Math.sin(e), RM * Math.cos(e) * Math.sin(th)];
    const rad = new THREE.Vector3(...p).normalize(), tan = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th)), up = new THREE.Vector3().crossVectors(tan, rad).normalize();
    if (up.y < 0) up.negate();
    const m = new THREE.Matrix4().makeBasis(tan.clone().cross(up).dot(rad) > 0 ? tan : tan.clone().negate(), up, rad);
    const a = Math.atan2(Math.sin(th), Math.cos(th));
    pts.push({p, q: new THREE.Quaternion().setFromRotationMatrix(m), door: Math.abs(a) < 0.34 && p[1] < 1.15});
    const dth = 0.74 / (RM * Math.max(0.3, Math.cos(e)));
    th += dth; e += dth * (0.43 / RM) / (2 * Math.PI);
  }
  void basis; void idx;
  const solid = pts.filter((k) => !k.door), gap = pts.filter((k) => k.door);
  const N = solid.length, W_N = 42, per = 14;
  solid.forEach((k, i) => {
    const land = T.spiral + (i * (T.dome - T.spiral - 0.1)) / N;
    if (i < W_N) {
      const th0 = ((i % per) * 2 * Math.PI) / per + (Math.floor(i / per) % 2 ? Math.PI / per : 0), c = Math.floor(i / per), h = 0.215 + c * 0.43;
      const s = rand(i * 2.7), R = 2.4;
      const fallR = R - 0.5 - c * 0.55 - s * 0.5;
      spiral.push({...k, land, wall: {tw: T.wallStart + (i * (T.wallEnd - T.wallStart)) / W_N, th: th0, h, s, rub: [fallR * Math.cos(th0), 0.21 + 0.2 * (c % 2) * s, fallR * Math.sin(th0)]}});
    } else spiral.push({...k, land});
  });
  gap.forEach((k, i) => door.push({...k, land: T.plug + 0.1 + i * 0.07}));
  for (let ix = 0; ix < 5; ix++) for (let a = 0; a < 6; a++) {
    const ang = (a + 0.5) * (Math.PI / 6), x = 2.75 + ix * 0.56;
    vault.push({p: [x, 0.95 * Math.sin(ang), 0.95 * Math.cos(ang)], q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -ang), land: T.digEnd + (ix * 6 + a) * 0.04, size: [0.56, 0.5, 0.3]});
  }
  return {spiral, door, vault};
};

const arc = (a: V, b: V, u: number, h: number): V => {const p = lv(a, b, u); p[1] += h * 4 * u * (1 - u); return p;};

const poseOf = (k: Item, t: number): {p: V; q: THREE.Quaternion} | null => {
  const FLY = 0.42;
  const w = k.wall;
  if (w) {
    if (t < w.tw - 0.28) return null;
    const base = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 2 - w.th);
    const wp: V = [2.4 * Math.cos(w.th), w.h, 2.4 * Math.sin(w.th)];
    if (t < w.tw) {const u = sine(ramp(t, w.tw - 0.28, w.tw)); return {p: arc(SRC, wp, u, 1.6), q: base};}
    if (t < k.land - FLY) {
      const lean = 0.28 * sine(ramp(t, T.lean, T.fall));
      const f = inQuad(ramp(t, T.fall + w.s * 0.18, T.fall + w.s * 0.18 + 0.42));
      const ang = lean + 1.3 * f;
      const rr = 2.4 - Math.sin(ang) * w.h;
      const stand: V = [rr * Math.cos(w.th), Math.cos(ang) * w.h, rr * Math.sin(w.th)];
      const p = lv(stand, w.rub, f);
      const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-Math.sin(w.th), 0, Math.cos(w.th)), -ang * (1 - f * 0.9));
      return {p, q: tilt.multiply(base)};
    }
    if (t < k.land) {const u = sine(ramp(t, k.land - FLY, k.land)); return {p: arc(w.rub, k.p, u, 0.8), q: base.clone().slerp(k.q, u)};}
    return {p: k.p, q: k.q};
  }
  if (t < k.land - FLY) return null;
  if (t < k.land) {const u = sine(ramp(t, k.land - FLY, k.land)); return {p: arc(SRC, k.p, u, 2.2), q: k.q};}
  return {p: k.p, q: k.q};
};

export const Blocks: React.FC<{s: Snow; t: number; sec: boolean}> = ({s, t, sec}) => {
  const b = useMemo(buildBlocks, []);
  const box = useMemo(() => new THREE.BoxGeometry(0.74, 0.42, 0.36), []);
  const cap = (() => {
    if (t < T.dome - 0.25) return null;
    const land = sine(ramp(t, T.dome - 0.25, T.dome));
    const pop = ramp(t, T.pop - 0.05, T.pop + 0.5);
    if (pop <= 0) return lv([0, 3.4, 0], [0, 2.42, 0], land);
    return arc([0, 2.42, 0], [-2.9, 0.16, -2.6], inQuad(pop), 1.2);
  })();
  const render = (list: Item[], key: string, size?: V) => list.map((k, i) => {
    const pos = poseOf(k, t);
    if (!pos) return null;
    if (sec && pos.p[2] > 0.06) return null;
    return <mesh key={key + i} geometry={box} position={pos.p} quaternion={pos.q} scale={k.size ? [k.size[0] / 0.74, k.size[1] / 0.42, k.size[2] / 0.36] : 1} material={s.block} castShadow receiveShadow />;
  });
  return (
    <group>
      {render(b.spiral, "s")}
      {render(b.door, "d")}
      {render(b.vault, "v")}
      {cap && <mesh position={cap} rotation={[0, 0.5, 0]} material={s.block} castShadow><boxGeometry args={[0.95, 0.26, 0.95]} /></mesh>}
    </group>
  );
};

const SHELF_H = 0.85;
export const Inside: React.FC<{s: Snow; t: number; sec: boolean}> = ({s, t, sec}) => {
  if (!sec || t < T.dome) return null;
  const h = SHELF_H * outCubic(ramp(t, T.pile, T.shelfEnd));
  const lampOn = sine(ramp(t, T.lamp, T.lamp + 0.3));
  const glaze = sine(ramp(t, T.melt, T.ice));
  const skin = outCubic(ramp(t, T.skins, T.skins + 0.5));
  const flick = 1 + 0.12 * Math.sin(t * 23) * Math.sin(t * 7);
  const half = [Math.PI + 0.36, Math.PI - 0.36, 0.16, Math.PI / 2 - 0.16] as const;
  return (
    <group>
      <mesh material={s.cave} scale={RI + 0.02}><sphereGeometry args={[1, 56, 28, ...half]} /></mesh>
      {glaze > 0 && <mesh scale={RI}><sphereGeometry args={[1, 56, 28, ...half]} /><meshStandardMaterial color="#BFE9FF" roughness={0.08} metalness={0.25} transparent opacity={0.8 * glaze} side={THREE.BackSide} /></mesh>}
      {h > 0.01 && <mesh position={[-1.42, h / 2, -1]} material={s.packed} receiveShadow castShadow><boxGeometry args={[1.76, Math.max(0.01, h), 2]} /></mesh>}
      {t >= T.lamp - 0.2 && <group position={[0.75, 0, -0.9]}>
        <mesh position={[0, 0.22, 0]} material={s.block}><boxGeometry args={[0.5, 0.44, 0.4]} /></mesh>
        <mesh position={[0, 0.5, 0]} scale={[0.46, 0.13, 0.26]}><sphereGeometry args={[1, 24, 12]} /><meshStandardMaterial color="#4A4640" roughness={0.8} /></mesh>
        {lampOn > 0 && <>
          <mesh position={[0, 0.72, 0]} scale={[0.14 * lampOn, 0.3 * lampOn * flick, 0.14 * lampOn]}><coneGeometry args={[1, 1, 16]} /><meshBasicMaterial color="#FFB43C" toneMapped={false} /></mesh>
          <pointLight position={[0, 0.95, 0.2]} color="#FFB065" intensity={9 * lampOn * flick} distance={7} decay={1.8} />
        </>}
      </group>}
      {skin > 0 && <group>
        <mesh scale={RI - 0.05}><sphereGeometry args={[1, 40, 16, 2 * Math.PI - 1.75 * skin, 1.75 * skin, 0.62, 0.62]} /><meshStandardMaterial color="#5C4230" roughness={1} side={THREE.BackSide} /></mesh>
      </group>}
    </group>
  );
};

const CHINK = Array.from({length: 40}, (_, i) => {
  const th = rand(i * 1.3) * 6.28, e = 0.15 + rand(i * 2.1) * 1.15;
  const R = RM + 0.16;
  return {p: [R * Math.cos(e) * Math.cos(th), R * Math.sin(e), R * Math.cos(e) * Math.sin(th)] as V, t0: T.gaps + rand(i * 3.7) * 0.9, s: 0.1 + rand(i) * 0.07};
});
export const Finish: React.FC<{s: Snow; t: number; sec: boolean}> = ({s, t, sec}) => {
  if (t < T.gaps) return null;
  const d = sine(ramp(t, T.door - 0.3, T.door + 0.1));
  return (
    <group>
      {CHINK.map((k, i) => {
        const u = outCubic(ramp(t, k.t0, k.t0 + 0.18));
        if (u <= 0 || (sec && k.p[2] > 0)) return null;
        return <mesh key={i} position={k.p} scale={k.s * u} material={s.loose}><sphereGeometry args={[1, 12, 8]} /></mesh>;
      })}
      {!sec && t > T.door - 0.3 && <mesh position={[lerp(7, 5.1, d), 0.32, 0.5 * (1 - d)]} material={s.block} castShadow><boxGeometry args={[0.34, 1.1, 1.6]} /></mesh>}
    </group>
  );
};

/** Supply sled. The handle is burned into the crate's wood, so it belongs to the world and never reads as a sign. */
export const Sled: React.FC<{m: Mats; sec: boolean}> = ({m, sec}) => {
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 420; const g = c.getContext("2d")!;
    g.fillStyle = "#8C6242"; g.fillRect(0, 0, 1024, 420);
    for (let i = 0; i < 3; i++) {g.fillStyle = i % 2 ? "#936847" : "#84593A"; g.fillRect(0, i * 140, 1024, 138); g.fillStyle = "#4A3020"; g.fillRect(0, i * 140 + 137, 1024, 4);}
    for (let i = 0; i < 260; i++) {g.fillStyle = `rgba(60,36,20,${0.05 + 0.1 * rand(i)})`; g.fillRect(rand(i * 2.3) * 1024, rand(i * 3.1) * 420, 40 + 180 * rand(i * 4.7), 1 + 2 * rand(i * 5.3));}
    g.font = "700 124px Georgia, 'Times New Roman', serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = "rgba(40,20,8,.55)"; g.shadowBlur = 10; g.fillStyle = "#2A170C"; g.fillText(String(cfg.handle ?? ""), 512, 214);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 12; return t;
  }, []);
  if (sec) return null;
  return (
    <group position={[5.15, 0, 4.25]} rotation={[0, 0.56, 0]}>
      {[-0.42, 0.42].map((z) => <mesh key={z} position={[0, 0.06, z]} material={m.plank} castShadow><boxGeometry args={[2.1, 0.12, 0.09]} /></mesh>)}
      <mesh position={[0, 0.18, 0]} material={m.plank} castShadow><boxGeometry args={[1.9, 0.07, 1]} /></mesh>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.45, 0.58, 0.8]} /><meshStandardMaterial color="#7A5336" roughness={0.9} /></mesh>
      <mesh position={[0, 0.5, 0.402]}><planeGeometry args={[1.41, 0.578]} /><meshStandardMaterial map={face} roughness={0.85} /></mesh>
    </group>
  );
};

/** One person, the builder. Stands outside, lies down inside. */
export const Figure: React.FC<{t: number; sec: boolean}> = ({t, sec}) => {
  const lying = (p: V) => <group position={p} rotation={[0, 0, -Math.PI / 2]}><ScaleFigure position={[0, -0.75, 0]} h={1.5} /></group>;
  const stand = (p: V, r: number, y = 0) => <ScaleFigure position={[p[0], p[1] + y, p[2]]} rotation={r} />;
  const FLOOR: V = [0.1, 0.2, -0.75], SHELF: V = [-1.4, SHELF_H + 0.2, -0.75];
  if (t < T.cCave) return stand([4, 0, 1.2], -1.3, 0.05 * Math.abs(Math.sin(t * 8)));
  if (t < T.cOut) return lying(FLOOR);
  if (t < T.cSaw) return stand(lv([3.4, 0, 0.9], [3.5, 0, 1.5], ramp(t, T.cOut + 0.2, T.find + 0.7)), 0.2);
  if (t < T.cWall) return stand([3.5, 0, 1.5], -0.4, 0.03 * Math.abs(Math.sin(t * 19)));
  if (t < T.cBreath) return stand([3.5, 0, 2], -0.9);
  if (t < T.cPoke) return lying(FLOOR);
  if (t < T.cWind) {
    const p = ramp(t, T.poke, T.pop);
    return <>
      {stand([0.1, 0, -0.6], 0.3)}
      <mesh position={[0.2, 1.5 + 0.5 * p, -0.6]} castShadow><cylinderGeometry args={[0.03, 0.03, 1.6, 8]} /><meshStandardMaterial color="#6B4A2E" roughness={0.8} /></mesh>
    </>;
  }
  if (t < T.cTunnel) return stand([0.5, 0, -0.9], 0.2);
  if (t < T.cCold) return stand([4.3, 0, -1.7], 1.2);
  if (t < T.shelfEnd) return lying(FLOOR);
  if (t < T.cNow) return lying(SHELF);
  if (t < T.cWarm) return stand([3.5, 0, 2], -0.9);
  if (t < T.cAdd) return lying(SHELF);
  if (t < T.cSkins) return stand([3.5, 0, 2], -0.9);
  if (t < T.cEnd) return lying(SHELF);
  return stand([3.5, 0, 2], 0.4);
};

const Beads: React.FC<{list: {p: V; s: V; c: string}[]}> = ({list}) => (
  <group>{list.map((k, i) => <mesh key={i} position={k.p} scale={k.s} renderOrder={20}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color={k.c} toneMapped={false} /></mesh>)}</group>
);

/** Air made visible: stale breath, wind, stolen heat, sinking cold, rising warmth, drips. */
export const Air: React.FC<{t: number; sec: boolean; s: Snow}> = ({t, sec, s}) => {
  const trap = useMemo(notch, []);
  const glow = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
    const r = g.createRadialGradient(128, 128, 8, 128, 128, 126); r.addColorStop(0, "rgba(255,160,70,.75)"); r.addColorStop(1, "rgba(255,160,70,0)");
    g.fillStyle = r; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  if (!sec) return null;
  const out: {p: V; s: V; c: string}[] = [];
  if (t > T.breath && t < T.cWind + 0.5) for (let i = 0; i < 38; i++) {
    const t0 = T.breath + i * 0.05, r = (k: number) => rand(i * 3.1 + k), u = outCubic(ramp(t, t0, t0 + 1.2));
    if (u <= 0) continue;
    const a = r(1) * 3.1, R = 1.9 * Math.sqrt(r(2));
    const home: V = [R * Math.cos(a), 0.3 + 1.6 * r(3) * (1 - (R / 2.1) ** 2), -0.2 - 0.9 * r(4)];
    const v = ramp(t, T.pop + r(5) * 0.9, T.pop + r(5) * 0.9 + 0.8);
    if (v >= 1) continue;
    const p = lv(lv([0.1, 0.55, -0.7], home, u), [0, 3.5, -0.3], inQuad(v));
    p[0] += 0.05 * Math.sin(t * 3 + i); p[1] += 0.05 * Math.cos(t * 2.3 + i);
    const k = 0.1 * u; out.push({p, s: [k, k, k], c: "#7E8F5C"});
  }
  if (t > T.wind && t < T.plug + 0.2) for (let i = 0; i < 26; i++) {
    const k = frac(i / 26 + t * 0.75), r = rand(i * 1.9);
    out.push({p: [lerp(8.5, -1.6, k), 0.2 + 0.75 * r, -0.2 - 0.5 * rand(i * 2.3)], s: [0.36, 0.06, 0.06], c: "#2F9BFF"});
  }
  if (t > T.heat && t < T.plug + 0.2) for (let i = 0; i < 14; i++) {
    const k = frac(i / 14 + t * 0.55), r = rand(i * 4.1);
    out.push({p: [lerp(-1.2, 7, k), 0.65 + 0.4 * r, -0.4], s: [0.09, 0.09, 0.09], c: "#FF9A3C"});
  }
  if (t > T.sinks) for (let i = 0; i < 22; i++) {
    const k = frac(i / 22 + t * 0.32);
    const p: V = k < 0.45 ? [lerp(-0.4, 1.7, k / 0.45), 0.14, -0.3] : k < 0.6 ? [1.8, lerp(0.14, -0.95, (k - 0.45) / 0.15), -0.3] : [lerp(1.8, 4.9, (k - 0.6) / 0.4), -0.95, -0.3];
    out.push({p, s: [0.08, 0.08, 0.08], c: "#58B6FF"});
  }
  if (t > T.warm) for (let i = 0; i < 12; i++) {
    const k = frac(i / 12 + t * 0.3), r = rand(i * 2.9);
    out.push({p: [lerp(0.6, -1.3, k) + 0.25 * Math.sin(i + t), lerp(0.4, 1.8, k) + 0.3 * r, -0.4], s: [0.08, 0.08, 0.08], c: "#FF9A3C"});
  }
  if (t > T.drip - 0.8 && t < T.melt + 0.6) for (let i = 0; i < 12; i++) {
    const k = frac(i * 0.37 + t * 1.3), x = lerp(-1.5, 1.3, rand(i * 7.7));
    out.push({p: [x, lerp(Math.sqrt(4.8 - x * x), 0.05, inQuad(k)), -0.5], s: [0.05, 0.1, 0.05], c: "#3F9BE8"});
  }
  void s;
  return (
    <group>
      <Beads list={out} />
      {t > T.sinks && <mesh geometry={trap} position={[0, 0, -0.1]} renderOrder={15}><meshBasicMaterial color="#3E9BF0" transparent opacity={0.34 * ramp(t, T.sinks, T.trap)} depthWrite={false} /></mesh>}
      {t > T.warm && <mesh position={[-0.55, 1.3, -0.3]} scale={[2.6, 1.9, 1]} renderOrder={15}><planeGeometry /><meshBasicMaterial map={glow} transparent opacity={0.5 * ramp(t, T.warm, T.warm + 0.6)} depthWrite={false} toneMapped={false} /></mesh>}
    </group>
  );
};

const FLAKES = 520;
export const Snowfall: React.FC<{t: number}> = ({t}) => {
  const geo = useMemo(() => {const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FLAKES * 3), 3)); return g;}, []);
  const dot = useMemo(() => {const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); return new THREE.CanvasTexture(c);}, []);
  const a = geo.attributes.position as THREE.BufferAttribute;
  const closed = t > T.dome;
  for (let i = 0; i < FLAKES; i++) {
    const r = (k: number) => rand(i * 1.7 + k);
    const v = 1.1 + 1.3 * r(1), y = 14 - frac(r(2) + (t * v) / 14) * 14;
    const x = -9 + frac(r(3) - t * 0.09) * 20 + 0.3 * Math.sin(t * 1.4 + i), z = -8 + r(4) * 13;
    const ins = closed && x * x + y * y + z * z < 7;
    a.setXYZ(i, x, ins ? -40 : y, z);
  }
  a.needsUpdate = true;
  void clamp01;
  return <points geometry={geo} frustumCulled={false}><pointsMaterial map={dot} color="#FFFFFF" size={0.085} sizeAttenuation transparent alphaTest={0.4} toneMapped={false} /></points>;
};

import {useMemo} from "react";
import * as THREE from "three";
import {rockGeometry} from "@engine/primitives";
import {rand} from "@engine/clock";

type Spot = {x: number; z: number};
const scatter = (n: number, seed: number, area: [number, number, number, number], keep?: (s: Spot) => boolean) => {
  const out: Spot[] = [];
  for (let i = 0; i < n * 4 && out.length < n; i++) {const x = area[0] + rand(i * 1.3 + seed) * (area[1] - area[0]), z = area[2] + rand(i * 2.9 + seed) * (area[3] - area[2]); if (!keep || keep({x, z})) out.push({x, z});}
  return out;
};
/** Grass tufts as one instanced mesh, so thousands stay cheap. */
export const Tufts: React.FC<{n?: number; area: [number, number, number, number]; y?: (x: number, z: number) => number; keep?: (s: Spot) => boolean; seed?: number; color?: string}> = ({n = 900, area, y, keep, seed = 1, color = "#5F9E3F"}) => {
  const {geo, mats} = useMemo(() => {
    const blades = [0, 1.05, 2.1].map((r) => {const g = new THREE.ConeGeometry(0.03, 0.17, 4); g.translate(0, 0.085, 0); g.rotateY(r); return g;});
    const pos: number[] = [], idx: number[] = []; let base = 0;
    blades.forEach((g, b) => {const a = g.toNonIndexed().attributes.position; for (let i = 0; i < a.count; i++) pos.push(a.getX(i) + [0, 0.06, -0.05][b], a.getY(i), a.getZ(i) + [0, 0.05, 0.05][b]); for (let i = 0; i < a.count; i++) idx.push(base + i); base += a.count;});
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const spots = scatter(n, seed, area, keep), m = new THREE.Object3D();
    const mats = spots.map((s, i) => {m.position.set(s.x, y ? y(s.x, s.z) : 0, s.z); m.rotation.y = rand(i * 3) * 6; m.scale.setScalar(0.6 + rand(i * 5) * 0.9); m.updateMatrix(); return m.matrix.clone();});
    return {geo, mats};
  }, [n, seed]);
  const ref = (r: THREE.InstancedMesh | null) => {if (r) {mats.forEach((q, i) => r.setMatrixAt(i, q)); r.instanceMatrix.needsUpdate = true;}};
  return <instancedMesh ref={ref} args={[geo, undefined, mats.length]} castShadow frustumCulled={false}><meshStandardMaterial color={color} roughness={0.9} /></instancedMesh>;
};
export const Stones: React.FC<{n?: number; area: [number, number, number, number]; y?: (x: number, z: number) => number; keep?: (s: Spot) => boolean; seed?: number; size?: number; color?: string}> = ({n = 40, area, y, keep, seed = 2, size = 0.16, color = "#8D8A82"}) => {
  const list = useMemo(() => scatter(n, seed, area, keep).map((s, i) => ({...s, g: rockGeometry(i % 5), s: size * (0.5 + rand(i * 7) * 1.4), r: rand(i * 3) * 6, c: new THREE.Color(color).multiplyScalar(0.8 + rand(i * 9) * 0.35)})), [n, seed]);
  return <group>{list.map((k, i) => <mesh key={i} geometry={k.g} position={[k.x, (y ? y(k.x, k.z) : 0) + k.s * 0.3, k.z]} rotation={[0, k.r, 0]} scale={k.s} castShadow receiveShadow><meshStandardMaterial color={k.c} roughness={0.95} flatShading /></mesh>)}</group>;
};
export const Bush: React.FC<{p: [number, number, number]; s?: number; color?: string; seed?: number}> = ({p, s = 1, color = "#3F7A3A", seed = 1}) => (
  <group position={p} scale={s}>{Array.from({length: 7}, (_, i) => {const r = (q: number) => rand(i * 2.1 + seed + q); return <mesh key={i} position={[(r(1) - 0.5) * 0.7, 0.22 + r(2) * 0.26, (r(3) - 0.5) * 0.7]} scale={0.2 + r(4) * 0.16} castShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8 + r(5) * 0.4)} roughness={0.9} flatShading /></mesh>;})}</group>
);

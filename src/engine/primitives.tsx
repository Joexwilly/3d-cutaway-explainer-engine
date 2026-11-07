import {useMemo} from "react";
import * as THREE from "three";
import {quad} from "./quad";
import type {Mats} from "./materials";
import {rand} from "./clock";

export type Layer = {to: number; mat: keyof Mats};

/**
 * A diorama block: lawn on top, cut strata on the front face. Subjects sit back from the cut edge.
 * Faces only, so no booleans. `hole` opens a pit with visible walls.
 */
export const CutGround: React.FC<{m: Mats; layers: Layer[]; hole?: {x: number; z: number; depth: number; open: boolean}}> = ({m, layers, hole}) => {
  const far = 120;
  const g = useMemo(() => {
    const hx = hole?.x ?? 0, hz = hole?.z ?? 0, d = hole?.depth ?? 0;
    return {
      top: hole ? [quad([-far, 0, 0], [-hx, 0, 0], [-hx, 0, -far], [-far, 0, -far]), quad([hx, 0, 0], [far, 0, 0], [far, 0, -far], [hx, 0, -far]), quad([-hx, 0, hz], [hx, 0, hz], [hx, 0, -far], [-hx, 0, -far])] : [quad([-far, 0, 0], [far, 0, 0], [far, 0, -far], [-far, 0, -far])],
      lid: hole ? quad([-hx, 0, 0], [hx, 0, 0], [hx, 0, hz], [-hx, 0, hz]) : null,
      back: hole ? quad([-hx, -d, hz], [hx, -d, hz], [hx, 0, hz], [-hx, 0, hz]) : null,
      left: hole ? quad([-hx, -d, 0], [-hx, -d, hz], [-hx, 0, hz], [-hx, 0, 0]) : null,
      right: hole ? quad([hx, -d, hz], [hx, -d, 0], [hx, 0, 0], [hx, 0, hz]) : null,
      faces: layers.map((l, i) => quad([-far, l.to, 0], [far, l.to, 0], [far, i ? layers[i - 1].to : 0, 0], [-far, i ? layers[i - 1].to : 0, 0])),
    };
  }, [hole?.x, hole?.z, hole?.depth, layers]);
  return (
    <group>
      {g.top.map((q, i) => <mesh key={i} geometry={q} material={m.grass} receiveShadow castShadow />)}
      {hole && !hole.open && <mesh geometry={g.lid!} material={m.grass} receiveShadow />}
      {hole?.open && [g.back, g.left, g.right].map((q, i) => <mesh key={i} geometry={q!} material={m.soilDark} receiveShadow />)}
      {g.faces.map((q, i) => <mesh key={i} geometry={q} material={m[layers[i].mat] as THREE.Material} receiveShadow />)}
    </group>
  );
};

/** A small person. Every hero shot needs one so the viewer can read scale. */
export const ScaleFigure: React.FC<{position: [number, number, number]; rotation?: number; h?: number; color?: string}> = ({position, rotation = 0, h = 1.75, color = "#22324A"}) => {
  const s = h / 1.75;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={s}>
      {[-0.1, 0.1].map((x) => <mesh key={x} position={[x, 0.42, 0]} castShadow><capsuleGeometry args={[0.075, 0.68, 6, 12]} /><meshStandardMaterial color="#1B2230" roughness={0.8} /></mesh>)}
      <mesh position={[0, 1.08, 0]} castShadow><capsuleGeometry args={[0.2, 0.42, 8, 16]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      {[-0.27, 0.27].map((x) => <mesh key={x} position={[x, 1.06, 0]} rotation={[0, 0, x > 0 ? 0.08 : -0.08]} castShadow><capsuleGeometry args={[0.06, 0.52, 6, 10]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>)}
      <mesh position={[0, 1.58, 0]} castShadow><sphereGeometry args={[0.13, 20, 16]} /><meshStandardMaterial color="#C9956E" roughness={0.6} /></mesh>
    </group>
  );
};

/** Irregular rock. Geometry is seeded, so renders repeat exactly. */
export const rockGeometry = (seed: number) => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const k = 0.72 + 0.46 * rand(seed + Math.round(v.x * 31) + Math.round(v.y * 17) * 3 + Math.round(v.z * 13) * 7);
    p.setXYZ(i, v.x * k, v.y * k * 0.8, v.z * k);
  }
  g.computeVertexNormals();
  return g;
};

/** Seeded debris on ballistic arcs. No runtime physics, so every render matches. */
export const Debris: React.FC<{t: number; count: number; from: [number, number, number]; to: [number, number, number]; spread?: number; size?: number; arc?: number; start?: number; span?: number; material: THREE.Material}> = ({t, count, from, to, spread = 3, size = 0.8, arc = 6, start = -1, span = 2, material}) => (
  <group>
    {Array.from({length: count}, (_, i) => {
      const r = (k: number) => rand(i * 7.3 + k);
      const t0 = start + span * r(1), d = 1.2 + 0.7 * r(2), u = (t - t0) / d;
      if (u <= 0 || u >= 1) return null;
      const a = [from[0] + (r(3) - 0.5) * spread, from[1], from[2] + (r(4) - 0.5) * spread];
      const b = [to[0] + (r(5) - 0.5) * spread, to[1], to[2] + (r(6) - 0.5) * spread];
      const p: [number, number, number] = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + arc * (0.6 + r(7)) * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u];
      return <mesh key={i} position={p} rotation={[(r(8) - 0.5) * 10 * u, (r(9) - 0.5) * 10 * u, 0]} scale={size * (0.7 + 0.6 * r(10))} material={material} castShadow><boxGeometry /></mesh>;
    })}
  </group>
);

/** A pipe that draws along a path and shows pale beads moving through it. Also reads as a wire, a data line or a vein. */
export const FlowPipe: React.FC<{points: [number, number, number][]; t: number; grow?: [number, number]; flow?: [number, number]; radius?: number; color?: string; bead?: string; beads?: number; speed?: number}> = ({points, t, grow = [0, 0.01], flow, radius = 0.12, color = "#2F6B4A", bead = "#F2E8C8", beads = 14, speed = 0.45}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1), [points]);
  const u = Math.min(1, Math.max(0, (t - grow[0]) / (grow[1] - grow[0])));
  const geo = useMemo(() => {
    const g = new THREE.TubeGeometry(curve, 160, radius, 14, false);
    g.setDrawRange(0, Math.floor(g.index!.count * Math.round(u * 160) / 160 / 3) * 3);
    return g;
  }, [curve, radius, u]);
  const on = flow && t >= flow[0] && t <= flow[1];
  return (
    <group>
      <mesh geometry={geo} castShadow><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      {on && Array.from({length: beads}, (_, i) => {
        const k = ((i / beads + (t - flow![0]) * speed) % 1);
        if (k > u) return null; // Beads never run ahead of a pipe that is still growing.
        const p = curve.getPointAt(k);
        return <mesh key={i} position={[p.x, p.y, p.z + radius * 0.92]} scale={radius * 0.42}><sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color={bead} toneMapped={false} /></mesh>;
      })}
    </group>
  );
};

/** A sign in the world: a handle, a product name, a price. Pass the workspace handle here if the user wants branding. */
export const Plaque: React.FC<{text: string; position: [number, number, number]; rotation?: [number, number, number]; width?: number; bg?: string; fg?: string}> = ({text, position, rotation, width = 2, bg = "#10294F", fg = "#F2E9C9"}) => {
  const {tex, aspect} = useMemo(() => {
    const c = document.createElement("canvas"); const g0 = c.getContext("2d")!; const px = 96;
    g0.font = `700 ${px}px sans-serif`; const w = Math.ceil(g0.measureText(text).width) + 90;
    c.width = w; c.height = px + 54; const g = c.getContext("2d")!;
    g.fillStyle = bg; g.fillRect(0, 0, w, c.height); g.fillStyle = fg; g.font = `700 ${px}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, c.height / 2 + 4);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return {tex: t, aspect: w / c.height};
  }, [text, bg, fg]);
  return <mesh position={position} rotation={rotation} scale={[width, width / aspect, 1]}><planeGeometry /><meshStandardMaterial map={tex} roughness={0.5} /></mesh>;
};

/** A plain crate. Stands in for packets, parcels, records, money or anything counted. */
export const Crate: React.FC<{position: [number, number, number]; size?: number; color?: string}> = ({position, size = 0.8, color = "#C9A25B"}) => (
  <mesh position={position} scale={size} castShadow receiveShadow><boxGeometry /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
);

/** A cabinet of glowing slots. Stands in for a server, a vault, a panel or any stored system. */
export const Rack: React.FC<{position: [number, number, number]; rotation?: number; h?: number; slots?: number; on?: number; color?: string}> = ({position, rotation = 0, h = 3.2, slots = 7, on = 1, color = "#2B3442"}) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[1.6, h, 1.2]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.5} /></mesh>
    {Array.from({length: slots}, (_, i) => (
      <group key={i} position={[0, 0.34 + (i * (h - 0.5)) / slots, 0.61]}>
        <mesh><planeGeometry args={[1.3, 0.28]} /><meshStandardMaterial color="#141A23" /></mesh>
        <mesh position={[0.5, 0, 0.01]}><circleGeometry args={[0.05, 12]} /><meshBasicMaterial color={i / slots < on ? "#46D36E" : "#4A0B0B"} toneMapped={false} /></mesh>
      </group>
    ))}
  </group>
);

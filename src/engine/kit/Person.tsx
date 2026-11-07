import {useMemo} from "react";
import * as THREE from "three";

/** Angles in radians. Shoulders and hips swing forward when positive, knees bend back, spine leans forward. */
export type Pose = {spine: number; head: number; lS: number; lE: number; lOut: number; rS: number; rE: number; rOut: number; lH: number; lK: number; rH: number; rK: number};
export const STAND: Pose = {spine: 0, head: 0, lS: 0, lE: 0.12, lOut: 0.07, rS: 0, rE: 0.12, rOut: 0.07, lH: 0, lK: 0, rH: 0, rK: 0};
const P = (o: Partial<Pose>): Pose => ({...STAND, ...o});
export const mixPose = (a: Pose, b: Pose, u: number): Pose => Object.fromEntries((Object.keys(a) as (keyof Pose)[]).map((k) => [k, a[k] + (b[k] - a[k]) * u])) as Pose;

const TAU = Math.PI * 2;
export const walk = (t: number, speed = 1.6): Pose => {const s = Math.sin(t * TAU * speed), c = Math.cos(t * TAU * speed); return P({spine: 0.06, lH: 0.5 * s, rH: -0.5 * s, lK: 0.25 + 0.5 * Math.max(0, -c), rK: 0.25 + 0.5 * Math.max(0, c), lS: -0.45 * s, rS: 0.45 * s, lE: 0.45, rE: 0.45});};
export const run = (t: number, speed = 2.6): Pose => {const s = Math.sin(t * TAU * speed), c = Math.cos(t * TAU * speed); return P({spine: 0.26, lH: 0.85 * s + 0.2, rH: -0.85 * s + 0.2, lK: 0.5 + 0.9 * Math.max(0, -c), rK: 0.5 + 0.9 * Math.max(0, c), lS: -0.85 * s, rS: 0.85 * s, lE: 1.5, rE: 1.5});};
/** Digging: drive down, lift, throw. */
export const dig = (t: number, speed = 1.1): Pose => {const u = (t * speed) % 1, down = Math.sin(u * Math.PI), s = 0.25 + 0.75 * down; return P({spine: s, head: -0.4 * down, rS: 0.5 + 0.55 * down, rE: 0.5, lS: 0.9 + 0.3 * down, lE: 0.75, lH: 0.35 + 0.5 * down, lK: 0.25 + 0.6 * down, rH: -0.2 + 0.3 * down, rK: 0.1 + 0.3 * down});};
export const crank = (t: number, speed = 1.1): Pose => {const a = t * TAU * speed, c = Math.cos(a), s = Math.sin(a); return P({spine: 0.28 + 0.14 * s, head: -0.2, rS: 1.15 + 0.42 * s, rE: 0.65 + 0.4 * c, lS: 1.15 - 0.42 * s, lE: 0.65 - 0.4 * c, lH: 0.32, lK: 0.32, rH: -0.12, rK: 0.14});};
export const pump = (t: number, speed = 1.3): Pose => {const s = Math.sin(t * TAU * speed); return P({spine: 0.3 + 0.2 * s, head: -0.2 * s, rS: 1.05 + 0.5 * s, rE: 0.3, lS: 1.05 + 0.5 * s, lE: 0.3, lH: 0.32, lK: 0.32, rH: -0.12, rK: 0.14});};
export const haul = (t: number, speed = 1.2): Pose => {const s = Math.sin(t * TAU * speed); return P({spine: -0.14 + 0.1 * s, head: 0.15, rS: 1.4 + 0.65 * s, rE: 0.5 - 0.3 * s, lS: 1.4 - 0.65 * s, lE: 0.5 + 0.3 * s, lH: 0.3, lK: 0.4, rH: -0.25, rK: 0.1});};
export const climb = (t: number, speed = 1.1): Pose => {const s = Math.sin(t * TAU * speed); return P({spine: 0.12, head: -0.3, rS: 2.2 + 0.5 * s, rE: 0.6, lS: 2.2 - 0.5 * s, lE: 0.6, lH: 0.7 - 0.6 * s, lK: 1 - 0.6 * s, rH: 0.7 + 0.6 * s, rK: 1 + 0.6 * s});};
export const carry = (t: number, speed = 1.4): Pose => ({...walk(t, speed), lS: 0.72, rS: 0.72, lE: 1, rE: 1, spine: -0.06});
export const kneel = (t = 0): Pose => P({spine: 0.34 + 0.04 * Math.sin(t * 3), head: 0.14, lH: 1.5, lK: 1.6, rH: 0.1, rK: 1.75, lS: 0.5, rS: 0.5, lE: 0.5, rE: 0.5});
export const collapse = (t = 0): Pose => P({spine: 0.72 + 0.03 * Math.sin(t * 2.2), head: 0.45, lH: 1.4, lK: 1.9, rH: 1.2, rK: 1.9, lS: 0.3, rS: 0.3, lE: 0.2, rE: 0.2});
export const cheer = (t: number): Pose => {const s = Math.sin(t * TAU * 1.6); return P({spine: -0.08, head: 0.22, rS: 2.9 + 0.14 * s, rE: 0.3, rOut: 0.35, lS: 2.9 - 0.14 * s, lE: 0.3, lOut: 0.35});};
export const drink = (t = 0): Pose => P({spine: -0.1, head: 0.55, rS: 1.75, rE: 2.05 + 0.05 * Math.sin(t * 3)});
export const swing = (t: number, speed = 1.4): Pose => {const u = (t * speed) % 1, h = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65; return P({spine: 0.5 - 0.7 * h, rS: 0.6 + 2 * h, rE: 0.5, lS: 0.6 + 2 * h, lE: 0.5, lH: 0.3, lK: 0.2});};

export type Outfit = {skin: string; shirt: string; legs: string; boots: string; hair: string; belt?: string; hat?: "none" | "straw" | "helmet" | "hood" | "cap"; hatColor?: string};
export const OUTFITS = {
  builder: {skin: "#C9956E", shirt: "#2F6FB5", legs: "#3C3A44", boots: "#3A281C", hair: "#3B2A1E", belt: "#6B4A2E", hat: "straw", hatColor: "#D9B872"} as Outfit,
  worker: {skin: "#A87552", shirt: "#3F8F6B", legs: "#4A4238", boots: "#2C2118", hair: "#20160F", belt: "#3A2A1E", hat: "cap", hatColor: "#3F8F6B"} as Outfit,
  raider: {skin: "#B98A66", shirt: "#C4271F", legs: "#35262A", boots: "#1E1A18", hair: "#2A1A12", belt: "#1E1A18", hat: "helmet", hatColor: "#8C8F96"} as Outfit,
  villager: {skin: "#E0B48F", shirt: "#B8813B", legs: "#54483C", boots: "#332416", hair: "#6A4324", belt: "#3F2C1C", hat: "hood", hatColor: "#7C5A36"} as Outfit,
};

const Limb: React.FC<{r: number; l: number; color: string}> = ({r, l, color}) => <mesh position={[0, -l / 2, 0]} castShadow><capsuleGeometry args={[r, Math.max(0.01, l - r * 2), 6, 12]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>;

const Hat: React.FC<{o: Outfit}> = ({o}) => {
  const c = o.hatColor ?? "#888";
  if (o.hat === "straw") return <group position={[0, 0.07, 0]}>
    <mesh castShadow><cylinderGeometry args={[0.235, 0.26, 0.018, 24]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
    <mesh position={[0, 0.05, 0]} castShadow><cylinderGeometry args={[0.095, 0.125, 0.1, 18]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.127, 0.128, 0.022, 18]} /><meshStandardMaterial color="#8A3F2C" roughness={0.8} /></mesh>
  </group>;
  if (o.hat === "helmet") return <group position={[0, 0.03, 0]}>
    <mesh castShadow><sphereGeometry args={[0.145, 20, 12, 0, TAU, 0, Math.PI / 2]} /><meshStandardMaterial color={c} metalness={0.7} roughness={0.35} /></mesh>
    <mesh position={[0, 0, 0.13]}><boxGeometry args={[0.03, 0.14, 0.02]} /><meshStandardMaterial color={c} metalness={0.7} roughness={0.35} /></mesh>
  </group>;
  if (o.hat === "hood") return <mesh position={[0, -0.01, -0.02]} castShadow><sphereGeometry args={[0.158, 20, 14, 0, TAU, 0, 1.9]} /><meshStandardMaterial color={c} roughness={0.9} side={THREE.DoubleSide} /></mesh>;
  if (o.hat === "cap") return <group position={[0, 0.045, 0]}>
    <mesh castShadow><sphereGeometry args={[0.138, 18, 10, 0, TAU, 0, Math.PI / 2]} /><meshStandardMaterial color={c} roughness={0.85} /></mesh>
    <mesh position={[0, 0.002, 0.13]} rotation={[0.12, 0, 0]}><boxGeometry args={[0.15, 0.016, 0.1]} /><meshStandardMaterial color={c} roughness={0.85} /></mesh>
  </group>;
  return null;
};

const TH = 0.42, SH = 0.44, UA = 0.29, FA = 0.27, FOOT = 0.085;
/** A jointed, dressed character. Feet plant on the ground automatically unless `air` is set. */
export const Person: React.FC<{p: [number, number, number]; r?: number; h?: number; pose?: Pose; o?: Outfit; lying?: boolean; air?: boolean; right?: React.ReactNode; left?: React.ReactNode}> = ({p, r = 0, h = 1.75, pose = STAND, o = OUTFITS.builder, lying, air, right, left}) => {
  const s = h / 1.75;
  const legY = (hip: number, knee: number) => TH * Math.cos(hip) + SH * Math.cos(hip - knee) + FOOT;
  const y = air ? 0.95 : Math.max(legY(pose.lH, pose.lK), legY(pose.rH, pose.rK));
  const tunic = useMemo(() => new THREE.CylinderGeometry(0.17, 0.235, 0.42, 16), []);
  const leg = (side: number, hip: number, knee: number) => (
    <group position={[side * 0.1, 0, 0]} rotation={[-hip, 0, 0]}>
      <Limb r={0.082} l={TH} color={o.legs} />
      <group position={[0, -TH, 0]} rotation={[knee, 0, 0]}>
        <Limb r={0.068} l={SH} color={o.legs} />
        <mesh position={[0, -SH - 0.015, 0.055]} scale={[0.082, 0.07, 0.16]} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={o.boots} roughness={0.8} /></mesh>
      </group>
    </group>
  );
  const arm = (side: number, sh: number, el: number, out: number, hold?: React.ReactNode) => (
    <group position={[side * 0.23, 0.46, 0]} rotation={[-sh, 0, side * out]}>
      <Limb r={0.062} l={UA} color={o.shirt} />
      <group position={[0, -UA, 0]} rotation={[-el, 0, 0]}>
        <Limb r={0.05} l={FA} color={o.skin} />
        <group position={[0, -FA - 0.02, 0]}>
          <mesh scale={0.058} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={o.skin} roughness={0.6} /></mesh>
          {hold}
        </group>
      </group>
    </group>
  );
  const body = (
    <group position={[0, y, 0]}>
      {leg(-1, pose.lH, pose.lK)}
      {leg(1, pose.rH, pose.rK)}
      <group rotation={[pose.spine, 0, 0]}>
        <mesh position={[0, 0.27, 0]} geometry={tunic} castShadow rotation={[0, 0, Math.PI]}><meshStandardMaterial color={o.shirt} roughness={0.8} /></mesh>
        <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[0.175, 0.2, 0.14, 16]} /><meshStandardMaterial color={o.shirt} roughness={0.8} /></mesh>
        {o.belt && <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.178, 0.186, 0.045, 16]} /><meshStandardMaterial color={o.belt} roughness={0.7} /></mesh>}
        <mesh position={[0, 0.54, 0]} castShadow><cylinderGeometry args={[0.055, 0.065, 0.08, 10]} /><meshStandardMaterial color={o.skin} roughness={0.6} /></mesh>
        <group position={[0, 0.68, 0]} rotation={[-pose.head, 0, 0]}>
          <mesh scale={[0.125, 0.145, 0.13]} castShadow><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color={o.skin} roughness={0.55} /></mesh>
          {[-0.05, 0.05].map((x) => <mesh key={x} position={[x, 0.02, 0.115]} scale={0.016}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#1A1412" /></mesh>)}
          <mesh position={[0, -0.018, 0.128]} scale={[0.018, 0.024, 0.024]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={o.skin} roughness={0.5} /></mesh>
          {o.hat === "none" || !o.hat ? <mesh position={[0, 0.045, -0.015]} scale={[0.132, 0.125, 0.135]}><sphereGeometry args={[1, 16, 10, 0, TAU, 0, 1.5]} /><meshStandardMaterial color={o.hair} roughness={0.8} /></mesh> : null}
          <Hat o={o} />
        </group>
        {arm(-1, pose.lS, pose.lE, pose.lOut, left)}
        {arm(1, pose.rS, pose.rE, pose.rOut, right)}
      </group>
    </group>
  );
  return <group position={p} rotation={[0, r, 0]} scale={s}>{lying ? <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0.9]}>{body}</group> : body}</group>;
};

/* Hand props. They attach to the hand, so they follow the arm. */
const WOOD = "#8A5D36", IRON = "#7E8690";
export const Shovel: React.FC = () => <group rotation={[0.25, 0, 0]}>
  <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.92, 8]} /><meshStandardMaterial color={WOOD} roughness={0.8} /></mesh>
  <mesh position={[0, -0.74, 0]} castShadow scale={[1, 1, 0.3]}><boxGeometry args={[0.22, 0.26, 0.07]} /><meshStandardMaterial color={IRON} metalness={0.7} roughness={0.35} /></mesh>
</group>;
export const Spear: React.FC = () => <group rotation={[1.1, 0, 0]}>
  <mesh castShadow><cylinderGeometry args={[0.016, 0.016, 2, 8]} /><meshStandardMaterial color={WOOD} roughness={0.8} /></mesh>
  <mesh position={[0, -1.08, 0]} rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.045, 0.2, 8]} /><meshStandardMaterial color={IRON} metalness={0.7} roughness={0.35} /></mesh>
</group>;
export const Bucket: React.FC<{water?: boolean}> = ({water}) => <group position={[0, -0.24, 0]}>
  <mesh castShadow><cylinderGeometry args={[0.13, 0.1, 0.22, 16, 1, true]} /><meshStandardMaterial color={WOOD} roughness={0.8} side={THREE.DoubleSide} /></mesh>
  <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.1, 0.1, 0.01, 16]} /><meshStandardMaterial color="#5A3B22" /></mesh>
  {[0.08, -0.08].map((y) => <mesh key={y} position={[0, y, 0]}><torusGeometry args={[0.122 - y * 0.15, 0.007, 6, 20]} /><meshStandardMaterial color={IRON} metalness={0.6} roughness={0.4} /></mesh>)}
  {water && <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.118, 0.118, 0.01, 16]} /><meshStandardMaterial color="#2C8BE6" roughness={0.15} /></mesh>}
  <mesh position={[0, 0.17, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.13, 0.006, 6, 20, Math.PI]} /><meshStandardMaterial color={IRON} metalness={0.6} roughness={0.4} /></mesh>
</group>;

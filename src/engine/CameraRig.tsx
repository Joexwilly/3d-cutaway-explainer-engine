import {useThree} from "@react-three/fiber";
import {lerp, sine} from "./clock";

export type V3 = [number, number, number];
export type Station = {pos: V3; tar: V3; fov?: number; yaw?: number; pitch?: number; focus?: V3; keep?: V3[]};
export type Move = {at: number; to: Station; frames?: number};
export type Shot = {start: number; from: Station; moves?: Move[]; drift?: number};

export const FOV = 41.3; // Solved from reference landmarks.
export const MOVE_FRAMES = 35; // Reference median across 115 measured moves.
const DEFAULT_DRIFT = 0.005; // Holds keep creeping in at about 0.5% of subject distance per second.
const mix3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * The only way to place a camera: orbit a subject. Yaw + swings right of the subject, pitch + looks down.
 * There is no roll parameter, so the horizon can never tip.
 */
export const orbit = (subject: V3, a: {yaw: number; pitch: number; dist: number; fov?: number; focus?: V3; keep?: V3[]}): Station => ({
  pos: [
    subject[0] + a.dist * Math.sin(rad(a.yaw)) * Math.cos(rad(a.pitch)),
    subject[1] + a.dist * Math.sin(rad(a.pitch)),
    subject[2] + a.dist * Math.cos(rad(a.yaw)) * Math.cos(rad(a.pitch)),
  ],
  tar: subject, fov: a.fov ?? FOV, yaw: a.yaw, pitch: a.pitch, focus: a.focus, keep: a.keep,
});

/** Shot vocabulary measured from the reference reels. Pick one of these; do not improvise angles. */
export const hero = (s: V3, dist: number, o: Partial<Parameters<typeof orbit>[1]> = {}) => orbit(s, {yaw: 32, pitch: 19, dist, ...o});
export const section = (s: V3, dist: number, o: Partial<Parameters<typeof orbit>[1]> = {}) => orbit(s, {yaw: 5, pitch: 9, dist, ...o});
export const macro = (s: V3, dist: number, o: Partial<Parameters<typeof orbit>[1]> = {}) => orbit(s, {yaw: 16, pitch: 11, dist, ...o});
export const low = (s: V3, dist: number, o: Partial<Parameters<typeof orbit>[1]> = {}) => orbit(s, {yaw: 24, pitch: 5, dist, ...o});

export const cameraAt = (shots: Shot[], t: number, fps: number) => {
  let shot = shots[0];
  for (const s of shots) if (t >= s.start) shot = s;
  let cur: Station = shot.from;
  for (const m of shot.moves ?? []) {
    const d = (m.frames ?? MOVE_FRAMES) / fps;
    if (t < m.at) break;
    const u = sine((t - m.at) / d);
    cur = {pos: mix3(cur.pos, m.to.pos, u), tar: mix3(cur.tar, m.to.tar, u), fov: lerp(cur.fov ?? FOV, m.to.fov ?? FOV, u)};
  }
  const k = 1 - (shot.drift ?? DEFAULT_DRIFT) * (t - shot.start);
  return {pos: mix3(cur.tar, cur.pos, k), tar: cur.tar, fov: cur.fov ?? FOV};
};

export const CameraRig: React.FC<{shots: Shot[]; t: number; fps: number}> = ({shots, t, fps}) => {
  const cam = useThree((s) => s.camera) as import("three").PerspectiveCamera;
  const c = cameraAt(shots, t, fps);
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  cam.near = 0.1;
  cam.far = 400;
  cam.updateProjectionMatrix();
  cam.lookAt(...c.tar);
  cam.updateMatrixWorld();
  return null;
};

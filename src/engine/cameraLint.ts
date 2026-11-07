import * as THREE from "three";
import type {Shot, Station, V3} from "./CameraRig";
import {FOV, MOVE_FRAMES} from "./CameraRig";

/**
 * Runs before any frame renders. A bad camera plan throws here, so it never reaches a render.
 * Rules come from 15 measured reference reels: see references/camera.md.
 */
const project = (st: Station, p: V3, w: number, h: number) => {
  const cam = new THREE.PerspectiveCamera(st.fov ?? FOV, w / h, 0.1, 500);
  cam.position.set(...st.pos); cam.lookAt(...st.tar); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return {x: (v.x + 1) / 2, y: (1 - v.y) / 2, z: v.z};
};

export const lintCamera = (shots: Shot[], duration: number, w = 1080, h = 1920) => {
  const err: string[] = [];
  const stations: [string, Station][] = shots.flatMap((s, i) => [[`shot ${i + 1} start`, s.from] as [string, Station], ...(s.moves ?? []).map((m, k) => [`shot ${i + 1} move ${k + 1}`, m.to] as [string, Station])]);
  const first = shots[0].from, last = shots[shots.length - 1];
  const end = last.moves?.length ? last.moves[last.moves.length - 1].to : last.from;
  if (first.yaw === undefined || Math.abs(first.yaw) < 18) err.push("Opening shot must be a three-quarter hero angle: |yaw| at least 18 degrees. Use hero().");
  if (first.pitch !== undefined && (first.pitch < 10 || first.pitch > 36)) err.push("Opening pitch must be 10 to 36 degrees.");
  if (first.yaw !== undefined && end.yaw !== undefined && (Math.abs(first.yaw - end.yaw) > 15 || Math.abs((first.pitch ?? 0) - (end.pitch ?? 0)) > 12)) err.push("Film must end on the opening angle (within 15 degrees yaw, 12 pitch): the finished object replaces the crude one.");
  for (const [n, st] of stations) {
    for (const k of st.keep ?? []) {
      const p = project(st, k, w, h);
      if (p.x < 0.05 || p.x > 0.95 || p.y < 0.04 || p.y > 0.96 || p.z > 1) err.push(`${n}: keep point [${k}] leaves the frame safe area (x ${p.x.toFixed(2)}, y ${p.y.toFixed(2)}).`);
    }
    if (st.focus) {
      const p = project(st, st.focus, w, h);
      if (p.x > 0.2 && p.x < 0.8 && p.y > 0.47 && p.y < 0.58) err.push(`${n}: focus [${st.focus}] sits under the caption band (y ${p.y.toFixed(2)}). Reframe so the detail clears it.`);
    }
  }
  shots.forEach((s, i) => {
    const next = shots[i + 1]?.start ?? duration;
    if (next - s.start > 11) err.push(`Shot ${i + 1} runs ${(next - s.start).toFixed(1)}s. Limit is 11s; the reference median is 3s.`);
    for (const m of s.moves ?? []) {
      const f = m.frames ?? MOVE_FRAMES;
      if (f < 28 || f > 44) err.push(`Shot ${i + 1}: move lasts ${f} frames. Allowed range is 28 to 44.`);
      if (m.at + f / 30 > next + 0.02) err.push(`Shot ${i + 1}: move at ${m.at.toFixed(2)}s is cut off by the next shot.`);
    }
  });
  if (err.length) throw new Error("CAMERA LINT FAILED\n- " + err.join("\n- "));
};

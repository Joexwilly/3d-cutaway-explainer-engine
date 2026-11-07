import * as THREE from "three";
import {cameraAt, type Shot, type V3} from "./CameraRig";

/**
 * Checks every frame a label is on screen, including frames inside camera moves.
 * Stills miss those frames. A bad label throws here, so it never reaches a render.
 * Top margin leaves room for the app's own controls. Bottom keeps labels off the captions.
 */
export type Label = {text: string; color: string; position: V3; height: number; at: number; until: number};
export const SAFE = {top: 0.09, bottom: 0.46, side: 0.05};
const W = 1080, H = 1920, FPS = 30;

export const labelBounds = (l: Label, shots: Shot[], duration: number, x = l.position[0], y = l.position[1]) => {
  const hp = l.height * 1.72, vw = ((0.68 * l.text.length * 220 + 40) / 380) * hp, vh = 0.72 * hp;
  const b = {top: 1, bottom: 0, left: 1, right: 0};
  for (let t = l.at; t < Math.min(l.until, duration) - 0.02; t += 1 / FPS) {
    const c = cameraAt(shots, t, FPS), cam = new THREE.PerspectiveCamera(c.fov, W / H, 0.1, 500);
    cam.position.set(...c.pos); cam.lookAt(...c.tar); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = new THREE.Vector3(x + (dx * vw) / 2, y + (dy * vh) / 2, l.position[2]).project(cam);
      const px = (v.x + 1) / 2, py = (1 - v.y) / 2;
      b.top = Math.min(b.top, py); b.bottom = Math.max(b.bottom, py); b.left = Math.min(b.left, px); b.right = Math.max(b.right, px);
    }
  }
  return b;
};
export const labelSafe = (b: ReturnType<typeof labelBounds>) => b.top >= SAFE.top && b.bottom <= SAFE.bottom && b.left >= SAFE.side && b.right <= 1 - SAFE.side;

/** Moves a label the least it can to fit: down first, then sideways. */
export const fitLabel = (l: Label, shots: Shot[], duration: number): [number, number] => {
  let x = l.position[0], y = l.position[1];
  for (let i = 0; i < 1000; i++) {
    const b = labelBounds(l, shots, duration, x, y);
    if (b.top < SAFE.top + 0.01) y -= 0.02; else if (b.left < SAFE.side + 0.01 && b.right < 1 - SAFE.side) x += 0.02; else if (b.right > 1 - SAFE.side - 0.01 && b.left > SAFE.side) x -= 0.02; else break;
  }
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
};

export const lintLabels = (labels: Label[], shots: Shot[], duration: number) => {
  const err = labels.flatMap((l) => {
    const b = labelBounds(l, shots, duration);
    return labelSafe(b) ? [] : [`${l.text}: top ${b.top.toFixed(2)}, bottom ${b.bottom.toFixed(2)}, left ${b.left.toFixed(2)}, right ${b.right.toFixed(2)}.`];
  });
  if (err.length) throw new Error("LABEL LINT FAILED. Run: cutaway labels <slug> --fix\n- " + err.join("\n- "));
};

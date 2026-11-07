import * as THREE from "three";
type P = [number, number, number];
/** A flat quad whose UVs come from world position, so textures never stretch. Wind CCW seen from the visible side. */
export const quad = (a: P, b: P, c: P, d: P, flip = false) => {
  const g = new THREE.BufferGeometry();
  const pts = [a, b, c, d];
  const n = new THREE.Vector3().crossVectors(new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), new THREE.Vector3(...d).sub(new THREE.Vector3(...a)));
  const ax = Math.abs(n.x) > Math.abs(n.y) && Math.abs(n.x) > Math.abs(n.z) ? 0 : Math.abs(n.y) > Math.abs(n.z) ? 1 : 2;
  const uv = pts.map((p) => (ax === 0 ? [p[2], p[1]] : ax === 1 ? [p[0], p[2]] : [p[0], p[1]]));
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv.flat(), 2));
  g.setIndex(flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
};

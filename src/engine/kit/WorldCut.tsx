import * as THREE from "three";
import {useThree} from "@react-three/fiber";

/**
 * Cuts the whole world along one plane, so the camera can show a true section of anything.
 * Everything in front of z is hidden. Change z only on a hard cut. Keep labels behind the plane.
 * Clipped solids are hollow: draw a cap on the cut face, or leave cut pieces out.
 */
export const WorldCut: React.FC<{z: number}> = ({z}) => {
  const gl = useThree((s) => s.gl);
  gl.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), z + 0.03)];
  return null;
};

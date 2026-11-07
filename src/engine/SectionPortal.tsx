import * as THREE from "three";

/** Material props for anything drawn inside a portal. Paint back to front with rising renderOrder. */
export const INSIDE = {stencilWrite: true, stencilFunc: THREE.EqualStencilFunc, stencilRef: 1, depthFunc: THREE.AlwaysDepth, depthWrite: false, transparent: true} as const;

/**
 * Shows the inside of an object straight through solid ground: anything using INSIDE renders only
 * within this circle, so buried soil, gravel or walls never cut through it.
 * Needs gl={{stencil: true}} on ThreeCanvas, which the template sets.
 */
export const SectionPortal: React.FC<{radius: number; z?: number}> = ({radius, z = 0.03}) => (
  <mesh position={[0, 0, z]} renderOrder={10}>
    <circleGeometry args={[radius, 96]} />
    <meshBasicMaterial colorWrite={false} depthWrite={false} stencilWrite stencilRef={1} stencilZPass={THREE.ReplaceStencilOp} transparent />
  </mesh>
);

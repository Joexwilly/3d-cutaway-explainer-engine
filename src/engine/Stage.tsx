import {useMemo} from "react";
import * as THREE from "three";
import {Environment, useGLTF} from "@react-three/drei";
import {useThree} from "@react-three/fiber";
import {staticFile} from "remotion";
import {quad} from "./quad";
import type {Mats} from "./materials";

/** Renderer settings. Set during render, never in an effect: a single frame must already have them. */
export const RendererSetup: React.FC = () => {
  const gl = useThree((s) => s.gl);
  gl.localClippingEnabled = true;
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  return null;
};

/** One sky and one sun for every story, so films from this engine match each other. */
export const Lighting: React.FC = () => (
  <>
    <Environment files={staticFile("hdri/sky.hdr")} background backgroundIntensity={0.95} environmentIntensity={0.85} />
    <directionalLight position={[9, 20, 15]} intensity={2.1} color="#FFF3E2" castShadow shadow-mapSize={[4096, 4096]}
      shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-far={90} shadow-bias={-0.0004} shadow-radius={5} />
  </>
);

export const Backdrop: React.FC<{m: Mats}> = ({m}) => {
  const {scene} = useGLTF(staticFile("models/tree/island_tree_02_1k.gltf"));
  const tree = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o: any) => {if (o.isMesh) {o.castShadow = true; o.material.envMapIntensity = 0.6; o.material.color.set('#8F8A80');}});
    return s;
  }, [scene]);
  const fence = useMemo(() => quad([-110, 0, -48], [110, 0, -48], [110, 2.4, -48], [-110, 2.4, -48]), []);
  const pile = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 48, 24);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const n = 1 + 0.08 * Math.sin(v.x * 7 + v.z * 3) + 0.06 * Math.sin(v.z * 11 + v.y * 5);
      p.setXYZ(i, v.x * n, v.y * n, v.z * n);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <primitive object={tree} position={[1.2, 0, -30]} scale={4.6} rotation={[0, 2.3, 0]} />
      <mesh geometry={fence} material={m.plank} receiveShadow />
      <group position={[16, 0, -72]}>
        <mesh castShadow position={[0, 3.6, 0]}><boxGeometry args={[17, 7.2, 8]} /><meshStandardMaterial color="#A6A592" roughness={0.9} /></mesh>
        <mesh position={[0, 7.5, 0]} material={m.tile} scale={[10.4, 1.9, 5]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.42, 1, 4]} /></mesh>
        {[-6, -2, 2, 6].flatMap((x) => [2, 5.2].map((y) => (
          <group key={`${x}${y}`} position={[x, y, 4.02]}>
            <mesh><planeGeometry args={[1.4, 1.7]} /><meshStandardMaterial color="#F2F0E8" /></mesh>
            <mesh position={[0, 0, 0.01]}><planeGeometry args={[1.15, 1.45]} /><meshStandardMaterial color="#44566B" metalness={0.4} roughness={0.2} /></mesh>
            {[-1, 1].map((s) => <mesh key={s} position={[s * 1.02, 0, 0.01]}><planeGeometry args={[0.45, 1.7]} /><meshStandardMaterial color="#2C5F86" /></mesh>)}
          </group>
        )))}
      </group>
      <mesh castShadow receiveShadow geometry={pile} material={m.soil} position={[11, -0.3, -38]} scale={[7, 2.8, 4]} />
    </group>
  );
};

/** Indoor or abstract setting for non-construction topics: a clean floor and back wall, no lawn or house. */
export const Studio: React.FC<{floor?: string; wall?: string; depth?: number}> = ({floor = "#8D97A3", wall = "#6F7C8C", depth = 26}) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -60]} receiveShadow><planeGeometry args={[320, 240]} /><meshStandardMaterial color={floor} roughness={0.7} /></mesh>
    <mesh position={[0, 30, -depth]} receiveShadow><planeGeometry args={[320, 60]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
  </group>
);

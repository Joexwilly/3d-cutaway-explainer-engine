import {useMemo} from "react";
import * as THREE from "three";
import {useLoader} from "@react-three/fiber";
import {staticFile} from "remotion";

const set = (id: string, repeat: number) => {
  const paths = ["diff", "nor", "rough"].map((n) => staticFile(`tex/${id}_${n}.jpg`));
  return {paths, repeat};
};
const SOIL = set("excavated_soil_wall", 1 / 9);
const GRAVEL = set("gravel_floor_02", 1 / 2.4);
const CONC = set("concrete_floor_02", 1 / 5);
const PLANK = set("brown_planks_03", 1 / 2.6);
const TILE = set("clay_roof_tiles", 1 / 3);
const BRICK = {paths: ["diff", "nor", "rough"].map((n) => staticFile(`tex/brick_${n}.jpg`)), repeat: 1 / 2.2};

export const useMats = () => {
  const load = (s: {paths: string[]; repeat: number}) => useLoader(THREE.TextureLoader, s.paths);
  const soil = load(SOIL), gravel = load(GRAVEL), conc = load(CONC), plank = load(PLANK), tile = load(TILE), brick = load(BRICK);
  return useMemo(() => {
    const mk = (tx: THREE.Texture[], rep: number, p: THREE.MeshStandardMaterialParameters = {}) => {
      const [d, n, r] = tx.map((t) => {const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rep, rep); if (p.name === "rot") c.rotation = Math.PI / 2; c.anisotropy = 12; c.needsUpdate = true; return c;});
      d.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({map: d, normalMap: n, roughnessMap: r, emissiveMap: p.emissive ? d : null, normalScale: new THREE.Vector2(1.6, 1.6), shadowSide: THREE.DoubleSide, ...p});
    };
    // Mown lawn stripes, drawn once.
    const c = document.createElement("canvas"); c.width = 1024; c.height = 1024;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 12; i++) {g.fillStyle = i % 2 ? "#3F6D2C" : "#568A3C"; g.fillRect((i * 1024) / 12, 0, 1024 / 12 + 1, 1024);}
    for (let i = 0; i < 90000; i++) {g.fillStyle = `rgba(${i % 2 ? "30,60,20" : "170,205,120"},.10)`; g.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 5);}
    const grassT = new THREE.CanvasTexture(c); grassT.colorSpace = THREE.SRGBColorSpace; grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(1 / 26, 1 / 26); grassT.anisotropy = 12;
    return {
      soil: mk(soil, SOIL.repeat, {color: "#F2DCAE"}),
      soilDark: mk(soil, SOIL.repeat, {color: "#DCC090"}),
      water: mk(soil, SOIL.repeat, {color: "#A8C0FF", emissive: new THREE.Color("#3C63F2"), emissiveIntensity: 3, roughness: 0.6}),
      lower: mk(conc, CONC.repeat, {color: "#B6A698"}),
      gravel: mk(gravel, GRAVEL.repeat, {color: "#C7BCAD"}),
      slab: mk(conc, CONC.repeat, {color: "#E0DBD0"}),
      plank: mk(plank, PLANK.repeat, {color: "#8A5A3C", name: "rot"}),
      tile: mk(tile, TILE.repeat, {color: "#FFB184"}),
      brick: mk(brick, BRICK.repeat, {color: "#E8C8B8"}),
      mud: mk(soil, SOIL.repeat, {color: "#A98F7C"}),
      rock: mk(conc, CONC.repeat, {color: "#9A9490"}),
      grass: new THREE.MeshStandardMaterial({map: grassT, roughness: 0.95, shadowSide: THREE.DoubleSide}),
    };
  }, [soil, gravel, conc, plank, tile, brick]);
};
export type Mats = ReturnType<typeof useMats>;

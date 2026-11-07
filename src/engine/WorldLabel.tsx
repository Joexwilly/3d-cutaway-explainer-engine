import {useMemo} from "react";
import * as THREE from "three";
import {useFontsReady} from "./fonts";
import {outCubic} from "./clock";

/** A label that lives in the scene: it scales, skews and leaves frame with the world. */
export const WorldLabel: React.FC<{text: string; color: string; position: [number, number, number]; height: number; t: number; at: number; until?: number}> = ({text, color, position, height, t, at, until = Infinity}) => {
  const family = useFontsReady();
  const {tex, aspect} = useMemo(() => {
    const px = 220;
    const c = document.createElement("canvas");
    const g0 = c.getContext("2d")!;
    g0.font = `900 ${px}px ${family}`;
    const w = Math.ceil(g0.measureText(text).width) + 160;
    c.width = w; c.height = px + 160;
    const g = c.getContext("2d")!;
    g.font = `900 ${px}px ${family}`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    const draw = (dy: number, fill: string, stroke: number) => {
      g.lineWidth = stroke; g.strokeStyle = "#0B0E12"; g.strokeText(text, w / 2, c.height / 2 + dy);
      if (fill) {g.fillStyle = fill; g.fillText(text, w / 2, c.height / 2 + dy);}
    };
    for (let d = 26; d > 0; d -= 4) draw(d, "", 38); // extruded depth
    draw(0, color, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return {tex, aspect: w / c.height};
  }, [text, color, family]);
  const s = outCubic((t - at) / (5 / 30)); // 0 to 100% over about 5 frames, no overshoot.
  if (t < at || t > until) return null;
  const h = height * 1.72;
  return (
    <mesh position={position} scale={[s * h * aspect, s * h, 1]} renderOrder={40}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthTest={false} depthWrite={false} />
    </mesh>
  );
};

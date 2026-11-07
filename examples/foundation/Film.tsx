import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {CameraRig, hero, macro, orbit, section, type Shot, type V3} from "@engine/CameraRig";
import {lintCamera} from "@engine/cameraLint";
import {Lighting, RendererSetup} from "@engine/Stage";
import {ScaleFigure} from "@engine/primitives";
import {Caption} from "@engine/Caption";
import {WorldLabel} from "@engine/WorldLabel";
import {useFontGate} from "@engine/fonts";
import {FPS} from "@engine/clock";
import {useMats} from "@engine/materials";
import {Backdrop} from "@engine/Stage";
import {Building, CrackAndBars, Finish, Ground, Piles, Pour, Rocks, Slab, Squeeze} from "./World";
import T, {WORDS} from "./cues";
import story from "./data/story.json";

const SITE: V3 = [0, 0.4, -3];
const shots: Shot[] = [
  {start: 0, from: hero(SITE, 21), moves: [{at: T.tiltDown, to: orbit([0, -1.4, -2], {yaw: 16, pitch: 10, dist: 15})}]},
  {start: T.cut1, from: orbit([0, -0.5, -2.6], {yaw: 22, pitch: 19, dist: 15}), moves: [{at: T.push, to: orbit([0.6, -1.6, -1.6], {yaw: 22, pitch: 13, dist: 12.5})}]},
  {start: T.cut2, from: section([0, -3.2, 0], 14), moves: [{at: T.tiltPile, to: section([0, -7.2, 0], 14, {focus: [0, -8.6, 0]})}]},
  {start: T.cut3, from: macro([0.45, -1.6, 0], 6.1), moves: [{at: T.push2, to: orbit([0.45, -1.55, 0], {yaw: 9, pitch: 10, dist: 5.2})}], drift: 0.002},
  {start: T.cut4, from: hero([0, -2.6, -3], 30)},
];
lintCamera(shots, story.seconds);

const Scene: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const m = useMats();
  return (
    <>
      <Lighting />
      <Backdrop m={m} />
      <Ground m={m} t={t} />
      <Slab m={m} t={t} />
      <Pour t={t} />
      <Rocks t={t} />
      <Building m={m} t={t} />
      <Finish t={t} />
      {t < T.cut1 && <ScaleFigure position={[5.2, 0, -1.6]} rotation={-0.8} />}
      {t >= T.cut4 && <ScaleFigure position={[8.6, 0, -1.6]} rotation={-0.8} />}
      <Squeeze t={t} m={m} />
      <Piles t={t} />
      <CrackAndBars t={t} />
      {ready && (
        <>
          <WorldLabel text="SINKING" color="#FB7B5C" position={[0.2, -1.9, 0.1]} height={0.55} t={t} at={T.sink + 0.2} until={T.cut1} />
          <WorldLabel text="SOFT DIRT" color="#F4E58E" position={[1.3, -4.0, 0.1]} height={0.5} t={t} at={T.softLabel} until={T.cut2} />
          <WorldLabel text="SOLID ROCK" color="#F1EDE2" position={[0.1, -9.55, 0.1]} height={0.5} t={t} at={T.rock} until={T.cut3} />
          <WorldLabel text="CRACK!" color="#FB7B5C" position={[1.0, -1.25, 0.1]} height={0.2} t={t} at={T.crackLabel} until={T.bars} />
          <WorldLabel text="STEEL BARS" color="#F4E58E" position={[0.45, -2.5, 0.1]} height={0.2} t={t} at={T.barsLabel} until={T.cut4} />
        </>
      )}
    </>
  );
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = f / FPS;
  const ready = useFontGate();
  return (
    <AbsoluteFill style={{backgroundColor: "#AAACB1"}}>
      <ThreeCanvas shadows width={width} height={height} gl={{stencil: true, antialias: true, preserveDrawingBuffer: true}} camera={{fov: 41.3, position: [0, 5, 20]}}>
        <RendererSetup />
        <CameraRig shots={shots} t={t} fps={FPS} />
        <Scene t={t} ready={ready} />
      </ThreeCanvas>
      <Caption words={WORDS} />
      <Audio src={staticFile("audio/foundation/vo.wav")} />
      <Audio src={staticFile("audio/foundation/sfx.wav")} />
    </AbsoluteFill>
  );
};

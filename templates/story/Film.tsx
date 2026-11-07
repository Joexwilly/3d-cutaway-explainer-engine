import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {CameraRig, hero, macro, section, type Shot, type V3} from "@engine/CameraRig";
import {lintCamera} from "@engine/cameraLint";
import {Backdrop, Lighting, RendererSetup} from "@engine/Stage";
import {CutGround, ScaleFigure, type Layer} from "@engine/primitives";
// Other settings and props: Studio from @engine/Stage; FlowPipe, Crate, Rack, Plaque from @engine/primitives. See references/topics.md.
import {Caption} from "@engine/Caption";
import {useFontGate} from "@engine/fonts";
import {FPS} from "@engine/clock";
import {useMats} from "@engine/materials";
import story from "./data/story.json";
import {WORDS} from "./cues";

const SITE: V3 = [0, 0.8, -4];
// Placeholder rhythm so a new story renders at once. Replace with cuts tied to words in cues.ts.
const COUNT = Math.ceil(story.seconds / 8);
const shots: Shot[] = Array.from({length: COUNT}, (_, i) => ({
  start: i * 8,
  from: i === 0 || i === COUNT - 1 ? hero(SITE, 21) : i % 2 ? section([0, -2, 0], 14) : macro(SITE, 7),
}));
lintCamera(shots, story.seconds);
const LAYERS: Layer[] = [{to: -4, mat: "soil"}, {to: -9, mat: "mud"}, {to: -30, mat: "rock"}];

const Scene: React.FC<{t: number; ready: boolean}> = () => {
  const m = useMats();
  return (
    <>
      <Lighting />
      <Backdrop m={m} />
      <CutGround m={m} layers={LAYERS} />
      <ScaleFigure position={[5, 0, -2]} rotation={-0.8} />
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
      <Audio src={staticFile("audio/__SLUG__/vo.wav")} />
      <Audio src={staticFile("audio/__SLUG__/sfx.wav")} />
    </AbsoluteFill>
  );
};

import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {CameraRig} from "@engine/CameraRig";
import {lintCamera} from "@engine/cameraLint";
import {lintLabels} from "@engine/labelLint";
import {WorldLabel} from "@engine/WorldLabel";
import {Backdrop, Lighting, RendererSetup} from "@engine/Stage";
import {CutGround, ScaleFigure, type Layer} from "@engine/primitives";
// Other settings and props: Studio from @engine/Stage; FlowPipe, Crate, Rack, Plaque from @engine/primitives.
// People, effects and ground detail: @engine/kit/Person, @engine/kit/fx, @engine/kit/Dressing. See references/kit.md.
import {Caption} from "@engine/Caption";
import {useFontGate} from "@engine/fonts";
import {FPS} from "@engine/clock";
import {useMats} from "@engine/materials";
import story from "./data/story.json";
import {WORDS} from "./cues";
import {LABELS, shots} from "./plan";

lintCamera(shots, story.seconds);
lintLabels(LABELS, shots, story.seconds);
const LAYERS: Layer[] = [{to: -4, mat: "soil"}, {to: -9, mat: "mud"}, {to: -30, mat: "rock"}];

const Scene: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const m = useMats();
  return (
    <>
      <Lighting />
      <Backdrop m={m} />
      <CutGround m={m} layers={LAYERS} />
      <ScaleFigure position={[5, 0, -2]} rotation={-0.8} />
      {ready && LABELS.map((l) => <WorldLabel key={l.text} text={l.text} color={l.color} position={l.position} height={l.height} t={t} at={l.at} until={l.until} />)}
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

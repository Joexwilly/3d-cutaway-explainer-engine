import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {CameraRig} from "@engine/CameraRig";
import {lintCamera} from "@engine/cameraLint";
import {lintLabels} from "@engine/labelLint";
import {Lighting, RendererSetup} from "@engine/Stage";
import {Caption} from "@engine/Caption";
import {WorldLabel} from "@engine/WorldLabel";
import {useFontGate} from "@engine/fonts";
import {FPS} from "@engine/clock";
import {useMats} from "@engine/materials";
import {BrandCrate, Builder, Castle, Finish, FireArrow, Ground, Palisade, Pigs, Raiders, Scenery, Works, WorldCut, useKit} from "./World";
import {WORDS} from "./cues";
import {LABELS, shots} from "./plan";
import story from "./data/story.json";

lintCamera(shots, story.seconds);
lintLabels(LABELS, shots, story.seconds);

const Scene: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const m = useMats();
  const k = useKit(m);
  return (
    <>
      <Lighting />
      <WorldCut t={t} />
      <Scenery />
      <Ground k={k} t={t} />
      <Palisade k={k} t={t} />
      <Castle k={k} t={t} />
      <Works k={k} t={t} />
      <Finish k={k} t={t} />
      <FireArrow t={t} />
      <Raiders t={t} />
      <Builder t={t} />
      <Pigs t={t} />
      <BrandCrate k={k} t={t} />
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
      <Audio src={staticFile("audio/castle/vo.wav")} />
      <Audio src={staticFile("audio/castle/sfx.wav")} />
    </AbsoluteFill>
  );
};

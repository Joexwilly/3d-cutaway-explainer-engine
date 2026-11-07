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
import {Air, Blocks, Drift, Figure, Finish, Ground, Hills, Inside, Quarry, Sled, Snowfall, useSnow} from "./World";
import {sec, WORDS} from "./cues";
import {LABELS, shots} from "./plan";
import story from "./data/story.json";

lintCamera(shots, story.seconds);
lintLabels(LABELS, shots, story.seconds);

const Scene: React.FC<{t: number; ready: boolean}> = ({t, ready}) => {
  const m = useMats();
  const s = useSnow(m);
  const inside = sec(t);
  return (
    <>
      <Lighting />
      <Hills s={s} />
      <Ground s={s} t={t} sec={inside} />
      <Drift s={s} t={t} sec={inside} />
      <Quarry s={s} t={t} sec={inside} />
      <Sled m={m} sec={inside} />
      <Blocks s={s} t={t} sec={inside} />
      <Inside s={s} t={t} sec={inside} />
      <Finish s={s} t={t} sec={inside} />
      <Air t={t} sec={inside} s={s} />
      <Figure t={t} sec={inside} />
      <Snowfall t={t} />
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
      <Audio src={staticFile("audio/igloo/vo.wav")} />
      <Audio src={staticFile("audio/igloo/sfx.wav")} />
    </AbsoluteFill>
  );
};

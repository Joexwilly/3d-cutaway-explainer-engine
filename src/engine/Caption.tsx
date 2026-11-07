import {useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont} from "@remotion/google-fonts/Fredoka";
import type {Word} from "./clock";

const {fontFamily} = loadFont("normal", {weights: ["600"], subsets: ["latin"]});
const LEAD = 0.03; // Word swaps sit within about 2 frames of the spoken word.

export const Caption: React.FC<{words: Word[]}> = ({words}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let i = -1;
  for (let k = 0; k < words.length; k++) if (t >= words[k].s - LEAD) i = k;
  if (i < 0) return null;
  const w = words[i].w;
  const age = f - Math.round((words[i].s - LEAD) * fps);
  const s = 1 + 0.16 * Math.max(0, 1 - age / 4); // Starts near 116%, settles in 3-4 frames, no fade.
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: "52.5%", textAlign: "center", transform: `translateY(-50%) scale(${s})`,
      fontFamily, fontWeight: 600, fontSize: 74, letterSpacing: "0.005em", lineHeight: 1, color: "#fff",
      WebkitTextStroke: "13px #0E1A2B", paintOrder: "stroke fill", textShadow: "0 5px 12px rgba(8,14,24,.45)"}}>
      {w.charAt(0).toUpperCase() + w.slice(1)}
    </div>
  );
};

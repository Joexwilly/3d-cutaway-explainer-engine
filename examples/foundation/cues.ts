import words from "./data/words.json";
import {wordClock, type Word} from "@engine/clock";
export const WORDS = words as Word[];
const W = wordClock(WORDS);
const T = {
  rocksEnd: W("stack") + 0.05,
  stackStart: W("stack") - 0.1,
  stackEnd: W("have") - 0.05,
  sink: W("but", 0) + 0.14,
  sinkEnd: W("ground") + 0.35,
  tiltDown: W("but", 0) - 0.1,
  cut1: W("so", 0) - 0.09,
  lift: W("so", 0) - 0.05,
  pour: W("pour"),
  pourEnd: W("under") + 0.05,
  settle: W("under") + 0.08,
  squeeze: W("soft") - 0.02,
  squeezeEnd: W("underneath") + 0.3,
  push: W("but", 1) - 0.08,
  softLabel: W("soft"),
  cut2: W("so", 1) - 0.09,
  drive: W("drive"),
  rock: W("rock"),
  tiltPile: W("drive") + 0.25,
  cut3: W("but", 2) - 0.09,
  crack: W("cracks") - 0.05,
  crackLabel: W("cracks") + 0.02,
  bars: W("bury"),
  barsEnd: W("inside"),
  heal: W("inside") + 0.05,
  barsLabel: W("steel", 1),
  push2: W("so", 2) - 0.12,
  cut4: W("add") - 0.09,
  bolts: W("anchor"),
  seal: W("seal") - 0.1,
};
export default T;

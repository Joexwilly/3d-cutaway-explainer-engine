import words from "./data/words.json";
import {wordClock, type Word} from "@engine/clock";
export const WORDS = words as Word[];
const W = wordClock(WORDS);
// Every state change hangs off a spoken word. Never hard-code seconds in a scene.
const T = {
  firstBut: WORDS.find((w) => w.w.toLowerCase() === "but")?.s ?? 4,
  // cut1: W("so", 0) - 0.09,
};
export {W};
export default T;

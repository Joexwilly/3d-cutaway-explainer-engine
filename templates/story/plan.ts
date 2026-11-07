import {hero, macro, section, type Shot, type V3} from "@engine/CameraRig";
import type {Label} from "@engine/labelLint";
import story from "./data/story.json";

const SITE: V3 = [0, 0.8, -4];
// Placeholder rhythm so a new story renders at once. Replace with cuts tied to words in cues.ts.
const COUNT = Math.ceil(story.seconds / 8);
export const shots: Shot[] = Array.from({length: COUNT}, (_, i) => ({
  start: i * 8,
  from: i === 0 || i === COUNT - 1 ? hero(SITE, 21) : i % 2 ? section([0, -2, 0], 14) : macro(SITE, 7),
}));

// One label per line, so `cutaway labels <slug> --fix` can move it. Coral for faults, pale yellow for mechanisms, cream for facts.
export const LABELS: Label[] = [
];

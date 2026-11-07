export type Word = {w: string; s: number; e: number};
export const FPS = 30;
export const wordClock = (list: Word[]) => (word: string, nth = 0): number => {
  const hits = list.filter((x) => x.w.toLowerCase() === word.toLowerCase());
  if (!hits[nth]) throw new Error(`No word ${word} #${nth}`);
  return hits[nth].s;
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
export const outQuad = (u: number) => 1 - (1 - clamp01(u)) ** 2;
export const outCubic = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const inQuad = (u: number) => clamp01(u) ** 2;
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

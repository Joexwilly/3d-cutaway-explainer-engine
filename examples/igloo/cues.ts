import words from "./data/words.json";
import {wordClock, type Word} from "@engine/clock";
export const WORDS = words as Word[];
const W = wordClock(WORDS);
const cut = (t: number) => t - 0.09;
// Every state change hangs off a spoken word. Never hard-code seconds in a scene.
const T = {
  firstBut: W("but", 0),
  // Shots
  cCave: cut(W("but", 0)), cOut: cut(W("climb") - 0.2), cSaw: cut(W("saw")), cWall: cut(W("but", 1)), cSpiral: cut(W("lay") - 0.1), cLow: cut(W("ring") - 0.1),
  cDome: cut(W("this", 0)), cBreath: cut(W("but", 2)), cPoke: cut(W("poke") - 0.2), cWind: cut(W("but", 3)), cDig: cut(W("dig", 1) - 0.2), cTrap: cut(W("this", 2)),
  cTunnel: cut(W("why") - 0.3), cCold: cut(W("but", 4)), cShelf: cut(W("pile") - 0.2), cDrip: cut(W("but", 5)), cLamp: cut(W("light") - 0.2), cNow: cut(W("now", 1)), cWarm: cut(W("warm", 1)),
  cAdd: cut(W("add")), cSkins: cut(W("caribou")), cEnd: cut(W("congratulations")),
  // Drift
  sag: W("sags"), sagEnd: W("face"), loose: W("loose"), collapse: W("climb"), collapseEnd: W("out") + 0.45,
  // Quarry
  find: W("find"), packed: W("wind-packed"), saw: W("saw"), sawEnd: W("but", 1) - 0.1,
  // Wall that fails
  wallStart: W("but", 1) - 0.15, wallEnd: W("just"), lean: W("leans"), fall: W("falls") - 0.15, fallLabel: W("falls"),
  // Spiral
  spiral: W("lay"), spiralLabel: W("spiral", 0), dome: W("dome", 0), domeLabel: W("dome", 1),
  // Air
  breath: W("breath"), stale: W("stale"), poke: W("poke"), pop: W("top"), vent: W("vent"),
  wind: W("wind", 0), heat: W("steals"), dig: W("dig", 1), digEnd: W("floor"), plug: W("entrance"), sinks: W("sinks"), trap: W("cold", 1), tunnel: W("tunnel"),
  // Shelf, lamp
  coldFloor: W("cold", 2), pile: W("pile"), shelfEnd: W("back"), warm: W("warm", 0), drip: W("dripping"), lamp: W("light"), melt: W("melt"), ice: W("ice"), qulliq: W("qulliq"),
  forty: W("forty"), warm2: W("warm", 1),
  // Finish
  gaps: W("gaps") - 0.5, door: W("block", 1), skins: W("caribou"),
};
export {W};
export default T;

/** Which stretches are shown as the sliced cross-section. The switch only happens on a hard cut. */
const SEC: [number, number][] = [[T.cCave, T.cOut], [T.cBreath, T.cTunnel], [T.cCold, T.cNow], [T.cWarm, T.cAdd], [T.cSkins, T.cEnd]];
export const sec = (t: number) => SEC.some(([a, b]) => t >= a && t < b);

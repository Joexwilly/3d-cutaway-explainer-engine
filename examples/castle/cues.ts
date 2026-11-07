import words from "./data/words.json";
import {wordClock, type Word} from "@engine/clock";
export const WORDS = words as Word[];
const W = wordClock(WORDS);
const cut = (t: number) => t - 0.09;
const T = {
  firstBut: W("but", 0),
  cStab: cut(W("but", 0)), cDitch: cut(W("so", 0)), cMotte: cut(W("this", 0)), cFire: cut(W("but", 1)), cStone: cut(W("so", 1)), cKeep: cut(W("this", 1)), cRam: cut(W("but", 2)),
  cGate: cut(W("so", 2)), cMine: cut(W("but", 3)), cRoch: cut(W("in", 1)), cPigs: cut(W("with", 2)), cRound: cut(W("so", 3)), cTower: cut(W("because")), cWhy: cut(W("that", 2)),
  cLadder: cut(W("but", 4)), cWalk: cut(W("so", 4)), cBreach: cut(W("but", 5)), cInner: cut(W("so", 5)), cArch: cut(W("and", 11)), cConc: cut(W("this", 2)), cAdd: cut(W("add")), cEnd: cut(W("congratulations")),
  raiders: W("raiders"), run: W("run"), stab: W("stab"), dig: W("dig"), throw: W("throw"), steeper: W("steeper"), ring: W("ring"), logs: W("logs"), motte: W("motte"),
  wood: W("wood", 0), burns: W("burns"), arrow: W("arrow", 0), fire: W("sets"), fireEnd: W("fire"), tear: W("tear"), stoneT: W("build", 0), stoneEnd: W("this", 1), keep: W("keep"),
  ram: W("drag"), door: W("door"), hit: W("door") + 0.1, gate: W("gate"), drops: W("drops"), dropEnd: W("above"), holes: W("holes", 0), rocks: W("rocks"), boil: W("boiling"), murder: W("murder"),
  enemy: W("enemy"), tunnels: W("tunnels"), prop: W("propping"), propEnd: W("wood", 1), burning: W("burning"), y1215: W("1215"), corner: W("corner", 0), fat: W("fat"), forty: W("forty"),
  round: W("round", 0), towerEnd: W("because"), noCorner: W("no"), why: W("why"),
  ladders: W("ladders"), lean: W("leaning"), walk: W("walkways"), hang: W("hang", 1), holes2: W("holes", 2), floor: W("floor"), breach: W("breach"), lost: W("lost"),
  second: W("second"), inner: W("build", 3), innerEnd: W("and", 11), archers: W("archers"), concentric: W("concentric"), moat: W("moat"), slits: W("slits"), bridge: W("drawbridge"), add: W("add"),
};
export {W};
export default T;

export const APRON = 9.6, MINE = 3.85, CONC = -1.6;
/** Where the world is cut open. Changes only on a hard cut. */
const CUTS: [number, number, number][] = [[T.cMotte, T.cFire, 0], [T.cGate, T.cMine, 0], [T.cMine, T.cRoch, MINE], [T.cArch, T.cConc, CONC]];
export const cutZ = (t: number) => CUTS.find(([a, b]) => t >= a && t < b)?.[2] ?? APRON;

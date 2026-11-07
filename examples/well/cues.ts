import words from "./data/words.json";
import {wordClock, type Word} from "@engine/clock";
export const WORDS = words as Word[];
const W = wordClock(WORDS);
const cut = (t: number) => t - 0.09;
const T = {
  firstBut: W("but", 0),
  cCave: cut(W("but", 0)), cLine: cut(W("so", 0)), cLining: cut(W("this", 0)), cRain: cut(W("but", 1)), cWall: cut(W("so", 1)), c1854: cut(W("in", 2)), cFar: cut(W("that", 1) - 0.1),
  cHaul: cut(W("but", 2)), cCrank: cut(W("so", 2)), cWind: cut(W("this", 1)), cDry: cut(W("but", 3)), cDeep: cut(W("so", 3)), cAqui: cut(W("this", 2)), cSponge: cut(W("not")),
  cHand: cut(W("but", 4)), cLimit: cut(W("air")), cElec: cut(W("so", 5)), cPush: cut(W("pushes") - 0.1), cAdd: cut(W("add", 1)), cEnd: cut(W("congratulations")),
  seep: W("seep"), have: W("have"), cave: W("cave"), bury: W("bury"), start: W("start"), lineW: W("line"), stones: W("stones"), lining: W("lining"),
  rain: W("rainstorm"), dung: W("dung"), into: W("straight"), wall: W("wall", 0) - 0.3, top: W("top"), apron: W("sloped"), sheds: W("sheds"), away: W("away"),
  y1854: W("1854"), london: W("london"), three: W("three"), leak: W("leaking"), cholera: W("cholera"), killed: W("killed"), far: W("far"), toilets: W("toilets"),
  pulling: W("pulling"), wrecks: W("wrecks"), back: W("back"), wind: W("wind"), crank: W("crank"), windlass: W("windlass"),
  dry: W("dry"), drops: W("drops"), table: W("table"), bottom: W("bottom"), deeper: W("deeper"), wet: W("wet"), sand: W("sand", 0), aquifer: W("aquifer"), sponge: W("sponge"),
  haul: W("haul"), addP: W("add", 0), pump: W("pump", 0), air: W("air"), ten: W("ten"), lower: W("lower"), pushes: W("pushes"), pulls: W("pulls"), add: W("add", 1), sealed: W("sealed"), cap: W("cap"), tank: W("tank"), pipe: W("pipe"), kitchen: W("kitchen"), cong: W("congratulations"), built: W("built"),
};
export {W};
export default T;

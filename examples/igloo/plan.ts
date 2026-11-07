import {hero, low, macro, orbit, section, type Shot, type V3} from "@engine/CameraRig";
import T, {W} from "./cues";

const C: V3 = [1.2, -0.8, 0];
const IN: V3 = [0, -1, 0];
const Q: V3 = [2.4, 0.3, 3.4];
export const shots: Shot[] = [
  {start: 0, from: hero(C, 18), moves: [{at: W("hole"), to: hero([1, -0.5, 0], 15)}]},
  {start: T.cCave, from: section([0, -0.7, 0], 12, {focus: [0, 0.7, 0]}), moves: [{at: T.loose - 0.1, to: section([0, -0.3, 0], 9.5)}]},
  {start: T.cOut, from: hero([1.2, -0.4, 0], 18), moves: [{at: T.find - 0.15, to: orbit(Q, {yaw: 22, pitch: 16, dist: 9})}]},
  {start: T.cSaw, from: macro([2.4, -0.6, 3.4], 7, {focus: [2.4, 0.1, 3.4]})},
  {start: T.cWall, from: hero(C, 18), moves: [{at: T.lean - 0.1, to: hero([0.6, -0.3, 0], 14)}]},
  {start: T.cSpiral, from: orbit([0.3, -0.2, 0], {yaw: 24, pitch: 27, dist: 13}), moves: [{at: W("each") , to: orbit([0.3, 0, 0], {yaw: 8, pitch: 22, dist: 11.5})}]},
  {start: T.cLow, from: low([0.2, -0.6, 0], 13)},
  {start: T.cDome, from: hero(C, 16)},
  {start: T.cBreath, from: section(IN, 13), moves: [{at: T.breath - 0.2, to: section([0, -0.5, 0], 10.5, {focus: [0, 1.2, 0]})}]},
  {start: T.cPoke, from: orbit([0, 1.05, 0], {yaw: 5, pitch: 4, dist: 7.5, focus: [0, 2.45, 0]})},
  {start: T.cWind, from: section([1.2, -0.7, 0], 12)},
  {start: T.cDig, from: section([3.2, -2.1, 0], 13, {focus: [3.5, -0.7, 0]})},
  {start: T.cTrap, from: macro([3.6, -1.9, 0], 9.5, {focus: [3.5, -0.6, 0]})},
  {start: T.cTunnel, from: orbit([3.8, -0.5, 0], {yaw: 100, pitch: 14, dist: 10})},
  {start: T.cCold, from: section(IN, 13)},
  {start: T.cShelf, from: section([-0.4, -0.3, 0], 7.5, {focus: [-0.4, 0.9, 0]}), moves: [{at: T.shelfEnd - 0.5, to: section([-0.5, -0.6, 0], 10.5)}]},
  {start: T.cDrip, from: macro([-0.5, -0.7, 0], 9)},
  {start: T.cLamp, from: section([0.75, -0.1, -0.9], 5, {focus: [0.75, 0.6, -0.9]}), moves: [{at: T.melt, to: section([0, -0.8, 0], 12)}]},
  {start: T.cNow, from: hero(C, 17)},
  {start: T.cWarm, from: section([-0.6, -0.6, 0], 10.5)},
  {start: T.cAdd, from: hero(C, 17)},
  {start: T.cSkins, from: section([-0.5, -0.6, 0], 10.5)},
  {start: T.cEnd, from: hero(C, 17)},
];

export const LABELS: {text: string; color: string; position: V3; height: number; at: number; until: number}[] = [
  {text: "LOOSE SNOW", color: "#FB7B5C", position: [0, 2.13, 0.1], height: 0.42, at: T.loose, until: T.cOut},
  {text: "WIND-PACKED", color: "#F4E58E", position: [2.4, 1.28, 3.4], height: 0.2, at: T.packed, until: T.cWall},
  {text: "FALLS IN", color: "#FB7B5C", position: [0.3, 3, 0], height: 0.5, at: T.fallLabel, until: T.cSpiral},
  {text: "SPIRAL", color: "#F4E58E", position: [0.3, 2.95, 0], height: 0.5, at: T.spiralLabel, until: T.cLow},
  {text: "SPIRAL DOME", color: "#F4E58E", position: [0.2, 3.35, 0], height: 0.46, at: T.domeLabel, until: T.cBreath},
  {text: "STALE AIR", color: "#FB7B5C", position: [0, 2.27, 0.1], height: 0.34, at: T.stale, until: T.cPoke},
  {text: "VENT", color: "#F4E58E", position: [0.75, 3.03, 0.1], height: 0.26, at: T.vent, until: T.cWind},
  {text: "HEAT LOSS", color: "#FB7B5C", position: [1.3, 2.46, 0.1], height: 0.42, at: T.heat, until: T.cDig},
  {text: "COLD AIR SINKS", color: "#F1EDE2", position: [3.2, 1.33, 0.1], height: 0.42, at: T.sinks, until: T.cTrap},
  {text: "COLD TRAP", color: "#F4E58E", position: [3.5, 0.55, 0.1], height: 0.36, at: T.trap, until: T.cTunnel},
  {text: "COLD FLOOR", color: "#FB7B5C", position: [0, 2.46, 0.1], height: 0.42, at: T.coldFloor, until: T.cShelf},
  {text: "WARM AIR", color: "#F4E58E", position: [-0.5, 2.18, 0.1], height: 0.34, at: T.warm, until: T.cDrip},
  {text: "DRIP", color: "#FB7B5C", position: [-0.4, 1.66, 0.1], height: 0.3, at: T.drip, until: T.cLamp},
  {text: "ICE SHELL", color: "#F1EDE2", position: [0, 2.35, 0.1], height: 0.36, at: T.ice, until: T.qulliq},
  {text: "QULLIQ", color: "#F4E58E", position: [0, 2.35, 0.1], height: 0.36, at: T.qulliq, until: T.cNow},
  {text: "-40° OUTSIDE", color: "#F1EDE2", position: [0.2, 3.7, 0], height: 0.42, at: T.forty, until: T.cWarm},
  {text: "WARM", color: "#F4E58E", position: [-1, 2.19, 0.1], height: 0.36, at: T.warm2, until: T.cAdd},
  {text: "CARIBOU SKIN", color: "#F4E58E", position: [-0.5, 2.22, 0.1], height: 0.3, at: T.skins, until: T.cEnd},
];

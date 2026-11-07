#!/usr/bin/env node
// Voice for a story. Run through: cutaway voice <slug>
// Keys come from the shell or ~/.config/3d-cutaway-explainer/.env, never from the repo.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";

const slug = process.argv[2];
if (!slug) { console.error("Usage: cutaway voice <slug> [--file my.wav]"); process.exit(1); }
const cfg = path.join(os.homedir(), ".config/3d-cutaway-explainer/.env");
const file = fs.existsSync(cfg) ? Object.fromEntries(fs.readFileSync(cfg, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])) : {};
const get = (k, d) => process.env[k] || file[k] || d;
const story = JSON.parse(fs.readFileSync(`stories/${slug}/data/story.json`, "utf8"));
const ws = JSON.parse(fs.readFileSync("cutaway.json", "utf8"));
const dir = `audio/${slug}`;
fs.mkdirSync(dir, {recursive: true});
const raw = `${dir}/vo_raw.wav`, out = `${dir}/vo.wav`;
const PY = process.env.CUTAWAY_PY || "python3";
const transcribe = () => execFileSync(PY, ["-I", path.join(process.env.CUTAWAY_SKILL, "scripts/transcribe.py"), slug], {stdio: "inherit"});

// Bring-your-own recording.
const fi = process.argv.indexOf("--file");
if (fi > 0) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", process.argv[fi + 1], "-af", "loudnorm=I=-17:TP=-1.5:LRA=7", "-ar", "44100", out]);
  transcribe(); process.exit(0);
}
const key = get("FISH_API_KEY");
if (!key) { console.error(`No FISH_API_KEY. Add it to ${cfg}, export it, or pass --file my.wav.`); process.exit(1); }
const voiceId = get("FISH_REFERENCE_ID", story.voice_id ?? ws.voice_id);
if (!voiceId) { console.error('No voice chosen. Ask the user which Fish voice to use, then set voice_id in cutaway.json. Use "default" for the account default.'); process.exit(1); }
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

const speak = async (speed) => {
  const body = {text: story.script, format: "wav", sample_rate: 44100, normalize: true, prosody: {speed, normalize_loudness: true}};
  if (voiceId !== "default") body.reference_id = voiceId;
  const r = await fetch("https://api.fish.audio/v1/tts", {method: "POST", headers: {Authorization: `Bearer ${key}`, "Content-Type": "application/json", model: get("FISH_MODEL", "s2.1-pro-free")}, body: JSON.stringify(body)});
  if (!r.ok) { console.error("Fish error", r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
};

// Hit the target length, leaving 0.5s of tail after the last word.
// Fish timing varies between runs, so close the gap with speed, then finish with a pitch-safe tempo trim.
const target = story.seconds - 0.5;
let speed = story.speed ?? 1.3;
await speak(speed);
for (let i = 0; i < 3 && Math.abs(dur(raw) / target - 1) > 0.1; i++) {
  speed = Math.min(1.7, Math.max(0.9, speed * (dur(raw) / target)));
  await speak(speed);
}
const tempo = dur(raw) / target;
if (tempo < 0.88 || tempo > 1.14) { console.error(`Voice is ${dur(raw).toFixed(1)}s for a ${target.toFixed(1)}s target. Shorten the script or raise seconds.`); process.exit(1); }
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-af", `atempo=${tempo.toFixed(4)},loudnorm=I=-17:TP=-1.5:LRA=7`, "-ar", "44100", out]);
fs.rmSync(raw);
console.log(`voice ${dur(out).toFixed(2)}s at speed ${speed.toFixed(2)}`);
transcribe();

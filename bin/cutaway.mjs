#!/usr/bin/env node
// Command line for the 3d-cutaway-explainer skill. Stories live in the user's folder; the engine stays read-only here.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RT = process.env.CUTAWAY_HOME || path.join(os.homedir(), ".cache/3d-cutaway-explainer");
const CFG_DIR = path.join(os.homedir(), ".config/3d-cutaway-explainer");
const CFG = path.join(CFG_DIR, ".env");
const PY = fs.existsSync(path.join(RT, "venv/bin/python")) ? path.join(RT, "venv/bin/python") : "python3";
const GL = process.env.REMOTION_GL || (process.platform === "darwin" ? "angle" : "swangle");
const env = {...process.env, CUTAWAY_SKILL: SKILL, CUTAWAY_HOME: RT, CUTAWAY_PY: PY};
const build = (ws) => ({cwd: RT, env: {...env, CUTAWAY_WS: ws}});
const die = (m) => { console.error(m); process.exit(1); };
const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, {stdio: "inherit", env, ...opts}); if (r.status !== 0) process.exit(r.status ?? 1); };
const ok = (cmd, args, opts = {}) => spawnSync(cmd, args, {stdio: "ignore", env, ...opts}).status === 0;
const remotion = path.join(RT, "node_modules/.bin/remotion");
const hash = (f) => createHash("sha1").update(fs.readFileSync(f)).digest("hex");
const pascal = (s) => s.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

const inSkill = (d) => d === SKILL || d.startsWith(SKILL + path.sep);
const noWorkHere = (d) => { if (inSkill(d)) die(`This is the skill folder. User work never goes here. Choose a workspace outside ${SKILL}.`); };
const findWS = () => {
  for (let d = process.cwd(); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, "cutaway.json"))) { noWorkHere(d); return d; }
    if (d === path.dirname(d)) die('No cutaway.json here or above. Run "cutaway init <folder>" first.');
  }
};
const stories = (ws) => fs.readdirSync(path.join(ws, "stories")).filter((d) => fs.existsSync(path.join(ws, "stories", d, "data/story.json")));

/** Regenerates the hidden build files for a workspace. Safe to run at any time. */
const sync = (ws) => {
  const d = path.join(ws, ".cutaway"), pub = path.join(d, "public");
  fs.mkdirSync(pub, {recursive: true}); fs.mkdirSync(path.join(ws, "audio"), {recursive: true});
  for (const n of ["tex", "hdri", "models"]) { const l = path.join(pub, n); fs.rmSync(l, {force: true, recursive: true}); fs.symlinkSync(path.join(RT, "assets", n), l); }
  const a = path.join(pub, "audio"); fs.rmSync(a, {force: true, recursive: true}); fs.symlinkSync(path.join(ws, "audio"), a);
  // Each workspace gets a fresh engine copy and a link to shared packages, so everything resolves normally.
  fs.rmSync(path.join(d, "engine"), {force: true, recursive: true}); fs.cpSync(path.join(SKILL, "src/engine"), path.join(d, "engine"), {recursive: true});
  const nm = path.join(ws, "node_modules"); fs.rmSync(nm, {force: true, recursive: true}); fs.symlinkSync(path.join(RT, "node_modules"), nm);
  const list = stories(ws);
  const lines = list.map((s, i) => `import {Film as F${i}} from "../stories/${s}/Film";\nimport S${i} from "../stories/${s}/data/story.json";`);
  const comps = list.map((s, i) => `    <Composition id="${pascal(s)}" component={F${i}} durationInFrames={Math.round(S${i}.seconds * 30)} fps={30} width={1080} height={1920} />`);
  fs.writeFileSync(path.join(d, "entry.tsx"), `import {Composition, registerRoot} from "remotion";\n${lines.join("\n")}\n\nconst Root: React.FC = () => (\n  <>\n${comps.join("\n")}\n  </>\n);\nregisterRoot(Root);\n`);
  fs.writeFileSync(path.join(d, "tsconfig.json"), JSON.stringify({compilerOptions: {target: "ES2018", module: "Preserve", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, noEmit: true, lib: ["es2021", "dom"], esModuleInterop: true, resolveJsonModule: true, skipLibCheck: true, baseUrl: ".", paths: {"@engine/*": ["./engine/*"]}}, include: ["../stories/**/*", "./engine/**/*"]}, null, 1));
};

const cmds = {
  setup() {
    fs.mkdirSync(RT, {recursive: true});
    for (const f of ["package.json", "package-lock.json"]) fs.copyFileSync(path.join(SKILL, f), path.join(RT, f));
    fs.copyFileSync(path.join(SKILL, "scripts/runtime.config.ts"), path.join(RT, "remotion.config.ts"));
    fs.writeFileSync(path.join(RT, "tsconfig.json"), JSON.stringify({compilerOptions: {target: "ES2018", module: "Preserve", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true}, include: []}, null, 1));
    const stamp = path.join(RT, ".lock-hash"), h = hash(path.join(SKILL, "package-lock.json"));
    if (!fs.existsSync(stamp) || fs.readFileSync(stamp, "utf8") !== h || !fs.existsSync(remotion)) { run("npm", ["ci", "--silent", "--no-audit", "--no-fund"], {cwd: RT}); fs.writeFileSync(stamp, h); }
    if (!ok("python3", ["-c", "import numpy,scipy,cv2,PIL,whisper"])) {
      run("python3", ["-m", "venv", path.join(RT, "venv")]);
      run(path.join(RT, "venv/bin/python"), ["-m", "pip", "install", "-q", "-r", path.join(SKILL, "requirements.txt")]);
    }
    run(fs.existsSync(path.join(RT, "venv/bin/python")) ? path.join(RT, "venv/bin/python") : "python3", ["-I", path.join(SKILL, "scripts/fetch_assets.py"), path.join(RT, "assets")]);
    run(remotion, ["browser", "ensure", "--log=error"], {cwd: RT});
    fs.mkdirSync(CFG_DIR, {recursive: true, mode: 0o700});
    if (!fs.existsSync(CFG)) { fs.writeFileSync(CFG, "FISH_API_KEY=\nFISH_MODEL=s2.1-pro-free\n", {mode: 0o600}); console.log(`Add your FISH_API_KEY to ${CFG}`); }
    cmds.doctor();
  },
  doctor() {
    const has = (k) => process.env[k] || (fs.existsSync(CFG) && new RegExp(`^${k}=.+`, "m").test(fs.readFileSync(CFG, "utf8")));
    const nv = Number(process.versions.node.split(".")[0]);
    const checks = [["node 20+", nv >= 20, "install Node 20 or newer"], ["ffmpeg + ffprobe", ok("ffmpeg", ["-version"]) && ok("ffprobe", ["-version"]), "install ffmpeg"],
      ["python", ok(PY, ["-c", "import numpy,scipy,cv2,PIL,whisper"]), "run cutaway setup"], ["engine packages", fs.existsSync(remotion), "run cutaway setup"],
      ["assets", fs.existsSync(path.join(RT, "assets/tex/brick_diff.jpg")) && fs.existsSync(path.join(RT, "assets/hdri/sky.hdr")), "run cutaway setup"],
      ["voice key", !!has("FISH_API_KEY"), `add FISH_API_KEY to ${CFG}, or use cutaway voice <slug> --file my.wav`]];
    let good = true;
    for (const [n, pass, fix] of checks) { console.log(pass ? `ok   ${n}` : `MISS ${n}  -> ${fix}`); good &&= pass; }
    console.log(good ? "READY" : "NOT READY"); if (!good) process.exit(1);
  },
  init(dir = ".", ...rest) {
    const ws = path.resolve(dir); noWorkHere(ws); fs.mkdirSync(path.join(ws, "stories"), {recursive: true}); fs.mkdirSync(path.join(ws, "output"), {recursive: true});
    const c = path.join(ws, "cutaway.json");
    if (!fs.existsSync(c)) fs.writeFileSync(c, JSON.stringify({voice_id: null, handle: null, setting: "yard"}, null, 2) + "\n");
    const g = path.join(ws, ".gitignore"); if (!fs.existsSync(g)) fs.writeFileSync(g, ".cutaway/\nnode_modules\noutput/review/\n");
    const ex = rest.find((r) => r.startsWith("--example"));
    if (ex) {const name = ex.split("=")[1] || "foundation"; if (!fs.existsSync(path.join(SKILL, "examples", name))) die(`No example ${name}`); fs.cpSync(path.join(SKILL, "examples", name), path.join(ws, "stories", name), {recursive: true});}
    sync(ws); console.log(`Workspace ready at ${ws}. Set voice_id and handle in cutaway.json.`);
  },
  new(slug, title, noun, seconds = "70") {
    if (!slug || !title || !noun) die('Usage: cutaway new <slug> "How a X Becomes a Y" "y" [seconds]');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die("Slug must look like log-cabin");
    const ws = findWS(), d = path.join(ws, "stories", slug);
    if (fs.existsSync(d)) die(`${d} already exists`);
    fs.cpSync(path.join(SKILL, "templates/story"), d, {recursive: true});
    const f = path.join(d, "Film.tsx"); fs.writeFileSync(f, fs.readFileSync(f, "utf8").replaceAll("__SLUG__", slug));
    const p = path.join(d, "data/story.json"), j = JSON.parse(fs.readFileSync(p, "utf8"));
    Object.assign(j, {title, noun: noun.toLowerCase(), seconds: Number(seconds), script: j.script.replaceAll("__finished__", noun.toLowerCase())});
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n"); sync(ws); console.log(`Created stories/${slug}, composition ${pascal(slug)}`);
  },
  lint(slug) { run(PY, ["-I", path.join(SKILL, "scripts/lint_story.py"), slug], {cwd: findWS()}); },
  voice(slug, ...rest) { const ws = findWS(); run(process.execPath, [path.join(SKILL, "scripts/tts.mjs"), slug, ...rest], {cwd: ws}); sync(ws); },
  sfx(slug) { const ws = findWS(); run(PY, ["-I", path.join(SKILL, "scripts/gen_sfx.py"), slug], {cwd: ws}); sync(ws); },
  check() { const ws = findWS(); sync(ws); run(path.join(RT, "node_modules/.bin/tsc"), ["-p", path.join(ws, ".cutaway/tsconfig.json")], {cwd: RT}); console.log("TYPES OK"); },
  labels(slug, ...rest) {
    const ws = findWS(); sync(ws);
    const plan = path.join(ws, "stories", slug, "plan.ts"), out = path.join(ws, ".cutaway/labels.cjs");
    if (!fs.existsSync(plan)) die(`${plan} not found. Keep shots and LABELS in plan.ts.`);
    const seconds = JSON.parse(fs.readFileSync(path.join(ws, "stories", slug, "data/story.json"), "utf8")).seconds;
    const e = {...env, NODE_PATH: path.join(RT, "node_modules"), CUTAWAY_SECONDS: String(seconds), CUTAWAY_PLAN: plan};
    run(path.join(RT, "node_modules/.bin/esbuild"), [path.join(SKILL, "scripts/labels.ts"), "--bundle", "--platform=node", "--format=cjs", "--log-level=error", `--alias:@plan=${plan}`, `--alias:@engine=${path.join(ws, ".cutaway/engine")}`, `--outfile=${out}`], {env: e});
    run(process.execPath, [out, ...rest], {env: e});
  },
  stills(slug, frames, cols = "6") {
    const ws = findWS(); sync(ws); const dir = path.join(ws, "output/review"); fs.mkdirSync(dir, {recursive: true});
    const bundle = path.join(ws, ".cutaway/bundle");
    run(remotion, ["bundle", path.join(ws, ".cutaway/entry.tsx"), `--out-dir=${bundle}`, `--public-dir=${path.join(ws, ".cutaway/public")}`, `--config=${path.join(RT, "remotion.config.ts")}`, "--log=error"], build(ws));
    for (const f of frames.split(/\s+/)) run(remotion, ["still", bundle, pascal(slug), path.join(dir, `f${f}.jpg`), `--frame=${f}`, `--gl=${GL}`, "--image-format=jpeg", "--log=error"], build(ws));
    run(PY, ["-I", path.join(SKILL, "scripts/sheet.py"), frames, cols, dir, path.join(ws, `output/review/${slug}_sheet.jpg`)]);
    console.log(`Review ${path.join(ws, `output/review/${slug}_sheet.jpg`)}`);
  },
  render(slug) {
    const ws = findWS(); sync(ws); cmds.lint(slug);
    run(remotion, ["render", path.join(ws, ".cutaway/entry.tsx"), pascal(slug), path.join(ws, `output/${slug}.mp4`), `--public-dir=${path.join(ws, ".cutaway/public")}`, `--config=${path.join(RT, "remotion.config.ts")}`, `--gl=${GL}`, "--concurrency=2", "--crf=16", "--log=error"], build(ws));
    run(PY, ["-I", path.join(SKILL, "scripts/qc_video.py"), slug], {cwd: ws});
  },
};
const [c, ...a] = process.argv.slice(2);
if (!cmds[c]) die("Commands: setup, doctor, init <folder> [--example[=name]], new, lint, voice, sfx, check, labels <slug> [--fix], stills, render");
cmds[c](...a);

---
name: 3d-cutaway-explainer
description: Create vertical 3D "How a [crude thing] Becomes a [finished thing]" explainer reels on any system, including construction, engineering, software, money, biology and everyday objects. Builds a persistent 3D world piece by piece from a problem-and-fix script, with measured camera work, word-synced captions, 3D labels and synthesized sound. Use when asked for a cutaway video, how-it-works reel, explainer built up step by step, or a video in this format. Runs on Remotion and React Three Fiber.
---

# 3D Cutaway Explainer

Make a reel where the viewer builds something absurdly crude, then every failure forces a fix, until the real thing stands finished. One world persists from first frame to last.

Output: 1080×1920, 30 fps, MP4. Default length is 70 seconds, and the reference range is 64 to 79.

This skill folder is read-only. All work happens in a workspace folder the user chooses. Run every command below from inside that workspace. `cutaway` means `<skill-folder>/bin/cutaway`.

## First run

Run `cutaway doctor`. If it does not print `READY`, follow [references/install.md](references/install.md).

Then ask the user these questions before creating a workspace, unless they already answered:
1. **Which folder should this work in?** Run `cutaway init <folder>`.
2. **What voice?** A Fish Audio voice ID, or their own recording. Save the ID as `voice_id` in `cutaway.json`. Use `"default"` only if they ask for the account default. For a recording, use `cutaway voice <slug> --file my.wav` after timing the read to the script.
3. **Should a handle or brand appear on an object in the world?** Save it as `handle` in `cutaway.json`, or leave it `null`. Burn it into a real prop, such as a wooden crate, as in `examples/well/`. A sign panel reads as an ad. Keep the prop clear of the caption band, and never use a screen overlay.

Never ask the user to paste a key into chat. Point them to `~/.config/3d-cutaway-explainer/.env`.

## Workflow

Work through these gates in order. Do not render past a failed gate.

### 1. Story
Read [references/story.md](references/story.md) and [references/topics.md](references/topics.md). Check real demand for the topic before writing, using the method in `topics.md`. Then:
```
cutaway new <slug> "How a X Becomes a Y" "y"
```
Write the script in `stories/<slug>/data/story.json`. Verify every technical claim with a web search if search is available. Run `cutaway lint <slug>`, then show the user the script before building the scene, unless they asked you to go straight through.

### 2. Voice
```
cutaway voice <slug>
```
This fits the voice to `seconds` and writes `data/words.json`. All later timing comes from it.

### 3. Shot plan
Read [references/camera.md](references/camera.md). Write the `shots` array in `plan.ts`, using only `hero`, `section`, `macro`, `low` and `orbit`. Start and end on `hero`. Give detail shots a `focus` point. `lintCamera` throws before any frame renders if the plan breaks a rule.

### 4. World
Read [references/world.md](references/world.md) and [references/kit.md](references/kit.md). Build props in `stories/<slug>/World.tsx`, importing the engine from `@engine/...`. Use kit characters and effects, not capsule figures. Every state is a pure function of `t`. Every timing goes in `cues.ts`, anchored to spoken words. Put labels in `LABELS` in `plan.ts`, one per line. Run `cutaway check` to catch type errors, then `cutaway labels <slug> --fix`. `lintLabels` throws before any frame renders if a label leaves the safe area in any frame.

### 5. Stills review
```
cutaway stills <slug> "f1 f2 f3 ..." 6
```
Use one frame per shot and one per beat. Read the sheet yourself and compare it with `assets/examples/`. Fix everything on the checklist in [references/world.md](references/world.md), then sheet again. Expect at least two rounds. Rerun `cutaway labels <slug> --fix` after any camera change.

### 6. Sound
Read [references/sound.md](references/sound.md). Write `stories/<slug>/data/sfx.json`, then run `cutaway sfx <slug>`. Aim for 100 to 190 events a minute at -19 dB against the voice. You cannot hear the result, so tell the user it needs a listening pass.

### 7. Render
```
cutaway render <slug>
```
This reruns the story lint, renders to `output/<slug>.mp4`, then runs QC. A failed check means fix and render again. Never weaken a threshold to pass. Pull a few frames from the finished MP4 and read them before reporting.

### 8. Report
Give the file path, the QC result, what you could not verify, and what still falls short.

## Non-negotiable rules

- Line one names the finished object, as a joke: the crude version already counts as it.
- The last line is exactly `Congratulations, you have built a [noun].`
- The film opens mid-action at frame 0, on a three-quarter hero angle, and ends on that angle.
- The world never resets unseen. If a thing was built, it stays.
- Transitions are hard cuts only. No fades, wipes, motion blur, depth of field or music.
- Captions are screen-space, one word at a time. Labels live in the 3D world.
- Publish original topics and scripts only. Never reuse another channel's script, shot sequence, branding or audio.
- Never write keys into a workspace or this folder.

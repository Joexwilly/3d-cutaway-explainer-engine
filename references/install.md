# Install

## Needs
| Tool | Version | Check |
|---|---|---|
| Node.js | 20.19+ or 22.13+ | `node -v` |
| Python | 3.10+ | `python3 -V` |
| FFmpeg and ffprobe | Recent | `ffmpeg -version` |
| Voice | Fish Audio key, or your own recording | https://fish.audio |

Allow about 2 GB of disk, more if Whisper must be installed.

## Steps
1. Clone the skill. For Claude Code:
   ```bash
   git clone https://github.com/Joexwilly/3d-cutaway-explainer-engine ~/.claude/skills/3d-cutaway-explainer
   ```
   Other agents can clone it anywhere and read `SKILL.md`.
2. Run setup once:
   ```bash
   ~/.claude/skills/3d-cutaway-explainer/bin/cutaway setup
   ```
   This installs packages and CC0 assets into `~/.cache/3d-cutaway-explainer`, so every workspace shares them and the skill folder stays small.
3. Add your key to `~/.config/3d-cutaway-explainer/.env`. Never put it in the repo or a workspace:
   ```
   FISH_API_KEY=your-key
   FISH_MODEL=s2.1-pro-free
   ```
   Then run `chmod 600 ~/.config/3d-cutaway-explainer/.env`. Shell exports also work.
4. Run `cutaway doctor` until it prints `READY`.
5. Create a workspace anywhere with `cutaway init <folder>`.

## Updating
Run `git pull` in the skill folder, then `cutaway setup`. Your workspaces are not touched.

## Workspace layout
```
my-videos/
  cutaway.json     Voice and branding choices
  stories/<slug>/  Script, scene and sound plan
  audio/<slug>/    Generated voice and sound
  output/          Finished videos and QC reports
  .cutaway/        Generated build files, safe to delete
```

## Linux
Rendering uses software WebGL by default on Linux. To override, set `REMOTION_GL`.

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Blank 3D canvas | A `Suspense` wrapper hides loading from Remotion | Remove it |
| Clipping or shadows missing | Renderer settings placed in an effect | Use `RendererSetup` from `Stage.tsx` |
| One object clipped everywhere | Clip plane set on a shared material | Clone the material first |
| `No voice chosen` | `voice_id` is empty | Set it in `cutaway.json` |
| Fish returns 402 | Paid model on a free account | Use `s2.1-pro-free` |
| Voice too long for the film | Script is long for `seconds` | Trim the script or raise `seconds` |
| `TypeError: terminated` during voice | Connection dropped | Retries run automatically. Run `cutaway voice` again if it still fails |
| `LABEL LINT FAILED` | A label leaves the safe area in some frame | Run `cutaway labels <slug> --fix` |

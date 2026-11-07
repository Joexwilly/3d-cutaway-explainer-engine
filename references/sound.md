# Sound rules

Measured by separating voice from effects on 15 reels. An agent cannot hear these, so always ask the user for a listening pass.

## Targets
| Property | Target | Measured |
|---|---|---|
| Event rate | 100 to 190 a minute | About 126 in voice-silent moments (74 events, small sample) |
| Character | Mostly small and high | 86% above 1.5 kHz, 11% mid, 3% below 300 Hz |
| Level | Layer RMS 19 dB under voice | Voice -14.8, layer -33.9 dBFS |
| Music | None | Bed floor -55 dBFS |
| Voice | Mono, final mix near -17 LUFS | -17.3 LUFS on the study reel |
| Whooshes on camera moves | Rarely | Near silence during many moves |

## How to build a track
- **Patter is the base.** Give every moving piece a small tick or click. Use `patter` over a range and let `density` set the rate.
- **Big hits are rare.** Save `thump` for landings and finish beats. They work because the rest is small.
- **Character over realism.** Comments describe one reel as "Crossy Road sounds". Sounds are light and game-like, with pitched wobbles and beeps.
- **Dings mark wins.** Use `ding` at 1314 or 1970 Hz, a 3:2 ratio, on labels and successful fixes.

## Sound names
`tick`, `click`, `blip`, `ding`, `wobble`, `swell`, `thump`, `clank`, `pour`, `creak`, `snap`, plus `patter`.

## sfx.json
```json
{"seed": 7, "density": 0.4, "events": [
  {"s": "patter", "from": 0, "to": "stack", "rate": 7, "kinds": ["tick", "click"], "pitch": [1800, 4200], "gain": -26},
  {"s": "thump", "at": "under", "off": 0.08, "gain": -14},
  {"s": "ding", "at": "congratulations", "gain": -19, "args": {"f": 1314}},
  {"s": "clank", "at": "drive", "repeat": 6, "gap": 0.217, "gain": -21}
]}
```
`at`, `from` and `to` take seconds or a spoken word. `word#1` means the second occurrence. `cutaway sfx` sets the final level automatically.

Every sound is synthesized from code. Do not copy audio from other reels, including separated stems.

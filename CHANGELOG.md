# Changelog

## 2026-11-07: Character kit and clarity

From making three original films in a row: igloo, castle and water well.

### Added
- Character kit: jointed, dressed people with 13 poses, four outfits and hand props. Feet plant automatically.
- Effects kit: dust, smoke, sparks, splash and fire.
- Ground detail: grass tufts, stones and bushes.
- `WorldCut`: cut the whole world on one plane, chosen per beat.
- Label lint: checks every frame a label is visible and blocks the render if one leaves the safe area.
- `cutaway labels <slug> [--fix]`: reports labels and moves them into the safe area.
- `plan.ts` in new stories: shots and labels live apart from the scene.
- Examples: `igloo`, `castle`, `well`, with `cutaway init <folder> --example=<name>`.
- `references/kit.md`.

### Changed
- Voice generation retries when the connection drops.
- Branding goes on a real prop, not a sign panel.
- Topics get a demand check before writing.
- Docs now cover clarity rules, 9:16 framing, cuts that register, section methods, word timing traps, and geometry mistakes.

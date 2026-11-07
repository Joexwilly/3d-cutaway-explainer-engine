# Learning plan

How this skill keeps improving from reel data. Update the status and log as phases complete.

| Phase | Goal | Method | Output | Status |
|---|---|---|---|---|
| 1. Intake | Trust the data | Profile the CSV, download reels, keep research outside the skill | Clean dataset | Done |
| 2. Story | Decode the script formula | Word-level stats and close reading of top and bottom reels | `story.md`, story lint | Done |
| 3. Camera | Replace guesses with measurements | Cut and move stats on all 15, poses solved from landmarks | `camera.md`, `cameraLint.ts` | First pass done |
| 4. Sound | Understand the effects layer | Voice separation, voice-silent event counts | `sound.md`, `gen_sfx.py` | First pass done |
| 5. Camera depth | Measure poses beyond one reel | Solve hero, section and final poses on 5 more reels, test the bookend rule | Tighter yaw and pitch ranges | Next |
| 6. Sound depth | Classify events by what causes them | Align effects with on-screen events, build a cause-to-sound table, user listening session | Sound table in `sound.md` | Next |
| 7. Visual language | Catalogue reusable moves | Tag every shot in 5 reels by type, label use and prop motion | New primitives and patterns | Planned |
| 8. Topic selection | Learn what to make | Pull 50+ reels across channels with retention data if available | Topic scoring rubric | Planned |
| 9. Prove it | Test on original films | Make 3 original films, score each against the rubric | Side-by-side scores | Planned |
| 10. Feedback loop | Learn from your own results | After each post, log hook rate, watch time and comment themes | A running log below | Planned |

## Limits of this dataset
- 15 reels from one channel across 11 days, with no retention data.
- One reel is a large outlier, so performance links are hypotheses.
- Comment samples are thin at 33 comments, mostly on the top reels.

## Log
- 2026-11-07: Added line-one noun rule, hero opening and bookend, camera lint, sound patter system, automatic QC.
- 2026-11-07: Clean-install test found Fish timing varies between runs and could cut off the ending. Added tempo fit in tts.mjs and two QC checks for it.
- 2026-11-07: Split the skill from the workspace. Added voice and branding questions, the topics guide, and props for non-physical topics.

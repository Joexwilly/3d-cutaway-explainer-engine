# Camera rules

Measured from 115 camera moves across 15 reels, plus poses solved from landmarks. `src/engine/cameraLint.ts` enforces these before rendering.

## The grammar
| Property | Rule | Measured |
|---|---|---|
| Move length | 35 frames, allowed 28 to 44 | Median 35, middle half 30 to 38 |
| Easing | Sine in-out | Median fit error 0.065 |
| Move mix | Push about 45%, pan 30%, tilt 25% | 52 / 35 / 28 of 115 |
| Hold | Never fully still: slow push of 0.2 to 0.9% a second | 15 holds on the study reel |
| Cuts | Hard cuts, about 13 a minute, median shot 3s | 6 to 24 per reel |
| Roll | Never. `orbit` has no roll input | Horizons stay level |
| Lens | 41.3 degree vertical FOV | Solved fit |
| Blur | No motion blur, no depth of field | Sharp at peak speed |

## Shot vocabulary
Use these functions from `CameraRig.tsx`. See `assets/examples/`.

| Shot | Function | Yaw, pitch | Use |
|---|---|---|---|
| Hero | `hero(subject, dist)` | 32, 19 | Opening, ending, showing progress |
| Section | `section(subject, dist)` | 5, 9 | When the inside matters |
| Macro | `macro(subject, dist)` | 16, 11 | One mechanism, 4 to 7 units away |
| Low | `low(subject, dist)` | 24, 5 | Scale, height, vehicles |
| Custom | `orbit(subject, {...})` | Your values | Only between the above |

## Rules of thumb
1. Open on `hero`, already moving. The subject sits back from the cut edge, so strata show diagonally across the lower third. Never open flat and frontal.
2. Return to `hero` at the end, at nearly the same angle. The finished thing replaces the crude thing in the same frame.
3. Use cutaway only when the inside matters. Most shots show the object itself.
4. Rhythm is wide, close, closer, wide. Go wide after each big fix so the viewer sees progress.
5. Cut within 0.2s of a clause start about half the time, and mid-clause sometimes.
6. Give every station an orbit subject, so holds drift toward what matters.
7. Pass `focus` for any small detail, so it cannot sit under the caption band at 47 to 58% of frame height.
8. Pass `keep` points when something must stay in frame.
9. Follow fast things by planning the move across the action, not by attaching the camera to them.

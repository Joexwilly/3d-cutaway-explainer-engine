# World rules

## Rendering law
- Every value is a pure function of `t`. No `useFrame`, no runtime physics, no `Math.random` in a render. Use `rand(seed)`.
- Everything renders through `Lighting`, `RendererSetup` and `useMats`, so all films match.
- Clone a material before setting clipping planes.
- Keep `<ThreeCanvas>` mounted. Do not wrap the scene in `Suspense`.

## Building blocks
| Need | Use |
|---|---|
| Ground and strata | `CutGround` |
| Scale reference | `ScaleFigure`, in every hero shot |
| Flat faces with stable textures | `quad` |
| Rocks | `rockGeometry(seed)` |
| Backdrop | `Backdrop` |
| Labels | `WorldLabel`: coral for faults, pale yellow for mechanisms, cream for facts |
| Captions | `Caption` |
| Interior through solid ground | `SectionPortal` with `INSIDE` material props |
| Debris | `Debris` |
| Flow through a line | `FlowPipe` |
| Indoor or abstract setting | `Studio` |
| Stand-ins for abstract things | `Crate`, `Rack`, see `topics.md` |
| Handle or brand | `Plaque`, using `handle` from `cutaway.json` |
| Cut stacked materials | Clipping plane on a cloned material |

## Motion patterns
Reuse these patterns from `examples/foundation/`: drop-in with spin, seeded arcs for debris, course-by-course stacking, swing-in about an axis, tube growth, stepped hammer strikes, and sweeping a slab across.

## Persistence
Treat the world as a growing list of finished parts. A new state may hide earlier parts only if the change is on screen. Show progress with numbers that agree, such as a meter matching a sign.

## Stills checklist
Before going to sound, confirm from the contact sheet:
- The opening shows the crude attempt already moving
- The subject stays in frame in every shot, and no detail sits under a caption
- A person is visible for scale in hero shots
- Labels are readable at phone size and not cut off
- Nothing floats, clips through a surface, or disappears unseen
- The last frame matches the opening angle and shows the whole system
- It reads clearly with the sound off

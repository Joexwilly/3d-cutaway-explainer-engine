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
| Handle or brand | Burned into a prop, see `BrandCrate` in `examples/well/`. `Plaque` only where a sign makes sense in the world |
| People, walk and work cycles | `@engine/kit/Person`, see `kit.md` |
| Dust, smoke, sparks, splash, fire | `@engine/kit/fx` |
| Grass, stones, bushes | `@engine/kit/Dressing` |
| Cut the whole world on one plane | `WorldCut` from `@engine/kit/WorldCut` |
| Cut stacked materials | Clipping plane on a cloned material |

## Motion patterns
Reuse these patterns from `examples/foundation/`: drop-in with spin, seeded arcs for debris, course-by-course stacking, swing-in about an axis, tube growth, stepped hammer strikes, and sweeping a slab across.

## Persistence
Treat the world as a growing list of finished parts. A new state may hide earlier parts only if the change is on screen. Show progress with numbers that agree, such as a meter matching a sign.

## Clarity
The viewer must follow the film with the sound off. These came from three films in a row, and each one looked clearly better than the last.

- Choose a palette where the subject separates from the ground. Pale snow on pale ice read poorly. Warm stone on green read at once.
- Give each side a fixed color. Red is always the enemy. Blue is always the builder.
- Keep each stage visible as a color change: brown pile, green hill, grey stone.
- Make strata calm. Large dark flecks read as leopard print, so keep flecks small and low in contrast.
- Show ideas as things. Stale air is green beads, cold air is blue beads, pig fat is a herd of pigs, the water table is a bright line that moves.
- Act out the jokes. Dragging the outhouse away on screen sells the line.
- Pay off the ending. Grow the grass, run the tap, get people cheering.
- Keep props that are not in the current beat off screen, or they steal attention. Show a cesspit only for its beat.
- Use effects at every impact. A collapse with no dust has no weight.

## Choosing how to cut the world
| Method | Use when | Example |
|---|---|---|
| Build only the half behind z = 0 | One subject is cut the whole film | `examples/well/` |
| `WorldCut` with a plane that moves on hard cuts | Different beats need different cuts | `examples/castle/` |
| Leave out pieces in front of the plane | Solids built from blocks | `examples/igloo/` |

Choose the plane per beat, and pick it so it misses what would confuse. The castle shows its concentric walls by cutting behind the keep, and its mine by cutting just in front of the wall.

Clipped solids are hollow. Draw a cap on the cut face, or the wall shows its inside. Caps need a darker color than the walls behind them, or they read as pillars.

Run corridors, tunnels and pipes along the cut plane, so they show in profile.

## Mistakes that cost a render
- `CircleGeometry` and `RingGeometry` with `thetaStart = PI`, rotated flat, land in front of the cut at z > 0. Use `thetaStart = 0`. `rotateX(-PI / 2)` sends y > 0 to z < 0.
- A shaft through a cut face needs a real gap. Rebuild the face strips from the current depth, as `Ground` does in `examples/well/`.
- Flames sitting on a cut plane are half hidden by the face. Flatten them on z.
- Falling pieces must stop at the floor, or they clip through the cut face.
- Anything on a far prop can sit outside a 9:16 frame. Check hero width: half-width is about `0.212 * dist`.

## Stills checklist
Before going to sound, confirm from the contact sheet:
- The opening shows the crude attempt already moving
- The subject stays in frame in every shot, and no detail sits under a caption
- A person is visible for scale in hero shots
- Labels are readable at phone size and not cut off
- Nothing floats, clips through a surface, or disappears unseen
- The last frame matches the opening angle and shows the whole system
- It reads clearly with the sound off
- People hold tools, and tools stop at the floor
- Handle is readable and not clipped in the opening and closing shots

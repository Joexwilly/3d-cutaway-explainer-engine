# Character and effects kit

Reusable pieces in `src/engine/kit/`. All of them are pure functions of `t`, so renders repeat exactly. `examples/well/` uses most of it.

## People
```tsx
import {Bucket, OUTFITS, Person, Shovel, crank, dig} from "@engine/kit/Person";

<Person p={[0, depth, -0.3]} r={0.5} pose={dig(t)} o={OUTFITS.builder} right={<Shovel />} />
```

`Person` is jointed, with a face, boots, tunic, belt and hat. Feet plant on the ground automatically, so `p` is where the feet stand. Set `air` for climbing or hanging. Set `lying` to lay it down. `h` sets height. `right` and `left` hold props, which follow the hand.

The figure faces +z at `r = 0`.

| Group | Names |
|---|---|
| Cycles, take `t` | `walk`, `run`, `dig`, `crank`, `pump`, `haul`, `climb`, `carry`, `swing`, `cheer` |
| Holds, take `t` for breathing | `kneel`, `collapse`, `drink` |
| Base | `STAND` |
| Blend | `mixPose(a, b, u)` moves between any two poses |
| Outfits | `OUTFITS.builder`, `worker`, `raider`, `villager`, or your own `Outfit` |
| Hats | `straw`, `helmet`, `hood`, `cap`, `none` |
| Hand props | `Shovel`, `Spear`, `Bucket` |

Pose angles are radians. Positive swings arms and legs forward, bends knees back and leans the spine forward. Write a new pose from `STAND` with only the joints that change.

Tips:
- Scale a tool in tight spaces: `<group scale={0.66}><Shovel /></group>`. A long tool pokes through the floor.
- Check hand positions on stills. Hands do not reach for handles by themselves.
- Keep one builder in one outfit for the whole film. "You" is that person.

## Effects
```tsx
import {Dust, Fire, Smoke, Sparks, Splash} from "@engine/kit/fx";
```

| Effect | Use | Key props |
|---|---|---|
| `Dust` | Landings, digging, collapses | `t`, `at`, `o`, `size`, `spread`, `color` |
| `Smoke` | Chimneys, fires | `t`, `o`, `h`, `wind`, `from`, `to` |
| `Sparks` | Metal hits | `t`, `at`, `o`, `n`, `power` |
| `Splash` | Anything hitting water | `t`, `at`, `o`, `n`, `power`, `ring` |
| `Fire` | Layered fire with embers and light | `t`, `o`, `size`, `light` |

Use a `seed` when the same effect fires twice nearby. For repeated bursts, derive `at` from the beat, such as `Math.floor(t * 2.5) / 2.5`.

## Ground detail
```tsx
import {Bush, Stones, Tufts} from "@engine/kit/Dressing";

<Tufts n={700} area={[-16, 16, -16, -0.2]} keep={(s) => Math.hypot(s.x, s.z) > 2.5} />
```

`Tufts` is instanced, so thousands stay cheap. Use `keep` to leave the build site clear, and pass `y` on uneven ground. Keep tufts small: a 0.17 blade reads as grass, a 0.3 blade reads as a spike. Change tuft color over time to show a place coming alive.

## Cutting the world
```tsx
<WorldCut z={cutZ(t)} />
```

Hides everything in front of `z`. Keep labels behind the plane. See `world.md` for when to use it.

## Labels
Keep shots and labels in `plan.ts`, with each label on one line.

```bash
cutaway labels <slug>        # report
cutaway labels <slug> --fix  # move labels into the safe area
```

Size labels at `height` 0.2 to 1, larger for far shots. The fix moves a label down first, then sideways, so write labels high and let it place them.

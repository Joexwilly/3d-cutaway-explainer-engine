# Story rules

Measured from 15 reels (64 to 79 seconds, 223 to 262 wpm). `cutaway lint` enforces the items marked with a check.

## Structure
| Beat | Rule | Measured |
|---|---|---|
| Title ✓ | `How a [humble thing] Becomes a [finished thing]` | 15 of 15 |
| Opening ✓ | `If you [crude act], you have a [finished thing].` | Lands in the first 5s |
| First failure ✓ | First `But` by 8s | 2.8 to 7.0s |
| The chain ✓ | `But [failure]` then `So [fix]`, one failure every 6 to 11s | Median gap 8.9s, 4 to 8 Buts |
| Vocabulary ✓ | `This is a [term].` with a matching world label | Present in the strongest reels |
| Surprise | A fact that explains the viewer's own world, or a named bit of history | Example shape: "that is why your city asks..." |
| The list ✓ | `Add A, B, and C.` as the second-last line | 14 of 15 |
| The close ✓ | `Congratulations, you have built a [noun].` | Noun matches the title |

## Why my first attempt failed
It opened with a finished house and ended on "foundation". The opening joke only works when the crude act is called the final thing. "If you dump rocks on the mud and stack a wall on them, you have a foundation" is funny and sets the promise. "You have a building" sets a different promise, so the ending feels unearned.

## Writing the chain
- Each failure must be caused by the previous fix, or by a physical or human truth. Good failures: weather, rot, wear, thieves, impatient people, fire, physics.
- Keep "you" constant. The viewer is the builder. Comments repeat the running joke "I've done it again".
- Prefer concrete numbers and named things to adjectives.
- Sentences are often long run-ons joined by `so` and `but`. Do not pause between clauses.
- Add stakes in line one when the topic allows it. The top reel opened "lost in the woods with winter coming".
- Pick things people see daily, or survival fantasies. Any lane works: see `topics.md`.
- Be accurate. Viewers correct mistakes, and "you forgot the floor" style comments are common.

## Timing from words
`W("word", n)` picks the nth time a word is spoken, counting from 0, in any case. Short words repeat, so print the word list first. These cost real bugs: `W("hang")` caught "hang a heavy gate" 30 seconds early, and `W("in")` moved a cut by 11 seconds. `sfx.json` uses `word#1` for the same reason.

## Lint details
Any "but" counts as a But, so "not a lake but sand" raises the count and asks for another So. Reword it.

Buts must reach `seconds / 11`, and pace must stay inside 215 to 270 wpm. Adjust `seconds` first. A short script voiced to a long film sounds slow, so add a fact instead of stretching it.

## Fact rules
- Search every claim. Search again for anything the first search missed.
- If a number will not verify, change the wording. "Killed hundreds" survived where an exact toll did not.
- Tell the user which claims rest on weak sources.
- Compressing history into one builder is the format. Note it, and do not claim one change had one cause.

## Short versions
The reference never goes under 64 seconds. For a short cut, keep every beat and compress: under 30 seconds use 3 Buts, skip the vocabulary beat, keep `Add` and the close.

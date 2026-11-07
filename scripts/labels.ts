// Label check. Run through: cutaway labels <slug> [--fix]
import fs from "node:fs";
import {LABELS, shots} from "@plan";
import {fitLabel, labelBounds, labelSafe} from "@engine/labelLint";

const seconds = Number(process.env.CUTAWAY_SECONDS), planFile = process.env.CUTAWAY_PLAN!, fix = process.argv.includes("--fix");
let bad = 0, src = fs.readFileSync(planFile, "utf8");
for (const l of LABELS) {
  let b = labelBounds(l, shots, seconds);
  if (fix && !labelSafe(b)) {
    const [x, y] = fitLabel(l, shots, seconds), name = l.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(text: "${name}"[^\\n]*?position: \\[)[^,]+, [^,]+,`);
    if (!re.test(src)) throw new Error(`Cannot find label "${l.text}" in plan.ts. Keep each label on one line.`);
    src = src.replace(re, `$1${x}, ${y},`);
    b = labelBounds(l, shots, seconds, x, y);
  }
  const ok = labelSafe(b); if (!ok) bad++;
  console.log(`${ok ? "ok  " : "BAD "} ${l.text.padEnd(20)} top ${b.top.toFixed(2)}  bottom ${b.bottom.toFixed(2)}  left ${b.left.toFixed(2)}  right ${b.right.toFixed(2)}`);
}
if (fix) fs.writeFileSync(planFile, src);
console.log(bad ? `${bad} labels out of bounds` : "ALL LABELS SAFE");
process.exit(bad ? 1 : 0);

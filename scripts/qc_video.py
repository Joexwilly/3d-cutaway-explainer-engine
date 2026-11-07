#!/usr/bin/env python3
"""Automatic gate on a finished render. Usage: scripts/qc_video.py <slug>. Writes out/<slug>.qc.json. Exit 1 on failure."""
import cv2, json, re, subprocess, sys
import numpy as np
slug = sys.argv[1]; path = f"output/{slug}.mp4"
story = json.load(open(f"stories/{slug}/data/story.json")); target = float(story["seconds"])
v = cv2.VideoCapture(path); fps = v.get(cv2.CAP_PROP_FPS); W, H = int(v.get(3)), int(v.get(4)); G = []
while True:
    ok, f = v.read()
    if not ok: break
    G.append(cv2.cvtColor(cv2.resize(f, (180, 320), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY))
g = np.array(G); dur = len(g) / fps
m = np.ones(g[0].shape, bool); m[150:185] = False
d = np.array([np.abs(g[i].astype(float) - g[i - 1])[m].mean() for i in range(1, len(g))])
cuts = [int(i) + 1 for i in np.where(d > max(25, np.median(d) * 12))[0]]
cuts = [c for k, c in enumerate(cuts) if k == 0 or c - cuts[k - 1] > 3]
fl = np.zeros(len(d))
for i in range(len(d)):
    if d[i] > .2 and (i + 1) not in cuts:
        F = cv2.calcOpticalFlowFarneback(g[i], g[i + 1], None, .5, 3, 21, 3, 5, 1.1, 0)
        fl[i] = np.hypot(np.median(F[..., 0][m]), np.median(F[..., 1][m]))
on = fl > .35; moves = []; i = 0
while i < len(on):
    if on[i]:
        j = i
        while j + 1 < len(on) and (on[j + 1] or (j + 3 < len(on) and on[j + 3])) and (j + 1) not in cuts: j += 1
        # A sine move starts and ends gently, so extend the run to 8% of its own peak speed.
        pk = fl[i:j + 1].max(); a2, b2 = i, j
        while a2 > 0 and fl[a2 - 1] > max(.05, pk * .08) and a2 not in cuts: a2 -= 1
        while b2 + 1 < len(fl) and fl[b2 + 1] > max(.05, pk * .08) and (b2 + 1) not in cuts: b2 += 1
        if b2 - a2 >= 12: moves.append(b2 - a2 + 1)
        i = j + 1
    else: i += 1
sh = np.diff([0] + [c / fps for c in cuts] + [dur])
blank = [i for i in range(len(g)) if g[i].mean() < 8 or g[i].std() < 4]
meter = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", meter)[-1]); peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", meter)[-1])
R = []
def check(name, ok, val, want): R.append(dict(check=name, ok=bool(ok), value=val, want=want))
check("resolution", (W, H) == (1080, 1920), f"{W}x{H}", "1080x1920")
check("fps", round(fps) == 30, fps, "30")
check("duration", abs(dur - target) <= .25, round(dur, 2), f"{target}s +/-0.25")
words = json.load(open(f"stories/{slug}/data/words.json"))
last = words[-1]["e"]
check("voice fits the film", last <= dur - .1, round(last, 2), f"last word ends before {dur - .1:.2f}s")
vo = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"audio/{slug}/vo.wav"], capture_output=True, text=True).stdout)
check("voice not cut off", vo <= dur + .05, round(vo, 2), f"<= {dur:.2f}s")
check("no blank frames", not blank, len(blank), "0")
check("cuts per minute", 60 * len(cuts) / dur >= 8, round(60 * len(cuts) / dur, 1), ">=8 (reference median 13)")
check("longest shot", sh.max() <= 11.5, round(float(sh.max()), 1), "<=11.5s")
check("loudness", -18.5 <= lufs <= -15, lufs, "-18.5 to -15 LUFS")
check("true peak", peak <= -1, peak, "<=-1 dBFS")
if moves: check("camera moves in range", np.mean([28 <= f <= 46 for f in moves]) >= .6, moves, "most 28-46 frames")
fails = [r for r in R if not r["ok"]]
json.dump(dict(cuts=[round(c / fps, 2) for c in cuts], checks=R), open(f"output/{slug}.qc.json", "w"), indent=1)
for r in R: print(("PASS " if r["ok"] else "FAIL "), r["check"], r["value"], "want", r["want"])
print("VIDEO QC", "FAILED" if fails else "PASSED")
sys.exit(1 if fails else 0)

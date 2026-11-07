#!/usr/bin/env python3
"""Synthesizes a story's sound layer from data/sfx.json. All sounds are original. Usage: scripts/gen_sfx.py <slug>

Measured targets (references/sound.md): about 126 events a minute, 86% small and above 1.5 kHz, no music,
layer RMS 19 dB under the voice. Big hits are rare: they only work because the patter is small.
"""
import json, sys
import numpy as np, scipy.io.wavfile as wf, scipy.signal as sg
slug = sys.argv[1]; SR = 44100
story = json.load(open(f"stories/{slug}/data/story.json")); spec = json.load(open(f"stories/{slug}/data/sfx.json"))
words = json.load(open(f"stories/{slug}/data/words.json"))
rng = np.random.default_rng(spec.get("seed", 7)); out = np.zeros(int(float(story["seconds"]) * SR)); count = [0, 0]

def env(n, a, d):
    t = np.arange(n) / SR; return (1 - np.exp(-t / a)) * np.exp(-t / d)
def band(x, lo, hi): return sg.sosfilt(sg.butter(3, [lo, hi], "bp", fs=SR, output="sos"), x)
def tick(f=4200, dur=.03):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t / .006) + .6 * band(rng.normal(size=n), 2500, 10000) * np.exp(-t / .004)
def click(dur=.022):
    n = int(dur * SR); return band(rng.normal(size=n), 3500, 12000) * np.exp(-np.arange(n) / SR / .004)
def blip(f=1300, dur=.09):
    n = int(dur * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t + .5 * np.sin(2 * np.pi * f * 2 * t)) * env(n, .002, .03)
def ding(f=1314, dur=.38):
    n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2 * t)) * env(n, .0012, .11)
def wobble(f=2600, dur=.8, rate=7, depth=.16):
    n = int(dur * SR); t = np.arange(n) / SR; ph = 2 * np.pi * np.cumsum(f * (1 + depth * np.sin(2 * np.pi * rate * t))) / SR
    return np.sin(ph) * np.minimum(1, np.minimum(t / .03, (dur - t) / .08))
def swell(dur=.45, lo=1800, hi=7000):
    n = int(dur * SR); return band(rng.normal(size=n), lo, hi) * np.sin(np.pi * np.arange(n) / n) ** 1.5
def thump(f0=82, f1=44, dur=.31, top=.3):
    n = int(dur * SR); t = np.arange(n) / SR; ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t / .05)) / SR
    return np.sin(ph) * env(n, .002, .09) + top * band(rng.normal(size=n), 400, 2600) * env(n, .0008, .018)
def clank(f=740, dur=.22):
    n = int(dur * SR); t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for a, r, d in [(1, 1, .05), (.6, 2.76, .03), (.35, 5.4, .015)]) + .25 * band(rng.normal(size=n), 2000, 7000) * np.exp(-t / .008)
def pour(dur=1, lo=500, hi=3200):
    n = int(dur * SR); x = band(rng.normal(size=n), lo, hi); t = np.arange(n) / SR
    g = np.convolve(rng.random(n) ** 24, np.ones(900) / 900, "same"); g = .45 + g / g.max()
    return x * g * np.minimum(1, np.minimum(t / .1, (dur - t) / .25))
def creak(dur=.7):
    n = int(dur * SR); t = np.arange(n) / SR; f = 95 + 18 * np.sin(2 * np.pi * 3.1 * t)
    return band(sg.sawtooth(2 * np.pi * np.cumsum(f) / SR), 180, 1500) * np.sin(np.pi * t / dur) ** 1.5
def snap(dur=.3):
    n = int(dur * SR); return band(rng.normal(size=n), 700, 8000) * np.exp(-np.arange(n) / SR / .05)
LIB = dict(tick=tick, click=click, blip=blip, ding=ding, wobble=wobble, swell=swell, thump=thump, clank=clank, pour=pour, creak=creak, snap=snap)

def when(x):
    """A number of seconds, or a spoken word: "rock" or "but#1" for the second But."""
    if isinstance(x, (int, float)): return float(x)
    w, _, k = x.partition("#"); hits = [q["s"] for q in words if q["w"].lower() == w.lower()]
    if not hits: raise SystemExit(f"sfx.json: word not found: {x}")
    return hits[int(k or 0)]
def put(s, t, gain):
    i = int(t * SR); n = min(len(s), len(out) - i)
    if 0 <= i and n > 0: out[i:i + n] += s[:n] * 10 ** (gain / 20)
    count[0] += 1

for e in spec["events"]:
    if e["s"] == "patter":
        a, b = when(e["from"]) + e.get("off", 0), when(e["to"]) + e.get("off_to", 0); kinds = e.get("kinds", ["tick", "click"]); pitches = e.get("pitch", [2600, 6500])
        for t in np.sort(rng.uniform(a, b, int((b - a) * e.get("rate", 4) * spec.get("density", 1)))):
            k = kinds[rng.integers(len(kinds))]
            put(click() if k == "click" else LIB[k](rng.uniform(*pitches)), t, e.get("gain", -30) + rng.uniform(-3, 3))
        continue
    args = dict(e.get("args", {}))
    if "until" in e: args["dur"] = max(.05, when(e["until"]) + e.get("off_to", 0) - when(e["at"]) - e.get("off", 0))
    n = e.get("repeat", 1); gap = e.get("gap", 0)
    for i in range(n): put(LIB[e["s"]](**args), when(e["at"]) + e.get("off", 0) + i * gap, e.get("gain", -24))
    count[1] += e["s"] in ("thump",) and n

v = wf.read(f"audio/{slug}/vo.wav")[1].astype(float) / 32768
rms = lambda x: np.sqrt((x ** 2).mean())
gain = rms(v) * 10 ** (-19 / 20) / rms(out)
out = out * gain
peak = np.abs(out).max()
if peak > .7: out = np.tanh(out / .7) * .7   # keep hits from fighting the voice
wf.write(f"audio/{slug}/sfx.wav", SR, (np.stack([out, out], 1) * 32767).astype(np.int16))
per_min = 60 * count[0] / float(story["seconds"])
print(f"{count[0]} events, {per_min:.0f}/min (target about 126), {count[1]} big hits, layer {20*np.log10(rms(out)/rms(v)):.1f} dB vs voice (target -19)")
if per_min < 80: print("WARN too sparse: add patter on every moving piece")
if per_min > 190: print("WARN too dense: lower density in sfx.json")

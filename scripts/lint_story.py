#!/usr/bin/env python3
"""Fails a script that breaks the format. Rules come from 15 measured reference reels: see references/story.md."""
import json, re, sys
slug = sys.argv[1]
s = json.load(open(f"stories/{slug}/data/story.json"))
if s.get("private_study"):
    print("private study: story lint skipped"); sys.exit(0)
text, noun, title, sec = s["script"].strip(), s["noun"].lower(), s["title"], float(s["seconds"])
words = re.findall(r"[a-z0-9'%-]+", text.lower()); n = len(words)
sents = re.split(r"(?<=[.!?])\s+", text)
E, W = [], []
if not re.match(r"^How (an? |the |your |\w+ )?.+ Becomes? (an? |the |your )?.+", title): E.append("Title must read: How a [humble thing] Becomes a [finished thing].")
if noun not in title.lower(): E.append("Title must end on the story noun.")
if not re.match(r"if you", text.lower()): E.append('Line one must start with "If you".')
m = re.search(r"you have an? ([^,.]+)", sents[0].lower())
if not m: E.append('Line one must say "you have a [noun]".')
elif noun not in m.group(1): E.append(f'Line one must name the final object ("{noun}"), not "{m.group(1)}". The crude version IS the finished thing, as a joke.')
if m and len(sents[0].lower()[:m.end()].split()) > 28: E.append("The crude version must land within 28 words.")
if not re.fullmatch(rf"congratulations[,!.]? you have built an? {re.escape(noun)}[.!]?", sents[-1].lower().strip()): E.append(f'Last line must be exactly: Congratulations, you have built a {noun}.')
if len(sents) < 2 or not sents[-2].lower().startswith("add "): E.append('Second-last line must be a quick list starting with "Add".')
buts = words.count("but"); first = words.index("but") if "but" in words else n
wpm = 60 * n / sec
if buts < max(2, sec / 11): E.append(f"{buts} Buts is too few: need one every 11s at most (reference median gap 8.9s).")
if words.count("so") < buts: W.append('Fewer Sos than Buts: each failure should get a fix.')
if first / wpm * 60 > 8: E.append("First But must land by 8s (reference range 2.8 to 7.0s).")
if not 215 <= wpm <= 270: E.append(f"{wpm:.0f} wpm is outside 215 to 270. Change the script or the length.")
if (words.count("you") + words.count("your")) / n < 0.02: W.append('Too little "you": the viewer is the builder.')
if sec >= 30 and not re.search(r"\bthis is an? ", text.lower()): E.append('Films over 30s need a "This is a [term]" beat, with a world label.')
if sec >= 45 and not re.search(r"that is why|that's why|was called|in \d{4}|the first", text.lower()): W.append("No surprise aside found. Add a why-your-world-looks-this-way line or a named piece of history.")
try:
    last = json.load(open(f"stories/{slug}/data/words.json"))[-1]["e"]
    if last > sec - .1: E.append(f"Voice ends at {last:.2f}s, past the {sec}s film. Rerun cutaway voice or raise seconds.")
except FileNotFoundError: pass
print(f"{n} words, {wpm:.0f} wpm, {buts} Buts, {words.count('so')} Sos")
for x in W: print("WARN ", x)
for x in E: print("FAIL ", x)
print("STORY LINT", "FAILED" if E else "PASSED")
sys.exit(1 if E else 0)

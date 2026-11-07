#!/usr/bin/env python3
"""Word timings for a story. Whisper gives the times; the script gives the spelling, so captions never show a mishearing."""
import difflib, json, re, subprocess, sys, tempfile, os
slug = sys.argv[1]
wav = f"audio/{slug}/vo.wav"
story = json.load(open(f"stories/{slug}/data/story.json"))
tmp = tempfile.mkdtemp()
subprocess.run([sys.executable, "-m", "whisper", wav, "--model", "base", "--language", "en", "--word_timestamps", "True", "--output_format", "json", "--output_dir", tmp], check=True, capture_output=True)
d = json.load(open(os.path.join(tmp, "vo.json")))
heard = [w for s in d["segments"] for w in s["words"]]
clean = lambda x: re.sub(r"[^\w'%-]", "", x).strip()
said = [clean(w) for w in story["script"].split()]
said = [w for w in said if w]
got = [clean(w["word"]) for w in heard]
out = [{"w": g, "s": round(h["start"], 3), "e": round(h["end"], 3)} for g, h in zip(got, heard)]
sm = difflib.SequenceMatcher(a=[x.lower() for x in got], b=[x.lower() for x in said], autojunk=False)
fixed = 0
for op, a0, a1, b0, b1 in sm.get_opcodes():
    if op == "replace" and a1 - a0 == b1 - b0:
        for k in range(a1 - a0):
            out[a0 + k]["w"] = said[b0 + k]; fixed += 1
json.dump(out, open(f"stories/{slug}/data/words.json", "w"))
print(f"{len(out)} words, {fixed} corrected from script, ends {out[-1]['e']:.2f}s")

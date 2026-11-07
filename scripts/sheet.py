import sys
from PIL import Image
fr = sys.argv[1].split(); cols = int(sys.argv[2]); d = sys.argv[3]; out = sys.argv[4]; w = 300
im = [Image.open(f"{d}/f{f}.jpg") for f in fr]; h = int(w * 16 / 9); rows = (len(im) + cols - 1) // cols
S = Image.new("RGB", (cols * w + (cols - 1) * 4, rows * h + (rows - 1) * 4), "black")
for i, m in enumerate(im): S.paste(m.resize((w, h)), ((i % cols) * (w + 4), (i // cols) * (h + 4)))
S.save(out, quality=88)

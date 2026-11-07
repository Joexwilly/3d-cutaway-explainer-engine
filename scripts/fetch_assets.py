#!/usr/bin/env python3
"""Downloads CC0 textures, sky and tree from Poly Haven into the shared runtime. Safe to re-run."""
import json, os, sys, urllib.request as u
ROOT = sys.argv[1]
H = {"User-Agent": "3d-cutaway-explainer-setup"}
get = lambda p: json.load(u.urlopen(u.Request("https://api.polyhaven.com" + p, headers=H), timeout=60))
def dl(url, to):
    if os.path.exists(to): return
    os.makedirs(os.path.dirname(to), exist_ok=True)
    open(to, "wb").write(u.urlopen(u.Request(url, headers=H), timeout=180).read()); print("got", to)
TEX = {"excavated_soil_wall": ("2k", "excavated_soil_wall"), "gravel_floor_02": ("2k", "gravel_floor_02"), "concrete_floor_02": ("1k", "concrete_floor_02"), "leafy_grass": ("1k", "leafy_grass"), "clay_roof_tiles": ("1k", "clay_roof_tiles"), "brown_planks_03": ("1k", "brown_planks_03"), "red_brick_03": ("1k", "brick")}
for src, (res, name) in TEX.items():
    f = get(f"/files/{src}")
    for k, n in [("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")]:
        dl(f[k][res]["jpg"]["url"], f"{ROOT}/tex/{name}_{n}.jpg")
dl(get("/files/kloofendal_overcast_puresky")["hdri"]["2k"]["hdr"]["url"], f"{ROOT}/hdri/sky.hdr")
t = get("/files/island_tree_02")["gltf"]["1k"]["gltf"]
dl(t["url"], f"{ROOT}/models/tree/island_tree_02_1k.gltf")
for p, v in t["include"].items(): dl(v["url"], f"{ROOT}/models/tree/" + p)
print("assets ready")

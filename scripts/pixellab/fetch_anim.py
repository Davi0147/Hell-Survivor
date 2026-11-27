"""fetch_anim.py <character_id> <out_dir>: downloads every animation frame + builds previews."""
import json, os, sys, urllib.request
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import px

cid, out = sys.argv[1], sys.argv[2]
info = px.call("GET", f"/characters/{cid}")
json.dump(info, open(os.path.join(out, "character.json"), "w"), indent=1)
for grp in info.get("animations") or []:
    name = grp.get("animation_name") or grp.get("animation_type") or grp.get("animation_group_id")
    name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)[:40]
    for d in grp.get("directions") or []:
        ddir = os.path.join(out, "animations", name, d["direction"])
        os.makedirs(ddir, exist_ok=True)
        frames = []
        for i, url in enumerate(d.get("frames") or []):
            p = os.path.join(ddir, f"frame_{i:03d}.png")
            if not os.path.exists(p):
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    open(p, "wb").write(r.read())
            frames.append(Image.open(p).convert("RGBA"))
        if not frames:
            continue
        w, h = frames[0].size
        strip = Image.new("RGBA", (w * len(frames), h), (40, 40, 48, 255))
        for i, f in enumerate(frames):
            strip.paste(f, (i * w, 0), f)
        strip.resize((strip.width * 2, h * 2), Image.NEAREST).save(os.path.join(out, f"preview_{name}_{d['direction']}.png"))
        bg = [Image.alpha_composite(Image.new("RGBA", f.size, (40, 40, 48, 255)), f).resize((w * 3, h * 3), Image.NEAREST) for f in frames]
        bg[0].save(os.path.join(out, f"preview_{name}_{d['direction']}.gif"), save_all=True, append_images=bg[1:], duration=120, loop=0)
        print(name, d["direction"], len(frames), "frames", w, h)

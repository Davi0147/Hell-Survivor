"""Monta a folha de sprites da Shylph (Chefe do Capitulo 3) a partir dos quadros limpos.

Entrada:  art-source/referencias/Chefe Cap3/frames_limpos/
            rotations/<dir>.png               (8 direcoes, 132x132)
            animations/<Anim>/<dir>/frame_NNN.png
          art-source/referencias/Chefe Cap3/pena_bruta.png
Saida:    public/assets/sprites/enemies/Shylph/shylph-sheet.png  (grade de 132x132)
          public/assets/sprites/enemies/Shylph/shylph-feather.png
          src/config/shylphSheet.ts  (indice do primeiro quadro e quantidade por animacao)

O lado oeste nao e guardado: o jogo espelha o leste (setFlipX), o que poupa memoria de video.
Uso: python scripts/pack-shylph.py
"""
import os
from collections import deque
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-source", "referencias", "Chefe Cap3")
FRAMES = os.path.join(SRC, "frames_limpos")
OUT_DIR = os.path.join(ROOT, "public", "assets", "sprites", "enemies", "Shylph")
TS_OUT = os.path.join(ROOT, "src", "config", "shylphSheet.ts")
FRAME = 132
COLS = 12

# Chave usada no jogo -> pasta de origem. A ordem define a posicao na folha.
ANIMS = [
    ("walk", "Walk", ["south", "east", "north"]),
    ("lick", "IdleLick", ["east"]),
    ("throw", "Throw", ["south", "east"]),
    ("flap", "WingFlap", ["south", "east"]),
    ("kneel", "Kneel", ["south"]),
]
ROTATIONS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]


def largest_island(im):
    """Mantem so a maior ilha de pixels opacos (tira riscos e manchas soltas)."""
    px = im.load()
    w, h = im.size
    seen, best = set(), []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and (x, y) not in seen:
                comp, q = [], deque([(x, y)])
                seen.add((x, y))
                while q:
                    cx, cy = q.popleft()
                    comp.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3]:
                            seen.add((nx, ny))
                            q.append((nx, ny))
                if len(comp) > len(best):
                    best = comp
    keep = set(best)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and (x, y) not in keep:
                px[x, y] = (0, 0, 0, 0)
    return im


def main():
    frames, index = [], {}
    for d in ROTATIONS:
        index[f"rot-{d}"] = (len(frames), 1)
        frames.append(os.path.join(FRAMES, "rotations", f"{d}.png"))
    for key, folder, dirs in ANIMS:
        for d in dirs:
            path = os.path.join(FRAMES, "animations", folder, d)
            files = sorted(f for f in os.listdir(path) if f.endswith(".png"))
            index[f"{key}-{d}"] = (len(frames), len(files))
            frames += [os.path.join(path, f) for f in files]

    rows = (len(frames) + COLS - 1) // COLS
    sheet = Image.new("RGBA", (COLS * FRAME, rows * FRAME), (0, 0, 0, 0))
    for i, p in enumerate(frames):
        im = Image.open(p).convert("RGBA")
        assert im.size == (FRAME, FRAME), f"{p} tem {im.size}"
        sheet.paste(im, ((i % COLS) * FRAME, (i // COLS) * FRAME))
    os.makedirs(OUT_DIR, exist_ok=True)
    sheet.save(os.path.join(OUT_DIR, "shylph-sheet.png"), optimize=True)

    feather = largest_island(Image.open(os.path.join(SRC, "pena_bruta.png")).convert("RGBA"))
    feather.crop(feather.getbbox()).save(os.path.join(OUT_DIR, "shylph-feather.png"))

    lines = [
        "// Gerado por scripts/pack-shylph.py. Nao edite a mao: rode o script de novo.",
        "/** Folha de sprites da Shylph: primeiro quadro e quantidade de cada animacao. */",
        f"export const SHYLPH_FRAME_SIZE = {FRAME};",
        "",
        "export const SHYLPH_SHEET = {",
    ]
    for k, (start, count) in index.items():
        lines.append(f"  '{k}': {{ start: {start}, count: {count} }},")
    lines += ["} as const;", "", "export type ShylphSheetKey = keyof typeof SHYLPH_SHEET;", ""]
    with open(TS_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    print(f"{len(frames)} quadros, folha {sheet.size}")


if __name__ == "__main__":
    main()

"""Recorta os kits de cenario dos Capitulos 2 e 3 (docs/ART_PROMPTS.md secao 28).

Entrada (art-source/novos/cenario/):
  floor-chN.jpg   piso emendavel (2000x2000)
  chN-props.jpg   16 objetos em grade 4x4, fundo magenta
  chN-decals.jpg  16 manchas/entulho em grade 4x4, fundo magenta
  chN-altar.jpg   altar de invocacao: apagado | aceso
Saida:
  public/assets/textures/floor-chN.png                 (512x512, desenhado com escala 0.5)
  public/assets/sprites/scenery/chN/<chave>.png        (densidade 2x, desenhado com escala 0.5)

O gerador nao respeita a escala pedida, entao cada peca e reduzida para o tamanho que o
prompt pediu, em "alturas de personagem" (1 CH = 56 px de tela = 112 px de textura). Assim
tudo fica proporcional a heroina e ao kit do Capitulo 1.
Uso: python scripts/cut-chapter-kits.py
"""
import os
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-source", "novos", "cenario")
OUT_SPRITES = os.path.join(ROOT, "public", "assets", "sprites", "scenery")
OUT_TEXTURES = os.path.join(ROOT, "public", "assets", "textures")
CH_PX = 112  # 1 altura de personagem em pixels de textura (densidade 2x)
FLOOR_SIZE = 512
ALTAR_WIDTH = 340

# Celula da grade 4x4 -> (chave, medida, tamanho em CH). Medida: 'h' altura ou 'w' largura.
KITS = {
    2: {
        "props": [
            ("ch2-column", "h", 2.2), ("ch2-statue", "h", 2.4), ("ch2-wing", "w", 1.9), ("ch2-crystal", "h", 1.8),
            ("ch2-block-large", "w", 1.4), ("ch2-blocks-medium", "w", 1.1), ("ch2-chunks-small", "w", 0.8), ("ch2-rubble-halo", "w", 1.2),
            ("ch2-brazier", "h", 1.5), ("ch2-candelabra", "h", 1.3), ("ch2-candles", "w", 0.7), ("ch2-lantern", "h", 1.4),
            ("ch2-halo", "w", 1.0), ("ch2-feathers", "w", 0.9), ("ch2-glass", "w", 1.4), ("ch2-pew", "w", 1.4),
        ],
        "decals": [
            ("ch2-decal-cracks", "w", 2.0), ("ch2-decal-scorch", "w", 1.6), ("ch2-decal-sigil", "w", 2.4), ("ch2-decal-void", "w", 1.8),
            ("ch2-decal-feathers", "w", 1.0), ("ch2-decal-puddle", "w", 1.1), ("ch2-decal-glass", "w", 0.8), ("ch2-decal-ash", "w", 0.9),
            ("ch2-clutter-head", "w", 0.45), ("ch2-clutter-chain", "w", 0.7), ("ch2-clutter-sword", "w", 0.9), ("ch2-clutter-book", "w", 0.45),
            ("ch2-clutter-candle", "h", 0.3), ("ch2-clutter-skull", "w", 0.28), ("ch2-clutter-crystal", "h", 0.35), ("ch2-clutter-web", "w", 0.8),
        ],
    },
    3: {
        "props": [
            ("ch3-fire-post", "h", 2.0), ("ch3-statue", "h", 2.2), ("ch3-lava-pillar", "h", 2.4), ("ch3-font", "w", 1.0),
            ("ch3-block-large", "w", 1.4), ("ch3-blocks-medium", "w", 1.1), ("ch3-chunks-small", "w", 0.8), ("ch3-stairs", "w", 1.4),
            ("ch3-fire-bowl", "w", 0.8), ("ch3-candle-stand", "h", 1.4), ("ch3-candles", "w", 0.7), ("ch3-halo-statue", "h", 1.6),
            ("ch3-bandages", "w", 0.9), ("ch3-cage", "h", 1.3), ("ch3-lectern", "h", 1.1), ("ch3-tablet", "h", 1.5),
        ],
        "decals": [
            ("ch3-decal-cracks", "w", 2.0), ("ch3-decal-blood", "w", 1.6), ("ch3-decal-sigil", "w", 2.4), ("ch3-decal-lava", "w", 1.6),
            ("ch3-decal-feathers", "w", 1.0), ("ch3-decal-wax", "w", 0.8), ("ch3-decal-footprints", "h", 1.2), ("ch3-decal-scorch", "w", 1.2),
            ("ch3-clutter-blindfold", "w", 0.6), ("ch3-clutter-halo", "w", 0.45), ("ch3-clutter-chain", "w", 0.7), ("ch3-clutter-hand", "w", 0.4),
            ("ch3-clutter-skull", "w", 0.35), ("ch3-clutter-bowl", "w", 0.35), ("ch3-clutter-eye", "w", 0.3), ("ch3-clutter-embers", "w", 0.35),
        ],
    },
}


def key_magenta(path):
    """(rgb, mascara da arte). Fundo = magenta forte; borda rosada do JPG perde o magenta."""
    im = np.array(Image.open(path).convert("RGB")).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    bg = (r > 190) & (b > 190) & (g < 90) & (np.abs(r - b) < 60)
    solid = ~bg
    # Franja: pixel que puxa para magenta (r e b bem acima de g) vira mais escuro e neutro
    fringe = solid & (np.minimum(r, b) - g > 90) & (np.abs(r - b) < 50)
    im[fringe] = (im[fringe] * 0.45).astype(int)
    return im, solid


def components(solid, min_size=40):
    """Ilhas de pixels (4-vizinhos) com tamanho e caixa; descarta ruido pequeno."""
    H, W = solid.shape
    label = np.zeros((H, W), dtype=np.int32)
    out = []
    for y0, x0 in zip(*np.nonzero(solid)):
        if label[y0, x0]:
            continue
        n = len(out) + 1
        label[y0, x0] = n
        q = deque([(y0, x0)])
        xs, ys, count = [x0, x0], [y0, y0], 0
        sx = sy = 0
        while q:
            y, x = q.popleft()
            count += 1
            sx += x
            sy += y
            xs[0], xs[1] = min(xs[0], x), max(xs[1], x)
            ys[0], ys[1] = min(ys[0], y), max(ys[1], y)
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and solid[yy, xx] and not label[yy, xx]:
                    label[yy, xx] = n
                    q.append((yy, xx))
        out.append({"id": n, "size": count, "cx": sx / count, "cy": sy / count, "box": (xs[0], ys[0], xs[1] + 1, ys[1] + 1)})
    return label, [c for c in out if c["size"] >= min_size]


def remove_bright_specks(img, threshold=105, radius=4):
    """Apaga detalhes claros soltos do piso (as penas do piso do Cap. 3 se repetiam em todo
    ladrilho e viravam um padrao de pontinhos). Cada pixel claro vira a media dos vizinhos escuros."""
    a = np.array(img).astype(float)
    lum = a.mean(axis=2)
    bright = lum > threshold
    # Engorda a mascara para pegar a borda avermelhada da pena
    grow = bright.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            grow |= np.roll(np.roll(bright, dy, 0), dx, 1)
    out = a.copy()
    H, W = lum.shape
    for y, x in zip(*np.nonzero(grow)):
        ys = [(y + k) % H for k in range(-radius, radius + 1)]
        xs = [(x + k) % W for k in range(-radius, radius + 1)]
        win = a[np.ix_(ys, xs)].reshape(-1, 3)
        keep = ~grow[np.ix_(ys, xs)].reshape(-1)
        if keep.any():
            out[y, x] = win[keep].mean(axis=0)
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGB")


def resize_piece(img, measure, ch):
    w, h = img.size
    target = ch * CH_PX
    s = target / (h if measure == "h" else w)
    size = (max(1, round(w * s)), max(1, round(h * s)))
    # Reduz com a cor pre-multiplicada (sem halo escuro/rosa) e endurece a transparencia
    small = img.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")
    a = small.getchannel("A").point(lambda v: 255 if v >= 110 else 0)
    small.putalpha(a)
    return small


def cut_sheet(path, pieces, out_dir):
    im, solid = key_magenta(path)
    label, comps = components(solid)
    H, W = solid.shape
    cw, ch = W / 4, H / 4
    cells = {i: [] for i in range(16)}
    for c in comps:
        col = min(3, int(c["cx"] // cw))
        row = min(3, int(c["cy"] // ch))
        cells[row * 4 + col].append(c)
    rgba = np.dstack([im.clip(0, 255), np.where(solid, 255, 0)]).astype(np.uint8)
    for i, (key, measure, size) in enumerate(pieces):
        group = cells[i]
        if not group:
            print("  !! celula vazia:", key)
            continue
        ids = [c["id"] for c in group]
        x0 = min(c["box"][0] for c in group)
        y0 = min(c["box"][1] for c in group)
        x1 = max(c["box"][2] for c in group)
        y1 = max(c["box"][3] for c in group)
        mask = np.isin(label[y0:y1, x0:x1], ids)
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(mask, 255, 0)
        piece = resize_piece(Image.fromarray(crop, "RGBA"), measure, size)
        piece.save(os.path.join(out_dir, f"{key}.png"), optimize=True)
        print(f"  {key}: {piece.size}")


def cut_altar(path, n, out_dir):
    im, solid = key_magenta(path)
    label, comps = components(solid, min_size=200)
    W = solid.shape[1]
    rgba = np.dstack([im.clip(0, 255), np.where(solid, 255, 0)]).astype(np.uint8)
    halves = [[c for c in comps if c["cx"] < W / 2], [c for c in comps if c["cx"] >= W / 2]]
    boxes = []
    for group in halves:
        boxes.append((min(c["box"][0] for c in group), min(c["box"][1] for c in group),
                      max(c["box"][2] for c in group), max(c["box"][3] for c in group)))
    # Mesmo tamanho de quadro para os dois (o aceso troca no lugar do apagado sem pular)
    bw = max(b[2] - b[0] for b in boxes)
    bh = max(b[3] - b[1] for b in boxes)
    s = ALTAR_WIDTH / bw
    for name, group, (x0, y0, x1, y1) in zip(("off", "on"), halves, boxes):
        ids = [c["id"] for c in group]
        frame = np.zeros((bh, bw, 4), dtype=np.uint8)
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = np.where(np.isin(label[y0:y1, x0:x1], ids), 255, 0)
        ox, oy = (bw - (x1 - x0)) // 2, bh - (y1 - y0)
        frame[oy:oy + (y1 - y0), ox:ox + (x1 - x0)] = crop
        img = Image.fromarray(frame, "RGBA").convert("RGBa").resize((round(bw * s), round(bh * s)), Image.LANCZOS).convert("RGBA")
        img.putalpha(img.getchannel("A").point(lambda v: 255 if v >= 110 else 0))
        img.save(os.path.join(out_dir, f"ch{n}-altar-{name}.png"), optimize=True)
        print(f"  ch{n}-altar-{name}: {img.size}")


def main():
    os.makedirs(OUT_TEXTURES, exist_ok=True)
    for n, kit in KITS.items():
        print(f"Capitulo {n}")
        out_dir = os.path.join(OUT_SPRITES, f"ch{n}")
        os.makedirs(out_dir, exist_ok=True)
        floor = Image.open(os.path.join(SRC, f"floor-ch{n}.jpg")).convert("RGB").resize((FLOOR_SIZE, FLOOR_SIZE), Image.LANCZOS)
        if n == 3:
            floor = remove_bright_specks(floor)
        floor.save(os.path.join(OUT_TEXTURES, f"floor-ch{n}.png"), optimize=True)
        cut_sheet(os.path.join(SRC, f"ch{n}-props.jpg"), kit["props"], out_dir)
        cut_sheet(os.path.join(SRC, f"ch{n}-decals.jpg"), kit["decals"], out_dir)
        cut_altar(os.path.join(SRC, f"ch{n}-altar.jpg"), n, out_dir)


if __name__ == "__main__":
    main()

"""Recorta a folha de 8 ícones de carta (grade 4x2, fundo magenta) em PNGs quadrados.

Uso: python scripts/cut-card-icons.py <folha> <pasta-saida> [tamanho=96]
Ver docs/ART_PROMPTS.md §14.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw

NAMES = [
    'icon-card-multishot', 'icon-card-pierce', 'icon-card-stamina', 'icon-card-crit-chance',
    'icon-card-crit-damage', 'icon-card-dash', 'icon-card-corpse-explosion', 'icon-card-bloodthirst',
]
src, outdir = sys.argv[1], sys.argv[2]
SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 96

im = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = im.shape
# Fundo magenta puro (com ruído de JPG). Limite apertado: o rastro rosado do Passo Sombrio
# fica a ~30 de distância e precisa sobreviver.
near_key = np.sqrt(((im - [252, 1, 250]) ** 2).sum(axis=2)) < 25

# Só some o magenta ligado à borda da imagem (o recheio das peças pode ter tons parecidos)
mask = Image.fromarray(np.where(near_key, 255, 0).astype(np.uint8), 'L').copy()
for x in range(0, W, 6):
    for y in (0, H - 1):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
for y in range(0, H, 6):
    for x in (0, W - 1):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
# entre os ícones há corredores de magenta; semeia uma grade fina também
for y in range(0, H, 24):
    for x in range(0, W, 24):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
bg = np.array(mask) == 128
# A franja rosada do JPG (mistura do contorno com o magenta) tem 1-2 px: o fundo avança 2 px
for _ in range(2):
    grown = bg.copy()
    grown[1:] |= bg[:-1]; grown[:-1] |= bg[1:]; grown[:, 1:] |= bg[:, :-1]; grown[:, :-1] |= bg[:, 1:]
    bg = grown
# Some com sujeira solta (pontinhos de ruído perto da borda da folha)
H2, W2 = bg.shape
bg[:, :3] = True; bg[:, -3:] = True; bg[:3] = True; bg[-3:] = True
rgba = np.dstack([im, np.where(bg, 0, 255)]).astype(np.uint8)

cw, ch = W / 4, H / 2
for i, name in enumerate(NAMES):
    cx0, cy0 = int((i % 4) * cw), int((i // 4) * ch)
    cx1, cy1 = int(cx0 + cw), int(cy0 + ch)
    art = ~bg[cy0:cy1, cx0:cx1]
    ys, xs = np.nonzero(art)
    x0, y0, x1, y1 = cx0 + xs.min(), cy0 + ys.min(), cx0 + xs.max() + 1, cy0 + ys.max() + 1
    piece = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    side = max(piece.size)
    square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    square.paste(piece, ((side - piece.width) // 2, (side - piece.height) // 2))
    out = square.convert('RGBa').resize((SIZE, SIZE), Image.LANCZOS).convert('RGBA')
    a = np.array(out)
    a[..., 3] = np.where(a[..., 3] >= 110, 255, 0)  # bordas duras de pixel art
    Image.fromarray(a, 'RGBA').save(f'{outdir}/{name}.png')
    print(name, (x0, y0, x1, y1))

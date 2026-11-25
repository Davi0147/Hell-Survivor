"""Recorta a folha das 5 molduras de carta (fundo magenta) em 5 PNGs do mesmo tamanho.

Uso: python scripts/cut-card-frames.py <folha> <pasta-saida>
Ver docs/ART_PROMPTS.md secao 19. As molduras sao achadas sozinhas (colunas separadas por
magenta), da esquerda para a direita: comum, incomum, rara, epica, suprema.
Todas sao reduzidas na MESMA escala e centradas pela janela de texto, entao as janelas e o
encaixe do icone caem no mesmo lugar nas 5 (o jogo escreve o texto por cima em posicoes fixas).
"""
import sys

import numpy as np
from PIL import Image, ImageDraw

NAMES = ['common', 'uncommon', 'rare', 'epic', 'supreme']
OUT_W, OUT_H = 240, 400  # o dobro da unidade 120x200 que o jogo usa para medir a carta

src, outdir = sys.argv[1], sys.argv[2]
rgb = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = rgb.shape
dist = np.sqrt(((rgb - [255, 0, 255]) ** 2).sum(axis=2))

# Fundo: magenta ligado a borda; mais qualquer magenta puro preso entre asas e pilares
mask = Image.fromarray(np.where(dist < 110, 255, 0).astype(np.uint8), 'L').copy()  # copy: floodfill nao escreve no numpy
for x in range(0, W, 6):
    for y in (0, H - 1):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
for y in range(0, H, 6):
    for x in (0, W - 1):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
bg = (np.array(mask) == 128) | (dist < 60)
grown = bg.copy()  # franja rosada da compressao: o fundo avanca 1 px
grown[1:] |= bg[:-1]; grown[:-1] |= bg[1:]; grown[:, 1:] |= bg[:, :-1]; grown[:, :-1] |= bg[:, 1:]
bg = grown

# Colunas de arte = uma moldura cada
col = (~bg).sum(axis=0) > 3
runs, x = [], 0
while x < W:
    if col[x]:
        s = x
        while x < W and col[x]:
            x += 1
        if x - s > 100:
            runs.append((s, x))
    x += 1
if len(runs) != len(NAMES):
    sys.exit(f'esperava {len(NAMES)} molduras, achei {len(runs)}: {runs}')

dark = (rgb.sum(axis=2) < 90) & (np.abs(rgb[:, :, 0] - rgb[:, :, 2]) < 40)
rows = np.where((~bg).sum(axis=1) > 3)[0]
top, bottom = int(rows.min()), int(rows.max()) + 1  # mesma faixa vertical para as 5

# Centro de cada moldura = centro da janela de cima (medido numa linha no meio dela)
centers, widths = [], []
for a, b in runs:
    mid_y = top + (bottom - top) // 3
    row = dark[mid_y, a:b]
    cx = (b - a) // 2
    l, r = cx, cx
    while l > 0 and row[l - 1]:
        l -= 1
    while r < b - a - 1 and row[r + 1]:
        r += 1
    c = a + (l + r) / 2
    centers.append(c)
    widths.append(2 * max(c - a, b - c))

# Uma escala para todas: a mais larga (asas da suprema) cabe na largura de saida
scale = min(OUT_W / max(widths), OUT_H / (bottom - top))
alpha_full = np.where(bg, 0, 255).astype(np.uint8)
img = Image.open(src).convert('RGB')
for name, c, w in zip(NAMES, centers, widths):
    half = max(widths) / 2
    box = (int(round(c - half)), top, int(round(c + half)), bottom)
    crop = img.crop(box)
    a_crop = Image.fromarray(alpha_full).crop(box)
    nw, nh = round(crop.width * scale), round(crop.height * scale)
    small = crop.resize((nw, nh), Image.LANCZOS)
    a_small = np.array(a_crop.resize((nw, nh), Image.BOX)) >= 128
    rgba = np.dstack([np.array(small), np.where(a_small, 255, 0).astype(np.uint8)])
    out = Image.new('RGBA', (OUT_W, OUT_H), (0, 0, 0, 0))
    out.paste(Image.fromarray(rgba, 'RGBA'), ((OUT_W - nw) // 2, (OUT_H - nh) // 2))
    out.save(f'{outdir}/card-{name}.png', optimize=True)
    print(f'card-{name}.png  centro x={c:.0f}  largura={w:.0f}')
print(f'escala {scale:.3f}, faixa vertical {top}-{bottom}')

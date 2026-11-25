"""Recorta a folha dos 5 pets dos talismãs (5 linhas x 2 colunas, fundo verde #00FF00).

Uso: python scripts/cut-pets.py <folha> <pasta-saida>
Gera <pasta>/pet-<nome>-0.png e -1.png (passo A e B), virados para a direita, no tamanho final
do jogo (escala 1). Os dois quadros de um pet saem na mesma tela e com os pés na mesma linha.
As linhas da folha são achadas pelas faixas vazias entre os pets (o gerador não as faz iguais).
Ver docs/ART_PROMPTS.md §20.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image

# (nome, altura final em pixels do jogo; a heroína mede ~58)
PETS = [('bat', 30), ('slime', 30), ('hound', 36), ('cerberus', 46), ('twin', 58)]
MIN_SPECK = 30  # manchas menores que isso (px na folha) são ruído do JPG

src, outdir = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]

# Fundo: verde forte. Nenhum pet tem verde.
solid = ~((g - np.maximum(r, b) > 90) & (g > 150))
# Franja de mistura (pixel meio verde na borda): tira o verde sobrando
spill = solid & (g > np.maximum(r, b))
im[spill, 1] = np.maximum(r, b)[spill]

# Some com pontinhos isolados de ruído (rotulagem simples, 4-vizinhos)
label = np.zeros((H, W), dtype=np.int32)
sizes = [0]
for y0, x0 in zip(*np.nonzero(solid)):
    if label[y0, x0]:
        continue
    n = len(sizes)
    label[y0, x0] = n
    q = deque([(y0, x0)])
    count = 0
    while q:
        y, x = q.popleft()
        count += 1
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < H and 0 <= xx < W and solid[yy, xx] and not label[yy, xx]:
                label[yy, xx] = n
                q.append((yy, xx))
    sizes.append(count)
keep = np.array(sizes) >= MIN_SPECK
keep[0] = False
solid = keep[label]

# Faixas de linha: trechos com arte separados por faixas totalmente vazias
rows_with_art = solid.any(axis=1)
bands, start = [], None
for y in range(H):
    if rows_with_art[y] and start is None:
        start = y
    elif not rows_with_art[y] and start is not None:
        bands.append((start, y))
        start = None
if start is not None:
    bands.append((start, H))
bands = [bd for bd in bands if bd[1] - bd[0] > 40]
if len(bands) != len(PETS):
    sys.exit(f'Esperava {len(PETS)} linhas de pets, achei {len(bands)}: {bands}')

alpha = np.where(solid, 255, 0).astype(np.uint8)
for (name, target_h), (y0, y1) in zip(PETS, bands):
    crops = []
    for col in range(2):
        x0, x1 = col * W // 2, (col + 1) * W // 2
        a = alpha[y0:y1, x0:x1]
        ys, xs = np.nonzero(a)
        bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        rgba = np.dstack([im[y0:y1, x0:x1], a]).astype(np.uint8)[by0:by1, bx0:bx1]
        crops.append(Image.fromarray(rgba, 'RGBA'))
    k = target_h / max(c.height for c in crops)
    small = []
    for c in crops:
        size = (max(1, round(c.width * k)), max(1, round(c.height * k)))
        out = c.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')
        arr = np.array(out)
        arr[..., 3] = np.where(arr[..., 3] >= 110, 255, 0)  # bordas duras de pixel art
        small.append(Image.fromarray(arr, 'RGBA'))
    cw_out = max(s.width for s in small) + 2
    ch_out = max(s.height for s in small) + 2
    for i, s in enumerate(small):
        canvas = Image.new('RGBA', (cw_out, ch_out), (0, 0, 0, 0))
        canvas.paste(s, ((cw_out - s.width) // 2, ch_out - 1 - s.height), s)
        canvas.save(f'{outdir}/pet-{name}-{i}.png')
    print(name, 'linha', (y0, y1), 'quadro', (cw_out, ch_out), 'fator', round(k, 4))

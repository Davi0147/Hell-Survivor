"""Recorta a folha de botoes (fundo magenta) num atlas unico do Phaser (PNG + JSON hash).

Uso: python scripts/cut-button-glyphs.py <folha> <pasta-saida> [altura-da-tecla=48]
Ver docs/ART_PROMPTS.md secao 18. As pecas sao achadas sozinhas (manchas separadas por
magenta) e nomeadas na ordem de leitura: linha por linha, da esquerda para a direita.
Tudo e reduzido na MESMA escala (a tecla comum fica com a altura pedida), entao uma tecla
larga continua duas vezes mais larga que uma comum.
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Ordem de leitura da folha. Mudou a folha? Mude esta lista na mesma ordem.
ROWS = [
    ['key-w', 'key-a', 'key-s', 'key-d', 'key-e', 'key-r', 'key-m', 'key-esc'],
    ['key-up', 'key-down', 'key-left', 'key-right', 'key-space', 'key-enter'],
    ['key-shift', 'key-blank', 'key-blank-wide', 'key-arrows', 'mouse-left', 'touch-tap'],
    ['pad-a', 'pad-b', 'pad-x', 'pad-y', 'pad-lb', 'pad-rb', 'pad-lt', 'pad-rt'],
    ['ps-cross', 'ps-circle', 'ps-square', 'ps-triangle', 'ps-l1', 'ps-r1', 'ps-l2', 'ps-r2'],
    ['pad-start', 'pad-select', 'ps-options', 'ps-share', 'pad-ls', 'pad-rs', 'pad-dpad', 'key-wasd'],
]
REFERENCE = 'key-w'  # a altura desta peca vira a altura pedida
PAD = 2  # pixels transparentes entre as pecas no atlas (evita sangrar no filtro)

src, outdir = sys.argv[1], sys.argv[2]
KEY_H = int(sys.argv[3]) if len(sys.argv) > 3 else 48

im = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = im.shape
near_key = np.sqrt(((im - [255, 0, 255]) ** 2).sum(axis=2)) < 90

# So e fundo o magenta ligado a borda ou aos corredores entre as pecas
mask = Image.fromarray(np.where(near_key, 255, 0).astype(np.uint8), 'L').copy()  # copy: floodfill nao escreve na memoria do numpy
for y in range(0, H, 8):
    for x in range(0, W, 8):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
bg = np.array(mask) == 128
# Franja rosada do contorno (compressao): o fundo avanca 1 px
grown = bg.copy()
grown[1:] |= bg[:-1]; grown[:-1] |= bg[1:]; grown[:, 1:] |= bg[:, :-1]; grown[:, :-1] |= bg[:, 1:]
bg = grown

# Manchas: arte engordada 5 px para juntar pedacos de uma mesma peca (faiscas do mouse,
# teclinhas do grupo de setas) sem juntar pecas vizinhas
art = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8), 'L')
# Rotula numa versao 4x menor (rapido em Python puro); a caixa final vem da arte real
STEP = 4
small = np.array(art.filter(ImageFilter.MaxFilter(11)))[::STEP, ::STEP] > 0
sh, sw = small.shape
seen = np.zeros_like(small)
boxes = []
for sy in range(sh):
    for sx in range(sw):
        if not small[sy, sx] or seen[sy, sx]:
            continue
        stack, cells = [(sy, sx)], []
        seen[sy, sx] = True
        while stack:
            cy, cx = stack.pop()
            cells.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        cys, cxs = zip(*cells)
        y0, y1 = min(cys) * STEP, (max(cys) + 1) * STEP
        x0, x1 = min(cxs) * STEP, (max(cxs) + 1) * STEP
        ys, xs = np.nonzero(~bg[y0:y1, x0:x1])
        if len(xs) < 400:  # sujeira solta
            continue
        boxes.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))

expected = sum(len(r) for r in ROWS)
if len(boxes) != expected:
    sys.exit(f'Achei {len(boxes)} pecas, esperava {expected}: {boxes}')

# Agrupa em linhas pelo centro vertical
boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
rows, cur = [], [boxes[0]]
for b in boxes[1:]:
    prev_cy = sum((c[1] + c[3]) / 2 for c in cur) / len(cur)
    if abs((b[1] + b[3]) / 2 - prev_cy) < 60:
        cur.append(b)
    else:
        rows.append(cur); cur = [b]
rows.append(cur)
if [len(r) for r in rows] != [len(r) for r in ROWS]:
    sys.exit(f'Linhas com {[len(r) for r in rows]} pecas, esperava {[len(r) for r in ROWS]}')

rgba = np.dstack([im, np.where(bg, 0, 255)]).astype(np.uint8)
named = {}
for names, row in zip(ROWS, rows):
    for name, box in zip(names, sorted(row, key=lambda b: b[0])):
        named[name] = box

ref = named[REFERENCE]
scale = KEY_H / (ref[3] - ref[1])
pieces = {}
for name, (x0, y0, x1, y1) in named.items():
    piece = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    w, h = max(1, round(piece.width * scale)), max(1, round(piece.height * scale))
    out = piece.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
    a = np.array(out)
    a[..., 3] = np.where(a[..., 3] >= 110, 255, 0)  # bordas duras de pixel art
    pieces[name] = Image.fromarray(a, 'RGBA')

# Empacota em prateleiras, largura fixa de 512
ATLAS_W = 512
x = y = shelf_h = 0
frames = {}
for name in [n for r in ROWS for n in r]:
    p = pieces[name]
    if x + p.width + PAD > ATLAS_W:
        x, y, shelf_h = 0, y + shelf_h + PAD, 0
    frames[name] = (x, y, p.width, p.height)
    x += p.width + PAD
    shelf_h = max(shelf_h, p.height)
atlas_h = 1
while atlas_h < y + shelf_h:
    atlas_h *= 2
atlas = Image.new('RGBA', (ATLAS_W, atlas_h), (0, 0, 0, 0))
for name, (fx, fy, fw, fh) in frames.items():
    atlas.paste(pieces[name], (fx, fy))
atlas.save(f'{outdir}/button-glyphs.png', optimize=True)

data = {
    'frames': {
        n: {
            'frame': {'x': fx, 'y': fy, 'w': fw, 'h': fh},
            'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': fw, 'h': fh},
            'sourceSize': {'w': fw, 'h': fh},
        }
        for n, (fx, fy, fw, fh) in frames.items()
    },
    'meta': {'image': 'button-glyphs.png', 'size': {'w': ATLAS_W, 'h': atlas_h}, 'scale': '1'},
}
with open(f'{outdir}/button-glyphs.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=1)
print(f'{len(frames)} pecas, atlas {ATLAS_W}x{atlas_h}, escala {scale:.3f}')
for n, fr in frames.items():
    print(n, fr)

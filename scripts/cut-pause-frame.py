"""Recorta a folha do menu de pausa (moldura + placa do título + 3 botões).

A abertura da moldura gerada não tem a proporção do menu. Em vez de esticar a arte
(deformaria crânio e cantos), repete colunas e linhas de trechos LISOS da borda até a
abertura ter o tamanho pedido; os enfeites ficam intactos.

Uso: python scripts/cut-pause-frame.py <folha> <pasta-saida>
Ver docs/ART_PROMPTS.md §15. Medidas abaixo valem para art-source/novos/pausa-moldura.jpg.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw

src, outdir = sys.argv[1], sys.argv[2]

# Abertura final em pixels do jogo (o painel do menu tem 820x600; a borda cobre 6 px dele)
OPEN_W, OPEN_H = 808, 588
SCALE = 0.5  # arte final = metade da folha (borda com ~29 px)
# Colunas e linhas lisas da borda (medidas com a diferença entre vizinhas)
SEAM_COLS = (245, 595)
SEAM_ROWS = (243, 558)
OPENING_SEED = (420, 400)
FRAME_BOX = (20, 60, 830, 770)
PLATE_X = (830, 1264)
# placa do título e botões (ordem na folha, de cima para baixo) e tamanho final no jogo
PLATES = [
    ('PauseTitlePlaque.png', (280, 80)),
    ('PauseBtnResume.png', (220, 63)),
    ('PauseBtnRestart.png', (220, 63)),
    ('PauseBtnMenu.png', (220, 63)),
]

im = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = im.shape
near_key = np.sqrt(((im - [252, 1, 250]) ** 2).sum(axis=2)) < 40

mask = Image.fromarray(np.where(near_key, 255, 0).astype(np.uint8), 'L').copy()
seeds = [(x, y) for x in range(0, W, 6) for y in (0, H - 1)] + [(x, y) for y in range(0, H, 6) for x in (0, W - 1)]
seeds += [OPENING_SEED] + [(x, y) for y in range(0, H, 20) for x in range(0, W, 20)]
for s in seeds:
    if mask.getpixel(s) == 255:
        ImageDraw.floodfill(mask, s, 128)
bg = np.array(mask) == 128
for _ in range(2):  # franja rosada do JPG
    g = bg.copy()
    g[1:] |= bg[:-1]; g[:-1] |= bg[1:]; g[:, 1:] |= bg[:, :-1]; g[:, :-1] |= bg[:, 1:]
    bg = g
rgba = np.dstack([im, np.where(bg, 0, 255)]).astype(np.uint8)


def shrink(arr, size):
    img = Image.fromarray(arr, 'RGBA').convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')
    a = np.array(img)
    a[..., 3] = np.where(a[..., 3] >= 110, 255, 0)
    return Image.fromarray(a, 'RGBA')


# --- moldura
x0, y0, x1, y1 = FRAME_BOX
frame = rgba[y0:y1, x0:x1]
m2 = Image.fromarray(np.where(near_key[y0:y1, x0:x1], 255, 0).astype(np.uint8), 'L').copy()
ImageDraw.floodfill(m2, (OPENING_SEED[0] - x0, OPENING_SEED[1] - y0), 77)
oys, oxs = np.nonzero(np.array(m2) == 77)
open_w, open_h = oxs.max() - oxs.min() + 1, oys.max() - oys.min() + 1
add_w = round(OPEN_W / SCALE) - open_w
add_h = round(OPEN_H / SCALE) - open_h


def widen(arr, cols, extra, axis):
    """Repete as fatias lisas: `extra` dividido entre as posições de `cols`."""
    parts, last = [], 0
    per = [extra // len(cols) + (1 if i < extra % len(cols) else 0) for i in range(len(cols))]
    for c, n in zip(cols, per):
        sl = np.take(arr, range(last, c), axis=axis)
        rep = np.repeat(np.take(arr, [c], axis=axis), n, axis=axis)
        parts += [sl, rep]
        last = c
    parts.append(np.take(arr, range(last, arr.shape[axis]), axis=axis))
    return np.concatenate(parts, axis=axis)


frame = widen(frame, [c - x0 for c in SEAM_COLS], add_w, axis=1)
frame = widen(frame, [r - y0 for r in SEAM_ROWS], add_h, axis=0)
ys, xs = np.nonzero(frame[..., 3])
frame = frame[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
fh, fw = frame.shape[:2]
out = shrink(frame, (round(fw * SCALE), round(fh * SCALE)))
out.save(f'{outdir}/PauseFrame.png')
# Centro da abertura dentro da imagem final: vira a origem da imagem no jogo
# (as costuras ficam depois do canto da abertura, então o canto não se move)
cx = ((oxs.min() - xs.min()) * SCALE + OPEN_W / 2) / out.width
cy = ((oys.min() - ys.min()) * SCALE + OPEN_H / 2) / out.height
print('PauseFrame.png', out.size, f'origin=({cx:.4f}, {cy:.4f})', 'added', add_w, add_h)

# --- placas
art = ~bg
rows = np.nonzero(art[:, PLATE_X[0]:PLATE_X[1]].sum(axis=1) > 5)[0]
segs, s, p = [], rows[0], rows[0]
for r in rows[1:]:
    if r != p + 1:
        segs.append((s, p))
        s = r
    p = r
segs.append((s, p))
for (name, size), (r0, r1) in zip(PLATES, segs):
    sub = art[r0:r1 + 1, PLATE_X[0]:PLATE_X[1]]
    cs = np.nonzero(sub.sum(axis=0))[0]
    piece = rgba[r0:r1 + 1, PLATE_X[0] + cs.min(): PLATE_X[0] + cs.max() + 1]
    shrink(piece, size).save(f'{outdir}/{name}')
    print(name, size, 'src h', r1 - r0 + 1, 'w', cs.max() - cs.min() + 1)

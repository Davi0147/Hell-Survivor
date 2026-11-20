"""Recorta a folha do painel violeta: moldura (janelas vazadas), logo NIXY e preenchimentos das barras."""
import sys
import numpy as np
from PIL import Image, ImageDraw

src, outdir = sys.argv[1], sys.argv[2]
FRAME_W = int(sys.argv[3]) if len(sys.argv) > 3 else 480

im = np.array(Image.open(src).convert('RGB')).astype(int)
H, W, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
# Fundo magenta (com ruído de JPG). A arte usa magenta brilhante com verde > 60, então não some.
key = (r > 170) & (b > 170) & (g < 70) & (np.abs(r - b) < 70)


def connected(mask, seeds):
    """Pixels de `mask` ligados a alguma semente (flood fill do PIL, sem scipy)."""
    m = Image.fromarray(np.where(mask, 255, 0).astype(np.uint8), 'L').copy()
    for s in seeds:
        if m.getpixel(s) == 255:
            ImageDraw.floodfill(m, s, 128)
    return np.array(m) == 128


# Só some o magenta ligado ao fundo de fora ou às janelas: o olho e as letras usam o mesmo
# magenta por dentro e precisam ficar opacos.
border = [(x, 0) for x in range(0, W, 8)] + [(x, H - 1) for x in range(0, W, 8)] + \
         [(0, y) for y in range(0, H, 8)] + [(W - 1, y) for y in range(0, H, 8)]
WINDOW_SEEDS = [(750, 290), (750, 405)]
# a faixa de baixo é separada da moldura por uma linha magenta inteira; semeia também nela
bg = connected(key, border + WINDOW_SEEDS + [(x, 600) for x in range(0, W, 8)])

def dilate(mask, n):
    for _ in range(n):
        d = mask.copy()
        d[1:] |= mask[:-1]; d[:-1] |= mask[1:]; d[:, 1:] |= mask[:, :-1]; d[:, :-1] |= mask[:, 1:]
        mask = d
    return mask


def enclosed_background(raw_key, bg_mask, y_from):
    """No logo, letras vizinhas se tocam e fecham bolsões de fundo (entre o I e o X).
    Bolsão cercado por contorno escuro é fundo; recheio de letra é cercado por brilho claro."""
    lum = im.sum(axis=2) / 3
    left = raw_key & ~bg_mask
    left[:y_from] = False
    m = Image.fromarray(np.where(left, 255, 0).astype(np.uint8), 'L').copy()
    extra = np.zeros_like(left)
    for y, x in np.argwhere(left):
        if m.getpixel((int(x), int(y))) != 255:
            continue
        ImageDraw.floodfill(m, (int(x), int(y)), 77)
        comp = np.array(m) == 77
        # anel a 2-4 px do bolsão (pula a franja rosada do JPG); fundo preso: >35% contorno preto
        ring = dilate(comp, 4) & ~dilate(comp, 1)
        if (lum[ring] < 50).mean() > 0.35:
            extra |= comp
        m = Image.fromarray(np.where(comp, 0, np.array(m)).astype(np.uint8), 'L').copy()
    return extra


key = bg | enclosed_background(key, bg, 600)
rgba = np.dstack([im, np.where(key, 0, 255)]).astype(np.uint8)


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def crop(x0, y0, x1, y1):
    region = ~key[y0:y1, x0:x1]
    bx0, by0, bx1, by1 = bbox(region)
    return x0 + bx0, y0 + by0, x0 + bx1, y0 + by1


def save(box, name, width=None, height=None):
    x0, y0, x1, y1 = box
    img = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    if width or height:
        w0, h0 = img.size
        w = width if width else round(w0 * height / h0)
        h = height if height else round(h0 * width / w0)
        img = img.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
        a = np.array(img)
        a[..., 3] = np.where(a[..., 3] >= 110, 255, 0)  # bordas duras de pixel art
        img = Image.fromarray(a, 'RGBA')
    img.save(f'{outdir}/{name}')
    print(name, img.size, 'src', box)
    return img.size


# Peça A: tudo acima da faixa de baixo (gap magenta entre ~600 e ~600 px)
row_has_art = (~key).sum(axis=1) > 3
split_y = 560 + int(np.argmax(~row_has_art[560:]))
frame_box = crop(0, 0, W, split_y)
fw, fh = save(frame_box, 'HudStatusFrame.png', width=FRAME_W)

# Janelas: magenta que não está ligado ao fundo de fora da moldura
x0, y0, x1, y1 = frame_box
m = Image.fromarray(np.where(key[y0:y1, x0:x1], 255, 0).astype(np.uint8), 'L')
mp = Image.new('L', (m.width + 2, m.height + 2), 255)
mp.paste(m, (1, 1))
ImageDraw.floodfill(mp, (0, 0), 128)
scale = fw / (x1 - x0)
# Sementes no meio de cada janela (coordenadas da folha original)
for label, (sx, sy), val in (('hp', (750, 290), 60), ('stamina', (750, 405), 30)):
    ImageDraw.floodfill(mp, (sx - x0 + 1, sy - y0 + 1), val)
    win = np.array(mp)[1:-1, 1:-1] == val
    wx0, wy0, wx1, wy1 = bbox(win)
    print(f'window {label}: x={wx0*scale:.1f} y={wy0*scale:.1f} w={(wx1-wx0)*scale:.1f} h={(wy1-wy0)*scale:.1f}')

# Faixa de baixo: logo, vida, estamina
cols_art = (~key[split_y:]).sum(axis=0) > 2
segs, start = [], None
for x, v in enumerate(cols_art):
    if v and start is None:
        start = x
    elif not v and start is not None:
        if x - start > 20:
            segs.append((start, x))
        start = None
if start is not None:
    segs.append((start, W))
print('bottom segments', segs)
logo, hp, st = segs[0], segs[1], segs[2]
save(crop(logo[0], split_y, logo[1], H), 'HudNixyName.png', width=int(FRAME_W * 0.42))
# Preenchimentos 4 px maiores que a janela em cada lado: a borda deles some sob a moldura
save(crop(hp[0], split_y, hp[1], H), 'HudHpFill.png', width=260, height=40)
save(crop(st[0], split_y, st[1], H), 'HudStaminaFill.png', width=250, height=27)

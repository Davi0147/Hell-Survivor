import sys
from PIL import Image

src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size
px = im.load()

def is_green(r, g, b):
    return g > 120 and g > r + 40 and g > b + 40

# mask
alpha = Image.new('L', (W, H), 0)
ap = alpha.load()
for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        ap[x, y] = 0 if is_green(r, g, b) else 255

# column occupancy to split pieces
cols = [any(ap[x, y] for y in range(0, H, 2)) for x in range(W)]
segs = []
start = None
for x, c in enumerate(cols):
    if c and start is None:
        start = x
    if not c and start is not None:
        if x - start > 40:
            segs.append((start, x))
        start = None
print('segments', segs)

rgba = im.convert('RGBA')
rgba.putalpha(alpha)

BLOCK = float(sys.argv[3]) if len(sys.argv) > 3 else 16.0
names = ['skull-closed', 'skull-open', 'skull-orb']
for name, (x0, x1) in zip(names, segs):
    piece = rgba.crop((x0, 0, x1, H))
    bbox = piece.getbbox()
    piece = piece.crop(bbox)
    w, h = piece.size
    nw, nh = max(1, round(w / BLOCK)), max(1, round(h / BLOCK))
    # sample center of each block (nearest) to rebuild the pixel grid
    small = Image.new('RGBA', (nw, nh))
    sp = small.load()
    pp = piece.load()
    for j in range(nh):
        for i in range(nw):
            cx = min(w - 1, int((i + 0.5) * w / nw))
            cy = min(h - 1, int((j + 0.5) * h / nh))
            r, g, b, a = pp[cx, cy]
            # borda esverdeada do fundo (verde misturado ao branco do contorno); o turquesa da orbe tem pouco vermelho
            fringe = g > r + 18 and g > b + 18 and r > 100
            sp[i, j] = (r, g, b, 255) if a > 0 and not fringe else (0, 0, 0, 0)
    if name == 'skull-closed':
        # mesma tela do quadro de boca aberta para a troca não "pular"
        padded = Image.new('RGBA', (nw, round(700 / BLOCK)))
        padded.paste(small, (0, 0))
        small = padded
    small.save(f'{outdir}/{name}.png')
    print(name, bbox, (w, h), '->', small.size)

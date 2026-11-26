"""Recorta art-source/novos/mao-azazel.jpg (fundo verde) na mão gigante do Azazel.

Uso: python -I scripts/cut-azazel-hand.py
Sai virada de cabeça para baixo (dedos para baixo): no jogo ela desce do alto da tela e
bate no chão com a palma. Reduzida para a grade de pixel da arte (BLOCK px = 1 px no jogo).
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from spritecut import load_keyed  # noqa: E402

SRC = 'art-source/novos/mao-azazel.jpg'
OUT = 'public/assets/sprites/enemies/Azazel/hand-slam.png'
BLOCK = 7.75  # medido pelas sequências de cor da folha (picos em 7-8, 15 e 23 px)


def main() -> None:
    _, solid = load_keyed(SRC)
    # Cor original (a limpeza de franja do load_keyed mexe no cinza dos ossos)
    im = np.array(Image.open(SRC).convert('RGB')).astype(int)
    ys = np.nonzero(solid.any(axis=1))[0]
    xs = np.nonzero(solid.any(axis=0))[0]
    x0, y0, x1, y1 = xs[0], ys[0], xs[-1] + 1, ys[-1] + 1
    w, h = x1 - x0, y1 - y0
    nw, nh = round(w / BLOCK), round(h / BLOCK)
    out = np.zeros((nh, nw, 4), dtype=np.uint8)
    for j in range(nh):
        for i in range(nw):
            cx = x0 + min(w - 1, int((i + 0.5) * w / nw))
            cy = y0 + min(h - 1, int((j + 0.5) * h / nh))
            r, g, b = im[cy, cx]
            # Borda clara esverdeada (verde do fundo misturado ao contorno branco)
            fringe = g > r + 18 and g > b + 18 and r > 100
            if solid[cy, cx] and not fringe:
                out[j, i, :3] = np.clip(im[cy, cx], 0, 255)
                out[j, i, 3] = 255
    img = Image.fromarray(out, 'RGBA').transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    img.save(OUT)
    print(OUT, (x0, y0, x1, y1), '->', img.size)


if __name__ == '__main__':
    main()

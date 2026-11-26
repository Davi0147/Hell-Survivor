"""Recorta art-source/novos/projeteis-azazel.jpg (fundo verde) nos projéteis do Azazel.

Uso: python -I scripts/cut-azazel-projectiles.py
As peças da folha ficam coladas demais para achar sozinho, então cada uma tem uma caixa
aproximada (px na folha de 2000x1116); o recorte aperta a caixa até a arte.
Cada peça é reduzida para a grade de pixel da arte (BLOCK px na folha = 1 px no jogo).
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from spritecut import load_keyed  # noqa: E402

SRC = 'art-source/novos/projeteis-azazel.jpg'
OUT = 'public/assets/sprites/enemies/Azazel/Projectiles'
BLOCK = 8.0

# nome -> (x0, y0, x1, y1) aproximado na folha
PICKS = {
    'orb-glossy': (195, 45, 355, 205),    # 1ª linha, 2ª orbe: rajada do teleporte
    'comet': (795, 55, 1300, 205),        # 1ª linha, cometa longo: rajada direcionada
    'orb-spiral': (190, 255, 355, 430),   # 2ª linha, 2ª orbe: disparo em espiral
    'needle': (38, 505, 510, 612),        # 3ª linha, 1ª agulha: leque de penas
}


def shrink(im: np.ndarray, solid: np.ndarray, x0: int, y0: int, x1: int, y1: int) -> Image.Image:
    """Amostra o centro de cada bloco da grade: volta ao pixel art original."""
    w, h = x1 - x0, y1 - y0
    nw, nh = max(1, round(w / BLOCK)), max(1, round(h / BLOCK))
    out = np.zeros((nh, nw, 4), dtype=np.uint8)
    for j in range(nh):
        for i in range(nw):
            cx = x0 + min(w - 1, int((i + 0.5) * w / nw))
            cy = y0 + min(h - 1, int((j + 0.5) * h / nh))
            if solid[cy, cx]:
                out[j, i, :3] = np.clip(im[cy, cx], 0, 255)
                out[j, i, 3] = 255
    return Image.fromarray(out, 'RGBA')


def main() -> None:
    _, solid = load_keyed(SRC)
    # Cor original: a limpeza de franja verde do load_keyed apagava o verde-água claro do miolo
    im = np.array(Image.open(SRC).convert('RGB')).astype(int)
    os.makedirs(OUT, exist_ok=True)
    for name, (x0, y0, x1, y1) in PICKS.items():
        sub = solid[y0:y1, x0:x1]
        ys = np.nonzero(sub.any(axis=1))[0]
        xs = np.nonzero(sub.any(axis=0))[0]
        box = (x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1)
        img = shrink(im, solid, *box)
        img.save(f'{OUT}/{name}.png')
        print(name, box, '->', img.size)


if __name__ == '__main__':
    main()

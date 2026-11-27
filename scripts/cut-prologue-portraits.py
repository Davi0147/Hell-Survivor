"""Recorta os retratos de diálogo dos funcionários do prólogo (fundo verde).

Uso: python scripts/cut-prologue-portraits.py <pasta-fonte> <pasta-saida>
Fonte (art-source/novos/prologo/):
  retrato-carlos.jpg     -> portrait-carlos.png (espelhado: olha para a esquerda, para a Nixy)
  retrato-lina-gina.jpg  -> portrait-lina.png e portrait-gina.png (as duas da imagem, separadas
                            pelo vão de fundo entre elas; corpo inteiro vira busto até a cintura)
  retrato-leo.jpg        -> portrait-leo.png
Os retratos ficam com PORTRAIT_HEIGHT px de altura; a tela de diálogo ajusta sem distorcer.
"""
import sys
import numpy as np
from PIL import Image, ImageOps
from spritecut import load_keyed, to_rgba, shrink

PORTRAIT_HEIGHT = 460
# Corpo inteiro (Lina/Gina): fica só do topo até esta fração da altura (busto até a cintura)
FULL_BODY_KEEP = 0.62

src, out = sys.argv[1], sys.argv[2]


def bbox(mask: np.ndarray, x0: int = 0, x1: int | None = None) -> tuple[int, int, int, int]:
    sub = mask[:, x0:x1]
    ys, xs = np.nonzero(sub)
    return x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1


def save(img: Image.Image, name: str, mirror: bool = False) -> None:
    small = shrink(img, PORTRAIT_HEIGHT / img.height)
    if mirror:
        small = ImageOps.mirror(small)
    small.save(f'{out}/{name}.png')
    print(name, small.size)


for name, mirror in (('carlos', True), ('leo', False)):
    im, solid = load_keyed(f'{src}/retrato-{name}.jpg')
    save(to_rgba(im, solid, *bbox(solid)), f'portrait-{name}', mirror)

# Dupla: acha a coluna vazia mais larga no meio da imagem e corta ali
im, solid = load_keyed(f'{src}/retrato-lina-gina.jpg')
W = solid.shape[1]
empty = ~solid.any(axis=0)
mid = [x for x in range(W // 4, 3 * W // 4) if empty[x]]
if not mid:
    sys.exit('Lina e Gina estão encostadas: não achei o vão entre as duas')
split = mid[len(mid) // 2]
for name, (a, b) in (('lina', (0, split)), ('gina', (split, W))):
    x0, y0, x1, y1 = bbox(solid, a, b)
    y1 = y0 + round((y1 - y0) * FULL_BODY_KEEP)
    save(to_rgba(im, solid, x0, y0, x1, y1), f'portrait-{name}')

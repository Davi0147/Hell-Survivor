"""Recorta o retrato de diálogo da Shylph (fundo verde).

Uso: python scripts/cut-shylph-portrait.py art-source/novos/shylph/retrato-shylph.jpg public/assets/sprites/portraits/Shylph_Chat.png
Sem espelhar: ela está de frente, com a mão erguida do lado esquerdo (para a Nixy).
"""
import sys
import numpy as np
from spritecut import load_keyed, to_rgba, shrink

PORTRAIT_HEIGHT = 460

src, out = sys.argv[1], sys.argv[2]
im, solid = load_keyed(src)
ys, xs = np.nonzero(solid)
art = to_rgba(im, solid, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
small = shrink(art, PORTRAIT_HEIGHT / art.height)
small.save(out)
print('Shylph_Chat', small.size)

"""Recorta os retratos de diálogo do cão do encontro (parado e latindo, fundo verde).

Uso: python scripts/cut-prologue-dog.py <parado> <latindo> <pasta-saida>
Gera portrait-dog-idle.png e portrait-dog-bark.png com a MESMA janela de recorte (o cão não
pula ao latir), espelhados para olhar para a esquerda, para a Nixy na tela de diálogo.
No mundo o cão é o sprite comum do Cão Zumbi; a arte detalhada é só da conversa.
"""
import sys
import numpy as np
from PIL import ImageOps
from spritecut import load_keyed, to_rgba, shrink

DOG_WIDTH = 520

idle_path, bark_path, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
sheets = [load_keyed(idle_path), load_keyed(bark_path)]
boxes = []
for _, solid in sheets:
    ys, xs = np.nonzero(solid)
    boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
x0 = min(b[0] for b in boxes)
y0 = min(b[1] for b in boxes)
x1 = max(b[2] for b in boxes)
y1 = max(b[3] for b in boxes)
k = DOG_WIDTH / (x1 - x0)
for name, (im, solid) in zip(('idle', 'bark'), sheets):
    small = ImageOps.mirror(shrink(to_rgba(im, solid, x0, y0, x1, y1), k))
    small.save(f'{outdir}/portrait-dog-{name}.png')
    print(name, small.size)

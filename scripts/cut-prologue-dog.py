"""Recorta o cão do encontro do prólogo (parado e latindo, fundo verde).

Uso: python scripts/cut-prologue-dog.py <parado> <latindo> <pasta-saida>
Gera prologue-dog-idle.png e prologue-dog-bark.png com a MESMA janela de recorte, para
o cão não tremer ao trocar de quadro. Virado para a direita (o jogo espelha se precisar).
"""
import sys
import numpy as np
from spritecut import load_keyed, to_rgba, shrink

DOG_WIDTH = 160  # tamanho de trabalho; a escala final na tela é ajustada no jogo

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
    small = shrink(to_rgba(im, solid, x0, y0, x1, y1), k)
    small.save(f'{outdir}/prologue-dog-{name}.png')
    print(name, small.size)

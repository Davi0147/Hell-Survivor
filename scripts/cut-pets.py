"""Recorta a folha dos pets dos talismãs (5 linhas x 2 colunas, fundo verde #00FF00).

Uso: python scripts/cut-pets.py <folha> <pasta-saida>
Gera <pasta>/pet-<nome>-0.png e -1.png (passo A e B), virados para a direita, no tamanho final
do jogo (escala 1). Os dois quadros de um pet saem na mesma tela e com os pés na mesma linha.
As linhas da folha são achadas pelas faixas vazias entre os pets (o gerador não as faz iguais).
A 5ª linha (Gêmea) é ignorada: ela tem folha própria (scripts/cut-twin.py).
Ver docs/ART_PROMPTS.md §20.
"""
import sys
from PIL import Image
from spritecut import load_keyed, row_bands, to_rgba, shrink
import numpy as np

# (nome, altura final em pixels do jogo; a heroína mede ~58)
PETS = [('bat', 30), ('slime', 30), ('hound', 36), ('cerberus', 46)]

src, outdir = sys.argv[1], sys.argv[2]
im, solid = load_keyed(src)
H, W = solid.shape
bands = row_bands(solid)
if len(bands) < len(PETS):
    sys.exit(f'Esperava ao menos {len(PETS)} linhas de pets, achei {len(bands)}: {bands}')

for (name, target_h), (y0, y1) in zip(PETS, bands):
    crops = []
    for col in range(2):
        x0, x1 = col * W // 2, (col + 1) * W // 2
        ys, xs = np.nonzero(solid[y0:y1, x0:x1])
        crops.append(to_rgba(im, solid, x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
    k = target_h / max(c.height for c in crops)
    small = [shrink(c, k) for c in crops]
    cw_out = max(s.width for s in small) + 2
    ch_out = max(s.height for s in small) + 2
    for i, s in enumerate(small):
        canvas = Image.new('RGBA', (cw_out, ch_out), (0, 0, 0, 0))
        canvas.paste(s, ((cw_out - s.width) // 2, ch_out - 1 - s.height), s)
        canvas.save(f'{outdir}/pet-{name}-{i}.png')
    print(name, 'linha', (y0, y1), 'quadro', (cw_out, ch_out), 'fator', round(k, 4))

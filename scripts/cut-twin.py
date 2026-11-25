"""Recorta a folha da Gêmea Sombria e o tiro dela (fundo verde).

Uso: python scripts/cut-twin.py <folha-gemea> <imagem-tiro> <pasta-saida>
Folha: 4 colunas x 3 linhas; usa a linha 1 (parada) e a 2 (andando); a 3 (ataque) fica de fora.
Gera pet-twin-idle-0..3.png, pet-twin-walk-0..3.png (todos na mesma tela, virados para a
direita) e twin-bolt.png (tiro com a cabeça para a direita). Ver docs/ART_PROMPTS.md §21.
"""
import sys
import numpy as np
from PIL import Image
from spritecut import load_keyed, row_bands, to_rgba, shrink

TWIN_HEIGHT = 58  # igual à heroína
BOLT_WIDTH = 34

sheet, bolt_src, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
im, solid = load_keyed(sheet)
H, W = solid.shape
bands = row_bands(solid)
if len(bands) < 2:
    sys.exit(f'Esperava as linhas de parada e andar, achei {bands}')

# Janela comum a todos os quadros, medida a partir do canto esquerdo da célula e do chão
# da linha: assim cada quadro guarda a posição em que o gerador o desenhou (sem tremer).
frames = []
for anim, (y0, y1) in zip(('idle', 'walk'), bands[:2]):
    for col in range(4):
        x0 = col * W // 4
        ys, xs = np.nonzero(solid[y0:y1, x0:x0 + W // 4])
        frames.append((anim, col, x0, y1, xs.min(), xs.max() + 1, ys.min() + y0 - y1, ys.max() + 1 + y0 - y1))
ux0 = min(f[4] for f in frames)
ux1 = max(f[5] for f in frames)
uy0 = min(f[6] for f in frames)
uy1 = max(f[7] for f in frames)
k = TWIN_HEIGHT / (uy1 - uy0)
for anim, col, x0, floor, *_ in frames:
    crop = to_rgba(im, solid, x0 + ux0, floor + uy0, x0 + ux1, floor + uy1)
    small = shrink(crop, k)
    canvas = Image.new('RGBA', (small.width + 2, small.height + 2), (0, 0, 0, 0))
    canvas.paste(small, (1, 1), small)
    canvas.save(f'{outdir}/pet-twin-{anim}-{col}.png')
print('gemea', 'linhas', bands[:2], 'quadro', canvas.size, 'fator', round(k, 4))

bim, bsolid = load_keyed(bolt_src)
ys, xs = np.nonzero(bsolid)
crop = to_rgba(bim, bsolid, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
small = shrink(crop, BOLT_WIDTH / crop.width)
small.save(f'{outdir}/twin-bolt.png')
print('tiro', small.size)

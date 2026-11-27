"""Prepara a arte do prólogo (corredor do escritório) para o jogo.

Uso: python scripts/cut-prologue-corridor.py <pasta-fonte> <pasta-saida>
- corredor-*.jpg (2000 px de largura) viram corridor-*.jpg a 80%: cada imagem é uma SALA que
  ocupa a tela inteira (o jogo ajusta o resto com filtro suave).
A porta da chegada na arena tem folha própria: scripts/cut-prologue-door.py.
Ver docs/ART_PROMPTS.md §26 e src/config/prologueData.ts (medidas em pixels da imagem ORIGINAL).
"""
import sys
from PIL import Image

SEGMENTS = ['inicio', 'meio-a', 'meio-b', 'meio-c', 'fim']
SCALE = 0.8

src, out = sys.argv[1], sys.argv[2]
for name in SEGMENTS:
    im = Image.open(f'{src}/corredor-{name}.jpg').convert('RGB')
    small = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
    small.save(f'{out}/corridor-{name}.jpg', quality=88)
    print(name, small.size)

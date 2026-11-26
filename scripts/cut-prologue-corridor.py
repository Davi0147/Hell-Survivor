"""Prepara a arte do prólogo (corredor do escritório) para o jogo.

Uso: python scripts/cut-prologue-corridor.py <pasta-fonte> <pasta-saida>
- corredor-*.jpg (2000 px de largura) viram corridor-*.jpg a 80%: cada imagem é uma SALA que
  ocupa a tela inteira (o jogo ajusta o resto com filtro suave).
- A porta de saída do corredor-fim vira prologue-door.png, a porta por onde ela chega na arena.
Ver docs/ART_PROMPTS.md §26 e src/config/prologueData.ts (medidas em pixels da imagem ORIGINAL).
"""
import sys
from PIL import Image

SEGMENTS = ['inicio', 'meio-a', 'meio-b', 'meio-c', 'fim']
SCALE = 0.8
# Caixa da porta de saída no corredor-fim.jpg original (moldura de ferro, sem a parede em volta)
DOOR_BOX = (1508, 262, 1838, 624)
DOOR_HEIGHT = 160  # px na tela; o jogo desenha em 1/zoom da arena

src, out = sys.argv[1], sys.argv[2]
for name in SEGMENTS:
    im = Image.open(f'{src}/corredor-{name}.jpg').convert('RGB')
    small = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
    small.save(f'{out}/corridor-{name}.jpg', quality=88)
    print(name, small.size)

door = Image.open(f'{src}/corredor-fim.jpg').convert('RGB').crop(DOOR_BOX)
k = DOOR_HEIGHT / door.height
door = door.resize((round(door.width * k), DOOR_HEIGHT), Image.LANCZOS)
door.save(f'{out}/prologue-door.png')
print('porta', door.size)

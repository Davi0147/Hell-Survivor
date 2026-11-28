"""Prepara a arte da cena de derrota do Azazel (fim do Capítulo 2).

Uso: python scripts/cut-azazel-defeat.py art-source/novos/azazel-derrota public/assets
Fonte:
  EndChap2_1..7.jpg     -> scenes/chapter2/EndChap2_N.jpg (reduzidas à resolução do jogo)
  AzazelChat_Fraco.jpg  -> sprites/enemies/Azazel/AzazelChatFraco.png (fundo verde removido,
                           espelhado para olhar para a Nixy, quadrado como o AzazelChat normal)
"""
import os
import sys
import numpy as np
from PIL import Image, ImageOps
from spritecut import load_keyed, to_rgba, shrink

SCENE_W = 1280  # largura do jogo: maior que isso só gasta memória de vídeo no celular
PORTRAIT_SIZE = 460

src, out = sys.argv[1], sys.argv[2]
os.makedirs(f'{out}/scenes/chapter2', exist_ok=True)

for n in range(1, 8):
    im = Image.open(f'{src}/EndChap2_{n}.jpg').convert('RGB')
    small = im.resize((SCENE_W, round(im.height * SCENE_W / im.width)), Image.LANCZOS)
    small.save(f'{out}/scenes/chapter2/EndChap2_{n}.jpg', quality=86, optimize=True)
    print(f'EndChap2_{n}', small.size)

im, solid = load_keyed(f'{src}/AzazelChat_Fraco.jpg')
ys, xs = np.nonzero(solid)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
art = to_rgba(im, solid, x0, y0, x1, y1)
side = max(art.width, art.height)
square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
# Centralizado na horizontal e apoiado embaixo (o busto da cena é ancorado pela base)
square.paste(art, ((side - art.width) // 2, side - art.height))
portrait = ImageOps.mirror(shrink(square, PORTRAIT_SIZE / side))
portrait.save(f'{out}/sprites/enemies/Azazel/AzazelChatFraco.png')
print('AzazelChatFraco', portrait.size)

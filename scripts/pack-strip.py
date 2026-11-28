"""Junta quadros soltos do PixelLab numa tira horizontal (uma linha, quadros do mesmo tamanho).

Uso: python scripts/pack-strip.py <pasta com frame_000.png...> <saida.png> [--skip 3,5] [--crop]
  --skip  índices de quadros a descartar (ex.: um quadro com defeito)
  --crop  corta a sobra transparente em volta (a mesma caixa para todos os quadros)
Imprime o tamanho do quadro final (o jogo carrega a tira como spritesheet com esse tamanho).
"""
import glob
import os
import sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
skip = set()
crop = '--crop' in sys.argv
if '--skip' in sys.argv:
    skip = {int(s) for s in sys.argv[sys.argv.index('--skip') + 1].split(',')}

paths = sorted(glob.glob(os.path.join(src, 'frame_*.png')))
frames = [Image.open(p).convert('RGBA') for i, p in enumerate(paths) if i not in skip]
if not frames:
    sys.exit('nenhum quadro')

if crop:
    boxes = [f.getbbox() for f in frames if f.getbbox()]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    frames = [f.crop(box) for f in frames]

w, h = frames[0].size
strip = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
for i, f in enumerate(frames):
    strip.paste(f, (i * w, 0))
os.makedirs(os.path.dirname(out), exist_ok=True)
strip.save(out)
print(f'{os.path.basename(out)}: {len(frames)} quadros de {w}x{h}')

"""Recorta os funcionários do corredor do prólogo (fundo verde).

Uso: python scripts/cut-prologue-npcs.py <pasta-fonte> <pasta-saida>
Cada `npc-<id>.jpg` da fonte vira `npc-<id>.png` sem fundo, cortado rente à arte e reduzido para
NPC_HEIGHT px de altura (o jogo ajusta ao tamanho da sala com filtro suave).
Uma imagem com duas pessoas (ex.: npc-fofoqueiras) fica junta: é um NPC só.
Ver src/config/prologueData.ts (PROLOGUE_NPCS) e docs/ART_PROMPTS.md §26.
"""
import glob
import os
import sys
import numpy as np
from spritecut import load_keyed, to_rgba, shrink

NPC_HEIGHT = 220

src, out = sys.argv[1], sys.argv[2]
for path in sorted(glob.glob(f'{src}/npc-*.jpg')):
    name = os.path.splitext(os.path.basename(path))[0]
    im, solid = load_keyed(path)
    ys, xs = np.nonzero(solid)
    crop = to_rgba(im, solid, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    small = shrink(crop, NPC_HEIGHT / crop.height)
    small.save(f'{out}/{name}.png')
    print(name, small.size)

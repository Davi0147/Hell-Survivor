"""Recorta a folha da porta da chegada (Capítulo I) em uma tira de quadros iguais.

Uso: python scripts/cut-prologue-door.py <folha> <saida.png>
Folha: 8 colunas x 3 linhas de células iguais, fundo verde (prompt em docs/ART_PROMPTS.md §26).
  linha 1: subindo do chão no fogo (8 quadros) -> quadros 0..7
  linha 2: abrindo (4)                         -> quadros 8..11
  linha 3: fechando (4)                        -> quadros 12..15
Saída: tira horizontal de 16 quadros do tamanho da célula, sem fundo, mesma linha do chão.
Correção: na subida, a lanterna aparecia flutuando antes da porta sair do fogo. Nos quadros em
que a moldura ainda não saiu (FIRE_ONLY_FRAMES), tudo acima das chamas é apagado.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image
from spritecut import load_keyed

COLS, ROWS = 8, 3
ROW_FRAMES = [8, 4, 4]
FIRE_ONLY_FRAMES = {0, 1}


def largest_component_top(mask: np.ndarray) -> int:
    """Linha de cima da maior mancha (as chamas)."""
    H, W = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best_size, best_top = 0, H
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)])
        seen[y0, x0] = True
        size, top = 0, y0
        while q:
            y, x = q.popleft()
            size += 1
            top = min(top, y)
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    q.append((yy, xx))
        if size > best_size:
            best_size, best_top = size, top
    return best_top


sheet, out = sys.argv[1], sys.argv[2]
im, solid = load_keyed(sheet)
H, W = solid.shape
cw, ch = W // COLS, H // ROWS
frames = []
for row, count in enumerate(ROW_FRAMES):
    for col in range(count):
        x0, y0 = col * cw, row * ch
        rgb = im[y0:y0 + ch, x0:x0 + cw].copy()
        alpha = solid[y0:y0 + ch, x0:x0 + cw].copy()
        if row == 0 and col in FIRE_ONLY_FRAMES:
            alpha[:largest_component_top(alpha)] = False
        frames.append(np.dstack([rgb, np.where(alpha, 255, 0)]).astype(np.uint8))

strip = Image.fromarray(np.concatenate(frames, axis=1), 'RGBA')
strip.save(out)
print('porta', len(frames), 'quadros de', cw, 'x', ch)

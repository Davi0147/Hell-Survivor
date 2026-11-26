"""Recorta as duas folhas dos talismãs.

Uso: python -I scripts/cut-talismans.py

1. art-source/novos/talismas.jpg (fundo verde, 3 linhas x 5 colunas): os 15 ícones, na ordem
   de ICON_IDS, em public/assets/sprites/talismans/icon-<id>.png.
2. art-source/novos/talisma-evolucao.jpg (fundo magenta, 2 linhas x 5 colunas): o talismã em
   cada raridade (linha 1) e rachando (linha 2), em talisman-<raridade>.png / -open.png.
   Os 10 saem com a MESMA tela, com o topo da corrente no mesmo ponto (centro, topo): é o
   pivô do pêndulo, e a troca de raridade não pula.

As folhas foram geradas com grade de pixel irregular (7 a 8 px), então em vez de amostrar
bloco a bloco reduzimos à metade com filtro de qualidade (fica nítido no tamanho de tela).
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from spritecut import row_bands  # noqa: E402

OUT = 'public/assets/sprites/talismans'
SHRINK = 0.5
MIN_SPECK = 40

ICON_SHEET = 'art-source/novos/talismas.jpg'
# Mesma ordem da folha (linha 1 pets, linha 2 armas, linha 3 ativos; comum -> lendário)
ICON_IDS = [
    'pet_bat', 'pet_slime', 'pet_hound', 'pet_cerberus', 'pet_twin',
    'wpn_chain_spark', 'wpn_bone_spikes', 'wpn_frost_ring', 'wpn_abyss_eye', 'wpn_hell_pillar',
    'act_shadow_burst', 'act_bone_shield', 'act_vortex', 'act_blood_heart', 'act_meteor_rain',
]

EVO_SHEET = 'art-source/novos/talisma-evolucao.jpg'
RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
# Meia largura e altura da tela comum dos 10 talismãs (px na folha; cabe a asa do lendário)
EVO_HALF_W = 250
EVO_H = 500


def clean_edges(rgb: np.ndarray, mask: np.ndarray, is_bg_tint) -> np.ndarray:
    """Tira da borda os pixels tingidos pelo fundo (só os que encostam no fundo)."""
    H, W = mask.shape
    edge = np.zeros_like(mask)
    edge[1:, :] |= mask[1:, :] & ~mask[:-1, :]
    edge[:-1, :] |= mask[:-1, :] & ~mask[1:, :]
    edge[:, 1:] |= mask[:, 1:] & ~mask[:, :-1]
    edge[:, :-1] |= mask[:, :-1] & ~mask[:, 1:]
    out = mask.copy()
    for _ in range(2):  # duas camadas de franja
        tinted = edge & is_bg_tint(rgb)
        out &= ~tinted
        edge = np.zeros_like(out)
        edge[1:, :] |= out[1:, :] & ~out[:-1, :]
        edge[:-1, :] |= out[:-1, :] & ~out[1:, :]
        edge[:, 1:] |= out[:, 1:] & ~out[:, :-1]
        edge[:, :-1] |= out[:, :-1] & ~out[:, 1:]
    return out


def save_rgba(rgb: np.ndarray, mask: np.ndarray, box: tuple[int, int, int, int], path: str) -> Image.Image:
    x0, y0, x1, y1 = box
    rgba = np.zeros((y1 - y0, x1 - x0, 4), dtype=np.uint8)
    sub_rgb = rgb[max(0, y0):y1, max(0, x0):x1]
    sub_m = mask[max(0, y0):y1, max(0, x0):x1]
    oy, ox = max(0, y0) - y0, max(0, x0) - x0
    rgba[oy:oy + sub_rgb.shape[0], ox:ox + sub_rgb.shape[1], :3] = np.clip(sub_rgb, 0, 255)
    rgba[oy:oy + sub_m.shape[0], ox:ox + sub_m.shape[1], 3] = sub_m * 255
    img = Image.fromarray(rgba, 'RGBA')
    img = img.resize((round(img.width * SHRINK), round(img.height * SHRINK)), Image.Resampling.LANCZOS)
    # Alfa sem meio-termo: o jogo desenha em pixel art (sem suavização)
    a = np.array(img.getchannel('A'))
    img.putalpha(Image.fromarray(np.where(a >= 128, 255, 0).astype(np.uint8)))
    img.save(path)
    return img


def background_from_edges(is_bg: np.ndarray) -> np.ndarray:
    """Fundo = só a cor de fundo ligada à borda da folha. Verde fechado dentro de um desenho
    (a gema do morcego) é arte, não fundo."""
    # Cresce a partir da moldura da folha, só por cima da cor de fundo (o floodfill do Pillow 13
    # não preenche imagens 'L')
    reached = np.zeros_like(is_bg)
    reached[0, :] = is_bg[0, :]
    reached[-1, :] = is_bg[-1, :]
    reached[:, 0] = is_bg[:, 0]
    reached[:, -1] = is_bg[:, -1]
    while True:
        grown = reached.copy()
        grown[1:, :] |= reached[:-1, :]
        grown[:-1, :] |= reached[1:, :]
        grown[:, 1:] |= reached[:, :-1]
        grown[:, :-1] |= reached[:, 1:]
        grown &= is_bg
        if grown.sum() == reached.sum():
            return grown
        reached = grown


def cut_icons() -> None:
    rgb = np.array(Image.open(ICON_SHEET).convert('RGB')).astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green = (g - np.maximum(r, b) > 60) & (g > 110)
    bg = background_from_edges(green)
    # Verde fechado dentro de um desenho: buraco (verde de chroma, pouco azul) ou arte (a gema
    # esmeralda do morcego tem azul ~128). Medido na folha: buracos b~50 ou g>245.
    enclosed = green & ~bg
    holes = enclosed & ((b < 100) | ((g > 245) & (r < 110)))
    mask = ~(bg | holes)
    label, info = label_components(mask)
    keep = np.array([s >= MIN_SPECK for s, _ in info])
    keep[0] = False
    mask = keep[label]
    green_tint = lambda c: (c[..., 1] > c[..., 0] + 25) & (c[..., 1] > c[..., 2] + 25)  # noqa: E731
    mask = clean_edges(rgb, mask, green_tint)
    rows = row_bands(mask)
    assert len(rows) == 3, f'esperava 3 linhas de ícones, achei {len(rows)}'
    W = mask.shape[1]
    cell = W // 5
    for r, (y0, y1) in enumerate(rows):
        for c in range(5):
            x0, x1 = c * cell, (c + 1) * cell
            sub = mask[y0:y1, x0:x1]
            ys, xs = np.nonzero(sub.any(axis=1))[0], np.nonzero(sub.any(axis=0))[0]
            box = (x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1)
            name = ICON_IDS[r * 5 + c]
            img = save_rgba(rgb, mask, box, f'{OUT}/icon-{name}.png')
            print('icon', name, box, '->', img.size)


def label_components(mask: np.ndarray) -> tuple[np.ndarray, list[tuple[int, float]]]:
    """Rótulo de cada mancha (8 vizinhos) e, por rótulo, (tamanho, x médio)."""
    H, W = mask.shape
    label = np.zeros((H, W), dtype=np.int32)
    info: list[tuple[int, float]] = [(0, 0.0)]
    for y0, x0 in zip(*np.nonzero(mask)):
        if label[y0, x0]:
            continue
        n = len(info)
        label[y0, x0] = n
        q = deque([(y0, x0)])
        count, sx = 0, 0
        while q:
            y, x = q.popleft()
            count += 1
            sx += x
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not label[yy, xx]:
                        label[yy, xx] = n
                        q.append((yy, xx))
        info.append((count, sx / count))
    return label, info


def cut_evolution() -> None:
    rgb = np.array(Image.open(EVO_SHEET).convert('RGB')).astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mask = ~((r > 170) & (b > 170) & (g < 110))
    pink_tint = lambda c: (c[..., 0] > c[..., 1] + 50) & (c[..., 2] > c[..., 1] + 50) & (c[..., 0] > 150)  # noqa: E731
    mask = clean_edges(rgb, mask, pink_tint)
    label, info = label_components(mask)
    keep = np.array([s >= MIN_SPECK for s, _ in info])
    keep[0] = False
    mask = keep[label]

    rows = row_bands(mask)
    assert len(rows) == 2, f'esperava 2 linhas de talismãs, achei {len(rows)}'
    for ri, (y0, y1) in enumerate(rows):
        # Corrente: só ela aparece nas primeiras linhas da faixa; acha o x de cada uma
        top = mask[y0:y0 + 40].any(axis=0)
        chains, start = [], None
        for x, has in enumerate(top):
            if has and start is None:
                start = x
            elif not has and start is not None:
                chains.append((start + x) / 2)
                start = None
        assert len(chains) == 5, f'linha {ri + 1}: esperava 5 correntes, achei {len(chains)}'
        # Divisa entre vizinhos: a coluna mais vazia entre as duas correntes (a asa do épico
        # encosta na do lendário, então "mancha mais perto" juntava os dois)
        cols = mask[y0:y1].sum(axis=0)
        cuts = [0]
        for a, b2 in zip(chains, chains[1:]):
            lo, hi = round(a) + 60, round(b2) - 60
            cuts.append(lo + int(np.argmin(cols[lo:hi])))
        cuts.append(mask.shape[1])
        for ci, cx in enumerate(chains):
            mine = np.zeros_like(mask)
            mine[y0:y1, cuts[ci]:cuts[ci + 1]] = mask[y0:y1, cuts[ci]:cuts[ci + 1]]
            box = (round(cx) - EVO_HALF_W, y0, round(cx) + EVO_HALF_W, y0 + EVO_H)
            name = f'talisman-{RARITIES[ci]}' + ('-open' if ri == 1 else '')
            img = save_rgba(rgb, mine, box, f'{OUT}/{name}.png')
            print('evo', name, box, '->', img.size)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    cut_icons()
    cut_evolution()


if __name__ == '__main__':
    main()

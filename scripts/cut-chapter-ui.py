"""Recorta art-source/novos/capitulos-ui.jpg (fundo verde) nas 16 peças da tela de capítulos.

Uso: python -I scripts/cut-chapter-ui.py
O gerador escreveu o nome de cada peça embaixo dela, então cada peça tem uma caixa (px na
folha de 2000x1116) que deixa o nome de fora, e algumas têm retângulos extras a apagar
(nome que encosta na peça). O recorte aperta a caixa até a arte. Saem em tamanho cheio em
public/assets/sprites/chapters/ui/ (o jogo reduz; as molduras viram NineSlice).
"""
import os

import numpy as np
from PIL import Image

SRC = 'art-source/novos/capitulos-ui.jpg'
OUT = 'public/assets/sprites/chapters/ui'

# nome -> (caixa x0, y0, x1, y1, [retângulos a apagar])
PIECES = {
    'frame-normal': ((20, 18, 338, 500), []),
    'frame-selected': ((368, 18, 688, 500), []),
    'frame-locked': ((722, 18, 1040, 572), [(762, 500, 1000, 532)]),
    'coming-soon-bg': ((1072, 14, 1712, 500), []),
    'sealed-chains': ((1726, 30, 1990, 490), []),
    'title-plaque': ((20, 545, 740, 800), []),
    'heading-ribbon': ((812, 595, 1404, 722), [(925, 700, 1290, 735)]),
    'best-time-plate': ((855, 750, 1360, 848), []),
    'text-panel': ((1488, 585, 1985, 848), []),
    'button-normal': ((20, 930, 385, 1070), []),
    'button-selected': ((410, 930, 775, 1070), []),
    'badge-unlocked': ((826, 888, 1004, 1084), []),
    'badge-locked': ((1076, 888, 1254, 1084), []),
    'padlock': ((1322, 880, 1490, 1084), []),
    'cleared-seal': ((1538, 892, 1732, 1084), []),
    'arrow': ((1760, 935, 1990, 1048), []),
}


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """Fundo = verde ligado à borda da folha; verde de chroma fechado dentro de uma peça (o miolo
    das molduras) também é fundo."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green = (g - np.maximum(r, b) > 60) & (g > 110)
    reached = np.zeros_like(green)
    reached[0, :], reached[-1, :], reached[:, 0], reached[:, -1] = green[0, :], green[-1, :], green[:, 0], green[:, -1]
    while True:
        grown = reached.copy()
        grown[1:, :] |= reached[:-1, :]
        grown[:-1, :] |= reached[1:, :]
        grown[:, 1:] |= reached[:, :-1]
        grown[:, :-1] |= reached[:, 1:]
        grown &= green
        if grown.sum() == reached.sum():
            break
        reached = grown
    holes = green & ~reached & ((b < 100) | (g > 235))
    return reached | holes


def clean_fringe(rgb: np.ndarray, solid: np.ndarray) -> np.ndarray:
    """Tira duas camadas de pixels esverdeados encostados no fundo."""
    out = solid.copy()
    tint = (rgb[..., 1] > rgb[..., 0] + 25) & (rgb[..., 1] > rgb[..., 2] + 25)
    for _ in range(2):
        edge = np.zeros_like(out)
        edge[1:, :] |= out[1:, :] & ~out[:-1, :]
        edge[:-1, :] |= out[:-1, :] & ~out[1:, :]
        edge[:, 1:] |= out[:, 1:] & ~out[:, :-1]
        edge[:, :-1] |= out[:, :-1] & ~out[:, 1:]
        out &= ~(edge & tint)
    return out


def main() -> None:
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(int)
    solid = clean_fringe(rgb, ~background_mask(rgb))
    os.makedirs(OUT, exist_ok=True)
    for name, ((x0, y0, x1, y1), erase) in PIECES.items():
        mask = np.zeros_like(solid)
        mask[y0:y1, x0:x1] = solid[y0:y1, x0:x1]
        for ex0, ey0, ex1, ey1 in erase:
            mask[ey0:ey1, ex0:ex1] = False
        ys = np.nonzero(mask.any(axis=1))[0]
        xs = np.nonzero(mask.any(axis=0))[0]
        bx0, by0, bx1, by1 = xs[0], ys[0], xs[-1] + 1, ys[-1] + 1
        rgba = np.zeros((by1 - by0, bx1 - bx0, 4), dtype=np.uint8)
        rgba[..., :3] = np.clip(rgb[by0:by1, bx0:bx1], 0, 255)
        rgba[..., 3] = mask[by0:by1, bx0:bx1] * 255
        img = Image.fromarray(rgba, 'RGBA')
        if name == 'best-time-plate':
            img = split_hourglass(img)
        if name == 'sealed-chains':
            split_chains(img)
        img.save(f'{OUT}/{name}.png')
        print(name, (bx0, by0, bx1, by1), '->', (bx1 - bx0, by1 - by0))


# Placa do tempo: a caixa da ampulheta é mais alta que a barra e cobre a borda dourada
# (parecia vazar). Sai uma placa lisa (a coluna vazia do meio repetida no lugar da caixa) e a
# ampulheta à parte, só o vidro, que o jogo põe menor dentro da barra.
HOURGLASS_BOX_X = (26, 86)
HOURGLASS_GLASS = (35, 14, 78, 73)
PLATE_EMPTY_COLUMN = 200


# Correntes em X: na tela elas vão de canto a canto do painel aberto (mais largo que alto),
# e esticar a peça deformava os elos. Sai uma faixa reta de corrente (um braço do X girado
# para a horizontal, cortada num período exato de elos, que repete sem emenda) e o cadeado do
# cruzamento à parte. Medido na peça: braço a 62,2° da horizontal, elos a cada 45 px.
CHAIN_ARM_DEG = 62.2
CHAIN_STRIP = (95, 188, 140, 219)
CHAIN_LOCK = (72, 168, 164, 290)


def split_chains(chains: Image.Image) -> None:
    rot = chains.rotate(CHAIN_ARM_DEG, resample=Image.NEAREST, expand=True)
    rot.crop(CHAIN_STRIP).save(f'{OUT}/chain-strip.png')
    chains.crop(CHAIN_LOCK).save(f'{OUT}/chain-lock.png')


def split_hourglass(plate: Image.Image) -> Image.Image:
    plate.crop(HOURGLASS_GLASS).save(f'{OUT}/hourglass.png')
    out = plate.copy()
    column = plate.crop((PLATE_EMPTY_COLUMN, 0, PLATE_EMPTY_COLUMN + 1, plate.height))
    for x in range(*HOURGLASS_BOX_X):
        out.paste(column, (x, 0))
    return out


if __name__ == '__main__':
    main()

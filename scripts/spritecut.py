"""Funções comuns de recorte de folhas com fundo verde (usadas por cut-pets.py e cut-twin.py)."""
from collections import deque
import numpy as np
from PIL import Image

MIN_SPECK = 30  # manchas menores que isso (px na folha) são ruído do JPG


def load_keyed(path: str) -> tuple[np.ndarray, np.ndarray]:
    """Abre a folha e devolve (rgb, máscara da arte). Fundo = verde dominante (puro ou escuro)."""
    im = np.array(Image.open(path).convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    solid = ~((g - np.maximum(r, b) > 60) & (g > 110))
    # Franja de mistura (pixel meio verde na borda): tira o verde sobrando
    spill = solid & (g > np.maximum(r, b))
    im[spill, 1] = np.maximum(r, b)[spill]
    return im, drop_specks(solid)


def drop_specks(solid: np.ndarray) -> np.ndarray:
    """Some com pontinhos isolados de ruído (rotulagem simples, 4-vizinhos)."""
    H, W = solid.shape
    label = np.zeros((H, W), dtype=np.int32)
    sizes = [0]
    for y0, x0 in zip(*np.nonzero(solid)):
        if label[y0, x0]:
            continue
        n = len(sizes)
        label[y0, x0] = n
        q = deque([(y0, x0)])
        count = 0
        while q:
            y, x = q.popleft()
            count += 1
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and solid[yy, xx] and not label[yy, xx]:
                    label[yy, xx] = n
                    q.append((yy, xx))
        sizes.append(count)
    keep = np.array(sizes) >= MIN_SPECK
    keep[0] = False
    return keep[label]


def row_bands(solid: np.ndarray, min_height: int = 40) -> list[tuple[int, int]]:
    """Faixas de linha: trechos com arte separados por faixas totalmente vazias."""
    rows = solid.any(axis=1)
    bands, start = [], None
    for y, has in enumerate(rows):
        if has and start is None:
            start = y
        elif not has and start is not None:
            bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, len(rows)))
    return [bd for bd in bands if bd[1] - bd[0] > min_height]


def to_rgba(im: np.ndarray, solid: np.ndarray, x0: int, y0: int, x1: int, y1: int) -> Image.Image:
    a = np.where(solid[y0:y1, x0:x1], 255, 0)
    return Image.fromarray(np.dstack([im[y0:y1, x0:x1], a]).astype(np.uint8), 'RGBA')


def shrink(img: Image.Image, k: float) -> Image.Image:
    """Reduz pelo fator k mantendo borda dura de pixel art."""
    size = (max(1, round(img.width * k)), max(1, round(img.height * k)))
    arr = np.array(img.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA'))
    arr[..., 3] = np.where(arr[..., 3] >= 110, 255, 0)
    return Image.fromarray(arr, 'RGBA')

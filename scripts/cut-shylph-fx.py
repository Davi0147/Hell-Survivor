"""Recorta as artes de efeito da Shylph (fundo verde) e monta as folhas do jogo.

Entrada:  art-source/novos/shylph/furacao.jpg  (11 quadros em 2 fileiras)
          art-source/novos/shylph/serafim.jpg  (2 quadros: asas em cima | asas embaixo)
Saida:    public/assets/sprites/enemies/Shylph/shylph-tornado.png  (quadros lado a lado)
          public/assets/sprites/enemies/Shylph/shylph-seraph.png   (2 quadros lado a lado)
          src/config/shylphFxSheet.ts  (tamanho dos quadros, gerado)

A arte veio com cada pixel desenhado ocupando ~4 pixels da imagem: reduzimos 4x pegando o
centro de cada bloco (sem borrar). O furacao e alinhado pelo pe (base no chao) e o Serafim
pelo olho, para a animacao nao tremer.
Uso: python scripts/cut-shylph-fx.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-source", "novos", "shylph")
OUT = os.path.join(ROOT, "public", "assets", "sprites", "enemies", "Shylph")
TS_OUT = os.path.join(ROOT, "src", "config", "shylphFxSheet.ts")
ART_PIXEL = 4


def key_green(im):
    """Fundo verde vira transparente; borda esverdeada do JPG perde o verde."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            m = max(r, b)
            if g > 140 and g - m > 70:
                px[x, y] = (0, 0, 0, 0)
            elif g > m + 18:
                px[x, y] = (r, m, b, 255)
    return im


def spans(counts, min_gap, min_size, thresh=2):
    """Trechos ocupados de uma projecao (colunas ou linhas), separados por vaos vazios."""
    out, start, gap = [], None, 0
    for i, c in enumerate(counts + [0] * (min_gap + 1)):
        if c > thresh:
            if start is None:
                start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                end = i - gap + 1
                if end - start >= min_size:
                    out.append((start, end))
                start, gap = None, 0
    return out


def alpha_counts(im, axis):
    a = im.getchannel("A").point(lambda v: 1 if v else 0)
    w, h = im.size
    data = a.load()
    if axis == "x":
        return [sum(data[x, y] for y in range(h)) for x in range(w)]
    return [sum(data[x, y] for x in range(w)) for y in range(h)]


def shrink(im):
    w, h = im.size
    small = im.resize((max(1, w // ART_PIXEL), max(1, h // ART_PIXEL)), Image.NEAREST)
    a = small.getchannel("A").point(lambda v: 255 if v > 0 else 0)
    small.putalpha(a)
    return small


def tornado_frames():
    im = key_green(Image.open(os.path.join(SRC, "furacao.jpg")))
    frames = []
    for (y0, y1) in spans(alpha_counts(im, "y"), 20, 200):
        row = im.crop((0, y0, im.width, y1))
        # Os redemoinhos de baixo quase se encostam e as particulas fazem ponte: acha os
        # corpos com um limite alto e corta no meio dos vaos (as particulas ficam no quadro)
        bodies = spans(alpha_counts(row, "x"), 3, 100, thresh=40)
        cuts = [0] + [(a[1] + b[0]) // 2 for a, b in zip(bodies, bodies[1:])] + [row.width]
        for x0, x1 in zip(cuts, cuts[1:]):
            f = row.crop((x0, 0, x1, row.height))
            frames.append(f.crop(f.getbbox()))
    # Canvas comum alinhado pelo pe (centro de baixo)
    fw = max(f.width for f in frames)
    fh = max(f.height for f in frames)
    out = []
    for f in frames:
        c = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        c.paste(f, ((fw - f.width) // 2, fh - f.height), f)
        out.append(shrink(c))
    return out


def eye_center(im):
    """Centro da iris vermelha (parte bem vermelha perto do meio do quadro)."""
    px = im.load()
    w, h = im.size
    xs = ys = n = 0
    for y in range(h // 4, h * 3 // 4):
        for x in range(w // 4, w * 3 // 4):
            r, g, b, a = px[x, y]
            if a and r > 150 and g < 70 and b < 70:
                xs += x
                ys += y
                n += 1
    return (xs / n, ys / n) if n else (w / 2, h / 2)


def seraph_frames():
    im = key_green(Image.open(os.path.join(SRC, "serafim.jpg")))
    cols = spans(alpha_counts(im, "x"), 25, 300)
    frames = []
    for (x0, x1) in cols:
        f = im.crop((x0, 0, x1, im.height))
        frames.append(f.crop(f.getbbox()))
    eyes = [eye_center(f) for f in frames]
    # Canvas comum com os olhos no mesmo ponto
    left = max(e[0] for e in eyes)
    top = max(e[1] for e in eyes)
    right = max(f.width - e[0] for f, e in zip(frames, eyes))
    bottom = max(f.height - e[1] for f, e in zip(frames, eyes))
    cw, ch = int(left + right) + 1, int(top + bottom) + 1
    out = []
    for f, e in zip(frames, eyes):
        c = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        c.paste(f, (int(left - e[0]), int(top - e[1])), f)
        out.append(shrink(c))
    eye_y = top / ART_PIXEL
    return out, eye_y


def strip(frames):
    w, h = frames[0].size
    s = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        s.paste(f, (i * w, 0), f)
    return s


def main():
    os.makedirs(OUT, exist_ok=True)
    tor = tornado_frames()
    strip(tor).save(os.path.join(OUT, "shylph-tornado.png"), optimize=True)
    ser, eye_y = seraph_frames()
    strip(ser).save(os.path.join(OUT, "shylph-seraph.png"), optimize=True)
    tw, th = tor[0].size
    sw, sh = ser[0].size
    lines = [
        "// Gerado por scripts/cut-shylph-fx.py. Nao edite a mao: rode o script de novo.",
        "/** Folhas de efeito da Shylph: furacao do Vendaval e forma de Serafim. */",
        f"export const SHYLPH_TORNADO_SHEET = {{ frameWidth: {tw}, frameHeight: {th}, frames: {len(tor)} }} as const;",
        f"export const SHYLPH_SERAPH_SHEET = {{ frameWidth: {sw}, frameHeight: {sh}, frames: {len(ser)}, eyeY: {round(eye_y)} }} as const;",
        "",
    ]
    with open(TS_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))
    print(f"furacao: {len(tor)} quadros de {tw}x{th}; serafim: {len(ser)} quadros de {sw}x{sh}, olho em y={eye_y:.0f}")


if __name__ == "__main__":
    main()

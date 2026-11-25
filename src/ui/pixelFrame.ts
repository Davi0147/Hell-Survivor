import Phaser from 'phaser';

export interface PixelFrameStyle {
  fill: number;
  fillAlpha?: number;
  border: number;
  borderAlpha?: number;
  /** Faixa clara logo abaixo da borda de cima (relevo de pixel art). */
  highlight?: number;
  /** Faixa escura logo acima da borda de baixo. */
  shade?: number;
  /** Tamanho do "pixel" da moldura em pixels de tela. */
  px?: number;
}

/**
 * Moldura em estilo pixel art: só retângulos cheios, borda grossa e cantos em degrau.
 * Substitui `strokeRoundedRect` (linha fina e curva suave destoam da arte do jogo).
 */
export function drawPixelFrame(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  style: PixelFrameStyle
): void {
  const p = style.px ?? 4;
  const ba = style.borderAlpha ?? 1;

  g.fillStyle(style.fill, style.fillAlpha ?? 1);
  g.fillRect(x + p, y + p, w - 2 * p, h - 2 * p);

  if (style.highlight !== undefined) {
    g.fillStyle(style.highlight, 1);
    g.fillRect(x + 2 * p, y + p, w - 4 * p, p);
  }
  if (style.shade !== undefined) {
    g.fillStyle(style.shade, 1);
    g.fillRect(x + 2 * p, y + h - 2 * p, w - 4 * p, p);
  }

  g.fillStyle(style.border, ba);
  g.fillRect(x + 2 * p, y, w - 4 * p, p);
  g.fillRect(x + 2 * p, y + h - p, w - 4 * p, p);
  g.fillRect(x, y + 2 * p, p, h - 4 * p);
  g.fillRect(x + w - p, y + 2 * p, p, h - 4 * p);
  // Degrau de cada canto
  g.fillRect(x + p, y + p, p, p);
  g.fillRect(x + w - 2 * p, y + p, p, p);
  g.fillRect(x + p, y + h - 2 * p, p, p);
  g.fillRect(x + w - 2 * p, y + h - 2 * p, p, p);
}

/** Só o contorno em degrau (sem fundo), para brilho de foco por fora de uma moldura. */
export function drawPixelOutline(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  alpha: number,
  px = 4
): void {
  const p = px;
  g.fillStyle(color, alpha);
  g.fillRect(x + 2 * p, y, w - 4 * p, p);
  g.fillRect(x + 2 * p, y + h - p, w - 4 * p, p);
  g.fillRect(x, y + 2 * p, p, h - 4 * p);
  g.fillRect(x + w - p, y + 2 * p, p, h - 4 * p);
  g.fillRect(x + p, y + p, p, p);
  g.fillRect(x + w - 2 * p, y + p, p, p);
  g.fillRect(x + p, y + h - 2 * p, p, p);
  g.fillRect(x + w - 2 * p, y + h - 2 * p, p, p);
}

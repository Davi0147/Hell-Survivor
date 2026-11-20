/** Retângulo visível do mundo (já descontada a folga das bordas). */
export interface ViewRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Ponto de tiro da Arqueira: a `range` px da heroína, do lado em que a arqueira já está, e
 * DENTRO da tela. A tela é mais larga que alta: se não cabe em cima/embaixo, o ponto escorrega
 * para o lado mantendo a distância (antes ela ia e voltava sem parar na borda de cima).
 * Função pura (testável).
 */
export function archerStandoffPoint(
  px: number,
  py: number,
  ax: number,
  ay: number,
  range: number,
  view?: ViewRect
): { x: number; y: number } {
  const dx = ax - px;
  const dy = ay - py;
  const len = Math.hypot(dx, dy) || 1;
  let tx = px + (dx / len) * range;
  let ty = py + (dy / len) * range;
  if (!view || view.right <= view.left || view.bottom <= view.top) return { x: tx, y: ty };

  const cy = clamp(ty, view.top, view.bottom);
  if (cy !== ty) {
    const side = Math.sqrt(Math.max(0, range * range - (cy - py) ** 2));
    tx = px + (dx >= 0 ? 1 : -1) * side;
    ty = cy;
  }
  const cx = clamp(tx, view.left, view.right);
  if (cx !== tx) {
    const side = Math.sqrt(Math.max(0, range * range - (cx - px) ** 2));
    ty = clamp(py + (dy >= 0 ? 1 : -1) * side, view.top, view.bottom);
    tx = cx;
  }
  return { x: tx, y: ty };
}

/** Está dentro da área segura da tela? Sem área conhecida, considera que sim. */
export function isInsideView(x: number, y: number, view?: ViewRect): boolean {
  if (!view) return true;
  return x >= view.left && x <= view.right && y >= view.top && y <= view.bottom;
}

/**
 * Parada com folga dupla (para não tremer na borda): começa a mirar quando chega a
 * `holdPx` do ponto de tiro e só volta a andar se ficar a mais de `holdPx * 1.6` dele.
 */
export function shouldHold(distToPoint: number, holdPx: number, wasHolding: boolean): boolean {
  return distToPoint <= (wasHolding ? holdPx * 1.6 : holdPx);
}

/**
 * Durante a puxada do arco ela só desiste se a heroína avançar bem para dentro da distância
 * segura (abaixo de 75% de `minRange`); assim um passinho não cancela todo tiro.
 */
export function shouldAbortDraw(dist: number, minRange: number): boolean {
  return dist < minRange * 0.75;
}

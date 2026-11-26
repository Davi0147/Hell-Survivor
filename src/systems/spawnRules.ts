/**
 * Onde a horda nasce em relação à tela. Sem Phaser, para testar.
 *
 * A distância sorteada (ex.: 340 a 480 px da heroína) foi pensada para o zoom antigo (2x).
 * Com a câmera mais afastada, ou num celular largo, parte desses pontos cai DENTRO da tela
 * e o monstro brota na frente do jogador. Aqui a distância nunca fica menor que a borda da
 * área visível naquela direção, mais uma folga.
 */

/** Distância do centro até a borda de um retângulo (meia largura/altura) na direção `angle`. */
export function distanceToViewEdge(angle: number, halfW: number, halfH: number): number {
  const c = Math.abs(Math.cos(angle));
  const s = Math.abs(Math.sin(angle));
  const toSide = c > 1e-6 ? halfW / c : Infinity;
  const toTopBottom = s > 1e-6 ? halfH / s : Infinity;
  return Math.min(toSide, toTopBottom);
}

/** A distância sorteada, empurrada para fora da tela quando precisaria nascer à vista. */
export function offscreenSpawnDist(angle: number, rolledDist: number, halfW: number, halfH: number, margin: number): number {
  return Math.max(rolledDist, distanceToViewEdge(angle, halfW, halfH) + margin);
}

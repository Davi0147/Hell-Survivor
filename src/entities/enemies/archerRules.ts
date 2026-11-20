/** O que a Arqueira faz neste quadro, dada a distância até a heroína. Função pura (testável). */
export type ArcherMove = 'approach' | 'retreat' | 'hold';

/**
 * - Perto demais (< minRange): recua.
 * - Longe demais (> maxRange) ou fora da tela: chega mais perto. Nunca atira de onde o jogador não vê.
 * - Na faixa e visível: para e atira.
 */
export function decideArcherMove(dist: number, minRange: number, maxRange: number, isOnScreen: boolean = true): ArcherMove {
  if (dist < minRange) return 'retreat';
  if (dist > maxRange || !isOnScreen) return 'approach';
  return 'hold';
}

/**
 * Durante a puxada do arco ela só desiste se a heroína avançar bem para dentro da distância
 * segura (abaixo de 75% de `minRange`); assim um passinho não cancela todo tiro.
 */
export function shouldAbortDraw(dist: number, minRange: number): boolean {
  return dist < minRange * 0.75;
}

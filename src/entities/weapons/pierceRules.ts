/**
 * Quanta perfuração sobra depois de um projétil acertar um inimigo.
 * Inimigos-escudo (`blocksPierce`, ex.: Colossus) param o projétil na hora.
 * Função pura (sem Phaser) para ser testável.
 */
export function remainingPierce(pierce: number, enemy: { blocksPierce: boolean }): number {
  if (enemy.blocksPierce) return 0;
  return pierce - 1;
}

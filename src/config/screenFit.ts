/** Tamanho lógico do jogo conforme o formato da tela. Puro (sem Phaser), para ser testável. */

/** Altura fixa do jogo: o tamanho das coisas na tela nunca muda. */
export const GAME_HEIGHT = 720;
/** Largura mínima (16:9) e máxima (21:9, celulares e monitores ultrawide). */
export const GAME_MIN_WIDTH = 1280;
export const GAME_MAX_WIDTH = 1680;

/**
 * Largura do jogo para uma tela: segue o formato do aparelho (sem borda preta nos lados
 * do celular), entre 16:9 e 21:9. Em retrato ou telas mais "quadradas" fica em 16:9.
 * Função pura, testável.
 */
export function getGameWidthForScreen(screenWidth: number, screenHeight: number): number {
  if (!(screenWidth > 0) || !(screenHeight > 0)) return GAME_MIN_WIDTH;
  const wanted = Math.round((GAME_HEIGHT * screenWidth) / screenHeight);
  const clamped = Math.min(GAME_MAX_WIDTH, Math.max(GAME_MIN_WIDTH, wanted));
  // Par, para o centro da tela cair num pixel inteiro
  return clamped - (clamped % 2);
}

/**
 * O que fazer quando o Altar de Ascensão chega a 100%.
 * O altar nasce quando existe arma pronta para evoluir, mas a evolução pode sair antes por
 * outro caminho (o baú dá preferência a evoluções). Sem carta, abrir a tela travava o jogo:
 * nesse caso o altar vira um prêmio no chão em vez de abrir a escolha.
 */
export type AltarCompletion = 'open-cards' | 'fallback-reward';

export function altarCompletionAction(evolutionCardsAvailable: number): AltarCompletion {
  return evolutionCardsAvailable > 0 ? 'open-cards' : 'fallback-reward';
}

/** A tela de cartas do altar abriu sem carta nenhuma? Então fecha e devolve o jogo. */
export function shouldAutoCloseAltarScreen(isAltar: boolean, cardsShown: number): boolean {
  return isAltar && cardsShown === 0;
}

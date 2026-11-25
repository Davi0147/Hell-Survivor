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

export type AltarPresence = 'spawn' | 'despawn' | 'wait' | 'keep';

/**
 * O Altar de Ascensão existe enquanto houver arma pronta para evoluir (decisão do dono,
 * 2026-11-25): surge `delayMs` depois de uma arma chegar ao máximo e some quando não
 * sobra nenhuma (evoluiu a única). Upar outra até o máximo faz ele voltar.
 * `waitedMs` = quanto tempo já existe arma pronta sem altar no mapa.
 */
export function altarPresence(hasAltar: boolean, evolvable: number, waitedMs: number, delayMs: number): AltarPresence {
  if (hasAltar) return evolvable > 0 ? 'keep' : 'despawn';
  if (evolvable === 0) return 'keep';
  return waitedMs >= delayMs ? 'spawn' : 'wait';
}

/** A tela de cartas do altar abriu sem carta nenhuma? Então fecha e devolve o jogo. */
export function shouldAutoCloseAltarScreen(isAltar: boolean, cardsShown: number): boolean {
  return isAltar && cardsShown === 0;
}

/**
 * Guarda anti-travamento: a partida pausada sem nenhuma tela que explique a pausa
 * (cartas, baú, talismã, menu de pausa, fim de jogo, diálogo) por mais de `STUCK_PAUSE_MS`
 * é retomada sozinha. Já aconteceu de uma tela de cartas quebrar e deixar o jogo pausado
 * atrás de um clarão para sempre; esta guarda impede que um erro novo assim trave a partida.
 */
export const STUCK_PAUSE_MS = 1500;

export interface PauseGuardState {
  gamePaused: boolean;
  upgradeScreenActive: boolean;
  rewardModalOpen: boolean;
  pauseMenuOpen: boolean;
  dialogueActive: boolean;
  gameOverOrChapterEnd: boolean;
}

/** A pausa está "órfã" (ninguém na tela segura o jogo pausado)? */
export function isOrphanPause(s: PauseGuardState): boolean {
  return s.gamePaused && !s.upgradeScreenActive && !s.rewardModalOpen && !s.pauseMenuOpen && !s.dialogueActive && !s.gameOverOrChapterEnd;
}

/** Soma o tempo de pausa órfã; devolve o novo acumulado e se deve retomar agora. */
export function tickPauseGuard(orphanMs: number, s: PauseGuardState, deltaMs: number): { orphanMs: number; recover: boolean } {
  if (!isOrphanPause(s)) return { orphanMs: 0, recover: false };
  const next = orphanMs + deltaMs;
  return next >= STUCK_PAUSE_MS ? { orphanMs: 0, recover: true } : { orphanMs: next, recover: false };
}

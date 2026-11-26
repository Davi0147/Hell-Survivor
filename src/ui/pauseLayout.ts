/**
 * Meio do menu de pausa (bônus, armas e talismãs), medido a partir do topo do painel.
 * Os bônus ocupam só as linhas que usam; Armas e Talismãs vêm logo abaixo. Sem Phaser,
 * para testar que o pior caso (todos os bônus) ainda cabe acima do volume.
 */
export const PAUSE_MIDDLE = {
  /** Topo da grade de bônus. */
  bonusTop: 216,
  bonusCols: 5,
  bonusMaxRows: 3,
  bonusChipH: 30,
  bonusGap: 3,
  /** Altura reservada para a frase "nenhum bônus ainda". */
  emptyRowH: 22,
  /** Espaço depois de cada bloco antes do título da próxima seção. */
  sectionGap: 8,
  /** Do título da seção até o centro da linha de ícones (título ~12 px + folga + meia caixa). */
  headerToRow: 28,
  /** Altura das caixinhas de arma e talismã. */
  rowH: 34,
  /** Limite de baixo: título do Volume. */
  volumeHeaderY: 442,
} as const;

export interface PauseMiddleLayout {
  bonusRows: number;
  weaponsHeaderY: number;
  weaponsRowY: number;
  talismansHeaderY: number;
  talismansRowY: number;
  /** Onde o último bloco termina (precisa ficar acima do Volume). */
  bottom: number;
}

export function bonusRowsFor(bonusCount: number): number {
  const L = PAUSE_MIDDLE;
  return Math.min(L.bonusMaxRows, Math.ceil(Math.min(bonusCount, L.bonusCols * L.bonusMaxRows) / L.bonusCols));
}

export function layoutPauseMiddle(bonusCount: number): PauseMiddleLayout {
  const L = PAUSE_MIDDLE;
  const rows = bonusRowsFor(bonusCount);
  const bonusH = rows === 0 ? L.emptyRowH : rows * (L.bonusChipH + L.bonusGap) - L.bonusGap;
  const weaponsHeaderY = L.bonusTop + bonusH + L.sectionGap + 6;
  const weaponsRowY = weaponsHeaderY + L.headerToRow;
  const talismansHeaderY = weaponsRowY + L.rowH / 2 + L.sectionGap + 6;
  const talismansRowY = talismansHeaderY + L.headerToRow;
  return {
    bonusRows: rows,
    weaponsHeaderY,
    weaponsRowY,
    talismansHeaderY,
    talismansRowY,
    bottom: talismansRowY + L.rowH / 2,
  };
}

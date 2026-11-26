/**
 * Regras da tela de capítulos (sem Phaser, para testar): o que está liberado, como os painéis
 * dividem a largura e como o melhor tempo aparece.
 */

export type ChapterState = 'coming-soon' | 'locked' | 'open' | 'cleared';

export interface ChapterRecord {
  /** Venceu o chefe deste capítulo ao menos uma vez. */
  completed: boolean;
  /** Melhor tempo de vitória em segundos (0 = nunca venceu). */
  bestTimeSec: number;
}

/**
 * O 1 começa liberado; cada um abre quando o anterior é vencido. Capítulo não lançado fica
 * sempre bloqueado ("em breve"), mesmo que o anterior esteja vencido.
 */
export function chapterState(
  n: number,
  released: boolean,
  records: Readonly<Record<number, ChapterRecord | undefined>>
): ChapterState {
  if (!released) return 'coming-soon';
  if (records[n]?.completed) return 'cleared';
  if (n === 1 || records[n - 1]?.completed) return 'open';
  return 'locked';
}

export function isPlayable(state: ChapterState): boolean {
  return state === 'open' || state === 'cleared';
}

/**
 * Larguras dos painéis lado a lado: o focado ganha `expandedW` e os outros dividem o resto
 * igualmente (nunca abaixo de `minW`; se não couber, o aberto encolhe).
 */
export function accordionWidths(count: number, focus: number, totalW: number, gap: number, expandedW: number, minW: number): number[] {
  const free = totalW - gap * (count - 1);
  const others = count - 1;
  let open = Math.min(expandedW, free);
  let closed = others > 0 ? (free - open) / others : 0;
  if (others > 0 && closed < minW) {
    closed = minW;
    open = Math.max(minW, free - closed * others);
  }
  return Array.from({ length: count }, (_, i) => (i === focus ? open : closed));
}

/** "12:34" (ou "1:02:03" acima de uma hora); "--:--" se nunca venceu. */
export function formatBestTime(sec: number): string {
  if (!sec || sec <= 0 || !isFinite(sec)) return '--:--';
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(r).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Foco inicial: o capítulo jogável mais avançado (o próximo a jogar). */
export function initialFocus(states: readonly ChapterState[]): number {
  let best = 0;
  states.forEach((st, i) => {
    if (isPlayable(st)) best = i;
  });
  return best;
}

/** Recorde novo? Menor tempo vence; 0 = sem recorde ainda. */
export function improvesBestTime(previousSec: number, newSec: number): boolean {
  return newSec > 0 && (previousSec <= 0 || newSec < previousSec);
}

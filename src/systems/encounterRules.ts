import {
  ENDLESS_SCHEDULE,
  getStorySchedule,
  type EnemyKind,
  type FormationId,
  type MiniBossId,
} from '../config/balance';

/**
 * Regras do cronograma de inimigos (História e Infinito). Funções puras, sem Phaser, para teste.
 * Os números moram em `STORY_SCHEDULE` / `ENDLESS_SCHEDULE` (balance.ts).
 */

export const ALL_ENEMY_KINDS: readonly EnemyKind[] = ['dog', 'elite', 'bat', 'mummy', 'slime', 'archer', 'colossus', 'eye'];

// ---------------------------------------------------------------------------
// História (avanço pela barra de purificação, 0 a 1)
// ---------------------------------------------------------------------------

export function isUnlockedInStory(chapter: number, ratio: number, kind: EnemyKind): boolean {
  const from = getStorySchedule(chapter).unlocks[kind];
  return from !== undefined && ratio >= from;
}

/** Inimigos que estreiam no meio do capítulo (os de 0% já estão lá desde o começo, sem aviso). */
export function storyIntroKinds(chapter: number): EnemyKind[] {
  const unlocks = getStorySchedule(chapter).unlocks;
  return ALL_ENEMY_KINDS.filter((k) => k !== 'dog' && (unlocks[k] ?? 0) > 0);
}

export function storyHasElites(chapter: number): boolean {
  return getStorySchedule(chapter).unlocks.elite !== undefined;
}

export function storyFormations(chapter: number, ratio: number): FormationId[] {
  return getStorySchedule(chapter).formations.filter((f) => ratio >= f.fromRatio).map((f) => f.id);
}

// ---------------------------------------------------------------------------
// Infinito (Círculos)
// ---------------------------------------------------------------------------

/** No Círculo 1 cada inimigo estreia no seu segundo; do Círculo 2 em diante, todos liberados. */
/** Segundo de estreia no Círculo 1; `undefined` = esse inimigo não existe no Infinito. */
function endlessDebutSec(kind: EnemyKind): number | undefined {
  return (ENDLESS_SCHEDULE.firstCircleUnlocksSec as Partial<Record<EnemyKind, number>>)[kind];
}

export function isUnlockedInEndless(circle: number, circleMs: number, kind: EnemyKind): boolean {
  const sec = endlessDebutSec(kind);
  // Fora da tabela (ex.: Olho Alado, do Capítulo 3) = nunca no Infinito
  if (sec === undefined) return false;
  if (circle >= 2) return true;
  return circleMs >= sec * 1000;
}

export function endlessIntroKinds(): EnemyKind[] {
  return ALL_ENEMY_KINDS.filter((k) => (endlessDebutSec(k) ?? 0) > 0);
}

export function endlessMiniBoss(circle: number): MiniBossId {
  const r = ENDLESS_SCHEDULE.miniBossRotation;
  return r[(Math.max(1, circle) - 1) % r.length];
}

/** Tema do Círculo (formação que se repete). O Círculo 1 não tem tema: ele apresenta os inimigos. */
export function endlessTheme(circle: number): FormationId | undefined {
  if (circle < 2) return undefined;
  const t = ENDLESS_SCHEDULE.themes;
  return t[(circle - 2) % t.length];
}

export function endlessBossMultipliers(circle: number): { hp: number; damage: number } {
  const b = ENDLESS_SCHEDULE.boss;
  const n = Math.max(1, circle) - 1;
  return { hp: b.hpBase + b.hpPerCircle * n, damage: b.damageBase + b.damagePerCircle * n };
}

export function endlessMiniBossHpMultiplier(circle: number): number {
  return 1 + ENDLESS_SCHEDULE.miniBossHpPerCircle * (Math.max(1, circle) - 1);
}

/** Avisos de chefe já devidos neste instante do Círculo. */
export function endlessBossWarnings(circleMs: number): { warning: boolean; final: boolean; due: boolean } {
  const left = ENDLESS_SCHEDULE.circleMs - circleMs;
  return {
    warning: left <= ENDLESS_SCHEDULE.bossWarningMs,
    final: left <= ENDLESS_SCHEDULE.bossFinalWarningMs,
    due: left <= 0,
  };
}

/** Eventos de horda ficam quietos perto do chefe. */
export function isQuietBeforeBoss(circleMs: number): boolean {
  return ENDLESS_SCHEDULE.circleMs - circleMs <= ENDLESS_SCHEDULE.eventQuietBeforeBossMs;
}

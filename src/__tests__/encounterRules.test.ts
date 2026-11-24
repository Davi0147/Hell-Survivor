import { describe, it, expect } from 'vitest';
import {
  ALL_ENEMY_KINDS,
  endlessBossMultipliers,
  endlessBossWarnings,
  endlessIntroKinds,
  endlessMiniBoss,
  endlessMiniBossHpMultiplier,
  endlessTheme,
  isQuietBeforeBoss,
  isUnlockedInEndless,
  isUnlockedInStory,
  storyFormations,
  storyHasElites,
  storyIntroKinds,
} from '../systems/encounterRules';
import { ENDLESS_SCHEDULE, STORY_SCHEDULE, getStorySchedule } from '../config/balance';
import { getEligibleHordeEvents } from '../systems/hordeEventRules';

describe('História: Capítulo 1 ensina o básico', () => {
  it('começa só com cães', () => {
    const at0 = ALL_ENEMY_KINDS.filter((k) => isUnlockedInStory(1, 0, k));
    expect(at0).toEqual(['dog']);
  });

  it('morcego, múmia e slime chegam em ordem pela barra', () => {
    const u = STORY_SCHEDULE[1].unlocks;
    expect(u.bat!).toBeLessThan(u.mummy!);
    expect(u.mummy!).toBeLessThan(u.slime!);
    expect(isUnlockedInStory(1, u.bat!, 'bat')).toBe(true);
    expect(isUnlockedInStory(1, u.bat! - 0.01, 'bat')).toBe(false);
  });

  it('não tem Alfa, Arqueira nem Colossus', () => {
    for (const k of ['elite', 'archer', 'colossus'] as const) {
      expect(isUnlockedInStory(1, 1, k)).toBe(false);
    }
    expect(storyHasElites(1)).toBe(false);
  });

  it('minichefe Lyn (da vila) no meio da fase e sem formações', () => {
    expect(STORY_SCHEDULE[1].miniBoss?.id).toBe('lyn');
    expect(storyFormations(1, 1)).toEqual([]);
  });

  it('apresenta só quem estreia no meio (o cão não tem aviso)', () => {
    expect(storyIntroKinds(1)).toEqual(['bat', 'mummy', 'slime']);
  });
});

describe('História: Capítulo 2 junta os inimigos novos', () => {
  it('no fim do capítulo todos os inimigos estão liberados', () => {
    for (const k of ALL_ENEMY_KINDS) expect(isUnlockedInStory(2, 1, k)).toBe(true);
  });

  it('a Arqueira estreia cedo e o Colossus no meio', () => {
    const u = STORY_SCHEDULE[2].unlocks;
    expect(u.archer!).toBeLessThan(u.colossus!);
  });

  it('Ghoul é o minichefe; Matilha e Muralha entram como formações', () => {
    expect(STORY_SCHEDULE[2].miniBoss?.id).toBe('ghoul');
    expect(storyFormations(2, 0)).toEqual([]);
    expect(storyFormations(2, 1)).toEqual(['pack', 'wall']);
  });

  it('a Matilha Alfa dos eventos de horda só existe onde o Alfa existe', () => {
    expect(getEligibleHordeEvents('story', 1, 20, false, false)).not.toContain('elite_pack');
    expect(getEligibleHordeEvents('story', 2, 20, false, false)).toContain('elite_pack');
  });

  it('capítulo sem tabela usa a do Capítulo 2', () => {
    expect(getStorySchedule(99)).toBe(STORY_SCHEDULE[2]);
  });
});

describe('Infinito: Círculos', () => {
  const S = ENDLESS_SCHEDULE;

  it('Círculo 1 apresenta cada inimigo no seu segundo; do Círculo 2 em diante, tudo liberado', () => {
    expect(isUnlockedInEndless(1, 0, 'dog')).toBe(true);
    expect(isUnlockedInEndless(1, 0, 'archer')).toBe(false);
    expect(isUnlockedInEndless(1, S.firstCircleUnlocksSec.archer * 1000, 'archer')).toBe(true);
    for (const k of ALL_ENEMY_KINDS) expect(isUnlockedInEndless(2, 0, k)).toBe(true);
  });

  it('todo inimigo estreia antes do chefe do Círculo 1 (e antes do silêncio pré-chefe)', () => {
    for (const k of endlessIntroKinds()) {
      expect(S.firstCircleUnlocksSec[k] * 1000).toBeLessThan(S.circleMs - S.eventQuietBeforeBossMs);
    }
  });

  it('nenhuma estreia cai perto do minichefe (avisos não se atropelam)', () => {
    for (const k of endlessIntroKinds()) {
      expect(Math.abs(S.firstCircleUnlocksSec[k] * 1000 - S.miniBossAtMs)).toBeGreaterThanOrEqual(10000);
    }
  });

  it('minichefe se reveza: Ghoul, Lyn, Ghoul...', () => {
    expect(endlessMiniBoss(1)).toBe('ghoul');
    expect(endlessMiniBoss(2)).toBe('lyn');
    expect(endlessMiniBoss(3)).toBe('ghoul');
  });

  it('Círculo 1 não tem tema; depois os temas giram sem repetir seguido', () => {
    expect(endlessTheme(1)).toBeUndefined();
    const seq = [2, 3, 4, 5, 6, 7].map(endlessTheme);
    expect(seq[0]).toBe(S.themes[0]);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
    expect(seq[S.themes.length]).toBe(S.themes[0]);
  });

  it('chefe e minichefe ficam mais fortes a cada Círculo, sem limite', () => {
    const c1 = endlessBossMultipliers(1);
    const c5 = endlessBossMultipliers(5);
    expect(c1.hp).toBeCloseTo(S.boss.hpBase);
    expect(c5.hp).toBeGreaterThan(c1.hp);
    expect(c5.damage).toBeGreaterThan(c1.damage);
    expect(endlessMiniBossHpMultiplier(1)).toBe(1);
    expect(endlessMiniBossHpMultiplier(3)).toBeGreaterThan(endlessMiniBossHpMultiplier(2));
  });

  it('avisos do chefe: 30 s, depois 10 s, depois chega', () => {
    expect(endlessBossWarnings(0)).toEqual({ warning: false, final: false, due: false });
    expect(endlessBossWarnings(S.circleMs - S.bossWarningMs).warning).toBe(true);
    expect(endlessBossWarnings(S.circleMs - S.bossWarningMs).final).toBe(false);
    expect(endlessBossWarnings(S.circleMs - S.bossFinalWarningMs).final).toBe(true);
    expect(endlessBossWarnings(S.circleMs).due).toBe(true);
  });

  it('eventos de horda param pouco antes do chefe; minichefe fica longe disso', () => {
    expect(isQuietBeforeBoss(S.circleMs - S.eventQuietBeforeBossMs)).toBe(true);
    expect(isQuietBeforeBoss(S.miniBossAtMs)).toBe(false);
  });
});

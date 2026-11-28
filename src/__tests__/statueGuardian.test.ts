import { describe, expect, it } from 'vitest';
import { isInsideSlam, statueSlamPhase } from '../entities/enemies/statueRules';
import { ENEMY_BALANCE, MINIBOSS_GEM_DROPS, getStorySchedule } from '../config/balance';
import { isUnlockedInEndless, isUnlockedInStory } from '../systems/encounterRules';

describe('Guardião de Mármore (minichefe do Capítulo 3)', () => {
  const cfg = ENEMY_BALANCE.statueGuardian;

  it('o martelo pega quem está dentro do círculo e não pega quem saiu', () => {
    expect(isInsideSlam(100, 0, 0, 0, cfg.slam.radius)).toBe(true);
    expect(isInsideSlam(cfg.slam.radius + 1, 0, 0, 0, cfg.slam.radius)).toBe(false);
  });

  it('a marcação enche até o fim e nunca some (sempre dá para ver)', () => {
    expect(statueSlamPhase(0).fillAlpha).toBeLessThan(statueSlamPhase(1).fillAlpha);
    for (const p of [0, 0.3, 0.7, 1]) expect(statueSlamPhase(p).edgeAlpha).toBeGreaterThan(0.5);
  });

  it('é bem mais resistente que os outros minichefes e mais lento que a Nixy', () => {
    expect(cfg.hp).toBeGreaterThan(ENEMY_BALANCE.lyn.hp * 2);
    expect(cfg.speed).toBeLessThan(ENEMY_BALANCE.ghoulDevourer.speed);
  });

  it('o martelo respeita a regra de ouro (~45% da vida base) e dá tempo de sair', () => {
    expect(cfg.slam.damage).toBeLessThanOrEqual(45);
    expect(cfg.slam.telegraphMs).toBeGreaterThanOrEqual(900);
  });

  it('solta mais gemas que a Lyn', () => {
    const xp = { green: 5, blue: 20, red: 100, purple: 250 } as const;
    const total = (g: readonly (keyof typeof xp)[]) => g.reduce((s, k) => s + xp[k], 0);
    expect(total(MINIBOSS_GEM_DROPS.statue)).toBeGreaterThan(total(MINIBOSS_GEM_DROPS.lyn));
  });
});

describe('Olho Alado (Capítulo 3)', () => {
  it('aparece no Capítulo 3 logo no começo, e não nos outros capítulos nem no Infinito', () => {
    expect(isUnlockedInStory(3, 0.1, 'eye')).toBe(true);
    expect(isUnlockedInStory(1, 1, 'eye')).toBe(false);
    expect(isUnlockedInStory(2, 1, 'eye')).toBe(false);
    expect(isUnlockedInEndless(5, 0, 'eye')).toBe(false);
  });

  it('é mais rápido que o morcego (bem rápido) e o minichefe do Capítulo 3 é a estátua', () => {
    expect(ENEMY_BALANCE.wingedEye.speed).toBeGreaterThan(ENEMY_BALANCE.bloodBat.speed);
    expect(getStorySchedule(3).miniBoss?.id).toBe('statue');
  });
});

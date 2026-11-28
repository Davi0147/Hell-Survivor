import { describe, expect, it } from 'vitest';
import { ENEMY_BALANCE, LYN_BALANCE, MINIBOSS_GEM_DROPS } from '../config/balance';

const GEM_XP = { green: 5, blue: 20, red: 100, purple: 250, gold: 500 } as const;
const xp = (gems: readonly (keyof typeof GEM_XP)[]) => gems.reduce((sum, g) => sum + GEM_XP[g], 0);

describe('Minichefes (pedido de 2026-11-27)', () => {
  it('gemas dão ~15% a mais de XP que antes (Ghoul 250, Lyn 500)', () => {
    expect(xp(MINIBOSS_GEM_DROPS.ghoul) / 250).toBeCloseTo(1.15, 1);
    expect(xp(MINIBOSS_GEM_DROPS.lyn) / 500).toBeCloseTo(1.15, 2);
  });

  it('vida e dano ~30% acima dos valores antigos', () => {
    expect(ENEMY_BALANCE.ghoulDevourer.hp).toBe(Math.round(2100 * 1.3));
    expect(ENEMY_BALANCE.lyn.hp).toBe(Math.round(2400 * 1.3));
    expect(ENEMY_BALANCE.ghoulDevourer.damage).toBe(Math.round(24 * 1.3));
    expect(ENEMY_BALANCE.lyn.damage).toBe(Math.round(24 * 1.3));
  });

  it('nenhum golpe passa da regra de ouro (~45% da vida base de 100)', () => {
    expect(ENEMY_BALANCE.ghoulDevourer.lunge.damage).toBeLessThanOrEqual(45);
    expect(LYN_BALANCE.swoop.damage).toBeLessThanOrEqual(45);
  });
});

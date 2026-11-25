import { describe, it, expect } from 'vitest';
import { AZAZEL_BOSS_BALANCE } from '../config/balance';
import {
  getCrystalHordeStrength,
  getCrystalHordeScaling,
  getCrystalWaveIntervalMs,
  getBossRegenHp,
  clampToCircle,
} from '../systems/crystalPhaseRules';

const C = AZAZEL_BOSS_BALANCE.crystalPhase;

describe('Fase dos cristais: enrolar custa caro', () => {
  it('a horda começa normal e fica mais forte com o tempo, até o teto', () => {
    expect(getCrystalHordeStrength(0)).toBe(1);
    expect(getCrystalHordeStrength(60_000)).toBeGreaterThan(getCrystalHordeStrength(30_000));
    expect(getCrystalHordeStrength(60 * 60_000)).toBe(C.hordeStrengthMax);
  });

  it('o dano dos monstros sobe mais devagar que a vida', () => {
    const s = getCrystalHordeScaling(2);
    expect(s.hp).toBe(2);
    expect(s.damage).toBeGreaterThan(1);
    expect(s.damage).toBeLessThan(s.hp);
    expect(getCrystalHordeScaling(1)).toEqual({ hp: 1, damage: 1 });
  });

  it('as levas vêm mais rápido com a força, sem passar do mínimo', () => {
    expect(getCrystalWaveIntervalMs(1)).toBe(AZAZEL_BOSS_BALANCE.dimensionWaveIntervalMs);
    expect(getCrystalWaveIntervalMs(1.5)).toBeLessThan(getCrystalWaveIntervalMs(1));
    expect(getCrystalWaveIntervalMs(C.hordeStrengthMax)).toBeGreaterThanOrEqual(C.minWaveIntervalMs);
  });

  it('o Azazel recupera vida devagar até o teto', () => {
    const max = 10_000;
    const after10s = getBossRegenHp(2000, max, 10_000);
    expect(after10s).toBeCloseTo(2000 + max * C.bossRegenPerSec * 10);
    expect(getBossRegenHp(2000, max, 10 * 60_000)).toBe(max * C.bossRegenCap);
    // Acima do teto não mexe
    expect(getBossRegenHp(max * 0.9, max, 1000)).toBe(max * 0.9);
  });

  it('a recuperação é lenta: leva mais de um minuto para chegar ao teto', () => {
    const secondsToCap = (C.bossRegenCap - 0.2) / C.bossRegenPerSec;
    expect(secondsToCap).toBeGreaterThan(60);
  });

  it('os cristais ficam dentro da área com folga', () => {
    expect(C.crystalDist.max).toBeLessThan(C.arenaRadius - 60);
  });

  it('a heroína não passa da borda do círculo', () => {
    expect(clampToCircle(10, 0, 0, 0, 100)).toEqual({ x: 10, y: 0, clamped: false });
    const out = clampToCircle(300, 400, 0, 0, 100);
    expect(out.clamped).toBe(true);
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(100);
  });
});

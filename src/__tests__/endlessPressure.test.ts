import { describe, it, expect } from 'vitest';
import { getEnemyScaling, getSpawnIntervalMs, getIdlePressureBonus, IDLE_PRESSURE_BALANCE, SPAWN_PACING } from '../config/balance';
import { IdlePressureSystem } from '../systems/IdlePressureSystem';

const min = (m: number): number => m * 60000;

describe('Curva de força dos monstros', () => {
  it('História continua em linha reta (igual a antes)', () => {
    const s = getEnemyScaling(min(10), false);
    expect(s.hpMultiplier).toBeCloseTo(2.2);
    expect(s.damageMultiplier).toBeCloseTo(1.6);
    expect(s.lateHpMultiplier).toBe(1);
  });

  it('Infinito acelera: aos 10 min vida x5,1 e dano x3; aos 20 min vida x14,2', () => {
    expect(getEnemyScaling(0, true).hpMultiplier).toBe(1);
    const at10 = getEnemyScaling(min(10), true);
    expect(at10.hpMultiplier).toBeCloseTo(5.1);
    expect(at10.damageMultiplier).toBeCloseTo(3.0);
    expect(getEnemyScaling(min(20), true).hpMultiplier).toBeCloseTo(14.2);
  });

  it('velocidade tem teto', () => {
    expect(getEnemyScaling(min(60), true).speedMultiplier).toBe(1.3);
  });
});

describe('Ritmo de nascimento', () => {
  it('começa em 1,5 s e para no piso de cada modo', () => {
    expect(getSpawnIntervalMs(0, true)).toBe(SPAWN_PACING.startMs);
    expect(getSpawnIntervalMs(5, false)).toBe(SPAWN_PACING.minStoryMs);
    expect(getSpawnIntervalMs(5, true)).toBe(SPAWN_PACING.minEndlessMs);
  });

  it('no Infinito tardio o piso desce até o mínimo', () => {
    expect(getSpawnIntervalMs(11, true)).toBeLessThan(SPAWN_PACING.minEndlessMs);
    expect(getSpawnIntervalMs(30, true)).toBe(SPAWN_PACING.lateMinMs);
  });
});

describe('Pressão do Abismo', () => {
  it('degraus: 10 s +10%, 20 s +15%, e segue subindo sem teto', () => {
    expect(getIdlePressureBonus(9999)).toBe(0);
    expect(getIdlePressureBonus(10000)).toBe(0.10);
    expect(getIdlePressureBonus(20000)).toBe(0.15);
    const lastTable = IDLE_PRESSURE_BALANCE.steps.length;
    const atEnd = getIdlePressureBonus(lastTable * 10000);
    expect(getIdlePressureBonus((lastTable + 2) * 10000)).toBeCloseTo(atEnd + 2 * IDLE_PRESSURE_BALANCE.growthAfterTable);
  });

  it('parado acumula; passinhos dentro do raio não zeram; sair do raio zera', () => {
    const sys = new IdlePressureSystem();
    sys.update(16, 0, 0); // primeiro quadro só marca o ponto
    for (let i = 0; i < 21; i++) sys.update(1000, (i % 2) * 60, 0); // vai e volta 60 px
    expect(sys.bonus).toBe(0.15);
    expect(sys.multiplier).toBeCloseTo(1.15);

    sys.update(16, IDLE_PRESSURE_BALANCE.leashRadius + 10, 0);
    expect(sys.bonus).toBe(0);
    expect(sys.secondsStill).toBe(0);
  });

  it('capturando o altar não conta como parado, e a contagem recomeça ao sair', () => {
    const sys = new IdlePressureSystem();
    sys.update(16, 0, 0);
    for (let i = 0; i < 30; i++) sys.update(1000, 0, 0, true); // 30 s em cima do altar
    expect(sys.bonus).toBe(0);
    expect(sys.secondsStill).toBe(0);
    sys.update(5000, 0, 0); // saiu do altar e ficou parado 5 s
    expect(sys.secondsStill).toBe(5);
  });

  it('reset volta ao zero', () => {
    const sys = new IdlePressureSystem();
    sys.update(16, 0, 0);
    sys.update(15000, 0, 0);
    expect(sys.bonus).toBe(0.10);
    sys.reset();
    expect(sys.bonus).toBe(0);
  });
});

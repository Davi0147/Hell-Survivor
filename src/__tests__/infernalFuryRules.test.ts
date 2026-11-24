import { describe, expect, it } from 'vitest';
import { InfernalFuryRoller } from '../systems/infernalFuryRules';
import { INFERNAL_FURY_BALANCE } from '../config/balance';

const cfg = { baseChance: 0.05, chanceStepPerLevel: 0.05, cooldownLevels: 4, minLevel: 4 };
const MISS = 0.999;
const HIT = 0;

describe('InfernalFuryRoller (sorteio da Fúria do Inferno por nível)', () => {
  it('não sorteia antes do nível mínimo', () => {
    const r = new InfernalFuryRoller(cfg);
    expect(r.onLevelUp(2, HIT)).toBe(false);
    expect(r.onLevelUp(3, HIT)).toBe(false);
    expect(r.onLevelUp(4, HIT)).toBe(true);
  });

  it('começa em 5% e sobe 5% a cada nível sem fúria', () => {
    const r = new InfernalFuryRoller(cfg);
    expect(r.currentChance).toBeCloseTo(0.05);
    r.onLevelUp(4, MISS);
    r.onLevelUp(5, MISS);
    expect(r.currentChance).toBeCloseTo(0.15);
    // 0.14 < 15%: dispara agora, mas não teria disparado no primeiro nível
    expect(r.onLevelUp(6, 0.14)).toBe(true);
  });

  it('depois da fúria, só volta a sortear 4 níveis depois e com a chance zerada', () => {
    const r = new InfernalFuryRoller(cfg);
    expect(r.onLevelUp(10, HIT)).toBe(true);
    for (const lvl of [11, 12, 13]) expect(r.onLevelUp(lvl, HIT)).toBe(false);
    expect(r.currentChance).toBeCloseTo(0.05);
    expect(r.onLevelUp(14, HIT)).toBe(true);
  });

  it('níveis em recarga não aumentam a chance', () => {
    const r = new InfernalFuryRoller(cfg);
    r.onLevelUp(10, HIT);
    r.onLevelUp(11, MISS);
    r.onLevelUp(12, MISS);
    expect(r.currentChance).toBeCloseTo(0.05);
  });

  it('a chance nunca passa de 100%', () => {
    const r = new InfernalFuryRoller(cfg);
    for (let lvl = 4; lvl < 60; lvl++) r.onLevelUp(lvl, 1);
    expect(r.currentChance).toBe(1);
  });

  it('Modo de Teste conta como fúria para o intervalo', () => {
    const r = new InfernalFuryRoller(cfg);
    r.markTriggered(20);
    expect(r.isEligible(23)).toBe(false);
    expect(r.isEligible(24)).toBe(true);
  });

  it('a configuração do jogo segue o pedido do dono', () => {
    expect(INFERNAL_FURY_BALANCE.durationMs).toBe(30000);
    expect(INFERNAL_FURY_BALANCE.baseChance).toBe(0.05);
    expect(INFERNAL_FURY_BALANCE.cooldownLevels).toBe(4);
    expect(INFERNAL_FURY_BALANCE.xpBonus).toBe(0.5);
  });
});

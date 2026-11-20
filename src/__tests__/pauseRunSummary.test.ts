import { describe, it, expect } from 'vitest';
import { buildRunBonuses, describeRunMode, type IRunBonusSource } from '../ui/pauseRunSummary';
import { CRIT_BALANCE } from '../config/balance';

const fresh = (): IRunBonusSource => ({
  bonusDamagePercent: 0,
  bonusSpeedPercent: 0,
  bonusPickupRadiusPercent: 0,
  cardBonusMaxHp: 0,
  cardBonusMaxStamina: 0,
  extraProjectiles: 0,
  extraPierce: 0,
  critChance: CRIT_BALANCE.baseChance,
  critMultiplier: CRIT_BALANCE.baseMultiplier,
  hpRegenPerSec: 0,
  lifeStealPerHit: 0,
  dashMasteryLevel: 0,
  corpseExplosionLevel: 0,
  bloodthirstLevel: 0,
});

describe('pauseRunSummary', () => {
  it('partida nova não tem bônus (crítico base não conta)', () => {
    expect(buildRunBonuses(fresh())).toEqual([]);
  });

  it('lista só o que mudou, com valor formatado e o ícone da carta', () => {
    const p = { ...fresh(), bonusDamagePercent: 50, cardBonusMaxHp: 25, extraProjectiles: 2, critChance: 0.13, hpRegenPerSec: 0.4, dashMasteryLevel: 2 };
    const list = buildRunBonuses(p);
    expect(list.map((b) => b.label)).toEqual(['DANO', 'VIDA MÁX', 'PROJÉTEIS', 'CRÍTICO', 'REGENERAÇÃO', 'PASSO SOMBRIO']);
    expect(list[0]).toMatchObject({ iconKey: 'icon-blessing-might', value: '+50%', label: 'DANO', title: 'FÚRIA' });
    expect(list[0].description).toContain('+50%');
    expect(list[3].value).toBe('13%');
    expect(list[4].value).toBe('0.4/s');
    expect(list[5]).toMatchObject({ iconKey: 'icon-card-dash', value: 'NV 2', label: 'PASSO SOMBRIO' });
    for (const b of list) expect(b.description.length).toBeGreaterThan(10);
  });

  it('descreve o modo da partida', () => {
    expect(describeRunMode('story', 2)).toBe('HISTÓRIA  ·  CAPÍTULO 2');
    expect(describeRunMode('endless', 1)).toBe('MODO INFINITO');
    expect(describeRunMode('sandbox', 1)).toBe('MODO DE TESTE');
  });
});

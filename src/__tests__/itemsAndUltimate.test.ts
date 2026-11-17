import { describe, it, expect } from 'vitest';
import { pickWeightedMapItem, MAP_ITEM_TYPES } from '../systems/mapItemRules';
import { BALANCE, ULTIMATE_BALANCE } from '../config/balance';

describe('pickWeightedMapItem (sorteio dos itens de mapa)', () => {
  it('cobre o intervalo inteiro: começo, fim e borda nunca saem do catálogo', () => {
    expect(pickWeightedMapItem(0)).toBe(MAP_ITEM_TYPES[0]);
    expect(MAP_ITEM_TYPES).toContain(pickWeightedMapItem(0.9999));
    expect(MAP_ITEM_TYPES).toContain(pickWeightedMapItem(1));
  });

  it('a frequência de cada item segue o peso de balance.ts', () => {
    const weights = BALANCE.MAP_ITEMS.weights;
    const total = MAP_ITEM_TYPES.reduce((s, t) => s + weights[t], 0);
    const counts: Record<string, number> = {};
    const steps = 10000;
    for (let i = 0; i < steps; i++) {
      const t = pickWeightedMapItem(i / steps);
      counts[t] = (counts[t] ?? 0) + 1;
    }
    for (const t of MAP_ITEM_TYPES) {
      expect(counts[t] / steps).toBeCloseTo(weights[t] / total, 2);
    }
  });

  it('itens de cura e utilidade continuam mais comuns que a Bomba e o Frasco', () => {
    const w = BALANCE.MAP_ITEMS.weights;
    expect(w.chalice).toBeGreaterThan(w.bomb);
    expect(w.chalice).toBeGreaterThan(w.fury);
  });
});

describe('ULTIMATE_BALANCE (Ascensão Infernal)', () => {
  it('é um modo de poder: acelera armas e dá dano e velocidade por alguns segundos', () => {
    expect(ULTIMATE_BALANCE.weaponHasteMultiplier).toBeGreaterThan(1);
    expect(ULTIMATE_BALANCE.damageBonusPercent).toBeGreaterThan(0);
    expect(ULTIMATE_BALANCE.speedBonusPercent).toBeGreaterThan(0);
    expect(ULTIMATE_BALANCE.durationMs).toBeGreaterThanOrEqual(5000);
  });

  it('a heroína fica intocável durante a animação de ativação', () => {
    expect(ULTIMATE_BALANCE.castInvulnerableMs).toBeGreaterThanOrEqual(1000);
  });
});

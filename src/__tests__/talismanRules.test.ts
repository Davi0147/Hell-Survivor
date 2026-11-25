import { describe, it, expect } from 'vitest';
import {
  rollTalismanRarity,
  rarityFallbackOrder,
  pickTalisman,
  createRevealState,
  tapReveal,
  TALISMAN_RARITIES,
} from '../systems/talismanRules';
import { TALISMAN_CATALOG } from '../systems/TalismanCatalog';
import { TALISMAN_BALANCE } from '../config/balance';

describe('Talismãs: sorteio de raridade', () => {
  it('respeita os pesos (comum no começo da faixa, lendária no fim)', () => {
    expect(rollTalismanRarity(0)).toBe('common');
    expect(rollTalismanRarity(0.9999)).toBe('legendary');
  });

  it('distribui na proporção dos pesos', () => {
    const counts: Record<string, number> = {};
    const n = 10000;
    for (let i = 0; i < n; i++) {
      const r = rollTalismanRarity((i + 0.5) / n);
      counts[r] = (counts[r] ?? 0) + 1;
    }
    const w = TALISMAN_BALANCE.rarityWeights;
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    for (const r of TALISMAN_RARITIES) {
      expect(Math.abs(counts[r] / n - w[r] / total)).toBeLessThan(0.002);
    }
  });
});

describe('Talismãs: sem repetição', () => {
  it('raridade esgotada procura abaixo primeiro e depois acima', () => {
    expect(rarityFallbackOrder('rare')).toEqual(['rare', 'uncommon', 'common', 'epic', 'legendary']);
    expect(rarityFallbackOrder('common')).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary']);
  });

  it('nunca devolve um que o jogador já tem e acaba em null', () => {
    const owned = new Set<string>();
    for (let i = 0; i < TALISMAN_CATALOG.length; i++) {
      const t = pickTalisman(TALISMAN_CATALOG, owned, 'legendary', 0.5);
      expect(t).not.toBeNull();
      expect(owned.has(t!.id)).toBe(false);
      owned.add(t!.id);
    }
    expect(pickTalisman(TALISMAN_CATALOG, owned, 'common', 0)).toBeNull();
  });

  it('o catálogo tem ids únicos e ao menos um de cada raridade', () => {
    const ids = TALISMAN_CATALOG.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of TALISMAN_RARITIES) {
      expect(TALISMAN_CATALOG.some((t) => t.rarity === r)).toBe(true);
    }
  });
});

describe('Talismãs: revelação por toques', () => {
  it('sobe uma raridade por toque até a sorteada e o toque seguinte abre', () => {
    const s = createRevealState('epic');
    expect(s.current).toBe('common');
    expect(tapReveal(s)).toBe('tier-up');
    expect(tapReveal(s)).toBe('tier-up');
    expect(tapReveal(s)).toBe('tier-up');
    expect(s.current).toBe('epic');
    expect(tapReveal(s)).toBe('open');
    expect(tapReveal(s)).toBe('done');
  });

  it('comum abre no primeiro toque', () => {
    const s = createRevealState('common');
    expect(tapReveal(s)).toBe('open');
  });
});

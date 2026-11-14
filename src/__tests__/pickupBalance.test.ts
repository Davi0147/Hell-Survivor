import { describe, it, expect } from 'vitest';
import { BALANCE } from '../config/balance';
import type { GemType } from '../entities/items/SoulGem';

describe('Balanceamento de coletáveis (PickupSpawnSystem)', () => {
  it('toda cor de gema tem XP positivo, com os valores originais', () => {
    const expected: Record<GemType, number> = { green: 5, blue: 20, red: 100, orange: 100, purple: 250, gold: 500 };
    expect(BALANCE.XP.gemValues).toEqual(expected);
  });

  it('itens de mapa surgem a cada 40s com no máximo 4 ativos', () => {
    expect(BALANCE.MAP_ITEMS.spawnIntervalMs).toBe(40000);
    expect(BALANCE.MAP_ITEMS.maxActive).toBe(4);
  });
});

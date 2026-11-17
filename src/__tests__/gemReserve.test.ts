import { describe, it, expect } from 'vitest';
import { GemReserve } from '../systems/GemReserve';

const view = { left: 0, right: 100, top: 0, bottom: 100 };

describe('GemReserve (gemas guardadas fora da tela)', () => {
  it('guarda gemas e devolve só as que estão dentro da área pedida', () => {
    const reserve = new GemReserve(10);
    reserve.store(50, 50, 'green', 5);
    reserve.store(500, 500, 'blue', 20);

    const taken = reserve.takeWithin(view, 10);
    expect(taken).toEqual([{ x: 50, y: 50, type: 'green', xp: 5 }]);
    expect(reserve.count).toBe(1);
  });

  it('respeita o limite de quantas pode devolver e mantém o resto guardado', () => {
    const reserve = new GemReserve(10);
    for (let i = 0; i < 5; i++) reserve.store(10 + i, 10, 'green', 5);

    expect(reserve.takeWithin(view, 2)).toHaveLength(2);
    expect(reserve.count).toBe(3);
    expect(reserve.takeWithin(view, 0)).toHaveLength(0);
    expect(reserve.count).toBe(3);
  });

  it('nunca perde XP: com o depósito cheio, o valor entra na gema guardada mais próxima', () => {
    const reserve = new GemReserve(2);
    reserve.store(0, 0, 'green', 5);
    reserve.store(1000, 1000, 'green', 5);
    reserve.store(990, 990, 'blue', 20);

    expect(reserve.count).toBe(2);
    expect(reserve.totalXp).toBe(30);
    const far = reserve.takeWithin({ left: 900, right: 1100, top: 900, bottom: 1100 }, 5);
    expect(far[0].xp).toBe(25);
  });

  it('o ímã esvazia o depósito em poucos grupos sem perder XP', () => {
    const reserve = new GemReserve(1000);
    for (let i = 0; i < 205; i++) reserve.store(i, i, 'green', 5);

    const groups = reserve.takeAllGrouped(40);
    expect(groups.length).toBeLessThanOrEqual(40);
    expect(groups.reduce((sum, g) => sum + g.xp, 0)).toBe(205 * 5);
    expect(reserve.count).toBe(0);
  });

  it('com poucas gemas guardadas o ímã devolve cada uma como está', () => {
    const reserve = new GemReserve(100);
    reserve.store(1, 1, 'red', 100);
    reserve.store(2, 2, 'green', 5);
    expect(reserve.takeAllGrouped(40)).toHaveLength(2);
  });
});

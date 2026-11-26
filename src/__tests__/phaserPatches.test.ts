import { describe, it, expect, vi } from 'vitest';

// O módulo importa o Phaser só para instalar o remendo; o teste usa a parte pura
vi.mock('phaser', () => ({ default: {} }));

import { withoutEmptyPadSlots } from '../systems/phaserPatches';

describe('Controle num buraco da lista (defeito do Phaser 3.90)', () => {
  it('o laço do Phaser quebrava com o slot 0 vazio e o controle no slot 1', () => {
    const pad = { removeAllListeners: vi.fn() };
    const plugin = { gamepads: [] as unknown[] };
    plugin.gamepads[1] = pad;
    const phaserLoop = (): void => {
      for (let i = 0; i < plugin.gamepads.length; i++) (plugin.gamepads[i] as typeof pad).removeAllListeners();
    };
    expect(phaserLoop).toThrow();
    // Com o remendo, o mesmo laço passa e alcança o controle que existe
    expect(() => withoutEmptyPadSlots(plugin, phaserLoop)).not.toThrow();
    expect(pad.removeAllListeners).toHaveBeenCalledTimes(1);
  });

  it('a lista volta exatamente como estava (o Phaser usa o índice do navegador)', () => {
    const pad = { id: 'xbox' };
    const plugin = { gamepads: [] as unknown[] };
    plugin.gamepads[1] = pad;
    const original = plugin.gamepads;
    withoutEmptyPadSlots(plugin, () => undefined);
    expect(plugin.gamepads).toBe(original);
    expect(plugin.gamepads[1]).toBe(pad);
    expect(plugin.gamepads[0]).toBeUndefined();
  });

  it('a lista volta mesmo se o laço der erro por outro motivo', () => {
    const plugin = { gamepads: [{ a: 1 }] as unknown[] };
    const original = plugin.gamepads;
    expect(() => withoutEmptyPadSlots(plugin, () => { throw new Error('outro'); })).toThrow('outro');
    expect(plugin.gamepads).toBe(original);
  });
});

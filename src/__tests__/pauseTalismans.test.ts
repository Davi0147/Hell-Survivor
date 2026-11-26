import { describe, it, expect } from 'vitest';
import { layoutPauseMiddle, bonusRowsFor, PAUSE_MIDDLE } from '../ui/pauseLayout';
import { describeTalismansForPause } from '../ui/pauseTalismans';
import { TALISMAN_CATALOG } from '../systems/TalismanCatalog';

describe('Menu de pausa: bônus, armas e talismãs cabem', () => {
  it('os bônus ocupam só as linhas que usam (no máximo 3)', () => {
    expect(bonusRowsFor(0)).toBe(0);
    expect(bonusRowsFor(1)).toBe(1);
    expect(bonusRowsFor(5)).toBe(1);
    expect(bonusRowsFor(6)).toBe(2);
    expect(bonusRowsFor(14)).toBe(3);
    expect(bonusRowsFor(40)).toBe(3);
  });

  it('com todos os bônus (pior caso), a linha dos talismãs termina acima do Volume', () => {
    for (const n of [0, 3, 7, 14]) {
      const l = layoutPauseMiddle(n);
      expect(l.weaponsHeaderY).toBeGreaterThan(PAUSE_MIDDLE.bonusTop);
      // Cada título fica afastado das caixinhas (meia altura do título ~6 px + folga)
      expect(l.talismansHeaderY - (l.weaponsRowY + PAUSE_MIDDLE.rowH / 2)).toBeGreaterThanOrEqual(10);
      expect(l.talismansRowY - PAUSE_MIDDLE.rowH / 2 - l.talismansHeaderY).toBeGreaterThanOrEqual(10);
      expect(PAUSE_MIDDLE.volumeHeaderY - l.bottom, `${n} bônus`).toBeGreaterThanOrEqual(10);
    }
  });

  it('os 15 talismãs cabem numa linha só', () => {
    expect(TALISMAN_CATALOG.length * (PAUSE_MIDDLE.rowH + 10)).toBeLessThanOrEqual(756);
  });
});

describe('Menu de pausa: lista dos talismãs', () => {
  it('mostra só os que o jogador tem, do mais raro para o mais comum', () => {
    const owned = new Set(['pet_bat', 'wpn_hell_pillar', 'act_vortex']);
    const list = describeTalismansForPause(owned);
    expect(list.map((t) => t.name)).toEqual(['PILAR DO INFERNO', 'VÓRTICE DO ABISMO', 'MORCEGO COLETOR']);
    expect(list[0].subtitle).toBe('LENDÁRIA · ARMA ÚNICA');
    expect(list[0].iconKey).toBe('talisman-icon-wpn_hell_pillar');
    expect(list[0].description.length).toBeGreaterThan(10);
  });

  it('sem talismã, lista vazia', () => {
    expect(describeTalismansForPause(new Set())).toEqual([]);
  });
});

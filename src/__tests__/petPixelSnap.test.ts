import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scenes: { Events: { POST_UPDATE: 'postupdate' } } } }));

import { snapToScreenGrid } from '../entities/talismans/pets/BasePet';

describe('Pet nítido enquanto a heroína anda (zoom 1.6)', () => {
  const zoom = 1.6;

  it('a distância até a heroína, em pixels de tela, é sempre um número inteiro', () => {
    for (const [pet, hero] of [[107.3, 100.11], [-42.77, 3.5], [512.04, 498.9]]) {
      const screenOffset = (snapToScreenGrid(pet, hero, zoom) - hero) * zoom;
      expect(Math.abs(screenOffset - Math.round(screenOffset))).toBeLessThan(1e-9);
    }
  });

  it('nunca desenha o pet longe da posição de verdade (no máximo meio pixel de tela)', () => {
    for (const pet of [10.01, 10.33, 10.66, 10.99]) {
      expect(Math.abs(snapToScreenGrid(pet, 0.2, zoom) - pet)).toBeLessThanOrEqual(0.5 / zoom + 1e-9);
    }
  });
});

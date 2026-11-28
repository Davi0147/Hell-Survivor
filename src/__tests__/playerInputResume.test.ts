import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Input: { Keyboard: { KeyCodes: {}, JustDown: () => false } } } }));

import { isResumeFrame, RESUME_GAP_MS } from '../systems/PlayerInputSystem';

describe('Esquiva sem querer ao fechar diálogo', () => {
  it('quadros seguidos da partida contam toques normalmente', () => {
    expect(isResumeFrame(1000, 1016)).toBe(false);
    expect(isResumeFrame(1000, 1000 + RESUME_GAP_MS)).toBe(false);
  });

  it('o primeiro quadro depois de um diálogo (partida congelada) ignora toques', () => {
    expect(isResumeFrame(1000, 1000 + RESUME_GAP_MS + 1)).toBe(true);
    expect(isResumeFrame(1000, 6000)).toBe(true);
  });

  it('o primeiro quadro da partida não é tratado como volta', () => {
    expect(isResumeFrame(undefined, 5000)).toBe(false);
  });
});

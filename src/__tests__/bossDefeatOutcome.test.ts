import { describe, it, expect } from 'vitest';
import { getBossDefeatOutcome } from '../config/balance';

describe('getBossDefeatOutcome (Desfecho de Derrota de Chefe por Modo de Jogo)', () => {
  it('retorna "chapter-end" no modo história ("story")', () => {
    expect(getBossDefeatOutcome('story')).toBe('chapter-end');
  });

  it('retorna "continue-run" no modo infinito ("endless")', () => {
    expect(getBossDefeatOutcome('endless')).toBe('continue-run');
  });

  it('retorna "continue-run" no modo sandbox ("sandbox")', () => {
    expect(getBossDefeatOutcome('sandbox')).toBe('continue-run');
  });

  it('retorna "continue-run" para modos desconhecidos ou vazios (fallback defensivo)', () => {
    expect(getBossDefeatOutcome('')).toBe('continue-run');
    expect(getBossDefeatOutcome('custom')).toBe('continue-run');
  });
});

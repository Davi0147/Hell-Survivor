import { describe, it, expect } from 'vitest';
import { altarCompletionAction, shouldAutoCloseAltarScreen } from '../systems/altarRules';

describe('Altar de Ascensão sem arma para evoluir (travava o jogo)', () => {
  it('com carta de evolução, abre a escolha', () => {
    expect(altarCompletionAction(1)).toBe('open-cards');
    expect(altarCompletionAction(3)).toBe('open-cards');
  });

  it('sem carta (evoluiu pelo baú antes), dá o prêmio no chão em vez de pausar', () => {
    expect(altarCompletionAction(0)).toBe('fallback-reward');
  });

  it('a tela de cartas do altar fecha sozinha se abrir vazia', () => {
    expect(shouldAutoCloseAltarScreen(true, 0)).toBe(true);
    expect(shouldAutoCloseAltarScreen(true, 2)).toBe(false);
    expect(shouldAutoCloseAltarScreen(false, 0)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { altarCompletionAction, shouldAutoCloseAltarScreen, altarPresence } from '../systems/altarRules';

describe('Altar existe enquanto houver arma pronta para evoluir', () => {
  it('arma no máximo e sem altar: espera o atraso e surge', () => {
    expect(altarPresence(false, 1, 0, 3000)).toBe('wait');
    expect(altarPresence(false, 1, 3000, 3000)).toBe('spawn');
  });

  it('evoluiu a única arma: o altar some', () => {
    expect(altarPresence(true, 0, 0, 3000)).toBe('despawn');
  });

  it('depois de usar um altar, o próximo só surge quando a recarga (3 min) zera', () => {
    expect(altarPresence(false, 1, 99999, 3000, 1000)).toBe('wait');
    expect(altarPresence(false, 1, 3000, 3000, 0)).toBe('spawn');
  });

  it('altar com arma pronta fica; sem arma e sem altar nada acontece', () => {
    expect(altarPresence(true, 2, 0, 3000)).toBe('keep');
    expect(altarPresence(false, 0, 99999, 3000)).toBe('keep');
  });
});

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

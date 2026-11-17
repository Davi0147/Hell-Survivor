import { describe, it, expect } from 'vitest';
import { getGameWidthForScreen, GAME_MIN_WIDTH, GAME_MAX_WIDTH } from '../config/screenFit';

describe('getGameWidthForScreen (largura do jogo pelo formato da tela)', () => {
  it('monitor 16:9 continua 1280', () => {
    expect(getGameWidthForScreen(1920, 1080)).toBe(1280);
  });

  it('celular deitado (~20:9) estica a largura e some a borda preta', () => {
    const w = getGameWidthForScreen(2400, 1080);
    expect(w).toBe(1600);
  });

  it('nunca passa de 21:9 nem fica menor que 16:9', () => {
    expect(getGameWidthForScreen(3440, 1000)).toBe(GAME_MAX_WIDTH);
    expect(getGameWidthForScreen(1024, 768)).toBe(GAME_MIN_WIDTH);
    expect(getGameWidthForScreen(390, 844)).toBe(GAME_MIN_WIDTH);
  });

  it('tamanhos inválidos caem no padrão e o resultado é sempre par', () => {
    expect(getGameWidthForScreen(0, 0)).toBe(GAME_MIN_WIDTH);
    expect(getGameWidthForScreen(2340, 1080) % 2).toBe(0);
  });
});


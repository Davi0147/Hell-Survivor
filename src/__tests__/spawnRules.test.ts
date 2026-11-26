import { describe, it, expect } from 'vitest';
import { distanceToViewEdge, offscreenSpawnDist } from '../systems/spawnRules';
import { CAMERA_BALANCE } from '../config/balance';
import { GAME_HEIGHT, GAME_MAX_WIDTH } from '../config/screenFit';

const GAME_FIT_FOR_TESTS = { maxWidth: GAME_MAX_WIDTH, height: GAME_HEIGHT };

describe('Horda nasce fora da tela', () => {
  it('distância até a borda do retângulo visível em cada direção', () => {
    expect(distanceToViewEdge(0, 400, 225)).toBeCloseTo(400);
    expect(distanceToViewEdge(Math.PI / 2, 400, 225)).toBeCloseTo(225);
    expect(distanceToViewEdge(Math.PI, 400, 225)).toBeCloseTo(400);
    // Diagonal: bate no topo antes da lateral
    expect(distanceToViewEdge(Math.PI / 4, 400, 225)).toBeCloseTo(225 * Math.SQRT2);
  });

  it('a distância sorteada só é empurrada quando cairia dentro da tela', () => {
    const m = CAMERA_BALANCE.spawnViewMargin;
    expect(offscreenSpawnDist(0, 300, 400, 225, m)).toBe(400 + m);
    expect(offscreenSpawnDist(0, 900, 400, 225, m)).toBe(900);
    expect(offscreenSpawnDist(Math.PI / 2, 340, 400, 225, m)).toBe(340);
  });

  it('com o zoom da partida, nenhum ponto de nascimento fica visível, mesmo na tela mais larga', () => {
    const { maxWidth, height } = GAME_FIT_FOR_TESTS;
    const halfW = maxWidth / 2 / CAMERA_BALANCE.gameplayZoom;
    const halfH = height / 2 / CAMERA_BALANCE.gameplayZoom;
    for (let i = 0; i < 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      const d = offscreenSpawnDist(a, 300, halfW, halfH, CAMERA_BALANCE.spawnViewMargin);
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      expect(Math.abs(x) > halfW || Math.abs(y) > halfH, `ângulo ${i}°`).toBe(true);
    }
  });
});

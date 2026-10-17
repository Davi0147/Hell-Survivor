import { describe, it, expect } from 'vitest';
import { getEnemyScaling } from '../config/balance';

describe('getEnemyScaling (Fórmula Pura de Escalonamento de Inimigos)', () => {
  it('no minuto 0 (início da partida), multiplicadores devem ser exatamente 1.0 (base)', () => {
    const story = getEnemyScaling(0, false);
    expect(story.minutes).toBe(0);
    expect(story.hpMultiplier).toBe(1.0);
    expect(story.damageMultiplier).toBe(1.0);
    expect(story.speedMultiplier).toBe(1.0);

    const endless = getEnemyScaling(0, true);
    expect(endless.hpMultiplier).toBe(1.0);
    expect(endless.damageMultiplier).toBe(1.0);
    expect(endless.speedMultiplier).toBe(1.0);
  });

  it('no minuto 5, calcula corretamente o bônus e a diferença entre História e Infinito', () => {
    const fiveMinutesMs = 5 * 60 * 1000;

    // Modo História (+12% HP/min, +6% Dano/min)
    const story = getEnemyScaling(fiveMinutesMs, false);
    expect(story.minutes).toBe(5);
    expect(story.hpMultiplier).toBeCloseTo(1 + 5 * 0.12, 5); // 1.60
    expect(story.damageMultiplier).toBeCloseTo(1 + 5 * 0.06, 5); // 1.30
    expect(story.speedMultiplier).toBeCloseTo(1 + 5 * 0.02, 5); // 1.10

    // Modo Infinito (+16% HP/min, +8% Dano/min)
    const endless = getEnemyScaling(fiveMinutesMs, true);
    expect(endless.hpMultiplier).toBeCloseTo(1 + 5 * 0.16, 5); // 1.80
    expect(endless.damageMultiplier).toBeCloseTo(1 + 5 * 0.08, 5); // 1.40
    expect(endless.speedMultiplier).toBeCloseTo(1 + 5 * 0.02, 5); // 1.10

    // O Modo Infinito deve ser estritamente mais letal que o Modo História
    expect(endless.hpMultiplier).toBeGreaterThan(story.hpMultiplier);
    expect(endless.damageMultiplier).toBeGreaterThan(story.damageMultiplier);
  });

  it('no minuto 10, calcula escalonamento acumulado corretamente', () => {
    const tenMinutesMs = 10 * 60 * 1000;

    const story = getEnemyScaling(tenMinutesMs, false);
    expect(story.hpMultiplier).toBeCloseTo(2.20, 5);
    expect(story.damageMultiplier).toBeCloseTo(1.60, 5);
    expect(story.speedMultiplier).toBeCloseTo(1.20, 5);

    const endless = getEnemyScaling(tenMinutesMs, true);
    expect(endless.hpMultiplier).toBeCloseTo(2.60, 5);
    expect(endless.damageMultiplier).toBeCloseTo(1.80, 5);
    expect(endless.speedMultiplier).toBeCloseTo(1.20, 5);
  });

  it('velocidade máxima deve ser rigidamente travada no teto de +30% (1.30x)', () => {
    // 20 minutos resultaria em 1 + 20 * 0.02 = 1.40x, mas o teto é 1.30x
    const twentyMinutesMs = 20 * 60 * 1000;
    const scaling = getEnemyScaling(twentyMinutesMs, false);
    expect(scaling.speedMultiplier).toBe(1.30);

    // 60 minutos também deve permanecer estritamente em 1.30x
    const oneHourMs = 60 * 60 * 1000;
    const extremeScaling = getEnemyScaling(oneHourMs, true);
    expect(extremeScaling.speedMultiplier).toBe(1.30);
  });
});

import { describe, it, expect } from 'vitest';
import { decideArcherMove, shouldAbortDraw } from '../entities/enemies/archerRules';
import { ENEMY_BALANCE, BALANCE, getArcherMaxAlive } from '../config/balance';

const a = ENEMY_BALANCE.archer;

describe('Arqueira: distância segura', () => {
  it('longe: corre até a heroína', () => {
    expect(decideArcherMove(a.maxRange + 1, a.minRange, a.maxRange)).toBe('approach');
  });

  it('perto: recua', () => {
    expect(decideArcherMove(a.minRange - 1, a.minRange, a.maxRange)).toBe('retreat');
  });

  it('na faixa segura: para e atira', () => {
    expect(decideArcherMove((a.minRange + a.maxRange) / 2, a.minRange, a.maxRange)).toBe('hold');
  });

  it('fora da tela nunca atira: chega mais perto, mesmo na faixa segura', () => {
    const mid = (a.minRange + a.maxRange) / 2;
    expect(decideArcherMove(mid, a.minRange, a.maxRange, false)).toBe('approach');
  });

  it('perto demais recua mesmo fora da tela (não fica colada na heroína)', () => {
    expect(decideArcherMove(a.minRange - 1, a.minRange, a.maxRange, false)).toBe('retreat');
  });

  it('um passinho não cancela o tiro; avançar de verdade cancela', () => {
    expect(shouldAbortDraw(a.minRange - 10, a.minRange)).toBe(false);
    expect(shouldAbortDraw(a.minRange * 0.5, a.minRange)).toBe(true);
  });
});

describe('Arqueira: números', () => {
  it('atira a cada 1,5 s e a puxada cabe nesse tempo', () => {
    expect(a.fireCooldownMs).toBe(1500);
    expect(a.drawMs).toBeLessThan(a.fireCooldownMs);
  });

  it('é rápida, mas recuando é mais lenta que a heroína andando (dá para alcançar)', () => {
    expect(a.speed).toBeGreaterThan(ENEMY_BALANCE.zombieDog.speed);
    expect(a.speed * a.retreatSpeedMult).toBeLessThan(BALANCE.NIXY.baseSpeed);
  });

  it('a flecha dá tempo de reagir a partir da distância segura', () => {
    expect(a.minRange / a.arrow.speed).toBeGreaterThan(0.45);
  });

  it('aparece só no Infinito, depois de minMinutes', () => {
    expect(getArcherMaxAlive('story', 10)).toBe(0);
    expect(getArcherMaxAlive('endless', a.minMinutes - 0.1)).toBe(0);
    expect(getArcherMaxAlive('endless', a.minMinutes)).toBe(a.maxAlive);
    expect(getArcherMaxAlive('endless', a.lateMinutes)).toBe(a.maxAliveLate);
  });
});

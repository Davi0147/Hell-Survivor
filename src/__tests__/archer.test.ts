import { describe, it, expect } from 'vitest';
import { archerStandoffPoint, isInsideView, shouldAbortDraw, shouldHold, type ViewRect } from '../entities/enemies/archerRules';
import { ENEMY_BALANCE, BALANCE, getArcherMaxAlive } from '../config/balance';

const a = ENEMY_BALANCE.archer;

/** Tela de celular deitado: larga e baixa, heroína no centro (0,0). */
const wideShortView: ViewRect = { left: -330, right: 330, top: -140, bottom: 140 };
const inside = (p: { x: number; y: number }, v: ViewRect) =>
  p.x >= v.left - 0.01 && p.x <= v.right + 0.01 && p.y >= v.top - 0.01 && p.y <= v.bottom + 0.01;

describe('Arqueira: ponto de tiro', () => {
  it('sem limite de tela: fica a `range` da heroína, do lado em que já está', () => {
    const p = archerStandoffPoint(0, 0, 500, 0, a.range);
    expect(p.x).toBeCloseTo(a.range);
    expect(p.y).toBeCloseTo(0);
  });

  it('heroína avançou (arqueira perto demais): o ponto fica mais longe, ela recua', () => {
    const p = archerStandoffPoint(0, 0, 80, 0, a.range);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(a.range);
    expect(p.x).toBeGreaterThan(80);
  });

  it('BUG da arqueira de cima: sem espaço em cima, o ponto escorrega para o lado, dentro da tela e à mesma distância', () => {
    // Arqueira bem em cima da heroína; a tela só tem 140 px para cima (menos que range)
    const p = archerStandoffPoint(0, 0, 5, -300, a.range, wideShortView);
    expect(inside(p, wideShortView)).toBe(true);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(a.range);
    expect(p.x).toBeGreaterThan(0); // vai para o lado em que já estava
  });

  it('o ponto é estável: chegando nele, o próximo ponto calculado é o mesmo (não fica indo e voltando)', () => {
    const p1 = archerStandoffPoint(0, 0, 5, -300, a.range, wideShortView);
    const p2 = archerStandoffPoint(0, 0, p1.x, p1.y, a.range, wideShortView);
    expect(p2.x).toBeCloseTo(p1.x);
    expect(p2.y).toBeCloseTo(p1.y);
  });

  it('em qualquer direção o ponto fica dentro da tela', () => {
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const p = archerStandoffPoint(0, 0, Math.cos(ang) * 400, Math.sin(ang) * 400, a.range, wideShortView);
      expect(inside(p, wideShortView)).toBe(true);
    }
  });

  it('com a câmera real (640x360) e a folga das bordas, o ponto cabe a `range` da heroína', () => {
    const halfW = 320 - a.screenMarginPx;
    const halfH = 180 - a.screenMarginPx;
    expect(Math.hypot(halfW, halfH)).toBeGreaterThan(a.range);
    const view: ViewRect = { left: -halfW, right: halfW, top: -halfH, bottom: halfH };
    const p = archerStandoffPoint(0, 0, 0, -400, a.range, view);
    expect(isInsideView(p.x, p.y, view)).toBe(true);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(a.range);
  });

  it('fora da área segura não conta como parada', () => {
    const view: ViewRect = { left: -100, right: 100, top: -100, bottom: 100 };
    expect(isInsideView(0, -120, view)).toBe(false);
    expect(isInsideView(0, -80, view)).toBe(true);
  });

  it('parada com folga: para perto do ponto e não volta a andar por qualquer tremidinha', () => {
    expect(shouldHold(a.holdPx, a.holdPx, false)).toBe(true);
    expect(shouldHold(a.holdPx + 10, a.holdPx, false)).toBe(false);
    expect(shouldHold(a.holdPx + 10, a.holdPx, true)).toBe(true);
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

  it('a flecha dá tempo de reagir a partir da distância de tiro', () => {
    expect(a.range / a.arrow.speed).toBeGreaterThan(0.45);
  });

  it('limite de vivas: o normal, e mais no Infinito tardio (quando aparece é o cronograma)', () => {
    expect(getArcherMaxAlive(false, 30)).toBe(a.maxAlive);
    expect(getArcherMaxAlive(true, a.lateMinutes - 0.1)).toBe(a.maxAlive);
    expect(getArcherMaxAlive(true, a.lateMinutes)).toBe(a.maxAliveLate);
  });
});

import { describe, it, expect } from 'vitest';
import { pickWalkFacing, pickAttackFacing, fanAngles, tornadoPullSpeed, phaseFloorHp, nextSeraphPattern, seraphTeleportPoint, seraphFlap } from '../systems/shylphRules';
import { SHYLPH_SHEET } from '../config/shylphSheet';

describe('shylphRules', () => {
  it('anda nas 4 direções e espelha o leste para o oeste', () => {
    expect(pickWalkFacing(0)).toEqual({ dir: 'east', flipX: false });
    expect(pickWalkFacing(Math.PI)).toEqual({ dir: 'east', flipX: true });
    expect(pickWalkFacing(Math.PI / 2)).toEqual({ dir: 'south', flipX: false });
    expect(pickWalkFacing(-Math.PI / 2)).toEqual({ dir: 'north', flipX: false });
  });

  it('ataca de frente só quando o alvo está bem abaixo; senão de lado', () => {
    expect(pickAttackFacing(Math.PI / 2, true).dir).toBe('south');
    expect(pickAttackFacing(-Math.PI / 2, true).dir).toBe('east');
    expect(pickAttackFacing(Math.PI * 0.9, true)).toEqual({ dir: 'east', flipX: true });
    // Lambida não tem frente
    expect(pickAttackFacing(Math.PI / 2, false).dir).toBe('east');
  });

  it('leque centrado no alvo com a abertura pedida', () => {
    const a = fanAngles(1, 5, 0.8);
    expect(a).toHaveLength(5);
    expect(a[2]).toBeCloseTo(1);
    expect(a[4] - a[0]).toBeCloseTo(0.8);
    expect(fanAngles(2, 1, 0.8)).toEqual([2]);
  });

  it('tornado puxa mais perto do centro e nada fora do raio', () => {
    expect(tornadoPullSpeed(0, 190, 95)).toBe(95);
    expect(tornadoPullSpeed(95, 190, 95)).toBeCloseTo(47.5);
    expect(tornadoPullSpeed(200, 190, 95)).toBe(0);
  });

  it('um golpe enorme não pula fases: a vida para logo abaixo do limite', () => {
    const at = { seraph: 0.5, final: 0.25 };
    expect(phaseFloorHp(28000, 'normal', at)).toBe(13999);
    expect(phaseFloorHp(28000, 'seraph', at)).toBe(6999);
    expect(phaseFloorHp(28000, 'final', at)).toBe(0);
  });

  it('o Serafim troca de padrão a cada reaparição, em ciclo', () => {
    expect(nextSeraphPattern(0)).toBe('ring');
    expect(nextSeraphPattern(1)).toBe('spiral');
    expect(nextSeraphPattern(4)).toBe('ring');
  });

  it('o Serafim reaparece entre a distância mínima e a máxima da heroína', () => {
    const p = seraphTeleportPoint(100, 50, 0, 0.5, 240, 360);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(50);
    const q = seraphTeleportPoint(0, 0, 0.37, 1, 240, 360);
    expect(Math.hypot(q.x, q.y)).toBeCloseTo(360);
  });

  it('bater de asas: batida rápida erguendo o corpo, subida lenta afundando, sem saltos', () => {
    const cfg = { periodMs: 1000, downstrokeFraction: 0.3, liftPx: 10, sinkPx: 4 };
    expect(seraphFlap(0, cfg)).toEqual({ wingsDown: true, offsetY: 4 });
    expect(seraphFlap(150, cfg).wingsDown).toBe(true);
    expect(seraphFlap(299, cfg).offsetY).toBeCloseTo(-10, 0);
    expect(seraphFlap(300, cfg)).toEqual({ wingsDown: false, offsetY: -10 });
    expect(seraphFlap(999, cfg).offsetY).toBeCloseTo(4, 1);
    // Ciclo seguinte continua igual
    expect(seraphFlap(1150, cfg)).toEqual(seraphFlap(150, cfg));
  });

  it('a folha tem todas as animações que a luta usa', () => {
    for (const k of ['walk-south', 'walk-east', 'walk-north', 'lick-east', 'throw-south', 'throw-east', 'flap-south', 'flap-east', 'kneel-south'] as const) {
      expect(SHYLPH_SHEET[k].count).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { AZAZEL_BOSS_BALANCE } from '../config/balance';
import {
  getCrystalHordeStrength,
  getCrystalHordeScaling,
  getCrystalWaveIntervalMs,
  getBossRegenHp,
  clampToCircle,
  handSlamCount,
  handSlamTargets,
  isInsideHandSlam,
} from '../systems/crystalPhaseRules';

const C = AZAZEL_BOSS_BALANCE.crystalPhase;

describe('Fase dos cristais: enrolar custa caro', () => {
  it('a horda começa normal e fica mais forte com o tempo, até o teto', () => {
    expect(getCrystalHordeStrength(0)).toBe(1);
    expect(getCrystalHordeStrength(60_000)).toBeGreaterThan(getCrystalHordeStrength(30_000));
    expect(getCrystalHordeStrength(60 * 60_000)).toBe(C.hordeStrengthMax);
  });

  it('o dano dos monstros sobe mais devagar que a vida', () => {
    const s = getCrystalHordeScaling(2);
    expect(s.hp).toBe(2);
    expect(s.damage).toBeGreaterThan(1);
    expect(s.damage).toBeLessThan(s.hp);
    expect(getCrystalHordeScaling(1)).toEqual({ hp: 1, damage: 1 });
  });

  it('as levas vêm mais rápido com a força, sem passar do mínimo', () => {
    expect(getCrystalWaveIntervalMs(1)).toBe(AZAZEL_BOSS_BALANCE.dimensionWaveIntervalMs);
    expect(getCrystalWaveIntervalMs(1.5)).toBeLessThan(getCrystalWaveIntervalMs(1));
    expect(getCrystalWaveIntervalMs(C.hordeStrengthMax)).toBeGreaterThanOrEqual(C.minWaveIntervalMs);
  });

  it('o Azazel recupera vida devagar até o teto', () => {
    const max = 10_000;
    const after10s = getBossRegenHp(2000, max, 10_000);
    expect(after10s).toBeCloseTo(2000 + max * C.bossRegenPerSec * 10);
    expect(getBossRegenHp(2000, max, 10 * 60_000)).toBe(max * C.bossRegenCap);
    // Acima do teto não mexe
    expect(getBossRegenHp(max * 0.9, max, 1000)).toBe(max * 0.9);
  });

  it('a recuperação é lenta: leva mais de um minuto para chegar ao teto', () => {
    const secondsToCap = (C.bossRegenCap - 0.2) / C.bossRegenPerSec;
    expect(secondsToCap).toBeGreaterThan(60);
  });

  it('os cristais ficam dentro da área com folga', () => {
    expect(C.crystalDist.max).toBeLessThan(C.arenaRadius - 60);
  });

  it('a heroína não passa da borda do círculo', () => {
    expect(clampToCircle(10, 0, 0, 0, 100)).toEqual({ x: 10, y: 0, clamped: false });
    const out = clampToCircle(300, 400, 0, 0, 100);
    expect(out.clamped).toBe(true);
    // Volta para a borda, meio pixel para dentro (folga contra arredondamento)
    expect(Math.hypot(out.x, out.y)).toBeLessThan(100);
    expect(Math.hypot(out.x, out.y)).toBeGreaterThan(99);
  });

  it('tapa da mão: uma mão no começo, duas depois que a fase se arrasta', () => {
    const H = C.handSlam;
    expect(handSlamCount(0)).toBe(1);
    expect(handSlamCount(H.secondHandAfterMs - 1)).toBe(1);
    expect(handSlamCount(H.secondHandAfterMs)).toBe(2);
  });

  it('tapa da mão: a segunda mão mira para onde ela está indo, ou cai ao lado se parada', () => {
    const H = C.handSlam;
    const [first, second] = handSlamTargets(2, 100, 50, 200, 0);
    expect(first).toEqual({ x: 100, y: 50 });
    expect(second.x).toBeCloseTo(100 + 200 * (H.leadMs / 1000));
    expect(second.y).toBe(50);
    // Parada, as duas áreas não se encostam: sobra um vão entre elas
    const still = handSlamTargets(2, 0, 0, 0, 0);
    expect(Math.abs(still[1].x - still[0].x)).toBeGreaterThan(H.hitbox.width);
    expect(handSlamTargets(1, 0, 0, 300, 300)).toHaveLength(1);
  });

  it('tapa da mão: a área é um retângulo que pega a mão e o braço', () => {
    const hb = C.handSlam.hitbox;
    // Palma, ponta dos dedos e braço lá em cima acertam
    expect(isInsideHandSlam(0, 0, 0, 0)).toBe(true);
    expect(isInsideHandSlam(0, hb.below, 0, 0)).toBe(true);
    expect(isInsideHandSlam(0, -hb.above + 1, 0, 0)).toBe(true);
    expect(isInsideHandSlam(hb.width / 2, -200, 0, 0)).toBe(true);
    // Fora da largura do braço, abaixo dos dedos ou acima do ombro, não
    expect(isInsideHandSlam(hb.width / 2 + 1, 0, 0, 0)).toBe(false);
    expect(isInsideHandSlam(0, hb.below + 1, 0, 0)).toBe(false);
    expect(isInsideHandSlam(0, -hb.above - 1, 0, 0)).toBe(false);
  });

  it('tapa da mão: dá tempo de sair para o lado e o golpe não mata de uma vez', () => {
    const H = C.handSlam;
    // Andando normal (160 px/s), dá para sair de lado mesmo estando no meio do braço
    expect(H.hitbox.width / 2 / 160).toBeLessThan(H.telegraphMs / 1000);
    expect(H.everyMs).toBeGreaterThan(H.telegraphMs);
    expect(H.hitbox.width).toBeLessThan(C.arenaRadius);
    expect(H.damage).toBeLessThanOrEqual(100 * 0.45);
  });

  it('quem foi devolvido à borda não é devolvido de novo (travava a heroína na borda)', () => {
    // Caso reproduzido no jogo: empurrada para a borda, ela ficava 6e-14 px do lado de fora
    // e a borda disparava em todo quadro, zerando a velocidade para sempre.
    const back = clampToCircle(262.3738659105235, 389.94865621920883, 0, 0, 470);
    expect(clampToCircle(back.x, back.y, 0, 0, 470).clamped).toBe(false);
    for (const [x, y] of [[700, 300], [-523.7, 911.2], [0.1, -999], [333.3, 333.3]]) {
      const once = clampToCircle(x, y, 17.3, -41.9, 470);
      expect(once.clamped).toBe(true);
      expect(clampToCircle(once.x, once.y, 17.3, -41.9, 470).clamped).toBe(false);
    }
  });
});

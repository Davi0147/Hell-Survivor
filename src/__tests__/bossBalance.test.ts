import { describe, it, expect } from 'vitest';
import {
  BALANCE,
  SUCCUBUS_BOSS_BALANCE,
  AZAZEL_BOSS_BALANCE,
  BOSS_FATIGUE,
  BOSS_MERCY,
  REVIVAL_BALANCE,
  getBossFatigueMultiplier,
  getBossMercy,
} from '../config/balance';

const BASE_HP = BALANCE.NIXY.maxHp;

describe('Regras de justiça das lutas de chefe', () => {
  it('Rosalin (História): nenhum golpe tira mais de 45% da vida base', () => {
    const { attacks, story } = SUCCUBUS_BOSS_BALANCE;
    for (const dmg of [attacks.dashDamage, attacks.slamDamage, attacks.orbDamage, story.damage]) {
      expect(dmg * story.attackDamageMultiplier).toBeLessThanOrEqual(BASE_HP * 0.45);
    }
  });

  it('Rosalin (Infinito): bate mais forte, mas nunca mata com dois golpes', () => {
    const { attacks, endless, story } = SUCCUBUS_BOSS_BALANCE;
    expect(endless.attackDamageMultiplier).toBeGreaterThan(story.attackDamageMultiplier);
    expect(attacks.slamDamage * endless.attackDamageMultiplier * 2).toBeGreaterThan(BASE_HP * 0.9);
    expect(attacks.slamDamage * endless.attackDamageMultiplier).toBeLessThanOrEqual(BASE_HP * 0.55);
  });

  it('Rosalin: o golpe mais forte é o mais telegrafado', () => {
    const { attacks } = SUCCUBUS_BOSS_BALANCE;
    expect(attacks.slamDamage).toBeGreaterThan(attacks.dashDamage);
    expect(attacks.slamChargeMs).toBeGreaterThan(attacks.dashTelegraphMs);
    expect(attacks.dashTelegraphMs).toBeGreaterThanOrEqual(800);
  });

  it('Rosalin: fica vulnerável depois do salto e resistente enquanto canaliza', () => {
    const t = SUCCUBUS_BOSS_BALANCE.damageTaken;
    expect(t.recovering).toBeGreaterThan(1);
    expect(t.channeling).toBeLessThan(t.normal);
  });

  it('Azazel: nenhum golpe tira mais de 25% da vida base (são muitos na tela)', () => {
    const a = AZAZEL_BOSS_BALANCE;
    const hits = [
      a.baseContactDamage, a.cloneContactDamage, a.directedBurstOrbDamage, a.teleportOrbDamage,
      a.spiralOrbDamage, a.darkCloneOrbDamage, a.rapidDashDamage, a.lightningBoltDamage, a.darkFiveDashesDamage,
    ];
    for (const dmg of hits) {
      expect(dmg).toBeGreaterThan(0);
      expect(dmg).toBeLessThanOrEqual(BASE_HP * 0.25);
    }
  });

  it('Azazel: golpes telegrafados doem mais que os orbes da chuva de projéteis', () => {
    const a = AZAZEL_BOSS_BALANCE;
    const strongestOrb = Math.max(a.directedBurstOrbDamage, a.teleportOrbDamage, a.spiralOrbDamage, a.darkCloneOrbDamage);
    expect(a.rapidDashDamage).toBeGreaterThan(strongestOrb);
    expect(a.lightningBoltDamage).toBeGreaterThan(strongestOrb);
  });

  it('Azazel: investidas no escuro dão pelo menos 0,4s para reagir', () => {
    expect(AZAZEL_BOSS_BALANCE.darkDashAimMs).toBeGreaterThanOrEqual(400);
  });
});

describe('getBossFatigueMultiplier (exaustão em lutas longas)', () => {
  const cfg = BOSS_FATIGUE.rosalin;

  it('não muda nada antes do tempo limite', () => {
    expect(getBossFatigueMultiplier(0, cfg)).toBe(1);
    expect(getBossFatigueMultiplier(cfg.startsAfterMs - 1, cfg)).toBe(1);
  });

  it('sobe em degraus depois do tempo limite', () => {
    expect(getBossFatigueMultiplier(cfg.startsAfterMs, cfg)).toBeCloseTo(1 + cfg.bonusPerStep);
    expect(getBossFatigueMultiplier(cfg.startsAfterMs + cfg.stepMs, cfg)).toBeCloseTo(1 + cfg.bonusPerStep * 2);
  });

  it('nunca passa do teto', () => {
    expect(getBossFatigueMultiplier(cfg.startsAfterMs * 100, cfg)).toBeCloseTo(1 + cfg.maxBonus);
  });

  it('a luta do Azazel é mais longa, então ele demora mais para cansar', () => {
    expect(BOSS_FATIGUE.azazel.startsAfterMs).toBeGreaterThan(BOSS_FATIGUE.rosalin.startsAfterMs);
  });
});

describe('getBossMercy (revanche fica mais leve a cada morte)', () => {
  it('primeira tentativa é a luta cheia', () => {
    expect(getBossMercy(0)).toEqual({ hpMultiplier: 1, damageMultiplier: 1, stacks: 0 });
  });

  it('cada morte alivia vida e dano do chefe', () => {
    const one = getBossMercy(1);
    const two = getBossMercy(2);
    expect(one.hpMultiplier).toBeCloseTo(1 - BOSS_MERCY.hpReductionPerDeath);
    expect(two.hpMultiplier).toBeLessThan(one.hpMultiplier);
    expect(two.damageMultiplier).toBeLessThan(one.damageMultiplier);
  });

  it('tem teto: o chefe nunca vira passeio', () => {
    const capped = getBossMercy(999);
    expect(capped.stacks).toBe(BOSS_MERCY.maxStacks);
    expect(capped.hpMultiplier).toBeGreaterThanOrEqual(0.7);
    expect(capped.damageMultiplier).toBeGreaterThanOrEqual(0.75);
  });

  it('ignora valores inválidos', () => {
    expect(getBossMercy(-3).stacks).toBe(0);
    expect(getBossMercy(1.9).stacks).toBe(1);
  });
});

describe('REVIVAL_BALANCE (Pacto Demoníaco)', () => {
  it('volta com parte da vida e tempo de fuga', () => {
    expect(REVIVAL_BALANCE.hpFraction).toBeGreaterThan(0);
    expect(REVIVAL_BALANCE.hpFraction).toBeLessThanOrEqual(1);
    expect(REVIVAL_BALANCE.invulnerableMs).toBeGreaterThanOrEqual(2000);
  });
});

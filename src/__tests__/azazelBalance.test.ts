import { describe, it, expect } from 'vitest';
import { AZAZEL_BOSS_BALANCE as A, BALANCE } from '../config/balance';

/**
 * Regra de ouro das lutas de chefe (balance.ts): nenhum golpe sozinho tira mais de ~45%
 * da vida base da heroína, e golpes não se somam no mesmo instante.
 */
describe('Azazel: nenhum golpe mata de uma vez', () => {
  const maxSingleHit = BALANCE.NIXY.maxHp * 0.45;
  const hits: Record<string, number> = {
    contato: A.baseContactDamage,
    clone: A.cloneContactDamage,
    orbeDirecionada: A.directedBurstOrbDamage,
    orbeTeleporte: A.teleportOrbDamage,
    orbeEspiral: A.spiralOrbDamage,
    orbeClones: A.darkCloneOrbDamage,
    dash: A.rapidDashDamage,
    raio: A.lightningBoltDamage,
    dashEscuridao: A.darkFiveDashesDamage,
    pena: A.featherFan.damage,
    aureola: A.haloWave.damage,
  };

  for (const [name, dmg] of Object.entries(hits)) {
    it(`${name} (${dmg}) fica abaixo de 45% da vida base`, () => {
      expect(dmg).toBeGreaterThan(0);
      expect(dmg).toBeLessThanOrEqual(maxSingleHit);
    });
  }

  it('existe imunidade curta entre golpes (no máximo ~2 acertos por segundo)', () => {
    expect(A.playerHitCooldownMs).toBeGreaterThanOrEqual(400);
  });

  it('o cone das penas trava antes de disparar (dá tempo de sair)', () => {
    expect(A.featherFan.lockMs).toBeGreaterThan(200);
    expect(A.featherFan.lockMs).toBeLessThan(A.featherFan.telegraphMs);
  });

  it('a auréola cabe na arena e carrega antes de soltar', () => {
    expect(A.haloWave.telegraphMs).toBeGreaterThanOrEqual(800);
    expect(A.haloWave.endRadius).toBeGreaterThan(A.haloWave.startRadius);
  });
});

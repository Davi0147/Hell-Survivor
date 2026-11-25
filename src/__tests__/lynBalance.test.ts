import { describe, it, expect } from 'vitest';
import { LYN_BALANCE as L, SUCCUBUS_BOSS_BALANCE as R } from '../config/balance';

describe('Lyn, a serva súcubo: luta própria e mais leve que a da Rosalin', () => {
  it('cada golpe dela bate menos que o golpe equivalente da chefe', () => {
    expect(L.swoop.damage).toBeLessThan(R.attacks.dashDamage);
    expect(L.spiral.damage).toBeLessThan(R.attacks.orbDamage);
  });

  it('o rasante triplo inteiro, se pegar todas, não passa de ~45% da vida base', () => {
    expect(L.swoop.damage * L.swoop.count).toBeLessThanOrEqual(48);
  });

  it('o aviso do rasante trava a mira antes de soltar, dando tempo de sair da linha', () => {
    expect(L.swoop.aimMs).toBeLessThan(L.swoop.telegraphMs);
    expect(L.swoop.telegraphMs - L.swoop.aimMs).toBeGreaterThanOrEqual(200);
  });

  it('depois da sequência fica cansada e leva mais dano (a recompensa por desviar)', () => {
    expect(L.swoop.windedMs).toBeGreaterThanOrEqual(1000);
    expect(L.damageTaken.winded).toBeGreaterThan(L.damageTaken.normal);
  });

  it('a espiral é mais lenta que os orbes da chefe, para dar para passar entre eles', () => {
    expect(L.spiral.speed).toBeLessThan(R.attacks.orbSpeed);
  });
});

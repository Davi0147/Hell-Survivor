import { describe, it, expect } from 'vitest';
import { remainingPierce } from '../entities/weapons/pierceRules';
import { ENEMY_BALANCE, getColossusMaxAlive } from '../config/balance';

describe('Colossus: escudo contra perfuração', () => {
  it('inimigo comum gasta um ponto de perfuração', () => {
    expect(remainingPierce(3, { blocksPierce: false })).toBe(2);
  });

  it('Colossus para o projétil na hora, mesmo com muita perfuração', () => {
    expect(remainingPierce(5, { blocksPierce: true })).toBe(0);
  });
});

describe('Colossus: quando aparece', () => {
  const c = ENEMY_BALANCE.colossus;

  it('não aparece na História nem no Modo de Teste automático', () => {
    expect(getColossusMaxAlive('story', 20)).toBe(0);
    expect(getColossusMaxAlive('sandbox', 20)).toBe(0);
  });

  it('no Infinito começa em minMinutes e sobe o limite no fim', () => {
    expect(getColossusMaxAlive('endless', c.minMinutes - 0.1)).toBe(0);
    expect(getColossusMaxAlive('endless', c.minMinutes)).toBe(c.maxAlive);
    expect(getColossusMaxAlive('endless', c.lateMinutes)).toBe(c.maxAliveLate);
  });

  it('é tanque: bem mais vida que o cão, dano de contato comum', () => {
    expect(c.hp).toBeGreaterThanOrEqual(ENEMY_BALANCE.zombieDog.hp * 10);
    expect(c.damage).toBeLessThanOrEqual(ENEMY_BALANCE.zombieDog.damage + 3);
    expect(c.speed).toBeLessThan(ENEMY_BALANCE.zombieDog.speed);
  });
});

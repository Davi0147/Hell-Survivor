import { describe, it, expect } from 'vitest';
import { ENEMY_BALANCE, SUCCUBUS_BOSS_BALANCE, AZAZEL_BOSS_BALANCE } from '../config/balance';

describe('ENEMY_BALANCE (atributos centralizados de inimigos e chefes)', () => {
  it('todo inimigo tem HP, velocidade e dano positivos', () => {
    for (const [id, stats] of Object.entries(ENEMY_BALANCE)) {
      expect(stats.hp, id).toBeGreaterThan(0);
      expect(stats.speed, id).toBeGreaterThan(0);
      expect(stats.damage, id).toBeGreaterThan(0);
    }
  });

  it('elites são mais fortes que a versão comum', () => {
    expect(ENEMY_BALANCE.zombieDogElite.hp).toBeGreaterThan(ENEMY_BALANCE.zombieDog.hp);
    expect(ENEMY_BALANCE.zombieDogElite.damage).toBeGreaterThan(ENEMY_BALANCE.zombieDog.damage);
  });

  it('a hierarquia de ameaça é respeitada: comum < minichefe < chefe', () => {
    const toughestCommon = Math.max(ENEMY_BALANCE.skullSlime.hp, ENEMY_BALANCE.mummy.hp, ENEMY_BALANCE.zombieDogElite.hp);
    expect(ENEMY_BALANCE.titanCerberus.hp).toBeGreaterThan(toughestCommon);
    expect(ENEMY_BALANCE.matriarchSuccubus.hp).toBeGreaterThan(ENEMY_BALANCE.titanCerberus.hp);
    expect(SUCCUBUS_BOSS_BALANCE.story.hp).toBeGreaterThan(ENEMY_BALANCE.matriarchSuccubus.hp);
    expect(AZAZEL_BOSS_BALANCE.maxHp).toBeGreaterThan(SUCCUBUS_BOSS_BALANCE.story.hp);
  });

  it('a Rosalin do Modo Infinito é mais forte que a do Modo História', () => {
    expect(SUCCUBUS_BOSS_BALANCE.endless.hp).toBeGreaterThan(SUCCUBUS_BOSS_BALANCE.story.hp);
    expect(SUCCUBUS_BOSS_BALANCE.endless.damage).toBeGreaterThan(SUCCUBUS_BOSS_BALANCE.story.damage);
  });

  it('nenhum inimigo comum corre mais que o sprint da heroína', () => {
    // 270 é o sprintSpeed da Nixy; o jogador precisa sempre conseguir fugir correndo.
    for (const id of ['zombieDog', 'zombieDogElite', 'skullSlime', 'bloodBat', 'mummy'] as const) {
      expect(ENEMY_BALANCE[id].speed, id).toBeLessThan(270);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { getChapterConfig, CHAPTER_CONFIG, CHAPTER_CONFIG_FALLBACK, AZAZEL_BOSS_BALANCE } from '../config/balance';

describe('CHAPTER_CONFIG (Tabela Centralizada de Configurações de Capítulos)', () => {
  it('Capítulo 1: meta 900 almas, multiplicador 1.0x, intervalo de altar 75000ms', () => {
    const config = getChapterConfig(1);
    expect(config.targetSouls).toBe(900);
    expect(config.enemyStatMultiplier).toBe(1.0);
    expect(config.altarSpawnIntervalMs).toBe(75000);
    expect(config).toEqual(CHAPTER_CONFIG[1]);
  });

  it('Capítulo 2: meta 1350 almas (+50%), multiplicador 1.2x (+20%), intervalo de altar 75000ms', () => {
    const config = getChapterConfig(2);
    expect(config.targetSouls).toBe(1350);
    expect(config.enemyStatMultiplier).toBe(1.2);
    expect(config.altarSpawnIntervalMs).toBe(75000);
    expect(config).toEqual(CHAPTER_CONFIG[2]);
  });

  it('Fallback (Capítulo 202 Dimensão Azazel, desconhecidos, 0 ou negativos): 900 almas, 1.0x, 75000ms', () => {
    const azazelDim = getChapterConfig(202);
    expect(azazelDim).toEqual(CHAPTER_CONFIG_FALLBACK);
    expect(azazelDim.targetSouls).toBe(900);
    expect(azazelDim.enemyStatMultiplier).toBe(1.0);
    expect(azazelDim.altarSpawnIntervalMs).toBe(75000);

    const unknownChapter = getChapterConfig(999);
    expect(unknownChapter).toEqual(CHAPTER_CONFIG_FALLBACK);

    const zeroChapter = getChapterConfig(0);
    expect(zeroChapter).toEqual(CHAPTER_CONFIG_FALLBACK);

    const negativeChapter = getChapterConfig(-1);
    expect(negativeChapter).toEqual(CHAPTER_CONFIG_FALLBACK);
  });

  it('AZAZEL_BOSS_BALANCE: dano base e habilidades de Azazel reduzidos em 70% (30% do original)', () => {
    expect(AZAZEL_BOSS_BALANCE.maxHp).toBe(16000);
    expect(AZAZEL_BOSS_BALANCE.speed).toBe(138);
    expect(AZAZEL_BOSS_BALANCE.scale).toBe(1.65);

    expect(AZAZEL_BOSS_BALANCE.baseContactDamage).toBe(Math.round(42 * 0.30)); // 13
    expect(AZAZEL_BOSS_BALANCE.cloneContactDamage).toBe(Math.round(32 * 0.30)); // 10
    expect(AZAZEL_BOSS_BALANCE.directedBurstOrbDamage).toBe(Math.round(30 * 0.30)); // 9
    expect(AZAZEL_BOSS_BALANCE.teleportOrbDamage).toBe(Math.round(28 * 0.30)); // 8
    expect(AZAZEL_BOSS_BALANCE.rapidDashDamage).toBe(Math.round(46 * 0.30)); // 14
    expect(AZAZEL_BOSS_BALANCE.lightningBoltDamage).toBe(Math.round(48 * 0.30)); // 14
    expect(AZAZEL_BOSS_BALANCE.spiralOrbDamage).toBe(Math.round(26 * 0.30)); // 8
    expect(AZAZEL_BOSS_BALANCE.darkFiveDashesDamage).toBe(Math.round(38 * 0.30)); // 11
    expect(AZAZEL_BOSS_BALANCE.darkCloneOrbDamage).toBe(Math.round(25 * 0.30)); // 8
  });
});

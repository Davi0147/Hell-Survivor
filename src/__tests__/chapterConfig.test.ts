import { describe, it, expect } from 'vitest';
import { getChapterConfig, CHAPTER_CONFIG, CHAPTER_CONFIG_FALLBACK } from '../config/balance';

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
});

import { describe, it, expect } from 'vitest';
import {
  accordionWidths,
  chapterState,
  formatBestTime,
  improvesBestTime,
  initialFocus,
  isPlayable,
  type ChapterRecord,
} from '../systems/chapterProgress';
import { CHAPTERS, CHAPTER_COUNT } from '../config/chapterCatalog';
import { migrateChapterRecords, sanitizeChapterRecords } from '../systems/MetaProgressManager';

const done = (bestTimeSec = 0): ChapterRecord => ({ completed: true, bestTimeSec });

describe('Capítulos: o que está liberado', () => {
  it('o 1 começa liberado; o 2 abre quando o 1 é vencido', () => {
    expect(chapterState(1, true, {})).toBe('open');
    expect(chapterState(2, true, {})).toBe('locked');
    expect(chapterState(2, true, { 1: done() })).toBe('open');
    expect(chapterState(1, true, { 1: done() })).toBe('cleared');
  });

  it('o 3 só abre depois de vencer o 2 (não dá para pular capítulo)', () => {
    expect(CHAPTERS.find((c) => c.number === 3)?.released).toBe(true);
    expect(chapterState(3, true, {})).toBe('locked');
    expect(chapterState(3, true, { 1: done() })).toBe('locked');
    expect(chapterState(3, true, { 1: done(), 2: done() })).toBe('open');
  });

  it('não lançado fica bloqueado mesmo com o anterior vencido', () => {
    expect(chapterState(3, false, { 1: done(), 2: done() })).toBe('coming-soon');
    expect(isPlayable('coming-soon')).toBe(false);
    expect(isPlayable('locked')).toBe(false);
    expect(isPlayable('open')).toBe(true);
    expect(isPlayable('cleared')).toBe(true);
  });

  it('o catálogo tem 10 capítulos; só os lançados têm título e resumo', () => {
    expect(CHAPTERS).toHaveLength(CHAPTER_COUNT);
    expect(CHAPTERS.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const c of CHAPTERS.filter((x) => x.released)) {
      expect(c.title).not.toBe('???');
      expect(c.summary.length).toBeGreaterThan(20);
      expect(c.summary.length).toBeLessThan(200);
    }
    expect(CHAPTERS[0].released).toBe(true);
  });

  it('o foco começa no capítulo jogável mais avançado', () => {
    expect(initialFocus(['open', 'locked', 'coming-soon'])).toBe(0);
    expect(initialFocus(['cleared', 'open', 'coming-soon'])).toBe(1);
    expect(initialFocus(['cleared', 'cleared', 'coming-soon'])).toBe(1);
  });
});

describe('Capítulos: painéis lado a lado', () => {
  it('o focado abre e os outros dividem o resto, ocupando a largura toda', () => {
    const w = accordionWidths(10, 3, 1192, 8, 430, 56);
    expect(w[3]).toBe(430);
    const others = w.filter((_, i) => i !== 3);
    expect(new Set(others.map((x) => x.toFixed(3))).size).toBe(1);
    expect(w.reduce((a, b) => a + b, 0) + 8 * 9).toBeCloseTo(1192);
  });

  it('tela estreita: as faixas não ficam finas demais (o aberto encolhe)', () => {
    const w = accordionWidths(10, 0, 800, 8, 430, 56);
    expect(Math.min(...w)).toBeGreaterThanOrEqual(56);
    expect(w.reduce((a, b) => a + b, 0) + 8 * 9).toBeCloseTo(800);
  });
});

describe('Capítulos: melhor tempo', () => {
  it('formata minutos e segundos (e horas quando passa de uma)', () => {
    expect(formatBestTime(0)).toBe('--:--');
    expect(formatBestTime(65)).toBe('01:05');
    expect(formatBestTime(754.9)).toBe('12:34');
    expect(formatBestTime(3723)).toBe('1:02:03');
  });

  it('só troca o recorde por um tempo menor', () => {
    expect(improvesBestTime(0, 600)).toBe(true);
    expect(improvesBestTime(600, 500)).toBe(true);
    expect(improvesBestTime(500, 600)).toBe(false);
    expect(improvesBestTime(500, 0)).toBe(false);
  });
});

describe('Save: migração para a versão com capítulos', () => {
  it('quem já derrotou um chefe ou chegou no Azazel mantém o Capítulo 2 liberado', () => {
    expect(migrateChapterRecords({ bossesDefeated: 1, bossDeaths: {} })[1]?.completed).toBe(true);
    expect(migrateChapterRecords({ bossesDefeated: 0, bossDeaths: { azazel: 2 } })[1]?.completed).toBe(true);
  });

  it('save novo (sem chefe vencido) começa só com o Capítulo 1', () => {
    expect(migrateChapterRecords({ bossesDefeated: 0, bossDeaths: { rosalin: 3 } })).toEqual({});
  });

  it('descarta dados estragados do save', () => {
    const out = sanitizeChapterRecords({ 1: { completed: true, bestTimeSec: 612.7 }, x: 5, 2: { completed: 'sim', bestTimeSec: -4 }, 999: {} });
    expect(out).toEqual({ 1: { completed: true, bestTimeSec: 612 }, 2: { completed: false, bestTimeSec: 0 } });
    expect(sanitizeChapterRecords(null)).toEqual({});
  });
});

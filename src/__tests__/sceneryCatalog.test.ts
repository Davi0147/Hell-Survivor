import { describe, it, expect } from 'vitest';
import { CH1_DECOR, CH1_LEGACY_SWAP, CH1_LANDMARKS, CH1_DECOR_FILES } from '../config/sceneryCatalog';

const keys = new Set(CH1_DECOR.map((p) => p.key));

describe('Kit de cenário do Capítulo 1', () => {
  it('toda peça antiga é trocada por peças que existem no catálogo', () => {
    for (const options of Object.values(CH1_LEGACY_SWAP)) {
      expect(options.length).toBeGreaterThan(0);
      for (const k of options) expect(keys.has(k)).toBe(true);
    }
  });

  it('todos os conjuntos usam peças do catálogo', () => {
    for (const recipe of CH1_LANDMARKS) {
      for (const k of [...recipe.center, ...recipe.around, ...recipe.floor]) expect(keys.has(k)).toBe(true);
    }
  });

  it('cada peça tem arquivo e as chaves não se repetem', () => {
    expect(keys.size).toBe(CH1_DECOR.length);
    for (const p of CH1_DECOR) expect(CH1_DECOR_FILES[p.key]).toMatch(/\.png$/);
  });
});

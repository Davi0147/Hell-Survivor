import { describe, it, expect } from 'vitest';
import { CH1_DECOR, CH1_DECOR_FILES, CHAPTER_DECOR_KITS, DECOR_FILES } from '../config/sceneryCatalog';

const SCENERY_ART = Object.keys(import.meta.glob('/public/assets/sprites/scenery/**/*.png'));
const artExists = (file: string): boolean => SCENERY_ART.includes(`/public/${file}`);

describe('Kits de cenário dos capítulos', () => {
  for (const [chapter, kit] of Object.entries(CHAPTER_DECOR_KITS)) {
    const keys = new Set(kit.pieces.map((p) => p.key));

    describe(`Capítulo ${chapter}`, () => {
      it('toda peça antiga é trocada por peças que existem no kit', () => {
        for (const options of Object.values(kit.legacySwap)) {
          expect(options.length).toBeGreaterThan(0);
          for (const k of options) expect(keys.has(k), k).toBe(true);
        }
      });

      it('todos os conjuntos usam peças do kit', () => {
        for (const recipe of kit.landmarks) {
          for (const k of [...recipe.center, ...recipe.around, ...recipe.floor]) expect(keys.has(k), k).toBe(true);
        }
      });

      it('as chaves não se repetem e o kit tem manchas e entulho para espalhar', () => {
        expect(keys.size).toBe(kit.pieces.length);
        expect(kit.pieces.some((p) => p.layer === 'decal')).toBe(true);
        expect(kit.pieces.some((p) => p.layer === 'clutter')).toBe(true);
      });

      it('cada peça (e o altar) tem o arquivo de arte no projeto', () => {
        const all = [...kit.pieces.map((p) => p.key), ...(kit.altar ? [kit.altar.off, kit.altar.on] : [])];
        for (const k of all) {
          expect(DECOR_FILES[k], k).toMatch(/\.png$/);
          expect(artExists(DECOR_FILES[k]), DECOR_FILES[k]).toBe(true);
        }
      });
    });
  }

  it('nenhuma chave aparece em dois capítulos', () => {
    const all = Object.values(CHAPTER_DECOR_KITS).flatMap((k) => k.pieces.map((p) => p.key));
    expect(new Set(all).size).toBe(all.length);
  });

  it('o Capítulo 1 continua com o mesmo kit e os mesmos arquivos', () => {
    expect(CHAPTER_DECOR_KITS[1].pieces).toBe(CH1_DECOR);
    for (const p of CH1_DECOR) expect(DECOR_FILES[p.key]).toBe(CH1_DECOR_FILES[p.key]);
  });
});

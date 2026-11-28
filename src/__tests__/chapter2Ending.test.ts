import { describe, expect, it } from 'vitest';
import { CHAPTER2_ENDING } from '../config/dialogues';

describe('Cena de derrota do Azazel (fim do Capítulo 2)', () => {
  it('as falas usam as imagens 1 a 6 em ordem (a 7 é o final sem fala)', () => {
    const images = CHAPTER2_ENDING.map((l) => l.image);
    expect(images[0]).toBe(1);
    expect(Math.max(...images)).toBe(6);
    images.forEach((n, i) => {
      if (i > 0) expect(n).toBeGreaterThanOrEqual(images[i - 1]);
    });
  });

  it('toda troca de imagem diz como entra', () => {
    CHAPTER2_ENDING.forEach((line, i) => {
      if (i > 0 && line.image !== CHAPTER2_ENDING[i - 1].image) expect(line.enter).toBeDefined();
    });
  });

  it('a última fala é cortada e segue sozinha para a tela preta', () => {
    const last = CHAPTER2_ENDING[CHAPTER2_ENDING.length - 1];
    expect(last.text.endsWith('---')).toBe(true);
    expect(last.autoAdvanceMs).toBeDefined();
  });
});

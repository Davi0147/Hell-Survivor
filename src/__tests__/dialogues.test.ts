import { describe, it, expect } from 'vitest';
import {
  CHAPTER_OPENING_DIALOGUE,
  ROSALIN_INTRO_DIALOGUE,
  AZAZEL_INTRO_DIALOGUE,
  getStoryRevivalDialogue,
  getBossRematchDialogue,
} from '../config/dialogues';
import type { DialogueLine } from '../systems/DialogueSystem';

function expectValidLines(lines: DialogueLine[], label: string): void {
  expect(lines.length, label).toBeGreaterThan(0);
  for (const line of lines) {
    expect(line.text.trim().length, `${label}: fala vazia`).toBeGreaterThan(0);
    expect(line.speaker, `${label}: sem falante`).toBeTruthy();
    expect(line.portraitKey, `${label}: sem retrato`).toBeTruthy();
  }
}

describe('Roteiro (src/config/dialogues.ts)', () => {
  it('os capítulos 1 e 2 têm fala de abertura', () => {
    expectValidLines(CHAPTER_OPENING_DIALOGUE[1], 'abertura cap 1');
    expectValidLines(CHAPTER_OPENING_DIALOGUE[2], 'abertura cap 2');
  });

  it('os dois chefes têm diálogo de primeiro encontro', () => {
    expectValidLines(ROSALIN_INTRO_DIALOGUE, 'intro Rosalin');
    expectValidLines(AZAZEL_INTRO_DIALOGUE, 'intro Azazel');
  });

  it('a fala de ressurreição existe para qualquer número de mortes', () => {
    for (const deaths of [0, 1, 2, 5, 9, 10, 11, 25, 100]) {
      expectValidLines(getStoryRevivalDialogue(deaths), `ressurreição ${deaths}`);
    }
  });

  it('a revanche existe para os dois chefes em qualquer número de derrotas', () => {
    for (const boss of ['rosalin', 'azazel']) {
      for (const deaths of [1, 2, 3, 10]) {
        expectValidLines(getBossRematchDialogue(boss, deaths), `revanche ${boss} ${deaths}`);
      }
    }
  });

  it('chefe desconhecido não quebra: devolve lista vazia', () => {
    expect(getBossRematchDialogue('ninguem', 1)).toEqual([]);
  });
});

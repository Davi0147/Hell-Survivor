/**
 * Os 10 capítulos do Modo História, como a tela de escolha mostra.
 * Texto e status de cada capítulo moram aqui: lançar um capítulo novo = marcar `released`,
 * preencher título, chefe e resumo, e (quando a arte existir) o nome do arquivo em `art`.
 */
export interface ChapterInfo {
  /** 1 a 10. */
  number: number;
  /** Algarismo romano mostrado no topo do painel. */
  numeral: string;
  title: string;
  boss: string;
  /** Mini resumo (aparece quando o painel abre). Curto: 2 a 3 linhas. */
  summary: string;
  /** Já existe no jogo? Os não lançados aparecem bloqueados ("EM BREVE"). */
  released: boolean;
  /**
   * Arte de fundo (chefe) em public/assets/sprites/chapters/. Vazio = arte provisória
   * (`fallbackSprite` do chefe sobre fundo escuro). Arte nova: art-source/novos/capitulos/.
   */
  art?: string;
  /** Sprite do chefe usado enquanto a arte de fundo não existe. */
  fallbackSprite?: string;
}

export const CHAPTER_COUNT = 10;

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const RELEASED: ChapterInfo[] = [
  {
    number: 1,
    numeral: 'I',
    title: 'O DESPERTAR NO ABISMO',
    boss: 'ROSALIN, A SÚCUBO INFERNAL',
    summary: 'Nixy larga o emprego no Inferno e acorda nas catacumbas do abismo. A saída passa pela Imperatriz Rosalin, a súcubo que manda nesses corredores.',
    released: true,
    art: 'chapter-01.jpg',
    fallbackSprite: 'succubus-idle-south',
  },
  {
    number: 2,
    numeral: 'II',
    title: 'O DOMÍNIO DE AZAZEL',
    boss: 'AZAZEL, O FALSO DEUS',
    summary: 'O segundo círculo cheira a enxofre e arrogância. Azazel apaga a luz, prende almas em cristais e não deixa ninguém sair do seu domínio.',
    released: true,
    art: 'chapter-02.jpg',
    fallbackSprite: 'azazel-idle-south',
  },
  {
    // Lançado em 2026-11-28; abre depois de vencer o Capítulo 2. Título e resumo ainda provisórios.
    number: 3,
    numeral: 'III',
    title: 'O CORO QUE SANGRA',
    boss: 'SHYLPH, A SERAFIM CAÍDA',
    summary: 'Um templo onde os anjos rezam de olhos vendados. Shylph sorri, lambe o sangue dos dedos e espera você acreditar que venceu.',
    released: true,
    art: 'chapter-03.jpg',
    fallbackSprite: 'shylph-sheet',
  },
];

/** Todos os 10, com os ainda não lançados preenchidos como "???". */
export const CHAPTERS: readonly ChapterInfo[] = NUMERALS.map((numeral, i) => {
  const known = RELEASED.find((c) => c.number === i + 1);
  return known ?? { number: i + 1, numeral, title: '???', boss: '???', summary: '', released: false };
});

export function getChapterInfo(n: number): ChapterInfo | undefined {
  return CHAPTERS.find((c) => c.number === n);
}

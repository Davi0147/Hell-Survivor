/**
 * Corredor do prólogo (fuga do RH, Capítulo I). Arte em public/assets/sprites/prologue/,
 * preparada por scripts/cut-prologue-corridor.py (prompt em docs/ART_PROMPTS.md §26).
 *
 * Cada imagem é uma SALA: ocupa a tela, e chegar na ponta esquerda ou direita escurece e passa
 * para a sala vizinha. Assim as imagens não precisam se encaixar umas nas outras.
 *
 * Medidas em px da imagem ORIGINAL (2000 x 1116, art-source/novos/prologo/). Cada sala guarda a
 * faixa onde os PÉS da Nixy podem pisar (o resto é parede) e os móveis que bloqueiam.
 * Mexeu na arte? Meça de novo (Modo de Teste: tecla C no corredor mostra as colisões).
 */

export interface PrologueRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CorridorRoom {
  /** Chave da textura e nome do arquivo (`corridor-<id>.jpg`). */
  id: string;
  /** Linha mais alta (perto da parede do fundo) onde os pés pisam. */
  walkTop: number;
  /** Linha mais baixa (perto da parede da frente) onde os pés pisam. */
  walkBottom: number;
  /** Móveis no chão que a Nixy contorna. */
  blockers: PrologueRect[];
}

/** Tamanho da arte original de cada sala. */
export const ROOM_IMAGE = { width: 2000, height: 1116 } as const;
/** Tamanho em que a arte é exportada para o jogo (fração da original). */
export const ROOM_EXPORT_SCALE = 0.8;
/** Parte da imagem que tem desenho (fora disso é a faixa preta): a câmera mostra no máximo isto. */
export const ROOM_CONTENT = { top: 70, bottom: 1040 } as const;

export const CORRIDOR_ROOMS: readonly CorridorRoom[] = [
  {
    id: 'inicio',
    walkTop: 684,
    walkBottom: 984,
    blockers: [
      { x: 400, y: 600, w: 410, h: 144 }, // cadeira caída e gaveta chutada
      { x: 1650, y: 600, w: 110, h: 104 }, // vaso da planta morta
    ],
  },
  {
    id: 'meio-a',
    walkTop: 692,
    walkBottom: 932,
    blockers: [
      { x: 1230, y: 600, w: 116, h: 108 }, // bebedouro de lava
      { x: 1380, y: 864, w: 184, h: 180 }, // planta carnívora encostada na parede da frente
    ],
  },
  { id: 'meio-b', walkTop: 704, walkBottom: 936, blockers: [] },
  {
    id: 'meio-c',
    walkTop: 700,
    walkBottom: 940,
    blockers: [{ x: 250, y: 848, w: 152, h: 192 }], // cacto de caveiras
  },
  { id: 'fim', walkTop: 684, walkBottom: 952, blockers: [] },
];

/** Onde a Nixy aparece (na frente da porta do setor dela, na primeira sala). */
export const PROLOGUE_START = { x: 1010, y: 800 };

/** Pisou aqui (na frente da porta de saída da última sala), ela atravessa. */
export const PROLOGUE_EXIT_ZONE: PrologueRect = { x: 1504, y: 660, w: 324, h: 112 };

/**
 * Largura da faixa nas pontas de cada sala que leva à vizinha (px originais). Ao chegar, ela
 * aparece um pouco para dentro da faixa, para não voltar sem querer.
 */
export const ROOM_EDGE = { trigger: 110, entry: 210 } as const;

export interface PrologueNpcDef {
  id: string;
  /** Sala e posição dos pés dentro dela. */
  room: string;
  x: number;
  y: number;
  /**
   * Arte própria: `public/assets/sprites/prologue/npc-<id>.png` (scripts/cut-prologue-npcs.py).
   * Sem arte (`hasArt: false`), usa `placeholderTexture`, um sprite parado do jogo.
   */
  hasArt: boolean;
  placeholderTexture: string;
  /** Altura na arte original (px, dos chifres aos pés). A arte é ajustada para isto. */
  displayHeight: number;
  /**
   * Onde sai a fala de cada pessoa da imagem, como fração da largura a partir do centro
   * (`who: 'npc'` usa o primeiro, `'npc2'` o segundo). Imagem com duas pessoas = um NPC só.
   */
  speakers?: readonly number[];
}

/** Os pés ficam logo abaixo da parede do fundo (encostados nela, deixando o corredor livre). */
export const PROLOGUE_NPCS: readonly PrologueNpcDef[] = [
  { id: 'arquivista', room: 'meio-a', x: 940, y: 706, hasArt: false, placeholderTexture: 'mummy-idle-south', displayHeight: 200 },
  { id: 'estagiario', room: 'meio-b', x: 640, y: 718, hasArt: true, placeholderTexture: 'transporter-idle-south', displayHeight: 215 },
  { id: 'fofoqueiras', room: 'meio-c', x: 1020, y: 714, hasArt: true, placeholderTexture: 'archer-idle-south', displayHeight: 235, speakers: [-0.23, 0.2] },
  { id: 'seguranca', room: 'fim', x: 660, y: 698, hasArt: true, placeholderTexture: 'ghoul-idle-south', displayHeight: 215 },
];

export function npcTextureKey(id: string): string {
  return `npc-${id}`;
}

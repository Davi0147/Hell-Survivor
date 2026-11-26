/**
 * Corredor do prólogo (fuga do RH, Capítulo I). Arte em public/assets/sprites/prologue/,
 * preparada por scripts/cut-prologue-corridor.py (prompt em docs/ART_PROMPTS.md §26).
 *
 * Medidas em px da imagem já reduzida (1000 x 558), que é desenhada 1:1 na tela. Cada pedaço
 * guarda a faixa onde os PÉS da Nixy podem pisar (o resto é parede) e os móveis que bloqueiam.
 * Mexeu na arte? Meça de novo com o Modo de Teste (F1 > ver colisões) e ajuste só aqui.
 */

export interface PrologueRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CorridorSegment {
  /** Chave da textura e nome do arquivo (`corridor-<id>.jpg`). */
  id: string;
  width: number;
  /** Linha mais alta (perto da parede do fundo) onde os pés pisam. */
  walkTop: number;
  /** Linha mais baixa (perto da parede da frente) onde os pés pisam. */
  walkBottom: number;
  /** Móveis no chão que a Nixy contorna (coordenadas do pedaço). */
  blockers: PrologueRect[];
}

export const CORRIDOR_IMAGE_HEIGHT = 558;

export const CORRIDOR_SEGMENTS: readonly CorridorSegment[] = [
  {
    id: 'inicio',
    width: 1000,
    walkTop: 342,
    walkBottom: 492,
    blockers: [
      { x: 200, y: 300, w: 205, h: 72 }, // cadeira caída e gaveta chutada
      { x: 825, y: 300, w: 55, h: 52 }, // vaso da planta morta
    ],
  },
  {
    id: 'meio-a',
    width: 1000,
    walkTop: 346,
    walkBottom: 466,
    blockers: [
      { x: 615, y: 300, w: 58, h: 54 }, // bebedouro de lava
      { x: 690, y: 432, w: 92, h: 90 }, // planta carnívora encostada na parede da frente
    ],
  },
  { id: 'meio-b', width: 1000, walkTop: 352, walkBottom: 468, blockers: [] },
  {
    id: 'meio-c',
    width: 1000,
    walkTop: 350,
    walkBottom: 470,
    blockers: [{ x: 125, y: 424, w: 76, h: 96 }], // cacto de caveiras
  },
  { id: 'fim', width: 1000, walkTop: 342, walkBottom: 476, blockers: [] },
];

/** Onde a Nixy aparece (porta do setor dela, no pedaço de início). */
export const PROLOGUE_START = { x: 505, y: 400 };

/**
 * Faixas de chão na frente da porta de saída (pedaço `fim`): pisou ali, ela atravessa.
 * Coordenadas do pedaço.
 */
export const PROLOGUE_EXIT_ZONE: PrologueRect = { x: 752, y: 330, w: 162, h: 56 };

export interface PrologueNpcDef {
  id: string;
  /** Pedaço do corredor e posição dos pés dentro dele. */
  segment: string;
  x: number;
  y: number;
  /**
   * Arte. Enquanto não existe arte própria (`npc-<id>`), usa um sprite parado do jogo como
   * provisório.
   */
  texture: string;
  placeholderTexture: string;
  /** Altura na tela (px). A arte nova é encolhida/ampliada para isto. */
  displayHeight: number;
  /** Arte virada para a esquerda? (o jogo espelha para olhar para a Nixy). */
  facesLeft?: boolean;
}

export const PROLOGUE_NPCS: readonly PrologueNpcDef[] = [
  { id: 'arquivista', segment: 'meio-a', x: 470, y: 362, texture: 'npc-arquivista', placeholderTexture: 'mummy-idle-south', displayHeight: 100 },
  { id: 'estagiario', segment: 'meio-b', x: 330, y: 366, texture: 'npc-estagiario', placeholderTexture: 'transporter-idle-south', displayHeight: 92 },
  { id: 'contadora', segment: 'meio-c', x: 560, y: 368, texture: 'npc-contadora', placeholderTexture: 'archer-idle-south', displayHeight: 96 },
  { id: 'seguranca', segment: 'fim', x: 330, y: 366, texture: 'npc-seguranca', placeholderTexture: 'ghoul-idle-south', displayHeight: 104 },
];

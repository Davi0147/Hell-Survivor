/**
 * Kit de cenário por capítulo (arte de `docs/ART_PROMPTS.md` §12 e §28, recortada em
 * `public/assets/sprites/scenery/chN/`). As texturas estão em densidade 2x e são
 * desenhadas com escala 0.5: com a câmera em zoom 2, cada pixel da arte vira um pixel
 * de tela, nítido e na mesma proporção para todas as peças.
 */

/** Camada de cada peça: muda a profundidade e quem aparece por cima de quem. */
export type DecorLayer =
  | 'tall' // alto: a heroína passa atrás quando está acima da base
  | 'low' // baixo: fica sempre no chão, abaixo de todos
  | 'decal' // pintado no chão (manchas, rachaduras)
  | 'clutter'; // entulho miúdo no chão

export interface DecorPiece {
  key: string;
  layer: DecorLayer;
  /** Fonte de luz: altura (px de mundo, a partir da base), tamanho do halo e cor (padrão: fogo). */
  light?: { offsetY: number; scale: number; tint?: 'violet' };
  /** Transparência fixa (decalques chamativos ficam mais discretos). */
  alpha?: number;
  /**
   * Pegada sólida na base (px de mundo): só a base bloqueia, como numa vista de cima.
   * dx desloca a caixa para o lado (ex.: as duas pernas do arco).
   */
  block?: { w: number; h: number; dx?: number }[];
}

export const DECOR_TEXTURE_SCALE = 0.5;

const CH1 = 'assets/sprites/scenery/ch1';

export const CH1_DECOR: DecorPiece[] = [
  { key: 'ch1-pillar', layer: 'tall', block: [{ w: 30, h: 14, dx: -10 }, { w: 22, h: 12, dx: 18 }] },
  { key: 'ch1-arch', layer: 'tall', block: [{ w: 16, h: 12, dx: -28 }, { w: 18, h: 12, dx: 26 }] },
  { key: 'ch1-statue', layer: 'tall', block: [{ w: 40, h: 16 }] },
  { key: 'ch1-sarcophagus', layer: 'tall', block: [{ w: 76, h: 24 }] },
  { key: 'ch1-boulder-large', layer: 'tall', block: [{ w: 66, h: 22 }] },
  { key: 'ch1-boulder-medium', layer: 'low', block: [{ w: 50, h: 18 }] },
  { key: 'ch1-rocks-small', layer: 'low' },
  { key: 'ch1-rubble', layer: 'low' },
  { key: 'ch1-torch', layer: 'tall', light: { offsetY: 76, scale: 0.55 } },
  { key: 'ch1-candelabra', layer: 'tall', light: { offsetY: 74, scale: 0.5 } },
  { key: 'ch1-candles', layer: 'low', light: { offsetY: 22, scale: 0.4 } },
  { key: 'ch1-brazier', layer: 'low', light: { offsetY: 34, scale: 0.5 }, block: [{ w: 36, h: 12 }] },
  { key: 'ch1-skull-altar', layer: 'tall', light: { offsetY: 60, scale: 0.3 }, block: [{ w: 52, h: 18 }] },
  { key: 'ch1-bone-pile', layer: 'low' },
  { key: 'ch1-cage', layer: 'tall', block: [{ w: 48, h: 16 }] },
  { key: 'ch1-thorn-bush', layer: 'low' },
  // Arte mais clara que o piso: fica bem transparente para não parecer um remendo
  { key: 'ch1-decal-cracks', layer: 'decal', alpha: 0.38 },
  { key: 'ch1-decal-blood', layer: 'decal', alpha: 0.85 },
  { key: 'ch1-decal-ritual', layer: 'decal', alpha: 0.7 },
  { key: 'ch1-decal-lava', layer: 'decal', light: { offsetY: 0, scale: 0.35 } },
  { key: 'ch1-decal-petals', layer: 'decal' },
  { key: 'ch1-decal-wax', layer: 'decal' },
  { key: 'ch1-decal-scorch', layer: 'decal', alpha: 0.85 },
  { key: 'ch1-decal-moss', layer: 'decal', alpha: 0.85 },
  { key: 'ch1-clutter-skull', layer: 'clutter' },
  { key: 'ch1-clutter-bones', layer: 'clutter' },
  { key: 'ch1-clutter-chain', layer: 'clutter' },
  { key: 'ch1-clutter-sword', layer: 'clutter' },
  { key: 'ch1-clutter-urn', layer: 'clutter' },
  { key: 'ch1-clutter-web', layer: 'clutter' },
  { key: 'ch1-clutter-thorns', layer: 'clutter' },
  { key: 'ch1-clutter-runestone', layer: 'clutter' },
];

export const CH1_DECOR_FILES: Record<string, string> = Object.fromEntries(
  CH1_DECOR.map((p) => [p.key, `${CH1}/${p.key}.png`])
);

/**
 * Peças antigas dos mapas salvos trocadas pelas novas no Capítulo 1 (a posição continua
 * a mesma; cada ponto sorteia, de forma estável, uma das opções).
 */
export const CH1_LEGACY_SWAP: Record<string, string[]> = {
  'scenery-tocha': ['ch1-torch', 'ch1-candelabra', 'ch1-brazier'],
  'scenery-rocha': ['ch1-boulder-medium', 'ch1-rocks-small', 'ch1-rubble'],
  'scenery-rocha-2': ['ch1-boulder-large'],
  'scenery-ossos': ['ch1-bone-pile', 'ch1-clutter-bones', 'ch1-clutter-skull', 'ch1-bone-pile'],
  'scenery-cogumelos': ['ch1-thorn-bush', 'ch1-candles'],
  'scenery-cristal': ['ch1-clutter-runestone', 'ch1-clutter-urn', 'ch1-candles', 'ch1-clutter-thorns'],
};

/** Composições espalhadas pela arena: uma peça grande e o que costuma estar em volta dela. */
export const CH1_LANDMARKS: { center: string[]; around: string[]; floor: string[] }[] = [
  { center: ['ch1-pillar'], around: ['ch1-thorn-bush', 'ch1-clutter-thorns', 'ch1-rubble'], floor: ['ch1-decal-petals'] },
  { center: ['ch1-arch'], around: ['ch1-rubble', 'ch1-rocks-small', 'ch1-clutter-web'], floor: ['ch1-decal-cracks'] },
  { center: ['ch1-statue'], around: ['ch1-candles', 'ch1-thorn-bush'], floor: ['ch1-decal-ritual', 'ch1-decal-petals'] },
  { center: ['ch1-sarcophagus'], around: ['ch1-candelabra', 'ch1-clutter-skull', 'ch1-clutter-urn'], floor: ['ch1-decal-blood'] },
  { center: ['ch1-skull-altar'], around: ['ch1-candles', 'ch1-bone-pile', 'ch1-clutter-runestone'], floor: ['ch1-decal-ritual', 'ch1-decal-wax'] },
  { center: ['ch1-cage'], around: ['ch1-clutter-chain', 'ch1-clutter-bones', 'ch1-torch'], floor: ['ch1-decal-blood'] },
  { center: ['ch1-boulder-large'], around: ['ch1-boulder-medium', 'ch1-rocks-small'], floor: ['ch1-decal-moss', 'ch1-decal-cracks'] },
  { center: ['ch1-brazier'], around: ['ch1-clutter-sword', 'ch1-clutter-skull'], floor: ['ch1-decal-scorch', 'ch1-decal-lava'] },
];

/** Quantidades espalhadas pela arena inteira (fora das composições). */
export const DECOR_SCATTER = {
  landmarks: 34,
  decals: 240,
  clutter: 170,
  /** Ninguém nasce colado no ponto de partida da heroína nem no altar do chefe. */
  keepClearRadius: 260,
} as const;

// ============================================================================
// Kits dos Capítulos 2 e 3 (docs/ART_PROMPTS.md §28, recortados por
// scripts/cut-chapter-kits.py em public/assets/sprites/scenery/chN/). Mesma densidade 2x
// e mesma escala 0.5 do Capítulo 1. Pegadas e alturas de luz em px de mundo.
// ============================================================================

const CH2: DecorPiece[] = [
  { key: 'ch2-column', layer: 'tall', block: [{ w: 44, h: 14 }] },
  { key: 'ch2-statue', layer: 'tall', block: [{ w: 44, h: 14 }] },
  { key: 'ch2-wing', layer: 'tall', block: [{ w: 76, h: 18 }] },
  { key: 'ch2-crystal', layer: 'tall', light: { offsetY: 46, scale: 0.4, tint: 'violet' }, block: [{ w: 60, h: 18 }] },
  { key: 'ch2-block-large', layer: 'tall', block: [{ w: 66, h: 22 }] },
  { key: 'ch2-blocks-medium', layer: 'low', block: [{ w: 50, h: 16 }] },
  { key: 'ch2-chunks-small', layer: 'low' },
  { key: 'ch2-rubble-halo', layer: 'low' },
  { key: 'ch2-brazier', layer: 'tall', light: { offsetY: 72, scale: 0.5, tint: 'violet' }, block: [{ w: 32, h: 12 }] },
  { key: 'ch2-candelabra', layer: 'tall', light: { offsetY: 64, scale: 0.45, tint: 'violet' } },
  { key: 'ch2-candles', layer: 'low', light: { offsetY: 24, scale: 0.38, tint: 'violet' } },
  { key: 'ch2-lantern', layer: 'tall', light: { offsetY: 44, scale: 0.42, tint: 'violet' } },
  { key: 'ch2-halo', layer: 'low' },
  { key: 'ch2-feathers', layer: 'low' },
  { key: 'ch2-glass', layer: 'low' },
  { key: 'ch2-pew', layer: 'tall', block: [{ w: 66, h: 16 }] },
  { key: 'ch2-decal-cracks', layer: 'decal', alpha: 0.4 },
  { key: 'ch2-decal-scorch', layer: 'decal', alpha: 0.8 },
  { key: 'ch2-decal-sigil', layer: 'decal', alpha: 0.55 },
  { key: 'ch2-decal-void', layer: 'decal', alpha: 0.9, light: { offsetY: 0, scale: 0.35, tint: 'violet' } },
  { key: 'ch2-decal-feathers', layer: 'decal', alpha: 0.9 },
  { key: 'ch2-decal-puddle', layer: 'decal', alpha: 0.85 },
  { key: 'ch2-decal-glass', layer: 'decal', alpha: 0.85 },
  { key: 'ch2-decal-ash', layer: 'decal', alpha: 0.8 },
  { key: 'ch2-clutter-head', layer: 'clutter' },
  { key: 'ch2-clutter-chain', layer: 'clutter' },
  { key: 'ch2-clutter-sword', layer: 'clutter' },
  { key: 'ch2-clutter-book', layer: 'clutter' },
  { key: 'ch2-clutter-candle', layer: 'clutter' },
  { key: 'ch2-clutter-skull', layer: 'clutter' },
  { key: 'ch2-clutter-crystal', layer: 'clutter' },
  { key: 'ch2-clutter-web', layer: 'clutter' },
];

const CH3: DecorPiece[] = [
  { key: 'ch3-fire-post', layer: 'tall', light: { offsetY: 52, scale: 0.5 } },
  { key: 'ch3-statue', layer: 'tall', block: [{ w: 48, h: 16 }] },
  { key: 'ch3-lava-pillar', layer: 'tall', light: { offsetY: 62, scale: 0.45 }, block: [{ w: 56, h: 18 }] },
  { key: 'ch3-font', layer: 'tall', block: [{ w: 40, h: 14 }] },
  { key: 'ch3-block-large', layer: 'tall', block: [{ w: 66, h: 20 }] },
  { key: 'ch3-blocks-medium', layer: 'low', block: [{ w: 50, h: 16 }] },
  { key: 'ch3-chunks-small', layer: 'low' },
  { key: 'ch3-stairs', layer: 'tall', block: [{ w: 64, h: 20 }] },
  { key: 'ch3-fire-bowl', layer: 'low', light: { offsetY: 40, scale: 0.5 }, block: [{ w: 34, h: 12 }] },
  { key: 'ch3-candle-stand', layer: 'tall', light: { offsetY: 70, scale: 0.45 } },
  { key: 'ch3-candles', layer: 'low', light: { offsetY: 16, scale: 0.35 } },
  { key: 'ch3-halo-statue', layer: 'tall', block: [{ w: 30, h: 12 }] },
  { key: 'ch3-bandages', layer: 'low' },
  { key: 'ch3-cage', layer: 'tall', block: [{ w: 52, h: 16 }] },
  { key: 'ch3-lectern', layer: 'tall', block: [{ w: 36, h: 12 }] },
  { key: 'ch3-tablet', layer: 'tall', block: [{ w: 50, h: 14 }] },
  // Pedra bem mais clara que o piso de losangos: quase transparente para não virar remendo
  { key: 'ch3-decal-cracks', layer: 'decal', alpha: 0.22 },
  { key: 'ch3-decal-blood', layer: 'decal', alpha: 0.85 },
  { key: 'ch3-decal-sigil', layer: 'decal', alpha: 0.5 },
  { key: 'ch3-decal-lava', layer: 'decal', light: { offsetY: 0, scale: 0.4 } },
  { key: 'ch3-decal-feathers', layer: 'decal', alpha: 0.9 },
  { key: 'ch3-decal-wax', layer: 'decal', alpha: 0.9 },
  { key: 'ch3-decal-footprints', layer: 'decal', alpha: 0.85 },
  { key: 'ch3-decal-scorch', layer: 'decal', alpha: 0.8 },
  { key: 'ch3-clutter-blindfold', layer: 'clutter' },
  { key: 'ch3-clutter-halo', layer: 'clutter' },
  { key: 'ch3-clutter-chain', layer: 'clutter' },
  { key: 'ch3-clutter-hand', layer: 'clutter' },
  { key: 'ch3-clutter-skull', layer: 'clutter' },
  { key: 'ch3-clutter-bowl', layer: 'clutter' },
  { key: 'ch3-clutter-eye', layer: 'clutter' },
  { key: 'ch3-clutter-embers', layer: 'clutter', light: { offsetY: 6, scale: 0.22 } },
];

/** Tudo o que um capítulo precisa para montar o cenário. */
export interface ChapterDecorKit {
  pieces: DecorPiece[];
  legacySwap: Record<string, string[]>;
  landmarks: { center: string[]; around: string[]; floor: string[] }[];
  /** Semente fixa do espalhamento: o mapa fica igual toda partida. */
  seed: string;
  /** Altar de Invocação do chefe (apagado / aceso). Sem isso, usa o altar antigo. */
  altar?: { off: string; on: string };
}

export const CHAPTER_DECOR_KITS: Record<number, ChapterDecorKit> = {
  1: { pieces: CH1_DECOR, legacySwap: CH1_LEGACY_SWAP, landmarks: CH1_LANDMARKS, seed: 'ch1-catacombs' },
  2: {
    pieces: CH2,
    seed: 'ch2-false-god',
    altar: { off: 'ch2-altar-off', on: 'ch2-altar-on' },
    legacySwap: {
      'scenery-tocha': ['ch2-brazier', 'ch2-candelabra', 'ch2-lantern'],
      'scenery-rocha': ['ch2-blocks-medium', 'ch2-chunks-small', 'ch2-rubble-halo'],
      'scenery-rocha-2': ['ch2-block-large', 'ch2-column'],
      'scenery-ossos': ['ch2-feathers', 'ch2-clutter-skull', 'ch2-clutter-head'],
      'scenery-cogumelos': ['ch2-candles', 'ch2-halo', 'ch2-feathers'],
      'scenery-cristal': ['ch2-crystal', 'ch2-clutter-crystal', 'ch2-glass'],
    },
    landmarks: [
      { center: ['ch2-column'], around: ['ch2-rubble-halo', 'ch2-chunks-small', 'ch2-clutter-web'], floor: ['ch2-decal-cracks'] },
      { center: ['ch2-statue'], around: ['ch2-candles', 'ch2-feathers', 'ch2-clutter-candle'], floor: ['ch2-decal-sigil'] },
      { center: ['ch2-wing'], around: ['ch2-chunks-small', 'ch2-blocks-medium', 'ch2-clutter-head'], floor: ['ch2-decal-feathers'] },
      { center: ['ch2-crystal'], around: ['ch2-clutter-crystal', 'ch2-chunks-small'], floor: ['ch2-decal-void'] },
      { center: ['ch2-brazier'], around: ['ch2-clutter-skull', 'ch2-clutter-candle', 'ch2-feathers'], floor: ['ch2-decal-scorch', 'ch2-decal-ash'] },
      { center: ['ch2-pew'], around: ['ch2-glass', 'ch2-clutter-book', 'ch2-candelabra'], floor: ['ch2-decal-glass'] },
      { center: ['ch2-block-large'], around: ['ch2-blocks-medium', 'ch2-chunks-small', 'ch2-halo'], floor: ['ch2-decal-cracks'] },
      { center: ['ch2-lantern'], around: ['ch2-clutter-chain', 'ch2-clutter-sword'], floor: ['ch2-decal-puddle'] },
    ],
  },
  3: {
    pieces: CH3,
    seed: 'ch3-blood-temple',
    altar: { off: 'ch3-altar-off', on: 'ch3-altar-on' },
    legacySwap: {
      'scenery-tocha': ['ch3-fire-post', 'ch3-candle-stand', 'ch3-fire-bowl'],
      'scenery-rocha': ['ch3-blocks-medium', 'ch3-chunks-small'],
      'scenery-rocha-2': ['ch3-block-large', 'ch3-lava-pillar'],
      'scenery-ossos': ['ch3-bandages', 'ch3-clutter-skull', 'ch3-clutter-hand'],
      'scenery-cogumelos': ['ch3-candles', 'ch3-clutter-bowl', 'ch3-clutter-blindfold'],
      'scenery-cristal': ['ch3-halo-statue', 'ch3-clutter-eye', 'ch3-clutter-embers'],
    },
    landmarks: [
      { center: ['ch3-statue'], around: ['ch3-candles', 'ch3-bandages'], floor: ['ch3-decal-sigil', 'ch3-decal-feathers'] },
      { center: ['ch3-lava-pillar'], around: ['ch3-chunks-small', 'ch3-clutter-embers'], floor: ['ch3-decal-lava', 'ch3-decal-scorch'] },
      { center: ['ch3-font'], around: ['ch3-candle-stand', 'ch3-clutter-bowl'], floor: ['ch3-decal-blood'] },
      { center: ['ch3-fire-post'], around: ['ch3-clutter-chain', 'ch3-clutter-skull'], floor: ['ch3-decal-scorch'] },
      { center: ['ch3-stairs'], around: ['ch3-blocks-medium', 'ch3-chunks-small'], floor: ['ch3-decal-cracks', 'ch3-decal-footprints'] },
      { center: ['ch3-cage'], around: ['ch3-clutter-blindfold', 'ch3-bandages', 'ch3-clutter-chain'], floor: ['ch3-decal-blood'] },
      { center: ['ch3-lectern'], around: ['ch3-candles', 'ch3-clutter-eye'], floor: ['ch3-decal-wax'] },
      { center: ['ch3-tablet'], around: ['ch3-clutter-halo', 'ch3-clutter-hand', 'ch3-fire-bowl'], floor: ['ch3-decal-sigil'] },
      { center: ['ch3-halo-statue'], around: ['ch3-candles', 'ch3-clutter-halo'], floor: ['ch3-decal-feathers'] },
      { center: ['ch3-block-large'], around: ['ch3-blocks-medium', 'ch3-chunks-small'], floor: ['ch3-decal-cracks'] },
    ],
  },
};

/** Arquivo de cada textura de cenário de todos os capítulos (peças e altares). */
export const DECOR_FILES: Record<string, string> = Object.fromEntries(
  Object.entries(CHAPTER_DECOR_KITS).flatMap(([n, kit]) => {
    const dir = `assets/sprites/scenery/ch${n}`;
    const altar = kit.altar ? [kit.altar.off, kit.altar.on] : [];
    return [...kit.pieces.map((p) => p.key), ...altar].map((key) => [key, `${dir}/${key}.png`]);
  })
);

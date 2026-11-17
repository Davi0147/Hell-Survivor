/**
 * Kit de cenário por capítulo (arte de `docs/ART_PROMPTS.md` §12, recortada em
 * `public/assets/sprites/scenery/ch1/`). As texturas estão em densidade 2x e são
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
  /** Fonte de luz: altura (px de mundo, a partir da base) e tamanho do halo. */
  light?: { offsetY: number; scale: number };
  /** Transparência fixa (decalques chamativos ficam mais discretos). */
  alpha?: number;
}

export const DECOR_TEXTURE_SCALE = 0.5;

const CH1 = 'assets/sprites/scenery/ch1';

export const CH1_DECOR: DecorPiece[] = [
  { key: 'ch1-pillar', layer: 'tall' },
  { key: 'ch1-arch', layer: 'tall' },
  { key: 'ch1-statue', layer: 'tall' },
  { key: 'ch1-sarcophagus', layer: 'tall' },
  { key: 'ch1-boulder-large', layer: 'tall' },
  { key: 'ch1-boulder-medium', layer: 'low' },
  { key: 'ch1-rocks-small', layer: 'low' },
  { key: 'ch1-rubble', layer: 'low' },
  { key: 'ch1-torch', layer: 'tall', light: { offsetY: 76, scale: 0.55 } },
  { key: 'ch1-candelabra', layer: 'tall', light: { offsetY: 74, scale: 0.5 } },
  { key: 'ch1-candles', layer: 'low', light: { offsetY: 22, scale: 0.4 } },
  { key: 'ch1-brazier', layer: 'low', light: { offsetY: 34, scale: 0.5 } },
  { key: 'ch1-skull-altar', layer: 'tall', light: { offsetY: 60, scale: 0.3 } },
  { key: 'ch1-bone-pile', layer: 'low' },
  { key: 'ch1-cage', layer: 'tall' },
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
  /** Semente fixa: o mapa fica igual toda partida. */
  seed: 'ch1-catacombs',
} as const;

// Gerado por scripts/pack-shylph.py. Nao edite a mao: rode o script de novo.
/** Folha de sprites da Shylph: primeiro quadro e quantidade de cada animacao. */
export const SHYLPH_FRAME_SIZE = 132;

export const SHYLPH_SHEET = {
  'rot-south': { start: 0, count: 1 },
  'rot-south-east': { start: 1, count: 1 },
  'rot-east': { start: 2, count: 1 },
  'rot-north-east': { start: 3, count: 1 },
  'rot-north': { start: 4, count: 1 },
  'rot-north-west': { start: 5, count: 1 },
  'rot-west': { start: 6, count: 1 },
  'rot-south-west': { start: 7, count: 1 },
  'walk-south': { start: 8, count: 8 },
  'walk-east': { start: 16, count: 8 },
  'walk-north': { start: 24, count: 8 },
  'lick-east': { start: 32, count: 8 },
  'throw-south': { start: 40, count: 8 },
  'throw-east': { start: 48, count: 6 },
  'flap-south': { start: 54, count: 8 },
  'flap-east': { start: 62, count: 8 },
  'kneel-south': { start: 70, count: 8 },
} as const;

export type ShylphSheetKey = keyof typeof SHYLPH_SHEET;

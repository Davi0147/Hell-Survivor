export interface CharacterStats {
  maxHp: number;
  baseSpeed: number;
  sprintSpeed: number;
  maxStamina: number;
  staminaDrainRate: number;      // Por segundo enquanto corre
  staminaRegenWalking: number;   // Por segundo enquanto anda
  staminaRegenIdle: number;      // Por segundo enquanto parada
  pickupRadius: number;          // Raio de atração de gemas em pixels
}

export const BALANCE = {
  NIXY: {
    maxHp: 100,
    baseSpeed: 160,
    sprintSpeed: 270,
    maxStamina: 100,
    staminaDrainRate: 35,
    staminaRegenWalking: 20,
    staminaRegenIdle: 40,
    pickupRadius: 85,
  } as CharacterStats,

  SOUL_BOLT: {
    damage: 25,
    cooldownMs: 900,
    speed: 420,
    range: 500,
    pierce: 1,
  },

  XP: {
    baseXpToLevel: 20,
    levelExponent: 1.25,
  }
};

export const DIRECTIONS_8 = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east'
] as const;

export type Direction8 = typeof DIRECTIONS_8[number];

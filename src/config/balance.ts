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

/**
 * FLAG MESTRE DO MODO DE TESTE (SANDBOX & DEBUG):
 * - Em desenvolvimento: deixe `true` para exibir "MODO DE TESTE" diretamente no Menu Principal.
 * - No lançamento oficial: mude para `false` para ocultar do jogador final.
 *   (Mesmo em `false`, você ainda poderá acessá-lo adicionando `?debug=1` na URL ou digitando `DEV` no Menu Principal).
 */
export const ENABLE_DEV_SANDBOX: boolean = true;

export function isDevSandboxEnabled(): boolean {
  if (ENABLE_DEV_SANDBOX) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1' || params.get('sandbox') === '1') return true;
    if (localStorage.getItem('hell_survivor_dev_unlocked') === 'true') return true;
  } catch {}
  return false;
}


import { STORAGE_KEYS } from './storageKeys';

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
 * LIMITES DE PERFORMANCE E OTIMIZAÇÃO DE ENTIDADES:
 * Reduz a sobrecarga de draw calls e física, evitando travamentos em hordas massivas.
 */
export const PERFORMANCE_LIMITS = {
  MAX_ACTIVE_ENEMIES: 120,     // Limite rígido de monstros vivos (reduzido de 300 para manter 60 FPS)
  MAX_ACTIVE_GEMS: 150,        // Limite máximo de gemas no chão (excedentes fundem em gemas superiores)
  VIEWPORT_CULLING_MARGIN: 100 // Margem em pixels fora da câmera para desativar renderização (Culling)
};

/**
 * CONFIGURAÇÃO DA ARENA DELIMITADA (MAPA FINITO GIGANTE):
 * Define os limites espaciais da arena infernal (6400 x 6400 px),
 * impedindo que o jogador e inimigos fujam para o infinito.
 */
export const ARENA_CONFIG = {
  MIN_X: -3200,
  MIN_Y: -3200,
  MAX_X: 3200,
  MAX_Y: 3200,
  get WIDTH() { return this.MAX_X - this.MIN_X; },
  get HEIGHT() { return this.MAX_Y - this.MIN_Y; },
  SPAWN_MARGIN: 180 // Margem interna para evitar spawn na parede
};

/**
 * ESCALONAMENTO PROGRESSIVO DE HORDAS (TEMPO DE SOBREVIVÊNCIA):
 * Aumenta gradualmente a vida e o dano dos inimigos conforme a partida avança,
 * garantindo que builds fortes continuem sendo desafiadas e impedindo AFK infinito.
 */
export function getEnemyScaling(survivalTimeMs: number, isEndless: boolean) {
  const minutes = survivalTimeMs / 60000;
  // +12% HP por minuto no História (+16% no Infinito)
  const hpMultiplier = 1 + minutes * (isEndless ? 0.16 : 0.12);
  // +6% Dano por minuto no História (+8% no Infinito)
  const damageMultiplier = 1 + minutes * (isEndless ? 0.08 : 0.06);
  // +2% Velocidade por minuto (limitado a +30% para não ficar impossível de desviar)
  const speedMultiplier = Math.min(1.30, 1 + minutes * 0.02);

  return { hpMultiplier, damageMultiplier, speedMultiplier, minutes };
}

/**
 * CONFIGURAÇÃO DE CAPÍTULOS DE HISTÓRIA:
 * Define metas de purificação de almas para invocar o chefe,
 * multiplicador de status de monstros e intervalo de surgimento do Altar de Ascensão.
 */
export interface ChapterConfig {
  targetSouls: number;
  enemyStatMultiplier: number;
  altarSpawnIntervalMs: number;
}

export const CHAPTER_CONFIG_FALLBACK: ChapterConfig = {
  targetSouls: 900,
  enemyStatMultiplier: 1.0,
  altarSpawnIntervalMs: 75000,
};

export const CHAPTER_CONFIG: Record<number, ChapterConfig> = {
  1: {
    targetSouls: 900,
    enemyStatMultiplier: 1.0,
    altarSpawnIntervalMs: 75000,
  },
  2: {
    targetSouls: 1350,
    enemyStatMultiplier: 1.2,
    altarSpawnIntervalMs: 75000,
  },
};

export function getChapterConfig(chapter: number): ChapterConfig {
  return CHAPTER_CONFIG[chapter] ?? CHAPTER_CONFIG_FALLBACK;
}

/**
 * FLAG MESTRE DO MODO DE TESTE (SANDBOX & DEBUG):
 * - Em desenvolvimento local: deixe `true` para exibir "MODO DE TESTE" diretamente no Menu Principal.
 * - No lançamento oficial / site público: o modo é sempre bloqueado (não abre via ?debug=1 nem localStorage).
 *   (Em ambiente local/localhost, pode ser acessado com `?debug=1` na URL mesmo em build de produção).
 */
export const ENABLE_DEV_SANDBOX: boolean = true;

export function isDevSandboxEnabled(): boolean {
  // 1. Blindagem Estrita em Endereços Públicos:
  // Se o hostname NÃO for localhost ou 127.0.0.1, retorna sempre false (sem acesso a ?debug=1 nem localStorage).
  if (typeof window !== 'undefined') {
    const hostname = window.location?.hostname ?? '';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
    if (!isLocalhost) {
      return false;
    }
  }

  // 2. Ambiente Local (localhost / 127.0.0.1):
  // Em build de produção local (ex: porta 8080 de preview), exige ?debug=1 na URL
  if (import.meta.env.PROD) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') return true;
    } catch {
      // Ignora erro de parsing em ambientes sem URLSearchParams
    }
    return false;
  }

  // Em desenvolvimento local (porta 3000), respeita ENABLE_DEV_SANDBOX ou parâmetros/localStorage
  if (ENABLE_DEV_SANDBOX) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1' || params.get('sandbox') === '1') return true;
    if (localStorage.getItem(STORAGE_KEYS.DEV_UNLOCKED) === 'true') return true;
  } catch {
    // Ignora erro de parsing ou acesso a storage
  }
  return false;
}

export type BossDefeatOutcome = 'chapter-end' | 'continue-run';

/**
 * Retorna o desfecho da derrota de um chefe principal baseado no modo de jogo:
 * - 'story': encerra o capítulo e transiciona para a cena de desfecho ('chapter-end').
 * - 'endless': a sobrevivência continua indefinidamente ('continue-run').
 * - 'sandbox': o modo de teste livre continua ('continue-run').
 */
export function getBossDefeatOutcome(gameMode: string): BossDefeatOutcome {
  if (gameMode === 'story') {
    return 'chapter-end';
  }
  return 'continue-run';
}

// ============================================================================
// 5. CHEFE DO CAPÍTULO 2: AZAZEL, O ANJO CAÍDO (Dano Base reduzido em 70%)
// ============================================================================
export const AZAZEL_BOSS_BALANCE = {
  maxHp: 16000,
  speed: 138,
  scale: 1.65,
  // Todos os valores de dano de Azazel reduzidos em 70% (30% do valor original arredondado)
  baseContactDamage: 13,        // antes: 42 (42 * 0.30 = 12.6 -> 13)
  cloneContactDamage: 10,       // antes: 32 (32 * 0.30 = 9.6 -> 10)
  directedBurstOrbDamage: 9,    // antes: 30 (30 * 0.30 = 9.0 -> 9)
  teleportOrbDamage: 8,         // antes: 28 (28 * 0.30 = 8.4 -> 8)
  rapidDashDamage: 14,          // antes: 46 (46 * 0.30 = 13.8 -> 14)
  lightningBoltDamage: 14,      // antes: 48 (48 * 0.30 = 14.4 -> 14)
  spiralOrbDamage: 8,           // antes: 26 (26 * 0.30 = 7.8 -> 8)
  darkFiveDashesDamage: 11,     // antes: 38 (38 * 0.30 = 11.4 -> 11)
  darkCloneOrbDamage: 8         // antes: 25 (25 * 0.30 = 7.5 -> 8)
} as const;



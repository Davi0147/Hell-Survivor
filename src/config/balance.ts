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
    /** XP entregue por cada cor de gema. */
    gemValues: {
      green: 5,
      blue: 20,
      red: 100,
      orange: 100,
      purple: 250,
      gold: 500,
    },
  },

  /** Itens de mapa (cálice, ímã, baú) que surgem sozinhos durante a partida. */
  MAP_ITEMS: {
    spawnIntervalMs: 40000,
    maxActive: 4,
    /** Peso do sorteio de cada item (maior = mais comum). */
    weights: { chalice: 26, magnet: 20, chest: 18, bomb: 12, hourglass: 9, fury: 7, relic: 8 },
    /** Bomba Infernal: explosão gigante em volta do jogador. */
    bomb: { radius: 380, damage: 320, bossDamage: 160, damagePerMinute: 40 },
    /** Ampulheta Partida: paralisa toda a horda visível. */
    hourglass: { stunMs: 4500, radius: 700 },
    /** Relíquia Dourada: anel de gemas e almas. */
    relic: { gems: 14, soulsMin: 6, soulsMax: 12 },
  },
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
  MAX_ACTIVE_GEMS: 150,        // Limite de gemas com sprite (só as da tela; excedentes na tela fundem na vizinha)
  MAX_STORED_GEMS: 3000,       // Gemas fora da tela guardadas só como dado (posição + XP), sem custo de desenho
  GEM_PARK_MARGIN: 240,        // Distância além da câmera a partir da qual a gema parada vira dado guardado
  GEM_PARK_INTERVAL_MS: 220,   // De quanto em quanto tempo o depósito de gemas é sincronizado com a câmera
  MAGNET_MAX_STORED_GROUPS: 40, // Ímã: em quantas gemas (XP somado) as guardadas são agrupadas ao voltar
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
// 4. INIMIGOS COMUNS, ELITES, MINICHEFES E CHEFE DO CAPÍTULO 1
// ============================================================================
// Fonte única dos atributos de combate. `hp`/`speed`/`damage` são os valores base;
// o escalonamento por tempo (getEnemyScaling) e o multiplicador de capítulo são
// aplicados no momento do spawn pela GameScene.
export const ENEMY_BALANCE = {
  zombieDog: { hp: 35, speed: 85, damage: 9 },
  zombieDogElite: { hp: 140, speed: 90, damage: 13, scale: 1.35, minMinutes: 2, chance: 0.12 },
  // Variante elite invocada manualmente pelo Modo de Teste
  zombieDogEliteSandbox: { hp: 180, speed: 96, damage: 15, scale: 1.35 },
  // Guardas dos props de mapa (cães postados em pontos fixos)
  zombieDogMapGuard: { hp: 45, speed: 95, damage: 11 },
  skullSlime: { hp: 160, speed: 46, damage: 10, endlessHpPerMinute: 30 },
  bloodBat: { hp: 14, speed: 155, damage: 5, endlessHpPerMinute: 3, endlessSpeedPerMinute: 5 },
  mummy: { hp: 130, speed: 58, damage: 15 },
  // Horda da Dimensão Abissal (Fase 3 do Azazel)
  azazelDimensionDog: { hp: 48, speed: 92, damage: 11 },
  azazelDimensionMummy: { hp: 150, speed: 62, damage: 16 },
  titanCerberus: { hp: 1400, speed: 95, damage: 20, scale: 1.85 },
  matriarchSuccubus: { hp: 2400, speed: 115, damage: 24, scale: 1.45 },
} as const;

// Regra de ouro das lutas de chefe: nenhum golpe sozinho tira mais de ~45% da vida
// base da heroína (100 HP), e todo golpe forte é telegrafado. Quem erra duas vezes
// seguidas ainda está vivo; quem erra sempre, morre.
export const SUCCUBUS_BOSS_BALANCE = {
  story: { hp: 9000, speed: 125, damage: 20, scale: 1.75, attackDamageMultiplier: 1 },
  endless: { hp: 12000, speed: 135, damage: 24, scale: 1.85, attackDamageMultiplier: 1.2 },
  attacks: {
    dashDamage: 30,
    dashTelegraphMs: 1000,
    dashCooldownMs: 4800,
    dashFirstCooldownMs: 4500,
    orbDamage: 12,
    orbSpeed: 275,
    orbCooldownMs: 3800,
    orbFirstCooldownMs: 3500,
    slamDamage: 42,
    slamRadius: 190,
    slamChargeMs: 3600,
    slamRecoveryMs: 2000,
    slamCooldownMs: 19000,
    slamFirstCooldownMs: 13000,
  },
  // Dano recebido conforme o que ela está fazendo
  damageTaken: { normal: 0.85, channeling: 0.65, recovering: 1.25 },
  // Reforços que ela chama durante a luta
  minions: { intervalMs: 11000, dogs: 2, bats: 3 },
  // Almas entregues ao vencer (sorteio entre min e max)
  soulReward: { min: 60, max: 80 },
} as const;

// ============================================================================
// 5. CHEFE DO CAPÍTULO 2: AZAZEL, O ANJO CAÍDO
// ============================================================================
export const AZAZEL_BOSS_BALANCE = {
  maxHp: 16000,
  speed: 138,
  scale: 1.65,
  /** Fração do dano que atravessa a armadura dele. */
  damageTaken: 0.85,
  baseContactDamage: 13,
  cloneContactDamage: 10,
  // Chuva de projéteis: pouco dano por orbe porque são muitos na tela
  directedBurstOrbDamage: 9,
  teleportOrbDamage: 8,
  spiralOrbDamage: 8,
  darkCloneOrbDamage: 8,
  // Golpes telegrafados: doem mais porque dá para desviar
  rapidDashDamage: 18,
  lightningBoltDamage: 18,
  darkFiveDashesDamage: 12,
  /** Fase da escuridão: tempo de mira de cada investida (ms). */
  darkDashAimMs: 420,
  /** Fase dos cristais: quantos cristais, e de quanto em quanto tempo nasce uma leva. */
  crystalCount: 3,
  dimensionWaveIntervalMs: 1100,
  /** Cálice de cura entregue ao entrar na fase dos cristais e ao voltar para o duelo final. */
  healOnPhaseChange: true,
  soulReward: { min: 90, max: 120 },
} as const;

// ============================================================================
// 6. REDE DE SEGURANÇA DAS LUTAS DE CHEFE (para qualquer build conseguir passar)
// ============================================================================
/**
 * Exaustão: se a luta se arrasta (build com pouco dano), o chefe cansa e passa a
 * receber dano extra, em degraus. Build forte nunca chega a ver isso.
 */
export interface BossFatigueConfig {
  startsAfterMs: number;
  stepMs: number;
  bonusPerStep: number;
  maxBonus: number;
}

export const BOSS_FATIGUE: Record<'rosalin' | 'azazel', BossFatigueConfig> = {
  rosalin: { startsAfterMs: 100000, stepMs: 15000, bonusPerStep: 0.15, maxBonus: 1.5 },
  azazel: { startsAfterMs: 180000, stepMs: 15000, bonusPerStep: 0.15, maxBonus: 1.5 },
};

/** Multiplicador de dano recebido pelo chefe depois de `elapsedMs` de combate. */
export function getBossFatigueMultiplier(elapsedMs: number, cfg: BossFatigueConfig): number {
  if (elapsedMs < cfg.startsAfterMs) return 1;
  const steps = 1 + Math.floor((elapsedMs - cfg.startsAfterMs) / cfg.stepMs);
  return 1 + Math.min(cfg.maxBonus, steps * cfg.bonusPerStep);
}

/**
 * Revanche: cada morte para o mesmo chefe no Modo História deixa a próxima
 * tentativa um pouco mais leve (menos vida e menos dano), até um teto.
 */
export const BOSS_MERCY = {
  hpReductionPerDeath: 0.07,
  damageReductionPerDeath: 0.05,
  maxStacks: 4,
} as const;

export function getBossMercy(deathsToBoss: number): { hpMultiplier: number; damageMultiplier: number; stacks: number } {
  const stacks = Math.max(0, Math.min(BOSS_MERCY.maxStacks, Math.floor(deathsToBoss)));
  return {
    hpMultiplier: 1 - stacks * BOSS_MERCY.hpReductionPerDeath,
    damageMultiplier: 1 - stacks * BOSS_MERCY.damageReductionPerDeath,
    stacks,
  };
}

// ============================================================================
// 8. RITMO DE COMBATE: COMBO, FRENESI, CRÍTICOS, ESQUIVA E IMPACTO
// ============================================================================
export interface ComboTier {
  /** Abates seguidos para chegar neste degrau. */
  at: number;
  label: string;
  /** Bônus de XP enquanto o combo estiver neste degrau (0.1 = +10%). */
  xpBonus: number;
}

export const COMBO_BALANCE = {
  /** Tempo sem abater até o combo zerar. */
  windowMs: 3200,
  tiers: [
    { at: 10, label: 'CRUEL', xpBonus: 0.05 },
    { at: 25, label: 'BRUTAL', xpBonus: 0.1 },
    { at: 50, label: 'SELVAGEM', xpBonus: 0.2 },
    { at: 100, label: 'INFERNAL', xpBonus: 0.3 },
    { at: 200, label: 'APOCALÍPTICO', xpBonus: 0.5 },
  ] as ComboTier[],
  /** A cada tantos abates seguidos o Frenesi dispara. */
  frenzyEvery: 50,
  frenzyDurationMs: 6000,
  frenzyDamageBonusPercent: 40,
  frenzySpeedBonusPercent: 20,
} as const;

export const CRIT_BALANCE = {
  baseChance: 0.05,
  baseMultiplier: 2,
  /** Carta Olho do Abismo. */
  chancePerCard: 0.08,
  maxChanceCards: 5,
  /** Carta Golpe Fatal. */
  multiplierPerCard: 0.5,
  maxMultiplierCards: 3,
  /** Golpes de execução (limpeza de arena, cheats) não rolam crítico. */
  ignoreAbove: 5000,
} as const;

export const DASH_BALANCE = {
  staminaCost: 25,
  durationMs: 170,
  speed: 640,
  cooldownMs: 650,
  /** Carta Passo Sombrio: dano em quem a esquiva atravessa, por nível. */
  damagePerCard: 22,
  costReductionPerCard: 5,
  hitRadius: 38,
  maxCards: 3,
} as const;

export const CORPSE_EXPLOSION_BALANCE = {
  chancePerCard: 0.15,
  baseDamage: 26,
  damagePerCard: 10,
  radius: 72,
  maxCards: 3,
  /** Trava de desempenho: explosões em cadeia por quadro. */
  maxPerFrame: 4,
} as const;

export const BLOODTHIRST_BALANCE = {
  comboWindowBonusMs: 900,
  frenzyDurationBonusMs: 2000,
  maxCards: 2,
} as const;

export const IMPACT_BALANCE = {
  /** Recuo do monstro comum ao levar um golpe (pixels). */
  hitRecoilPx: 4,
  /** Onda de choque ao voltar da tela de Level Up. */
  levelUpNovaRadius: 175,
  levelUpNovaDamage: 28,
  levelUpNovaKnockback: 320,
  /** Quantos números de dano podem existir ao mesmo tempo. */
  maxDamageTexts: 48,
} as const;

/**
 * Suprema "Ascensão Infernal": em vez de congelar a horda, a heroína entra num modo
 * de poder por alguns segundos. As armas correm mais rápido (cadência, giro das foices,
 * pulsos da aura), ela fica mais veloz e causa mais dano.
 */
export const ULTIMATE_BALANCE = {
  durationMs: 8000,
  /** Relógio das armas acelerado: 1.9 = atiram ~90% mais vezes por segundo. */
  weaponHasteMultiplier: 1.9,
  damageBonusPercent: 50,
  speedBonusPercent: 35,
  /** Intocável enquanto a animação de ativação cobre a tela. */
  castInvulnerableMs: 1300,
  openingBlast: { radius: 230, damage: 90, pushPx: 70 },
  pulse: { intervalMs: 1000, radius: 135, damage: 34 },
  finale: { radius: 270, damage: 130, pushPx: 90 },
} as const;

// ============================================================================
// 9. EVENTOS DE HORDA E PERIGOS DE CAPÍTULO
// ============================================================================
export const HORDE_EVENT_BALANCE = {
  firstEventMs: 50000,
  intervalMinMs: 38000,
  intervalMaxMs: 52000,
  siege: { baseDogs: 10, dogsPerMinute: 2, maxDogs: 22, radius: 390 },
  ambush: { batFlocks: 3, batsPerFlock: 6, dogs: 5, distance: 430 },
  thief: { hp: 260, hpPerMinute: 60, speed: 168, lifetimeMs: 15000, gems: 10, soulsMin: 6, soulsMax: 10, chestChance: 0.35 },
  elitePack: { count: 3, minMinutes: 1.5 },
  bloodMoon: { durationMs: 20000, spawnIntervalMultiplier: 0.55, xpBonus: 1, minMinutes: 2 },
} as const;

/** Tempestade de Azazel: raios telegrafados que caem durante o Capítulo 2 e ferem todo mundo. */
export const STORM_BALANCE = {
  chapters: [2] as number[],
  startsAfterMs: 30000,
  intervalMinMs: 6000,
  intervalMaxMs: 9500,
  strikesMin: 2,
  strikesMax: 4,
  telegraphMs: 1150,
  radius: 68,
  spread: 250,
  playerDamage: 12,
  enemyDamage: 70,
  enemyDamagePerMinute: 14,
} as const;

/** Elites (Cães Alfa) fora do Modo Infinito: só em capítulos listados aqui. */
export const STORY_ELITES: Record<number, { chance: number; minMinutes: number }> = {
  2: { chance: 0.08, minMinutes: 1 },
};

// ============================================================================
// 7. FIM DE JOGO: PACTO DEMONÍACO (ressurreição única por partida)
// ============================================================================
export const REVIVAL_BALANCE = {
  hpFraction: 0.5,
  invulnerableMs: 3500,
  shockwaveRadius: 260,
  shockwaveDamage: 40,
  shockwaveKnockback: 350,
} as const;


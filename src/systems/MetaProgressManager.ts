/**
 * MetaProgressManager.ts
 * Sistema central de meta-progressão permanente, economia de Almas Corrompidas,
 * árvore de bênçãos permanentes e salvamento persistente (localStorage).
 */

export type BlessingId = 'vitality' | 'might' | 'magnetism' | 'agility' | 'reroll' | 'revival';

export interface BlessingConfig {
  id: BlessingId;
  name: string;
  description: string;
  maxLevel: number;
  costs: number[]; // Custo por nível (índice 0 = nível 1)
  statBonusPerLevel: string;
}

export interface MetaSaveData {
  corruptedSouls: number;
  blessings: Record<BlessingId, number>;
  stats: {
    totalKills: number;
    totalRuns: number;
    highestEndlessTimeSec: number;
    bossesDefeated: number;
    totalSoulsCollected: number;
  };
}

export const BLESSINGS_CATALOG: Record<BlessingId, BlessingConfig> = {
  vitality: {
    id: 'vitality',
    name: 'Vitalidade Abissal',
    description: 'Aumenta permanentemente a Vida Máxima da Nixy em +12 por nível.',
    maxLevel: 5,
    costs: [15, 60, 200, 650, 2000],
    statBonusPerLevel: '+12 HP Máximo'
  },
  might: {
    id: 'might',
    name: 'Fúria Sombria',
    description: 'Aumenta o Dano Global de todas as armas e habilidades em +5% por nível.',
    maxLevel: 5,
    costs: [20, 75, 250, 800, 2400],
    statBonusPerLevel: '+5% Dano Global'
  },
  magnetism: {
    id: 'magnetism',
    name: 'Atração Etérea',
    description: 'Aumenta o raio magnético de atração de gemas e almas em +15% por nível.',
    maxLevel: 5,
    costs: [15, 50, 160, 500, 1600],
    statBonusPerLevel: '+15% Raio de Coleta'
  },
  agility: {
    id: 'agility',
    name: 'Passo Fantasma',
    description: 'Aumenta a velocidade de movimento em +4% e a Estamina Máxima em +10 por nível.',
    maxLevel: 5,
    costs: [20, 65, 220, 700, 2100],
    statBonusPerLevel: '+4% Vel / +10 Estamina'
  },
  reroll: {
    id: 'reroll',
    name: 'Sorte do Destino',
    description: 'Concede cargas de Reroll para sortear novas opções de cartas ao subir de nível.',
    maxLevel: 3,
    costs: [50, 250, 800],
    statBonusPerLevel: '+1 Reroll por Partida'
  },
  revival: {
    id: 'revival',
    name: 'Pacto Demoníaco',
    description: 'Garante +1 Ressurreição com 50% de HP ao ser derrotada.',
    maxLevel: 1,
    costs: [1200],
    statBonusPerLevel: '+1 Vida Extra'
  }
};

export class MetaProgressManager {
  private static instance: MetaProgressManager;
  private readonly STORAGE_KEY = 'hell_survivor_meta_save_v1';

  private data: MetaSaveData;
  public runSoulsCollected: number = 0;

  private constructor() {
    this.data = this.loadInitialData();

    // Garante que almas coletadas sejam bancadas mesmo se a janela for fechada ou recarregada
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.finalizeRunSouls();
      });
    }
  }

  public static getInstance(): MetaProgressManager {
    if (!MetaProgressManager.instance) {
      MetaProgressManager.instance = new MetaProgressManager();
    }
    return MetaProgressManager.instance;
  }

  // =========================================================================
  // GESTÃO DE ALMAS CORROMPIDAS
  // =========================================================================

  public getSouls(): number {
    return this.data.corruptedSouls;
  }

  public addSouls(amount: number): void {
    if (amount <= 0) return;
    this.data.corruptedSouls += amount;
    this.data.stats.totalSoulsCollected += amount;
    this.save();
  }

  public collectRunSoul(amount: number = 1): void {
    this.runSoulsCollected += amount;
  }

  public finalizeRunSouls(): number {
    const earned = this.runSoulsCollected;
    if (earned > 0) {
      this.addSouls(earned);
    }
    this.runSoulsCollected = 0;
    return earned;
  }

  public resetRunSouls(): void {
    this.runSoulsCollected = 0;
  }

  // =========================================================================
  // GESTÃO DE BÊNÇÃOS E COMPRAS
  // =========================================================================

  public getBlessingLevel(id: BlessingId): number {
    return this.data.blessings[id] || 0;
  }

  public getBlessingCost(id: BlessingId): number | null {
    const config = BLESSINGS_CATALOG[id];
    if (!config) return null;
    const currentLevel = this.getBlessingLevel(id);
    if (currentLevel >= config.maxLevel) return null; // Já maximizado
    return config.costs[currentLevel];
  }

  public canAffordBlessing(id: BlessingId): boolean {
    const cost = this.getBlessingCost(id);
    if (cost === null) return false;
    return this.data.corruptedSouls >= cost;
  }

  public upgradeBlessing(id: BlessingId): boolean {
    const cost = this.getBlessingCost(id);
    if (cost === null || this.data.corruptedSouls < cost) {
      return false;
    }

    this.data.corruptedSouls -= cost;
    this.data.blessings[id] = (this.data.blessings[id] || 0) + 1;
    this.save();
    return true;
  }

  /**
   * Calcula o total de almas investidas em todas as bênçãos até o momento
   */
  public getTotalSpentSouls(): number {
    let total = 0;
    for (const [id, config] of Object.entries(BLESSINGS_CATALOG)) {
      const level = this.getBlessingLevel(id as BlessingId);
      for (let i = 0; i < level; i++) {
        total += config.costs[i];
      }
    }
    return total;
  }

  /**
   * Reembolsa todos os upgrades devolvendo ESTRITAMENTE 70% das almas gastas
   */
  public refundBlessings(): { refundedSouls: number; lostSouls: number } {
    const totalSpent = this.getTotalSpentSouls();
    const refunded = Math.floor(totalSpent * 0.70);
    const lost = totalSpent - refunded;

    this.data.corruptedSouls += refunded;
    for (const id of Object.keys(this.data.blessings)) {
      this.data.blessings[id as BlessingId] = 0;
    }
    this.save();
    return { refundedSouls: refunded, lostSouls: lost };
  }

  // =========================================================================
  // CONSUMO DE MODIFICADORES NA GAMEPLAY
  // =========================================================================

  public getModifiers() {
    const vitalityLvl = this.getBlessingLevel('vitality');
    const mightLvl = this.getBlessingLevel('might');
    const magnetLvl = this.getBlessingLevel('magnetism');
    const agilityLvl = this.getBlessingLevel('agility');
    const rerollLvl = this.getBlessingLevel('reroll');
    const revivalLvl = this.getBlessingLevel('revival');

    return {
      bonusMaxHp: vitalityLvl * 12,
      bonusDamagePercent: mightLvl * 5,
      bonusPickupRadiusMultiplier: 1 + magnetLvl * 0.15,
      bonusSpeedMultiplier: 1 + agilityLvl * 0.04,
      bonusMaxStamina: agilityLvl * 10,
      rerollsAvailable: rerollLvl,
      hasExtraRevival: revivalLvl > 0
    };
  }

  // =========================================================================
  // ESTATÍSTICAS E RECORDES
  // =========================================================================

  public recordRun(timeSec: number, kills: number, isBossDefeated: boolean): void {
    this.data.stats.totalRuns += 1;
    this.data.stats.totalKills += kills;
    if (isBossDefeated) {
      this.data.stats.bossesDefeated += 1;
    }
    if (timeSec > this.data.stats.highestEndlessTimeSec) {
      this.data.stats.highestEndlessTimeSec = timeSec;
    }
    this.save();
  }

  public getStats() {
    return { ...this.data.stats };
  }

  // =========================================================================
  // PERSISTÊNCIA (LOCALSTORAGE)
  // =========================================================================

  public save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('[MetaProgressManager] Erro ao salvar dados no localStorage:', e);
    }
  }

  private loadInitialData(): MetaSaveData {
    const defaultData: MetaSaveData = {
      corruptedSouls: 0,
      blessings: {
        vitality: 0,
        might: 0,
        magnetism: 0,
        agility: 0,
        reroll: 0,
        revival: 0
      },
      stats: {
        totalKills: 0,
        totalRuns: 0,
        highestEndlessTimeSec: 0,
        bossesDefeated: 0,
        totalSoulsCollected: 0
      }
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            corruptedSouls: typeof parsed.corruptedSouls === 'number' ? parsed.corruptedSouls : 0,
            blessings: {
              ...defaultData.blessings,
              ...(parsed.blessings || {})
            },
            stats: {
              ...defaultData.stats,
              ...(parsed.stats || {})
            }
          };
        }
      }
    } catch (e) {
      console.warn('[MetaProgressManager] Erro ao ler dados do localStorage, usando valores padrão:', e);
    }

    return defaultData;
  }
}

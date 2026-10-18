import { describe, it, expect, beforeEach, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, String(value));
    },
    removeItem: (key: string): boolean => store.delete(key),
    clear: (): void => store.clear(),
    get length(): number {
      return store.size;
    },
    key: (index: number): string | null => Array.from(store.keys())[index] ?? null
  };
}

describe('MetaProgressManager (Lógica Pura de Meta-Progressão e Economia)', () => {
  let memoryStorage: Storage;

  beforeEach(() => {
    vi.resetModules();
    memoryStorage = createMemoryStorage();

    const mockWindow = {
      localStorage: memoryStorage,
      addEventListener: () => {}
    };

    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('localStorage', memoryStorage);
  });

  async function getFreshManager() {
    const mod = await import('../systems/MetaProgressManager');
    return mod.MetaProgressManager.getInstance();
  }

  it('inicializa com saldo zero, estatísticas limpas e todas as bênçãos no nível 0', async () => {
    const manager = await getFreshManager();
    expect(manager.getSouls()).toBe(0);
    expect(manager.getBlessingLevel('vitality')).toBe(0);
    expect(manager.getBlessingLevel('might')).toBe(0);
    expect(manager.getBlessingLevel('revival')).toBe(0);

    const stats = manager.getStats();
    expect(stats.totalKills).toBe(0);
    expect(stats.totalRuns).toBe(0);
    expect(stats.highestEndlessTimeSec).toBe(0);
    expect(stats.bossesDefeated).toBe(0);
  });

  it('permite adicionar almas e persiste corretamente no storage', async () => {
    const manager = await getFreshManager();
    manager.addSouls(100);
    expect(manager.getSouls()).toBe(100);
    expect(manager.getStats().totalSoulsCollected).toBe(100);

    // Saldo negativo ou zero não altera o total
    manager.addSouls(0);
    manager.addSouls(-50);
    expect(manager.getSouls()).toBe(100);
  });

  it('impede upgrade de bênção quando não há saldo suficiente', async () => {
    const manager = await getFreshManager();
    // Vitalidade custa 15 no nível 0
    expect(manager.canAffordBlessing('vitality')).toBe(false);
    const upgraded = manager.upgradeBlessing('vitality');
    expect(upgraded).toBe(false);
    expect(manager.getBlessingLevel('vitality')).toBe(0);
  });

  it('realiza upgrade deduzindo o custo exato da bênção e aumentando seu nível', async () => {
    const manager = await getFreshManager();
    manager.addSouls(100);

    // Vitalidade Nível 0 -> Nível 1 custa 15
    const cost = manager.getBlessingCost('vitality');
    expect(cost).toBe(15);
    expect(manager.canAffordBlessing('vitality')).toBe(true);

    const success = manager.upgradeBlessing('vitality');
    expect(success).toBe(true);
    expect(manager.getBlessingLevel('vitality')).toBe(1);
    expect(manager.getSouls()).toBe(100 - 15); // 85

    // Próximo nível (Nível 1 -> 2) custa 60
    expect(manager.getBlessingCost('vitality')).toBe(60);
  });

  it('não permite upgrade além do maxLevel da bênção', async () => {
    const manager = await getFreshManager();
    // Pacto Demoníaco (revival) tem maxLevel = 1 e custo 1200
    manager.addSouls(5000);

    expect(manager.getBlessingLevel('revival')).toBe(0);
    expect(manager.upgradeBlessing('revival')).toBe(true);
    expect(manager.getBlessingLevel('revival')).toBe(1);

    // Tentativa de passar de maxLevel
    expect(manager.getBlessingCost('revival')).toBeNull();
    expect(manager.canAffordBlessing('revival')).toBe(false);
    expect(manager.upgradeBlessing('revival')).toBe(false);
    expect(manager.getBlessingLevel('revival')).toBe(1);
  });

  it('calcula getTotalSpentSouls e devolve exatamente floor(70%) no refundBlessings', async () => {
    const manager = await getFreshManager();
    manager.addSouls(1000);

    // Compra Vitalidade (15) + Fúria Sombria (20) = 35 gasto
    manager.upgradeBlessing('vitality');
    manager.upgradeBlessing('might');

    const totalSpent = manager.getTotalSpentSouls();
    expect(totalSpent).toBe(35);

    const balanceBeforeRefund = manager.getSouls(); // 1000 - 35 = 965
    const refund = manager.refundBlessings();

    // floor(35 * 0.70) = floor(24.5) = 24
    expect(refund.refundedSouls).toBe(24);
    expect(refund.lostSouls).toBe(11); // 35 - 24 = 11

    // Saldo final deve ser 965 + 24 = 989
    expect(manager.getSouls()).toBe(balanceBeforeRefund + 24);

    // Todos os níveis de bênção devem voltar para 0
    expect(manager.getBlessingLevel('vitality')).toBe(0);
    expect(manager.getBlessingLevel('might')).toBe(0);
    expect(manager.getTotalSpentSouls()).toBe(0);
  });

  it('getModifiers retorna modificadores proporcionais aos níveis adquiridos', async () => {
    const manager = await getFreshManager();
    const baseMods = manager.getModifiers();
    expect(baseMods.bonusMaxHp).toBe(0);
    expect(baseMods.bonusDamagePercent).toBe(0);
    expect(baseMods.bonusPickupRadiusMultiplier).toBe(1);
    expect(baseMods.bonusSpeedMultiplier).toBe(1);
    expect(baseMods.bonusMaxStamina).toBe(0);
    expect(baseMods.rerollsAvailable).toBe(0);
    expect(baseMods.hasExtraRevival).toBe(false);

    manager.addSouls(3000);
    manager.upgradeBlessing('vitality'); // +12 HP
    manager.upgradeBlessing('might'); // +5% Dano
    manager.upgradeBlessing('magnetism'); // +15% Raio
    manager.upgradeBlessing('agility'); // +4% Vel, +10 Estamina
    manager.upgradeBlessing('reroll'); // +1 Reroll
    manager.upgradeBlessing('revival'); // hasExtraRevival = true

    const activeMods = manager.getModifiers();
    expect(activeMods.bonusMaxHp).toBe(12);
    expect(activeMods.bonusDamagePercent).toBe(5);
    expect(activeMods.bonusPickupRadiusMultiplier).toBeCloseTo(1.15, 5);
    expect(activeMods.bonusSpeedMultiplier).toBeCloseTo(1.04, 5);
    expect(activeMods.bonusMaxStamina).toBe(10);
    expect(activeMods.rerollsAvailable).toBe(1);
    expect(activeMods.hasExtraRevival).toBe(true);
  });

  it('contadores de recordStoryDeath e getDeathsToBoss incrementam por chefe', async () => {
    const manager = await getFreshManager();
    expect(manager.getStoryDeathCount()).toBe(0);
    expect(manager.getDeathsToBoss('rosalin')).toBe(0);

    manager.recordStoryDeath('rosalin');
    expect(manager.getStoryDeathCount()).toBe(1);
    expect(manager.getDeathsToBoss('rosalin')).toBe(1);

    manager.recordStoryDeath('azazel');
    expect(manager.getStoryDeathCount()).toBe(2);
    expect(manager.getDeathsToBoss('rosalin')).toBe(1);
    expect(manager.getDeathsToBoss('azazel')).toBe(1);
  });

  // =========================================================================
  // FILTRO POR MODO, MIGRAÇÃO DE SAVE E SANITIZAÇÃO
  // =========================================================================

  describe('Filtro por Modo de Jogo em recordRun', () => {
    it('recordRun só atualiza highestEndlessTimeSec se o modo for estritamente "endless"', async () => {
      const manager = await getFreshManager();

      // Partida longa no modo história não afeta recorde do modo infinito
      manager.recordRun(9999, 10, true, 'story');
      expect(manager.getStats().highestEndlessTimeSec).toBe(0);
      expect(manager.getStats().totalRuns).toBe(1);
      expect(manager.getStats().totalKills).toBe(10);

      // Partida no modo infinito atualiza o recorde
      manager.recordRun(120, 25, false, 'endless');
      expect(manager.getStats().highestEndlessTimeSec).toBe(120);
      expect(manager.getStats().totalRuns).toBe(2);
      expect(manager.getStats().totalKills).toBe(35);

      // Nova partida menor no infinito não reduz o recorde existente
      manager.recordRun(90, 10, false, 'endless');
      expect(manager.getStats().highestEndlessTimeSec).toBe(120);
    });

    it('modo sandbox NÃO altera nenhuma estatística persistente (kills, runs, recordes)', async () => {
      const manager = await getFreshManager();
      const initialStats = { ...manager.getStats() };

      manager.recordRun(500, 100, true, 'sandbox');

      expect(manager.getStats()).toEqual(initialStats);
      expect(manager.getStats().totalRuns).toBe(0);
      expect(manager.getStats().totalKills).toBe(0);
      expect(manager.getStats().highestEndlessTimeSec).toBe(0);
      expect(manager.getStats().bossesDefeated).toBe(0);
    });
  });

  describe('Migração com Backup e Sanitização de Save', () => {
    it('save legado sem saveVersion é migrado com backup automático prévio e campo saveVersion: 1', async () => {
      const legacySave = {
        corruptedSouls: 75,
        blessings: { vitality: 2, might: 1 },
        stats: { totalKills: 88, totalRuns: 4 }
      };
      memoryStorage.setItem('hell_survivor_meta_save_v1', JSON.stringify(legacySave));

      const manager = await getFreshManager();

      // Dados legados foram lidos corretamente
      expect(manager.getSouls()).toBe(75);
      expect(manager.getBlessingLevel('vitality')).toBe(2);
      expect(manager.getBlessingLevel('might')).toBe(1);
      expect(manager.getStats().totalKills).toBe(88);

      // Backup automático foi gerado no storage
      const backupRaw = memoryStorage.getItem('hell_survivor_meta_save_v1_backup');
      expect(backupRaw).not.toBeNull();
      expect(JSON.parse(backupRaw!).corruptedSouls).toBe(75);

      // Save ativo no storage foi persistido com saveVersion: 1
      const activeRaw = memoryStorage.getItem('hell_survivor_meta_save_v1');
      expect(activeRaw).not.toBeNull();
      expect(JSON.parse(activeRaw!).saveVersion).toBe(1);
    });

    it('sanitiza valores corrompidos (NaN, negativos, tipos inválidos) revertendo para zero', async () => {
      const corruptedSave = {
        saveVersion: 1,
        corruptedSouls: -100,
        blessings: {
          vitality: -5,
          might: NaN,
          agility: 'invalido'
        },
        stats: {
          totalKills: -999,
          totalRuns: NaN,
          highestEndlessTimeSec: -30
        }
      };
      memoryStorage.setItem('hell_survivor_meta_save_v1', JSON.stringify(corruptedSave));

      const manager = await getFreshManager();

      expect(manager.getSouls()).toBe(0);
      expect(manager.getBlessingLevel('vitality')).toBe(0);
      expect(manager.getBlessingLevel('might')).toBe(0);
      expect(manager.getBlessingLevel('agility')).toBe(0);
      expect(manager.getStats().totalKills).toBe(0);
      expect(manager.getStats().totalRuns).toBe(0);
      expect(manager.getStats().highestEndlessTimeSec).toBe(0);
    });
  });
});

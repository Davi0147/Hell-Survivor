import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateMap } from '../config/mapValidation';
import {
  DEFAULT_CHAPTER_1_MAP,
  DEFAULT_CHAPTER_2_MAP,
  DEFAULT_AZAZEL_DIM_MAP,
  ChapterMapConfig
} from '../config/mapData';

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

describe('mapValidation (Checklist Oficial de Mapas do Hell Survivor)', () => {
  it('DEFAULT_CHAPTER_1_MAP deve ser 100% válido segundo o checklist oficial', () => {
    const result = validateMap(DEFAULT_CHAPTER_1_MAP);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.counts.playerSpawnCount).toBe(1);
    expect(result.counts.bossPortalCount).toBe(1);
    expect(result.counts.bossSpawnCount).toBe(1);
    expect(result.counts.itemSpawnersCount).toBe(4);
    expect(result.counts.altar1PropsCount).toBe(0); // altar-1 em props é opcional no Cap 1
  });

  it('DEFAULT_CHAPTER_2_MAP deve ser 100% válido com suas contagens oficiais e avisos de props próximos', () => {
    const result = validateMap(DEFAULT_CHAPTER_2_MAP);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.counts.playerSpawnCount).toBe(1);
    expect(result.counts.bossPortalCount).toBe(1);
    expect(result.counts.bossSpawnCount).toBe(1);
    expect(result.counts.itemSpawnersCount).toBe(17);
    expect(result.counts.altar1PropsCount).toBe(2);

    // O validador lista props quase duplicados (< 48px) como avisos (warnings), sem invalidar o mapa
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('DEFAULT_AZAZEL_DIM_MAP (Capítulo 202) deve ser 100% válido para arena de chefe (mín. 2 spawners)', () => {
    const result = validateMap(DEFAULT_AZAZEL_DIM_MAP);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.counts.playerSpawnCount).toBe(1);
    expect(result.counts.bossPortalCount).toBe(1);
    expect(result.counts.bossSpawnCount).toBe(1);
    expect(result.counts.itemSpawnersCount).toBe(2); // Dimensão 202 exige mín. 2
    expect(result.counts.altar1PropsCount).toBe(0);
  });

  it('reprova mapa sem playerSpawn ou com playerSpawn inválido', () => {
    const invalidMap: ChapterMapConfig = {
      ...DEFAULT_CHAPTER_1_MAP,
      playerSpawn: undefined as unknown as { x: number; y: number }
    };
    const result = validateMap(invalidMap);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'playerSpawn')).toBe(true);
  });

  it('reprova mapa com coordenadas fora da ARENA_CONFIG (ex: X = 5000 além de 3200)', () => {
    const outOfBoundsMap: ChapterMapConfig = {
      ...DEFAULT_CHAPTER_1_MAP,
      playerSpawn: { x: 5000, y: 0 }
    };
    const result = validateMap(outOfBoundsMap);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'playerSpawn' && e.message.includes('ARENA_CONFIG'))).toBe(true);
  });

  it('reprova mapa de capítulo regular com menos de 4 itemSpawners', () => {
    const fewSpawnersMap: ChapterMapConfig = {
      ...DEFAULT_CHAPTER_1_MAP,
      itemSpawners: [{ x: 100, y: 100 }] // apenas 1
    };
    const result = validateMap(fewSpawnersMap);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === 'itemSpawners' && e.details?.required === 4)).toBe(true);
  });

  it('detecta props quase duplicados (< 48px de distância) emitindo warning informativo', () => {
    const duplicatePropsMap: ChapterMapConfig = {
      ...DEFAULT_CHAPTER_1_MAP,
      props: [
        { type: 'scenery-tocha', x: 100, y: 100 },
        { type: 'scenery-tocha', x: 110, y: 105 } // distância ~11px (< 48px)
      ]
    };
    const result = validateMap(duplicatePropsMap);
    expect(result.isValid).toBe(true); // Permanece válido (não é erro crítico)
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain('Props quase duplicados');
    expect(result.warnings[0].details?.type).toBe('scenery-tocha');
  });

  // =========================================================================
  // BUGS CONHECIDOS (A CORRIGIR NO PACOTE 2):
  // =========================================================================

  describe('Versionamento e Migração em MapStorageManager', () => {
    beforeEach(() => {
      vi.resetModules();
      const storage = createMemoryStorage();
      vi.stubGlobal('window', { localStorage: storage });
      vi.stubGlobal('localStorage', storage);
    });

    it(
      'MapStorageManager.getActiveMap descarta save antigo quando versão for menor, gerando backup e retornando mapa padrão',
      async () => {
        const { MapStorageManager, DEFAULT_CHAPTER_1_MAP } = await import('../config/mapData');
        const { getChapterMapKey, getChapterMapBackupKey } = await import('../config/storageKeys');

        // Salva mapa customizado antigo com version: 1
        const oldCustomMap: ChapterMapConfig = {
          ...DEFAULT_CHAPTER_1_MAP,
          version: 1,
          name: 'Meu Mapa Antigo Customizado'
        };
        MapStorageManager.saveCustomMap(oldCustomMap, 1);

        // O DEFAULT_CHAPTER_1_MAP no código possui version: 2
        // getActiveMap detecta que custom.version (1) < default.version (2),
        // salva o mapa customizado na chave de backup, limpa a chave ativa e retorna o default novo
        const loaded = MapStorageManager.getActiveMap(1);
        expect(loaded.version).toBeGreaterThan(1);
        expect(loaded.version).toBe(2);
        expect(loaded.name).toBe(DEFAULT_CHAPTER_1_MAP.name);

        // Asserções para o backup e limpeza do storage ativo
        const backupData = localStorage.getItem(getChapterMapBackupKey(1));
        expect(backupData).not.toBeNull();
        expect(JSON.parse(backupData!).name).toBe('Meu Mapa Antigo Customizado');

        const activeCustomData = localStorage.getItem(getChapterMapKey(1));
        expect(activeCustomData).toBeNull();
      }
    );

    it(
      'MapStorageManager.getActiveMap preserva mapa custom se version estiver ausente mas estrutura for válida (edição em andamento)',
      async () => {
        const { MapStorageManager, DEFAULT_CHAPTER_1_MAP } = await import('../config/mapData');

        const customMapNoVersion: Omit<ChapterMapConfig, 'version'> & { version?: number } = {
          ...DEFAULT_CHAPTER_1_MAP,
          name: 'Mapa em Edição Sem Versão Explícita'
        };
        delete customMapNoVersion.version;
        MapStorageManager.saveCustomMap(customMapNoVersion as unknown as ChapterMapConfig, 1);

        const loaded = MapStorageManager.getActiveMap(1);
        expect(loaded.name).toBe('Mapa em Edição Sem Versão Explícita');
      }
    );

    it(
      'MapStorageManager.getDefaultMap realiza lookup por Record e faz fallback para Cap. 1 em capítulos desconhecidos',
      async () => {
        const { MapStorageManager, DEFAULT_CHAPTER_1_MAP, DEFAULT_CHAPTER_2_MAP, DEFAULT_AZAZEL_DIM_MAP } = await import('../config/mapData');

        expect(MapStorageManager.getDefaultMap(1).name).toBe(DEFAULT_CHAPTER_1_MAP.name);
        expect(MapStorageManager.getDefaultMap(2).name).toBe(DEFAULT_CHAPTER_2_MAP.name);
        expect(MapStorageManager.getDefaultMap(202).name).toBe(DEFAULT_AZAZEL_DIM_MAP.name);

        // Fallback para desconhecidos
        expect(MapStorageManager.getDefaultMap(999).name).toBe(DEFAULT_CHAPTER_1_MAP.name);
        expect(MapStorageManager.getDefaultMap(-1).name).toBe(DEFAULT_CHAPTER_1_MAP.name);
      }
    );
  });
});

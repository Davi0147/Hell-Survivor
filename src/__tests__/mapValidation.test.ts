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

  describe('Bugs Conhecidos em MapStorageManager', () => {
    beforeEach(() => {
      vi.resetModules();
      const storage = createMemoryStorage();
      vi.stubGlobal('window', { localStorage: storage });
      vi.stubGlobal('localStorage', storage);
    });

    it.fails(
      '[BUG CONHECIDO - Pacote 2] MapStorageManager.getActiveMap deve descartar save antigo se o mapa padrão no código tiver versão mais nova',
      async () => {
        const { MapStorageManager, DEFAULT_CHAPTER_1_MAP } = await import('../config/mapData');

        // Salva mapa customizado antigo com version: 1
        const oldCustomMap: ChapterMapConfig = {
          ...DEFAULT_CHAPTER_1_MAP,
          version: 1,
          name: 'Meu Mapa Antigo Customizado'
        };
        MapStorageManager.saveCustomMap(oldCustomMap, 1);

        // Simulamos que no código novo o DEFAULT_CHAPTER_1_MAP foi atualizado para version: 2
        // Hoje o getActiveMap ignora o número de version e carrega cegamente o localStorage antigo.
        // O teste abaixo falha demonstrando que getActiveMap retorna o mapa antigo em vez do novo default.
        const loaded = MapStorageManager.getActiveMap(1);
        expect(loaded.version).toBeGreaterThan(1);
      }
    );
  });
});

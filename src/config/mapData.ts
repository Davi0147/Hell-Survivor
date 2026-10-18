import { getChapterMapKey, getChapterMapBackupKey } from './storageKeys';

export interface MapEntityProp {
  type: string; // ex: 'scenery-tocha', 'scenery-rocha', 'scenery-rocha-2', 'scenery-ossos', 'scenery-cogumelos', 'scenery-cristal', 'altar-1', etc.
  x: number;
  y: number;
  scale?: number;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface ChapterMapConfig {
  version: number;
  chapter: number; // 1 = Cap 1, 2 = Cap 2, 202 = Dimensão de Azazel (chao2)
  name: string;
  description?: string;
  floorTexture?: string; // 'floor-tile' (chao1.jpg) ou 'floor-tile-2' (chao2.jpg)
  playerSpawn: MapPoint;
  bossPortal: MapPoint;
  bossSpawn: MapPoint;
  itemSpawners: MapPoint[];
  props: MapEntityProp[];
}

/**
 * Layout Padrão do Capítulo 1 (Cemitério Infernal & Altar de Rosalin)
 */
export const DEFAULT_CHAPTER_1_MAP: ChapterMapConfig = {
  version: 2,
  chapter: 1,
  name: 'Capítulo 1: O Despertar no Abismo',
  description: 'Arena infernal cercada pelo abismo com o Altar de Invocação de Rosalin no quadrante nordeste.',
  floorTexture: 'floor-tile',
  playerSpawn: { x: 0, y: 0 },
  bossPortal: { x: 1450, y: -1200 },
  bossSpawn: { x: 1450, y: -1215 },
  itemSpawners: [
    { x: 380, y: -240 },
    { x: -380, y: 320 },
    { x: 800, y: -800 },
    { x: -900, y: -900 }
  ],
  props: [
    // Santuário do Altar
    { type: 'scenery-tocha', x: 1310, y: -1070, scale: 0.5 },
    { type: 'scenery-tocha', x: 1590, y: -1070, scale: 0.5 },
    { type: 'scenery-cristal', x: 1270, y: -1290, scale: 0.5 },
    { type: 'scenery-cristal', x: 1630, y: -1290, scale: 0.5 },
    { type: 'scenery-cristal', x: 1340, y: -1370, scale: 0.5 },
    { type: 'scenery-cristal', x: 1560, y: -1370, scale: 0.5 },
    { type: 'scenery-ossos', x: 1230, y: -1150, scale: 1.0 },
    { type: 'scenery-ossos', x: 1670, y: -1150, scale: 1.0 },
    { type: 'scenery-ossos', x: 1300, y: -970, scale: 1.0 },
    { type: 'scenery-ossos', x: 1600, y: -970, scale: 1.0 },
    { type: 'scenery-rocha', x: 1170, y: -1320, scale: 1.0 },
    { type: 'scenery-rocha-2', x: 1730, y: -1320, scale: 1.5 },

    // Postos Avançados da Clareira Central
    { type: 'scenery-cogumelos', x: -520, y: -450, scale: 1.0 },
    { type: 'scenery-cristal', x: -440, y: -530, scale: 0.5 },
    { type: 'scenery-rocha-2', x: -620, y: -540, scale: 1.5 },

    { type: 'scenery-cristal', x: 520, y: -450, scale: 0.5 },
    { type: 'scenery-cogumelos', x: 440, y: -530, scale: 1.0 },
    { type: 'scenery-rocha', x: 620, y: -540, scale: 1.0 },

    { type: 'scenery-ossos', x: -520, y: 520, scale: 1.0 },
    { type: 'scenery-ossos', x: -610, y: 450, scale: 1.0 },
    { type: 'scenery-rocha', x: -640, y: 560, scale: 1.0 },

    { type: 'scenery-cogumelos', x: 520, y: 520, scale: 1.0 },
    { type: 'scenery-cristal', x: 610, y: 480, scale: 0.5 },
    { type: 'scenery-ossos', x: 540, y: 620, scale: 1.0 },
    { type: 'scenery-rocha-2', x: 650, y: 580, scale: 1.5 },

    // Trilhas de Tochas Estratégicas
    { type: 'scenery-tocha', x: 950, y: -750, scale: 0.5 },
    { type: 'scenery-rocha', x: 1040, y: -720, scale: 1.0 },
    { type: 'scenery-ossos', x: 860, y: -790, scale: 1.0 },

    { type: 'scenery-tocha', x: 1150, y: -950, scale: 0.5 },
    { type: 'scenery-rocha-2', x: 1240, y: -920, scale: 1.5 },
    { type: 'scenery-ossos', x: 1060, y: -980, scale: 1.0 },

    { type: 'scenery-tocha', x: 600, y: -400, scale: 0.5 },
    { type: 'scenery-tocha', x: -550, y: -500, scale: 0.5 },
    { type: 'scenery-tocha', x: 550, y: 500, scale: 0.5 },
    { type: 'scenery-tocha', x: -550, y: 500, scale: 0.5 },
    { type: 'scenery-tocha', x: -800, y: 0, scale: 0.5 },
    { type: 'scenery-tocha', x: 800, y: 0, scale: 0.5 }
  ]
};

/**
 * Layout Padrão do Capítulo 2 (Vale das Almas & Santuário de Azazel)
 */
export const DEFAULT_CHAPTER_2_MAP: ChapterMapConfig = {
  version: 2,
  chapter: 2,
  name: 'Capítulo 2: Domínio de Azazel',
  description: 'Profundezas do purgatório onde Azazel aguarda no santuário noroeste.',
  floorTexture: 'floor-tile',
  playerSpawn: {
    x: 0,
    y: 0
  },
  bossPortal: {
    x: -1350,
    y: -1150
  },
  bossSpawn: {
    x: -1350,
    y: -1165
  },
  itemSpawners: [
    { x: 420, y: -320 },
    { x: -420, y: 360 },
    { x: -820, y: -760 },
    { x: 880, y: 780 },
    { x: -2400, y: -2080 },
    { x: -1568, y: -2528 },
    { x: -64, y: -2304 },
    { x: 2208, y: -2592 },
    { x: 2048, y: -1216 },
    { x: 2560, y: 992 },
    { x: 1952, y: 2304 },
    { x: -32, y: 1536 },
    { x: -288, y: 2688 },
    { x: -1856, y: 1888 },
    { x: -2720, y: 2784 },
    { x: -2400, y: -320 },
    { x: -1760, y: -1440 }
  ],
  props: [
    { type: 'scenery-tocha', x: -1210, y: -1010, scale: 0.5 },
    { type: 'scenery-tocha', x: -1490, y: -1010, scale: 0.5 },
    { type: 'scenery-ossos', x: -1260, y: -1310, scale: 1 },
    { type: 'scenery-ossos', x: -1440, y: -1310, scale: 1 },
    { type: 'scenery-tocha', x: -500, y: -450, scale: 0.5 },
    { type: 'scenery-tocha', x: 500, y: -450, scale: 0.5 },
    { type: 'scenery-tocha', x: -500, y: 450, scale: 0.5 },
    { type: 'scenery-tocha', x: 500, y: 450, scale: 0.5 },
    { type: 'scenery-rocha', x: -640, y: -380, scale: 1 },
    { type: 'scenery-ossos', x: -420, y: -560, scale: 1 },
    { type: 'scenery-ossos', x: 460, y: 560, scale: 1 },
    { type: 'scenery-cogumelos', x: -580, y: 520, scale: 1 },
    { type: 'scenery-tocha', x: -850, y: -750, scale: 0.5 },
    { type: 'scenery-cristal', x: -2240, y: 192, scale: 0.5 },
    { type: 'scenery-cristal', x: -2144, y: 128, scale: 0.5 },
    { type: 'scenery-cristal', x: -2048, y: 320, scale: 0.5 },
    { type: 'scenery-cristal', x: -2816, y: -32, scale: 0.5 },
    { type: 'scenery-cristal', x: -2848, y: 32, scale: 0.5 },
    { type: 'scenery-cristal', x: -2752, y: 608, scale: 0.5 },
    { type: 'scenery-cristal', x: -2752, y: 768, scale: 0.5 },
    { type: 'scenery-cristal', x: -2592, y: 800, scale: 0.5 },
    { type: 'scenery-cristal', x: -2016, y: 1920, scale: 0.5 },
    { type: 'scenery-cristal', x: -2048, y: 1856, scale: 0.5 },
    { type: 'scenery-cristal', x: -2816, y: 2624, scale: 0.5 },
    { type: 'scenery-cristal', x: -2528, y: 2720, scale: 0.5 },
    { type: 'scenery-cristal', x: -2656, y: 2848, scale: 0.5 },
    { type: 'scenery-cristal', x: -192, y: 3008, scale: 0.5 },
    { type: 'scenery-cristal', x: 256, y: 2976, scale: 0.5 },
    { type: 'scenery-cristal', x: 768, y: 2496, scale: 0.5 },
    { type: 'scenery-cristal', x: 2528, y: 2976, scale: 0.5 },
    { type: 'scenery-cristal', x: 2752, y: 2976, scale: 0.5 },
    { type: 'scenery-cristal', x: 2816, y: 2784, scale: 0.5 },
    { type: 'scenery-cristal', x: 2784, y: 608, scale: 0.5 },
    { type: 'scenery-cristal', x: 2560, y: 576, scale: 0.5 },
    { type: 'scenery-cristal', x: 2816, y: -2848, scale: 0.5 },
    { type: 'scenery-cristal', x: 2688, y: -2848, scale: 0.5 },
    { type: 'scenery-cristal', x: 2784, y: -2720, scale: 0.5 },
    { type: 'scenery-cristal', x: 864, y: -2688, scale: 0.5 },
    { type: 'scenery-cristal', x: -1440, y: -2784, scale: 0.5 },
    { type: 'scenery-cristal', x: -1728, y: -2752, scale: 0.5 },
    { type: 'scenery-cristal', x: -2560, y: -2752, scale: 0.5 },
    { type: 'scenery-cristal', x: -2720, y: -2720, scale: 0.5 },
    { type: 'scenery-cristal', x: -2784, y: -2592, scale: 0.5 },
    { type: 'scenery-ossos', x: -1472, y: -1312, scale: 1 },
    { type: 'scenery-ossos', x: -1216, y: -1312, scale: 1 },
    { type: 'scenery-ossos', x: -1504, y: -1120, scale: 1 },
    { type: 'scenery-ossos', x: -1440, y: -992, scale: 1 },
    { type: 'scenery-ossos', x: -1088, y: -1216, scale: 1 },
    { type: 'scenery-ossos', x: -1056, y: -1184, scale: 1 },
    { type: 'scenery-rocha-2', x: -2912, y: -1120, scale: 1.5 },
    { type: 'scenery-rocha-2', x: -2880, y: -1216, scale: 1.5 },
    { type: 'scenery-rocha-2', x: -2816, y: -1152, scale: 1.5 },
    { type: 'scenery-rocha', x: -2720, y: -1440, scale: 1 },
    { type: 'scenery-rocha', x: -2656, y: -1408, scale: 1 },
    { type: 'scenery-rocha', x: -2880, y: -704, scale: 1 },
    { type: 'scenery-rocha', x: -2912, y: -640, scale: 1 },
    { type: 'scenery-rocha', x: -2752, y: -288, scale: 1 },
    { type: 'scenery-cogumelos', x: -192, y: -2336, scale: 1 },
    { type: 'scenery-cogumelos', x: -128, y: -2368, scale: 1 },
    { type: 'scenery-cogumelos', x: 2592, y: -2176, scale: 1 },
    { type: 'scenery-cogumelos', x: 2720, y: -2080, scale: 1 },
    { type: 'scenery-cogumelos', x: 1440, y: -1504, scale: 1 },
    { type: 'scenery-cogumelos', x: 512, y: -2016, scale: 1 },
    { type: 'scenery-cogumelos', x: 1632, y: -160, scale: 1 },
    { type: 'scenery-cogumelos', x: 1472, y: 416, scale: 1 },
    { type: 'scenery-cogumelos', x: 576, y: 1952, scale: 1 },
    { type: 'scenery-cogumelos', x: -1056, y: 2272, scale: 1 },
    { type: 'scenery-cogumelos', x: -1600, y: 2848, scale: 1 },
    { type: 'scenery-cogumelos', x: -2784, y: 1920, scale: 1 },
    { type: 'scenery-cogumelos', x: -1984, y: 1088, scale: 1 },
    { type: 'scenery-cogumelos', x: -3008, y: 320, scale: 1 },
    { type: 'scenery-cogumelos', x: -2176, y: -3040, scale: 1 },
    { type: 'scenery-cogumelos', x: -576, y: -2784, scale: 1 },
    { type: 'altar-1', x: -2336, y: -1696, scale: 0.55 },
    { type: 'altar-1', x: 2560, y: 2688, scale: 0.55 }
  ]
};

/**
 * Layout Padrão da Dimensão Corrompida de Azazel (Fase 3 - chao2.jpg e 3 Cristais de Azazel)
 */
export const DEFAULT_AZAZEL_DIM_MAP: ChapterMapConfig = {
  version: 2,
  chapter: 202,
  name: 'Dimensão de Azazel (Fase 3 - Chao 2)',
  description: 'Dimensão corrompida com piso chao2.jpg onde 3 Cristais de Azazel devem ser purificados.',
  floorTexture: 'floor-tile-2',
  playerSpawn: { x: 0, y: 0 },
  bossPortal: { x: 0, y: -520 },
  bossSpawn: { x: 0, y: -340 },
  itemSpawners: [
    { x: -360, y: 320 },
    { x: 360, y: 320 }
  ],
  props: [
    { type: 'scenery-tocha', x: -260, y: -260, scale: 0.5 },
    { type: 'scenery-tocha', x: 260, y: -260, scale: 0.5 },
    { type: 'scenery-tocha', x: -260, y: 260, scale: 0.5 },
    { type: 'scenery-tocha', x: 260, y: 260, scale: 0.5 },
    { type: 'scenery-ossos', x: -180, y: -420, scale: 1.0 },
    { type: 'scenery-ossos', x: 180, y: -420, scale: 1.0 },
    { type: 'scenery-rocha-2', x: -580, y: -120, scale: 1.5 },
    { type: 'scenery-rocha-2', x: 580, y: -120, scale: 1.5 },
    { type: 'scenery-rocha', x: -340, y: 520, scale: 1.0 },
    { type: 'scenery-rocha', x: 340, y: 520, scale: 1.0 }
  ]
};

const DEFAULT_MAPS: Record<number, ChapterMapConfig> = {
  1: DEFAULT_CHAPTER_1_MAP,
  2: DEFAULT_CHAPTER_2_MAP,
  202: DEFAULT_AZAZEL_DIM_MAP,
};

export class MapStorageManager {
  private static getStorageKey(chapter: number = 1): string {
    return getChapterMapKey(chapter);
  }

  private static getBackupKey(chapter: number = 1): string {
    return getChapterMapBackupKey(chapter);
  }

  public static getDefaultMap(chapter: number = 1): ChapterMapConfig {
    const template = DEFAULT_MAPS[chapter] ?? DEFAULT_CHAPTER_1_MAP;
    return JSON.parse(JSON.stringify(template));
  }

  public static saveCustomMap(map: ChapterMapConfig, chapterOverride?: number): void {
    try {
      const ch = chapterOverride ?? map.chapter ?? 1;
      localStorage.setItem(this.getStorageKey(ch), JSON.stringify(map));
    } catch (e) {
      console.warn('Erro ao salvar mapa no localStorage:', e);
    }
  }

  public static loadCustomMap(chapter: number = 1): ChapterMapConfig | null {
    try {
      const data = localStorage.getItem(this.getStorageKey(chapter));
      if (data) {
        // Mapas legados podem conter campos obsoletos como azazelCrystals serializado:
        // O JSON.parse lê normalmente e o campo é ignorado sem gerar erro.
        return JSON.parse(data) as ChapterMapConfig;
      }
    } catch (e) {
      console.warn('Erro ao carregar mapa do localStorage:', e);
    }
    return null;
  }

  public static clearCustomMap(chapter: number = 1): void {
    try {
      localStorage.removeItem(this.getStorageKey(chapter));
    } catch (e) {
      console.warn('Erro ao limpar mapa do localStorage:', e);
    }
  }

  public static getActiveMap(chapter: number = 1): ChapterMapConfig {
    const defaultMap = this.getDefaultMap(chapter);
    const custom = this.loadCustomMap(chapter);

    if (!custom) {
      return defaultMap;
    }

    // Se o mapa não possuir os pontos vitais essenciais, é inválido: retorne o default
    if (!custom.playerSpawn || !custom.bossPortal) {
      return defaultMap;
    }

    const customVersion = typeof custom.version === 'number' ? custom.version : 0;
    const defaultVersion = defaultMap.version ?? 1;

    // Se a versão do custom for menor que a versão do mapa padrão no código:
    if (customVersion < defaultVersion) {
      const isVersionMissing = typeof custom.version !== 'number';
      const hasSchemaConflict = !custom.bossSpawn || !Array.isArray(custom.itemSpawners) || custom.itemSpawners.length === 0;

      // Se a versão está ausente, mas o mapa é estruturalmente válido (usuário estava editando), preserve sem descartar cego
      if (isVersionMissing && !hasSchemaConflict) {
        return custom;
      }

      // Versão expressamente menor que a padrão ou com conflito de esquema:
      // Salva backup antes de descartar silenciosamente para o jogador não perder o layout
      try {
        localStorage.setItem(this.getBackupKey(chapter), JSON.stringify(custom));
        this.clearCustomMap(chapter);
      } catch (err) {
        console.warn('Erro ao criar backup de mapa legado:', err);
      }
      return defaultMap;
    }

    return custom;
  }
}

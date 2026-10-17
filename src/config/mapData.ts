export interface MapEntityProp {
  type: string;       // ex: 'scenery-tocha', 'scenery-rocha', 'scenery-rocha-2', 'scenery-ossos', 'scenery-cogumelos', 'scenery-cristal', 'altar-1', etc.
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
  chapter: number;
  name: string;
  description?: string;
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
  version: 1,
  chapter: 1,
  name: 'Capítulo 1: O Despertar no Abismo',
  description: 'Arena infernal cercada pelo abismo com o Altar de Invocação de Rosalin no quadrante nordeste.',
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

const STORAGE_KEY_MAP = 'hell_survivor_custom_map_chapter_1';

export class MapStorageManager {
  public static saveCustomMap(map: ChapterMapConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(map));
    } catch (e) {
      console.warn('Erro ao salvar mapa no localStorage:', e);
    }
  }

  public static loadCustomMap(): ChapterMapConfig | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MAP);
      if (data) {
        return JSON.parse(data) as ChapterMapConfig;
      }
    } catch (e) {
      console.warn('Erro ao carregar mapa do localStorage:', e);
    }
    return null;
  }

  public static clearCustomMap(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_MAP);
    } catch (e) {
      console.warn('Erro ao limpar mapa do localStorage:', e);
    }
  }

  public static getActiveMap(): ChapterMapConfig {
    const custom = this.loadCustomMap();
    if (custom && custom.playerSpawn && custom.bossPortal) {
      return custom;
    }
    return JSON.parse(JSON.stringify(DEFAULT_CHAPTER_1_MAP));
  }
}

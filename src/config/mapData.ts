export interface MapEntityProp {
  type: string; // ex: 'scenery-tocha', 'scenery-rocha', 'scenery-rocha-2', 'scenery-ossos', 'scenery-cogumelos', 'scenery-cristal', 'azazel-crystal', 'altar-1', etc.
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
  azazelCrystals?: MapPoint[]; // Posições dos 3 Cristais de Azazel (Fase 3)
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
  version: 1,
  chapter: 2,
  name: 'Capítulo 2: Domínio de Azazel',
  description: 'Profundezas do purgatório onde Azazel aguarda no santuário noroeste.',
  floorTexture: 'floor-tile',
  playerSpawn: { x: 0, y: 0 },
  bossPortal: { x: -1350, y: -1150 },
  bossSpawn: { x: -1350, y: -1165 },
  itemSpawners: [
    { x: 420, y: -320 },
    { x: -420, y: 360 },
    { x: -820, y: -760 },
    { x: 880, y: 780 }
  ],
  props: [
    // Santuário de Azazel (Noroeste)
    { type: 'scenery-tocha', x: -1210, y: -1010, scale: 0.5 },
    { type: 'scenery-tocha', x: -1490, y: -1010, scale: 0.5 },
    { type: 'azazel-crystal', x: -1160, y: -1240, scale: 0.55 },
    { type: 'azazel-crystal', x: -1540, y: -1240, scale: 0.55 },
    { type: 'scenery-ossos', x: -1260, y: -1310, scale: 1.0 },
    { type: 'scenery-ossos', x: -1440, y: -1310, scale: 1.0 },
    { type: 'scenery-rocha-2', x: -1100, y: -1180, scale: 1.5 },
    { type: 'scenery-rocha-2', x: -1600, y: -1180, scale: 1.5 },

    // Clareira Central e Trilhas
    { type: 'scenery-tocha', x: -500, y: -450, scale: 0.5 },
    { type: 'scenery-tocha', x: 500, y: -450, scale: 0.5 },
    { type: 'scenery-tocha', x: -500, y: 450, scale: 0.5 },
    { type: 'scenery-tocha', x: 500, y: 450, scale: 0.5 },
    { type: 'scenery-rocha', x: -640, y: -380, scale: 1.0 },
    { type: 'scenery-rocha-2', x: 660, y: -480, scale: 1.5 },
    { type: 'scenery-ossos', x: -420, y: -560, scale: 1.0 },
    { type: 'scenery-ossos', x: 460, y: 560, scale: 1.0 },
    { type: 'scenery-cogumelos', x: -580, y: 520, scale: 1.0 },
    { type: 'scenery-cristal', x: 580, y: 420, scale: 0.5 },
    { type: 'scenery-tocha', x: -850, y: -750, scale: 0.5 },
    { type: 'scenery-tocha', x: -1080, y: -920, scale: 0.5 }
  ]
};

/**
 * Layout Padrão da Dimensão Corrompida de Azazel (Fase 3 - chao2.jpg e 3 Cristais de Azazel)
 */
export const DEFAULT_AZAZEL_DIM_MAP: ChapterMapConfig = {
  version: 1,
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
  azazelCrystals: [
    { x: 0, y: -480 },
    { x: -460, y: 320 },
    { x: 460, y: 320 }
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

export class MapStorageManager {
  private static getStorageKey(chapter: number = 1): string {
    return `hell_survivor_custom_map_chapter_${chapter}`;
  }

  public static getDefaultMap(chapter: number = 1): ChapterMapConfig {
    if (chapter === 2) {
      return JSON.parse(JSON.stringify(DEFAULT_CHAPTER_2_MAP));
    }
    if (chapter === 202) {
      return JSON.parse(JSON.stringify(DEFAULT_AZAZEL_DIM_MAP));
    }
    return JSON.parse(JSON.stringify(DEFAULT_CHAPTER_1_MAP));
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
    const custom = this.loadCustomMap(chapter);
    if (custom && custom.playerSpawn && custom.bossPortal) {
      return custom;
    }
    return this.getDefaultMap(chapter);
  }
}

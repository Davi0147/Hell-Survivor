import { ChapterMapConfig, MapPoint, MapEntityProp } from './mapData';
import { ARENA_CONFIG } from './balance';

export interface MapValidationIssue {
  field: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MapValidationWarning {
  field: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MapValidationResult {
  isValid: boolean;
  chapter: number;
  mapName: string;
  errors: MapValidationIssue[];
  warnings: MapValidationWarning[];
  counts: {
    playerSpawnCount: number;
    bossPortalCount: number;
    bossSpawnCount: number;
    itemSpawnersCount: number;
    altar1PropsCount: number;
    totalPropsCount: number;
  };
}

/**
 * Validador puro de integridade e regras de mapa do Hell Survivor.
 * Regras aprovadas:
 * 1. Capítulos regulares (Cap. 1 e Cap. 2):
 *    - Exatamente 1 playerSpawn (dentro de ARENA_CONFIG)
 *    - Exatamente 1 bossPortal e 1 bossSpawn (dentro de ARENA_CONFIG)
 *    - Mínimo de 4 itemSpawners (dentro de ARENA_CONFIG)
 *    - altar-1 em props é OPCIONAL
 * 2. Arenas de chefe / Dimensões fechadas (Cap. 202):
 *    - Exatamente 1 playerSpawn (dentro de ARENA_CONFIG)
 *    - Exatamente 1 bossPortal e 1 bossSpawn (dentro de ARENA_CONFIG)
 *    - Mínimo de 2 itemSpawners (dentro de ARENA_CONFIG)
 *    - altar-1 em props é OPCIONAL
 * 3. Todas as coordenadas (playerSpawn, bossPortal, bossSpawn, itemSpawners, props)
 *    devem estar dentro dos limites rígidos da ARENA_CONFIG [-3200..3200].
 * 4. Props quase duplicados (mesmo type a menos de 48px de distância euclidiana)
 *    geram AVISOS (warnings), não erros de reprovação.
 */
export function validateMap(map: ChapterMapConfig): MapValidationResult {
  const errors: MapValidationIssue[] = [];
  const warnings: MapValidationWarning[] = [];

  const isArenaDimension = map.chapter === 202;
  const minSpawnersRequired = isArenaDimension ? 2 : 4;

  const isWithinArena = (pt: MapPoint | undefined | null): boolean => {
    if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') return false;
    return (
      pt.x >= ARENA_CONFIG.MIN_X &&
      pt.x <= ARENA_CONFIG.MAX_X &&
      pt.y >= ARENA_CONFIG.MIN_Y &&
      pt.y <= ARENA_CONFIG.MAX_Y
    );
  };

  // 1. Validação de playerSpawn
  const hasPlayerSpawn = Boolean(map.playerSpawn && typeof map.playerSpawn.x === 'number' && typeof map.playerSpawn.y === 'number');
  const playerSpawnCount = hasPlayerSpawn ? 1 : 0;
  if (!hasPlayerSpawn) {
    errors.push({ field: 'playerSpawn', message: 'O mapa não possui ponto de playerSpawn definido.' });
  } else if (!isWithinArena(map.playerSpawn)) {
    errors.push({
      field: 'playerSpawn',
      message: `playerSpawn (${map.playerSpawn.x}, ${map.playerSpawn.y}) está fora dos limites da ARENA_CONFIG.`,
      details: { x: map.playerSpawn.x, y: map.playerSpawn.y }
    });
  }

  // 2. Validação de bossPortal e bossSpawn
  const hasBossPortal = Boolean(map.bossPortal && typeof map.bossPortal.x === 'number' && typeof map.bossPortal.y === 'number');
  const bossPortalCount = hasBossPortal ? 1 : 0;
  if (!hasBossPortal) {
    errors.push({ field: 'bossPortal', message: 'O mapa não possui bossPortal definido.' });
  } else if (!isWithinArena(map.bossPortal)) {
    errors.push({
      field: 'bossPortal',
      message: `bossPortal (${map.bossPortal.x}, ${map.bossPortal.y}) está fora dos limites da ARENA_CONFIG.`,
      details: { x: map.bossPortal.x, y: map.bossPortal.y }
    });
  }

  const hasBossSpawn = Boolean(map.bossSpawn && typeof map.bossSpawn.x === 'number' && typeof map.bossSpawn.y === 'number');
  const bossSpawnCount = hasBossSpawn ? 1 : 0;
  if (!hasBossSpawn) {
    errors.push({ field: 'bossSpawn', message: 'O mapa não possui bossSpawn definido.' });
  } else if (!isWithinArena(map.bossSpawn)) {
    errors.push({
      field: 'bossSpawn',
      message: `bossSpawn (${map.bossSpawn.x}, ${map.bossSpawn.y}) está fora dos limites da ARENA_CONFIG.`,
      details: { x: map.bossSpawn.x, y: map.bossSpawn.y }
    });
  }

  // 3. Validação de itemSpawners
  const itemSpawners = Array.isArray(map.itemSpawners) ? map.itemSpawners : [];
  const itemSpawnersCount = itemSpawners.length;
  if (itemSpawnersCount < minSpawnersRequired) {
    errors.push({
      field: 'itemSpawners',
      message: `Número insuficiente de itemSpawners: ${itemSpawnersCount} encontrado(s), mínimo exigido é ${minSpawnersRequired} para o capítulo ${map.chapter}.`,
      details: { current: itemSpawnersCount, required: minSpawnersRequired }
    });
  }

  itemSpawners.forEach((sp, idx) => {
    if (!isWithinArena(sp)) {
      errors.push({
        field: `itemSpawners[${idx}]`,
        message: `itemSpawner na posição (${sp.x}, ${sp.y}) está fora dos limites da ARENA_CONFIG.`,
        details: { index: idx, x: sp.x, y: sp.y }
      });
    }
  });

  // 4. Validação de props e detecção de props quase duplicados (< 48px)
  const props = Array.isArray(map.props) ? map.props : [];
  const totalPropsCount = props.length;
  const altar1PropsCount = props.filter((p) => p.type === 'altar-1').length;

  props.forEach((p, idx) => {
    if (!isWithinArena(p)) {
      errors.push({
        field: `props[${idx}]`,
        message: `Prop ${p.type} na posição (${p.x}, ${p.y}) está fora da ARENA_CONFIG.`,
        details: { index: idx, type: p.type, x: p.x, y: p.y }
      });
    }
  });

  const DUPLICATE_DISTANCE_THRESHOLD = 48;
  const DUPLICATE_DIST_SQ = DUPLICATE_DISTANCE_THRESHOLD * DUPLICATE_DISTANCE_THRESHOLD;

  for (let i = 0; i < props.length; i++) {
    for (let j = i + 1; j < props.length; j++) {
      const p1 = props[i];
      const p2 = props[j];
      if (p1.type === p2.type) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < DUPLICATE_DIST_SQ) {
          const dist = Math.sqrt(distSq).toFixed(1);
          warnings.push({
            field: 'props',
            message: `Props quase duplicados: dois objetos do tipo '${p1.type}' a ${dist}px de distância (índices ${i} e ${j}).`,
            details: {
              type: p1.type,
              distance: parseFloat(dist),
              propA: { index: i, x: p1.x, y: p1.y },
              propB: { index: j, x: p2.x, y: p2.y }
            }
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    chapter: map.chapter,
    mapName: map.name,
    errors,
    warnings,
    counts: {
      playerSpawnCount,
      bossPortalCount,
      bossSpawnCount,
      itemSpawnersCount,
      altar1PropsCount,
      totalPropsCount
    }
  };
}

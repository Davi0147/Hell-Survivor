/**
 * Regras puras do prólogo (corredor do RH e chegada na arena). Sem Phaser, testáveis.
 */
import type { CorridorSegment, PrologueRect } from '../config/prologueData';

export interface PlacedSegment extends CorridorSegment {
  /** Borda esquerda do pedaço no mundo do corredor. */
  x0: number;
}

/** Coloca os pedaços lado a lado a partir do x = 0. */
export function layoutCorridor(segments: readonly CorridorSegment[]): PlacedSegment[] {
  let x0 = 0;
  return segments.map((s) => {
    const placed = { ...s, x0 };
    x0 += s.width;
    return placed;
  });
}

export function corridorWidth(segments: readonly CorridorSegment[]): number {
  return segments.reduce((sum, s) => sum + s.width, 0);
}

/** Pedaço que contém o x do mundo (o último, se passar do fim). */
export function segmentAt(placed: readonly PlacedSegment[], x: number): PlacedSegment {
  for (const s of placed) {
    if (x < s.x0 + s.width) return s;
  }
  return placed[placed.length - 1];
}

export function rectContains(r: PrologueRect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/**
 * Paredes do corredor como retângulos (no mundo, já com o deslocamento vertical da imagem):
 * acima de `walkTop` e abaixo de `walkBottom` de cada pedaço, os móveis e as duas pontas.
 * A física usa estes retângulos como paredes sólidas.
 */
export function corridorWalls(placed: readonly PlacedSegment[], offsetY: number, worldHeight: number): PrologueRect[] {
  const walls: PrologueRect[] = [];
  for (const s of placed) {
    walls.push({ x: s.x0, y: 0, w: s.width, h: offsetY + s.walkTop });
    const bottom = offsetY + s.walkBottom;
    walls.push({ x: s.x0, y: bottom, w: s.width, h: worldHeight - bottom });
    for (const b of s.blockers) {
      walls.push({ x: s.x0 + b.x, y: offsetY + b.y, w: b.w, h: b.h });
    }
  }
  const total = placed.length ? placed[placed.length - 1].x0 + placed[placed.length - 1].width : 0;
  const endW = 40;
  walls.push({ x: -endW, y: 0, w: endW, h: worldHeight });
  walls.push({ x: total, y: 0, w: endW, h: worldHeight });
  return walls;
}

export interface Positioned {
  x: number;
  y: number;
}

/** NPC mais perto dos pés da Nixy dentro do raio de conversa, ou null. */
export function nearestInRange<T extends Positioned>(items: readonly T[], x: number, y: number, radius: number): T | null {
  let best: T | null = null;
  let bestDist = radius;
  for (const it of items) {
    const d = Math.hypot(it.x - x, it.y - y);
    if (d <= bestDist) {
      best = it;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Qual conversa o NPC usa agora: roda a lista em ordem, começando de um ponto sorteado, para
 * a mesma pessoa não repetir a mesma fala duas vezes seguidas.
 */
export function nextTalkIndex(count: number, previous: number | undefined, random: number): number {
  if (count <= 0) return -1;
  if (previous === undefined) return Math.min(count - 1, Math.floor(random * count));
  return (previous + 1) % count;
}

export interface ArrivalCheck {
  mode: 'story' | 'endless' | 'sandbox';
  chapter: number;
  isRevival: boolean;
}

/**
 * A chegada pela porta (e o cão) só acontece ao começar o Capítulo I no Modo História. Ao
 * ressurgir depois de morrer, ela volta do jeito de sempre (pentagrama).
 */
export function shouldPlayStoryArrival(c: ArrivalCheck): boolean {
  return c.mode === 'story' && c.chapter === 1 && !c.isRevival;
}

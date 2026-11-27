/**
 * Regras puras do prólogo (salas do corredor do RH e chegada na arena). Sem Phaser, testáveis.
 */
import { ROOM_CONTENT, ROOM_IMAGE, type CorridorRoom, type PrologueRect } from '../config/prologueData';

/**
 * Px de tela por px da arte original. A sala sempre cobre a tela: a parte desenhada ocupa a
 * altura inteira, e a sala nunca fica mais estreita que a tela (no celular largo sobra um pouco
 * em cima/embaixo, e a câmera acompanha a Nixy).
 */
export function roomScale(screenW: number, screenH: number): number {
  return Math.max(screenH / (ROOM_CONTENT.bottom - ROOM_CONTENT.top), screenW / ROOM_IMAGE.width);
}

/** Retângulo na arte original convertido para o mundo (sala começando em `x0`). */
export function scaleRect(r: PrologueRect, s: number, x0: number = 0): PrologueRect {
  return { x: x0 + r.x * s, y: r.y * s, w: r.w * s, h: r.h * s };
}

/**
 * Paredes de uma sala em px da arte original: fundo (acima de `walkTop`), frente (abaixo de
 * `walkBottom`), móveis e as duas pontas (por fora da imagem). A física usa como paredes sólidas.
 */
export function roomWalls(room: CorridorRoom): PrologueRect[] {
  const { width: W, height: H } = ROOM_IMAGE;
  const endW = 80;
  return [
    { x: 0, y: 0, w: W, h: room.walkTop },
    { x: 0, y: room.walkBottom, w: W, h: H - room.walkBottom },
    ...room.blockers,
    { x: -endW, y: 0, w: endW, h: H },
    { x: W, y: 0, w: endW, h: H },
  ];
}

export function rectContains(r: PrologueRect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export type RoomExit = 'prev' | 'next' | null;

/**
 * Os pés chegaram numa ponta da sala que leva a outra? `x` em px da arte original. A primeira
 * sala não tem saída à esquerda nem a última à direita (lá a saída é a porta).
 */
export function roomExitAt(x: number, trigger: number, hasPrev: boolean, hasNext: boolean): RoomExit {
  if (hasPrev && x <= trigger) return 'prev';
  if (hasNext && x >= ROOM_IMAGE.width - trigger) return 'next';
  return null;
}

/** Onde ela aparece (x, px originais) ao entrar numa sala vindo de um lado. */
export function roomEntryX(cameFrom: 'prev' | 'next', entry: number): number {
  return cameFrom === 'prev' ? entry : ROOM_IMAGE.width - entry;
}

/**
 * Mantém os pés (base do corpo) dentro da faixa andável da sala. `bodyHeight` é a altura da
 * caixa dos pés: o TOPO dela também não pode passar do `walkTop`, senão o corpo nasce dentro da
 * parede e a física para de empurrar (foi assim que ela subia na parede ao trocar de sala).
 */
export function clampToWalkBand(room: CorridorRoom, y: number, bodyHeight: number, margin: number = 0): number {
  return Math.min(room.walkBottom - margin, Math.max(room.walkTop + bodyHeight + margin, y));
}

/** Salas que ficam na memória: a atual e as vizinhas (o iPhone tem pouca memória de vídeo). */
export function roomsToKeep(current: number, count: number): number[] {
  return [current - 1, current, current + 1].filter((i) => i >= 0 && i < count);
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
 * O cão do encontro já percorreu a parte do caminho em que a carta do ataque aparece?
 * `fraction` = quanto da distância inicial ainda falta (0.5 = no meio do caminho).
 */
export function arrivalChaseReachedCard(startDist: number, currentDist: number, fraction: number): boolean {
  if (startDist <= 0) return true;
  return currentDist <= startDist * fraction;
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

/**
 * Onde cada peça da HUD fica, conforme a tela e o tipo de aparelho. Puro (sem Phaser), testável.
 *
 * O jogo tem altura fixa de 720 e é encolhido para caber na tela: num iPhone deitado, 1 px de
 * jogo vira ~0,48 pt. Por isso a HUD de toque é maior (textos com 20+ px de jogo para ficarem
 * legíveis) e os botões de ação ficam no canto do polegar direito.
 *
 * Organização (2026-11-24, aprovada pelo dono):
 * - XP fino de ponta a ponta no alto;
 * - status (moldura da Nixy) no topo esquerdo, armas logo abaixo;
 * - objetivo (purificação, relógio, chefe) no topo central;
 * - abates e almas no topo direito, radar logo abaixo;
 * - toque: Suprema grande no canto de baixo à direita, esquiva e corrida em arco em volta dela;
 *   analógico na metade esquerda, abaixo das armas.
 */

/** Tamanhos-base das peças (px de jogo, antes da escala). */
export const HUD_SIZES = {
  /** Arte HudStatusFrame.png. */
  statusFrame: { w: 460, h: 218 },
  /** Barra de armas: espaço da Suprema + 6 armas + tecla embaixo. */
  weapons: { ult: 66, slot: 46, gap: 8, slots: 6, keyCap: 26 },
  /** Placa do objetivo no topo central (a do chefe é mais larga). */
  objective: { w: 360, h: 46, bossW: 500 },
  /** Linha de abates e almas. */
  counters: { itemW: 118, h: 40 },
  radar: { radius: 54, labelH: 18 },
} as const;

export interface Point { x: number; y: number }
export interface Circle extends Point { r: number }
export interface Rect { left: number; top: number; right: number; bottom: number }

export interface HudLayout {
  isTouch: boolean;
  xpBarH: number;
  /** Canto de cima à esquerda da moldura de status e sua escala. */
  status: Point & { scale: number };
  /** Borda esquerda e centro vertical da barra de armas. */
  weapons: Point & { scale: number };
  /** Centro de cima da placa do objetivo. */
  objective: Point & { scale: number };
  /** Borda direita e centro vertical da linha de abates/almas. */
  counters: { right: number; y: number; scale: number };
  radar: Circle;
  /** Centro do número do combo. */
  combo: Point;
  touch: {
    pause: Circle;
    ult: Circle;
    dash: Circle;
    sprint: Circle;
    joystickHome: Point;
    /** O analógico só nasce abaixo desta linha e à esquerda de `joystickZoneRight`. */
    joystickZoneTop: number;
    joystickZoneRight: number;
  };
}

const EDGE = 16;

export function weaponsBarSize(scale: number): { w: number; h: number } {
  const s = HUD_SIZES.weapons;
  return {
    w: (s.ult + s.slots * (s.slot + s.gap)) * scale,
    h: (s.ult + s.keyCap / 2) * scale,
  };
}

export function getHudLayout(width: number, height: number, isTouch: boolean): HudLayout {
  const xpBarH = isTouch ? 12 : 10;

  // Status e armas (coluna da esquerda)
  const statusScale = isTouch ? 0.9 : 0.72;
  const status = { x: EDGE - 4, y: xpBarH + 4, scale: statusScale };
  const statusBottom = status.y + HUD_SIZES.statusFrame.h * statusScale;
  const weaponsScale = isTouch ? 1.15 : 0.85;
  const ultH = HUD_SIZES.weapons.ult * weaponsScale;
  const weapons = { x: EDGE + 8, y: statusBottom + 8 + ultH / 2, scale: weaponsScale };

  // Topo direito: (pausa no toque), abates/almas, radar
  const pause: Circle = { x: width - 58, y: xpBarH + 48, r: 36 };
  const countersScale = isTouch ? 1.35 : 1;
  const counters = {
    right: isTouch ? pause.x - pause.r - 18 : width - EDGE - 8,
    y: xpBarH + 34,
    scale: countersScale,
  };

  // Objetivo (topo central): o maior possível sem encostar no status nem nos contadores
  // (a placa mais larga é a do chefe)
  const statusRight = status.x + HUD_SIZES.statusFrame.w * statusScale;
  const countersLeft = counters.right - HUD_SIZES.counters.itemW * 2 * countersScale;
  const halfRoom = Math.min(width / 2 - statusRight, countersLeft - width / 2) - 16;
  const objectiveScale = Math.min(isTouch ? 1.35 : 1, halfRoom / (HUD_SIZES.objective.bossW / 2));
  const objective = { x: Math.round(width / 2), y: xpBarH + 8, scale: objectiveScale };
  const radarR = Math.round(HUD_SIZES.radar.radius * (isTouch ? 1.35 : 1));
  const radarTop = counters.y + (HUD_SIZES.counters.h / 2) * countersScale + 26;
  const radar: Circle = { x: width - EDGE - 18 - radarR, y: radarTop + radarR, r: radarR };
  // Combo (centro do número): no computador sob o radar; no toque à esquerda dele, para o
  // "FRENESI!" não cair em cima do botão de corrida
  const combo = isTouch
    ? { x: radar.x - radarR - 150, y: radar.y - 20 }
    : { x: Math.min(radar.x, width - 120), y: radar.y + radarR + HUD_SIZES.radar.labelH + 50 };

  // Toque: canto do polegar direito
  const m = 58;
  const ult: Circle = { x: width - m - 66, y: height - m - 66, r: 66 };
  const dash: Circle = { x: ult.x - 172, y: height - m - 52, r: 48 };
  const sprint: Circle = { x: ult.x - 112, y: ult.y - 150, r: 50 };
  const weaponsBottom = weapons.y + weaponsBarSize(weaponsScale).h - ultH / 2;

  return {
    isTouch,
    xpBarH,
    status,
    weapons,
    objective,
    counters,
    radar,
    combo,
    touch: {
      pause,
      ult,
      dash,
      sprint,
      joystickHome: { x: Math.max(170, Math.round(width * 0.14)), y: height - 170 },
      joystickZoneTop: Math.round(weaponsBottom + 24),
      joystickZoneRight: Math.round(width * 0.5),
    },
  };
}

/** Retângulos ocupados por cada peça (para testes e para o analógico não nascer em cima delas). */
export function getHudRects(l: HudLayout): Record<string, Rect> {
  const sf = HUD_SIZES.statusFrame;
  const wb = weaponsBarSize(l.weapons.scale);
  const ow = HUD_SIZES.objective.bossW * l.objective.scale;
  const oh = HUD_SIZES.objective.h * l.objective.scale;
  const cw = HUD_SIZES.counters.itemW * 2 * l.counters.scale;
  const ch = HUD_SIZES.counters.h * l.counters.scale;
  const circle = (c: Circle): Rect => ({ left: c.x - c.r, top: c.y - c.r, right: c.x + c.r, bottom: c.y + c.r });
  const rects: Record<string, Rect> = {
    status: { left: l.status.x, top: l.status.y, right: l.status.x + sf.w * l.status.scale, bottom: l.status.y + sf.h * l.status.scale },
    weapons: { left: l.weapons.x, top: l.weapons.y - (HUD_SIZES.weapons.ult * l.weapons.scale) / 2, right: l.weapons.x + wb.w, bottom: l.weapons.y - (HUD_SIZES.weapons.ult * l.weapons.scale) / 2 + wb.h },
    objective: { left: l.objective.x - ow / 2, top: l.objective.y, right: l.objective.x + ow / 2, bottom: l.objective.y + oh },
    counters: { left: l.counters.right - cw, top: l.counters.y - ch / 2, right: l.counters.right, bottom: l.counters.y + ch / 2 },
    radar: { ...circle(l.radar), bottom: l.radar.y + l.radar.r + HUD_SIZES.radar.labelH },
  };
  if (l.isTouch) {
    rects.pause = circle(l.touch.pause);
    rects.ult = circle(l.touch.ult);
    rects.dash = circle(l.touch.dash);
    rects.sprint = circle(l.touch.sprint);
  }
  return rects;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

import { describe, expect, it } from 'vitest';
import { getHudLayout, getHudRects, rectsOverlap, HUD_SIZES } from '../config/hudLayout';
import { GAME_HEIGHT, GAME_MAX_WIDTH, GAME_MIN_WIDTH } from '../config/screenFit';

const WIDTHS = [GAME_MIN_WIDTH, 1562, GAME_MAX_WIDTH];
const H = GAME_HEIGHT;

describe('getHudLayout (onde fica cada peça da HUD)', () => {
  for (const isTouch of [false, true]) {
    for (const width of WIDTHS) {
      const label = `${isTouch ? 'toque' : 'computador'} ${width}px`;
      const layout = getHudLayout(width, H, isTouch);
      const rects = getHudRects(layout);

      it(`${label}: tudo dentro da tela`, () => {
        for (const [name, r] of Object.entries(rects)) {
          expect(r.left, name).toBeGreaterThanOrEqual(0);
          expect(r.top, name).toBeGreaterThanOrEqual(0);
          expect(r.right, name).toBeLessThanOrEqual(width);
          expect(r.bottom, name).toBeLessThanOrEqual(H);
        }
      });

      it(`${label}: nenhuma peça em cima de outra`, () => {
        const names = Object.keys(rects);
        for (let i = 0; i < names.length; i++) {
          for (let j = i + 1; j < names.length; j++) {
            expect(rectsOverlap(rects[names[i]], rects[names[j]]), `${names[i]} x ${names[j]}`).toBe(false);
          }
        }
      });
    }
  }

  it('toque: botões grandes o bastante para o dedo num iPhone deitado (~0,48 pt por px)', () => {
    const t = getHudLayout(1562, H, true).touch;
    const ptPerPx = 350 / H;
    for (const c of [t.ult, t.dash, t.sprint, t.pause]) {
      expect(c.r * 2 * ptPerPx).toBeGreaterThanOrEqual(34);
    }
    expect(t.ult.r).toBeGreaterThan(t.dash.r);
  });

  it('toque: a Suprema fica no canto do polegar direito, longe do analógico', () => {
    const l = getHudLayout(1562, H, true);
    expect(l.touch.ult.x).toBeGreaterThan(1562 * 0.8);
    expect(l.touch.ult.y).toBeGreaterThan(H * 0.7);
    expect(l.touch.joystickHome.x).toBeLessThan(l.touch.joystickZoneRight);
  });

  it('toque: o analógico só nasce abaixo das armas', () => {
    const l = getHudLayout(1562, H, true);
    const weapons = getHudRects(l).weapons;
    expect(l.touch.joystickZoneTop).toBeGreaterThan(weapons.bottom);
    expect(l.touch.joystickHome.y).toBeGreaterThan(l.touch.joystickZoneTop);
  });

  it('toque (celular deitado): HUD maior que no computador', () => {
    const d = getHudLayout(1280, H, false);
    const t = getHudLayout(1562, H, true);
    expect(t.status.scale).toBeGreaterThan(d.status.scale);
    expect(t.objective.scale).toBeGreaterThan(d.objective.scale);
    expect(t.radar.r).toBeGreaterThan(HUD_SIZES.radar.radius);
  });
});

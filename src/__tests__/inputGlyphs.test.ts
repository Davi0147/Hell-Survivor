import { describe, it, expect, vi } from 'vitest';
import atlasJson from '../../public/assets/sprites/ui/buttons/button-glyphs.json';
import {
  INPUT_GLYPHS,
  findActivePad,
  glyphFramesFor,
  padFamilyFromId,
  schemeOf,
  type InputDevice,
  type PadSnapshot,
} from '../config/inputGlyphs';

vi.mock('phaser', () => {
  class EventEmitter {
    private handlers = new Map<string, Array<(...a: unknown[]) => void>>();
    on(ev: string, fn: (...a: unknown[]) => void): this {
      this.handlers.set(ev, [...(this.handlers.get(ev) ?? []), fn]);
      return this;
    }
    emit(ev: string, ...args: unknown[]): boolean {
      (this.handlers.get(ev) ?? []).forEach((fn) => fn(...args));
      return true;
    }
  }
  return { default: { Events: { EventEmitter } } };
});

const atlas: { frames: Record<string, unknown> } = atlasJson;

const DEVICES: InputDevice[] = ['keyboard', 'xbox', 'playstation', 'touch'];

const pad = (id: string, opts: Partial<PadSnapshot> = {}): PadSnapshot => ({
  id,
  connected: true,
  buttons: [{ pressed: false }, { pressed: false }],
  axes: [0, 0],
  ...opts,
});

describe('ícones de botão', () => {
  it('todo ícone usado pelas ações existe no atlas recortado', () => {
    for (const [action, row] of Object.entries(INPUT_GLYPHS)) {
      for (const device of DEVICES) {
        for (const frame of row[device]) {
          expect(atlas.frames, `${action}/${device}`).toHaveProperty(frame);
        }
      }
    }
  });

  it('teclado e controles sempre mostram algum botão; no toque só onde há o que tocar', () => {
    for (const row of Object.values(INPUT_GLYPHS)) {
      expect(row.keyboard.length).toBeGreaterThan(0);
      expect(row.xbox.length).toBeGreaterThan(0);
      expect(row.playstation.length).toBeGreaterThan(0);
    }
    expect(glyphFramesFor('dash', 'touch')).toEqual([]);
    expect(glyphFramesFor('advance', 'touch')).toEqual(['touch-tap']);
  });

  it('cada marca de controle mostra os símbolos dela', () => {
    expect(glyphFramesFor('dash', 'xbox')).toEqual(['pad-a']);
    expect(glyphFramesFor('dash', 'playstation')).toEqual(['ps-cross']);
    expect(glyphFramesFor('ultimate', 'keyboard')).toEqual(['key-e']);
  });
});

describe('padFamilyFromId', () => {
  it.each([
    ['054c-0ce6-Wireless Controller', 'playstation'],
    ['DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', 'playstation'],
    ['Wireless Controller (STANDARD GAMEPAD)', 'playstation'],
    ['Xbox 360 Controller (XInput STANDARD GAMEPAD)', 'xbox'],
    ['045e-02fd-Xbox Wireless Controller', 'xbox'],
    ['8BitDo Pro 2 (Vendor: 2dc8)', 'xbox'],
  ])('%s → %s', (id, family) => {
    expect(padFamilyFromId(id)).toBe(family);
  });
});

describe('findActivePad', () => {
  it('ignora controle parado, desconectado ou com ruído leve no analógico', () => {
    expect(findActivePad([null, pad('a'), pad('b', { axes: [0.2, -0.3] })])).toBeNull();
    expect(findActivePad([pad('c', { connected: false, buttons: [{ pressed: true }] })])).toBeNull();
  });

  it('acha o controle com botão apertado ou analógico inclinado', () => {
    expect(findActivePad([pad('a'), pad('b', { buttons: [{ pressed: true }] })])?.id).toBe('b');
    expect(findActivePad([pad('a', { axes: [0, 0.9] })])?.id).toBe('a');
  });
});

describe('InputDeviceTracker', () => {
  it('avisa só quando o aparelho muda', async () => {
    const { InputDeviceTracker, INPUT_DEVICE_CHANGED } = await import('../systems/InputDeviceTracker');
    const tracker = InputDeviceTracker.getInstance();
    const seen: string[] = [];
    tracker.on(INPUT_DEVICE_CHANGED, (d: string) => seen.push(d));
    tracker.setDevice('keyboard');
    tracker.setDevice('playstation');
    tracker.setDevice('playstation');
    tracker.setDevice('touch');
    expect(seen).toEqual(['playstation', 'touch']);
    expect(tracker.scheme).toBe('touch');
    expect(schemeOf('xbox')).toBe('gamepad');
  });
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {} }));

import { AzazelSkullRingArena } from '../entities/enemies/AzazelSkullRingArena';
import { AZAZEL_BOSS_BALANCE } from '../config/balance';

function fakeScene() {
  const graphics = { scene: true, setDepth: () => graphics, clear: () => graphics, fillStyle: () => graphics, fillRect: () => graphics, lineStyle: () => graphics, strokeCircle: () => graphics, destroy: vi.fn() };
  return {
    add: { graphics: () => graphics },
    time: { delayedCall: vi.fn() },
    tweens: { add: vi.fn(), killTweensOf: vi.fn() },
  } as unknown as ConstructorParameters<typeof AzazelSkullRingArena>[0];
}

function fakePlayer(x: number, y: number) {
  return { x, y, body: null, setPosition: vi.fn(function (this: { x: number; y: number }, nx: number, ny: number) { this.x = nx; this.y = ny; }), applyKnockback: vi.fn() };
}

describe('Roda de caveiras do Azazel: arena parada', () => {
  const edge = AZAZEL_BOSS_BALANCE.darkSkulls.arena.edgeRadius;

  it('dentro da arena, nada acontece', () => {
    const arena = new AzazelSkullRingArena(fakeScene());
    arena.start(100, 100);
    const p = fakePlayer(100 + edge - 5, 100);
    expect(arena.enforce(p)).toBe(false);
    expect(p.applyKnockback).not.toHaveBeenCalled();
  });

  it('encostou na borda: volta para dentro e é empurrada para o centro', () => {
    const arena = new AzazelSkullRingArena(fakeScene());
    arena.start(0, 0);
    const p = fakePlayer(edge + 30, 0);
    expect(arena.enforce(p)).toBe(true);
    expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(edge);
    const [vx, vy] = p.applyKnockback.mock.calls[0];
    expect(vx).toBeLessThan(0); // estava à direita: empurrão para a esquerda (centro)
    expect(Math.abs(vy)).toBeLessThan(1e-6);
  });

  it('a arena não anda: o centro fica onde começou', () => {
    const arena = new AzazelSkullRingArena(fakeScene());
    arena.start(50, -20);
    arena.enforce(fakePlayer(900, 900));
    expect(arena.getCenter()).toEqual({ x: 50, y: -20 });
  });

  it('desligada, não prende ninguém', () => {
    const arena = new AzazelSkullRingArena(fakeScene());
    arena.start(0, 0);
    arena.stop();
    expect(arena.isActive).toBe(false);
    expect(arena.enforce(fakePlayer(5000, 0))).toBe(false);
  });

  it('a roda inteira cabe na tela com a câmera travada (altura 720)', () => {
    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls;
    const visibleHeight = 720 / cfg.arena.cameraZoom;
    expect(cfg.radius * 2 + 70).toBeLessThanOrEqual(visibleHeight); // ~70 = altura de uma caveira
  });
});

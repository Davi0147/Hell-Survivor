import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Phaser from 'phaser';
import { ARENA_CONFIG } from '../config/balance';

class MockGraphics {
  public depth = 0;
  public destroyed = false;
  public rects: Array<{ x: number; y: number; w: number; h: number }> = [];

  public setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  public fillStyle(_color: number, _alpha?: number): this {
    return this;
  }

  public fillRect(x: number, y: number, w: number, h: number): this {
    this.rects.push({ x, y, w, h });
    return this;
  }

  public destroy(): void {
    this.destroyed = true;
  }
}

class MockParticleEmitter {
  public depth = 0;
  public destroyed = false;
  public emissions: Array<{ x: number; y: number }> = [];

  public setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  public emitParticleAt(x: number, y: number): void {
    this.emissions.push({ x, y });
  }

  public destroy(): void {
    this.destroyed = true;
  }
}

class MockImage {
  public x: number;
  public y: number;
  public key: string;
  public depth = 0;
  public scale = 1;
  public alpha = 1;
  public visible = true;
  public destroyed = false;
  public origin = { x: 0, y: 0 };
  public blendMode: unknown = 0;

  constructor(x: number, y: number, key: string) {
    this.x = x;
    this.y = y;
    this.key = key;
  }

  public setOrigin(x: number, y: number): this {
    this.origin = { x, y };
    return this;
  }

  public setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  public setScale(s: number): this {
    this.scale = s;
    return this;
  }

  public setBlendMode(mode: unknown): this {
    this.blendMode = mode;
    return this;
  }

  public setAlpha(a: number): this {
    this.alpha = a;
    return this;
  }

  public setVisible(v: boolean): this {
    this.visible = v;
    return this;
  }

  public destroy(): void {
    this.destroyed = true;
  }
}

class MockMapItem {
  public visible = true;
  public destroyed = false;

  public setVisible(v: boolean): this {
    this.visible = v;
    return this;
  }

  public destroy(): void {
    this.destroyed = true;
  }
}

vi.mock('phaser', () => ({
  default: {
    BlendModes: {
      NORMAL: 0,
      ADD: 1
    },
    Math: {
      Between: vi.fn((min: number, max: number) => Math.floor((min + max) / 2))
    }
  }
}));

import { ArenaScenerySystem, type ISceneryContext } from '../systems/ArenaScenerySystem';

describe('ArenaScenerySystem (Pacote 3 — Etapa 3)', () => {
  let context: ISceneryContext;
  let system: ArenaScenerySystem;
  let mockGraphicsInstance: MockGraphics;
  let mockEmitterInstance: MockParticleEmitter;
  let createdImages: MockImage[];
  let mapItems: MockMapItem[];
  let mockAltar: { visible: boolean; setVisible(v: boolean): void };
  let cameraWorldView: { x: number; y: number; right: number; bottom: number };

  beforeEach(() => {
    createdImages = [];
    mapItems = [];
    mockAltar = {
      visible: true,
      setVisible(v: boolean) {
        this.visible = v;
      }
    };

    cameraWorldView = {
      x: -400,
      y: -300,
      right: 400,
      bottom: 300
    };

    context = {
      add: {
        graphics: vi.fn(() => {
          mockGraphicsInstance = new MockGraphics();
          return mockGraphicsInstance as unknown as Phaser.GameObjects.Graphics;
        }),
        particles: vi.fn(() => {
          mockEmitterInstance = new MockParticleEmitter();
          return mockEmitterInstance as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
        }),
        image: vi.fn((x: number, y: number, key: string) => {
          const img = new MockImage(x, y, key);
          createdImages.push(img);
          return img as unknown as Phaser.GameObjects.Image;
        })
      } as unknown as Phaser.GameObjects.GameObjectFactory,
      tweens: {
        add: vi.fn()
      } as unknown as Phaser.Tweens.TweenManager,
      cameras: {
        main: {
          get worldView() {
            return cameraWorldView;
          }
        }
      } as unknown as Phaser.Cameras.Scene2D.CameraManager,
      mapItemsGroup: {
        children: true,
        getChildren: () => mapItems
      } as unknown as Phaser.GameObjects.Group,
      bossSummonAltar: mockAltar
    };

    system = new ArenaScenerySystem(context);
  });

  describe('drawArenaBorders', () => {
    it('cria gráficos de borda e emitter de partículas com as profundidades corretas', () => {
      system.drawArenaBorders();

      expect(context.add.graphics).toHaveBeenCalled();
      expect(system.borderGraphics).toBeDefined();
      expect(mockGraphicsInstance.depth).toBe(-40);
      expect(mockGraphicsInstance.rects.length).toBeGreaterThan(10);

      expect(context.add.particles).toHaveBeenCalledWith(0, 0, 'particle-smoke', expect.any(Object));
      expect(system.borderMistEmitter).toBeDefined();
      expect(mockEmitterInstance.depth).toBe(-30);
    });

    it('destrói recursos anteriores ao ser chamado novamente', () => {
      system.drawArenaBorders();
      const firstGraphics = mockGraphicsInstance;
      const firstEmitter = mockEmitterInstance;

      system.drawArenaBorders();
      expect(firstGraphics.destroyed).toBe(true);
      expect(firstEmitter.destroyed).toBe(true);
    });
  });

  describe('updateBorderMist', () => {
    beforeEach(() => {
      system.drawArenaBorders();
    });

    it('NÃO emite partículas quando a câmera está no centro da arena longe das margens', () => {
      cameraWorldView = {
        x: -400,
        y: -300,
        right: 400,
        bottom: 300
      };

      system.updateBorderMist();
      expect(mockEmitterInstance.emissions.length).toBe(0);
    });

    it('emite partículas quando a câmera está perto da borda superior', () => {
      cameraWorldView = {
        x: -400,
        y: ARENA_CONFIG.MIN_Y + 100,
        right: 400,
        bottom: ARENA_CONFIG.MIN_Y + 700
      };

      system.updateBorderMist();
      expect(mockEmitterInstance.emissions.length).toBeGreaterThan(0);
      expect(mockEmitterInstance.emissions[0].y).toBeGreaterThanOrEqual(ARENA_CONFIG.MIN_Y);
    });

    it('emite partículas quando a câmera está perto da borda inferior', () => {
      cameraWorldView = {
        x: -400,
        y: ARENA_CONFIG.MAX_Y - 700,
        right: 400,
        bottom: ARENA_CONFIG.MAX_Y - 100
      };

      system.updateBorderMist();
      expect(mockEmitterInstance.emissions.length).toBeGreaterThan(0);
      expect(mockEmitterInstance.emissions[0].y).toBeLessThanOrEqual(ARENA_CONFIG.MAX_Y);
    });

    it('emite partículas quando a câmera está perto da borda esquerda', () => {
      cameraWorldView = {
        x: ARENA_CONFIG.MIN_X + 100,
        y: -400,
        right: ARENA_CONFIG.MIN_X + 700,
        bottom: 400
      };

      system.updateBorderMist();
      expect(mockEmitterInstance.emissions.length).toBeGreaterThan(0);
    });

    it('emite partículas quando a câmera está perto da borda direita', () => {
      cameraWorldView = {
        x: ARENA_CONFIG.MAX_X - 700,
        y: -400,
        right: ARENA_CONFIG.MAX_X - 100,
        bottom: 400
      };

      system.updateBorderMist();
      expect(mockEmitterInstance.emissions.length).toBeGreaterThan(0);
    });
  });

  describe('addScenery* métodos de props individuais', () => {
    it('addSceneryRock adiciona rocha com chave e escala corretas', () => {
      system.addSceneryRock(100, 200, 0);
      expect(system.sceneryProps.length).toBe(1);
      const rock0 = system.sceneryProps[0] as unknown as MockImage;
      expect(rock0.key).toBe('scenery-rocha');
      expect(rock0.depth).toBe(-10);

      system.addSceneryRock(300, 400, 1);
      expect(system.sceneryProps.length).toBe(2);
      const rock1 = system.sceneryProps[1] as unknown as MockImage;
      expect(rock1.key).toBe('scenery-rocha-2');
    });

    it('addSceneryTorch adiciona tocha e halo de luz com tween', () => {
      system.addSceneryTorch(150, 250);
      expect(system.sceneryProps.length).toBe(2);
      const torch = system.sceneryProps[0] as unknown as MockImage;
      const halo = system.sceneryProps[1] as unknown as MockImage;

      expect(torch.key).toBe('scenery-tocha');
      expect(halo.key).toBe('torch-light');
      expect(context.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        targets: halo,
        repeat: -1,
        yoyo: true
      }));
    });

    it('addSceneryCrystal adiciona cristal com profundidade -15', () => {
      system.addSceneryCrystal(50, 60);
      expect(system.sceneryProps.length).toBe(1);
      const crystal = system.sceneryProps[0] as unknown as MockImage;
      expect(crystal.key).toBe('scenery-cristal');
      expect(crystal.depth).toBe(-15);
    });

    it('addSceneryMushroom adiciona cogumelos decorativos', () => {
      system.addSceneryMushroom(70, 80);
      expect(system.sceneryProps.length).toBe(1);
      const mush = system.sceneryProps[0] as unknown as MockImage;
      expect(mush.key).toBe('scenery-cogumelos');
      expect(mush.depth).toBe(-15);
    });

    it('addSceneryBones adiciona ossos decorativos', () => {
      system.addSceneryBones(90, 100);
      expect(system.sceneryProps.length).toBe(1);
      const bones = system.sceneryProps[0] as unknown as MockImage;
      expect(bones.key).toBe('scenery-ossos');
      expect(bones.depth).toBe(-15);
    });
  });

  describe('spawnSceneryProps', () => {
    it('popula sceneryProps com quantidade esperada de elementos de cenário (> 50)', () => {
      system.spawnSceneryProps();
      expect(system.sceneryProps.length).toBeGreaterThan(50);
    });
  });

  describe('clearAllSceneryProps e clearSceneryPropsOnly', () => {
    it('clearSceneryPropsOnly destrói todos os props e zera a lista sceneryProps', () => {
      system.addSceneryRock(10, 20);
      system.addSceneryCrystal(30, 40);
      const p1 = system.sceneryProps[0] as unknown as MockImage;
      const p2 = system.sceneryProps[1] as unknown as MockImage;

      system.clearSceneryPropsOnly();
      expect(p1.destroyed).toBe(true);
      expect(p2.destroyed).toBe(true);
      expect(system.sceneryProps.length).toBe(0);
    });

    it('clearAllSceneryProps destrói props de cenário e também itens de mapa', () => {
      system.addSceneryRock(10, 20);
      const mapItem = new MockMapItem();
      mapItems.push(mapItem);

      system.clearAllSceneryProps();
      expect(system.sceneryProps.length).toBe(0);
      expect(mapItem.destroyed).toBe(true);
    });
  });

  describe('setSceneryPropsVisible', () => {
    it('altera a visibilidade de props, altar e itens de mapa', () => {
      system.addSceneryRock(10, 20);
      system.addSceneryTorch(30, 40);
      const mapItem = new MockMapItem();
      mapItems.push(mapItem);

      system.setSceneryPropsVisible(false);
      for (const p of system.sceneryProps) {
        expect((p as unknown as MockImage).visible).toBe(false);
      }
      expect(mockAltar.visible).toBe(false);
      expect(mapItem.visible).toBe(false);

      system.setSceneryPropsVisible(true);
      for (const p of system.sceneryProps) {
        expect((p as unknown as MockImage).visible).toBe(true);
      }
      expect(mockAltar.visible).toBe(true);
      expect(mapItem.visible).toBe(true);
    });
  });

  describe('destroy', () => {
    it('limpa gráficos, emitter de partículas, props e zera lastMistCheckTime', () => {
      system.drawArenaBorders();
      system.addSceneryRock(10, 20);
      system.lastMistCheckTime = 5000;

      const g = mockGraphicsInstance;
      const e = mockEmitterInstance;
      const p = system.sceneryProps[0] as unknown as MockImage;

      system.destroy();

      expect(g.destroyed).toBe(true);
      expect(system.borderGraphics).toBeUndefined();
      expect(e.destroyed).toBe(true);
      expect(system.borderMistEmitter).toBeUndefined();
      expect(p.destroyed).toBe(true);
      expect(system.sceneryProps.length).toBe(0);
      expect(system.lastMistCheckTime).toBe(0);
    });
  });
});

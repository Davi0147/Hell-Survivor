import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';
import {
  CombatBubbleSystem,
  ICombatBubbleContext,
  ICombatBubbleTarget
} from '../systems/CombatBubbleSystem';

vi.mock('phaser', () => ({
  default: {
    Scenes: {
      Events: {
        PRE_RENDER: 'prerender'
      }
    }
  }
}));

class MockTimerEvent {
  public hasFired = false;
  public isCancelled = false;

  constructor(
    public delay: number,
    public callback: () => void
  ) {}

  public remove(): void {
    this.isCancelled = true;
  }

  public fire(): void {
    if (!this.isCancelled && !this.hasFired) {
      this.hasFired = true;
      this.callback();
    }
  }
}

class MockContainer {
  public active = true;
  public x: number;
  public y: number;
  public alpha = 0;
  public depth = 0;
  public children: unknown[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  public setAlpha(a: number): this {
    this.alpha = a;
    return this;
  }

  public setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public add(child: unknown): this {
    this.children.push(child);
    return this;
  }

  public destroy(): void {
    this.active = false;
  }
}

class MockText {
  public active = true;
  public origin = 0;
  public resolution = 1;
  public context = undefined;

  constructor(
    public x: number,
    public y: number,
    public text: string,
    public style: Record<string, unknown>
  ) {}

  public setOrigin(o: number): this {
    this.origin = o;
    return this;
  }

  public setResolution(r: number): this {
    this.resolution = r;
    return this;
  }
}

describe('CombatBubbleSystem (Pacote 3 — Etapa 2)', () => {
  let createdTimers: MockTimerEvent[];
  let eventListeners: Map<string, Array<() => void>>;
  let mockContext: ICombatBubbleContext;
  let player: ICombatBubbleTarget;
  let boss: ICombatBubbleTarget;
  let system: CombatBubbleSystem;

  beforeEach(() => {
    createdTimers = [];
    eventListeners = new Map();

    player = {
      x: 100,
      y: 100,
      active: true,
      currentHp: 100,
      isDead: false
    };

    boss = {
      x: 300,
      y: 300,
      active: true,
      currentHp: 1000,
      isDead: false
    };

    mockContext = {
      player,
      bossInstance: boss,
      isBossFightActive: true,
      isGameOver: false,
      add: {
        container: vi.fn((x: number, y: number) => new MockContainer(x, y)) as unknown as Phaser.GameObjects.GameObjectFactory['container'],
        text: vi.fn((x: number, y: number, text: string, style: Record<string, unknown>) => new MockText(x, y, text, style)) as unknown as Phaser.GameObjects.GameObjectFactory['text']
      } as unknown as Phaser.GameObjects.GameObjectFactory,
      time: {
        delayedCall: vi.fn((delay: number, cb: () => void) => {
          const timer = new MockTimerEvent(delay, cb);
          createdTimers.push(timer);
          return timer as unknown as Phaser.Time.TimerEvent;
        })
      } as unknown as Phaser.Time.Clock,
      tweens: {
        add: vi.fn((cfg: unknown) => cfg)
      } as unknown as Phaser.Tweens.TweenManager,
      events: {
        on: vi.fn((event: string, fn: () => void) => {
          const list = eventListeners.get(event) ?? [];
          list.push(fn);
          eventListeners.set(event, list);
          return mockContext.events;
        }),
        off: vi.fn((event: string, fn: () => void) => {
          const list = eventListeners.get(event) ?? [];
          const idx = list.indexOf(fn);
          if (idx !== -1) list.splice(idx, 1);
          eventListeners.set(event, list);
          return mockContext.events;
        })
      } as unknown as Phaser.Events.EventEmitter
    };

    system = new CombatBubbleSystem(mockContext);
  });

  describe('1. Criar balão (showCombatSpeechBubble)', () => {
    it('cria balão sobre o alvo com offset e adiciona à lista de ativos', () => {
      system.showCombatSpeechBubble(player, 'Olá Inferno!', 2000, true);

      const bubbles = system.getActiveBubbles();
      expect(bubbles.length).toBe(1);
      expect(bubbles[0].target).toBe(player);
      expect(bubbles[0].offsetY).toBe(-34);
      expect(mockContext.add.container).toHaveBeenCalledWith(100, 100 - 34);
      expect(mockContext.add.text).toHaveBeenCalledWith(
        0,
        0,
        'Olá Inferno!',
        expect.objectContaining({ align: 'center', strokeThickness: 3.5 })
      );
    });

    it('substitui balão anterior se o mesmo alvo falar novamente', () => {
      system.showCombatSpeechBubble(player, 'Primeira fala', 2000, true);
      const firstContainer = system.getActiveBubbles()[0].container;

      system.showCombatSpeechBubble(player, 'Segunda fala', 2000, true);
      const bubbles = system.getActiveBubbles();

      expect(bubbles.length).toBe(1);
      expect(firstContainer.active).toBe(false);
      expect(bubbles[0].container.active).toBe(true);
    });

    it('não cria balão se o alvo for nulo, inativo, morto ou sem vida', () => {
      const deadTarget: ICombatBubbleTarget = { x: 0, y: 0, active: true, isDead: true, currentHp: 0 };
      const inactiveTarget: ICombatBubbleTarget = { x: 0, y: 0, active: false, currentHp: 50 };
      const zeroHpTarget: ICombatBubbleTarget = { x: 0, y: 0, active: true, currentHp: 0 };

      system.showCombatSpeechBubble(deadTarget, 'Texto', 2000, false);
      system.showCombatSpeechBubble(inactiveTarget, 'Texto', 2000, false);
      system.showCombatSpeechBubble(zeroHpTarget, 'Texto', 2000, false);

      expect(system.getActiveBubbles().length).toBe(0);
      expect(mockContext.add.container).not.toHaveBeenCalled();
    });

    it('atualiza posição no PRE_RENDER e remove balões de alvos que morreram', () => {
      system.showCombatSpeechBubble(player, 'Acompanhando...', 3000, true);
      const bubble = system.getActiveBubbles()[0];

      player.x = 150;
      player.y = 180;

      const preRenderCbs = eventListeners.get(Phaser.Scenes.Events.PRE_RENDER) ?? [];
      expect(preRenderCbs.length).toBe(1);
      preRenderCbs[0]();

      expect(bubble.container.x).toBe(150);
      expect(bubble.container.y).toBe(180 - 34);

      // Alvo morre
      player.currentHp = 0;
      preRenderCbs[0]();

      expect(system.getActiveBubbles().length).toBe(0);
      expect(bubble.container.active).toBe(false);
    });
  });

  describe('2. Limpar balões (clearCombatSpeechBubbles)', () => {
    it('remove todos os balões e cancela todos os timers', () => {
      system.showCombatSpeechBubble(player, 'Fala 1', 2000, true);
      system.showCombatSpeechBubble(boss, 'Fala 2', 2000, false);

      expect(system.getActiveBubbles().length).toBe(2);

      system.clearCombatSpeechBubbles();

      expect(system.getActiveBubbles().length).toBe(0);
      expect(system.getBanterTimers().length).toBe(0);
      expect(createdTimers.every(t => t.isCancelled)).toBe(true);
    });
  });

  describe('3. Limpeza no destroy', () => {
    it('desinscreve do evento PRE_RENDER, destrói todos os balões e cancela timers de banter', () => {
      system.startBossCombatBanter();
      system.showCombatSpeechBubble(player, 'Fala ativa', 3000, true);
      expect(system.getActiveBubbles().length).toBe(1);
      expect(system.getBanterTimers().length).toBe(8);

      system.destroy();

      expect(system.getActiveBubbles().length).toBe(0);
      expect(system.getBanterTimers().length).toBe(0);
      expect(createdTimers.every(t => t.isCancelled)).toBe(true);
      expect(mockContext.events.off).toHaveBeenCalledWith(
        Phaser.Scenes.Events.PRE_RENDER,
        expect.any(Function)
      );
      const preRenderCbs = eventListeners.get(Phaser.Scenes.Events.PRE_RENDER) ?? [];
      expect(preRenderCbs.length).toBe(0);
    });
  });

  describe('4. Banter não dispara após clear ou destroy', () => {
    it('cancela timers de provocação se clearCombatSpeechBubbles for chamado antes', () => {
      system.startBossCombatBanter();
      expect(system.getBanterTimers().length).toBe(7);

      system.clearCombatSpeechBubbles();

      // Dispara os timers que haviam sido agendados
      for (const t of createdTimers) {
        t.fire();
      }

      // Nenhum balão deve ter sido instanciado porque foram cancelados
      expect(system.getActiveBubbles().length).toBe(0);
    });

    it('não agenda nem exibe falas se o combate de chefe não estiver ativo', () => {
      (mockContext as { isBossFightActive: boolean }).isBossFightActive = false;
      system.startBossCombatBanter();

      for (const t of createdTimers) {
        t.fire();
      }

      expect(system.getActiveBubbles().length).toBe(0);
    });
  });
});

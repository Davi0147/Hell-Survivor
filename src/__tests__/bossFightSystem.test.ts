import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({
  default: {
    Math: {
      FloatBetween: (min: number, max: number) => (min + max) / 2,
      Between: (min: number, max: number) => Math.floor((min + max) / 2),
    },
  },
}));

// Entidade falsa: guarda ouvintes e os parâmetros de spawn, sem tocar no Phaser.
vi.mock('../entities/enemies/BaseEnemy', () => {
  class BaseEnemy {
    public active = true;
    public isDead = false;
    public isInvulnerable = false;
    public x = 0;
    public y = 0;
    public hp = 0;
    public maxHp = 0;
    public damage = 0;
    public attackDamageMultiplier = 1;
    public damageTakenMultiplier = 1;
    private handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
    constructor(_scene: unknown, x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    on(event: string, cb: (...a: unknown[]) => void) {
      (this.handlers[event] ??= []).push(cb);
      return this;
    }
    emit(event: string, ...args: unknown[]) {
      for (const cb of this.handlers[event] ?? []) cb(...args);
      return true;
    }
    setDepth() {
      return this;
    }
    spawn(x: number, y: number, hp: number, _speed: number, damage: number, _scale?: number, intro = false) {
      this.x = x;
      this.y = y;
      this.hp = hp;
      this.maxHp = hp;
      this.damage = damage;
      this.isInvulnerable = intro;
      this.attackDamageMultiplier = 1;
      this.damageTakenMultiplier = 1;
    }
    startCombat = vi.fn(() => {
      this.isInvulnerable = false;
    });
    takeDamage = vi.fn();
    destroy = vi.fn();
  }
  return { BaseEnemy };
});

vi.mock('../entities/enemies/SuccubusBoss', async () => {
  const { BaseEnemy } = await import('../entities/enemies/BaseEnemy');
  return { SuccubusBoss: class SuccubusBoss extends (BaseEnemy as unknown as new (...a: unknown[]) => object) {} };
});

vi.mock('../entities/enemies/AzazelBoss', async () => {
  const { BaseEnemy } = await import('../entities/enemies/BaseEnemy');
  const Base = BaseEnemy as unknown as new (...a: unknown[]) => object;
  class AzazelBoss extends Base {
    resumeFinalShowdown = vi.fn();
    playMidPrepareScream = vi.fn();
  }
  class AzazelPhantomClone extends Base {}
  return { AzazelBoss, AzazelPhantomClone };
});

vi.mock('../entities/items/BossSummonAltar', () => ({
  BossSummonAltar: class {
    public active = true;
    public isActive = false;
    public x = 0;
    public y = 0;
    on = vi.fn();
    activate = vi.fn(() => {
      this.isActive = true;
    });
    complete = vi.fn();
    updateAltar = vi.fn();
    destroy = vi.fn();
  },
}));

const crystalInstances: Array<{ complete: () => void }> = [];
vi.mock('../entities/items/AzazelCrystal', () => ({
  AzazelCrystal: class {
    public active = true;
    public isCompleted = false;
    public isDestroyed = false;
    private onComplete?: () => void;
    constructor() {
      crystalInstances.push(this);
    }
    on(_event: string, cb: () => void) {
      this.onComplete = cb;
    }
    complete() {
      this.isCompleted = true;
      this.onComplete?.();
    }
    updateCrystal = vi.fn();
    destroy = vi.fn();
  },
}));

const sound = {
  playBossMusic: vi.fn(),
  playBattleMusic: vi.fn(),
  playEnemyDeath: vi.fn(),
  stopMusic: vi.fn(),
  playAzazelIntroMusic: vi.fn(),
  finishAzazelIntroAndTransition: vi.fn(),
};
vi.mock('../systems/SoundManager', () => ({ SoundManager: { getInstance: () => sound } }));
vi.mock('../systems/DebugSessionLogger', () => ({ DebugSessionLogger: { getInstance: () => ({ log: vi.fn() }) } }));

const meta = { getDeathsToBoss: vi.fn(() => 0), collectRunSoul: vi.fn() };
vi.mock('../systems/MetaProgressManager', () => ({ MetaProgressManager: { getInstance: () => meta } }));
vi.mock('../config/mapData', () => ({ MapStorageManager: { getActiveMap: () => ({}) } }));
vi.mock('../config/dialogues', () => ({
  ROSALIN_INTRO_DIALOGUE: [],
  AZAZEL_INTRO_DIALOGUE: [],
  getBossRematchDialogue: () => [],
}));

import { BossFightSystem, IBossFightContext } from '../systems/BossFightSystem';
import { AzazelBoss } from '../entities/enemies/AzazelBoss';
import {
  SUCCUBUS_BOSS_BALANCE,
  AZAZEL_BOSS_BALANCE,
  BOSS_FATIGUE,
  BOSS_MERCY,
} from '../config/balance';

type TestContext = IBossFightContext & { [K in keyof IBossFightContext]: IBossFightContext[K] };

function createHud() {
  return {
    showWaveAlert: vi.fn(),
    showCenterAnnouncement: vi.fn(),
    showCenterBossPhrase: vi.fn(),
    setHUDVisible: vi.fn(),
  };
}

function createScene(hud: ReturnType<typeof createHud>) {
  return {
    scene: { get: () => hud, stop: vi.fn(), start: vi.fn() },
    cameras: { main: { flash: vi.fn(), shake: vi.fn(), fadeOut: vi.fn(), once: vi.fn() } },
    time: { delayedCall: vi.fn() },
    physics: { pause: vi.fn() },
  };
}

function createContext(gameMode: 'story' | 'endless' | 'sandbox' = 'story'): TestContext {
  const enemies: unknown[] = [];
  const player = {
    x: 0,
    y: 0,
    active: true,
    currentLevel: 7,
    characterId: 'nixy',
    currentDirection: 'south',
    body: { setVelocity: vi.fn() },
    play: vi.fn(),
    setPosition: vi.fn(),
    gainUltimateCharge: vi.fn(),
  };
  return {
    player: player as unknown as IBossFightContext['player'],
    enemiesGroup: { add: (e: unknown) => enemies.push(e), getChildren: () => enemies } as unknown as Phaser.GameObjects.Group,
    gameMode,
    currentChapter: 1,
    survivalTimeMs: 60000,
    killCount: 10,
    isBossFightActive: false,
    isPlayerMovementLocked: false,
    isHordeSpawningPaused: false,
    isChapterCompleted: false,
    bossInstance: undefined,
    azazelBoss: undefined,
    bossSummonAltar: null,
    clampToArena: (x: number, y: number) => ({ x, y }),
    playDialogue: vi.fn((_lines, done: () => void) => done()),
    clearCombatSpeechBubbles: vi.fn(),
    startBossCombatBanter: vi.fn(),
    showCombatSpeechBubble: vi.fn(),
    spawnZombieDogAt: vi.fn(),
    spawnBloodBatFlock: vi.fn(),
    spawnAzazelDimensionHordeWave: vi.fn(),
    spawnGemAt: vi.fn(),
    spawnSoulItem: vi.fn(),
    spawnMapItem: vi.fn(),
    loadCustomMapLayout: vi.fn(),
    setArenaFloorTexture: vi.fn(),
    playRespawnStarEffect: vi.fn(),
    setCameraZoom: vi.fn(),
  };
}

function build(gameMode: 'story' | 'endless' | 'sandbox' = 'story') {
  const hud = createHud();
  const scene = createScene(hud);
  const ctx = createContext(gameMode);
  const system = new BossFightSystem(scene as unknown as Phaser.Scene, ctx);
  return { hud, scene, ctx, system };
}

describe('BossFightSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meta.getDeathsToBoss.mockReturnValue(0);
    crystalInstances.length = 0;
  });

  describe('revanche (alívio por mortes anteriores)', () => {
    it('primeira tentativa: Rosalin nasce com a vida cheia', () => {
      const { ctx, system } = build('story');
      system.spawnRosalin(false, false);
      expect(ctx.bossInstance?.maxHp).toBe(SUCCUBUS_BOSS_BALANCE.story.hp);
      expect(ctx.bossInstance?.attackDamageMultiplier).toBe(1);
    });

    it('depois de 2 mortes no História: menos vida e menos dano', () => {
      meta.getDeathsToBoss.mockReturnValue(2);
      const { ctx, system } = build('story');
      system.spawnRosalin(false, false);
      expect(ctx.bossInstance?.maxHp).toBe(Math.round(SUCCUBUS_BOSS_BALANCE.story.hp * (1 - 2 * BOSS_MERCY.hpReductionPerDeath)));
      expect(ctx.bossInstance?.attackDamageMultiplier).toBeCloseTo(1 - 2 * BOSS_MERCY.damageReductionPerDeath);
    });

    it('Infinito e Modo de Teste nunca recebem alívio', () => {
      meta.getDeathsToBoss.mockReturnValue(4);
      const { ctx, system } = build('endless');
      system.spawnEndlessTimedBoss();
      expect(ctx.isBossFightActive).toBe(true);
      expect(ctx.bossInstance?.maxHp).toBe(SUCCUBUS_BOSS_BALANCE.endless.hp);
      expect(ctx.bossInstance?.attackDamageMultiplier).toBe(SUCCUBUS_BOSS_BALANCE.endless.attackDamageMultiplier);
    });

    it('Azazel também é aliviado no História', () => {
      meta.getDeathsToBoss.mockReturnValue(1);
      const { ctx, system } = build('story');
      system.spawnAzazel(false);
      expect(ctx.azazelBoss?.maxHp).toBe(Math.round(AZAZEL_BOSS_BALANCE.maxHp * (1 - BOSS_MERCY.hpReductionPerDeath)));
    });
  });

  describe('exaustão (luta longa demais)', () => {
    it('chefe passa a receber mais dano e o jogador é avisado uma única vez', () => {
      const { ctx, system, hud } = build('story');
      ctx.isBossFightActive = true;
      system.spawnRosalin(false, false);

      system.update(BOSS_FATIGUE.rosalin.startsAfterMs - 10);
      expect(ctx.bossInstance?.damageTakenMultiplier).toBe(1);
      expect(hud.showWaveAlert).not.toHaveBeenCalled();

      system.update(20);
      system.update(20);
      expect(ctx.bossInstance?.damageTakenMultiplier).toBeGreaterThan(1);
      expect(hud.showWaveAlert).toHaveBeenCalledTimes(1);
    });

    it('o relógio zera quando uma nova luta começa', () => {
      const { ctx, system } = build('sandbox');
      ctx.isBossFightActive = true;
      system.spawnRosalin(false, false);
      system.update(BOSS_FATIGUE.rosalin.startsAfterMs + 1000);
      expect(system.getFatigueMultiplier()).toBeGreaterThan(1);

      system.spawnRosalin(false, false);
      expect(system.getFatigueMultiplier()).toBe(1);
    });
  });

  describe('Rosalin', () => {
    it('chama reforços no intervalo configurado', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      system.spawnRosalin(false, false);

      system.update(SUCCUBUS_BOSS_BALANCE.minions.intervalMs - 1);
      expect(ctx.spawnZombieDogAt).not.toHaveBeenCalled();

      system.update(2);
      expect(ctx.spawnZombieDogAt).toHaveBeenCalledTimes(SUCCUBUS_BOSS_BALANCE.minions.dogs);
      expect(ctx.spawnBloodBatFlock).toHaveBeenCalledWith(SUCCUBUS_BOSS_BALANCE.minions.bats);
    });

    it('não chama reforços enquanto está parada na entrada cinematográfica', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      system.spawnRosalin(false, true);
      system.update(SUCCUBUS_BOSS_BALANCE.minions.intervalMs * 2);
      expect(ctx.spawnZombieDogAt).not.toHaveBeenCalled();
    });

    it('derrota no História encerra o capítulo', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      system.spawnRosalin(false, false);
      (ctx.bossInstance as unknown as { emit(e: string): void }).emit('boss-defeated');
      expect(ctx.isChapterCompleted).toBe(true);
      expect(meta.collectRunSoul).toHaveBeenCalledTimes(1);
    });

    it('derrota no Modo de Teste solta o prêmio e a partida continua', () => {
      const { ctx, system } = build('sandbox');
      ctx.isBossFightActive = true;
      ctx.isHordeSpawningPaused = true;
      system.spawnRosalin(false, false);
      (ctx.bossInstance as unknown as { emit(e: string): void }).emit('boss-defeated');
      expect(ctx.isChapterCompleted).toBe(false);
      expect(ctx.isBossFightActive).toBe(false);
      expect(ctx.isHordeSpawningPaused).toBe(false);
      expect(ctx.bossInstance).toBeUndefined();
      expect(ctx.spawnMapItem).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'chest');
    });
  });

  describe('Azazel: fase dos cristais', () => {
    it('cria os cristais, liga a horda e entrega um cálice', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      system.spawnAzazel(false);
      system.startAzazelCrystalPhase();

      expect(system.crystals).toHaveLength(AZAZEL_BOSS_BALANCE.crystalCount);
      expect(system.isPhase3HordeActive).toBe(true);
      expect(ctx.spawnMapItem).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'chalice');
    });

    it('a horda da dimensão nasce no intervalo configurado', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      system.spawnAzazel(false);
      system.startAzazelCrystalPhase();
      const initialWaves = vi.mocked(ctx.spawnAzazelDimensionHordeWave).mock.calls.length;

      system.update(AZAZEL_BOSS_BALANCE.dimensionWaveIntervalMs + 1);
      expect(ctx.spawnAzazelDimensionHordeWave).toHaveBeenCalledTimes(initialWaves + 1);
    });

    it('purificar todos os cristais encerra a horda e traz Azazel de volta', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      system.spawnAzazel(false);
      system.startAzazelCrystalPhase();
      const boss = ctx.azazelBoss as unknown as { resumeFinalShowdown: ReturnType<typeof vi.fn> };

      const created = [...crystalInstances];
      created.slice(0, -1).forEach((c) => c.complete());
      expect(system.crystalsCaptured).toBe(AZAZEL_BOSS_BALANCE.crystalCount - 1);
      expect(boss.resumeFinalShowdown).not.toHaveBeenCalled();

      created[created.length - 1].complete();
      expect(system.isPhase3HordeActive).toBe(false);
      expect(system.crystals).toHaveLength(0);
      expect(boss.resumeFinalShowdown).toHaveBeenCalledTimes(1);
    });

    it('morrer durante a fase desliga a horda e solta a trava de movimento', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      ctx.isPlayerMovementLocked = true;
      system.spawnAzazel(false);
      system.startAzazelCrystalPhase();
      system.onPlayerDeath();
      expect(system.isPhase3HordeActive).toBe(false);
      expect(ctx.isPlayerMovementLocked).toBe(false);
    });
  });

  describe('getActiveBossId', () => {
    it('sem luta ativa não há chefe', () => {
      const { system } = build('story');
      expect(system.getActiveBossId()).toBeUndefined();
    });

    it('capítulo 1 é a Rosalin; com Azazel em campo é o Azazel', () => {
      const { ctx, system } = build('story');
      ctx.isBossFightActive = true;
      expect(system.getActiveBossId()).toBe('rosalin');
      system.spawnAzazel(false);
      expect(ctx.azazelBoss).toBeInstanceOf(AzazelBoss);
      expect(system.getActiveBossId()).toBe('azazel');
    });
  });
});

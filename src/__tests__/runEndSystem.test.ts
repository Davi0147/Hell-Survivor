import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Phaser from 'phaser';

vi.mock('phaser', () => ({ default: {} }));

const sound = { stopMusic: vi.fn(), playGameOver: vi.fn(), playLevelUp: vi.fn() };
vi.mock('../systems/SoundManager', () => ({ SoundManager: { getInstance: () => sound } }));

const meta = {
  getModifiers: vi.fn(() => ({ hasExtraRevival: false })),
  finalizeRunSouls: vi.fn(() => 12),
  recordRun: vi.fn(),
  recordStoryDeath: vi.fn(),
  getStats: vi.fn(() => ({ bestCombo: 40 })),
};
vi.mock('../systems/MetaProgressManager', () => ({ MetaProgressManager: { getInstance: () => meta } }));

const bot = { isEnabled: false, recordRun: vi.fn() };
vi.mock('../systems/AutoPlayTestAgent', () => ({ AutoPlayTestAgent: { getInstance: () => bot } }));

import { RunEndSystem, IRunEndContext } from '../systems/RunEndSystem';
import { REVIVAL_BALANCE } from '../config/balance';

function createHud() {
  return { setHUDVisible: vi.fn(), showWaveAlert: vi.fn(), showGameOverModal: vi.fn() };
}

function createEnemy(x: number, y: number) {
  return { active: true, isDead: false, x, y, takeDamage: vi.fn(), body: { setVelocity: vi.fn() } };
}

function build(overrides: Partial<IRunEndContext> = {}, enemies: unknown[] = []) {
  const hud = createHud();
  const scene = {
    scene: { get: () => hud, stop: vi.fn(), start: vi.fn() },
    cameras: { main: { flash: vi.fn(), shake: vi.fn() } },
    time: { delayedCall: vi.fn((_ms: number, cb: () => void) => cb()) },
    physics: { pause: vi.fn(), resume: vi.fn(), world: {} },
  };
  const player = {
    x: 0,
    y: 0,
    maxHp: 100,
    currentHp: 0,
    currentLevel: 5,
    characterName: 'NIXY',
    body: { setVelocity: vi.fn() },
    setTint: vi.fn(),
  };
  const ctx = {
    player: player as unknown as IRunEndContext['player'],
    enemiesGroup: { getChildren: () => enemies } as unknown as Phaser.GameObjects.Group,
    gameMode: 'story',
    currentChapter: 1,
    survivalTimeMs: 90500,
    killCount: 33,
    weapons: [{ name: 'Soul Bolt' }],
    sandboxGodMode: false,
    isGameOver: false,
    getActiveBossId: vi.fn(() => undefined),
    notifyPlayerDeath: vi.fn(),
    grantInvulnerability: vi.fn(),
    playRespawnStarEffect: vi.fn(),
    clearCombatSpeechBubbles: vi.fn(),
    ...overrides,
  } as IRunEndContext;
  const system = new RunEndSystem(scene as unknown as Phaser.Scene, ctx);
  return { hud, scene, ctx, player, system };
}

describe('RunEndSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meta.getModifiers.mockReturnValue({ hasExtraRevival: false });
    bot.isEnabled = false;
  });

  it('com vida, nada acontece', () => {
    const { system, player, ctx } = build();
    player.currentHp = 1;
    expect(system.checkPlayerDeath()).toBe(false);
    expect(ctx.isGameOver).toBe(false);
  });

  it('God Mode do Modo de Teste restaura a vida em vez de matar', () => {
    const { system, player, ctx } = build({ sandboxGodMode: true });
    expect(system.checkPlayerDeath()).toBe(false);
    expect(player.currentHp).toBe(player.maxHp);
    expect(ctx.isGameOver).toBe(false);
  });

  describe('Pacto Demoníaco', () => {
    it('ressuscita uma vez: vida parcial, imunidade e onda de choque', () => {
      meta.getModifiers.mockReturnValue({ hasExtraRevival: true });
      const near = createEnemy(50, 0);
      const far = createEnemy(REVIVAL_BALANCE.shockwaveRadius + 50, 0);
      const { system, player, ctx, hud } = build({}, [near, far]);

      expect(system.checkPlayerDeath()).toBe(false);
      expect(player.currentHp).toBe(Math.round(player.maxHp * REVIVAL_BALANCE.hpFraction));
      expect(ctx.grantInvulnerability).toHaveBeenCalledWith(REVIVAL_BALANCE.invulnerableMs);
      expect(near.takeDamage).toHaveBeenCalledWith(REVIVAL_BALANCE.shockwaveDamage);
      expect(far.takeDamage).not.toHaveBeenCalled();
      expect(hud.showWaveAlert).toHaveBeenCalledTimes(1);
      expect(system.hasRevivalUsed).toBe(true);
      expect(ctx.isGameOver).toBe(false);
    });

    it('a segunda morte na mesma partida é definitiva', () => {
      meta.getModifiers.mockReturnValue({ hasExtraRevival: true });
      const { system, player, ctx } = build();
      system.checkPlayerDeath();
      player.currentHp = 0;
      expect(system.checkPlayerDeath()).toBe(true);
      expect(ctx.isGameOver).toBe(true);
    });
  });

  describe('derrota definitiva', () => {
    it('registra a partida e abre a tela de Game Over com os números certos', () => {
      const { system, ctx, hud, scene } = build();
      expect(system.checkPlayerDeath()).toBe(true);

      expect(ctx.notifyPlayerDeath).toHaveBeenCalledTimes(1);
      expect(scene.physics.pause).toHaveBeenCalled();
      expect(meta.recordRun).toHaveBeenCalledWith(90, 33, false, 'story', 0);
      expect(hud.showGameOverModal).toHaveBeenCalledWith(
        { kills: 33, level: 5, timeSec: 90, mode: 'story', soulsEarned: 12, maxCombo: 0, bestCombo: 40 },
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('no História, morrer para um chefe fica registrado para a revanche', () => {
      const { system } = build({ getActiveBossId: vi.fn(() => 'azazel') });
      system.checkPlayerDeath();
      expect(meta.recordStoryDeath).toHaveBeenCalledWith('azazel');
    });

    it('o chefe é lido antes de as lutas soltarem o estado', () => {
      const order: string[] = [];
      const { system } = build({
        getActiveBossId: vi.fn(() => {
          order.push('read');
          return 'rosalin';
        }),
        notifyPlayerDeath: vi.fn(() => order.push('notify')),
      });
      system.checkPlayerDeath();
      expect(order).toEqual(['read', 'notify']);
    });

    it('no Infinito não conta morte de História', () => {
      const { system } = build({ gameMode: 'endless', getActiveBossId: vi.fn(() => 'rosalin') });
      system.checkPlayerDeath();
      expect(meta.recordStoryDeath).not.toHaveBeenCalled();
    });

    it('tentar de novo recomeça o mesmo modo e capítulo como ressurreição', () => {
      const { system, hud, scene } = build({ currentChapter: 2 });
      system.checkPlayerDeath();
      const onRetry = hud.showGameOverModal.mock.calls[0][1] as () => void;
      onRetry();
      expect(scene.scene.start).toHaveBeenCalledWith('GameScene', { mode: 'story', isRevival: true, chapter: 2 });
    });

    it('voltar ao menu encerra a cena de jogo', () => {
      const { system, hud, scene } = build();
      system.checkPlayerDeath();
      const onMenu = hud.showGameOverModal.mock.calls[0][2] as () => void;
      onMenu();
      expect(scene.scene.stop).toHaveBeenCalledWith('GameScene');
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });

    it('não processa a mesma morte duas vezes', () => {
      const { system } = build();
      system.checkPlayerDeath();
      system.checkPlayerDeath();
      expect(meta.recordRun).toHaveBeenCalledTimes(1);
    });
  });
});

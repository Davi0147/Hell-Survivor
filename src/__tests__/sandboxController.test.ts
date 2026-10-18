import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Phaser from 'phaser';
import type { Nixy } from '../entities/characters/Nixy';

vi.mock('phaser', () => {
  class MockSprite {
    public active = true;
    public visible = true;
    public x = 0;
    public y = 0;
    constructor(..._args: unknown[]) {
      void _args;
    }
    setActive(v: boolean) {
      this.active = v;
      return this;
    }
    setVisible(v: boolean) {
      this.visible = v;
      return this;
    }
    destroy() {
      this.active = false;
    }
  }
  class MockContainer {
    public active = true;
    public visible = true;
    constructor(..._args: unknown[]) {
      void _args;
    }
    setActive(v: boolean) {
      this.active = v;
      return this;
    }
    setVisible(v: boolean) {
      this.visible = v;
      return this;
    }
    destroy() {
      this.active = false;
    }
  }
  return {
    default: {
      Physics: {
        Arcade: {
          Sprite: MockSprite
        }
      },
      GameObjects: {
        Sprite: MockSprite,
        Container: MockContainer,
        Group: class MockGroup {}
      },
      Scene: class MockScene {},
      Math: {
        FloatBetween: vi.fn((min: number, max: number) => (min + max) / 2),
        Between: vi.fn((min: number, max: number) => Math.floor((min + max) / 2)),
        RND: {
          pick: vi.fn((arr: unknown[]) => arr[0])
        }
      }
    }
  };
});

const mockSoundManager = {
  playBattleMusic: vi.fn(),
  playBossMusic: vi.fn(),
  playAzazelFightMusic: vi.fn()
};

vi.mock('../systems/SoundManager', () => ({
  SoundManager: {
    getInstance: () => mockSoundManager
  }
}));

import { SandboxController, type ISandboxContext } from '../systems/SandboxController';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import { AzazelBoss, AzazelPhantomClone } from '../entities/enemies/AzazelBoss';

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

describe('SandboxController (Pacote 3 — Etapa 1)', () => {
  let mockContext: Partial<Mutable<ISandboxContext>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      gameMode: 'sandbox',
      currentChapter: 1,
      isBossFightActive: false,
      isPlayerMovementLocked: false,
      isAzazelPhase3HordeActive: false,
      player: { x: 100, y: 200 } as unknown as Nixy,
      enemiesGroup: {
        getChildren: vi.fn().mockReturnValue([])
      } as unknown as Phaser.GameObjects.Group,
      gemsGroup: {
        getChildren: vi.fn().mockReturnValue([])
      } as unknown as Phaser.GameObjects.Group,
      mapItemsGroup: {
        getChildren: vi.fn().mockReturnValue([])
      } as unknown as Phaser.GameObjects.Group,
      weapons: [],
      spawnTitanCerberus: vi.fn(),
      spawnMatriarchSuccubus: vi.fn(),
      spawnBloodBatFlock: vi.fn(),
      spawnZombieDogAt: vi.fn(),
      spawnSkullSlimeAt: vi.fn(),
      spawnMummyAt: vi.fn(),
      triggerBossEncounter: vi.fn(),
      spawnSuccubusBoss: vi.fn(),
      triggerAzazelEncounterFromAltar: vi.fn(),
      spawnAzazelBoss: vi.fn(),
      spawnGemAt: vi.fn(),
      clearCombatSpeechBubbles: vi.fn(),
      clearAzazelCrystals: vi.fn(),
      setHUDVisible: vi.fn(),
      setCameraZoom: vi.fn()
    };
  });

  describe('Toggles de Trapaça (Cheats)', () => {
    it('inicia com godMode ativo em modo sandbox e desativo em modo story', () => {
      const sandboxCtrl = new SandboxController(mockContext as unknown as ISandboxContext);
      expect(sandboxCtrl.godMode).toBe(true);
      expect(sandboxCtrl.infiniteUlt).toBe(false);
      expect(sandboxCtrl.infiniteStamina).toBe(false);
      expect(sandboxCtrl.autoSpawn).toBe(false);
      expect(sandboxCtrl.showHitboxes).toBe(false);

      const storyContext = { ...mockContext, gameMode: 'story' as const };
      const storyCtrl = new SandboxController(storyContext as unknown as ISandboxContext);
      expect(storyCtrl.godMode).toBe(false);
    });

    it('permite alternar os estados e limpa tudo no destroy()', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.godMode = true;
      ctrl.infiniteUlt = true;
      ctrl.infiniteStamina = true;
      ctrl.autoSpawn = true;
      ctrl.showHitboxes = true;

      expect(ctrl.godMode).toBe(true);
      expect(ctrl.infiniteUlt).toBe(true);
      expect(ctrl.infiniteStamina).toBe(true);
      expect(ctrl.autoSpawn).toBe(true);
      expect(ctrl.showHitboxes).toBe(true);

      ctrl.destroy();

      expect(ctrl.godMode).toBe(false);
      expect(ctrl.infiniteUlt).toBe(false);
      expect(ctrl.infiniteStamina).toBe(false);
      expect(ctrl.autoSpawn).toBe(false);
      expect(ctrl.showHitboxes).toBe(false);
    });
  });

  describe('Roteamento de Spawn de Hordas (spawnHorde)', () => {
    it('roteia titan_cerberus para spawnTitanCerberus', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('titan_cerberus', 1);
      expect(mockContext.spawnTitanCerberus).toHaveBeenCalledTimes(1);
    });

    it('roteia matriarch para spawnMatriarchSuccubus', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('matriarch', 1);
      expect(mockContext.spawnMatriarchSuccubus).toHaveBeenCalledTimes(1);
    });

    it('roteia bat para spawnBloodBatFlock com a contagem exata', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('bat', 15);
      expect(mockContext.spawnBloodBatFlock).toHaveBeenCalledWith(15);
    });

    it('roteia dog para spawnZombieDogAt chamando N vezes', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('dog', 5);
      expect(mockContext.spawnZombieDogAt).toHaveBeenCalledTimes(5);
    });

    it('roteia elite_dog para spawnZombieDogAt com flag isElite = true', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('elite_dog', 2);
      expect(mockContext.spawnZombieDogAt).toHaveBeenCalledTimes(2);
      expect(mockContext.spawnZombieDogAt).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        180,
        96,
        15,
        true,
        1.35
      );
    });

    it('roteia slime para spawnSkullSlimeAt chamando N vezes', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('slime', 3);
      expect(mockContext.spawnSkullSlimeAt).toHaveBeenCalledTimes(3);
    });

    it('roteia mummy para spawnMummyAt chamando N vezes', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnHorde('mummy', 4);
      expect(mockContext.spawnMummyAt).toHaveBeenCalledTimes(4);
    });
  });

  describe('Controle de Chefes (spawnBoss, spawnAzazel, removeBoss)', () => {
    it('spawnBoss com diálogo inicia encontro cinemático', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnBoss(true);
      expect(mockContext.currentChapter).toBe(1);
      expect(mockContext.triggerBossEncounter).toHaveBeenCalledTimes(1);
    });

    it('spawnBoss sem diálogo instancia chefe e dispara música de chefe', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnBoss(false);
      expect(mockContext.isBossFightActive).toBe(true);
      expect(mockContext.spawnSuccubusBoss).toHaveBeenCalledTimes(1);
      expect(mockSoundManager.playBossMusic).toHaveBeenCalledWith(1800);
    });

    it('spawnAzazel com diálogo aciona altar de Azazel no capítulo 2', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnAzazel(true);
      expect(mockContext.currentChapter).toBe(2);
      expect(mockContext.triggerAzazelEncounterFromAltar).toHaveBeenCalledTimes(1);
    });

    it('spawnAzazel sem diálogo aciona luta direta e música de Azazel', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnAzazel(false);
      expect(mockContext.isBossFightActive).toBe(true);
      expect(mockContext.spawnAzazelBoss).toHaveBeenCalledWith(false);
      expect(mockSoundManager.playAzazelFightMusic).toHaveBeenCalledWith(800);
    });

    it('removeBoss com restoreBattleMusic = true restaura música de batalha', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.removeBoss(true);

      expect(mockContext.isBossFightActive).toBe(false);
      expect(mockContext.isPlayerMovementLocked).toBe(false);
      expect(mockContext.isAzazelPhase3HordeActive).toBe(false);
      expect(mockContext.clearCombatSpeechBubbles).toHaveBeenCalledTimes(1);
      expect(mockContext.clearAzazelCrystals).toHaveBeenCalledTimes(1);
      expect(mockContext.setHUDVisible).toHaveBeenCalledWith(true);
      expect(mockContext.setCameraZoom).toHaveBeenCalledWith(2.0, 600);
      expect(mockSoundManager.playBattleMusic).toHaveBeenCalledWith(1500);
    });

    it('removeBoss com restoreBattleMusic = false NÃO toca música de batalha', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.removeBoss(false);

      expect(mockContext.isBossFightActive).toBe(false);
      expect(mockSoundManager.playBattleMusic).not.toHaveBeenCalled();
    });
  });

  describe('Limpeza de Inimigos (clearEnemies)', () => {
    it('com withDrops = true causa dano letal (takeDamage 999999) sem matar chefes', () => {
      const normalEnemy1 = { active: true, isDead: false, takeDamage: vi.fn() };
      const normalEnemy2 = { active: true, isDead: false, takeDamage: vi.fn() };
      const succubusBoss = Object.create(SuccubusBoss.prototype);
      succubusBoss.active = true;
      succubusBoss.isDead = false;
      succubusBoss.takeDamage = vi.fn();
      mockContext.bossInstance = succubusBoss as unknown as SuccubusBoss;

      const azazelBoss = Object.create(AzazelBoss.prototype);
      azazelBoss.active = true;
      azazelBoss.isDead = false;
      azazelBoss.takeDamage = vi.fn();
      mockContext.azazelBoss = azazelBoss as unknown as AzazelBoss;

      const clone = Object.create(AzazelPhantomClone.prototype);
      clone.active = true;
      clone.isDead = false;
      clone.takeDamage = vi.fn();

      mockContext.enemiesGroup = {
        getChildren: vi.fn().mockReturnValue([normalEnemy1, normalEnemy2, succubusBoss, azazelBoss, clone])
      } as unknown as Phaser.GameObjects.Group;

      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      const clearedCount = ctrl.clearEnemies(true);

      expect(clearedCount).toBe(2);
      expect(normalEnemy1.takeDamage).toHaveBeenCalledWith(999999);
      expect(normalEnemy2.takeDamage).toHaveBeenCalledWith(999999);
      expect(succubusBoss.takeDamage).not.toHaveBeenCalled();
      expect(azazelBoss.takeDamage).not.toHaveBeenCalled();
      expect(clone.takeDamage).not.toHaveBeenCalled();
    });

    it('com withDrops = false desativa diretamente o inimigo sem gerar drops', () => {
      const body = { enable: true };
      const enemy = {
        active: true,
        isDead: false,
        body,
        setActive: vi.fn(),
        setVisible: vi.fn(),
        takeDamage: vi.fn()
      };
      mockContext.enemiesGroup = {
        getChildren: vi.fn().mockReturnValue([enemy])
      } as unknown as Phaser.GameObjects.Group;

      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      const count = ctrl.clearEnemies(false);

      expect(count).toBe(1);
      expect(enemy.isDead).toBe(true);
      expect(body.enable).toBe(false);
      expect(enemy.setActive).toHaveBeenCalledWith(false);
      expect(enemy.setVisible).toHaveBeenCalledWith(false);
      expect(enemy.takeDamage).not.toHaveBeenCalled();
    });
  });

  describe('Armas e Coletáveis (removeWeapon, spawnGemShower, clearItemsAndGems)', () => {
    class DummyWeapon {
      public name = 'Dummy';
      public destroy = vi.fn();
      public projectilesGroup = {
        clear: vi.fn()
      };
    }

    it('removeWeapon remove a arma da lista e limpa seus projéteis', () => {
      const weaponInstance = new DummyWeapon();
      mockContext.weapons = [weaponInstance];

      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.removeWeapon(DummyWeapon);

      expect(weaponInstance.destroy).toHaveBeenCalledTimes(1);
      expect(weaponInstance.projectilesGroup.clear).toHaveBeenCalledWith(true, true);
      expect(mockContext.weapons?.length).toBe(0);
    });

    it('spawnGemShower gera quantidade solicitada de gemas', () => {
      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.spawnGemShower(10);
      expect(mockContext.spawnGemAt).toHaveBeenCalledTimes(10);
    });

    it('clearItemsAndGems desativa gemas e destrói itens do chão', () => {
      const gem = {
        active: true,
        setActive: vi.fn(),
        setVisible: vi.fn(),
        body: { enable: true }
      };
      const item = {
        active: true,
        destroy: vi.fn()
      };

      mockContext.gemsGroup = {
        getChildren: vi.fn().mockReturnValue([gem])
      } as unknown as Phaser.GameObjects.Group;
      mockContext.mapItemsGroup = {
        getChildren: vi.fn().mockReturnValue([item])
      } as unknown as Phaser.GameObjects.Group;

      const ctrl = new SandboxController(mockContext as unknown as ISandboxContext);
      ctrl.clearItemsAndGems();

      expect(gem.setActive).toHaveBeenCalledWith(false);
      expect(gem.setVisible).toHaveBeenCalledWith(false);
      expect(gem.body.enable).toBe(false);
      expect(item.destroy).toHaveBeenCalledTimes(1);
    });
  });
});

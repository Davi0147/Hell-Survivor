import Phaser from 'phaser';
import type { Nixy } from '../entities/characters/Nixy';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import { AzazelBoss, AzazelPhantomClone } from '../entities/enemies/AzazelBoss';
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { MapItem } from '../entities/items/MapItem';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';

export type HordeEnemyType = 'dog' | 'elite_dog' | 'bat' | 'slime' | 'mummy' | 'titan_cerberus' | 'matriarch';

/**
 * Interface estrita de ponte entre o SandboxController e a GameScene.
 * Define apenas os serviços e propriedades de cena estritamente necessários para os testes do F1.
 */
export interface ISandboxContext {
  // Entidades e grupos
  readonly player: Nixy;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gemsGroup: Phaser.GameObjects.Group;
  readonly mapItemsGroup: Phaser.GameObjects.Group;
  readonly weapons: Array<{
    name?: string;
    destroy?: () => void;
    projectilesGroup?: { clear: (destroy: boolean, remove: boolean) => void };
  }>;

  // Estado da cena e chefes
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  currentChapter: number;
  isBossFightActive: boolean;
  isPlayerMovementLocked: boolean;
  isAzazelPhase3HordeActive: boolean;
  bossInstance?: SuccubusBoss;
  azazelBoss?: AzazelBoss;

  // Spawners de monstros e chefes
  spawnTitanCerberus(): void;
  spawnMatriarchSuccubus(): void;
  spawnBloodBatFlock(count: number): void;
  spawnZombieDogAt(sx: number, sy: number, hp?: number, speed?: number, dmg?: number, isElite?: boolean, scale?: number): void;
  spawnSkullSlimeAt(sx: number, sy: number): void;
  spawnMummyAt(sx: number, sy: number, hp?: number, speed?: number, dmg?: number): void;
  triggerBossEncounter(): void;
  spawnSuccubusBoss(isIntroDialogue?: boolean, isStaticIntro?: boolean): void;
  triggerAzazelEncounterFromAltar(): void;
  spawnAzazelBoss(isIntroOnly?: boolean): void;

  // Spawner de coletáveis
  spawnGemAt(x: number, y: number, type: GemType): void;

  // Limpeza e efeitos visuais
  clearCombatSpeechBubbles(): void;
  clearAzazelCrystals(): void;
  setHUDVisible(visible: boolean): void;
  setCameraZoom(zoom: number, duration?: number): void;

  // Altar de invocação
  activateBossSummonAltar?(): void;
}

/**
 * Controlador de testes e cheats extraído da GameScene (Pacote 3 — Etapa 1).
 * Gerencia estados de invencibilidade, geração manual de hordas, controle de chefes e limpeza de entidades.
 */
export class SandboxController {
  private context: ISandboxContext;

  public godMode: boolean = false;
  public infiniteUlt: boolean = false;
  public infiniteStamina: boolean = false;
  public autoSpawn: boolean = false;
  public showHitboxes: boolean = false;

  constructor(context: ISandboxContext) {
    this.context = context;
    this.godMode = context.gameMode === 'sandbox';
  }

  public spawnHorde(type: HordeEnemyType, count: number = 1): void {
    DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Spawn manual de horda: ${count}x ${type}`);

    if (type === 'titan_cerberus') {
      this.context.spawnTitanCerberus();
      return;
    }
    if (type === 'matriarch') {
      this.context.spawnMatriarchSuccubus();
      return;
    }
    if (type === 'bat') {
      this.context.spawnBloodBatFlock(count);
      return;
    }

    const p = this.context.player;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / Math.max(1, count) + Phaser.Math.FloatBetween(-0.15, 0.15);
      const dist = Phaser.Math.Between(220, 320);
      const sx = p.x + Math.cos(angle) * dist;
      const sy = p.y + Math.sin(angle) * dist;

      if (type === 'dog') {
        this.context.spawnZombieDogAt(sx, sy, 35, 85, 9);
      } else if (type === 'elite_dog') {
        this.context.spawnZombieDogAt(sx, sy, 180, 96, 15, true, 1.35);
      } else if (type === 'slime') {
        this.context.spawnSkullSlimeAt(sx, sy);
      } else if (type === 'mummy') {
        this.context.spawnMummyAt(sx, sy, 130, 58, 15);
      }
    }
  }

  public spawnBoss(withIntroDialogue: boolean): void {
    this.removeBoss(false);

    DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Boss Succubus invocada via Sandbox (Com Diálogo: ${withIntroDialogue})`);

    if (withIntroDialogue) {
      this.context.currentChapter = 1;
      this.context.triggerBossEncounter();
    } else {
      this.context.isBossFightActive = true;
      SoundManager.getInstance().playBossMusic(1800);
      this.context.spawnSuccubusBoss();
    }
  }

  public spawnAzazel(withIntroDialogue: boolean): void {
    this.removeBoss(false);
    this.context.currentChapter = 2;

    DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Boss Azazel invocado via Sandbox (Com Diálogo/Intro: ${withIntroDialogue})`);

    if (withIntroDialogue) {
      this.context.triggerAzazelEncounterFromAltar();
    } else {
      this.context.isBossFightActive = true;
      SoundManager.getInstance().playAzazelFightMusic(800);
      this.context.spawnAzazelBoss(false);
    }
  }

  public forceAzazelPhase2(): void {
    if (!this.context.azazelBoss || !this.context.azazelBoss.active || this.context.azazelBoss.isDead) {
      this.spawnAzazel(false);
    }
    const boss = this.context.azazelBoss;
    if (boss && !boss.isDead) {
      boss.hp = Math.ceil(boss.maxHp * 0.50);
      boss.triggerPhase2DarknessDomain(this.context.player);
    }
  }

  public forceAzazelPhase3(): void {
    if (!this.context.azazelBoss || !this.context.azazelBoss.active || this.context.azazelBoss.isDead) {
      this.spawnAzazel(false);
    }
    const boss = this.context.azazelBoss;
    if (boss && !boss.isDead) {
      boss.hp = Math.ceil(boss.maxHp * 0.20);
      boss.triggerPhase3CorruptedDimension(this.context.player);
    }
  }

  public removeBoss(restoreBattleMusic: boolean = true): void {
    this.context.isBossFightActive = false;
    this.context.isPlayerMovementLocked = false;
    this.context.isAzazelPhase3HordeActive = false;
    this.context.clearCombatSpeechBubbles();
    this.context.clearAzazelCrystals();
    this.context.setHUDVisible(true);

    if (this.context.bossInstance) {
      if (this.context.bossInstance.projectilesGroup) {
        this.context.bossInstance.projectilesGroup.clear(true, true);
      }
      this.context.bossInstance.setActive(false);
      this.context.bossInstance.setVisible(false);
      this.context.bossInstance.destroy();
      this.context.bossInstance = undefined;
    }

    if (this.context.azazelBoss) {
      this.context.azazelBoss.die();
      this.context.azazelBoss.destroy();
      this.context.azazelBoss = undefined;
    }

    if (this.context.enemiesGroup) {
      const enemies = this.context.enemiesGroup.getChildren() as BaseEnemy[];
      for (const e of enemies) {
        if ((e instanceof SuccubusBoss || e instanceof AzazelBoss || e instanceof AzazelPhantomClone) && e.active) {
          if ('projectilesGroup' in e) {
            const pGroup = (e as { projectilesGroup?: Phaser.GameObjects.Group }).projectilesGroup;
            if (pGroup) {
              pGroup.clear(true, true);
            }
          }
          e.setActive(false);
          e.setVisible(false);
          e.destroy();
        }
      }
    }

    this.context.setCameraZoom(2.0, 600);
    if (restoreBattleMusic) {
      SoundManager.getInstance().playBattleMusic(1500);
    }
    DebugSessionLogger.getInstance().log(
      'BOSS',
      'INFO',
      `Boss removido via Sandbox${restoreBattleMusic ? ' e música restaurada.' : '.'}`
    );
  }

  public clearEnemies(withDrops: boolean): number {
    let count = 0;
    if (!this.context.enemiesGroup) return 0;
    const enemies = [...(this.context.enemiesGroup.getChildren() as BaseEnemy[])];

    for (const e of enemies) {
      if (!e.active || e.isDead) continue;
      if (e === this.context.bossInstance || e === this.context.azazelBoss || e instanceof AzazelPhantomClone) continue;
      count++;
      if (withDrops) {
        e.takeDamage(999999);
      } else {
        e.isDead = true;
        if (e.body) {
          (e.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        e.setActive(false);
        e.setVisible(false);
      }
    }

    DebugSessionLogger.getInstance().log(
      'SANDBOX',
      'INFO',
      `Limpeza de inimigos executada: ${count} monstros (${withDrops ? 'com drop' : 'sem drop'})`
    );
    return count;
  }

  public removeWeapon(weaponClass: abstract new (...args: never[]) => unknown): void {
    const idx = this.context.weapons.findIndex((w) => w instanceof weaponClass);
    if (idx === -1) return;

    const removed = this.context.weapons[idx];
    if (typeof removed.destroy === 'function') {
      removed.destroy();
    }
    if (removed.projectilesGroup && typeof removed.projectilesGroup.clear === 'function') {
      removed.projectilesGroup.clear(true, true);
    }
    this.context.weapons.splice(idx, 1);
    DebugSessionLogger.getInstance().log('WEAPON', 'INFO', `Arma removida via Sandbox: ${removed.name ?? 'Desconhecida'}`);
  }

  public spawnGemShower(count: number = 20): void {
    const types: GemType[] = ['green', 'blue', 'red', 'orange', 'purple'];
    const p = this.context.player;
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(55, 180);
      const gx = p.x + Math.cos(angle) * dist;
      const gy = p.y + Math.sin(angle) * dist;
      const gType = Phaser.Math.RND.pick(types);
      this.context.spawnGemAt(gx, gy, gType);
    }
    DebugSessionLogger.getInstance().log('ITEM', 'INFO', `Chuva de ${count} gemas de XP gerada via Sandbox.`);
  }

  public clearItemsAndGems(): void {
    if (this.context.gemsGroup) {
      const gems = this.context.gemsGroup.getChildren() as SoulGem[];
      for (const g of gems) {
        if (g.active) {
          g.setActive(false);
          g.setVisible(false);
          if (g.body) (g.body as Phaser.Physics.Arcade.Body).enable = false;
        }
      }
    }

    if (this.context.mapItemsGroup) {
      const items = [...(this.context.mapItemsGroup.getChildren() as MapItem[])];
      for (const it of items) {
        if (it.active) {
          it.destroy();
        }
      }
    }
    DebugSessionLogger.getInstance().log('ITEM', 'INFO', 'Todos os itens e gemas do chão foram limpos via Sandbox.');
  }

  public destroy(): void {
    this.godMode = false;
    this.infiniteUlt = false;
    this.infiniteStamina = false;
    this.autoSpawn = false;
    this.showHitboxes = false;
  }
}

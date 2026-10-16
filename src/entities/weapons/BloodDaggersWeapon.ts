import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { BloodDaggerProjectile } from './BloodDaggerProjectile';
import { BaseCharacter } from '../characters/BaseCharacter';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { Direction8 } from '../../config/balance';
import { SoundManager } from '../../systems/SoundManager';

export class BloodDaggersWeapon extends BaseWeapon {
  public projectilesGroup: Phaser.GameObjects.Group;
  private player: BaseCharacter;
  private level: number = 1;
  private readonly maxLevel: number = 5;

  constructor(scene: Phaser.Scene, player: BaseCharacter) {
    super(
      scene,
      'Adagas de Sangue',
      15,   // Dano base por adaga
      760,  // Cooldown inicial em ms
      340,  // Alcance
      540,  // Velocidade alta do arremesso
      3,    // Começa disparando um leque de 3 adagas
      1     // Perfuração inicial
    );
    this.player = player;

    this.projectilesGroup = scene.add.group({
      classType: BloodDaggerProjectile,
      maxSize: 90,
      runChildUpdate: false
    });

    // Registra overlap físico automaticamente com o grupo de inimigos da cena
    const gs = scene as any;
    if (gs.enemiesGroup && scene.physics) {
      scene.physics.add.overlap(
        this.projectilesGroup,
        gs.enemiesGroup,
        (projObj, enemyObj) => {
          const proj = projObj as BloodDaggerProjectile;
          const enemy = enemyObj as BaseEnemy;
          if (proj.active && enemy.active && !enemy.isDead) {
            SoundManager.getInstance().playEnemyHit();
            proj.onHit(enemy);
            this.player.triggerLifeSteal(1);
          }
        }
      );
    }
  }

  private directionToAngle(dir: Direction8): number {
    switch (dir) {
      case 'east': return 0;
      case 'south-east': return Math.PI * 0.25;
      case 'south': return Math.PI * 0.5;
      case 'south-west': return Math.PI * 0.75;
      case 'west': return Math.PI;
      case 'north-west': return -Math.PI * 0.75;
      case 'north': return -Math.PI * 0.5;
      case 'north-east': return -Math.PI * 0.25;
      default: return 0;
    }
  }

  public fire(originX: number, originY: number, target?: BaseEnemy): void {
    // Prioriza a direção para onde a Nixy está se movendo; se estiver parada e houver alvo próximo, mira nele
    let baseAngle = this.directionToAngle(this.player.currentDirection);
    if (!this.player.isMoving && target) {
      baseAngle = Math.atan2(target.y - originY, target.x - originX);
    }

    const extraCount = this.player.extraProjectiles;
    const totalDaggers = this.projectileCount + extraCount;
    const spreadStep = 0.15; // Ângulo fechado e letal do leque de adagas
    const startAngle = baseAngle - ((totalDaggers - 1) * spreadStep) / 2;

    const effectiveDamage = Math.round(this.damage * (1 + this.player.bonusDamagePercent / 100));
    const effectivePierce = this.pierce + this.player.extraPierce;

    for (let i = 0; i < totalDaggers; i++) {
      const angle = startAngle + i * spreadStep;

      let dagger = this.projectilesGroup.getFirstDead(false) as BloodDaggerProjectile;
      if (!dagger) {
        dagger = new BloodDaggerProjectile(this.scene, originX, originY);
        this.projectilesGroup.add(dagger);
      }

      dagger.fire(
        originX,
        originY,
        angle,
        this.projectileSpeed,
        effectiveDamage,
        effectivePierce
      );
    }

    SoundManager.getInstance().playBloodDaggerThrow();
  }

  public updateWeapon(
    deltaMs: number,
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    if (this.currentCooldown > 0) {
      this.currentCooldown -= deltaMs;
    }

    if (this.currentCooldown <= 0) {
      const closest = this.findClosestEnemy(originX, originY, enemies);
      // Dispara sempre que houver inimigos visíveis na tela
      if (closest || enemies.countActive() > 0) {
        this.fire(originX, originY, closest ?? undefined);
        this.currentCooldown = this.cooldownMs;
      }
    }

    const activeDaggers = this.projectilesGroup.getChildren() as BloodDaggerProjectile[];
    for (let i = 0; i < activeDaggers.length; i++) {
      const d = activeDaggers[i];
      if (d.active) {
        d.updateProjectile(deltaMs);
      }
    }
  }

  public upgrade(): boolean {
    if (this.level >= this.maxLevel) return false;
    this.level++;
    this.projectileCount += 1; // +1 adaga no leque por nível (de 3 até 7)
    this.damage += 4;
    this.cooldownMs = Math.max(480, this.cooldownMs - 45);
    if (this.level === 3 || this.level === 5) {
      this.pierce += 1;
    }
    return true;
  }

  public getLevel(): number {
    return this.level;
  }

  public isMaxLevel(): boolean {
    return this.level >= this.maxLevel;
  }

  public isEvolved: boolean = false;

  public evolve(): void {
    if (this.isEvolved) return;
    this.isEvolved = true;
    this.name = 'Chuva de Sangue Carmesim';
    this.projectileCount = 8;
    this.damage = 38;
    this.cooldownMs = 420;
    this.pierce = 3;
    SoundManager.getInstance().playWeaponEvolve();
  }
}

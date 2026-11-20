import Phaser from 'phaser';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import { ENEMY_BALANCE } from '../config/balance';
import { FX_COLORS } from '../config/theme';

export const ENEMY_ARROW_TEXTURE = 'enemy-arrow';

/** Flecha inimiga: imagem simples movida à mão (sem corpo físico, mais leve no celular). */
class EnemyArrow extends Phaser.GameObjects.Image {
  public vx = 0;
  public vy = 0;
  public lifeMs = 0;
  public damage = 0;
}

/**
 * Flechas disparadas por monstros (Arqueira Demônia). Um pool por partida, atualizado pela GameScene.
 * O dano passa por `takeDamage` da heroína, que já ignora a esquiva e o modo deus; durante a
 * esquiva a flecha atravessa sem sumir.
 */
export class EnemyArrowSystem {
  private readonly arrows: EnemyArrow[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly getPlayer: () => BaseCharacter | undefined
  ) {
    EnemyArrowSystem.ensureTexture(scene);
  }

  /** Flecha desenhada por código (plano B até existir arte própria). */
  public static ensureTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists(ENEMY_ARROW_TEXTURE)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(FX_COLORS.archerArrowGlow, 0.35);
    g.fillRect(2, 3, 26, 4);
    g.fillStyle(FX_COLORS.archerArrowShaft, 1);
    g.fillRect(4, 4, 20, 2);
    g.fillStyle(FX_COLORS.archerArrowHead, 1);
    g.fillTriangle(24, 1, 31, 5, 24, 9);
    g.fillStyle(FX_COLORS.archerArrowFletch, 1);
    g.fillTriangle(0, 1, 6, 5, 0, 9);
    g.generateTexture(ENEMY_ARROW_TEXTURE, 32, 10);
    g.destroy();
  }

  public fire(x: number, y: number, angle: number, damage: number): void {
    const cfg = ENEMY_BALANCE.archer.arrow;
    let arrow = this.arrows.find((a) => !a.active);
    if (!arrow) {
      arrow = new EnemyArrow(this.scene, x, y, ENEMY_ARROW_TEXTURE);
      this.scene.add.existing(arrow);
      arrow.setDepth(26);
      this.arrows.push(arrow);
    }
    arrow.setPosition(x, y).setRotation(angle).setActive(true).setVisible(true);
    arrow.vx = Math.cos(angle) * cfg.speed;
    arrow.vy = Math.sin(angle) * cfg.speed;
    arrow.lifeMs = cfg.lifespanMs;
    arrow.damage = damage;
  }

  public update(deltaMs: number): void {
    const player = this.getPlayer();
    const r = ENEMY_BALANCE.archer.arrow.hitRadius;
    const dt = deltaMs / 1000;
    for (const a of this.arrows) {
      if (!a.active) continue;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.lifeMs -= deltaMs;
      if (a.lifeMs <= 0) {
        this.release(a);
        continue;
      }
      if (!player || !player.active || player.isDashInvulnerable) continue;
      if (Math.hypot(a.x - player.x, a.y - player.y) <= r) {
        player.takeDamage(a.damage);
        this.scene.cameras.main.shake(90, 0.005);
        this.release(a);
      }
    }
  }

  public clear(): void {
    for (const a of this.arrows) this.release(a);
  }

  public destroy(): void {
    for (const a of this.arrows) a.destroy();
    this.arrows.length = 0;
  }

  public get activeCount(): number {
    return this.arrows.filter((a) => a.active).length;
  }

  private release(a: EnemyArrow): void {
    a.setActive(false).setVisible(false);
  }
}

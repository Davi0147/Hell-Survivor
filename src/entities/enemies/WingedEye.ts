import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { ENEMY_BALANCE } from '../../config/balance';
import { WINGED_EYE_ANIM, WINGED_EYE_TEXTURE } from '../../systems/Chapter3EnemyAssets';

/** Caixa de colisão (px do quadro, antes da escala): só o globo do olho, sem as asas. */
const BODY_SIZE = 26;

/**
 * Olho Alado (Capítulo 3): olho pequeno com asas que voa rápido direto na heroína e bate
 * encostando (dano de contato, como os outros monstros). Voa balançando para cima e para baixo.
 * A arte só tem o voo para a direita; indo para a esquerda o sprite é espelhado.
 */
export class WingedEye extends BaseEnemy {
  private bobClock = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, WINGED_EYE_TEXTURE);
    this.setDepth(9);
    this.fitBody();
  }

  public override spawn(x: number, y: number, hp: number, speed: number, damage: number): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(ENEMY_BALANCE.wingedEye.scale);
    this.bobClock = Math.random() * 1000;
    if (this.scene.anims.exists(WINGED_EYE_ANIM)) this.play(WINGED_EYE_ANIM, true);
    this.fitBody();
  }

  private fitBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(BODY_SIZE, BODY_SIZE, false);
    body.setOffset((this.width - BODY_SIZE) / 2, (this.height - BODY_SIZE) / 2);
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.clearTint();
    }
    const stunMult = this.updateStunState(deltaMs);

    const cfg = ENEMY_BALANCE.wingedEye;
    this.bobClock += deltaMs;
    const dx = targetX - this.x;
    // Mira um pouco acima/abaixo do alvo, balançando: parece voo, não um projétil reto
    const dy = targetY - this.y + Math.sin(this.bobClock * cfg.bobPerMs) * cfg.bobPx * 4;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      this.setVelocity((dx / dist) * this.speed * stunMult, (dy / dist) * this.speed * stunMult);
      if (Math.abs(dx) > 2) this.setFlipX(dx < 0);
    } else {
      this.setVelocity(0, 0);
    }
  }
}

import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { Nixy } from '../characters/Nixy';
import { DamageTextSystem } from '../../systems/DamageTextSystem';
import { GemType } from '../items/SoulGem';

type SlimeState = 'CHASE' | 'TELEGRAPH' | 'DASH' | 'EXPLODED';

export class SkullSlime extends BaseEnemy {
  private currentDir: 'east' | 'west' | 'north' | 'south' = 'south';
  private slimeState: SlimeState = 'CHASE';
  private stateTimer: number = 0;
  private dashCooldownTimer: number = 1000; // Tempo inicial até poder dar o primeiro dash

  private dashVector: { x: number; y: number } = { x: 0, y: 1 };
  private readonly BASE_SPEED = 46;
  private readonly DASH_SPEED = 300;
  private readonly DASH_TRIGGER_DIST = 135;
  private readonly EXPLOSION_RADIUS = 52;
  private readonly DASH_IMPACT_DAMAGE = 14;
  private readonly EXPLOSION_DAMAGE = 22;

  public customDrop?: GemType;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'skull-slime-idle-south');

    // Ajuste da caixa de colisão física (corpo 88x88 com base na lama viscosa)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(38, 32);
      body.setOffset(25, 36);
    }
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = 160,
    speed: number = 46,
    damage: number = 10,
    customDrop?: GemType
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.slimeState = 'CHASE';
    this.stateTimer = 0;
    this.dashCooldownTimer = 1200;
    this.customDrop = customDrop;
    this.setScale(1);
    this.clearTint();
    this.play('skull-slime-idle-south', true);
  }

  public updateSlime(player: Nixy, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Gerenciar duração do flash branco de hit
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        if (this.slimeState === 'TELEGRAPH') {
          this.setTint(0x70e000);
        } else {
          this.clearTint();
        }
      }
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= deltaMs;
    }

    // ==========================================
    // MÁQUINA DE ESTADOS DO SKULL SLIME
    // ==========================================
    switch (this.slimeState) {
      case 'CHASE': {
        // Movimentação lenta e tanque em direção à heroína
        if (dist > 8) {
          const vx = (dx / dist) * this.BASE_SPEED;
          const vy = (dy / dist) * this.BASE_SPEED;
          this.setVelocity(vx, vy);

          const absX = Math.abs(dx);
          const absY = Math.abs(dy);
          let dir: 'east' | 'west' | 'north' | 'south' = 'south';

          if (absX > absY) {
            dir = dx > 0 ? 'east' : 'west';
          } else {
            dir = dy > 0 ? 'south' : 'north';
          }

          this.currentDir = dir;
          const runAnim = `skull-slime-run-${dir}`;
          if (this.anims.currentAnim?.key !== runAnim) {
            this.play(runAnim, true);
          }
        } else {
          this.setVelocity(0, 0);
          const idleAnim = `skull-slime-idle-${this.currentDir}`;
          if (this.anims.currentAnim?.key !== idleAnim) {
            this.play(idleAnim, true);
          }
        }

        // Se estiver perto o suficiente (<= 135px) e fora de cooldown, inicia o preparo do bote suicida
        if (dist <= this.DASH_TRIGGER_DIST && this.dashCooldownTimer <= 0 && !player.isRooted) {
          this.slimeState = 'TELEGRAPH';
          this.stateTimer = 340; // 340ms de tensão e contração da gosma
          this.setVelocity(0, 0);
          this.setTint(0x70e000); // Brilho ácido pré-bote
          this.dashVector = {
            x: dist > 0 ? dx / dist : 1,
            y: dist > 0 ? dy / dist : 0
          };
          this.emitAcidBubble(this.x, this.y);
        }
        break;
      }

      case 'TELEGRAPH': {
        this.setVelocity(0, 0);
        this.stateTimer -= deltaMs;

        // Efeito de pulso/squash
        const squash = 1.0 + Math.sin(this.stateTimer * 0.03) * 0.15;
        this.setScale(squash, 2 - squash);

        if (this.stateTimer <= 0) {
          // Entra em DASH veloz kamikaze
          this.slimeState = 'DASH';
          this.stateTimer = 500; // Duração máxima do bote
          this.setScale(1);
          this.setTint(0x9ef01a);
          this.setVelocity(
            this.dashVector.x * this.DASH_SPEED,
            this.dashVector.y * this.DASH_SPEED
          );
        }
        break;
      }

      case 'DASH': {
        this.stateTimer -= deltaMs;

        // Emite rastro de gosma verde contínuo
        if (Math.random() < 0.4) {
          this.emitAcidBubble(this.x, this.y);
        }

        // Verifica colisão imediata com o jogador durante o dash
        if (dist <= 30) {
          // ACERTOU O JOGADOR!
          // 1. Causa dano de impacto
          player.takeDamage(this.DASH_IMPACT_DAMAGE);

          // 2. Prende Nixy por 1 segundo (Root + Sprite Verde)
          player.applyAcidRoot(1000);

          // 3. Detona a explosão ácida massiva e se elimina
          this.detonateAcidExplosion(player, true);
          return;
        }

        // Se o tempo do dash esgotou sem colidir (jogador esquivou)
        if (this.stateTimer <= 0) {
          this.detonateAcidExplosion(player, dist <= this.EXPLOSION_RADIUS);
        }
        break;
      }

      case 'EXPLODED':
        break;
    }
  }

  /**
   * Detona a explosão ácida de ácido cáustico e estilhaços de crânio
   */
  private detonateAcidExplosion(player: Nixy, hitsPlayer: boolean): void {
    if (this.slimeState === 'EXPLODED' || this.isDead) return;
    this.slimeState = 'EXPLODED';
    this.setVelocity(0, 0);

    // Se a explosão atingir a heroína
    if (hitsPlayer) {
      player.takeDamage(this.EXPLOSION_DAMAGE);
    }

    // Efeito visual de onda de choque ácida
    const wave = this.scene.add.graphics();
    wave.setDepth(18);
    const originX = this.x;
    const originY = this.y;

    this.scene.tweens.addCounter({
      from: 8,
      to: this.EXPLOSION_RADIUS,
      duration: 260,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const rad = tween.getValue() ?? 8;
        const alpha = Math.max(0, 1 - (rad / this.EXPLOSION_RADIUS));
        wave.clear();
        wave.fillStyle(0x70e000, alpha * 0.45);
        wave.fillCircle(originX, originY, rad);
        wave.lineStyle(2, 0xd8f3dc, alpha);
        wave.strokeCircle(originX, originY, rad);
      },
      onComplete: () => {
        wave.destroy();
      }
    });

    // Partículas de respingo de ácido
    for (let i = 0; i < 8; i++) {
      this.emitAcidBubble(originX, originY, true);
    }

    this.scene.cameras.main.shake(200, 0.012);

    // Elimina o Skull Slime no processo
    this.die();
  }

  private emitAcidBubble(x: number, y: number, isExplosion: boolean = false): void {
    const bubble = this.scene.add.image(x, y, 'particle-spark');
    bubble.setDepth(20);
    bubble.setTint(Phaser.Math.RND.pick([0x70e000, 0x38b000, 0x9ef01a, 0xccff33]));
    bubble.setScale(isExplosion ? 1.6 : 0.9);

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = isExplosion ? Phaser.Math.Between(15, 45) : Phaser.Math.Between(6, 16);

    this.scene.tweens.add({
      targets: bubble,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: 0,
      scale: 0.1,
      duration: isExplosion ? 300 : 200,
      ease: 'Quad.easeOut',
      onComplete: () => bubble.destroy()
    });
  }
}

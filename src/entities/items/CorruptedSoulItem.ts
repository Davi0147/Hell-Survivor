import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';
import { MetaProgressManager } from '../../systems/MetaProgressManager';

export class CorruptedSoulItem extends Phaser.Physics.Arcade.Sprite {
  public soulValue: number = 1;
  public isAttracted: boolean = false;

  private attractSpeed: number = 240;
  private bobTimer: number = 0;
  private baseY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'item-soul');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(7);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(12, 8, 8);
    }
  }

  public spawn(x: number, y: number, value: number = 1): void {
    this.setPosition(x, y);
    this.baseY = y;
    this.soulValue = value;
    this.isAttracted = false;
    this.attractSpeed = 240;
    this.bobTimer = Math.random() * Math.PI * 2;

    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(0.85); // 40x40 -> ~34x34px

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
  }

  public updateSoul(player: BaseCharacter, deltaMs: number): void {
    if (!this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (!this.isAttracted) {
      // Efeito místico de flutuação e pulso sutil de aura
      this.bobTimer += deltaMs * 0.006;
      this.y = this.baseY + Math.sin(this.bobTimer) * 4;

      if (dist <= player.effectivePickupRadius) {
        this.isAttracted = true;
      }
    } else {
      // Movimento acelerado de atração magnética até a Nixy
      this.attractSpeed += deltaMs * 1.4;
      const angle = Math.atan2(dy, dx);
      const moveStep = this.attractSpeed * (deltaMs / 1000);

      this.x += Math.cos(angle) * moveStep;
      this.y += Math.sin(angle) * moveStep;

      if (dist < 18) {
        this.collect(player);
      }
    }
  }

  public collect(player: BaseCharacter): void {
    if (!this.active) return;

    // Registra na economia da partida atual
    MetaProgressManager.getInstance().collectRunSoul(this.soulValue);
    SoundManager.getInstance().playCardHover();

    // Texto flutuante violeta místico indicando a alma coletada
    this.showSoulPickupText();

    // Emite partículas arcanas de coleta
    this.emitPickupParticles();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
    this.setActive(false);
    this.setVisible(false);
    this.destroy();
  }

  private showSoulPickupText(): void {
    const txt = this.scene.add.text(
      this.x,
      this.y - 15,
      this.soulValue > 1 ? `+${this.soulValue} Almas` : '+1 Alma',
      {
        fontFamily: 'Pixelzone, Silkscreen, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#c084fc',
        stroke: '#240046',
        strokeThickness: 3.5,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#3c096c',
          blur: 6,
          stroke: true,
          fill: true
        }
      }
    ).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 25,
      alpha: 0,
      scale: 1.1,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy()
    });
  }

  private emitPickupParticles(): void {
    for (let i = 0; i < 4; i++) {
      const p = this.scene.add.circle(this.x, this.y, Phaser.Math.Between(2, 3), 0x9d4edd, 0.9);
      p.setDepth(190);
      p.setBlendMode(Phaser.BlendModes.ADD);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(20, 60);

      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }
}

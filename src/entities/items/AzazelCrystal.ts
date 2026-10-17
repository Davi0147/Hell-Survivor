import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';

export class AzazelCrystal extends Phaser.GameObjects.Container {
  public progress: number = 0; // 0 a 100% (5 segundos = +20%/s)
  public readonly captureRadius: number = 78;
  public isCompleted: boolean = false;
  public isDestroyed: boolean = false;

  private crystalSprite: Phaser.GameObjects.Image;
  private glowSprite?: Phaser.GameObjects.Image;
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private pulseTimer: number = 0;
  private particleTimer: number = 0;
  private lastMilestoneStage: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(9);

    // 1. Círculo Rúnico de Purificação no Chão (igual ao Altar de Evolução)
    this.zoneGraphics = scene.add.graphics();
    this.add(this.zoneGraphics);

    // 2. Halo de Brilho sob o Cristal
    if (scene.textures.exists('torch-light')) {
      this.glowSprite = scene.add.image(0, 0, 'torch-light');
      this.glowSprite.setTint(0xff0055);
      this.glowSprite.setAlpha(0.5);
      this.glowSprite.setScale(0.95);
      this.glowSprite.setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.glowSprite);
    }

    // 3. Sprite Oficial do Cristal de Azazel (CristalAzazel.png)
    const texKey = scene.textures.exists('azazel-crystal') ? 'azazel-crystal' : 'scenery-cristal';
    this.crystalSprite = scene.add.image(0, -6, texKey);
    const maxDim = Math.max(this.crystalSprite.width || 80, this.crystalSprite.height || 80);
    const targetSize = 86;
    this.crystalSprite.setScale(targetSize / maxDim);
    this.add(this.crystalSprite);

    // Leve flutuação mística contínua
    scene.tweens.add({
      targets: this.crystalSprite,
      y: -14,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.drawZone(false);
  }

  public updateCrystal(player: BaseCharacter, deltaMs: number): void {
    if (this.isCompleted || this.isDestroyed || !player || !player.active) return;

    this.pulseTimer += deltaMs;
    this.particleTimer += deltaMs;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const isPlayerInside = dist <= this.captureRadius;

    // 5 segundos exatos dentro da área para 100% (20% por segundo)
    if (isPlayerInside) {
      this.progress = Math.min(100, this.progress + (deltaMs / 1000) * 20.0);
    } else {
      // Perde lentamente caso precise sair para desviar (-5% por segundo)
      this.progress = Math.max(0, this.progress - (deltaMs / 1000) * 5.0);
    }

    const milestone = Math.floor(this.progress / 25);
    if (milestone > this.lastMilestoneStage && milestone < 4) {
      this.lastMilestoneStage = milestone;
      SoundManager.getInstance().playRouletteTick(0.95 + milestone * 0.18);
    } else if (milestone < this.lastMilestoneStage) {
      this.lastMilestoneStage = milestone;
    }

    this.drawZone(isPlayerInside);

    if (isPlayerInside && this.particleTimer >= 110) {
      this.particleTimer = 0;
      this.spawnCrystalMote();
    }

    if (this.progress >= 100) {
      this.isCompleted = true;
      this.emit('crystal-completed', this);
      this.explodeAndDestroy();
    }
  }

  private drawZone(isPlayerInside: boolean): void {
    this.zoneGraphics.clear();

    // 1. Trilho de fundo fino e estático
    this.zoneGraphics.lineStyle(2.5, 0x4a0e2e, isPlayerInside ? 0.75 : 0.42);
    this.zoneGraphics.strokeCircle(0, 0, this.captureRadius);

    // 2. Círculo sendo preenchido progressivamente (igual ao Altar de Evolução)
    if (this.progress > 0) {
      const startAngle = -Math.PI / 2;
      const fraction = Math.min(1, Math.max(0, this.progress / 100));
      const endAngle = startAngle + fraction * (Math.PI * 2);

      // Preenchimento radial sutil no chão indicando a carga
      this.zoneGraphics.fillStyle(0xff0055, isPlayerInside ? 0.14 : 0.06);
      this.zoneGraphics.slice(0, 0, this.captureRadius, startAngle, endAngle, false);
      this.zoneGraphics.fillPath();

      // Brilho externo da linha circular
      this.zoneGraphics.lineStyle(6, 0xff0055, isPlayerInside ? 0.42 : 0.22);
      this.zoneGraphics.beginPath();
      this.zoneGraphics.arc(0, 0, this.captureRadius, startAngle, endAngle, false);
      this.zoneGraphics.strokePath();

      // Linha viva principal completando o círculo
      const mainColor = this.progress > 75 ? 0x00f5d4 : this.progress > 40 ? 0xff2a85 : 0xff0044;
      this.zoneGraphics.lineStyle(3.5, mainColor, isPlayerInside ? 1 : 0.85);
      this.zoneGraphics.beginPath();
      this.zoneGraphics.arc(0, 0, this.captureRadius, startAngle, endAngle, false);
      this.zoneGraphics.strokePath();
    }
  }

  private spawnCrystalMote(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(16, this.captureRadius - 6);
    const color = this.progress > 75 ? 0x00f5d4 : 0xff2a85;

    const spark = this.scene.add.circle(
      this.x + Math.cos(angle) * dist,
      this.y + Math.sin(angle) * dist,
      Phaser.Math.Between(2, 4),
      color,
      0.9
    );
    spark.setDepth(10);
    spark.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: spark,
      y: spark.y - Phaser.Math.Between(24, 46),
      alpha: 0,
      scale: 0.2,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy()
    });
  }

  public explodeAndDestroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    SoundManager.getInstance().playEnemyExplosion();
    SoundManager.getInstance().playWeaponEvolve();
    this.scene.cameras.main.shake(260, 0.014);
    this.scene.cameras.main.flash(160, 255, 40, 120);

    if (this.scene.anims.exists('anim-explosion')) {
      const exp = this.scene.add.sprite(this.x, this.y, 'explosion-1');
      exp.setDepth(20);
      exp.setScale(1.1);
      exp.setTint(0xff3388);
      exp.play('anim-explosion');
      exp.once('animationcomplete', () => exp.destroy());
    }

    for (let i = 0; i < 24; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(60, 210);
      const color = Phaser.Math.RND.pick([0xff0055, 0xff66aa, 0x00f5d4, 0xffffff]);
      const size = Phaser.Math.Between(4, 8);

      const shard = this.scene.add.rectangle(this.x, this.y, size, size, color);
      shard.setDepth(19);
      shard.setBlendMode(Phaser.BlendModes.ADD);

      this.scene.tweens.add({
        targets: shard,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        rotation: Phaser.Math.FloatBetween(2, 7),
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(280, 480),
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy()
      });
    }

    this.destroy();
  }
}

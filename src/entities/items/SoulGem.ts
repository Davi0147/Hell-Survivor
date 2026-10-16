import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';

export type GemType = 'green' | 'blue' | 'red' | 'purple' | 'gold' | 'orange';

export class SoulGem extends Phaser.Physics.Arcade.Sprite {
  public xpValue: number = 5;
  public gemType: GemType = 'green';
  public isAttracted: boolean = false;

  private attractSpeed: number = 220;
  private bobTimer: number = 0;
  private baseY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'gem-green');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(6); // Fica no chão logo acima do piso (-100) e abaixo de inimigos/heróis
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(10, 5, 5);
    }
  }

  public spawn(x: number, y: number, type: GemType = 'green'): void {
    this.setPosition(x, y);
    this.baseY = y;
    this.gemType = type;
    this.isAttracted = false;
    this.attractSpeed = 220;
    this.bobTimer = Math.random() * Math.PI * 2;

    switch (type) {
      case 'green':
        this.setTexture('gem-green');
        this.xpValue = 5;
        this.setScale(0.55); // 40px -> ~22px
        break;
      case 'blue':
        this.setTexture('gem-blue');
        this.xpValue = 20;
        this.setScale(0.65); // 40px -> ~26px
        break;
      case 'red':
      case 'orange':
        this.setTexture('gem-red');
        this.xpValue = 100;
        this.setScale(0.75); // 40px -> ~30px
        break;
      case 'purple':
        this.setTexture('gem-purple');
        this.xpValue = 250;
        this.setScale(0.85); // 40px -> ~34px
        break;
      case 'gold':
        this.setTexture('gem-gold');
        this.xpValue = 500;
        this.setScale(0.95); // 40px -> ~38px
        break;
    }

    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
  }

  /**
   * Adiciona XP cumulativo e eleva a categoria visual da gema (Fusão Anti-Lag Vampire Survivors)
   */
  public addBonusXp(bonus: number): void {
    this.xpValue += bonus;
    if (this.xpValue >= 500) {
      this.gemType = 'gold';
      this.setTexture('gem-gold');
      this.setScale(0.95);
    } else if (this.xpValue >= 250) {
      this.gemType = 'purple';
      this.setTexture('gem-purple');
      this.setScale(0.85);
    } else if (this.xpValue >= 100) {
      this.gemType = 'red';
      this.setTexture('gem-red');
      this.setScale(0.75);
    } else if (this.xpValue >= 20) {
      this.gemType = 'blue';
      this.setTexture('gem-blue');
      this.setScale(0.65);
    }
  }

  public updateGem(player: BaseCharacter, deltaMs: number): void {
    if (!this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // 1. Verificação de Atração por Ímã (Pickup Radius com multiplicadores de Bênçãos)
    if (!this.isAttracted) {
      // Efeito sutil de flutuação no ar
      this.bobTimer += deltaMs * 0.005;
      this.y = this.baseY + Math.sin(this.bobTimer) * 3;

      if (dist <= player.effectivePickupRadius) {
        this.isAttracted = true;
      }
    } else {
      // 2. Movimento Acelerado em Direção ao Jogador (Atração Magnética Suave e Precisa)
      this.attractSpeed += deltaMs * 1.25; // Acelera enquanto se aproxima
      const angle = Math.atan2(dy, dx);
      const moveStep = this.attractSpeed * (deltaMs / 1000);

      this.x += Math.cos(angle) * moveStep;
      this.y += Math.sin(angle) * moveStep;

      // 3. Absorção / Coleta ao alcançar o corpo da heroína (com tolerância ao moveStep para não ultrapassar)
      if (dist <= Math.max(28, moveStep * 1.5)) {
        this.collect(player);
      }
    }
  }

  /**
   * Força a atração imediata e em alta velocidade pelo Ímã Especial do mapa
   */
  public forceMagnetPull(): void {
    this.isAttracted = true;
    this.attractSpeed = Math.max(this.attractSpeed, 420);
  }

  public collect(player: BaseCharacter): void {
    // 1. Partículas de faísca da gema absorvida
    this.emitPickupSparkles();

    // 2. Efeito sonoro procedural de coleta de gema
    SoundManager.getInstance().playGemCollect(this.gemType);

    // 3. Concede XP e carga de Ultimate ao jogador (+25% para roxa, +50% para dourada)
    player.gainXp(this.xpValue);
    let ultGain = this.xpValue * 0.15;
    if (this.gemType === 'purple') ultGain = 25;
    else if (this.gemType === 'gold') ultGain = 50;
    player.gainUltimateCharge(ultGain);

    // 4. Desativa e retorna para a pool
    this.deactivate();
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }

  private emitPickupSparkles(): void {
    let tintColor = 0x06d6a0;
    if (this.gemType === 'blue') tintColor = 0x00f5d4;
    else if (this.gemType === 'red' || this.gemType === 'orange') tintColor = 0xff6b35;
    else if (this.gemType === 'purple') tintColor = 0xf72585;
    else if (this.gemType === 'gold') tintColor = 0xffd166;

    for (let i = 0; i < 4; i++) {
      const spark = this.scene.add.image(this.x, this.y, 'particle-spark');
      spark.setDepth(150);
      spark.setTint(tintColor);
      spark.setScale(1.2);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(10, 24);

      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
  }
}

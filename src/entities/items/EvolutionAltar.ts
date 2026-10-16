import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';

export class EvolutionAltar extends Phaser.GameObjects.Container {
  public progress: number = 0; // 0 a 100%
  // 50% da área máxima anterior (Area = π * 92² = 8464π -> 50% = 4232π -> Raio = √4232 ≈ 65px)
  public readonly captureRadius: number = 65;
  public isCompleted: boolean = false;
  public isDestroyed: boolean = false;

  private altarSprite: Phaser.GameObjects.Image;
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private pulseTimer: number = 0;
  private particleTimer: number = 0;
  private currentStage: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(8);

    // 1. Círculo Mágico / Área Rúnica de Captura no Chão
    this.zoneGraphics = scene.add.graphics();
    this.add(this.zoneGraphics);

    // 2. Sprite Central do Altar (200x200px reduzido para proporção de mapa = 130px)
    this.altarSprite = scene.add.image(0, 0, 'altar-1');
    this.altarSprite.setScale(0.65);
    this.add(this.altarSprite);

    this.drawZone(false);
  }

  public updateAltar(player: BaseCharacter, deltaMs: number): void {
    if (this.isCompleted || this.isDestroyed || !player || !player.active) return;

    this.pulseTimer += deltaMs;
    this.particleTimer += deltaMs;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const isPlayerInside = dist <= this.captureRadius;

    // Se o jogador está dentro da zona, carrega em ~6.5 segundos (0 a 100%)
    if (isPlayerInside) {
      this.progress = Math.min(100, this.progress + (deltaMs / 1000) * 15.5);
    } else {
      // Se saiu, perde progresso gradualmente (-8% por segundo)
      this.progress = Math.max(0, this.progress - (deltaMs / 1000) * 8.0);
    }

    // Atualiza sprite do altar de acordo com a porcentagem:
    // 0 - 30%: Altar 1 | 31 - 75%: Altar 2 | 76 - 100%: Altar 3
    let targetStage = 1;
    if (this.progress > 75) {
      targetStage = 3;
    } else if (this.progress > 30) {
      targetStage = 2;
    }

    if (targetStage !== this.currentStage) {
      this.currentStage = targetStage;
      this.altarSprite.setTexture(`altar-${this.currentStage}`);
      if (this.currentStage === 2) {
        SoundManager.getInstance().playRouletteTick(0.9);
      } else if (this.currentStage === 3) {
        SoundManager.getInstance().playRouletteTick(1.3);
      }
    }

    // Desenha área rúnica com a linha circular vermelha se completando
    this.drawZone(isPlayerInside);

    // Partículas místicas subindo enquanto o jogador está capturando
    if (isPlayerInside && this.particleTimer >= 130) {
      this.particleTimer = 0;
      this.spawnRunicMote();
    }

    // Conclusão aos 100%: dispara evento para abrir o modal de evolução
    if (this.progress >= 100) {
      this.isCompleted = true;
      this.emit('altar-completed', this);
    }
  }

  private drawZone(isPlayerInside: boolean): void {
    this.zoneGraphics.clear();

    const pulse = Math.sin(this.pulseTimer * 0.005) * 0.08;

    // 1. Preenchimento suave do solo dentro da zona (sem poluição visual)
    this.zoneGraphics.fillStyle(0x380509, (isPlayerInside ? 0.16 : 0.05) + pulse);
    this.zoneGraphics.fillCircle(0, 0, this.captureRadius);

    // 2. Trilho de fundo (círculo guia escuro)
    this.zoneGraphics.lineStyle(2, 0x420910, isPlayerInside ? 0.6 : 0.35);
    this.zoneGraphics.strokeCircle(0, 0, this.captureRadius);

    // 3. Linha circular vermelha progressiva que vai se completando até formar o círculo (100%)
    if (this.progress > 0) {
      const startAngle = -Math.PI / 2; // Começa no topo (12 horas)
      const fraction = Math.min(1, Math.max(0, this.progress / 100));
      const endAngle = startAngle + fraction * (Math.PI * 2);

      // Brilho exterior suave da linha vermelha
      this.zoneGraphics.lineStyle(5, 0xff002b, isPlayerInside ? 0.4 : 0.2);
      this.zoneGraphics.beginPath();
      this.zoneGraphics.arc(0, 0, this.captureRadius, startAngle, endAngle, false);
      this.zoneGraphics.strokePath();

      // Linha vermelha viva sólida
      const redColor = this.currentStage === 3 ? 0xff1e27 : this.currentStage === 2 ? 0xff3344 : 0xe6192e;
      this.zoneGraphics.lineStyle(3, redColor, isPlayerInside ? 1 : 0.75);
      this.zoneGraphics.beginPath();
      this.zoneGraphics.arc(0, 0, this.captureRadius, startAngle, endAngle, false);
      this.zoneGraphics.strokePath();

      // Ponto de avanço luminoso no topo do arco até fechar 100%
      if (fraction < 1) {
        const tipX = Math.cos(endAngle) * this.captureRadius;
        const tipY = Math.sin(endAngle) * this.captureRadius;
        this.zoneGraphics.fillStyle(0xffe600, isPlayerInside ? 1 : 0.75);
        this.zoneGraphics.fillCircle(tipX, tipY, 3);
      }
    }
  }

  private spawnRunicMote(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(20, this.captureRadius - 5);
    const color = this.currentStage === 3 ? 0xff4500 : this.currentStage === 2 ? 0xffba08 : 0x00f5d4;

    const spark = this.scene.add.circle(
      this.x + Math.cos(angle) * dist,
      this.y + Math.sin(angle) * dist,
      Phaser.Math.Between(2, 4),
      color,
      0.85
    );
    spark.setDepth(9);
    spark.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: spark,
      y: spark.y - Phaser.Math.Between(20, 40),
      alpha: 0,
      scale: 0.2,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy()
    });
  }

  /**
   * Efeito de explosão e destruição do altar após a escolha da evolução
   */
  public explodeAndDestroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    SoundManager.getInstance().playEnemyExplosion();
    this.scene.cameras.main.shake(300, 0.015);
    this.scene.cameras.main.flash(180, 255, 120, 0);

    // Onda de choque
    const shockwave = this.scene.add.graphics();
    shockwave.setDepth(15);
    shockwave.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.addCounter({
      from: 10,
      to: 180,
      duration: 350,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const r = tw.getValue() ?? 10;
        const alpha = Math.max(0, 1 - r / 180);
        shockwave.clear();
        shockwave.lineStyle(4, 0xff4500, alpha);
        shockwave.strokeCircle(this.x, this.y, r);
        shockwave.lineStyle(2, 0xffe600, alpha * 0.8);
        shockwave.strokeCircle(this.x, this.y, r * 0.85);
      },
      onComplete: () => shockwave.destroy()
    });

    // Pedaços de rocha e chamas se estilhaçando
    for (let i = 0; i < 35; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(60, 240);
      const color = Phaser.Math.RND.pick([0x1f1924, 0x473d50, 0xff3b00, 0xff8800, 0xffd000]);
      const size = Phaser.Math.Between(4, 9);

      const shard = this.scene.add.rectangle(this.x, this.y, size, size, color);
      shard.setDepth(16);
      if (color === 0xff3b00 || color === 0xff8800 || color === 0xffd000) {
        shard.setBlendMode(Phaser.BlendModes.ADD);
      }

      this.scene.tweens.add({
        targets: shard,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        rotation: Phaser.Math.FloatBetween(2, 8),
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(300, 520),
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy()
      });
    }

    this.destroy();
  }
}

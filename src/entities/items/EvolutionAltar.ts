import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';

export class EvolutionAltar extends Phaser.GameObjects.Container {
  public progress: number = 0; // 0 a 100%
  public readonly captureRadius: number = 92;
  public isCompleted: boolean = false;
  public isDestroyed: boolean = false;

  private altarSprite: Phaser.GameObjects.Image;
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private progressGauge: Phaser.GameObjects.Graphics;
  private progressText: Phaser.GameObjects.Text;
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

    // 3. Barra / Indicador de Progresso em Arco
    this.progressGauge = scene.add.graphics();
    this.add(this.progressGauge);

    // 4. Texto Flutuante de Progresso
    const font = "'Pixelzone', 'Silkscreen', monospace";
    this.progressText = scene.add.text(0, -68, 'ALTAR DE ASCENSÃO: 0%', {
      fontFamily: font,
      fontSize: '18px',
      color: '#cbd5e1',
      stroke: '#000000',
      strokeThickness: 3.5,
      align: 'center'
    }).setOrigin(0.5);
    this.progressText.setResolution(2);
    this.add(this.progressText);

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
      this.progressText.setColor('#ffe600');
    } else {
      // Se saiu, perde progresso gradualmente (-8% por segundo)
      this.progress = Math.max(0, this.progress - (deltaMs / 1000) * 8.0);
      this.progressText.setColor('#94a3b8');
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

    // Desenha área rúnica com pulso visual
    this.drawZone(isPlayerInside);
    this.drawGauge();

    this.progressText.setText(`ALTAR ARCANO: ${Math.floor(this.progress)}%`);

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

    const pulse = Math.sin(this.pulseTimer * 0.005) * 0.15;
    const alpha = (isPlayerInside ? 0.35 : 0.15) + pulse;

    const baseColor = this.currentStage === 3 ? 0xff3b3b : this.currentStage === 2 ? 0xff9900 : 0x00f5d4;

    // Preenchimento suave do solo dentro da zona
    this.zoneGraphics.fillStyle(baseColor, alpha * 0.35);
    this.zoneGraphics.fillCircle(0, 0, this.captureRadius);

    // Borda rúnica externa tracejada
    this.zoneGraphics.lineStyle(2, baseColor, isPlayerInside ? 0.9 : 0.45);
    this.zoneGraphics.strokeCircle(0, 0, this.captureRadius);

    // Círculo menor interno
    this.zoneGraphics.lineStyle(1, 0xffffff, isPlayerInside ? 0.6 : 0.25);
    this.zoneGraphics.strokeCircle(0, 0, this.captureRadius * 0.55);
  }

  private drawGauge(): void {
    this.progressGauge.clear();

    const gaugeY = -52;
    const gaugeW = 86;
    const gaugeH = 7;

    // Fundo da barra
    this.progressGauge.fillStyle(0x06060c, 0.88);
    this.progressGauge.fillRoundedRect(-gaugeW / 2, gaugeY, gaugeW, gaugeH, 3);
    this.progressGauge.lineStyle(1.5, 0x334155, 0.9);
    this.progressGauge.strokeRoundedRect(-gaugeW / 2, gaugeY, gaugeW, gaugeH, 3);

    // Barra de preenchimento (cor transita de azul para dourado/vermelho fogo)
    const fillW = Math.max(0, (gaugeW - 2) * (this.progress / 100));
    if (fillW > 0) {
      const fillColor = this.currentStage === 3 ? 0xff2200 : this.currentStage === 2 ? 0xffaa00 : 0x00f5d4;
      this.progressGauge.fillStyle(fillColor, 1);
      this.progressGauge.fillRoundedRect(-gaugeW / 2 + 1, gaugeY + 1, fillW, gaugeH - 2, 2);
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

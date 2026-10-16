import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';

export class BossSummonAltar extends Phaser.GameObjects.Container {
  public isActive: boolean = false;
  public isBossSpawned: boolean = false;
  public isCompleted: boolean = false;

  private altarSprite: Phaser.GameObjects.Image;
  private auraGraphics: Phaser.GameObjects.Graphics;
  private animTimer: number = 0;
  private currentActiveFrame: number = 1;
  private particleTimer: number = 0;
  private pulseTimer: number = 0;

  // Raio de ativação e aproximação para iniciar a batalha do Boss
  public readonly encounterRadius: number = 190;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setDepth(9);

    // 1. Gráficos de Aura e Brilho no Chão
    this.auraGraphics = scene.add.graphics();
    this.add(this.auraGraphics);

    // 2. Sprite Central do Altar (200x200px com escala de 0.82 para presença monumental na arena)
    this.altarSprite = scene.add.image(0, 0, 'altar-invoc-inactive');
    this.altarSprite.setScale(0.82);
    this.add(this.altarSprite);

    this.drawAura();
  }

  /**
   * Ativa o Altar de Invocação quando a purificação atinge 100% ou marco do Modo Infinito
   */
  public activate(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.currentActiveFrame = 1;
    this.altarSprite.setTexture('altar-invoc-active-1');
    SoundManager.getInstance().playWeaponEvolve();

    // Clarão dramático de ativação
    this.scene.cameras.main.flash(450, 255, 60, 0);
    this.scene.cameras.main.shake(350, 0.018);

    // Explosão de labaredas e cinzas ao redor do altar
    for (let i = 0; i < 28; i++) {
      this.spawnFlameEmber(true);
    }
  }

  public updateAltar(player: BaseCharacter, deltaMs: number): void {
    if (this.isCompleted || !player || !player.active) return;

    this.pulseTimer += deltaMs;

    // Se estiver inativo, mantém visual frio com raras brasas cinzentas
    if (!this.isActive) {
      this.particleTimer += deltaMs;
      if (this.particleTimer >= 1400) {
        this.particleTimer = 0;
        this.spawnColdSmoke();
      }
      return;
    }

    // Se estiver ativo:
    // 1. Animação alternando entre AltarInvoc Ativo1 e Ativo2 para sensação de fogo vivo
    this.animTimer += deltaMs;
    if (this.animTimer >= 220) {
      this.animTimer = 0;
      this.currentActiveFrame = this.currentActiveFrame === 1 ? 2 : 1;
      this.altarSprite.setTexture(`altar-invoc-active-${this.currentActiveFrame}`);
    }

    // 2. Aura infernal pulsante
    this.drawAura();

    // 3. Emissão contínua de brasas e faíscas incandescentes
    this.particleTimer += deltaMs;
    if (this.particleTimer >= 80) {
      this.particleTimer = 0;
      this.spawnFlameEmber(false);
    }

    // 4. Detecção de aproximação do jogador para invocar o Chefe
    if (!this.isBossSpawned) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist <= this.encounterRadius) {
        this.isBossSpawned = true;
        this.emit('boss-summon-triggered', this);
      }
    }
  }

  private drawAura(): void {
    this.auraGraphics.clear();

    if (!this.isActive) {
      // Glow suave escuro de pedra ancestral
      this.auraGraphics.fillStyle(0x0a0508, 0.45);
      this.auraGraphics.fillCircle(0, 0, 85);
      return;
    }

    // Aura pulsante de pentagrama ardente
    const pulse = Math.sin(this.pulseTimer * 0.005) * 6;
    const baseR = 88 + pulse;

    // Brilho exterior carmesim/laranja
    this.auraGraphics.fillStyle(0xff3300, 0.18);
    this.auraGraphics.fillCircle(0, 0, baseR + 25);

    // Núcleo vulcânico
    this.auraGraphics.fillStyle(0xff6600, 0.28);
    this.auraGraphics.fillCircle(0, 0, baseR);

    // Anel de contenção rúnico
    this.auraGraphics.lineStyle(2, 0xffbb00, 0.85);
    this.auraGraphics.strokeCircle(0, 0, baseR);
  }

  private spawnFlameEmber(isBurst: boolean): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = isBurst ? Phaser.Math.Between(10, 75) : Phaser.Math.Between(15, 65);
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    const colors = [0xff2200, 0xff6600, 0xffaa00, 0xffe600];
    const color = colors[Phaser.Math.Between(0, colors.length - 1)];

    const ember = this.scene.add.circle(this.x + px, this.y + py, Phaser.Math.Between(2, 4), color, 0.9);
    ember.setDepth(this.depth + 1);

    this.scene.tweens.add({
      targets: ember,
      y: ember.y - Phaser.Math.Between(30, 80),
      x: ember.x + Phaser.Math.Between(-15, 15),
      alpha: 0,
      scale: 0.2,
      duration: isBurst ? Phaser.Math.Between(600, 1100) : Phaser.Math.Between(450, 800),
      ease: 'Quad.easeOut',
      onComplete: () => ember.destroy()
    });
  }

  private spawnColdSmoke(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(15, 55);
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    const smoke = this.scene.add.circle(this.x + px, this.y + py, 3, 0x554455, 0.35);
    smoke.setDepth(this.depth + 1);

    this.scene.tweens.add({
      targets: smoke,
      y: smoke.y - 25,
      alpha: 0,
      scale: 1.8,
      duration: 1200,
      ease: 'Power1',
      onComplete: () => smoke.destroy()
    });
  }

  public complete(): void {
    this.isCompleted = true;
    this.altarSprite.setTint(0x777777);
    this.auraGraphics.clear();
  }
}

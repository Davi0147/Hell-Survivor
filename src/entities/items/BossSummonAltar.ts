import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';
import { DECOR_TEXTURE_SCALE } from '../../config/sceneryCatalog';

/** Arte própria do altar de um capítulo (apagado / aceso) e a cor das faíscas. */
export interface SummonAltarLook {
  off: string;
  on: string;
  embers?: number[];
}

/** Brilho pulsante por cima do altar aceso (o altar novo tem um quadro só de aceso). */
const GLOW_PULSE = { periodMs: 900, min: 0.05, max: 0.4 } as const;

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
  /** Arte do capítulo (Capítulos 2 e 3); sem ela, o altar antigo de 3 imagens. */
  private readonly look?: SummonAltarLook;
  private glow?: Phaser.GameObjects.Image;

  // Raio de ativação e aproximação para iniciar a batalha do Boss
  public readonly encounterRadius: number = 190;

  constructor(scene: Phaser.Scene, x: number, y: number, look?: SummonAltarLook) {
    super(scene, x, y);
    scene.add.existing(this);
    // Abaixo dos monstros (4–15) e da heroína (20): é uma plataforma no chão, quem passa por cima fica na frente.
    this.setDepth(3);
    // Só usa a arte do capítulo se ela carregou
    this.look = look && scene.textures.exists(look.off) && scene.textures.exists(look.on) ? look : undefined;

    // 1. Gráficos de Aura e Brilho no Chão
    this.auraGraphics = scene.add.graphics();
    this.add(this.auraGraphics);

    // 2. Sprite Central do Altar (antigo: 200x200 com escala 0.82; novo: densidade 2x com escala 0.5)
    this.altarSprite = scene.add.image(0, 0, this.look ? this.look.off : 'altar-invoc-inactive');
    this.altarSprite.setScale(this.look ? DECOR_TEXTURE_SCALE : 0.82);
    this.add(this.altarSprite);
    if (this.look) {
      this.glow = scene.add
        .image(0, 0, this.look.on)
        .setScale(DECOR_TEXTURE_SCALE)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0)
        .setVisible(false);
      this.add(this.glow);
    }

    this.drawAura();
  }

  /**
   * Ativa o Altar de Invocação quando a purificação atinge 100% ou marco do Modo Infinito
   */
  public activate(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.currentActiveFrame = 1;
    this.altarSprite.setTexture(this.look ? this.look.on : 'altar-invoc-active-1');
    this.glow?.setVisible(true);
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

    // 1. Altar antigo alterna Ativo1/Ativo2; o novo pulsa um brilho por cima do quadro aceso
    if (this.glow) {
      const wave = (1 - Math.cos((this.pulseTimer / GLOW_PULSE.periodMs) * Math.PI * 2)) / 2;
      this.glow.setAlpha(GLOW_PULSE.min + (GLOW_PULSE.max - GLOW_PULSE.min) * wave);
    } else {
      this.animTimer += deltaMs;
      if (this.animTimer >= 220) {
        this.animTimer = 0;
        this.currentActiveFrame = this.currentActiveFrame === 1 ? 2 : 1;
        this.altarSprite.setTexture(`altar-invoc-active-${this.currentActiveFrame}`);
      }
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
    // Círculos e anéis de fundo removidos conforme solicitado pelo usuário.
    // O visual do altar é garantido pelos sprites oficiais AltarInvoc.png e chamas animadas.
  }

  private spawnFlameEmber(isBurst: boolean): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = isBurst ? Phaser.Math.Between(10, 75) : Phaser.Math.Between(15, 65);
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    const colors = this.look?.embers ?? [0xff2200, 0xff6600, 0xffaa00, 0xffe600];
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
    this.glow?.setVisible(false);
    this.auraGraphics.clear();
  }

  /**
   * Restaura o altar ao estado inativo inicial exclusivo para repetição de testes no Modo Sandbox.
   */
  public resetForSandbox(): void {
    this.isActive = false;
    this.isBossSpawned = false;
    this.isCompleted = false;
    this.currentActiveFrame = 1;
    this.animTimer = 0;
    this.particleTimer = 0;
    this.pulseTimer = 0;
    if (this.altarSprite) {
      this.altarSprite.setTexture(this.look ? this.look.off : 'altar-invoc-inactive');
      this.altarSprite.clearTint();
    }
    this.glow?.setVisible(false).setAlpha(0);
    if (this.auraGraphics) {
      this.auraGraphics.clear();
    }
  }
}

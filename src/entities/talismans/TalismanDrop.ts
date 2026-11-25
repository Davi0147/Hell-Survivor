import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../config/balance';
import { TALISMAN_THEME } from '../../config/theme';

const DROP_DEPTH = 16;
const CARD_W = 22;
const CARD_H = 34;

/**
 * Talismã no chão (prêmio do minichefe): carta de costas girando, feixe de luz até o céu,
 * brilho pulsando e faíscas subindo, para o jogador ver de longe que tem algo especial ali.
 * A raridade só é sorteada quando ele pega (o item no chão é sempre igual).
 */
export class TalismanDrop {
  public active = true;
  private readonly parts: Phaser.GameObjects.GameObject[] = [];
  private readonly card: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Ellipse;
  private sparkTimer = 0;
  private t = Math.random() * Math.PI * 2;

  constructor(private readonly scene: Phaser.Scene, public readonly x: number, public readonly y: number) {
    const cfg = TALISMAN_BALANCE.drop;
    const th = TALISMAN_THEME;

    // Feixe de luz: faixa larga e fraca + miolo fino e forte (somam luz no modo ADD)
    const beamOuter = scene.add.rectangle(x, y, 30, cfg.beamHeight, th.dropBeam, 0.16).setOrigin(0.5, 1);
    const beamInner = scene.add.rectangle(x, y, 8, cfg.beamHeight, th.dropBeam, 0.42).setOrigin(0.5, 1);
    for (const b of [beamOuter, beamInner]) b.setDepth(DROP_DEPTH - 1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: [beamOuter, beamInner], scaleX: { from: 0.8, to: 1.25 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.glow = scene.add.ellipse(x, y + 4, 56, 24, th.dropGlow, 0.5).setDepth(DROP_DEPTH - 2).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: this.glow, alpha: { from: 0.3, to: 0.7 }, scale: { from: 0.9, to: 1.2 }, duration: 600, yoyo: true, repeat: -1 });

    // Moldura dourada: a escura sumia no chão de pedra
    this.card = scene.add.image(x, y - 14, th.rarity.legendary.card).setDisplaySize(CARD_W, CARD_H).setDepth(DROP_DEPTH);

    this.parts.push(beamOuter, beamInner, this.glow, this.card);

    // Chegada: clarão no chão
    const burst = scene.add.circle(x, y, 60, th.dropBeam, 0.5).setDepth(DROP_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD).setScale(0.1);
    scene.tweens.add({ targets: burst, scale: 1.4, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => burst.destroy() });
  }

  public update(deltaMs: number): void {
    if (!this.active) return;
    this.t += deltaMs * 0.004;
    // Carta flutua e "gira" (encolhe na largura como se virasse)
    this.card.y = this.y - 16 + Math.sin(this.t) * 4;
    this.card.scaleX = (CARD_W / this.card.width) * Math.cos(this.t * 0.8);

    this.sparkTimer -= deltaMs;
    if (this.sparkTimer <= 0) {
      this.sparkTimer = 160;
      this.emitSpark();
    }
  }

  private emitSpark(): void {
    const s = this.scene.add.circle(this.x + Phaser.Math.Between(-14, 14), this.y, Phaser.Math.Between(1, 2), TALISMAN_THEME.dropSpark, 1);
    s.setDepth(DROP_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: s,
      y: this.y - Phaser.Math.Between(50, 110),
      alpha: 0,
      duration: Phaser.Math.Between(600, 900),
      onComplete: () => s.destroy(),
    });
  }

  public isTouching(px: number, py: number): boolean {
    return Math.hypot(px - this.x, py - this.y) <= TALISMAN_BALANCE.drop.pickupRadius;
  }

  public destroy(): void {
    if (!this.active) return;
    this.active = false;
    for (const p of this.parts) {
      this.scene.tweens.killTweensOf(p);
      p.destroy();
    }
    this.parts.length = 0;
  }
}

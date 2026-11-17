import Phaser from 'phaser';
import { FONTS, FX_COLORS, COLORS } from '../config/theme';
import { IMPACT_BALANCE } from '../config/balance';

/**
 * Números de dano flutuantes. Os textos são reaproveitados (pool por cena):
 * criar e destruir um Text por golpe era o maior custo de memória do combate.
 */
export class DamageTextSystem {
  private static pools = new WeakMap<Phaser.Scene, Phaser.GameObjects.Text[]>();

  private static acquire(scene: Phaser.Scene): Phaser.GameObjects.Text | undefined {
    let pool = DamageTextSystem.pools.get(scene);
    if (!pool) {
      pool = [];
      DamageTextSystem.pools.set(scene, pool);
    }

    // A cena reinicia reaproveitando o mesmo objeto: textos da partida anterior já foram destruídos
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!pool[i].scene) pool.splice(i, 1);
    }

    const free = pool.find((t) => !t.visible);
    if (free) return free;
    if (pool.length >= IMPACT_BALANCE.maxDamageTexts) return undefined;

    const text = scene.add.text(0, 0, '', {
      fontFamily: FONTS.display,
      fontSize: '12px',
      fontStyle: 'bold',
      color: FX_COLORS.damageText,
      stroke: COLORS.strokeBlack,
      strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(200);
    pool.push(text);
    return text;
  }

  public static showDamage(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    isCritical: boolean = false
  ): void {
    const text = DamageTextSystem.acquire(scene);
    if (!text) return;

    const offsetX = Phaser.Math.Between(-8, 8);
    const offsetY = Phaser.Math.Between(-5, 5);
    const startY = y - 12 + offsetY;

    text.setText(isCritical ? `${Math.round(amount)}!` : Math.round(amount).toString());
    text.setFontSize(isCritical ? 17 : 12);
    text.setColor(isCritical ? FX_COLORS.critText : FX_COLORS.damageText);
    text.setStroke(isCritical ? FX_COLORS.critStroke : COLORS.strokeBlack, isCritical ? 4 : 3);
    text.setPosition(x + offsetX, startY);
    text.setAlpha(1);
    text.setAngle(isCritical ? Phaser.Math.Between(-10, 10) : 0);
    text.setVisible(true);

    const startScale = isCritical ? 1.9 : 1.3;
    text.setScale(startScale);

    scene.tweens.add({
      targets: text,
      y: startY - (isCritical ? 40 : 28),
      scaleX: 1,
      scaleY: 1,
      alpha: { from: 1, to: 0 },
      duration: isCritical ? 720 : 500,
      ease: isCritical ? 'Back.easeOut' : 'Power1',
      onComplete: () => {
        if (text.scene) text.setVisible(false);
      }
    });
  }
}

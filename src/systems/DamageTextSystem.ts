import Phaser from 'phaser';
import { FONTS } from '../config/theme';

export class DamageTextSystem {
  public static showDamage(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    isCritical: boolean = false
  ): void {
    const offsetX = Phaser.Math.Between(-8, 8);
    const offsetY = Phaser.Math.Between(-5, 5);

    const color = isCritical ? '#ffbe0b' : '#ffffff';
    const fontSize = isCritical ? '14px' : '12px';

    const text = scene.add.text(x + offsetX, y - 12 + offsetY, Math.round(amount).toString(), {
      fontFamily: FONTS.display,
      fontSize: fontSize,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    });

    text.setOrigin(0.5);
    text.setDepth(200);

    scene.tweens.add({
      targets: text,
      y: text.y - 28,
      scaleX: { from: 1.3, to: 1.0 },
      scaleY: { from: 1.3, to: 1.0 },
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
      }
    });
  }
}

import Phaser from 'phaser';
import { FONTS, FX_COLORS, COLORS } from '../config/theme';
import { IMPACT_BALANCE } from '../config/balance';

/** Dano a partir do qual o número comum já aparece "pesado" (maior e dourado-claro). */
const HEAVY_HIT = 60;

/**
 * Números de dano flutuantes. Os textos são reaproveitados (pool por cena):
 * criar e destruir um Text por golpe era o maior custo de memória do combate.
 *
 * Golpe comum: estoura grande, encolhe com mola e sai voando de lado em arco.
 * Crítico: carimbo enorme torto com degradê dourado-vermelho, treme, segura na tela
 * um instante e sobe; fica por cima dos outros números.
 */
export class DamageTextSystem {
  private static pools = new WeakMap<Phaser.Scene, Phaser.GameObjects.Text[]>();

  private static acquire(scene: Phaser.Scene, isCritical: boolean): Phaser.GameObjects.Text | undefined {
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

    if (pool.length >= IMPACT_BALANCE.maxDamageTexts) {
      // Tela cheia de números: o crítico nunca deixa de aparecer, rouba o texto mais antigo
      if (!isCritical) return undefined;
      const oldest = pool.shift()!;
      scene.tweens.killTweensOf(oldest);
      pool.push(oldest);
      return oldest;
    }

    const text = scene.add.text(0, 0, '', {
      fontFamily: FONTS.display,
      fontSize: '14px',
      fontStyle: 'bold',
      color: FX_COLORS.damageText,
      stroke: COLORS.strokeBlack,
      strokeThickness: 4
    });
    text.setOrigin(0.5);
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
    const text = DamageTextSystem.acquire(scene, isCritical);
    if (!text) return;

    const value = Math.round(amount);
    const startX = x + Phaser.Math.Between(-8, 8);
    const startY = y - 14 + Phaser.Math.Between(-5, 5);
    // Quanto maior o golpe, maior o número (com teto para não tapar a tela)
    const sizeBonus = Math.min(8, Math.floor(value / 25));

    text.setPosition(startX, startY);
    text.setAlpha(1);
    text.setVisible(true);

    if (isCritical) {
      text.setText(`${value}!`);
      text.setFontSize(26 + sizeBonus);
      text.setColor(FX_COLORS.damageText);
      // Contorno fino: na fonte pixel, contorno grosso fecha os vãos e vira um bloco ilegível
      text.setStroke(COLORS.strokeBlack, 4);
      text.setTint(FX_COLORS.critTintTop, FX_COLORS.critTintTop, FX_COLORS.critTintBottom, FX_COLORS.critTintBottom);
      text.setDepth(210);
      const tilt = Phaser.Math.Between(8, 20) * (Math.random() < 0.5 ? -1 : 1);
      text.setAngle(tilt);
      text.setScale(3.2);

      scene.tweens.add({
        targets: text,
        props: {
          // Carimbo: entra gigante e assenta com mola
          scale: { value: 1, duration: 230, ease: 'Back.easeOut' },
          angle: { value: tilt * 0.25, duration: 230, ease: 'Back.easeOut' },
          // Tremor curto no impacto
          x: { value: startX + 3, duration: 40, yoyo: true, repeat: 3 },
          // Segura um instante e sobe
          y: { value: startY - 52, duration: 620, delay: 260, ease: 'Cubic.easeIn' },
          alpha: { value: 0, duration: 260, delay: 640 }
        },
        onComplete: () => {
          if (text.scene) text.setVisible(false);
        }
      });
      return;
    }

    const isHeavy = value >= HEAVY_HIT;
    text.setText(value.toString());
    text.setFontSize(14 + sizeBonus);
    text.setColor(isHeavy ? FX_COLORS.damageHeavyText : FX_COLORS.damageText);
    text.setStroke(COLORS.strokeBlack, 4);
    text.clearTint();
    text.setDepth(200);
    text.setAngle(0);
    text.setScale(isHeavy ? 2.2 : 1.8);

    // Arco: salta para um lado, sobe e cai um pouco enquanto some
    const side = Math.random() < 0.5 ? -1 : 1;
    const driftX = startX + side * Phaser.Math.Between(10, 22);

    scene.tweens.add({
      targets: text,
      props: {
        scale: { value: 1, duration: 170, ease: 'Back.easeOut' },
        x: { value: driftX, duration: 560, ease: 'Sine.easeOut' },
        y: { value: startY - 30, duration: 330, ease: 'Quad.easeOut', yoyo: true, hold: 0 },
        alpha: { value: 0, duration: 240, delay: 340 }
      },
      onComplete: () => {
        if (text.scene) text.setVisible(false);
      }
    });
  }
}

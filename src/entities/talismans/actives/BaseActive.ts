import { FONTS, TALISMAN_THEME } from '../../../config/theme';
import type { ITalismanContext, TalismanEffect } from '../talismanContext';

/**
 * Base das habilidades: disparam sozinhas quando `shouldTrigger()` diz que é a hora
 * (cercada, ferida, horda grande) e então esperam a recarga. Ao disparar, o nome
 * aparece sobre a heroína, para o jogador saber o que aconteceu.
 */
export abstract class BaseActive implements TalismanEffect {
  private cooldown: number;

  constructor(
    protected readonly ctx: ITalismanContext,
    private readonly label: string,
    private readonly cooldownMs: number,
    /** Recarga já correndo ao receber (evita disparar no mesmo instante da carta). */
    startDelayMs = 1500
  ) {
    this.cooldown = startDelayMs;
  }

  protected abstract shouldTrigger(): boolean;
  protected abstract activate(): void;

  public update(deltaMs: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= deltaMs;
      return;
    }
    if (this.ctx.player.currentHp <= 0 || !this.shouldTrigger()) return;
    this.cooldown = this.cooldownMs;
    this.announce();
    this.activate();
  }

  /** Recarga começa de novo a partir de agora (escudo que acabou de quebrar). */
  protected restartCooldown(): void {
    this.cooldown = this.cooldownMs;
  }

  private announce(): void {
    const { scene, player } = this.ctx;
    const t = scene.add.text(player.x, player.y - 44, this.label, {
      fontFamily: FONTS.body, fontSize: '10px', color: TALISMAN_THEME.edgeText,
      stroke: TALISMAN_THEME.textStroke, strokeThickness: 3,
    }).setOrigin(0.5).setDepth(40).setResolution(2);
    scene.tweens.add({ targets: t, y: t.y - 22, alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  public destroy(): void {
    // As habilidades não deixam nada permanente por padrão
  }
}

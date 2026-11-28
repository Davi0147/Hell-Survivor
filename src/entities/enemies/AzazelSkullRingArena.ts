import Phaser from 'phaser';
import { AZAZEL_BOSS_BALANCE } from '../../config/balance';
import { AZAZEL_SKULL_RING_THEME } from '../../config/theme';
import { clampToCircle } from '../../systems/crystalPhaseRules';

/** Acima do escuro total do Azazel (14) e do chão; abaixo da heroína (20). */
const RING_DEPTH = 15;

/** O que a arena precisa da heroína. */
export interface SkullRingPlayer {
  x: number;
  y: number;
  body: unknown;
  setPosition(x: number, y: number): unknown;
  applyKnockback?(vx: number, vy: number, durationMs?: number): void;
}

/**
 * Arena da roda de caveiras (fase da escuridão do Azazel): a roda fica parada onde começou e
 * a heroína não sai de dentro. Encostar na borda devolve ela para dentro, empurra para o centro
 * e avisa quem chamou (o Azazel aplica o dano). A borda é desenhada em blocos de pixel por cima
 * do escuro, senão no breu não dá para ver até onde se pode ir.
 */
export class AzazelSkullRingArena {
  private graphics?: Phaser.GameObjects.Graphics;
  private center: { x: number; y: number } | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  public get isActive(): boolean {
    return this.center !== null;
  }

  public getCenter(): { x: number; y: number } | null {
    return this.center ? { ...this.center } : null;
  }

  public start(cx: number, cy: number): void {
    this.center = { x: cx, y: cy };
    this.draw(AZAZEL_SKULL_RING_THEME.ring, AZAZEL_SKULL_RING_THEME.ringCore);
    // Pulsa devagar: chama o olho para a borda sem piscar
    if (this.graphics) {
      this.scene.tweens.add({ targets: this.graphics, alpha: { from: 1, to: 0.7 }, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  public stop(): void {
    this.center = null;
    if (this.graphics?.scene) {
      this.scene.tweens.killTweensOf(this.graphics);
      this.graphics.destroy();
    }
    this.graphics = undefined;
  }

  /** Mantém a heroína dentro. Devolve true no quadro em que ela encostou na borda. */
  public enforce(player: SkullRingPlayer): boolean {
    const c = this.center;
    if (!c) return false;
    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls.arena;
    const p = clampToCircle(player.x, player.y, c.x, c.y, cfg.edgeRadius);
    if (!p.clamped) return false;

    const body = player.body as Phaser.Physics.Arcade.Body | null;
    if (body && typeof body.reset === 'function') body.reset(p.x, p.y);
    else player.setPosition(p.x, p.y);

    const toCenter = Math.atan2(c.y - p.y, c.x - p.x);
    player.applyKnockback?.(Math.cos(toCenter) * cfg.pushForce, Math.sin(toCenter) * cfg.pushForce, cfg.pushMs);
    this.flash();
    return true;
  }

  private flash(): void {
    this.draw(AZAZEL_SKULL_RING_THEME.hitFlash, AZAZEL_SKULL_RING_THEME.ringCore);
    this.scene.time.delayedCall(140, () => {
      if (this.center) this.draw(AZAZEL_SKULL_RING_THEME.ring, AZAZEL_SKULL_RING_THEME.ringCore);
    });
  }

  private draw(ringColor: number, coreColor: number): void {
    const c = this.center;
    if (!c) return;
    if (!this.graphics?.scene) this.graphics = this.scene.add.graphics().setDepth(RING_DEPTH);
    const g = this.graphics;
    g.clear();
    const radius = AZAZEL_BOSS_BALANCE.darkSkulls.arena.edgeRadius;
    const t = AZAZEL_SKULL_RING_THEME;

    // Brilho por dentro da borda: faixa larga e transparente (no breu, mostra a área de longe)
    g.lineStyle(26, t.glow, t.glowAlpha);
    g.strokeCircle(c.x, c.y, radius - 13);

    // Borda contínua em blocos de pixel encostados (antes eram pontos espaçados, sumiam no escuro)
    const steps = Math.round((Math.PI * 2 * radius) / 5);
    const block = 10;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.round((c.x + Math.cos(a) * radius) / 2) * 2;
      const y = Math.round((c.y + Math.sin(a) * radius) / 2) * 2;
      g.fillStyle(ringColor, 1);
      g.fillRect(x - block / 2, y - block / 2, block, block);
    }
    // Miolo claro por cima, também contínuo
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.round((c.x + Math.cos(a) * radius) / 2) * 2;
      const y = Math.round((c.y + Math.sin(a) * radius) / 2) * 2;
      g.fillStyle(coreColor, 1);
      g.fillRect(x - 2, y - 2, 4, 4);
    }
  }
}

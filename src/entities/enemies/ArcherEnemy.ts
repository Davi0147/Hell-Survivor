import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { ENEMY_BALANCE } from '../../config/balance';
import { archerStandoffPoint, isInsideView, shouldAbortDraw, shouldHold, type ViewRect } from './archerRules';

type Cardinal = 'east' | 'west' | 'north' | 'south';
type ArcherState = 'move' | 'draw';

/** Quem dispara a flecha de verdade (EnemyArrowSystem). */
export type ArcherFireFn = (x: number, y: number, angle: number, damage: number) => void;

/** Caixa de colisão (px do quadro, antes da escala). Os quadros têm 56px (parado) e 76px (correndo/atirando). */
const BODY_W = 22;
const BODY_H = 30;
const BODY_DROP = 4;

/**
 * Arqueira Demônia — rápida, corre até uma distância segura e atira na heroína.
 * Puxa o arco (animação = aviso) e solta a flecha no fim; uma flecha a cada `fireCooldownMs`.
 * Se a heroína avança, ela recua até a distância segura e volta a atirar.
 * Números em `ENEMY_BALANCE.archer`; regras de distância em `archerRules.ts`.
 */
export class ArcherEnemy extends BaseEnemy {
  private currentDir: Cardinal = 'south';
  private archerState: ArcherState = 'move';
  private isHolding = false;
  private drawTimer = 0;
  private fireCooldown = 0;
  private arrowDamage = 0;
  private fireFn?: ArcherFireFn;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'archer-idle-south');
    this.fitBody();
  }

  /** `arrowDamage` já vem escalonado pelo tempo de partida. */
  public setupArcher(fire: ArcherFireFn, arrowDamage: number): void {
    this.fireFn = fire;
    this.arrowDamage = arrowDamage;
  }

  public override spawn(x: number, y: number, hp: number, speed: number, damage: number): void {
    super.spawn(x, y, hp, speed, damage);
    this.archerState = 'move';
    this.isHolding = false;
    this.drawTimer = 0;
    // Primeiro tiro sai um pouco depois de chegar, não no instante em que nasce
    this.fireCooldown = ENEMY_BALANCE.archer.fireCooldownMs * 0.5;
    this.setScale(ENEMY_BALANCE.archer.scale);
    this.play('archer-idle-south', true);
    this.fitBody();
  }

  private fitBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(BODY_W, BODY_H, false);
    body.setOffset((this.width - BODY_W) / 2, (this.height - BODY_H) / 2 + BODY_DROP);
  }

  private playAnim(key: string): void {
    if (this.anims.currentAnim?.key === key) return;
    this.play(key, true);
    this.fitBody();
  }

  /** Área que a câmera mostra, com folga para não ficar colada na borda (atrás do HUD). */
  private visibleRect(margin: number): ViewRect | undefined {
    const v = this.scene.cameras.main.worldView;
    if (v.width <= margin * 2 || v.height <= margin * 2) return undefined;
    return { left: v.x + margin, right: v.right - margin, top: v.y + margin, bottom: v.bottom - margin };
  }

  private static cardinalOf(dx: number, dy: number): Cardinal {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'east' : 'west';
    return dy > 0 ? 'south' : 'north';
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;
    const cfg = ENEMY_BALANCE.archer;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.clearTint();
    }
    const stunMult = this.updateStunState(deltaMs);
    this.fireCooldown -= deltaMs;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.archerState === 'draw') {
      this.setVelocity(0, 0);
      // Atordoada ou com a heroína em cima: larga o tiro e volta a se mexer
      if (this.stunTimer > 0 || shouldAbortDraw(dist, cfg.minRange)) {
        this.archerState = 'move';
      } else {
        this.drawTimer -= deltaMs;
        if (this.drawTimer <= 0) {
          this.archerState = 'move';
          this.fireFn?.(this.x, this.y - 6, Math.atan2(dy, dx), this.arrowDamage);
        }
        return;
      }
    }

    // Ponto de tiro: à distância segura, do lado em que ela está, sempre dentro da tela
    const view = this.visibleRect(cfg.screenMarginPx);
    const point = archerStandoffPoint(targetX, targetY, this.x, this.y, cfg.range, view);
    const mx = point.x - this.x;
    const my = point.y - this.y;
    const toPoint = Math.hypot(mx, my) || 1;
    // Só para de verdade dentro da área segura (chegando de fora, a folga a deixaria colada na borda)
    this.isHolding = isInsideView(this.x, this.y, view) && shouldHold(toPoint, cfg.holdPx, this.isHolding);
    if (!this.isHolding) {
      // Afastando-se da heroína (ela avançou) corre mais devagar, para dar para alcançar
      const retreating = dist < cfg.range;
      const s = this.speed * (retreating ? cfg.retreatSpeedMult : 1) * stunMult;
      this.setVelocity((mx / toPoint) * s, (my / toPoint) * s);
      this.currentDir = ArcherEnemy.cardinalOf(mx, my);
      this.playAnim(`archer-run-${this.currentDir}`);
      return;
    }

    // No ponto de tiro: para, vira para a heroína e atira quando o arco estiver pronto
    this.setVelocity(0, 0);
    this.currentDir = ArcherEnemy.cardinalOf(dx, dy);
    if (this.fireCooldown <= 0 && this.stunTimer <= 0) {
      this.archerState = 'draw';
      this.drawTimer = cfg.drawMs;
      this.fireCooldown = cfg.fireCooldownMs;
      this.play(`archer-shoot-${this.currentDir}`, true);
      this.fitBody();
      return;
    }
    if (!this.anims.currentAnim?.key.startsWith('archer-shoot') || !this.anims.isPlaying) {
      this.playAnim(`archer-idle-${this.currentDir}`);
    }
  }
}

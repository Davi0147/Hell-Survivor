import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import type { ITalismanContext, TalismanEffect } from '../talismanContext';

/** Animações do pet: `<run>-<direção>` e `<idle>-<direção>`. */
export interface PetAnimSet {
  run: string;
  idle: string;
  /** A animação de corrida só existe nas 4 direções principais. */
  runCardinalOnly: boolean;
}

const OUTLINE_OFFSETS: ReadonlyArray<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const PET_DEPTH = 21;

/**
 * Base dos pets: sprite com contorno branco (para não se confundir com os monstros),
 * caminhada até um ponto e escolha da animação pela direção.
 * O contorno são 4 cópias do sprite pintadas de branco, 1 pixel para cada lado, atrás dele.
 */
export abstract class BasePet implements TalismanEffect {
  protected readonly sprite: Phaser.GameObjects.Sprite;
  private readonly outline: Phaser.GameObjects.Sprite[] = [];
  private facing = 'south';

  constructor(
    protected readonly ctx: ITalismanContext,
    private readonly anims: PetAnimSet,
    scale: number
  ) {
    const { scene, player } = ctx;
    const startKey = `${anims.idle}-south`;
    this.sprite = scene.add.sprite(player.x, player.y + 20, startKey);
    this.sprite.setScale(scale).setDepth(PET_DEPTH);
    for (let i = 0; i < OUTLINE_OFFSETS.length; i++) {
      const o = scene.add.sprite(this.sprite.x, this.sprite.y, startKey);
      o.setScale(scale).setDepth(PET_DEPTH - 0.1).setTintFill(TALISMAN_THEME.petOutline);
      this.outline.push(o);
    }
    this.playAnim(false, 0, 1);
    this.syncOutline();
  }

  public abstract update(deltaMs: number): void;

  public destroy(): void {
    this.sprite.destroy();
    for (const o of this.outline) o.destroy();
    this.outline.length = 0;
  }

  protected get x(): number {
    return this.sprite.x;
  }

  protected get y(): number {
    return this.sprite.y;
  }

  /** Ponto de descanso ao lado da heroína (cada pet escolhe o ângulo). */
  protected restPoint(angle: number): { x: number; y: number } {
    const r = TALISMAN_BALANCE.pets.followRadius;
    return { x: this.ctx.player.x + Math.cos(angle) * r, y: this.ctx.player.y + Math.sin(angle) * r };
  }

  protected distanceToPlayer(): number {
    return Math.hypot(this.ctx.player.x - this.x, this.ctx.player.y - this.y);
  }

  /** Anda até o ponto; devolve true quando chegou. */
  protected moveToward(tx: number, ty: number, speed: number, deltaMs: number, stopAt = 4): boolean {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= stopAt) {
      this.playAnim(false, dx, dy);
      return true;
    }
    // Muito longe (heroína correu ou teleportou): acelera para não ficar para trás
    const boost = dist > TALISMAN_BALANCE.pets.leashRange ? 2.5 : 1;
    const step = Math.min(dist - stopAt, speed * boost * (deltaMs / 1000));
    this.sprite.x += (dx / dist) * step;
    this.sprite.y += (dy / dist) * step;
    this.playAnim(true, dx, dy);
    return false;
  }

  /** Coloca o pet direto num ponto (pulos e órbitas). */
  protected placeAt(x: number, y: number, moving: boolean, dx: number, dy: number): void {
    this.sprite.setPosition(x, y);
    this.playAnim(moving, dx, dy);
  }

  protected playAnim(moving: boolean, dx: number, dy: number): void {
    if (dx !== 0 || dy !== 0) this.facing = this.directionOf(dx, dy, moving && this.anims.runCardinalOnly);
    const key = `${moving ? this.anims.run : this.anims.idle}-${this.facing}`;
    const fallback = `${this.anims.idle}-south`;
    const animKey = this.sprite.scene.anims.exists(key) ? key : fallback;
    if (this.sprite.anims.currentAnim?.key !== animKey && this.sprite.scene.anims.exists(animKey)) {
      this.sprite.play(animKey, true);
    }
  }

  /** Chamar ao fim de `update` para o contorno seguir o quadro e a posição. */
  protected syncOutline(): void {
    const s = this.sprite;
    for (let i = 0; i < this.outline.length; i++) {
      const o = this.outline[i];
      const [ox, oy] = OUTLINE_OFFSETS[i];
      o.setPosition(s.x + ox, s.y + oy);
      o.setScale(s.scaleX, s.scaleY);
      o.setAlpha(s.alpha);
      o.setVisible(s.visible);
      if (o.texture.key !== s.texture.key || o.frame.name !== s.frame.name) o.setTexture(s.texture.key, s.frame.name);
    }
  }

  private directionOf(dx: number, dy: number, cardinalOnly: boolean): string {
    if (cardinalOnly) {
      if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'east' : 'west';
      return dy > 0 ? 'south' : 'north';
    }
    const dirs = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
    const a = Math.atan2(dy, dx);
    const idx = (Math.round(a / (Math.PI / 4)) + 8) % 8;
    return dirs[idx];
  }
}

import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import type { PetSprite } from '../../../systems/TalismanCatalog';
import type { ITalismanContext, TalismanEffect } from '../talismanContext';
import { shouldFollow } from './looseFollow';

const OUTLINE_OFFSETS: ReadonlyArray<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const PET_DEPTH = 21;

/**
 * Posição de desenho a um número inteiro de pixels de tela da âncora (a heroína, que a câmera
 * segue). `zoom` converte unidade do mundo em pixel de tela.
 */
export function snapToScreenGrid(value: number, anchor: number, zoom: number): number {
  return anchor + Math.round((value - anchor) * zoom) / zoom;
}

/**
 * Base dos pets: sprite de lado com contorno branco (para não se confundir com os monstros),
 * caminhada até um ponto e virada para o lado em que anda.
 * A arte é desenhada virada para a direita; para a esquerda o sprite é espelhado.
 * O contorno são 4 cópias do sprite pintadas de branco, 1 pixel para cada lado, atrás dele.
 */
export abstract class BasePet implements TalismanEffect {
  protected readonly sprite: Phaser.GameObjects.Sprite;
  private readonly outline: Phaser.GameObjects.Sprite[] = [];
  /** `followLoose`: está andando para alcançar o ponto. */
  private following = false;
  /**
   * Posição de verdade do pet (jogo). O sprite é desenhado nela, mas encaixado na grade de
   * pixels da tela (ver `syncOutline`); com zoom 1.6 e arte pixelada, desenhar numa fração de
   * pixel diferente a cada quadro faz o pet tremer/borrar enquanto a heroína anda.
   */
  private readonly pos: { x: number; y: number };

  constructor(
    protected readonly ctx: ITalismanContext,
    private readonly pet: PetSprite,
    scale: number
  ) {
    const { scene, player } = ctx;
    const startKey = `pet-${pet}-0`;
    this.pos = { x: player.x, y: player.y + 20 };
    this.sprite = scene.add.sprite(this.pos.x, this.pos.y, startKey);
    this.sprite.setScale(scale).setDepth(PET_DEPTH);
    for (let i = 0; i < OUTLINE_OFFSETS.length; i++) {
      const o = scene.add.sprite(this.sprite.x, this.sprite.y, startKey);
      o.setScale(scale).setDepth(PET_DEPTH - 0.1).setTintFill(TALISMAN_THEME.petOutline);
      this.outline.push(o);
    }
    this.playAnim(false, 0);
    this.syncOutline();
    // Depois da física mover a heroína no quadro: aí a posição dela (e da câmera) já é a final
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncOutline, this);
  }

  public abstract update(deltaMs: number): void;

  public destroy(): void {
    this.sprite.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncOutline, this);
    this.sprite.destroy();
    for (const o of this.outline) o.destroy();
    this.outline.length = 0;
  }

  protected get x(): number {
    return this.pos.x;
  }

  protected get y(): number {
    return this.pos.y;
  }

  /** Muda a posição de verdade do pet (o desenho acompanha em `syncOutline`). */
  protected setPos(x: number, y: number): void {
    this.pos.x = x;
    this.pos.y = y;
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
      this.playAnim(false, dx);
      return true;
    }
    // Muito longe (heroína correu ou teleportou): acelera para não ficar para trás
    const boost = dist > TALISMAN_BALANCE.pets.leashRange ? 2.5 : 1;
    const step = Math.min(dist - stopAt, speed * boost * (deltaMs / 1000));
    this.pos.x += (dx / dist) * step;
    this.pos.y += (dy / dist) * step;
    this.playAnim(true, dx);
    return false;
  }

  /**
   * Segue um ponto com folga: fica parado enquanto estiver perto e só volta a andar quando
   * o ponto se afasta além de `looseFollow.startPx`; aí anda até ficar a `stopPx`.
   * Sem essa folga o pet anda colado e alterna parado/andando a cada quadro (dá um tranco).
   */
  protected followLoose(tx: number, ty: number, speed: number, deltaMs: number): void {
    const { startPx, stopPx } = TALISMAN_BALANCE.pets.looseFollow;
    this.following = shouldFollow(this.following, Math.hypot(tx - this.x, ty - this.y), startPx, stopPx);
    if (this.following) {
      if (this.moveToward(tx, ty, speed, deltaMs, stopPx)) this.following = false;
    } else {
      this.playAnim(false, 0);
    }
  }

  /** Coloca o pet direto num ponto (pulos e órbitas). */
  protected placeAt(x: number, y: number, moving: boolean, dx: number): void {
    this.setPos(x, y);
    this.playAnim(moving, dx);
  }

  /** Anda ou fica parado e vira para o lado do movimento (só o horizontal decide). */
  protected playAnim(moving: boolean, dx: number): void {
    // Uma folga de 0,5 px evita o pet ficar virando de um lado para o outro quando quase parado
    if (dx > 0.5) this.sprite.setFlipX(false);
    else if (dx < -0.5) this.sprite.setFlipX(true);
    const key = `pet-${this.pet}-${moving ? 'walk' : 'idle'}`;
    if (this.sprite.anims.currentAnim?.key !== key && this.sprite.scene.anims.exists(key)) {
      this.sprite.play(key, true);
    }
  }

  /** Vira para um ponto sem mudar a animação (ex.: ao atirar parada). */
  protected faceToward(x: number): void {
    this.sprite.setFlipX(x < this.x);
  }

  /**
   * Chamar ao fim de `update` para o contorno seguir o quadro, o lado e a posição (também roda
   * sozinho depois da física em cada quadro). Desenha o pet a um número inteiro de pixels de
   * tela da heroína: na tela ele anda junto com ela, sem mudar de fração de pixel a cada quadro.
   */
  protected syncOutline(): void {
    const s = this.sprite;
    if (!s.scene) return;
    const zoom = s.scene.cameras.main.zoom || 1;
    const p = this.ctx.player;
    s.setPosition(snapToScreenGrid(this.pos.x, p.x, zoom), snapToScreenGrid(this.pos.y, p.y, zoom));
    for (let i = 0; i < this.outline.length; i++) {
      const o = this.outline[i];
      const [ox, oy] = OUTLINE_OFFSETS[i];
      o.setPosition(s.x + ox, s.y + oy);
      o.setScale(s.scaleX, s.scaleY);
      o.setFlipX(s.flipX);
      o.setAlpha(s.alpha);
      o.setVisible(s.visible);
      if (o.texture.key !== s.texture.key || o.frame.name !== s.frame.name) o.setTexture(s.texture.key, s.frame.name);
    }
  }
}

import Phaser from 'phaser';
import type { BaseCharacter } from '../characters/BaseCharacter';
import type { BaseEnemy } from '../enemies/BaseEnemy';
import type { SoulBoltWeapon } from '../weapons/SoulBoltWeapon';

/** O que pets e armas únicas usam da cena de jogo. */
export interface ITalismanContext {
  readonly scene: Phaser.Scene;
  readonly player: BaseCharacter;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gemsGroup?: Phaser.GameObjects.Group;
  /** Liga os tiros de um Disparo de Almas extra (Gêmea Sombria) aos monstros. */
  registerSoulBoltOverlap(weapon: SoulBoltWeapon): void;
}

/** Um efeito de talismã ativo: atualizado a cada quadro e destruído no fim da partida. */
export interface TalismanEffect {
  update(deltaMs: number): void;
  destroy(): void;
}

function isHittable(e: BaseEnemy): boolean {
  return e.active && !e.isDead && !e.isInvulnerable;
}

/** Monstro vivo mais perto de (x, y) dentro de `range`, só os que aparecem na tela. */
export function nearestEnemy(ctx: ITalismanContext, x: number, y: number, range: number): BaseEnemy | null {
  const view = ctx.scene.cameras.main?.worldView;
  let best: BaseEnemy | null = null;
  let bestSq = range * range;
  for (const obj of ctx.enemiesGroup.getChildren()) {
    const e = obj as BaseEnemy;
    if (!isHittable(e)) continue;
    if (view && view.width > 0 && !view.contains(e.x, e.y)) continue;
    const dSq = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (dSq < bestSq) {
      bestSq = dSq;
      best = e;
    }
  }
  return best;
}

/** Monstros vivos dentro do círculo. */
export function enemiesInRadius(ctx: ITalismanContext, x: number, y: number, radius: number): BaseEnemy[] {
  const out: BaseEnemy[] = [];
  const rSq = radius * radius;
  for (const obj of ctx.enemiesGroup.getChildren()) {
    const e = obj as BaseEnemy;
    if (!isHittable(e)) continue;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 <= rSq) out.push(e);
  }
  return out;
}

/** Monstros vivos visíveis na tela. */
export function enemiesOnScreen(ctx: ITalismanContext): BaseEnemy[] {
  const view = ctx.scene.cameras.main?.worldView;
  const out: BaseEnemy[] = [];
  for (const obj of ctx.enemiesGroup.getChildren()) {
    const e = obj as BaseEnemy;
    if (!isHittable(e)) continue;
    if (view && view.width > 0 && !view.contains(e.x, e.y)) continue;
    out.push(e);
  }
  return out;
}

/** Dano do talismã com o bônus de dano da heroína (bênçãos e cartas contam). */
export function hitEnemy(ctx: ITalismanContext, enemy: BaseEnemy, baseDamage: number): void {
  enemy.takeDamage(Math.round(baseDamage * (1 + ctx.player.bonusDamagePercent / 100)));
}

import Phaser from 'phaser';
import type { BaseCharacter } from '../../characters/BaseCharacter';
import { SHYLPH_BOSS_BALANCE } from '../../../config/balance';
import { SHYLPH_THEME, BOSS_TELEGRAPH } from '../../../config/theme';
import { SHYLPH_FEATHER_TEXTURE, SHYLPH_TORNADO_TEXTURE, SHYLPH_TORNADO_ANIM } from '../../../systems/ShylphAssets';
import { SHYLPH_TORNADO_SHEET } from '../../../config/shylphFxSheet';
import { tornadoPullSpeed } from '../../../systems/shylphRules';

const FEATHER = SHYLPH_BOSS_BALANCE.feathers;
const TORNADO = SHYLPH_BOSS_BALANCE.tornado;
const ORBIT = SHYLPH_BOSS_BALANCE.orbit;
const BOLT = SHYLPH_BOSS_BALANCE.seraph.bolt;
/** A arte da pena aponta para cima e para a direita (-45°). */
const FEATHER_ART_ANGLE = -Math.PI / 4;
const DEPTH = 21;

type FeatherPhase = 'out' | 'stuck' | 'back';

interface Feather {
  img: Phaser.GameObjects.Image;
  phase: FeatherPhase;
  angle: number;
  traveled: number;
  timer: number;
  /** Cada viagem (ida e volta) acerta a heroína no máximo uma vez. */
  hit: boolean;
}

interface Tornado {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  angle: number;
  speed: number;
  lifeMs: number;
  hitCooldown: number;
}

/** Pena reta e rápida da chuva do Serafim (não crava nem volta). */
interface Bolt {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  lifeMs: number;
}

/** Quem leva o golpe e com que dano (a chefe aplica multiplicadores e a imunidade). */
export type ShylphHitFn = (player: BaseCharacter, baseDamage: number) => void;

/**
 * Projéteis e perigos da Shylph, todos reaproveitados (pool): Penas Cravadas, tornados do
 * Vendaval e o anel de penas da fase 2. Só desenho e colisão; quem decide quando atacar é a chefe.
 */
export class ShylphHazards {
  private readonly feathers: Feather[] = [];
  private readonly tornadoes: Tornado[] = [];
  private readonly bolts: Bolt[] = [];
  private readonly orbit: Phaser.GameObjects.Image[] = [];
  private readonly telegraph: Phaser.GameObjects.Graphics;
  private orbitAngle = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.telegraph = scene.add.graphics().setDepth(DEPTH - 3);
  }

  // ---------------------------------------------------------------------------
  // Penas Cravadas
  // ---------------------------------------------------------------------------

  /** Desenha os trilhos do leque enquanto ela prepara o arremesso. */
  public drawFeatherTelegraph(x: number, y: number, angles: number[], progress: number): void {
    const g = this.telegraph;
    g.clear();
    g.lineStyle(Math.max(1, BOSS_TELEGRAPH.lineThickness(progress) * 0.35), BOSS_TELEGRAPH.color, BOSS_TELEGRAPH.alpha(progress) * 0.7);
    for (const a of angles) {
      g.lineBetween(x, y, x + Math.cos(a) * FEATHER.range, y + Math.sin(a) * FEATHER.range);
    }
  }

  public clearTelegraph(): void {
    this.telegraph.clear();
  }

  public throwFeathers(x: number, y: number, angles: number[]): void {
    this.telegraph.clear();
    for (const angle of angles) {
      const f = this.feathers.find((p) => !p.img.active) ?? this.newFeather();
      f.img.setPosition(x, y).setActive(true).setVisible(true).setAlpha(1).clearTint();
      f.img.setRotation(angle - FEATHER_ART_ANGLE);
      f.angle = angle;
      f.phase = 'out';
      f.traveled = 0;
      f.timer = 0;
      f.hit = false;
    }
  }

  private newFeather(): Feather {
    const img = this.scene.add.image(0, 0, SHYLPH_FEATHER_TEXTURE).setDepth(DEPTH).setScale(1.3);
    const f: Feather = { img, phase: 'out', angle: 0, traveled: 0, timer: 0, hit: false };
    this.feathers.push(f);
    return f;
  }

  private updateFeathers(owner: { x: number; y: number }, player: BaseCharacter, deltaMs: number, hit: ShylphHitFn): void {
    const dt = deltaMs / 1000;
    for (const f of this.feathers) {
      if (!f.img.active) continue;
      const img = f.img;

      if (f.phase === 'out') {
        const step = FEATHER.speed * dt;
        img.x += Math.cos(f.angle) * step;
        img.y += Math.sin(f.angle) * step;
        f.traveled += step;
        if (f.traveled >= FEATHER.range) {
          f.phase = 'stuck';
          f.timer = FEATHER.stuckMs;
          f.hit = false;
        }
      } else if (f.phase === 'stuck') {
        f.timer -= deltaMs;
        // Pisca no fim: aviso de que vai voltar
        const warn = f.timer < FEATHER.stuckMs * 0.45 && Math.floor(f.timer / 90) % 2 === 0;
        if (warn) img.setTint(SHYLPH_THEME.featherWarn);
        else img.clearTint();
        if (f.timer <= 0) {
          f.phase = 'back';
          img.clearTint();
        }
        continue; // Cravada no chão não machuca
      } else {
        const dx = owner.x - img.x;
        const dy = owner.y - img.y;
        const dist = Math.hypot(dx, dy);
        const step = FEATHER.returnSpeed * dt;
        if (dist <= step + 4) {
          img.setActive(false).setVisible(false);
          continue;
        }
        const a = Math.atan2(dy, dx);
        img.x += (dx / dist) * step;
        img.y += (dy / dist) * step;
        img.setRotation(a - FEATHER_ART_ANGLE);
      }

      if (!f.hit && Math.hypot(img.x - player.x, img.y - player.y) <= FEATHER.hitRadius) {
        f.hit = true;
        hit(player, FEATHER.damage);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Vendaval (tornados)
  // ---------------------------------------------------------------------------

  public spawnTornado(x: number, y: number, angle: number, speed: number): void {
    const t = this.tornadoes.find((p) => !p.sprite.active) ?? this.newTornado();
    t.x = x;
    t.y = y;
    t.angle = angle;
    t.speed = speed;
    t.lifeMs = TORNADO.lifeMs;
    t.hitCooldown = 0;
    t.sprite.setPosition(x, y).setActive(true).setVisible(true).setAlpha(0);
    // Cada tornado começa num quadro diferente para não girarem todos iguais
    t.sprite.play({ key: SHYLPH_TORNADO_ANIM, startFrame: Phaser.Math.Between(0, SHYLPH_TORNADO_SHEET.frames - 1) });
  }

  private newTornado(): Tornado {
    // Origem no pé do funil: a posição é o ponto que toca o chão
    const sprite = this.scene.add.sprite(0, 0, SHYLPH_TORNADO_TEXTURE).setOrigin(0.5, 0.95).setScale(TORNADO.artScale).setDepth(DEPTH);
    const t: Tornado = { sprite, x: 0, y: 0, angle: 0, speed: 0, lifeMs: 0, hitCooldown: 0 };
    this.tornadoes.push(t);
    return t;
  }

  private updateTornadoes(player: BaseCharacter, deltaMs: number, hit: ShylphHitFn): void {
    const dt = deltaMs / 1000;
    for (const t of this.tornadoes) {
      if (!t.sprite.active) continue;
      t.lifeMs -= deltaMs;
      if (t.lifeMs <= 0) {
        t.sprite.stop();
        t.sprite.setActive(false).setVisible(false);
        continue;
      }

      // Persegue a heroína corrigindo o rumo aos poucos (dá para driblar com a esquiva)
      const toPlayer = Math.atan2(player.y - t.y, player.x - t.x);
      const diff = Phaser.Math.Angle.Wrap(toPlayer - t.angle);
      const turn = TORNADO.turnRate * dt;
      t.angle += Phaser.Math.Clamp(diff, -turn, turn);
      t.x += Math.cos(t.angle) * t.speed * dt;
      t.y += Math.sin(t.angle) * t.speed * dt;

      // Puxa a heroína para o olho do tornado
      const dx = t.x - player.x;
      const dy = t.y - player.y;
      const dist = Math.hypot(dx, dy);
      const pull = tornadoPullSpeed(dist, TORNADO.pullRadius, TORNADO.pullStrength);
      if (pull > 0 && dist > 1) {
        player.setPosition(player.x + (dx / dist) * pull * dt, player.y + (dy / dist) * pull * dt);
      }

      t.hitCooldown -= deltaMs;
      if (dist <= TORNADO.hitRadius && t.hitCooldown <= 0) {
        t.hitCooldown = TORNADO.hitCooldownMs;
        hit(player, TORNADO.damage);
      }

      // Surge e some em fade (300 ms) e balança um pouco de lado, como vento de verdade
      const age = TORNADO.lifeMs - t.lifeMs;
      t.sprite.setAlpha(Math.min(1, age / 300, t.lifeMs / 300));
      t.sprite.setPosition(t.x, t.y);
      t.sprite.setRotation(Math.sin(age * 0.006) * 0.06);
    }
  }
  // ---------------------------------------------------------------------------
  // Serafim: chuva de penas retas
  // ---------------------------------------------------------------------------

  public fireBolt(x: number, y: number, angle: number): void {
    let b = this.bolts.find((p) => !p.img.active);
    if (!b) {
      b = { img: this.scene.add.image(0, 0, SHYLPH_FEATHER_TEXTURE).setDepth(DEPTH + 1), vx: 0, vy: 0, lifeMs: 0 };
      this.bolts.push(b);
    }
    b.img.setPosition(x, y).setActive(true).setVisible(true).setRotation(angle - FEATHER_ART_ANGLE);
    b.vx = Math.cos(angle) * BOLT.speed;
    b.vy = Math.sin(angle) * BOLT.speed;
    b.lifeMs = BOLT.lifeMs;
  }

  private updateBolts(player: BaseCharacter, deltaMs: number, hit: ShylphHitFn): void {
    const dt = deltaMs / 1000;
    for (const b of this.bolts) {
      if (!b.img.active) continue;
      b.lifeMs -= deltaMs;
      if (b.lifeMs <= 0) {
        b.img.setActive(false).setVisible(false);
        continue;
      }
      b.img.x += b.vx * dt;
      b.img.y += b.vy * dt;
      if (Math.hypot(b.img.x - player.x, b.img.y - player.y) <= BOLT.hitRadius) {
        b.img.setActive(false).setVisible(false);
        hit(player, BOLT.damage);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Fase final: anel de penas girando
  // ---------------------------------------------------------------------------

  public setOrbitActive(active: boolean): void {
    if (active && this.orbit.length === 0) {
      for (let i = 0; i < ORBIT.count; i++) {
        this.orbit.push(this.scene.add.image(0, 0, SHYLPH_FEATHER_TEXTURE).setDepth(DEPTH + 2).setTint(SHYLPH_THEME.orbitTint));
      }
    }
    for (const img of this.orbit) img.setActive(active).setVisible(active);
  }

  private updateOrbit(owner: { x: number; y: number }, player: BaseCharacter, deltaMs: number, hit: ShylphHitFn): void {
    if (this.orbit.length === 0 || !this.orbit[0].active) return;
    this.orbitAngle += ORBIT.spinPerMs * deltaMs;
    const cy = owner.y - 20;
    for (let i = 0; i < this.orbit.length; i++) {
      const a = this.orbitAngle + (Math.PI * 2 * i) / this.orbit.length;
      const img = this.orbit[i];
      img.setPosition(owner.x + Math.cos(a) * ORBIT.radius, cy + Math.sin(a) * ORBIT.radius * 0.8);
      // A ponta da pena segue o giro
      img.setRotation(a + Math.PI / 2 - FEATHER_ART_ANGLE);
      if (Math.hypot(img.x - player.x, img.y - player.y) <= ORBIT.hitRadius) {
        hit(player, ORBIT.damage);
      }
    }
  }

  // ---------------------------------------------------------------------------

  public update(owner: { x: number; y: number }, player: BaseCharacter, deltaMs: number, hit: ShylphHitFn): void {
    this.updateFeathers(owner, player, deltaMs, hit);
    this.updateTornadoes(player, deltaMs, hit);
    this.updateBolts(player, deltaMs, hit);
    this.updateOrbit(owner, player, deltaMs, hit);
  }

  /** Some com tudo o que está em campo (morte falsa, fim da luta). */
  public clearAll(): void {
    this.telegraph.clear();
    for (const f of this.feathers) f.img.setActive(false).setVisible(false);
    for (const b of this.bolts) b.img.setActive(false).setVisible(false);
    for (const t of this.tornadoes) {
      t.sprite.stop();
      t.sprite.setActive(false).setVisible(false);
    }
  }

  public destroy(): void {
    this.telegraph.destroy();
    for (const f of this.feathers) f.img.destroy();
    for (const t of this.tornadoes) t.sprite.destroy();
    for (const b of this.bolts) b.img.destroy();
    for (const img of this.orbit) img.destroy();
    this.feathers.length = 0;
    this.tornadoes.length = 0;
    this.bolts.length = 0;
    this.orbit.length = 0;
  }
}

import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import type { BaseCharacter } from '../characters/BaseCharacter';
import { DarkOrbProjectile } from '../weapons/DarkOrbProjectile';
import { SoundManager } from '../../systems/SoundManager';
import { BOSS_TELEGRAPH, LYN_THEME } from '../../config/theme';
import { ENEMY_BALANCE, LYN_BALANCE } from '../../config/balance';

const B = LYN_BALANCE;

type LynState = 'ORBIT' | 'SWOOP_TELL' | 'SWOOP_DASH' | 'SWOOP_GAP' | 'WINDED' | 'SPIRAL_TELL' | 'SPIRAL_FIRE';

/**
 * Lyn, minichefe súcubo e serva da Rosalin. Luta de escaramuça, diferente da chefe:
 * - rodeia a heroína a meia distância (a Rosalin persegue em linha reta);
 * - Rasante Triplo: três investidas curtas, cada uma com aviso rosa, e depois fica cansada;
 * - Espiral de Orbes: para e solta orbes girando em volta de si (a Rosalin atira em leque).
 * Não tem o salto esmagador: esse é o golpe da senhora dela.
 */
export class LynMiniBoss extends BaseEnemy {
  public isBoss: boolean = true;

  private lynState: LynState = 'ORBIT';
  private stateTimer = 0;
  private swoopCooldown: number = B.swoop.firstCooldownMs;
  private spiralCooldown: number = B.spiral.firstCooldownMs;
  private swoopsLeft = 0;
  private swoopDir = { x: 1, y: 0 };
  private orbitSign = 1;
  private orbitFlipTimer = 0;
  private spiralFired = 0;
  private spiralBaseAngle = 0;
  private hitPlayerThisSwoop = false;

  private telegraph: Phaser.GameObjects.Graphics;
  public projectilesGroup: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'lyn-idle-south');
    this.setDepth(21);
    this.telegraph = scene.add.graphics().setDepth(19);
    this.projectilesGroup = scene.add.group({ classType: DarkOrbProjectile, maxSize: 24, runChildUpdate: false });
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = ENEMY_BALANCE.lyn.hp,
    speed: number = ENEMY_BALANCE.lyn.speed,
    damage: number = ENEMY_BALANCE.lyn.damage,
    scale: number = ENEMY_BALANCE.lyn.scale
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(scale);
    this.lynState = 'ORBIT';
    this.swoopCooldown = B.swoop.firstCooldownMs;
    this.spiralCooldown = B.spiral.firstCooldownMs;
    this.orbitSign = Math.random() < 0.5 ? -1 : 1;
    this.orbitFlipTimer = Phaser.Math.Between(B.orbitFlipMs.min, B.orbitFlipMs.max);
    this.play('lyn-fly-south', true);
    this.fitBody();
  }

  public updateBoss(player: BaseCharacter, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    this.updateProjectiles(player, deltaMs);

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.restoreStateTint();
    }

    switch (this.lynState) {
      case 'ORBIT': this.updateOrbit(player, deltaMs); break;
      case 'SWOOP_TELL': this.updateSwoopTell(player, deltaMs); break;
      case 'SWOOP_DASH': this.updateSwoopDash(player, deltaMs); break;
      case 'SWOOP_GAP': this.updateSwoopGap(player, deltaMs); break;
      case 'WINDED': this.updateWinded(deltaMs); break;
      case 'SPIRAL_TELL': this.updateSpiralTell(player, deltaMs); break;
      case 'SPIRAL_FIRE': this.updateSpiralFire(deltaMs); break;
    }
  }

  // ---------------------------------------------------------------- movimento

  /** Gira em volta da heroína mantendo meia distância; às vezes troca o sentido. */
  private updateOrbit(player: BaseCharacter, deltaMs: number): void {
    this.swoopCooldown -= deltaMs;
    this.spiralCooldown -= deltaMs;
    if (this.swoopCooldown <= 0) { this.startSwoopSequence(player); return; }
    if (this.spiralCooldown <= 0) { this.startSpiral(); return; }

    this.orbitFlipTimer -= deltaMs;
    if (this.orbitFlipTimer <= 0) {
      this.orbitSign *= -1;
      this.orbitFlipTimer = Phaser.Math.Between(B.orbitFlipMs.min, B.orbitFlipMs.max);
    }

    const stunMult = this.updateStunState(deltaMs);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / dist;
    const ny = dy / dist;
    // Puxa para a distância certa (positivo = aproxima) e gira pela tangente
    const pull = Phaser.Math.Clamp((dist - B.orbitDistance) * B.orbitPull, -1, 1);
    const vx = nx * pull + -ny * this.orbitSign * (1 - Math.abs(pull) * 0.5);
    const vy = ny * pull + nx * this.orbitSign * (1 - Math.abs(pull) * 0.5);
    const len = Math.max(0.001, Math.hypot(vx, vy));
    this.setVelocity((vx / len) * this.speed * stunMult, (vy / len) * this.speed * stunMult);
    this.face(Math.atan2(dy, dx));
  }

  // ------------------------------------------------------------ rasante triplo

  private startSwoopSequence(player: BaseCharacter): void {
    this.swoopsLeft = B.swoop.count;
    this.startSwoopTell(player);
  }

  private startSwoopTell(player: BaseCharacter): void {
    this.lynState = 'SWOOP_TELL';
    this.stateTimer = B.swoop.telegraphMs;
    this.setVelocity(0, 0);
    this.aimAt(player);
    this.setTint(LYN_THEME.tellTint);
  }

  private updateSwoopTell(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    if (B.swoop.telegraphMs - this.stateTimer < B.swoop.aimMs) this.aimAt(player);

    const progress = 1 - Math.max(0, this.stateTimer / B.swoop.telegraphMs);
    const g = this.telegraph;
    g.clear();
    const ex = this.x + this.swoopDir.x * B.swoop.lineLength;
    const ey = this.y + this.swoopDir.y * B.swoop.lineLength;
    g.lineStyle(BOSS_TELEGRAPH.lineThickness(progress) * 0.7, LYN_THEME.swoopLine, BOSS_TELEGRAPH.alpha(progress));
    g.lineBetween(this.x, this.y, ex, ey);
    g.lineStyle(BOSS_TELEGRAPH.innerThickness, LYN_THEME.swoopLineInner, BOSS_TELEGRAPH.innerAlpha(progress));
    g.lineBetween(this.x, this.y, ex, ey);

    if (this.stateTimer <= 0) {
      g.clear();
      this.lynState = 'SWOOP_DASH';
      this.stateTimer = B.swoop.dashMs;
      this.hitPlayerThisSwoop = false;
      SoundManager.getInstance().playBossDash();
      this.setVelocity(this.swoopDir.x * B.swoop.speed, this.swoopDir.y * B.swoop.speed);
    }
  }

  private updateSwoopDash(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    if (Math.random() < 0.5) this.spawnGhost();

    if (!this.hitPlayerThisSwoop && Math.hypot(this.x - player.x, this.y - player.y) <= 40) {
      this.hitPlayerThisSwoop = true;
      player.takeDamage(B.swoop.damage);
      this.scene.cameras.main.shake(120, 0.012);
    }

    if (this.stateTimer <= 0) {
      this.setVelocity(0, 0);
      this.swoopsLeft--;
      if (this.swoopsLeft > 0) {
        this.lynState = 'SWOOP_GAP';
        this.stateTimer = B.swoop.gapMs;
      } else {
        // Fim da sequência: cansada, parada e mais frágil
        this.lynState = 'WINDED';
        this.stateTimer = B.swoop.windedMs;
        this.setTint(LYN_THEME.windedTint);
      }
    }
  }

  private updateSwoopGap(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    if (this.stateTimer <= 0) this.startSwoopTell(player);
  }

  private updateWinded(deltaMs: number): void {
    this.stateTimer -= deltaMs;
    this.setVelocity(0, 0);
    if (this.stateTimer <= 0) {
      this.clearTint();
      this.swoopCooldown = B.swoop.cooldownMs;
      this.lynState = 'ORBIT';
    }
  }

  // ------------------------------------------------------------ espiral de orbes

  private startSpiral(): void {
    this.lynState = 'SPIRAL_TELL';
    this.stateTimer = B.spiral.tellMs;
    this.setVelocity(0, 0);
    this.setTint(LYN_THEME.tellTint);
  }

  private updateSpiralTell(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    if (this.stateTimer > 0) return;
    this.clearTint();
    this.lynState = 'SPIRAL_FIRE';
    this.spiralFired = 0;
    this.stateTimer = 0;
    // A espiral começa apontada para a heroína e gira a partir daí
    this.spiralBaseAngle = Math.atan2(player.y - this.y, player.x - this.x);
  }

  private updateSpiralFire(deltaMs: number): void {
    this.stateTimer -= deltaMs;
    while (this.stateTimer <= 0 && this.spiralFired < B.spiral.orbs) {
      this.fireOrb(this.spiralBaseAngle + this.spiralFired * B.spiral.angleStep * this.orbitSign);
      this.spiralFired++;
      this.stateTimer += B.spiral.intervalMs;
    }
    if (this.spiralFired >= B.spiral.orbs) {
      this.spiralCooldown = B.spiral.cooldownMs;
      this.lynState = 'ORBIT';
    }
  }

  private fireOrb(angle: number): void {
    let proj = this.projectilesGroup.getChildren().find((c) => !c.active) as DarkOrbProjectile | undefined;
    if (!proj) {
      if (this.projectilesGroup.isFull()) return;
      proj = new DarkOrbProjectile(this.scene, this.x, this.y);
      this.projectilesGroup.add(proj);
    }
    proj.fire(this.x, this.y, angle, B.spiral.speed, B.spiral.damage);
  }

  private updateProjectiles(player: BaseCharacter, deltaMs: number): void {
    const projs = this.projectilesGroup.getChildren() as DarkOrbProjectile[];
    for (const p of projs) {
      if (!p.active) continue;
      p.updateProjectile(deltaMs);
      if (Math.hypot(p.x - player.x, p.y - player.y) <= 24) p.onHitPlayer(player);
    }
  }

  // ------------------------------------------------------------------- dano e morte

  public override takeDamage(amount: number): void {
    if (this.isDead || !this.active || this.isInvulnerable) return;
    const mult = this.lynState === 'WINDED' ? B.damageTaken.winded : B.damageTaken.normal;
    super.takeDamage(Math.max(1, Math.round(amount * mult)));
  }

  public override die(): void {
    if (this.isDead) return;
    this.isDead = true;
    if (this.telegraph.scene) this.telegraph.destroy();
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.enable = false;

    this.scene.cameras.main.shake(300, 0.02);
    this.scene.cameras.main.flash(220, 255, 255, 255);
    this.setTint(LYN_THEME.deathTint);
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.3,
      scaleY: this.scaleY * 1.3,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        this.emit('boss-defeated');
      }
    });
  }

  /** Removida sem morrer (modo de teste, troca de cena): leva junto o aviso e os orbes. */
  public override destroy(fromScene?: boolean): void {
    if (this.telegraph?.scene) this.telegraph.destroy();
    // Na troca de cena o grupo pode já ter sido destruído pela própria cena
    if (this.projectilesGroup?.children) this.projectilesGroup.clear(true, true);
    super.destroy(fromScene);
  }

  // ---------------------------------------------------------------- utilidades

  /** Depois do flash de golpe, volta à cor do estado (aviso rosa, cansaço cinza). */
  private restoreStateTint(): void {
    if (this.lynState === 'SWOOP_TELL' || this.lynState === 'SPIRAL_TELL') this.setTint(LYN_THEME.tellTint);
    else if (this.lynState === 'WINDED') this.setTint(LYN_THEME.windedTint);
    else this.clearTint();
  }

  private aimAt(player: BaseCharacter): void {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.swoopDir = { x: Math.cos(angle), y: Math.sin(angle) };
    this.face(angle);
  }

  private spawnGhost(): void {
    const ghost = this.scene.add.image(this.x, this.y, this.texture.key, this.frame.name);
    ghost.setScale(this.scaleX, this.scaleY).setTint(LYN_THEME.ghostTint).setAlpha(0.6).setDepth(this.depth - 1);
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
  }

  /** A arte da Lyn só tem voo nos 4 eixos. */
  private face(angleRad: number): void {
    let deg = (angleRad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    const dir = deg >= 45 && deg < 135 ? 'south' : deg >= 135 && deg < 225 ? 'west' : deg >= 225 && deg < 315 ? 'north' : 'east';
    const key = `lyn-fly-${dir}`;
    if (this.anims.currentAnim?.key !== key) {
      this.play(key, true);
      this.fitBody();
    }
  }

  /** Quadros da Lyn: 56px parada, 76px voando. Colisão centrada no corpo. */
  private fitBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(26, 34, false);
    body.setOffset((this.width - 26) / 2, (this.height - 34) / 2 + 4);
  }
}

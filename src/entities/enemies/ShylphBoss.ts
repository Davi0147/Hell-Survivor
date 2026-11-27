import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import type { BaseCharacter } from '../characters/BaseCharacter';
import { ShylphHazards } from './shylph/ShylphHazards';
import { SeraphVolley } from './shylph/SeraphVolley';
import { SoundManager } from '../../systems/SoundManager';
import { SHYLPH_BOSS_BALANCE } from '../../config/balance';
import { SHYLPH_THEME } from '../../config/theme';
import {
  SHYLPH_TEXTURE,
  SHYLPH_SERAPH_TEXTURE,
  SERAPH_FRAME_WINGS_UP,
  SERAPH_FRAME_WINGS_DOWN,
  shylphAnimKey,
  shylphRotationFrame,
} from '../../systems/ShylphAssets';
import {
  pickWalkFacing,
  pickAttackFacing,
  fanAngles,
  phaseFloorHp,
  nextSeraphPattern,
  seraphTeleportPoint,
  seraphFlap,
  type ShylphPhase,
} from '../../systems/shylphRules';
import type { ShylphSheetKey } from '../../config/shylphSheet';
import { SHYLPH_SERAPH_SHEET } from '../../config/shylphFxSheet';

const B = SHYLPH_BOSS_BALANCE;
const S = B.seraph;
/** Respiro depois de cada ataque antes de voltar a andar. */
const RECOVER_MS = 280;
/** Altura da mão em relação aos pés (de onde saem as penas). */
const HAND_OFFSET_Y = -14;
/** Altura do olho do Serafim em relação ao centro do sprite (as penas saem do olho). */
const SERAPH_EYE_OFFSET_Y = (SHYLPH_SERAPH_SHEET.eyeY - SHYLPH_SERAPH_SHEET.frameHeight / 2) * S.artScale;
/** Caixa de colisão de cada forma (em pixels da textura, antes da escala). */
const NORMAL_BODY = { w: 34, h: 56, ox: 49, oy: 52 } as const;
const SERAPH_BODY = { w: 110, h: 120 } as const;
/** Pisca-pisca branco da transformação (ms por troca). */
const WHITE_BLINK_MS = 90;

type ShylphState =
  | 'INTRO'
  | 'CHASE'
  | 'FEATHER_TELL'
  | 'FLAP'
  | 'LICK'
  | 'RECOVER'
  | 'TRANSFORM'
  | 'SERAPH_APPEAR'
  | 'SERAPH_FIRE'
  | 'SERAPH_VANISH'
  | 'SERAPH_HIDDEN'
  | 'COLLAPSE'
  | 'RISING';

/** Estados em que ela não leva dano (transições e Serafim fora de cena). */
const UNTOUCHABLE: ReadonlySet<ShylphState> = new Set<ShylphState>([
  'INTRO',
  'TRANSFORM',
  'SERAPH_APPEAR',
  'SERAPH_VANISH',
  'SERAPH_HIDDEN',
  'COLLAPSE',
  'RISING',
]);

/**
 * Shylph, a Serafim Caída — chefe do Capítulo 3. Três fases pela vida:
 *
 * - **Normal** (100% → 50%): anda como zumbi, Penas Cravadas, Vendaval e lambida de sangue.
 * - **Serafim** (49% → 25%): pisca branca e vira o Serafim; atira chuvas de penas em
 *   padrões, some e reaparece perto da heroína com o padrão seguinte.
 * - **Final** (24% → 0%): o Serafim se desfaz, ela cai de joelhos, levanta rindo e volta
 *   mais rápida, com penas girando em volta e mais penas e tornados.
 *
 * Eventos: `shylph-seraph`, `shylph-collapse`, `shylph-rise`, `shylph-final`, `shylph-lick`
 * e `boss-defeated` (morte de verdade).
 */
export class ShylphBoss extends BaseEnemy {
  public isBoss = true;
  public isInvulnerable = false;
  /** Multiplica o dano dos golpes (revanche). */
  public attackDamageMultiplier = 1;
  /** Multiplica o dano recebido (exaustão em lutas longas). */
  public damageTakenMultiplier = 1;
  public phase: ShylphPhase = 'normal';

  private bossState: ShylphState = 'CHASE';
  private stateTimer = 0;
  private featherCooldown: number = B.feathers.firstCooldownMs;
  private tornadoCooldown: number = B.tornado.firstCooldownMs;
  private lickCooldown: number = B.lick.firstCooldownMs;
  private playerHitCooldown = 0;
  private aimAngles: number[] = [];
  private aimAngle = 0;
  private staggerClock = 0;
  private seraphCycle = 0;
  /** Altura "parada" do Serafim; o bater de asas sobe e desce em volta dela. */
  private seraphAnchorY = 0;
  private flapClock = 0;
  private readonly hazards: ShylphHazards;
  private readonly volley = new SeraphVolley();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, SHYLPH_TEXTURE);
    this.setFrame(shylphRotationFrame('south'));
    this.setScale(B.scale);
    this.setDepth(22);
    this.applyNormalBody();
    this.hazards = new ShylphHazards(scene);
  }

  public override spawn(x: number, y: number, hp: number = B.hp, speed: number = B.speed, damage: number = B.contactDamage, isCinematicIntro = false): void {
    super.spawn(x, y, hp, speed, damage);
    this.phase = 'normal';
    this.setNormalLook();
    this.bossState = isCinematicIntro ? 'INTRO' : 'CHASE';
    this.isInvulnerable = isCinematicIntro;
    this.featherCooldown = B.feathers.firstCooldownMs;
    this.tornadoCooldown = B.tornado.firstCooldownMs;
    this.lickCooldown = B.lick.firstCooldownMs;
    this.playerHitCooldown = 0;
    this.seraphCycle = 0;
    this.hazards.setOrbitActive(false);
    this.play(shylphAnimKey('walk-south'), true);
    this.setBodyEnabled(!isCinematicIntro);
    if (!isCinematicIntro) this.emit('boss-spawned', this.hp, this.maxHp);
  }

  /** Libera a luta depois de uma apresentação (diálogo/cinemática). */
  public startCombat(): void {
    this.isInvulnerable = false;
    this.bossState = 'CHASE';
    this.setBodyEnabled(true);
    this.emit('boss-spawned', this.hp, this.maxHp);
  }

  /** Modo de Teste: pula direto para o começo de uma fase. */
  public skipToPhase(phase: 'seraph' | 'final'): void {
    if (this.isDead) return;
    if (phase === 'seraph' && this.phase === 'normal') {
      this.hp = phaseFloorHp(this.maxHp, 'normal', B.phaseAt);
      this.startTransform();
    } else if (phase === 'final' && this.phase !== 'final') {
      this.phase = 'seraph';
      this.hp = phaseFloorHp(this.maxHp, 'seraph', B.phaseAt);
      this.startCollapse();
    }
    this.emit('boss-hp-changed', this.hp, this.maxHp);
  }

  public updateBoss(player: BaseCharacter, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    this.hazards.update(this, player, deltaMs, this.hitPlayer);
    if (this.playerHitCooldown > 0) this.playerHitCooldown -= deltaMs;
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.restoreTint();
    }

    switch (this.bossState) {
      case 'INTRO':
        this.halt();
        return;
      case 'CHASE':
        this.updateChase(player, deltaMs);
        return;
      case 'FEATHER_TELL':
        this.updateFeatherTell(deltaMs);
        return;
      case 'FLAP':
        this.updateFlap(deltaMs);
        return;
      case 'LICK':
      case 'RECOVER':
        this.halt();
        if (this.tick(deltaMs)) this.bossState = 'CHASE';
        return;
      case 'TRANSFORM':
        this.updateTransform(deltaMs);
        return;
      case 'SERAPH_APPEAR':
      case 'SERAPH_FIRE':
      case 'SERAPH_VANISH':
      case 'SERAPH_HIDDEN':
        this.updateSeraph(player, deltaMs);
        return;
      case 'COLLAPSE':
        this.updateCollapse(deltaMs);
        return;
      case 'RISING':
        this.updateRising(deltaMs);
        return;
    }
  }

  /** Desconta o tempo do estado; `true` quando acabou. */
  private tick(deltaMs: number): boolean {
    this.stateTimer -= deltaMs;
    return this.stateTimer <= 0;
  }

  // ===========================================================================
  // Andar de zumbi e escolha do próximo golpe (fases normal e final)
  // ===========================================================================

  private updateChase(player: BaseCharacter, deltaMs: number): void {
    this.featherCooldown -= deltaMs;
    this.tornadoCooldown -= deltaMs;
    this.lickCooldown -= deltaMs;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);

    if (this.tornadoCooldown <= 0) return this.startFlap(angle);
    if (this.featherCooldown <= 0) return this.startFeatherTell(angle);
    // Na fase final ela não para mais para lamber a mão
    if (this.phase === 'normal' && this.lickCooldown <= 0) return this.startLick(angle);

    // Cambaleando: avança em trancos (rápido, quase para, rápido de novo)
    this.staggerClock += deltaMs;
    const stagger = 0.45 + 0.55 * Math.abs(Math.sin(this.staggerClock * 0.0042));
    const stunMult = this.updateStunState(deltaMs);
    const v = this.speed * stagger * stunMult;
    const sway = Math.sin(this.staggerClock * 0.0021) * 0.35;
    this.setVelocity(Math.cos(angle + sway) * v, Math.sin(angle + sway) * v);

    const facing = pickWalkFacing(angle);
    this.setFlipX(facing.flipX);
    this.playIfNot(shylphAnimKey(`walk-${facing.dir}`));
  }

  private halt(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body?.enable) body.setVelocity(0, 0);
  }

  private setBodyEnabled(enabled: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setVelocity(0, 0);
    body.enable = enabled;
  }

  private face(angle: number, anim: 'throw' | 'flap' | 'lick'): void {
    const facing = pickAttackFacing(angle, anim !== 'lick');
    this.setFlipX(facing.flipX);
    // pickAttackFacing nunca devolve 'south' para a lambida, então a chave sempre existe
    this.play(shylphAnimKey(`${anim}-${facing.dir}` as ShylphSheetKey), true);
  }

  private playIfNot(key: string): void {
    if (this.anims.currentAnim?.key !== key || !this.anims.isPlaying) this.play(key, true);
  }

  private recover(): void {
    this.bossState = 'RECOVER';
    this.stateTimer = RECOVER_MS;
  }

  // ===========================================================================
  // Penas Cravadas
  // ===========================================================================

  private startFeatherTell(angle: number): void {
    this.bossState = 'FEATHER_TELL';
    this.stateTimer = B.feathers.telegraphMs;
    this.halt();
    const final = this.phase === 'final';
    this.aimAngles = fanAngles(angle, final ? B.feathers.finalCount : B.feathers.count, final ? B.feathers.finalSpread : B.feathers.spread);
    this.face(angle, 'throw');
  }

  private updateFeatherTell(deltaMs: number): void {
    this.halt();
    const done = this.tick(deltaMs);
    const progress = 1 - Math.max(0, this.stateTimer / B.feathers.telegraphMs);
    this.hazards.drawFeatherTelegraph(this.x, this.y + HAND_OFFSET_Y, this.aimAngles, progress);
    if (!done) return;
    this.hazards.throwFeathers(this.x, this.y + HAND_OFFSET_Y, this.aimAngles);
    SoundManager.getInstance().playBossDash();
    this.featherCooldown = this.phase === 'final' ? B.feathers.finalCooldownMs : B.feathers.cooldownMs;
    this.recover();
  }

  // ===========================================================================
  // Vendaval
  // ===========================================================================

  private startFlap(angle: number): void {
    this.bossState = 'FLAP';
    this.stateTimer = B.tornado.windupMs;
    this.aimAngle = angle;
    this.halt();
    this.face(angle, 'flap');
  }

  private updateFlap(deltaMs: number): void {
    this.halt();
    if (!this.tick(deltaMs)) return;
    const final = this.phase === 'final';
    const count = final ? B.tornado.finalCount : B.tornado.count;
    const speed = final ? B.tornado.finalSpeed : B.tornado.speed;
    for (const a of fanAngles(this.aimAngle, count, final ? 1.8 : 1.1)) {
      this.hazards.spawnTornado(this.x + Math.cos(a) * 46, this.y + Math.sin(a) * 30, a, speed);
    }
    this.scene.cameras.main.shake(160, 0.006);
    this.tornadoCooldown = final ? B.tornado.finalCooldownMs : B.tornado.cooldownMs;
    this.recover();
  }

  // ===========================================================================
  // Lambida de sangue (janela de dano)
  // ===========================================================================

  private startLick(angle: number): void {
    this.bossState = 'LICK';
    this.stateTimer = B.lick.durationMs;
    this.lickCooldown = B.lick.cooldownMs;
    this.halt();
    this.face(angle, 'lick');
    this.emit('shylph-lick');
  }

  // ===========================================================================
  // Forma de Serafim (49% → 25%)
  // ===========================================================================

  private startTransform(): void {
    this.phase = 'seraph';
    this.bossState = 'TRANSFORM';
    this.stateTimer = S.whiteFlashMs;
    this.hazards.clearAll();
    this.setBodyEnabled(false);
    this.setFlipX(false);
    this.play(shylphAnimKey('flap-south'), true);
    this.scene.cameras.main.shake(300, 0.012);
    this.emit('shylph-seraph');
  }

  private updateTransform(deltaMs: number): void {
    // Fica branca piscando (o mesmo branco do golpe recebido) antes de virar o Serafim
    const blinkOn = Math.floor(this.stateTimer / WHITE_BLINK_MS) % 2 === 0;
    if (blinkOn) this.setTintFill(SHYLPH_THEME.transformWhite);
    else this.clearTint();
    if (!this.tick(deltaMs)) return;
    this.setSeraphLook();
    this.scene.cameras.main.flash(220, 255, 255, 255);
    this.startSeraphCycle(false);
  }

  /** Bater de asas: troca o quadro e sobe/desce o corpo em volta da altura parada. */
  private updateWingbeat(deltaMs: number): void {
    this.flapClock += deltaMs;
    const flap = seraphFlap(this.flapClock, S.flap);
    this.setFrame(flap.wingsDown ? SERAPH_FRAME_WINGS_DOWN : SERAPH_FRAME_WINGS_UP);
    this.y = this.seraphAnchorY + flap.offsetY;
  }

  /** Um ciclo: (some →) reaparece → atira um padrão. */
  private startSeraphCycle(teleport: boolean): void {
    if (teleport) {
      this.bossState = 'SERAPH_VANISH';
      this.stateTimer = S.vanishMs;
      this.setBodyEnabled(false);
      return;
    }
    this.bossState = 'SERAPH_APPEAR';
    this.stateTimer = S.appearMs;
  }

  private updateSeraph(player: BaseCharacter, deltaMs: number): void {
    this.halt();
    this.updateWingbeat(deltaMs);
    const done = this.tick(deltaMs);
    switch (this.bossState) {
      case 'SERAPH_APPEAR':
        this.setAlpha(1 - Math.max(0, this.stateTimer / S.appearMs));
        if (!done) return;
        this.setAlpha(1);
        this.setBodyEnabled(true);
        this.bossState = 'SERAPH_FIRE';
        this.stateTimer = S.fireMs;
        this.volley.start(nextSeraphPattern(this.seraphCycle++), Math.random() * Math.PI * 2);
        return;
      case 'SERAPH_FIRE': {
        const eyeY = this.y + SERAPH_EYE_OFFSET_Y;
        const aim = Math.atan2(player.y - eyeY, player.x - this.x);
        this.volley.update(deltaMs, aim, (a) => this.hazards.fireBolt(this.x, eyeY, a));
        if (done) this.startSeraphCycle(true);
        return;
      }
      case 'SERAPH_VANISH':
        this.setAlpha(Math.max(0, this.stateTimer / S.vanishMs));
        if (!done) return;
        this.setAlpha(0);
        this.bossState = 'SERAPH_HIDDEN';
        this.stateTimer = S.hiddenMs;
        return;
      case 'SERAPH_HIDDEN': {
        if (!done) return;
        const p = seraphTeleportPoint(player.x, player.y, Math.random(), Math.random(), S.teleportMin, S.teleportMax);
        const arena = this.scene as Phaser.Scene & { clampToArena?: (x: number, y: number, margin?: number) => { x: number; y: number } };
        const safe = arena.clampToArena ? arena.clampToArena(p.x, p.y, 80) : p;
        this.setPosition(safe.x, safe.y);
        this.seraphAnchorY = safe.y;
        (this.body as Phaser.Physics.Arcade.Body | null)?.reset(safe.x, safe.y);
        this.startSeraphCycle(false);
        return;
      }
      default:
        return;
    }
  }

  // ===========================================================================
  // Queda de joelhos e fase final (24% → 0%)
  // ===========================================================================

  private startCollapse(): void {
    this.bossState = 'COLLAPSE';
    this.stateTimer = B.collapse.kneelMs;
    this.hazards.clearAll();
    this.setBodyEnabled(false);
    // Volta para a altura parada (o bater de asas mexe o y)
    if (this.texture.key === SHYLPH_SERAPH_TEXTURE) this.y = this.seraphAnchorY;
    this.setNormalLook();
    this.setFlipX(false);
    // O Serafim se desfaz num clarão branco e ela cai de joelhos
    this.setTintFill(SHYLPH_THEME.transformWhite);
    this.hitFlashTimer = S.whiteFlashMs / 2;
    this.play(shylphAnimKey('kneel-south'), true);
    this.scene.cameras.main.shake(300, 0.02);
    this.emit('shylph-collapse');
  }

  private updateCollapse(deltaMs: number): void {
    if (!this.tick(deltaMs)) return;
    this.bossState = 'RISING';
    this.stateTimer = B.collapse.riseMs;
    this.play(shylphAnimKey('rise-south'), true);
    const c = SHYLPH_THEME.riseFlash;
    this.scene.cameras.main.flash(450, c.r, c.g, c.b);
    this.scene.cameras.main.shake(450, 0.018);
    this.emit('shylph-rise');
  }

  private updateRising(deltaMs: number): void {
    if (!this.tick(deltaMs)) return;
    this.phase = 'final';
    this.speed = B.finalSpeed;
    this.featherCooldown = 900;
    this.tornadoCooldown = B.tornado.finalCooldownMs * 0.4;
    this.setBodyEnabled(true);
    this.hazards.setOrbitActive(true);
    this.bossState = 'CHASE';
    this.emit('shylph-final');
  }

  // ===========================================================================
  // Aparência
  // ===========================================================================

  private applyNormalBody(): void {
    // Folha de 132x132: o corpo dela fica no meio-baixo do quadro
    (this.body as Phaser.Physics.Arcade.Body | null)?.setSize(NORMAL_BODY.w, NORMAL_BODY.h).setOffset(NORMAL_BODY.ox, NORMAL_BODY.oy);
  }

  private setNormalLook(): void {
    if (this.texture.key !== SHYLPH_TEXTURE) {
      this.anims.stop();
      this.setTexture(SHYLPH_TEXTURE, shylphRotationFrame('south'));
      this.applyNormalBody();
    }
    this.setScale(B.scale);
    this.setAlpha(1);
    this.clearTint();
  }

  /** Forma de Serafim: olho no meio e muitas asas (2 quadros alternados no bater de asas). */
  private setSeraphLook(): void {
    this.anims.stop();
    this.clearTint();
    this.setFlipX(false);
    this.setTexture(SHYLPH_SERAPH_TEXTURE, SERAPH_FRAME_WINGS_UP);
    this.setScale(S.artScale);
    (this.body as Phaser.Physics.Arcade.Body | null)?.setSize(SERAPH_BODY.w, SERAPH_BODY.h, true);
    this.seraphAnchorY = this.y;
    this.flapClock = 0;
  }

  /** Depois do branco do golpe, volta à cor normal. */
  private restoreTint(): void {
    this.clearTint();
  }

  // ===========================================================================
  // Dano
  // ===========================================================================

  private readonly hitPlayer = (player: BaseCharacter, baseDamage: number): void => {
    if (this.playerHitCooldown > 0) return;
    this.playerHitCooldown = B.playerHitCooldownMs;
    player.takeDamage(Math.max(1, Math.round(baseDamage * this.attackDamageMultiplier)));
  };

  public override takeDamage(amount: number): void {
    if (this.isDead || !this.active || this.isInvulnerable || UNTOUCHABLE.has(this.bossState)) return;
    const mult = this.bossState === 'LICK' ? B.damageTaken.licking : this.phase === 'seraph' ? B.damageTaken.seraph : B.damageTaken.normal;
    super.takeDamage(Math.max(1, Math.round(amount * mult * this.damageTakenMultiplier)));
    if (this.isDead) return;
    this.checkPhaseChange();
    this.emit('boss-hp-changed', Math.max(0, this.hp), this.maxHp);
  }

  /** Troca de fase quando a vida passa do limite (e segura a vida no limite). */
  private checkPhaseChange(): void {
    if (this.phase === 'normal' && this.hp < this.maxHp * B.phaseAt.seraph) {
      this.hp = Math.max(this.hp, phaseFloorHp(this.maxHp, 'normal', B.phaseAt));
      this.startTransform();
    } else if (this.phase === 'seraph' && this.hp < this.maxHp * B.phaseAt.final) {
      this.hp = Math.max(this.hp, phaseFloorHp(this.maxHp, 'seraph', B.phaseAt));
      this.startCollapse();
    }
  }

  public override die(): void {
    if (this.isDead) return;
    // Antes da fase final ela não morre: a vida para no limite e a fase troca
    if (this.phase !== 'final') {
      this.hp = phaseFloorHp(this.maxHp, this.phase, B.phaseAt);
      if (this.phase === 'normal') this.startTransform();
      else this.startCollapse();
      return;
    }
    this.isDead = true;
    this.hazards.clearAll();
    this.hazards.setOrbitActive(false);
    this.setBodyEnabled(false);
    this.scene.cameras.main.shake(350, 0.025);
    this.scene.cameras.main.flash(250, 255, 255, 255);
    this.setFlipX(false);
    this.play(shylphAnimKey('kneel-south'), true);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: 900,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        // Libera penas e tornados já (o corpo dela fica no grupo de inimigos até a cena acabar)
        this.hazards.destroy();
        this.emit('boss-defeated');
      },
    });
  }

  public override destroy(fromScene?: boolean): void {
    this.hazards.destroy();
    super.destroy(fromScene);
  }
}

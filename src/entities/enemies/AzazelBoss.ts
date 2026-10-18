import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { Nixy } from '../characters/Nixy';
import { DarkOrbProjectile } from '../weapons/DarkOrbProjectile';
import { SoundManager } from '../../systems/SoundManager';
import { BOSS_TELEGRAPH } from '../../config/theme';

export type AzazelCombatPhase = 1 | 2 | 3 | 4; // 1: 100->50%, 2: 50->20% (Escuridão), 3: Cristais (Oculto), 4: 20->0% (Showdown Final)

type AzazelState =
  | 'INTRO'
  | 'CHASE'
  | 'TELEGRAPH_DASH'
  | 'DASHING'
  | 'LIGHTNING_STORM'
  | 'SPIRAL_BARRAGE'
  | 'TRANSITIONING'
  | 'DARK_FIVE_DASHES'
  | 'DARK_EIGHT_CLONES'
  | 'CRYSTAL_BANISHED';

interface LightningMarker {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  struck: boolean;
}

/**
 * Clone Espectral de Azazel usado na Fase 2 (8 Azazels ao redor do jogador).
 * Estende BaseEnemy para que todas as armas automáticas e projéteis da Nixy
 * o acertem naturalmente, compartilhando a barra de vida principal do Boss.
 */
export class AzazelPhantomClone extends BaseEnemy {
  public parentBoss: AzazelBoss;
  public cloneAngle: number = 0;
  public isBoss: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, parentBoss: AzazelBoss) {
    super(scene, x, y, 'azazel-idle-south');
    this.parentBoss = parentBoss;
    this.isBoss = true;
    this.maxHp = parentBoss.maxHp;
    this.hp = parentBoss.hp;
    this.speed = 0;
    this.damage = 32;
    this.setScale(1.65);
    this.setDepth(22);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(42, 52);
      body.setOffset(24, 20);
      body.setImmovable(true);
    }
  }

  public activateClone(x: number, y: number, facingAngle: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.isDead = false;
    this.setAlpha(0);
    this.clearTint();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(0, 0);
    }

    this.updatePoseFacing(facingAngle, false);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.95,
      duration: 220,
      ease: 'Quad.easeOut'
    });
  }

  public updatePoseFacing(angleRad: number, raisedHand: boolean): void {
    const dir = AzazelBoss.angleToDir8(angleRad);
    const key = raisedHand ? `azazel-hand-${dir}` : `azazel-idle-${dir}`;
    if (this.anims.currentAnim?.key !== key) {
      this.play(key, true);
    }
  }

  public override takeDamage(amount: number): void {
    if (this.isDead || !this.active || !this.parentBoss || this.parentBoss.isDead) return;

    this.setTintFill(0xffffff);
    this.hitFlashTimer = 90;
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.clearTint();
    });

    // Dano compartilhado diretamente com a barra principal de Azazel
    this.parentBoss.takeSharedCloneDamage(amount);
  }

  public deactivateClone(): void {
    this.isDead = true;
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setVelocity(0, 0);
    }
  }
}

export class AzazelBoss extends BaseEnemy {
  public maxHp: number = 16000;
  public hp: number = 16000;
  public speed: number = 138;
  public damage: number = 42;
  public isBoss: boolean = true;
  public isInvulnerable: boolean = false;
  public combatPhase: AzazelCombatPhase = 1;

  private bossState: AzazelState = 'INTRO';
  private stateTimer: number = 0;

  // Arena delimitada (Fase 1 e Fase 4 Final Showdown)
  public arenaCenter: { x: number; y: number } = { x: 1500, y: 1500 };
  public readonly arenaRadius: number = 680;
  public isArenaRestricted: boolean = false;
  private arenaGraphics!: Phaser.GameObjects.Graphics;

  // Cooldowns da Fase 1 / Fase 4
  private shotCooldown: number = 2200;
  private teleportCooldown: number = 4200;
  private dashCooldown: number = 5200;
  private lightningCooldown: number = 7800;
  private spiralCooldown: number = 11500;

  // Investida Rápida (Rapid Dash)
  private dashTargetVector: { x: number; y: number } = { x: 1, y: 0 };
  private telegraphGraphics!: Phaser.GameObjects.Graphics;
  private readonly DASH_SPEED = 760;
  private readonly DASH_DURATION = 380;

  // Tempestade de Raios (1s de marcação no chão -> queda do raio)
  private lightningMarkers: LightningMarker[] = [];

  // Disparo em Espiral (Mão levantada + tremor)
  private spiralBasePos: { x: number; y: number } = { x: 0, y: 0 };
  private spiralAngle: number = 0;
  private spiralShotTimer: number = 0;

  // Fase 2: Domínio da Escuridão ("AQUI É O MEU MUNDO")
  private darkOverlay?: Phaser.GameObjects.Rectangle;
  private darkDashCount: number = 0;
  private darkDashSubState: 'AIM' | 'DASH' = 'AIM';
  private darkDashStart: { x: number; y: number } = { x: 0, y: 0 };
  private darkDashVector: { x: number; y: number } = { x: 1, y: 0 };
  private phantomClones: AzazelPhantomClone[] = [];
  private darkCloneShotTimer: number = 0;
  private darkSurroundCenter: { x: number; y: number } = { x: 0, y: 0 };

  // Texto acima da cabeça ("SUA ALMA É MINHA!")
  private overheadShoutText?: Phaser.GameObjects.Text;
  private overheadShoutTween?: Phaser.Tweens.Tween;

  // Grupo de projéteis de Azazel
  public projectilesGroup!: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'azazel-idle-south');

    this.setScale(1.65);
    this.setDepth(22);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(42, 52);
      body.setOffset(24, 20);
    }

    this.arenaGraphics = scene.add.graphics();
    this.arenaGraphics.setDepth(7);

    this.telegraphGraphics = scene.add.graphics();
    this.telegraphGraphics.setDepth(21);

    this.projectilesGroup = scene.add.group({
      classType: DarkOrbProjectile,
      maxSize: 90,
      runChildUpdate: false
    });
  }

  public static angleToDir8(angleRad: number): string {
    let deg = (angleRad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    if (deg >= 337.5 || deg < 22.5) return 'east';
    if (deg >= 22.5 && deg < 67.5) return 'south-east';
    if (deg >= 67.5 && deg < 112.5) return 'south';
    if (deg >= 112.5 && deg < 157.5) return 'south-west';
    if (deg >= 157.5 && deg < 202.5) return 'west';
    if (deg >= 202.5 && deg < 247.5) return 'north-west';
    if (deg >= 247.5 && deg < 292.5) return 'north';
    return 'north-east';
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = 16000,
    speed: number = 138,
    damage: number = 42,
    customScale: number = 1.65,
    isCinematicIntro: boolean = false
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(customScale);
    this.combatPhase = 1;
    this.bossState = isCinematicIntro ? 'INTRO' : 'CHASE';
    this.isInvulnerable = isCinematicIntro;
    this.arenaCenter = { x, y };
    this.isArenaRestricted = !isCinematicIntro;
    this.lightningMarkers = [];

    this.shotCooldown = 1800;
    this.teleportCooldown = 3600;
    this.dashCooldown = 4800;
    this.lightningCooldown = 6800;
    this.spiralCooldown = 10200;

    this.play('azazel-idle-south', true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = !isCinematicIntro;
      body.setVelocity(0, 0);
    }

    if (!this.arenaGraphics || !this.arenaGraphics.scene) {
      this.arenaGraphics = this.scene.add.graphics();
      this.arenaGraphics.setDepth(7);
    }
    if (!this.telegraphGraphics || !this.telegraphGraphics.scene) {
      this.telegraphGraphics = this.scene.add.graphics();
      this.telegraphGraphics.setDepth(21);
    }

    if (!isCinematicIntro) {
      this.emit('boss-spawned', this.hp, this.maxHp);
    }
  }

  /**
   * Acionado exatamente quando o mid.mp3 (~2s) começa a tocar após o último loop da intro.mp3:
   * Azazel ergue a mão (Rise Hand) e grita acima da cabeça em destaque: "SUA ALMA É MINHA!"
   */
  public playMidPrepareScream(player?: Nixy): void {
    if (this.isDead) return;

    let dir = 'south';
    if (player) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      dir = AzazelBoss.angleToDir8(angle);
    }
    this.play(`azazel-hand-${dir}`, true);

    this.scene.cameras.main.shake(320, 0.014);
    SoundManager.getInstance().playDialogueVoice('azazel');

    // Aura carmesim pulsante ao erguer a mão
    const aura = this.scene.add.circle(this.x, this.y, 24, 0xff0044, 0.75);
    aura.setDepth(this.depth - 1);
    aura.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: aura,
      radius: 170,
      alpha: 0,
      duration: 950,
      ease: 'Cubic.easeOut',
      onComplete: () => aura.destroy()
    });

    this.clearOverheadShout();
    this.overheadShoutText = this.scene.add.text(this.x, this.y - 82, 'SUA ALMA É MINHA!', {
      fontFamily: "'Cinzel', Georgia, serif",
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#ff1a4b',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#ff0044',
        blur: 16,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(35).setScale(0.3);

    this.overheadShoutTween = this.scene.tweens.add({
      targets: this.overheadShoutText,
      scaleX: 1.12,
      scaleY: 1.12,
      y: this.y - 94,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!this.overheadShoutText || !this.overheadShoutText.scene) return;
        this.overheadShoutTween = this.scene.tweens.add({
          targets: this.overheadShoutText,
          x: { from: this.x - 3, to: this.x + 3 },
          duration: 55,
          yoyo: true,
          repeat: -1
        });
      }
    });
  }

  private clearOverheadShout(): void {
    if (this.overheadShoutTween) {
      this.overheadShoutTween.stop();
      this.overheadShoutTween = undefined;
    }
    if (this.overheadShoutText && this.overheadShoutText.scene) {
      this.overheadShoutText.destroy();
      this.overheadShoutText = undefined;
    }
  }

  /**
   * Inicia o combate real sincronizado com a entrada de fight.mp3
   */
  public startCombat(): void {
    this.clearOverheadShout();
    this.isInvulnerable = false;
    this.bossState = 'CHASE';
    this.combatPhase = 1;
    this.arenaCenter = { x: this.x, y: this.y };
    this.isArenaRestricted = true;
    this.clearTint();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
    this.emit('boss-spawned', this.hp, this.maxHp);
  }

  public getPhantomClones(): AzazelPhantomClone[] {
    return this.phantomClones;
  }

  public updateBoss(player: Nixy, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Atualiza texto flutuante se estiver visível
    if (this.overheadShoutText && this.overheadShoutText.active) {
      this.overheadShoutText.setY(this.y - 90);
    }

    // Atualiza projéteis disparados por Azazel e seus clones
    const projs = this.projectilesGroup.getChildren() as DarkOrbProjectile[];
    for (let i = 0; i < projs.length; i++) {
      const p = projs[i];
      if (p.active) {
        p.updateProjectile(deltaMs);
        if (Math.hypot(p.x - player.x, p.y - player.y) <= 22) {
          p.onHitPlayer(player);
        }
      }
    }

    // Atualiza marcadores de raio no chão (1 segundo de aviso antes da queda)
    this.updateLightningMarkers(player, deltaMs);

    // Desenha e aplica limite da Arena Delimitada (Fase 1 e Fase 4)
    this.updateArenaBarrier(player);

    if (this.bossState === 'INTRO' || this.bossState === 'TRANSITIONING' || this.bossState === 'CRYSTAL_BANISHED') {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) body.setVelocity(0, 0);
      return;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        this.clearTint();
      }
    }

    // =========================================================================
    // LÓGICA DA FASE 2: DOMÍNIO DA ESCURIDÃO (50% -> 20% HP)
    // =========================================================================
    if (this.combatPhase === 2) {
      if (this.bossState === 'DARK_FIVE_DASHES') {
        this.updateDarkFiveDashes(player, deltaMs);
      } else if (this.bossState === 'DARK_EIGHT_CLONES') {
        this.updateDarkEightClones(player, deltaMs);
      }
      return;
    }

    // =========================================================================
    // LÓGICA DA FASE 1 (100% -> 50%) E FASE 4 SHOWDOWN FINAL (20% -> 0%)
    // =========================================================================
    const speedFactor = this.combatPhase === 4 ? 1.2 : 1.0;

    if (this.bossState === 'CHASE') {
      this.shotCooldown -= deltaMs * speedFactor;
      this.teleportCooldown -= deltaMs * speedFactor;
      this.dashCooldown -= deltaMs * speedFactor;
      this.lightningCooldown -= deltaMs * speedFactor;
      this.spiralCooldown -= deltaMs * speedFactor;

      if (this.spiralCooldown <= 0) {
        this.startSpiralBarrage(player);
        return;
      }
      if (this.lightningCooldown <= 0) {
        this.startLightningStorm(player);
        return;
      }
      if (this.dashCooldown <= 0) {
        this.startTelegraphDash(player);
        return;
      }
      if (this.teleportCooldown <= 0) {
        this.performTacticalTeleport(player);
        return;
      }
      if (this.shotCooldown <= 0) {
        this.fireDirectedBurst(player);
        return;
      }

      this.chasePlayer(player, deltaMs);
    } else if (this.bossState === 'TELEGRAPH_DASH') {
      this.updateTelegraphDash(player, deltaMs);
    } else if (this.bossState === 'DASHING') {
      this.updateDashing(player, deltaMs);
    } else if (this.bossState === 'LIGHTNING_STORM') {
      this.updateLightningStormState(player, deltaMs);
    } else if (this.bossState === 'SPIRAL_BARRAGE') {
      this.updateSpiralBarrage(player, deltaMs);
    }
  }

  // =========================================================================
  // BARREIRA DA ARENA DELIMITADA AO REDOR DO SPAWN DE AZAZEL
  // =========================================================================
  private updateArenaBarrier(player: Nixy): void {
    if (!this.arenaGraphics || !this.arenaGraphics.scene) return;
    this.arenaGraphics.clear();

    if (!this.isArenaRestricted || this.combatPhase === 2 || this.combatPhase === 3) {
      return;
    }

    const cx = this.arenaCenter.x;
    const cy = this.arenaCenter.y;
    const r = this.arenaRadius;
    const pulse = 0.55 + Math.sin(this.scene.time.now * 0.005) * 0.2;

    // Anel externo sombrio
    this.arenaGraphics.lineStyle(10, 0x3b0414, 0.45);
    this.arenaGraphics.strokeCircle(cx, cy, r + 4);

    // Anel rúnico carmesim principal
    this.arenaGraphics.lineStyle(3.5, 0xff0044, pulse);
    this.arenaGraphics.strokeCircle(cx, cy, r);

    // Sub-anel interno pontilhado/fino
    this.arenaGraphics.lineStyle(1.5, 0xff7799, pulse * 0.6);
    this.arenaGraphics.strokeCircle(cx, cy, r - 10);

    // Restringe o jogador dentro da arena de luta
    const dx = player.x - cx;
    const dy = player.y - cy;
    const dist = Math.hypot(dx, dy);
    const maxPlayerDist = r - 24;
    if (dist > maxPlayerDist && dist > 0) {
      const angle = Math.atan2(dy, dx);
      player.setPosition(
        cx + Math.cos(angle) * maxPlayerDist,
        cy + Math.sin(angle) * maxPlayerDist
      );
    }

    // Mantém Azazel também dentro da arena
    const bdx = this.x - cx;
    const bdy = this.y - cy;
    const bdist = Math.hypot(bdx, bdy);
    if (bdist > r - 30 && bdist > 0) {
      const bangle = Math.atan2(bdy, bdx);
      this.setPosition(
        cx + Math.cos(bangle) * (r - 30),
        cy + Math.sin(bangle) * (r - 30)
      );
    }
  }

  // =========================================================================
  // PERSEGUIÇÃO PADRÃO E ANIMAÇÃO DE CORRIDA (8 DIREÇÕES)
  // =========================================================================
  private chasePlayer(player: Nixy, deltaMs: number): void {
    const stunMult = this.updateStunState(deltaMs);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 12) {
      const angle = Math.atan2(dy, dx);
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(
          Math.cos(angle) * this.speed * stunMult,
          Math.sin(angle) * this.speed * stunMult
        );
      }
      this.updateRunAnimation(angle);
    }
  }

  private updateRunAnimation(angleRad: number): void {
    const dir = AzazelBoss.angleToDir8(angleRad);
    const animKey = `azazel-run-${dir}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  private updateHandAnimation(angleRad: number): void {
    const dir = AzazelBoss.angleToDir8(angleRad);
    const animKey = `azazel-hand-${dir}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  private updateIdleAnimation(angleRad: number): void {
    const dir = AzazelBoss.angleToDir8(angleRad);
    const animKey = `azazel-idle-${dir}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }

  // =========================================================================
  // GOLPE 1: DISPARO DIRECIONADO NA DIREÇÃO DO JOGADOR
  // =========================================================================
  private fireDirectedBurst(player: Nixy): void {
    this.shotCooldown = 2700;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const baseAngle = Math.atan2(dy, dx);
    this.updateHandAnimation(baseAngle);

    // 4 disparos rápidos em sequência + pequeno leque
    const spreads = [0, -0.14, 0.14, 0];
    spreads.forEach((offset, idx) => {
      this.scene.time.delayedCall(idx * 95, () => {
        if (!this.active || this.isDead || this.combatPhase === 2 || this.combatPhase === 3) return;
        const curAngle = Math.atan2(player.y - this.y, player.x - this.x) + offset;
        this.spawnAzazelOrb(this.x, this.y, curAngle, 320, 30);
      });
    });
  }

  public spawnAzazelOrb(x: number, y: number, angle: number, speed: number, dmg: number): void {
    let proj = this.projectilesGroup.getChildren().find(
      (child) => !child.active
    ) as DarkOrbProjectile | undefined;

    if (!proj) {
      proj = new DarkOrbProjectile(this.scene, x, y);
      this.projectilesGroup.add(proj);
    }

    SoundManager.getInstance().playAzazelOrbShoot();
    proj.fire(x, y, angle, speed, dmg, 'azazel-orb');
  }

  // =========================================================================
  // GOLPE 2: TELEPORTE TÁTICO PARA PRÓXIMO DO JOGADOR (MIND-GAME)
  // =========================================================================
  private performTacticalTeleport(player: Nixy): void {
    this.teleportCooldown = 4600;
    SoundManager.getInstance().playAzazelTeleport();

    // Deixa miragem sombria na posição anterior
    const mirage = this.scene.add.image(this.x, this.y, this.texture.key);
    mirage.setScale(this.scaleX, this.scaleY);
    mirage.setTint(0xff0044);
    mirage.setAlpha(0.75);
    mirage.setDepth(this.depth - 1);
    this.scene.tweens.add({
      targets: mirage,
      alpha: 0,
      scaleX: this.scaleX * 1.25,
      scaleY: this.scaleY * 1.25,
      duration: 300,
      onComplete: () => mirage.destroy()
    });

    // Escolhe posição próxima ao jogador (200px de distância), respeitando a arena
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 205;
    let targetX = player.x + Math.cos(angle) * dist;
    let targetY = player.y + Math.sin(angle) * dist;

    if (this.isArenaRestricted) {
      const dx = targetX - this.arenaCenter.x;
      const dy = targetY - this.arenaCenter.y;
      const d = Math.hypot(dx, dy);
      if (d > this.arenaRadius - 40) {
        const a = Math.atan2(dy, dx);
        targetX = this.arenaCenter.x + Math.cos(a) * (this.arenaRadius - 40);
        targetY = this.arenaCenter.y + Math.sin(a) * (this.arenaRadius - 40);
      }
    }

    this.setPosition(targetX, targetY);
    const faceAngle = Math.atan2(player.y - this.y, player.x - this.x);
    this.updateHandAnimation(faceAngle);

    // Dispara 3 orbes em leque logo após surgir de surpresa
    this.scene.time.delayedCall(180, () => {
      if (!this.active || this.isDead || this.combatPhase === 2 || this.combatPhase === 3) return;
      const a = Math.atan2(player.y - this.y, player.x - this.x);
      [-0.22, 0, 0.22].forEach((off) => {
        this.spawnAzazelOrb(this.x, this.y, a + off, 300, 28);
      });
    });
  }

  // =========================================================================
  // GOLPE 3: AVANÇO RÁPIDO NA DIREÇÃO DO JOGADOR (RAPID DASH)
  // =========================================================================
  private startTelegraphDash(player: Nixy): void {
    this.bossState = 'TELEGRAPH_DASH';
    this.stateTimer = 650; // Mira rápida de 0.65s

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.dashTargetVector = { x: Math.cos(angle), y: Math.sin(angle) };
    this.updateRunAnimation(angle);
    this.setTint(0xff2255);
  }

  private updateTelegraphDash(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    if (this.stateTimer > 220) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.dashTargetVector = { x: Math.cos(angle), y: Math.sin(angle) };
      this.updateRunAnimation(angle);
    }

    const progress = 1 - Math.max(0, this.stateTimer / 650);
    const g = this.telegraphGraphics;
    g.clear();

    const lineLength = 560;
    const endX = this.x + this.dashTargetVector.x * lineLength;
    const endY = this.y + this.dashTargetVector.y * lineLength;

    g.lineStyle(BOSS_TELEGRAPH.lineThickness(progress), BOSS_TELEGRAPH.color, BOSS_TELEGRAPH.alpha(progress));
    g.lineBetween(this.x, this.y, endX, endY);
    g.lineStyle(BOSS_TELEGRAPH.innerThickness, BOSS_TELEGRAPH.innerColor, BOSS_TELEGRAPH.innerAlpha(progress));
    g.lineBetween(this.x, this.y, endX, endY);

    if (this.stateTimer <= 0) {
      g.clear();
      this.bossState = 'DASHING';
      this.stateTimer = this.DASH_DURATION;
      SoundManager.getInstance().playBossDash();

      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(
          this.dashTargetVector.x * this.DASH_SPEED,
          this.dashTargetVector.y * this.DASH_SPEED
        );
      }
      this.scene.cameras.main.shake(130, 0.011);
    }
  }

  private updateDashing(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    if (Math.random() < 0.55) {
      const ghost = this.scene.add.image(this.x, this.y, this.texture.key);
      ghost.setScale(this.scaleX, this.scaleY);
      ghost.setTint(0xff0044);
      ghost.setAlpha(0.65);
      ghost.setDepth(this.depth - 1);
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 200,
        onComplete: () => ghost.destroy()
      });
    }

    if (Math.hypot(this.x - player.x, this.y - player.y) <= 44) {
      player.takeDamage(46);
      this.scene.cameras.main.shake(170, 0.016);
      this.endDash();
      return;
    }

    if (this.stateTimer <= 0) {
      this.endDash();
    }
  }

  private endDash(): void {
    this.telegraphGraphics.clear();
    this.clearTint();
    this.dashCooldown = 4800;
    this.bossState = 'CHASE';
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);
  }

  // =========================================================================
  // GOLPE 4: TEMPESTADE DE RAIOS (LEVANTA A MÃO -> MARCA O CHÃO -> 1S DEPOIS CAI)
  // =========================================================================
  private startLightningStorm(player: Nixy): void {
    this.bossState = 'LIGHTNING_STORM';
    this.stateTimer = 1150;
    this.lightningCooldown = 8200;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.updateHandAnimation(angle);
    SoundManager.getInstance().playDialogueVoice('azazel');

    // Marca 7 pontos no chão: 1 diretamente sob o jogador e 6 ao redor
    const numStrikes = 7;
    for (let i = 0; i < numStrikes; i++) {
      let tx = player.x;
      let ty = player.y;
      if (i > 0) {
        const a = (i / (numStrikes - 1)) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.25, 0.25);
        const r = Phaser.Math.Between(95, 250);
        tx = player.x + Math.cos(a) * r;
        ty = player.y + Math.sin(a) * r;
      }
      this.lightningMarkers.push({
        x: tx,
        y: ty,
        timer: 1000, // Exatamente 1 segundo antes do raio cair!
        maxTimer: 1000,
        struck: false
      });
    }
  }

  private updateLightningStormState(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.updateHandAnimation(angle);

    if (this.stateTimer <= 0) {
      this.bossState = 'CHASE';
    }
  }

  private updateLightningMarkers(player: Nixy, deltaMs: number): void {
    if (this.lightningMarkers.length === 0) return;

    this.telegraphGraphics.clear();
    const radius = 68;

    for (let i = this.lightningMarkers.length - 1; i >= 0; i--) {
      const m = this.lightningMarkers[i];
      m.timer -= deltaMs;
      const progress = Phaser.Math.Clamp(1 - m.timer / m.maxTimer, 0, 1);

      if (m.timer > 0) {
        // Círculo de aviso no chão preenchendo em 1 segundo
        this.telegraphGraphics.fillStyle(BOSS_TELEGRAPH.circleFillColor, BOSS_TELEGRAPH.circleFillAlpha(progress));
        this.telegraphGraphics.fillCircle(m.x, m.y, radius * progress);

        this.telegraphGraphics.lineStyle(BOSS_TELEGRAPH.circleBorderThickness(progress), BOSS_TELEGRAPH.circleBorderColor, 0.85);
        this.telegraphGraphics.strokeCircle(m.x, m.y, radius);

        // Mira interna elétrica
        this.telegraphGraphics.lineStyle(BOSS_TELEGRAPH.crosshairThickness, BOSS_TELEGRAPH.innerColor, 0.5 + progress * 0.5);
        this.telegraphGraphics.lineBetween(m.x - 14, m.y, m.x + 14, m.y);
        this.telegraphGraphics.lineBetween(m.x, m.y - 14, m.x, m.y + 14);
      } else if (!m.struck) {
        m.struck = true;
        this.triggerLightningBoltImpact(m.x, m.y, radius, player);
        this.lightningMarkers.splice(i, 1);
      }
    }
  }

  private triggerLightningBoltImpact(x: number, y: number, radius: number, player: Nixy): void {
    SoundManager.getInstance().playAzazelLightningStrike();
    this.scene.cameras.main.shake(150, 0.012);

    // Raio vertical caindo do céu no ponto marcado
    if (this.scene.textures.exists('azazel-lightning-bolt')) {
      const bolt = this.scene.add.image(x, y - 110, 'azazel-lightning-bolt');
      bolt.setDepth(28);
      bolt.setScale(1.25, 1.35);
      bolt.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: bolt,
        alpha: 0,
        scaleX: 0.3,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => bolt.destroy()
      });
    }

    // Clarão circular no chão
    const flashCircle = this.scene.add.circle(x, y, radius, 0xff2a6d, 0.85);
    flashCircle.setDepth(20);
    flashCircle.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flashCircle,
      scale: 1.25,
      alpha: 0,
      duration: 280,
      onComplete: () => flashCircle.destroy()
    });

    // Dano se o jogador estiver no raio de impacto
    if (Math.hypot(player.x - x, player.y - y) <= radius) {
      player.takeDamage(48);
    }
  }

  // =========================================================================
  // GOLPE 5: BARRAGEM EM ESPIRAL (LEVANTA A MÃO + FICA TREMENDO + ATIRA EM ESPIRAL)
  // =========================================================================
  private startSpiralBarrage(player: Nixy): void {
    this.bossState = 'SPIRAL_BARRAGE';
    this.stateTimer = 2600; // 2.6 segundos tremendo e disparando em espiral
    this.spiralCooldown = 12000;
    this.spiralBasePos = { x: this.x, y: this.y };
    this.spiralAngle = Math.atan2(player.y - this.y, player.x - this.x);
    this.spiralShotTimer = 0;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    this.updateHandAnimation(this.spiralAngle);
  }

  private updateSpiralBarrage(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    this.spiralShotTimer -= deltaMs;

    // Tremor intenso no lugar com a mão levantada
    const shakeX = Math.sin(this.scene.time.now * 0.09) * 5.5;
    const shakeY = Math.cos(this.scene.time.now * 0.11) * 4.0;
    this.setPosition(this.spiralBasePos.x + shakeX, this.spiralBasePos.y + shakeY);

    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
    this.updateHandAnimation(angleToPlayer);

    // Dispara 2 braços de espiral a cada 115ms girando 360 graus ao redor dele
    if (this.spiralShotTimer <= 0) {
      this.spiralShotTimer = 115;
      this.spiralAngle += 0.36;
      this.spawnAzazelOrb(this.spiralBasePos.x, this.spiralBasePos.y, this.spiralAngle, 265, 26);
      this.spawnAzazelOrb(this.spiralBasePos.x, this.spiralBasePos.y, this.spiralAngle + Math.PI, 265, 26);
    }

    if (this.stateTimer <= 0) {
      this.setPosition(this.spiralBasePos.x, this.spiralBasePos.y);
      this.bossState = 'CHASE';
    }
  }

  // =========================================================================
  // TRANSIÇÃO E FASE 2: "AQUI É O MEU MUNDO" (50% -> 20% HP NA ESCURIDÃO)
  // =========================================================================
  public triggerPhase2DarknessDomain(player: Nixy): void {
    this.combatPhase = 2;
    this.bossState = 'TRANSITIONING';
    this.isInvulnerable = true;
    this.isArenaRestricted = false;
    this.arenaGraphics.clear();
    this.telegraphGraphics.clear();
    this.lightningMarkers = [];
    this.deactivateAllProjectiles();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    // 1. Azazel some, jogador fica travado e frase aparece no meio da tela: "AQUI É O MEU MUNDO"
    SoundManager.getInstance().playAzazelTeleport();
    this.setVisible(false);
    this.emit('azazel-lock-player', true);
    this.emit('azazel-center-phrase', 'AQUI É O MEU MUNDO', 2100);

    // 2. Após a frase, Azazel aparece colado ao lado do jogador
    this.scene.time.delayedCall(2100, () => {
      if (this.isDead) return;
      SoundManager.getInstance().playAzazelTeleport();
      this.setPosition(player.x + 64, player.y);
      this.setVisible(true);
      this.setAlpha(1);
      this.clearTint();
      this.updateHandAnimation(Math.PI); // Olhando para o jogador à esquerda

      this.scene.cameras.main.shake(240, 0.015);

      // 3. Em 650ms: a tela apaga (ambiente totalmente preto, só vê a Nixy e os ataques de Azazel), HUD some e música aumenta!
      this.scene.time.delayedCall(650, () => {
        if (this.isDead) return;
        this.activatePitchBlackOverlay();
        SoundManager.getInstance().boostCurrentMusicVolume(1.35);
        this.emit('azazel-darkness-active', true);
        this.emit('azazel-lock-player', false);

        // Inicia o ciclo da Fase 2: 5 avanços rápidos seguidos de 8 clones atirando por 10s
        this.startDarkFiveDashes(player);
      });
    });
  }

  private activatePitchBlackOverlay(): void {
    if (!this.darkOverlay || !this.darkOverlay.scene) {
      // Cobre todo o mapa (depth 14 fica acima do chão e objetos de cenário, mas abaixo da Nixy depth 20 e Azazel depth 22)
      this.darkOverlay = this.scene.add.rectangle(0, 0, 12000, 12000, 0x000000, 1);
      this.darkOverlay.setDepth(14);
    }
    this.darkOverlay.setVisible(true);
    this.darkOverlay.setAlpha(1);
  }

  private deactivatePitchBlackOverlay(): void {
    if (this.darkOverlay && this.darkOverlay.scene) {
      this.darkOverlay.setVisible(false);
    }
  }

  private startDarkFiveDashes(player: Nixy): void {
    if (this.isDead || this.combatPhase !== 2) return;
    this.deactivatePhantomClones();

    this.bossState = 'DARK_FIVE_DASHES';
    this.darkDashCount = 0;
    this.isInvulnerable = false;
    this.spawnNextDarkPhantomDash(player);
  }

  private spawnNextDarkPhantomDash(player: Nixy): void {
    if (this.isDead || this.combatPhase !== 2) return;

    this.darkDashCount++;
    if (this.darkDashCount > 5) {
      // No final da 5ª vez: aparecem 8 dele ao redor do jogador atirando por 10 segundos!
      this.startDarkEightClones(player);
      return;
    }

    // Aparece em um lado ao redor do jogador (um de cada vez)
    const angleAround = (this.darkDashCount * ((Math.PI * 2) / 5)) + Phaser.Math.FloatBetween(-0.3, 0.3);
    const spawnDist = 290;
    const sx = Phaser.Math.Clamp(player.x + Math.cos(angleAround) * spawnDist, -3020, 3020);
    const sy = Phaser.Math.Clamp(player.y + Math.sin(angleAround) * spawnDist, -3020, 3020);

    this.setPosition(sx, sy);
    this.setVisible(true);
    this.setAlpha(1);
    this.clearTint();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(0, 0);
    }

    const aimAngle = Math.atan2(player.y - sy, player.x - sx);
    this.darkDashStart = { x: sx, y: sy };
    this.darkDashVector = { x: Math.cos(aimAngle), y: Math.sin(aimAngle) };
    this.updateRunAnimation(aimAngle);

    SoundManager.getInstance().playAzazelTeleport();
    this.darkDashSubState = 'AIM';
    this.stateTimer = 360; // Linha projetada muito rápida (0.36s)
  }

  private updateDarkFiveDashes(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    if (this.darkDashSubState === 'AIM') {
      // Atualiza mira nos primeiros 180ms
      if (this.stateTimer > 180) {
        const aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.darkDashVector = { x: Math.cos(aimAngle), y: Math.sin(aimAngle) };
        this.updateRunAnimation(aimAngle);
      }

      const progress = 1 - Math.max(0, this.stateTimer / 360);
      this.telegraphGraphics.clear();
      const endX = this.x + this.darkDashVector.x * 620;
      const endY = this.y + this.darkDashVector.y * 620;

      this.telegraphGraphics.lineStyle(BOSS_TELEGRAPH.lineThickness(progress), BOSS_TELEGRAPH.color, BOSS_TELEGRAPH.alpha(progress));
      this.telegraphGraphics.lineBetween(this.x, this.y, endX, endY);
      this.telegraphGraphics.lineStyle(BOSS_TELEGRAPH.innerThickness, BOSS_TELEGRAPH.innerColor, BOSS_TELEGRAPH.innerAlpha(progress));
      this.telegraphGraphics.lineBetween(this.x, this.y, endX, endY);

      if (this.stateTimer <= 0) {
        this.telegraphGraphics.clear();
        this.darkDashSubState = 'DASH';
        this.stateTimer = 250; // Avanço relâmpago (0.25s)
        SoundManager.getInstance().playBossDash();

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.setVelocity(this.darkDashVector.x * 1120, this.darkDashVector.y * 1120);
        }
      }
    } else if (this.darkDashSubState === 'DASH') {
      // Rastro fantasma no escuro
      const ghost = this.scene.add.image(this.x, this.y, this.texture.key);
      ghost.setScale(this.scaleX, this.scaleY);
      ghost.setTint(0xff0044);
      ghost.setAlpha(0.7);
      ghost.setDepth(this.depth - 1);
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 160,
        onComplete: () => ghost.destroy()
      });

      if (Math.hypot(this.x - player.x, this.y - player.y) <= 42) {
        player.takeDamage(38);
        this.scene.cameras.main.shake(140, 0.014);
      }

      if (this.stateTimer <= 0) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) body.setVelocity(0, 0);
        this.setVisible(false);
        this.scene.time.delayedCall(90, () => {
          this.spawnNextDarkPhantomDash(player);
        });
        this.stateTimer = 9999; // Aguarda delayedCall
      }
    }
  }

  private startDarkEightClones(player: Nixy): void {
    if (this.isDead || this.combatPhase !== 2) return;

    this.bossState = 'DARK_EIGHT_CLONES';
    this.stateTimer = 10000; // 10 segundos!
    this.darkCloneShotTimer = 450;
    this.telegraphGraphics.clear();
    this.darkSurroundCenter = { x: player.x, y: player.y };

    SoundManager.getInstance().playAzazelTeleport();
    this.scene.cameras.main.shake(200, 0.012);

    const radius = 320;
    // O próprio Azazel ocupa o índice 0 do círculo de 8; os outros 7 são AzazelPhantomClone com HP compartilhado
    const pos0X = this.darkSurroundCenter.x + Math.cos(0) * radius;
    const pos0Y = this.darkSurroundCenter.y + Math.sin(0) * radius;
    this.setPosition(pos0X, pos0Y);
    this.setVisible(true);
    this.setAlpha(1);
    this.clearTint();
    this.isInvulnerable = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(0, 0);
    }
    this.updateHandAnimation(Math.atan2(player.y - pos0Y, player.x - pos0X));

    // Garante que temos 7 clones instanciados e registrados no grupo de inimigos da cena
    this.ensurePhantomClonesCreated();

    for (let i = 0; i < 7; i++) {
      const angle = ((i + 1) / 8) * (Math.PI * 2);
      const cx = this.darkSurroundCenter.x + Math.cos(angle) * radius;
      const cy = this.darkSurroundCenter.y + Math.sin(angle) * radius;
      const clone = this.phantomClones[i];
      clone.cloneAngle = angle;
      clone.activateClone(cx, cy, Math.atan2(player.y - cy, player.x - cx));
    }
  }

  private ensurePhantomClonesCreated(): void {
    while (this.phantomClones.length < 7) {
      const clone = new AzazelPhantomClone(this.scene, this.x, this.y, this);
      clone.deactivateClone();
      this.phantomClones.push(clone);
      this.emit('azazel-clone-created', clone);
    }
  }

  private deactivatePhantomClones(): void {
    for (const clone of this.phantomClones) {
      if (clone) clone.deactivateClone();
    }
  }

  private updateDarkEightClones(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    this.darkCloneShotTimer -= deltaMs;

    // Mantém os 8 Azazels acompanhando suavemente o centro ao redor do jogador para que não fiquem fora da tela
    this.darkSurroundCenter.x = Phaser.Math.Linear(this.darkSurroundCenter.x, player.x, 0.035);
    this.darkSurroundCenter.y = Phaser.Math.Linear(this.darkSurroundCenter.y, player.y, 0.035);

    const radius = 320;
    const baseSpin = (10000 - this.stateTimer) * 0.00035;

    // Posição 0 (Azazel principal)
    const a0 = baseSpin;
    this.setPosition(
      this.darkSurroundCenter.x + Math.cos(a0) * radius,
      this.darkSurroundCenter.y + Math.sin(a0) * radius
    );
    this.updateHandAnimation(Math.atan2(player.y - this.y, player.x - this.x));

    // Posições 1..7 (Clones)
    for (let i = 0; i < this.phantomClones.length; i++) {
      const clone = this.phantomClones[i];
      if (!clone.active) continue;
      const a = baseSpin + ((i + 1) / 8) * (Math.PI * 2);
      clone.setPosition(
        this.darkSurroundCenter.x + Math.cos(a) * radius,
        this.darkSurroundCenter.y + Math.sin(a) * radius
      );
      clone.updatePoseFacing(Math.atan2(player.y - clone.y, player.x - clone.x), true);
    }

    // Disparos coordenados dos 8 Azazels em direção ao jogador durante os 10 segundos
    if (this.darkCloneShotTimer <= 0) {
      this.darkCloneShotTimer = 580;

      // Escolhe 3 dos 8 Azazels por salva para atirar na direção do jogador
      const allShooters: { x: number; y: number }[] = [{ x: this.x, y: this.y }];
      for (const c of this.phantomClones) {
        if (c.active) allShooters.push({ x: c.x, y: c.y });
      }
      Phaser.Utils.Array.Shuffle(allShooters);
      const selected = allShooters.slice(0, 3);
      for (const s of selected) {
        const shotAngle = Math.atan2(player.y - s.y, player.x - s.x);
        this.spawnAzazelOrb(s.x, s.y, shotAngle, 265, 25);
      }
    }

    // Ao final dos 10 segundos, se ainda não chegou a 20% de vida, volta para os 5 avanços rápidos!
    if (this.stateTimer <= 0) {
      this.deactivatePhantomClones();
      this.startDarkFiveDashes(player);
    }
  }

  // =========================================================================
  // TRANSIÇÃO E FASE 3: "SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ" (20% HP -> CHAO2 + 3 CRISTAIS)
  // =========================================================================
  public triggerPhase3CorruptedDimension(player: Nixy): void {
    this.combatPhase = 3;
    this.bossState = 'TRANSITIONING';
    this.isInvulnerable = true;
    this.telegraphGraphics.clear();
    this.lightningMarkers = [];
    this.deactivatePhantomClones();
    this.deactivateAllProjectiles();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    // 1. Azazel some, jogador fica travado e frase aparece no centro da tela
    SoundManager.getInstance().playAzazelTeleport();
    this.setVisible(false);
    this.emit('azazel-lock-player', true);
    this.emit('azazel-center-phrase', 'SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ', 2400);

    // 2. Aparece atrás do jogador de novo
    this.scene.time.delayedCall(2400, () => {
      if (this.isDead) return;
      SoundManager.getInstance().playAzazelTeleport();
      this.setPosition(player.x, player.y - 62);
      this.setVisible(true);
      this.setAlpha(1);
      this.clearTint();
      this.updateHandAnimation(Math.PI / 2);
      this.scene.cameras.main.shake(260, 0.016);

      // 3. Teleporta para o outro mapa com chao2, restaura HUD e inicia o desafio dos 3 Cristais de Azazel!
      this.scene.time.delayedCall(700, () => {
        if (this.isDead) return;
        this.deactivatePitchBlackOverlay();
        SoundManager.getInstance().boostCurrentMusicVolume(1.0);

        this.bossState = 'CRYSTAL_BANISHED';
        this.setVisible(false);
        this.emit('azazel-darkness-active', false);
        this.emit('azazel-lock-player', false);
        this.emit('azazel-phase3-dimension-start');
      });
    });
  }

  /**
   * Acionado quando o jogador captura os 3 Cristais de Azazel na dimensão chao2:
   * A tela treme e Azazel reaparece com os 20% de vida restantes e os golpes da Fase 1!
   */
  public resumeFinalShowdown(spawnX: number, spawnY: number, player: Nixy): void {
    if (this.isDead) return;

    this.combatPhase = 4;
    this.bossState = 'CHASE';
    this.isInvulnerable = false;
    this.setPosition(spawnX, spawnY);
    this.arenaCenter = { x: spawnX, y: spawnY };
    this.isArenaRestricted = true;
    this.setVisible(true);
    this.setAlpha(1);
    this.clearTint();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(0, 0);
    }

    this.shotCooldown = 1400;
    this.teleportCooldown = 3000;
    this.dashCooldown = 3800;
    this.lightningCooldown = 5500;
    this.spiralCooldown = 8500;

    SoundManager.getInstance().playAzazelTeleport();
    this.playMidPrepareScream(player);
    this.scene.time.delayedCall(1500, () => {
      this.clearOverheadShout();
    });
  }

  private deactivateAllProjectiles(): void {
    const projs = this.projectilesGroup.getChildren() as DarkOrbProjectile[];
    for (const p of projs) {
      if (p.active) p.deactivate();
    }
  }

  // =========================================================================
  // GESTÃO DE DANO E TRANSIÇÕES DE FASE (50% E 20% HP)
  // =========================================================================
  public takeSharedCloneDamage(amount: number): void {
    this.takeDamage(amount);
  }

  public override takeDamage(amount: number): void {
    if (
      this.isDead ||
      !this.active ||
      this.isInvulnerable ||
      this.bossState === 'INTRO' ||
      this.bossState === 'TRANSITIONING' ||
      this.bossState === 'CRYSTAL_BANISHED'
    ) {
      return;
    }

    const mitigated = Math.max(1, Math.round(amount * 0.85));
    const phase2Threshold = Math.ceil(this.maxHp * 0.50); // 8,000 HP
    const phase3Threshold = Math.ceil(this.maxHp * 0.20); // 3,200 HP

    // Se está na Fase 1 e o dano cruzaria 50% de vida, trava em 50% e dispara a Fase 2 ("AQUI É O MEU MUNDO")
    if (this.combatPhase === 1 && this.hp - mitigated <= phase2Threshold) {
      this.hp = phase2Threshold;
      this.emit('boss-hp-changed', this.hp, this.maxHp);
      const player = (this.scene as any).player as Nixy;
      if (player) {
        this.triggerPhase2DarknessDomain(player);
      }
      return;
    }

    // Se está na Fase 2 e o dano cruzaria 20% de vida, trava em 20% e dispara a Fase 3 ("SUA POBRE ALMA FRÁGIL...")
    if (this.combatPhase === 2 && this.hp - mitigated <= phase3Threshold) {
      this.hp = phase3Threshold;
      this.emit('boss-hp-changed', this.hp, this.maxHp);
      const player = (this.scene as any).player as Nixy;
      if (player) {
        this.triggerPhase3CorruptedDimension(player);
      }
      return;
    }

    super.takeDamage(mitigated);
    this.emit('boss-hp-changed', this.hp, this.maxHp);
  }

  public override die(): void {
    if (this.isDead) return;
    this.isDead = true;

    this.clearOverheadShout();
    this.deactivatePitchBlackOverlay();
    this.deactivatePhantomClones();
    this.deactivateAllProjectiles();

    if (this.arenaGraphics && this.arenaGraphics.scene) {
      this.arenaGraphics.destroy();
    }
    if (this.telegraphGraphics && this.telegraphGraphics.scene) {
      this.telegraphGraphics.destroy();
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;

    this.scene.cameras.main.shake(450, 0.026);
    this.scene.cameras.main.flash(280, 255, 255, 255);

    this.setTint(0xff0044);
    this.scene.tweens.add({
      targets: this,
      scaleX: 2.3,
      scaleY: 2.3,
      alpha: 0,
      duration: 750,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        this.emit('boss-defeated');
      }
    });
  }
}

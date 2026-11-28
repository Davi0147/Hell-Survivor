import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import type { BaseCharacter } from '../characters/BaseCharacter';
import { DarkOrbProjectile, type ProjectileLook } from '../weapons/DarkOrbProjectile';
import { AzazelHandSlam } from './AzazelHandSlam';
import { AzazelSkullRingArena } from './AzazelSkullRingArena';
import { SoundManager } from '../../systems/SoundManager';
import { BOSS_TELEGRAPH } from '../../config/theme';
import { AZAZEL_BOSS_BALANCE } from '../../config/balance';

export type AzazelCombatPhase = 1 | 2 | 3 | 4; // 1: 100->50%, 2: 50->20% (Escuridão), 3: Cristais (Oculto), 4: 20->0% (Showdown Final)

type AzazelState =
  | 'INTRO'
  | 'CHASE'
  | 'TELEGRAPH_DASH'
  | 'DASHING'
  | 'LIGHTNING_STORM'
  | 'SPIRAL_BARRAGE'
  | 'FEATHER_FAN'
  | 'HALO_WAVE'
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

/** Onda da Auréola Partida: anel que cresce a partir de onde ele estava. */
interface HaloWave {
  x: number;
  y: number;
  elapsedMs: number;
  hasHit: boolean;
}

/** O que o Azazel precisa da cena para dividir a imunidade curta da heroína com o contato. */
interface IPlayerHitScene {
  isPlayerInvulnerable?: boolean;
  grantInvulnerability?: (ms: number) => void;
}

const ART = AZAZEL_BOSS_BALANCE.projectileArt;
/** Orbe desenhada por código (BootScene): reserva quando a arte de um golpe não carregou. */
const ORB_LOOK: ProjectileLook = { texture: 'azazel-orb', scale: 1, originX: 0.5, spinPerMs: 0 };

export const SKULL_CLOSED_TEXTURE = 'azazel-skull-closed';
export const SKULL_OPEN_TEXTURE = 'azazel-skull-open';

/** Caveira olhando para a heroína (a arte olha para a direita); boca aberta enquanto cospe. */
function applySkullPose(skull: Phaser.Physics.Arcade.Sprite, targetX: number, mouthOpen: boolean): void {
  const key = mouthOpen ? SKULL_OPEN_TEXTURE : SKULL_CLOSED_TEXTURE;
  if (skull.texture.key !== key) skull.setTexture(key);
  skull.setFlipX(targetX < skull.x);
}

function applySkullHitbox(skull: Phaser.Physics.Arcade.Sprite): void {
  const body = skull.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;
  const hb = AZAZEL_BOSS_BALANCE.darkSkulls.hitbox;
  body.setSize(hb.width, hb.height);
  body.setOffset(hb.offsetX, hb.offsetY);
}

/**
 * Caveira da Fase 2 (roda de 8 caveiras ao redor da heroína; o Azazel é uma delas).
 * Estende BaseEnemy para que todas as armas automáticas e projéteis da Nixy
 * a acertem naturalmente, compartilhando a barra de vida principal do Boss.
 */
export class AzazelPhantomClone extends BaseEnemy {
  public parentBoss: AzazelBoss;
  public cloneAngle: number = 0;
  public isBoss: boolean = true;
  /** Tempo restante com a boca aberta (ms). */
  public mouthOpenMs: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, parentBoss: AzazelBoss) {
    super(scene, x, y, SKULL_CLOSED_TEXTURE);
    this.parentBoss = parentBoss;
    this.isBoss = true;
    this.maxHp = parentBoss.maxHp;
    this.hp = parentBoss.hp;
    this.speed = 0;
    // Mesmo multiplicador do pai (inclui o +10% do balanço e a revanche)
    this.damage = Math.max(1, Math.round(AZAZEL_BOSS_BALANCE.cloneContactDamage * parentBoss.attackDamageMultiplier));
    this.setScale(AZAZEL_BOSS_BALANCE.darkSkulls.scale);
    this.setDepth(22);

    applySkullHitbox(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setImmovable(true);
  }

  public activateClone(x: number, y: number, facingAngle: number, scale: number = AZAZEL_BOSS_BALANCE.darkSkulls.scale): void {
    this.setScale(scale);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.isDead = false;
    this.setAlpha(0);
    this.clearTint();
    this.mouthOpenMs = 0;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(0, 0);
    }

    this.updateSkullPose(x + Math.cos(facingAngle), 0);

    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 220,
      ease: 'Quad.easeOut'
    });
  }

  /** Vira para a heroína e fecha a boca quando o tempo de cuspir acaba. */
  public updateSkullPose(targetX: number, deltaMs: number): void {
    this.mouthOpenMs = Math.max(0, this.mouthOpenMs - deltaMs);
    applySkullPose(this, targetX, this.mouthOpenMs > 0);
  }

  public openMouth(): void {
    this.mouthOpenMs = AZAZEL_BOSS_BALANCE.darkSkulls.mouthOpenMs;
    applySkullPose(this, this.flipX ? this.x - 1 : this.x + 1, true);
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
  public maxHp: number = AZAZEL_BOSS_BALANCE.maxHp;
  public hp: number = AZAZEL_BOSS_BALANCE.maxHp;
  public speed: number = AZAZEL_BOSS_BALANCE.speed;
  public damage: number = AZAZEL_BOSS_BALANCE.baseContactDamage;
  public isBoss: boolean = true;
  public isInvulnerable: boolean = false;
  public combatPhase: AzazelCombatPhase = 1;
  /** Multiplica o dano dos golpes (revanche). */
  public attackDamageMultiplier: number = 1;
  /** Multiplica o dano recebido (exaustão em lutas longas). */
  public damageTakenMultiplier: number = 1;

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
  private featherCooldown: number = AZAZEL_BOSS_BALANCE.featherFan.firstCooldownMs;
  private haloCooldown: number = AZAZEL_BOSS_BALANCE.haloWave.firstCooldownMs;

  // Leque de Penas (cone no chão -> rajada de penas)
  private featherAngle: number = 0;

  // Auréola Partida (anéis que se expandem)
  private haloWaves: HaloWave[] = [];
  private haloWavesToSpawn: number = 0;
  private haloGraphics!: Phaser.GameObjects.Graphics;

  // Dash da escuridão: cada passada acerta uma vez só
  private darkDashHasHit: boolean = false;

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
  /** Arena parada da roda: a heroína não sai, encostar na borda fere e joga para o centro. */
  private skullRingArena: AzazelSkullRingArena;
  // Na roda de caveiras o próprio Azazel vira uma delas
  private isSkullForm: boolean = false;
  private skullMouthOpenMs: number = 0;
  private scaleBeforeSkull: number = AZAZEL_BOSS_BALANCE.scale;

  // Fase dos cristais: a mão gigante bate onde a heroína está
  private handSlam: AzazelHandSlam;

  // Duelo final: duas caveiras giram em volta dele e atiram alternando
  private finalSkullsActive: boolean = false;
  private finalSkullClockMs: number = 0;
  private finalSkullShotTimer: number = 0;
  private finalSkullTurn: number = 0;

  // Texto acima da cabeça ("SUA ALMA É MINHA!")

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

    this.haloGraphics = scene.add.graphics();
    this.haloGraphics.setDepth(21);

    this.projectilesGroup = scene.add.group({
      classType: DarkOrbProjectile,
      maxSize: 90,
      runChildUpdate: false
    });

    this.handSlam = new AzazelHandSlam(scene, (player, damage) => this.hitPlayer(player, this.scaleAttack(damage)));
    this.skullRingArena = new AzazelSkullRingArena(scene);
  }

  /**
   * Liga/desliga a arena da roda e avisa a luta (câmera travada no centro enquanto ela existe).
   * Evento `azazel-skull-ring`: centro e zoom ao começar, `null` ao acabar.
   */
  private setSkullRingArena(center: { x: number; y: number } | null): void {
    if (center) {
      this.skullRingArena.start(center.x, center.y);
      this.emit('azazel-skull-ring', center);
    } else if (this.skullRingArena.isActive) {
      this.skullRingArena.stop();
      this.emit('azazel-skull-ring', null);
    }
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
    hp: number = AZAZEL_BOSS_BALANCE.maxHp,
    speed: number = AZAZEL_BOSS_BALANCE.speed,
    damage: number = AZAZEL_BOSS_BALANCE.baseContactDamage,
    customScale: number = AZAZEL_BOSS_BALANCE.scale,
    isCinematicIntro: boolean = false
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(customScale);
    this.isSkullForm = false;
    this.setFlipX(false);
    this.stopFinalSkulls();
    this.handSlam.stop();
    this.combatPhase = 1;
    this.attackDamageMultiplier = 1;
    this.damageTakenMultiplier = 1;
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
    this.featherCooldown = AZAZEL_BOSS_BALANCE.featherFan.firstCooldownMs;
    this.haloCooldown = AZAZEL_BOSS_BALANCE.haloWave.firstCooldownMs;
    this.haloWaves = [];
    this.haloWavesToSpawn = 0;

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
    if (!this.haloGraphics || !this.haloGraphics.scene) {
      this.haloGraphics = this.scene.add.graphics();
      this.haloGraphics.setDepth(21);
    }

    if (!isCinematicIntro) {
      this.emit('boss-spawned', this.hp, this.maxHp);
    }
  }

  /**
   * Acionado exatamente quando o mid.mp3 (~2s) começa a tocar após o último loop da intro.mp3:
   * Azazel ergue a mão (Rise Hand) e grita acima da cabeça em destaque: "SUA ALMA É MINHA!"
   */
  public playMidPrepareScream(player?: BaseCharacter): void {
    if (this.isDead) return;

    let dir = 'south';
    if (player) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      dir = AzazelBoss.angleToDir8(angle);
    }
    this.play(`azazel-hand-${dir}`, true);

    // A voz e o tremor vêm junto com a frase central (azazel-center-phrase)

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

    // O grito vai para o centro da tela (camada da HUD), como as outras frases dele. Escrito
    // sobre a cabeça dele no mundo, ficava atrás da barra de vida do chefe e não dava para ler.
    this.emit('azazel-center-phrase', 'SUA ALMA É MINHA!', 1900);
  }

  /**
   * Inicia o combate real sincronizado com a entrada de fight.mp3
   */
  public startCombat(): void {
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

  public updateBoss(player: BaseCharacter, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Atualiza projéteis disparados por Azazel e seus clones
    const projs = this.projectilesGroup.getChildren() as DarkOrbProjectile[];
    for (let i = 0; i < projs.length; i++) {
      const p = projs[i];
      if (p.active) {
        p.updateProjectile(deltaMs);
        if (p.active && Math.hypot(p.x - player.x, p.y - player.y) <= 22) {
          // A orbe some ao encostar; só machuca se a heroína não estiver na imunidade curta
          if (this.hitPlayer(player, p.damage)) this.scene.cameras.main.shake(100, 0.008);
          p.deactivate();
        }
      }
    }

    // Atualiza marcadores de raio no chão (1 segundo de aviso antes da queda)
    this.updateLightningMarkers(player, deltaMs);

    // Ondas da Auréola Partida continuam crescendo mesmo depois que ele volta a andar
    this.updateHaloWaves(player, deltaMs);

    // Desenha e aplica limite da Arena Delimitada (Fase 1 e Fase 4)
    this.updateArenaBarrier(player);

    // Banido na fase dos cristais: só a mão gigante age
    if (this.bossState === 'CRYSTAL_BANISHED') this.handSlam.update(player, deltaMs);

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
    if (this.finalSkullsActive) this.updateFinalSkulls(player, deltaMs);

    const speedFactor = this.combatPhase === 4 ? 1.2 : 1.0;

    if (this.bossState === 'CHASE') {
      this.shotCooldown -= deltaMs * speedFactor;
      this.teleportCooldown -= deltaMs * speedFactor;
      this.dashCooldown -= deltaMs * speedFactor;
      this.lightningCooldown -= deltaMs * speedFactor;
      this.spiralCooldown -= deltaMs * speedFactor;
      this.featherCooldown -= deltaMs * speedFactor;
      if (this.isHaloUnlocked()) this.haloCooldown -= deltaMs * speedFactor;

      if (this.isHaloUnlocked() && this.haloCooldown <= 0 && this.haloWaves.length === 0) {
        this.startHaloWave(player);
        return;
      }
      if (this.spiralCooldown <= 0) {
        this.startSpiralBarrage(player);
        return;
      }
      if (this.featherCooldown <= 0) {
        this.startFeatherFan(player);
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
    } else if (this.bossState === 'FEATHER_FAN') {
      this.updateFeatherFan(player, deltaMs);
    } else if (this.bossState === 'HALO_WAVE') {
      this.updateHaloChannel(player, deltaMs);
    }
  }

  // =========================================================================
  // DANO NA HEROÍNA: TODO GOLPE DELE PASSA POR AQUI
  // =========================================================================
  /**
   * Aplica um golpe já com o multiplicador. Respeita a esquiva e a imunidade curta da
   * heroína (a mesma do contato com monstros), e abre essa imunidade ao acertar: dois
   * golpes nunca somam no mesmo instante. Devolve se acertou.
   */
  private hitPlayer(player: BaseCharacter, damage: number): boolean {
    if (player.isDashInvulnerable) return false;
    const scene = this.scene as Phaser.Scene & IPlayerHitScene;
    if (scene.isPlayerInvulnerable) return false;
    player.takeDamage(damage);
    scene.grantInvulnerability?.(AZAZEL_BOSS_BALANCE.playerHitCooldownMs);
    return true;
  }

  // =========================================================================
  // GOLPE NOVO: LEQUE DE PENAS (CONE NO CHÃO -> RAJADA DE PENAS NEGRAS)
  // =========================================================================
  private startFeatherFan(player: BaseCharacter): void {
    const cfg = AZAZEL_BOSS_BALANCE.featherFan;
    this.bossState = 'FEATHER_FAN';
    this.stateTimer = cfg.telegraphMs;
    this.featherCooldown = cfg.cooldownMs;
    this.featherAngle = Math.atan2(player.y - this.y, player.x - this.x);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);
    this.updateHandAnimation(this.featherAngle);
    SoundManager.getInstance().playAzazelTeleport();
  }

  private updateFeatherFan(player: BaseCharacter, deltaMs: number): void {
    const cfg = AZAZEL_BOSS_BALANCE.featherFan;
    this.stateTimer -= deltaMs;

    // Segue a heroína até faltar `lockMs`; depois trava para dar tempo de sair do cone
    if (this.stateTimer > cfg.lockMs) {
      this.featherAngle = Math.atan2(player.y - this.y, player.x - this.x);
      this.updateHandAnimation(this.featherAngle);
    }

    const progress = Phaser.Math.Clamp(1 - this.stateTimer / cfg.telegraphMs, 0, 1);
    const g = this.telegraphGraphics;
    g.clear();
    const a0 = this.featherAngle - cfg.coneHalfAngle;
    const a1 = this.featherAngle + cfg.coneHalfAngle;
    g.fillStyle(BOSS_TELEGRAPH.circleFillColor, BOSS_TELEGRAPH.circleFillAlpha(progress));
    g.beginPath();
    g.slice(this.x, this.y, cfg.coneLength * (0.35 + 0.65 * progress), a0, a1, false);
    g.fillPath();
    g.lineStyle(BOSS_TELEGRAPH.circleBorderThickness(progress), BOSS_TELEGRAPH.circleBorderColor, 0.85);
    g.beginPath();
    g.slice(this.x, this.y, cfg.coneLength, a0, a1, false);
    g.strokePath();

    if (this.stateTimer <= 0) {
      g.clear();
      for (let i = 0; i < cfg.feathers; i++) {
        const t = i / Math.max(1, cfg.feathers - 1);
        const angle = a0 + (a1 - a0) * t;
        this.spawnAzazelProjectile(this.x, this.y, angle, cfg.speed, cfg.damage, ART.feather);
      }
      this.scene.cameras.main.shake(140, 0.01);
      this.bossState = 'CHASE';
    }
  }

  // =========================================================================
  // GOLPE NOVO: AURÉOLA PARTIDA (ANEL QUE SE EXPANDE; ATRAVESSE COM A ESQUIVA)
  // =========================================================================
  /** Abaixo de uma fração da vida (e sempre na fase final). */
  private isHaloUnlocked(): boolean {
    if (this.combatPhase === 4) return true;
    return this.combatPhase === 1 && this.hp / this.maxHp <= AZAZEL_BOSS_BALANCE.haloWave.hpFraction;
  }

  private startHaloWave(player: BaseCharacter): void {
    const cfg = AZAZEL_BOSS_BALANCE.haloWave;
    this.bossState = 'HALO_WAVE';
    this.stateTimer = cfg.telegraphMs;
    this.haloCooldown = cfg.cooldownMs;
    this.haloWavesToSpawn = this.combatPhase === 4 ? cfg.finalPhaseWaves : 1;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);
    this.updateHandAnimation(Math.atan2(player.y - this.y, player.x - this.x));
    SoundManager.getInstance().playDialogueVoice('azazel');
  }

  /** Ele fica parado com a mão erguida enquanto a auréola carrega e solta as ondas. */
  private updateHaloChannel(player: BaseCharacter, deltaMs: number): void {
    const cfg = AZAZEL_BOSS_BALANCE.haloWave;
    this.stateTimer -= deltaMs;
    this.updateHandAnimation(Math.atan2(player.y - this.y, player.x - this.x));

    if (this.stateTimer <= 0 && this.haloWavesToSpawn > 0) {
      this.haloWavesToSpawn--;
      this.haloWaves.push({ x: this.x, y: this.y, elapsedMs: 0, hasHit: false });
      SoundManager.getInstance().playAzazelLightningStrike();
      this.scene.cameras.main.shake(180, 0.012);
      this.stateTimer = this.haloWavesToSpawn > 0 ? cfg.waveGapMs : 0;
    }
    if (this.stateTimer <= 0 && this.haloWavesToSpawn === 0) {
      this.bossState = 'CHASE';
    }
  }

  private updateHaloWaves(player: BaseCharacter, deltaMs: number): void {
    const cfg = AZAZEL_BOSS_BALANCE.haloWave;
    const g = this.haloGraphics;
    if (!g || !g.scene) return;
    g.clear();

    // Carregando: anel pulsando em volta dele
    if (this.bossState === 'HALO_WAVE' && this.haloWavesToSpawn > 0) {
      const charge = Phaser.Math.Clamp(1 - this.stateTimer / cfg.telegraphMs, 0, 1);
      g.lineStyle(3 + charge * 5, BOSS_TELEGRAPH.circleBorderColor, 0.5 + charge * 0.5);
      g.strokeCircle(this.x, this.y, cfg.startRadius + Math.sin(this.scene.time.now * 0.02) * 4);
      g.lineStyle(BOSS_TELEGRAPH.innerThickness, BOSS_TELEGRAPH.innerColor, charge);
      g.strokeCircle(this.x, this.y, cfg.startRadius * (0.5 + charge * 0.5));
    }

    for (let i = this.haloWaves.length - 1; i >= 0; i--) {
      const w = this.haloWaves[i];
      w.elapsedMs += deltaMs;
      const t = w.elapsedMs / cfg.expandMs;
      if (t >= 1) {
        this.haloWaves.splice(i, 1);
        continue;
      }
      const radius = cfg.startRadius + (cfg.endRadius - cfg.startRadius) * t;
      g.lineStyle(cfg.thickness, BOSS_TELEGRAPH.circleFillColor, 0.35 * (1 - t) + 0.25);
      g.strokeCircle(w.x, w.y, radius);
      g.lineStyle(4, BOSS_TELEGRAPH.innerColor, 1 - t * 0.5);
      g.strokeCircle(w.x, w.y, radius);

      if (!w.hasHit) {
        const dist = Math.hypot(player.x - w.x, player.y - w.y);
        if (Math.abs(dist - radius) <= cfg.thickness / 2 + 10 && this.hitPlayer(player, this.scaleAttack(cfg.damage))) {
          w.hasHit = true;
          this.scene.cameras.main.shake(160, 0.014);
        }
      }
    }
  }

  private clearHaloWaves(): void {
    this.haloWaves = [];
    this.haloWavesToSpawn = 0;
    if (this.haloGraphics && this.haloGraphics.scene) this.haloGraphics.clear();
  }

  // =========================================================================
  // BARREIRA DA ARENA DELIMITADA AO REDOR DO SPAWN DE AZAZEL
  // =========================================================================
  private updateArenaBarrier(player: BaseCharacter): void {
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
  private chasePlayer(player: BaseCharacter, deltaMs: number): void {
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
  private fireDirectedBurst(player: BaseCharacter): void {
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
        this.spawnAzazelOrb(this.x, this.y, curAngle, 320, AZAZEL_BOSS_BALANCE.directedBurstOrbDamage, ART.directedBurst);
      });
    });
  }

  public spawnAzazelOrb(x: number, y: number, angle: number, speed: number, dmg: number, look: ProjectileLook = ORB_LOOK): void {
    this.spawnAzazelProjectile(x, y, angle, speed, dmg, look);
  }

  /** Projétil do Azazel (orbe, cometa, agulha...), do mesmo grupo: tudo some nas trocas de fase. */
  private spawnAzazelProjectile(x: number, y: number, angle: number, speed: number, dmg: number, look: ProjectileLook): void {
    let proj = this.projectilesGroup.getChildren().find(
      (child) => !child.active
    ) as DarkOrbProjectile | undefined;

    if (!proj) {
      proj = new DarkOrbProjectile(this.scene, x, y);
      this.projectilesGroup.add(proj);
    }

    SoundManager.getInstance().playAzazelOrbShoot();
    // Arte que não carregou: cai na orbe desenhada por código, com o visual dela
    const art = this.scene.textures.exists(look.texture) ? look : ORB_LOOK;
    proj.fire(x, y, angle, speed, this.scaleAttack(dmg), art.texture, art);
  }

  // =========================================================================
  // GOLPE 2: TELEPORTE TÁTICO PARA PRÓXIMO DO JOGADOR (MIND-GAME)
  // =========================================================================
  private performTacticalTeleport(player: BaseCharacter): void {
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
        this.spawnAzazelOrb(this.x, this.y, a + off, 300, AZAZEL_BOSS_BALANCE.teleportOrbDamage, ART.teleportBurst);
      });
    });
  }

  // =========================================================================
  // GOLPE 3: AVANÇO RÁPIDO NA DIREÇÃO DO JOGADOR (RAPID DASH)
  // =========================================================================
  private startTelegraphDash(player: BaseCharacter): void {
    this.bossState = 'TELEGRAPH_DASH';
    this.stateTimer = 650; // Mira rápida de 0.65s

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.dashTargetVector = { x: Math.cos(angle), y: Math.sin(angle) };
    this.updateRunAnimation(angle);
    this.setTint(0xff2255);
  }

  private updateTelegraphDash(player: BaseCharacter, deltaMs: number): void {
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

  private updateDashing(player: BaseCharacter, deltaMs: number): void {
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

    if (Math.hypot(this.x - player.x, this.y - player.y) <= 44 && this.hitPlayer(player, this.scaleAttack(AZAZEL_BOSS_BALANCE.rapidDashDamage))) {
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
  private startLightningStorm(player: BaseCharacter): void {
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

  private updateLightningStormState(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.updateHandAnimation(angle);

    if (this.stateTimer <= 0) {
      this.bossState = 'CHASE';
    }
  }

  private updateLightningMarkers(player: BaseCharacter, deltaMs: number): void {
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

  private triggerLightningBoltImpact(x: number, y: number, radius: number, player: BaseCharacter): void {
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
      this.hitPlayer(player, this.scaleAttack(AZAZEL_BOSS_BALANCE.lightningBoltDamage));
    }
  }

  // =========================================================================
  // GOLPE 5: BARRAGEM EM ESPIRAL (LEVANTA A MÃO + FICA TREMENDO + ATIRA EM ESPIRAL)
  // =========================================================================
  private startSpiralBarrage(player: BaseCharacter): void {
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

  private updateSpiralBarrage(player: BaseCharacter, deltaMs: number): void {
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
      this.spawnAzazelOrb(this.spiralBasePos.x, this.spiralBasePos.y, this.spiralAngle, 265, AZAZEL_BOSS_BALANCE.spiralOrbDamage, ART.spiral);
      this.spawnAzazelOrb(this.spiralBasePos.x, this.spiralBasePos.y, this.spiralAngle + Math.PI, 265, AZAZEL_BOSS_BALANCE.spiralOrbDamage, ART.spiral);
    }

    if (this.stateTimer <= 0) {
      this.setPosition(this.spiralBasePos.x, this.spiralBasePos.y);
      this.bossState = 'CHASE';
    }
  }

  // =========================================================================
  // TRANSIÇÃO E FASE 2: "AQUI É O MEU MUNDO" (50% -> 20% HP NA ESCURIDÃO)
  // =========================================================================
  public triggerPhase2DarknessDomain(player: BaseCharacter): void {
    this.combatPhase = 2;
    this.bossState = 'TRANSITIONING';
    this.isInvulnerable = true;
    this.isArenaRestricted = false;
    this.stopFinalSkulls();
    this.arenaGraphics.clear();
    this.telegraphGraphics.clear();
    this.lightningMarkers = [];
    this.clearHaloWaves();
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

  private startDarkFiveDashes(player: BaseCharacter): void {
    if (this.isDead || this.combatPhase !== 2) return;
    this.deactivatePhantomClones();
    this.exitSkullForm();
    // Investidas: a câmera volta a seguir a heroína
    this.setSkullRingArena(null);

    this.bossState = 'DARK_FIVE_DASHES';
    this.darkDashCount = 0;
    this.isInvulnerable = false;
    this.spawnNextDarkPhantomDash(player);
  }

  private spawnNextDarkPhantomDash(player: BaseCharacter): void {
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
    this.stateTimer = AZAZEL_BOSS_BALANCE.darkDashAimMs;
  }

  private updateDarkFiveDashes(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    if (this.darkDashSubState === 'AIM') {
      // Trava a mira na metade final, para dar tempo de sair da linha
      if (this.stateTimer > AZAZEL_BOSS_BALANCE.darkDashAimMs / 2) {
        const aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.darkDashVector = { x: Math.cos(aimAngle), y: Math.sin(aimAngle) };
        this.updateRunAnimation(aimAngle);
      }

      const progress = 1 - Math.max(0, this.stateTimer / AZAZEL_BOSS_BALANCE.darkDashAimMs);
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
        this.darkDashHasHit = false;
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

      // Uma passada = no máximo um acerto (antes acertava a cada quadro em cima dela)
      if (!this.darkDashHasHit && Math.hypot(this.x - player.x, this.y - player.y) <= 42 &&
        this.hitPlayer(player, this.scaleAttack(AZAZEL_BOSS_BALANCE.darkFiveDashesDamage))) {
        this.darkDashHasHit = true;
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

  private startDarkEightClones(player: BaseCharacter): void {
    if (this.isDead || this.combatPhase !== 2) return;

    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls;
    this.bossState = 'DARK_EIGHT_CLONES';
    this.stateTimer = cfg.durationMs;
    this.darkCloneShotTimer = cfg.firstShotMs;
    this.telegraphGraphics.clear();
    this.darkSurroundCenter = { x: player.x, y: player.y };
    // A roda fica parada aqui (não segue mais a heroína) e vira a arena dela
    this.setSkullRingArena(this.darkSurroundCenter);

    SoundManager.getInstance().playAzazelTeleport();
    this.scene.cameras.main.shake(200, 0.012);

    // O próprio Azazel ocupa o índice 0 da roda, disfarçado de caveira; as outras são AzazelPhantomClone com HP compartilhado
    const pos0X = this.darkSurroundCenter.x + cfg.radius;
    const pos0Y = this.darkSurroundCenter.y;
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
    this.enterSkullForm(player.x);

    // Garante que temos as caveiras instanciadas e registradas no grupo de inimigos da cena
    this.ensurePhantomClonesCreated();

    for (let i = 0; i < this.phantomClones.length; i++) {
      const angle = ((i + 1) / cfg.count) * (Math.PI * 2);
      const cx = this.darkSurroundCenter.x + Math.cos(angle) * cfg.radius;
      const cy = this.darkSurroundCenter.y + Math.sin(angle) * cfg.radius;
      const clone = this.phantomClones[i];
      clone.cloneAngle = angle;
      clone.activateClone(cx, cy, Math.atan2(player.y - cy, player.x - cx));
    }
  }

  /** Troca o anjo pela caveira (sem animação: a pose é só boca aberta ou fechada). */
  private enterSkullForm(targetX: number): void {
    if (!this.isSkullForm) this.scaleBeforeSkull = this.scaleX;
    this.isSkullForm = true;
    this.skullMouthOpenMs = 0;
    this.anims.stop();
    this.setScale(AZAZEL_BOSS_BALANCE.darkSkulls.scale);
    applySkullHitbox(this);
    applySkullPose(this, targetX, false);
  }

  /** Volta a ser o Azazel: escala, caixa de colisão e animação de antes da roda de caveiras. */
  private exitSkullForm(): void {
    if (!this.isSkullForm) return;
    this.isSkullForm = false;
    this.setFlipX(false);
    this.setScale(this.scaleBeforeSkull);
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setSize(42, 52);
      body.setOffset(24, 20);
    }
    // Sem ignoreIfPlaying: a animação parada ainda guarda a chave antiga, e as funções de pose a pulariam
    this.play('azazel-idle-south');
  }

  private ensurePhantomClonesCreated(): void {
    while (this.phantomClones.length < AZAZEL_BOSS_BALANCE.darkSkulls.count - 1) {
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

  private updateDarkEightClones(player: BaseCharacter, deltaMs: number): void {
    this.stateTimer -= deltaMs;
    this.darkCloneShotTimer -= deltaMs;

    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls;

    // Roda parada; a heroína fica presa dentro. Encostou na borda: dano e empurrão para o centro
    if (this.skullRingArena.enforce(player)) {
      this.hitPlayer(player, this.scaleAttack(cfg.arena.edgeDamage));
      this.scene.cameras.main.shake(120, 0.01);
    }

    const baseSpin = (cfg.durationMs - this.stateTimer) * cfg.spinPerMs;

    // Posição 0 (Azazel disfarçado)
    this.setPosition(
      this.darkSurroundCenter.x + Math.cos(baseSpin) * cfg.radius,
      this.darkSurroundCenter.y + Math.sin(baseSpin) * cfg.radius
    );
    this.skullMouthOpenMs = Math.max(0, this.skullMouthOpenMs - deltaMs);
    applySkullPose(this, player.x, this.skullMouthOpenMs > 0);

    // Demais posições (caveiras)
    for (let i = 0; i < this.phantomClones.length; i++) {
      const clone = this.phantomClones[i];
      if (!clone.active) continue;
      const a = baseSpin + ((i + 1) / cfg.count) * (Math.PI * 2);
      clone.setPosition(
        this.darkSurroundCenter.x + Math.cos(a) * cfg.radius,
        this.darkSurroundCenter.y + Math.sin(a) * cfg.radius
      );
      clone.updateSkullPose(player.x, deltaMs);
    }

    // Salvas: algumas caveiras sorteadas abrem a boca e cospem uma orbe na heroína
    if (this.darkCloneShotTimer <= 0) {
      this.darkCloneShotTimer = cfg.volleyEveryMs;

      const shooters: Array<AzazelBoss | AzazelPhantomClone> = [this];
      for (const c of this.phantomClones) {
        if (c.active) shooters.push(c);
      }
      Phaser.Utils.Array.Shuffle(shooters);
      for (const s of shooters.slice(0, cfg.shootersPerVolley)) {
        const shotAngle = Math.atan2(player.y - s.y, player.x - s.x);
        if (s === this) {
          this.skullMouthOpenMs = cfg.mouthOpenMs;
          applySkullPose(this, player.x, true);
        } else {
          (s as AzazelPhantomClone).openMouth();
        }
        this.spawnSkullOrb(s.x, s.y, shotAngle);
      }
    }

    // Ao fim da roda, se ainda não chegou a 20% de vida, volta para os 5 avanços rápidos!
    if (this.stateTimer <= 0) {
      this.deactivatePhantomClones();
      this.exitSkullForm();
      this.startDarkFiveDashes(player);
    }
  }

  /** Orbe cuspida pela boca da caveira (arte própria, maior que a orbe do anjo). */
  private spawnSkullOrb(x: number, y: number, angle: number): void {
    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls;
    this.spawnAzazelProjectile(
      x + Math.cos(angle) * cfg.mouthOffset,
      y + Math.sin(angle) * cfg.mouthOffset,
      angle,
      cfg.orbSpeed,
      AZAZEL_BOSS_BALANCE.darkCloneOrbDamage,
      ART.skull
    );
  }

  // =========================================================================
  // TRANSIÇÃO E FASE 3: "SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ" (20% HP -> CHAO2 + 3 CRISTAIS)
  // =========================================================================
  public triggerPhase3CorruptedDimension(player: BaseCharacter): void {
    this.combatPhase = 3;
    this.bossState = 'TRANSITIONING';
    this.isInvulnerable = true;
    this.telegraphGraphics.clear();
    this.lightningMarkers = [];
    this.clearHaloWaves();
    this.stopFinalSkulls();
    this.deactivatePhantomClones();
    this.exitSkullForm();
    this.setSkullRingArena(null);
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
        this.handSlam.start();
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
  public resumeFinalShowdown(spawnX: number, spawnY: number, player: BaseCharacter): void {
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
    this.featherCooldown = AZAZEL_BOSS_BALANCE.featherFan.firstCooldownMs;
    this.haloCooldown = AZAZEL_BOSS_BALANCE.haloWave.firstCooldownMs;
    this.clearHaloWaves();

    SoundManager.getInstance().playAzazelTeleport();
    this.playMidPrepareScream(player);

    this.handSlam.stop();
    this.startFinalSkulls(player);
  }

  // =========================================================================
  // DUELO FINAL: DUAS CAVEIRAS GIRANDO EM VOLTA DELE
  // =========================================================================
  private startFinalSkulls(player: BaseCharacter): void {
    const cfg = AZAZEL_BOSS_BALANCE.finalSkulls;
    this.ensurePhantomClonesCreated();
    this.deactivatePhantomClones();
    this.finalSkullsActive = true;
    this.finalSkullClockMs = 0;
    this.finalSkullTurn = 0;
    this.finalSkullShotTimer = cfg.shotEveryMs;
    for (let i = 0; i < cfg.count; i++) {
      const a = (i / cfg.count) * Math.PI * 2;
      const sx = this.x + Math.cos(a) * cfg.orbitRadius;
      const sy = this.y + Math.sin(a) * cfg.orbitRadius;
      this.phantomClones[i].activateClone(sx, sy, Math.atan2(player.y - sy, player.x - sx), cfg.scale);
    }
  }

  private stopFinalSkulls(): void {
    if (!this.finalSkullsActive) return;
    this.finalSkullsActive = false;
    this.deactivatePhantomClones();
  }

  private updateFinalSkulls(player: BaseCharacter, deltaMs: number): void {
    const cfg = AZAZEL_BOSS_BALANCE.finalSkulls;
    this.finalSkullClockMs += deltaMs;
    const spin = this.finalSkullClockMs * cfg.spinPerMs;

    const skulls = this.phantomClones.slice(0, cfg.count);
    skulls.forEach((skull, i) => {
      if (!skull.active) return;
      const a = spin + (i / cfg.count) * Math.PI * 2;
      // Cada uma flutua num tempo diferente, para não subirem e descerem juntas
      const bob = Math.sin(this.finalSkullClockMs * cfg.bobPerMs + i * Math.PI) * cfg.bobPx;
      skull.setPosition(this.x + Math.cos(a) * cfg.orbitRadius, this.y + Math.sin(a) * cfg.orbitRadius + bob);
      // Somem junto com ele (teleporte) e voltam quando ele reaparece
      skull.setVisible(this.visible);
      skull.updateSkullPose(player.x, deltaMs);
    });

    this.finalSkullShotTimer -= deltaMs;
    if (this.finalSkullShotTimer > 0 || !this.visible) return;
    this.finalSkullShotTimer = cfg.shotEveryMs;

    const shooter = skulls[this.finalSkullTurn % skulls.length];
    this.finalSkullTurn++;
    if (!shooter || !shooter.active) return;
    const angle = Math.atan2(player.y - shooter.y, player.x - shooter.x);
    shooter.openMouth();
    this.spawnAzazelProjectile(
      shooter.x + Math.cos(angle) * cfg.mouthOffset,
      shooter.y + Math.sin(angle) * cfg.mouthOffset,
      angle,
      cfg.orbSpeed,
      AZAZEL_BOSS_BALANCE.darkCloneOrbDamage,
      ART.skull
    );
  }

  /** Fase dos cristais: enquanto está banido ele se recupera (a barra de vida mostra). */
  public regenerateWhileBanished(newHp: number): void {
    if (this.isDead || this.bossState !== 'CRYSTAL_BANISHED') return;
    const hp = Math.min(this.maxHp, Math.round(newHp));
    if (hp === this.hp) return;
    this.hp = hp;
    this.emit('boss-hp-changed', this.hp, this.maxHp);
  }

  public get isBanished(): boolean {
    return this.bossState === 'CRYSTAL_BANISHED';
  }

  private scaleAttack(base: number): number {
    return Math.max(1, Math.round(base * this.attackDamageMultiplier));
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

    const mitigated = Math.max(1, Math.round(amount * AZAZEL_BOSS_BALANCE.damageTaken * this.damageTakenMultiplier));
    const phase2Threshold = Math.ceil(this.maxHp * 0.50); // 8,000 HP
    const phase3Threshold = Math.ceil(this.maxHp * 0.20); // 3,200 HP

    // Se está na Fase 1 e o dano cruzaria 50% de vida, trava em 50% e dispara a Fase 2 ("AQUI É O MEU MUNDO")
    if (this.combatPhase === 1 && this.hp - mitigated <= phase2Threshold) {
      this.hp = phase2Threshold;
      this.emit('boss-hp-changed', this.hp, this.maxHp);
      const player = (this.scene as Phaser.Scene & { player?: BaseCharacter }).player;
      if (player) {
        this.triggerPhase2DarknessDomain(player);
      }
      return;
    }

    // Se está na Fase 2 e o dano cruzaria 20% de vida, trava em 20% e dispara a Fase 3 ("SUA POBRE ALMA FRÁGIL...")
    if (this.combatPhase === 2 && this.hp - mitigated <= phase3Threshold) {
      this.hp = phase3Threshold;
      this.emit('boss-hp-changed', this.hp, this.maxHp);
      const player = (this.scene as Phaser.Scene & { player?: BaseCharacter }).player;
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

    this.deactivatePitchBlackOverlay();
    this.finalSkullsActive = false;
    this.deactivatePhantomClones();
    this.exitSkullForm();
    this.setSkullRingArena(null);
    this.deactivateAllProjectiles();
    this.handSlam.destroy();

    if (this.arenaGraphics && this.arenaGraphics.scene) {
      this.arenaGraphics.destroy();
    }
    if (this.telegraphGraphics && this.telegraphGraphics.scene) {
      this.telegraphGraphics.destroy();
    }
    this.clearHaloWaves();
    if (this.haloGraphics && this.haloGraphics.scene) {
      this.haloGraphics.destroy();
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

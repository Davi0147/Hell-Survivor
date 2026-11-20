import Phaser from 'phaser';
import { CharacterStats, Direction8, CRIT_BALANCE, DASH_BALANCE } from '../../config/balance';

const DIRECTION_VECTORS: Record<Direction8, { x: number; y: number }> = {
  east: { x: 1, y: 0 },
  'south-east': { x: Math.SQRT1_2, y: Math.SQRT1_2 },
  south: { x: 0, y: 1 },
  'south-west': { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
  west: { x: -1, y: 0 },
  'north-west': { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  north: { x: 0, y: -1 },
  'north-east': { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
};
import { SoundManager } from '../../systems/SoundManager';

export abstract class BaseCharacter extends Phaser.Physics.Arcade.Sprite {
  public maxHp: number;
  public currentHp: number;
  public baseSpeed: number;
  public sprintSpeed: number;
  public maxStamina: number;
  public currentStamina: number;
  public staminaDrainRate: number;
  public staminaRegenWalking: number;
  public staminaRegenIdle: number;
  public pickupRadius: number;

  // Progressão de Nível e XP
  public currentLevel: number = 1;
  public currentXp: number = 0;
  public xpToNextLevel: number = 20;
  public pendingLevelUps: number = 0; // Fila de níveis pendentes para escolha de cartas sem travar

  // Modificadores de Upgrades (Cartas de Level Up)
  public bonusDamagePercent: number = 0;
  public bonusSpeedPercent: number = 0;
  public bonusStaminaPercent: number = 0;
  public bonusPickupRadiusPercent: number = 0;
  public extraProjectiles: number = 0;
  public extraPierce: number = 0;
  /** Vida e estamina máximas ganhas por cartas nesta partida (mostradas no menu de pausa). */
  public cardBonusMaxHp: number = 0;
  public cardBonusMaxStamina: number = 0;

  // Novos Atributos Passivos de Cura e Sobrevivência (Balanceados)
  public hpRegenPerSec: number = 0; // Regeneração contínua de HP por segundo (até 0.8/s)
  public lifeStealPerHit: number = 0; // Roubo de vida por acerto (até 0.3 por golpe)
  public rerollsRemaining: number = 2; // Cargas de Re-rolar Bênçãos por partida

  // Ritmo de combate: críticos, combo, esquiva e explosão de cadáver (cartas e Frenesi mexem aqui)
  public critChance: number = CRIT_BALANCE.baseChance;
  public critMultiplier: number = CRIT_BALANCE.baseMultiplier;
  /** Multiplicador de XP ganho (combo e eventos de horda somam aqui a cada quadro). */
  public xpGainMultiplier: number = 1;
  public corpseExplosionLevel: number = 0;
  public dashMasteryLevel: number = 0;
  public bloodthirstLevel: number = 0;
  /** Relógio das armas (1 = normal). A Suprema acelera tudo: cadência, giro e pulsos. */
  public weaponHasteMultiplier: number = 1;

  // Esquiva (dash): arrancada curta com invulnerabilidade
  private dashTimer: number = 0;
  private dashCooldownTimer: number = 0;
  private dashInvulnTimer: number = 0;
  private dashDirX: number = 0;
  private dashDirY: number = 1;

  public isSprinting: boolean = false;
  public isMoving: boolean = false;
  public isStaminaExhausted: boolean = false;
  public hurtTimer: number = 0;
  public currentDirection: Direction8 = 'south';

  // Identificação do Personagem para UI / Sprites Dinâmicos
  public characterId: string = 'nixy';
  public characterName: string = 'NIXY';

  // Carga da Habilidade Suprema (Ultimate: Eternal Despair)
  public ultimateCharge: number = 0;
  public readonly maxUltimateCharge: number = 100;
  public isUltimateActive: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    stats: CharacterStats
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHp = stats.maxHp;
    this.currentHp = stats.maxHp;
    this.baseSpeed = stats.baseSpeed;
    this.sprintSpeed = stats.sprintSpeed;
    this.maxStamina = stats.maxStamina;
    this.currentStamina = stats.maxStamina;
    this.staminaDrainRate = stats.staminaDrainRate;
    this.staminaRegenWalking = stats.staminaRegenWalking;
    this.staminaRegenIdle = stats.staminaRegenIdle;
    this.pickupRadius = stats.pickupRadius;

    // Ajuste de colisão no corpo físico (64x64 sprite com caixa de colisão centralizada)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(28, 36);
      body.setOffset(18, 24);
      body.setCollideWorldBounds(false);
    }
  }

  public updateMovement(
    dx: number,
    dy: number,
    isSprintRequested: boolean,
    deltaMs: number
  ): void {
    const deltaSec = deltaMs / 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Reduz tempo de reação a dano
    if (this.hurtTimer > 0) {
      this.hurtTimer -= deltaMs;
    }

    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= deltaMs;
    if (this.dashInvulnTimer > 0) this.dashInvulnTimer -= deltaMs;

    // Esquiva em andamento: velocidade travada na direção escolhida, sem gastar nem recarregar fôlego
    if (this.dashTimer > 0) {
      this.dashTimer -= deltaMs;
      this.isMoving = true;
      this.isSprinting = false;
      body.setVelocity(this.dashDirX * DASH_BALANCE.speed, this.dashDirY * DASH_BALANCE.speed);
      this.updateAnimation();
      return;
    }

    this.isMoving = dx !== 0 || dy !== 0;

    // Normalização vetorial
    let nx = 0;
    let ny = 0;
    if (this.isMoving) {
      const length = Math.hypot(dx, dy);
      nx = dx / length;
      ny = dy / length;
      this.currentDirection = this.calculateDirection(nx, ny);
    }

    // Gerenciamento de Estamina e Full Sprint com Hysteresis (elimina o glitch de piscar sprint/walk a 0 stamina)
    if (this.currentStamina <= 1) {
      this.isStaminaExhausted = true;
    } else if (this.currentStamina >= 18) {
      this.isStaminaExhausted = false;
    }

    if (this.isMoving && isSprintRequested && !this.isStaminaExhausted && this.currentStamina > 1) {
      this.isSprinting = true;
      this.currentStamina = Math.max(0, this.currentStamina - this.staminaDrainRate * deltaSec);
    } else {
      this.isSprinting = false;
      if (this.isMoving) {
        this.currentStamina = Math.min(
          this.maxStamina,
          this.currentStamina + this.staminaRegenWalking * deltaSec
        );
      } else {
        this.currentStamina = Math.min(
          this.maxStamina,
          this.currentStamina + this.staminaRegenIdle * deltaSec
        );
      }
    }

    // Regeneração contínua de Vida (HP Regen passivo)
    if (this.hpRegenPerSec > 0 && this.currentHp < this.maxHp && this.currentHp > 0) {
      this.currentHp = Math.min(this.maxHp, this.currentHp + this.hpRegenPerSec * deltaSec);
    }

    // Aplicação da velocidade com bônus de upgrade e debuffs (como lentidão do rastro da Múmia)
    const speedMult = (1 + this.bonusSpeedPercent / 100) * (this as { speedDebuffMultiplier?: number }).speedDebuffMultiplier! || (1 + this.bonusSpeedPercent / 100);
    const currentSpeed = (this.isSprinting ? this.sprintSpeed : this.baseSpeed) * speedMult;
    body.setVelocity(nx * currentSpeed, ny * currentSpeed);

    // Atualização visual do sprite / animação
    this.updateAnimation();
  }

  public calculateDirection(nx: number, ny: number): Direction8 {
    // Ângulo em graus de 0 a 360
    const rad = Math.atan2(ny, nx);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    // Divisão em 8 fatias de 45 graus (com offset de 22.5 para centralizar cada ângulo)
    // 0 = East, 45 = South-East, 90 = South, 135 = South-West, 180 = West, 225 = North-West, 270 = North, 315 = North-East
    if (deg >= 337.5 || deg < 22.5) return 'east';
    if (deg >= 22.5 && deg < 67.5) return 'south-east';
    if (deg >= 67.5 && deg < 112.5) return 'south';
    if (deg >= 112.5 && deg < 157.5) return 'south-west';
    if (deg >= 157.5 && deg < 202.5) return 'west';
    if (deg >= 202.5 && deg < 247.5) return 'north-west';
    if (deg >= 247.5 && deg < 292.5) return 'north';
    return 'north-east';
  }

  public get isDashing(): boolean {
    return this.dashTimer > 0;
  }

  /** Durante a esquiva (e um instante depois) nenhum golpe acerta. */
  public get isDashInvulnerable(): boolean {
    return this.dashInvulnTimer > 0;
  }

  /** Deixa a heroína intocável por `ms` (nunca encurta uma proteção maior). */
  public grantIntangibility(ms: number): void {
    this.dashInvulnTimer = Math.max(this.dashInvulnTimer, ms);
  }

  public get dashCost(): number {
    return Math.max(5, DASH_BALANCE.staminaCost - this.dashMasteryLevel * DASH_BALANCE.costReductionPerCard);
  }

  public get isDashReady(): boolean {
    return this.dashCooldownTimer <= 0 && this.dashTimer <= 0 && this.currentStamina >= this.dashCost;
  }

  /** Subclasses bloqueiam a esquiva quando presas ou arremessadas. */
  protected canDash(): boolean {
    return true;
  }

  /**
   * Tenta a esquiva na direção pedida (ou para onde o personagem olha, se parado).
   * Devolve `true` se a esquiva saiu.
   */
  public tryDash(dx: number, dy: number): boolean {
    if (this.currentHp <= 0 || !this.isDashReady || !this.canDash()) return false;

    const length = Math.hypot(dx, dy);
    if (length > 0.05) {
      this.dashDirX = dx / length;
      this.dashDirY = dy / length;
      this.currentDirection = this.calculateDirection(this.dashDirX, this.dashDirY);
    } else {
      const facing = DIRECTION_VECTORS[this.currentDirection];
      this.dashDirX = facing.x;
      this.dashDirY = facing.y;
    }

    this.currentStamina = Math.max(0, this.currentStamina - this.dashCost);
    this.dashTimer = DASH_BALANCE.durationMs;
    this.dashInvulnTimer = DASH_BALANCE.durationMs + 110;
    this.dashCooldownTimer = DASH_BALANCE.cooldownMs;
    this.emit('player-dashed');
    return true;
  }

  public takeDamage(amount: number, bypassGodMode: boolean = false): void {
    if (this.isDashInvulnerable && !bypassGodMode) return;
    const gs = this.scene as Phaser.Scene & { sandboxGodMode?: boolean };
    if (gs && gs.sandboxGodMode && !bypassGodMode) {
      return;
    }
    const minHp = gs && gs.sandboxGodMode ? 1 : 0;
    this.currentHp = Math.max(minHp, this.currentHp - amount);
    this.hurtTimer = 250; // Ativa a pose de taking_damage por 250ms
    if (amount > 0) {
      SoundManager.getInstance().playPlayerHurt();
    }
  }

  public heal(amount: number): void {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
  }

  /**
   * Aciona roubo de vida por acerto (Life Steal)
   */
  public triggerLifeSteal(hits: number = 1): void {
    if (this.lifeStealPerHit <= 0 || this.currentHp <= 0) return;
    this.heal(this.lifeStealPerHit * hits);
  }

  public gainXp(amount: number): boolean {
    this.currentXp += Math.round(amount * this.xpGainMultiplier);
    let leveledUp = false;

    while (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.currentLevel++;
      this.xpToNextLevel = Math.floor(20 * Math.pow(this.currentLevel, 1.25));
      this.pendingLevelUps++;
      leveledUp = true;
    }

    if (leveledUp) {
      this.emit('player-level-up', this.currentLevel);
    }

    return leveledUp;
  }

  public get effectivePickupRadius(): number {
    return this.pickupRadius * (1 + this.bonusPickupRadiusPercent / 100);
  }

  public gainUltimateCharge(amount: number): boolean {
    if (this.isUltimateActive) return false;
    const prev = this.ultimateCharge;
    // Taxa de recarga calibrada (+20% mais exigente para carregar a Suprema)
    this.ultimateCharge = Phaser.Math.Clamp(this.ultimateCharge + (amount / 3.6), 0, this.maxUltimateCharge);
    if (prev < this.maxUltimateCharge && this.ultimateCharge >= this.maxUltimateCharge) {
      this.emit('ultimate-ready');
      return true;
    }
    return false;
  }

  public get isUltimateReady(): boolean {
    return this.ultimateCharge >= this.maxUltimateCharge && !this.isUltimateActive;
  }

  protected abstract updateAnimation(): void;
}

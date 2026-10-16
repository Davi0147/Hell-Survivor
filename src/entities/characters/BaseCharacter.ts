import Phaser from 'phaser';
import { CharacterStats, Direction8 } from '../../config/balance';
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

  // Novos Atributos Passivos de Cura e Sobrevivência (Balanceados)
  public hpRegenPerSec: number = 0; // Regeneração contínua de HP por segundo (até 0.8/s)
  public lifeStealPerHit: number = 0; // Roubo de vida por acerto (até 0.3 por golpe)
  public rerollsRemaining: number = 2; // Cargas de Re-rolar Bênçãos por partida

  public isSprinting: boolean = false;
  public isMoving: boolean = false;
  public isStaminaExhausted: boolean = false;
  public hurtTimer: number = 0;
  public currentDirection: Direction8 = 'south';

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
    const speedMult = (1 + this.bonusSpeedPercent / 100) * (this as any).speedDebuffMultiplier || (1 + this.bonusSpeedPercent / 100);
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

  public takeDamage(amount: number, bypassGodMode: boolean = false): void {
    const gs = this.scene as any;
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
    this.currentXp += amount;
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
    // Demora 3x mais para carregar tudo (aumento equilibrado do tempo de recarga)
    this.ultimateCharge = Phaser.Math.Clamp(this.ultimateCharge + (amount / 3), 0, this.maxUltimateCharge);
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

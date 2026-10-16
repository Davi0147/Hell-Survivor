import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { BaseCharacter } from '../characters/BaseCharacter';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { SoundManager } from '../../systems/SoundManager';

export class HellfireAuraWeapon extends BaseWeapon {
  public isEvolved: boolean = false;
  private player: BaseCharacter;
  private level: number = 1;
  private maxLevel: number = 5;
  private pulseCooldownMs: number = 1400;
  private pulseTimer: number = 600; // Primeiro pulso ocorre rapidamente

  constructor(scene: Phaser.Scene, player: BaseCharacter) {
    super(
      scene,
      'Chamas do Purgatório',
      16,   // Dano base do pulso de chamas
      1400, // Intervalo entre pulsos em ms
      95,   // Raio inicial da onda vulcânica
      0,    // Velocidade linear (arma de área contínua)
      1,    // 1 pulso por ciclo
      999   // Dano de área penetrante
    );
    this.player = player;
  }

  public fire(_originX: number, _originY: number, _target: BaseEnemy): void {
    // Operada através de updateWeapon() com pulso omnidirecional em área
  }

  /**
   * Evolução Suprema: transforma as Chamas do Purgatório Nív 5 na Supernova Abissal
   */
  public evolve(): void {
    if (this.isEvolved) return;
    this.isEvolved = true;
    this.level = this.maxLevel;
    this.name = 'Supernova Abissal';
    this.damage = 78;
    this.range = 215;
    this.pulseCooldownMs = 820;
    this.cooldownMs = 820;
    SoundManager.getInstance().playWeaponEvolve();
  }

  public updateWeapon(
    deltaMs: number,
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    this.pulseTimer -= deltaMs;

    if (this.pulseTimer <= 0) {
      this.pulseTimer = this.pulseCooldownMs;
      this.triggerHellfirePulse(originX, originY, enemies);
    }
  }

  private triggerHellfirePulse(
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    // 1. Efeito sonoro do estouro de chamas vulcânicas
    SoundManager.getInstance().playHellfireBurst();

    // 2. Animação de anel de fogo expansivo em Blend Mode ADD
    const fireRing = this.scene.add.graphics();
    fireRing.setDepth(18);
    fireRing.setBlendMode(Phaser.BlendModes.ADD);

    const targetRadius = this.range;
    const isSupernova = this.isEvolved;

    this.scene.tweens.addCounter({
      from: 14,
      to: targetRadius,
      duration: isSupernova ? 380 : 320,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const r = tween.getValue() ?? 14;
        const progress = (r - 14) / (targetRadius - 14);
        const alpha = Math.max(0, 1 - progress);

        fireRing.clear();
        // Preenchimento de brasa quente ou plasma astral
        fireRing.fillStyle(isSupernova ? 0x00b4d8 : 0xff3300, alpha * 0.35);
        fireRing.fillCircle(originX, originY, r);

        // Borda de fogo brilhante incandescente
        fireRing.lineStyle(3 + (1 - progress) * 3, isSupernova ? 0xffe600 : 0xffa200, alpha * 0.95);
        fireRing.strokeCircle(originX, originY, r);

        // Anel interno de calor branco/ciano
        fireRing.lineStyle(1.5, isSupernova ? 0x00f5d4 : 0xffffff, alpha * 0.75);
        fireRing.strokeCircle(originX, originY, Math.max(6, r - 6));
      },
      onComplete: () => {
        fireRing.destroy();
      }
    });

    // 3. Faíscas de cinzas e brasas saltando para fora
    const sparkColors = isSupernova
      ? [0x00f5d4, 0xffe600, 0x9b5de5, 0xffffff]
      : [0xff2200, 0xff5500, 0xff9900, 0xffd000];

    for (let i = 0; i < (isSupernova ? 10 : 6); i++) {
      const spark = this.scene.add.circle(
        originX,
        originY,
        Phaser.Math.Between(2, 4),
        Phaser.Math.RND.pick(sparkColors),
        0.9
      );
      spark.setDepth(19);
      spark.setBlendMode(Phaser.BlendModes.ADD);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(targetRadius * 0.5, targetRadius * 1.1);

      this.scene.tweens.add({
        targets: spark,
        x: originX + Math.cos(angle) * dist,
        y: originY + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(260, 420),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    // 4. Detecção e dano aos inimigos dentro do raio da explosão de chamas
    const effectiveDamage = Math.round(
      this.damage * (1 + this.player.bonusDamagePercent / 100)
    );

    const activeEnemies = enemies.getChildren() as BaseEnemy[];
    let hitCount = 0;

    for (const enemy of activeEnemies) {
      if (!enemy.active || enemy.isDead || (enemy as any).isInvulnerable) continue;

      const dist = Math.hypot(enemy.x - originX, enemy.y - originY);
      if (dist <= targetRadius) {
        enemy.takeDamage(effectiveDamage);

        // Flash de queimação laranja/ciano no monstro
        enemy.setTint(isSupernova ? 0x00f5d4 : 0xff6600);
        this.scene.time.delayedCall(120, () => {
          if (enemy.active && !enemy.isDead) {
            enemy.clearTint();
          }
        });

        hitCount++;
      }
    }

    if (hitCount > 0) {
      SoundManager.getInstance().playEnemyHit();
      this.player.triggerLifeSteal(hitCount);
      if (isSupernova) {
        // Supernova Abissal restaura +1.2 HP da Nixy sempre que um pulso incinera inimigos
        this.player.heal(1.2);
      }
    }
  }

  /**
   * Evolução de Nível da Arma (Nível 1 a 5)
   */
  public upgrade(): boolean {
    if (this.level >= this.maxLevel) return false;
    this.level++;
    this.damage += 7;
    this.range += 18;
    this.pulseCooldownMs = Math.max(900, this.pulseCooldownMs - 80);
    this.cooldownMs = this.pulseCooldownMs;
    return true;
  }

  public getLevel(): number {
    return this.level;
  }

  public isMaxLevel(): boolean {
    return this.isEvolved || this.level >= this.maxLevel;
  }
}

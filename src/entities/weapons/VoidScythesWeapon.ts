import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { BaseCharacter } from '../characters/BaseCharacter';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { DamageTextSystem } from '../../systems/DamageTextSystem';
import { SoundManager } from '../../systems/SoundManager';

export class VoidScythesWeapon extends BaseWeapon {
  private player: BaseCharacter;
  private blades: Phaser.GameObjects.Sprite[] = [];
  private orbitAngle: number = 0;
  private spinAngle: number = 0;
  private orbitRadius: number = 70;
  private rotationSpeed: number = 3.6; // Radianos por segundo
  private bladeCount: number = 1; // Começa rigorosamente com 1 foice
  private enemyHitCooldowns: Map<BaseEnemy, number> = new Map();

  constructor(scene: Phaser.Scene, player: BaseCharacter) {
    super(
      scene,
      'Lâminas Orbitais',
      9,    // Dano base por golpe reduzido em 75%
      0,    // Cooldown não usado para lâmina contínua
      100,  // Raio de órbita
      0,    // Velocidade linear não usada
      1,    // Quantidade inicial de lâminas = 1
      999   // Perfuração infinita
    );
    this.player = player;
    this.bladeCount = 1;
    this.createBlades();
  }

  public fire(_originX: number, _originY: number, _target: BaseEnemy): void {
    // VoidScythes opera continuamente em órbita através de updateWeapon()
  }

  /**
   * Incrementa +1 lâmina em órbita até no máximo 6
   */
  public addBlade(): boolean {
    if (this.bladeCount >= 6) return false;
    this.bladeCount++;
    this.projectileCount = this.bladeCount;
    this.createBlades();
    return true;
  }

  public getBladeCount(): number {
    return this.bladeCount;
  }

  public isMaxBlades(): boolean {
    return this.bladeCount >= 6;
  }

  private createBlades(): void {
    // Destrói lâminas antigas se houver
    for (const b of this.blades) {
      b.destroy();
    }
    this.blades = [];

    const totalBlades = Math.min(6, Math.max(1, this.bladeCount));

    for (let i = 0; i < totalBlades; i++) {
      const blade = this.scene.add.sprite(this.player.x, this.player.y, 'void-scythe');
      blade.setDepth(24); // Voando logo abaixo da heroína (20) e acima dos inimigos (8)
      blade.setScale(1.1);
      this.blades.push(blade);
    }
  }

  public updateWeapon(
    deltaMs: number,
    _originX: number,
    _originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    const deltaSec = deltaMs / 1000;
    this.orbitAngle += this.rotationSpeed * deltaSec;
    this.spinAngle += 10 * deltaSec; // Rotação contínua e rápida sobre o próprio eixo

    // Reduz cooldown de dano dos inimigos atingidos recentemente
    for (const [enemy, cd] of this.enemyHitCooldowns.entries()) {
      const newCd = cd - deltaMs;
      if (newCd <= 0 || !enemy.active || enemy.isDead) {
        this.enemyHitCooldowns.delete(enemy);
      } else {
        this.enemyHitCooldowns.set(enemy, newCd);
      }
    }

    // Se o número de lâminas mudou via upgrade, recria as lâminas
    if (this.blades.length !== this.bladeCount) {
      this.createBlades();
    }

    const total = this.blades.length;
    const step = (Math.PI * 2) / total;

    // Atualiza posição e rotação das lâminas em órbita
    for (let i = 0; i < total; i++) {
      const angle = this.orbitAngle + i * step;
      const bx = this.player.x + Math.cos(angle) * this.orbitRadius;
      const by = this.player.y + Math.sin(angle) * this.orbitRadius;

      const blade = this.blades[i];
      blade.setPosition(bx, by);
      // Gira sobre o próprio eixo enquanto orbita a heroína
      blade.setRotation(this.spinAngle + i * (Math.PI / 2));

      // Verificação de colisão com inimigos ativos
      const activeEnemies = enemies.getChildren() as BaseEnemy[];
      for (const enemy of activeEnemies) {
        if (!enemy.active || enemy.isDead) continue;

        const dist = Math.hypot(enemy.x - bx, enemy.y - by);
        if (dist <= 26 && !this.enemyHitCooldowns.has(enemy)) {
          this.hitEnemy(enemy, bx, by);
        }
      }
    }
  }

  private hitEnemy(enemy: BaseEnemy, hitX: number, hitY: number): void {
    // 1. Aplica tempo de imunidade específico para esta arma (260ms)
    this.enemyHitCooldowns.set(enemy, 260);

    // 2. Cálculo de Dano com bônus da personagem
    const effectiveDamage = Math.round(this.damage * (1 + this.player.bonusDamagePercent / 100));
    enemy.takeDamage(effectiveDamage);
    SoundManager.getInstance().playEnemyHit();

    // 2.1. Gatilho de Roubo de Vida passivo
    this.player.triggerLifeSteal(1);

    // 3. Empurrão (Knockback) leve para afastar da heroína
    const kx = enemy.x - this.player.x;
    const ky = enemy.y - this.player.y;
    const kDist = Math.hypot(kx, ky) || 1;
    const body = enemy.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity((kx / kDist) * 140, (ky / kDist) * 140);
    }

    // 4. Efeito de faíscas cortantes
    for (let i = 0; i < 3; i++) {
      const spark = this.scene.add.image(hitX, hitY, 'particle-spark');
      spark.setDepth(150);
      spark.setTint(0x9b5de5);
      spark.setScale(1.2);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(10, 20);

      this.scene.tweens.add({
        targets: spark,
        x: hitX + Math.cos(angle) * dist,
        y: hitY + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
  }

  public destroy(): void {
    for (const b of this.blades) {
      b.destroy();
    }
    this.blades = [];
    this.enemyHitCooldowns.clear();
  }
}

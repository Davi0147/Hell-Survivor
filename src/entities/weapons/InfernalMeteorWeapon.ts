import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { BaseCharacter } from '../characters/BaseCharacter';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { SoundManager } from '../../systems/SoundManager';

export class InfernalMeteorWeapon extends BaseWeapon {
  private player: BaseCharacter;
  private level: number = 1;
  private readonly maxLevel: number = 5;
  private meteorCount: number = 1;
  private strikeTimer: number = 900;

  constructor(scene: Phaser.Scene, player: BaseCharacter) {
    super(
      scene,
      'Meteoro Infernal',
      46,   // Alto dano explosivo por impacto
      2400, // Cooldown inicial em ms
      68,   // Raio da explosão de cratera
      0,
      1,    // 1 meteoro por salva no Nível 1
      999
    );
    this.player = player;
  }

  public fire(_originX: number, _originY: number, _target: BaseEnemy): void {
    // Operado via updateWeapon()
  }

  public updateWeapon(
    deltaMs: number,
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    this.strikeTimer -= deltaMs;

    if (this.strikeTimer <= 0) {
      const targets = this.pickClusterTargets(originX, originY, enemies, this.meteorCount);
      if (targets.length > 0) {
        this.strikeTimer = this.cooldownMs;
        targets.forEach((pt, idx) => {
          this.scene.time.delayedCall(idx * 190, () => {
            if (this.scene && this.scene.sys.isActive()) {
              this.spawnMeteorStrike(pt.x, pt.y, enemies);
            }
          });
        });
      } else {
        this.strikeTimer = 250;
      }
    }
  }

  private pickClusterTargets(
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group,
    count: number
  ): { x: number; y: number }[] {
    const activeEnemies = (enemies.getChildren() as BaseEnemy[]).filter(
      (e) => e.active && !e.isDead && Math.hypot(e.x - originX, e.y - originY) <= 270
    );

    if (activeEnemies.length === 0) return [];

    const results: { x: number; y: number }[] = [];
    const pool = [...activeEnemies];

    for (let i = 0; i < count; i++) {
      if (pool.length === 0) break;
      const chosen = Phaser.Math.RND.pick(pool);
      results.push({
        x: chosen.x + Phaser.Math.Between(-14, 14),
        y: chosen.y + Phaser.Math.Between(-14, 14)
      });
    }

    return results;
  }

  private spawnMeteorStrike(
    targetX: number,
    targetY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    const fallDuration = 360;
    const startX = targetX + 95;
    const startY = targetY - 195;
    const blastRadius = this.range;

    // 1. Sombra/Mira rúnica no chão anunciando a queda do meteoro
    const indicator = this.scene.add.graphics();
    indicator.setDepth(17);

    // 2. Cauda de fogo leve saindo detrás do meteoro
    const fireTail = this.scene.add.graphics();
    fireTail.setDepth(119);
    fireTail.setBlendMode(Phaser.BlendModes.ADD);

    // 3. Sprite oficial do Meteoro (Meteoro.png)
    const hasTexture = this.scene.textures.exists('infernal-meteor');
    const meteorSprite = hasTexture
      ? this.scene.add.image(startX, startY, 'infernal-meteor')
      : undefined;
    if (meteorSprite) {
      meteorSprite.setDepth(121);
      meteorSprite.setScale(1.05);
    }

    let lastFlameStep = -1;

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: fallDuration,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;

        // Indicador no solo fechando até o impacto
        indicator.clear();
        indicator.fillStyle(0xff2200, 0.12 + t * 0.22);
        indicator.fillCircle(targetX, targetY, blastRadius * (0.4 + t * 0.6));
        indicator.lineStyle(1.5, 0xff9900, 0.35 + t * 0.6);
        indicator.strokeCircle(targetX, targetY, blastRadius);

        // Posição atual da rocha em queda
        const mx = startX + (targetX - startX) * t;
        const my = startY + (targetY - startY) * t;

        if (meteorSprite && meteorSprite.active) {
          meteorSprite.setPosition(mx, my);
          meteorSprite.setRotation(t * Math.PI * 1.4);
          meteorSprite.setScale(0.95 + t * 0.25);
        }

        // Cauda de chamas suaves atrás da rocha (vetor inverso da queda: +X, -Y)
        fireTail.clear();
        fireTail.lineStyle(12, 0xff3300, 0.38);
        fireTail.lineBetween(mx + 4, my - 8, mx + 26, my - 52);
        fireTail.lineStyle(6, 0xff8800, 0.62);
        fireTail.lineBetween(mx + 3, my - 6, mx + 18, my - 36);
        fireTail.lineStyle(3, 0xffe600, 0.85);
        fireTail.lineBetween(mx + 2, my - 4, mx + 11, my - 22);

        if (!meteorSprite) {
          fireTail.fillStyle(0xff4500, 0.95);
          fireTail.fillCircle(mx, my, 10);
        }

        // Labaredas leves de fogo saindo atrás do meteoro durante o trajeto
        const flameStep = Math.floor(t * 10);
        if (flameStep > lastFlameStep) {
          lastFlameStep = flameStep;
          const fx = mx + 7 + Phaser.Math.Between(-5, 5);
          const fy = my - 13 + Phaser.Math.Between(-5, 5);
          const flameColor = Phaser.Math.RND.pick([0xff3300, 0xff6d00, 0xffbe0b]);
          const flamePuff = this.scene.add.circle(
            fx,
            fy,
            Phaser.Math.Between(3, 6),
            flameColor,
            0.72
          );
          flamePuff.setDepth(118);
          flamePuff.setBlendMode(Phaser.BlendModes.ADD);

          this.scene.tweens.add({
            targets: flamePuff,
            x: fx + Phaser.Math.Between(6, 16),
            y: fy - Phaser.Math.Between(12, 26),
            alpha: 0,
            scale: 0.15,
            duration: 185,
            ease: 'Quad.easeOut',
            onComplete: () => flamePuff.destroy()
          });
        }
      },
      onComplete: () => {
        indicator.destroy();
        fireTail.destroy();
        if (meteorSprite) meteorSprite.destroy();
        this.detonateMeteor(targetX, targetY, blastRadius, enemies);
      }
    });
  }

  private detonateMeteor(
    x: number,
    y: number,
    blastRadius: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    SoundManager.getInstance().playMeteorImpact();
    this.scene.cameras.main.shake(95, 0.004);

    // Onda de choque da cratera vulcânica
    const shockwave = this.scene.add.graphics();
    shockwave.setDepth(19);
    shockwave.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.addCounter({
      from: 12,
      to: blastRadius,
      duration: 280,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const r = tween.getValue() ?? 12;
        const p = (r - 12) / Math.max(1, blastRadius - 12);
        const alpha = Math.max(0, 1 - p);

        shockwave.clear();
        shockwave.fillStyle(0xff4500, alpha * 0.48);
        shockwave.fillCircle(x, y, r);
        shockwave.lineStyle(3.5, 0xffd166, alpha);
        shockwave.strokeCircle(x, y, r);
      },
      onComplete: () => {
        shockwave.destroy();
      }
    });

    // Estilhaços de magma
    for (let i = 0; i < 8; i++) {
      const ember = this.scene.add.circle(
        x,
        y,
        Phaser.Math.Between(2, 4),
        Phaser.Math.RND.pick([0xff2200, 0xff7b00, 0xffd000, 0xffffff]),
        0.95
      );
      ember.setDepth(26);
      ember.setBlendMode(Phaser.BlendModes.ADD);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(18, blastRadius);

      this.scene.tweens.add({
        targets: ember,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, 360),
        ease: 'Quad.easeOut',
        onComplete: () => ember.destroy()
      });
    }

    // Dano em área nos inimigos atingidos
    const effectiveDamage = Math.round(this.damage * (1 + this.player.bonusDamagePercent / 100));
    const activeEnemies = enemies.getChildren() as BaseEnemy[];
    let hits = 0;

    for (const enemy of activeEnemies) {
      if (!enemy.active || enemy.isDead) continue;
      const dist = Math.hypot(enemy.x - x, enemy.y - y);
      if (dist <= blastRadius) {
        enemy.takeDamage(effectiveDamage);
        hits++;
      }
    }

    if (hits > 0) {
      this.player.triggerLifeSteal(hits);
    }
  }

  public upgrade(): boolean {
    if (this.level >= this.maxLevel) return false;
    this.level++;
    this.damage += 10;
    this.range += 6;
    this.cooldownMs = Math.max(1650, this.cooldownMs - 160);
    if (this.level === 2 || this.level === 4 || this.level === 5) {
      this.meteorCount += 1; // Sobe até 4 meteoros por salva no Nível 5
    }
    return true;
  }

  public getLevel(): number {
    return this.level;
  }

  public isMaxLevel(): boolean {
    return this.level >= this.maxLevel;
  }
}

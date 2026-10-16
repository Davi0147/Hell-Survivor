import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { BaseCharacter } from '../characters/BaseCharacter';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { SoundManager } from '../../systems/SoundManager';

export class AbyssalChainsWeapon extends BaseWeapon {
  private player: BaseCharacter;
  private level: number = 1;
  private readonly maxLevel: number = 5;
  private targetCount: number = 3;
  private stunDurationMs: number = 950;
  private whipTimer: number = 500;

  constructor(scene: Phaser.Scene, player: BaseCharacter) {
    super(
      scene,
      'Cadeias Abissais',
      18,   // Dano base por chicotada
      1750, // Cooldown inicial em ms
      165,  // Raio inicial de alcance das correntes
      0,
      3,    // Atinge até 3 inimigos no Nível 1
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
    this.whipTimer -= deltaMs;

    if (this.whipTimer <= 0) {
      const targets = this.findNearestTargets(originX, originY, enemies, this.targetCount + this.player.extraProjectiles);
      if (targets.length > 0) {
        this.whipTimer = this.cooldownMs;
        this.unleashChains(originX, originY, targets);
      } else {
        this.whipTimer = 200; // Re-checa em breve caso não haja alvos no raio
      }
    }
  }

  private findNearestTargets(
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group,
    maxTargets: number
  ): BaseEnemy[] {
    const candidates: { enemy: BaseEnemy; dist: number }[] = [];
    const activeEnemies = enemies.getChildren() as BaseEnemy[];

    for (const enemy of activeEnemies) {
      if (!enemy.active || enemy.isDead || (enemy as any).isInvulnerable) continue;
      const dist = Math.hypot(enemy.x - originX, enemy.y - originY);
      if (dist <= this.range) {
        candidates.push({ enemy, dist });
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    return candidates.slice(0, maxTargets).map((c) => c.enemy);
  }

  private unleashChains(originX: number, originY: number, targets: BaseEnemy[]): void {
    SoundManager.getInstance().playAbyssalChainsWhip();

    const effectiveDamage = Math.round(this.damage * (1 + this.player.bonusDamagePercent / 100));
    const chainGraphics = this.scene.add.graphics();
    chainGraphics.setDepth(22);
    chainGraphics.setBlendMode(Phaser.BlendModes.ADD);

    let prevX = originX;
    let prevY = originY;

    const chainSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

    for (const enemy of targets) {
      chainSegments.push({ x1: prevX, y1: prevY, x2: enemy.x, y2: enemy.y });
      // Encadeia de um inimigo para o próximo criando uma rede de grilhões
      prevX = enemy.x;
      prevY = enemy.y;

      enemy.takeDamage(effectiveDamage);
      enemy.applyStun(this.stunDurationMs);

      // Anel visual de grilhão roxo/ciano prendendo o inimigo
      this.spawnShackleRing(enemy);
    }

    this.player.triggerLifeSteal(targets.length);

    // Animação dos elos da corrente espectral
    this.scene.tweens.addCounter({
      from: 1,
      to: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const alpha = tween.getValue() ?? 0;
        chainGraphics.clear();

        for (const seg of chainSegments) {
          // Aura roxa abissal externa
          chainGraphics.lineStyle(5 * alpha, 0x9d4edd, alpha * 0.85);
          chainGraphics.lineBetween(seg.x1, seg.y1, seg.x2, seg.y2);

          // Fio central de aço espiritual ciano/branco
          chainGraphics.lineStyle(2, 0x00f5d4, alpha);
          chainGraphics.lineBetween(seg.x1, seg.y1, seg.x2, seg.y2);

          // Desenha pequenos elos ao longo da corrente
          const dist = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
          const links = Math.max(2, Math.floor(dist / 16));
          for (let i = 1; i < links; i++) {
            const t = i / links;
            const lx = seg.x1 + (seg.x2 - seg.x1) * t;
            const ly = seg.y1 + (seg.y2 - seg.y1) * t;
            chainGraphics.strokeCircle(lx, ly, 3.2);
          }
        }
      },
      onComplete: () => {
        chainGraphics.destroy();
      }
    });
  }

  private spawnShackleRing(enemy: BaseEnemy): void {
    const ring = this.scene.add.graphics();
    ring.setDepth(21);

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: Math.min(850, this.stunDurationMs),
      onUpdate: (tween) => {
        if (!enemy.active || enemy.isDead) {
          ring.clear();
          return;
        }
        const p = tween.getValue() ?? 0;
        const alpha = 1 - p * 0.7;
        ring.clear();
        ring.lineStyle(2, 0x9d4edd, alpha);
        ring.strokeCircle(enemy.x, enemy.y + 4, 14);
        ring.lineStyle(1, 0x00f5d4, alpha * 0.8);
        ring.strokeCircle(enemy.x, enemy.y + 4, 11);
      },
      onComplete: () => {
        ring.destroy();
      }
    });
  }

  public upgrade(): boolean {
    if (this.level >= this.maxLevel) return false;
    this.level++;
    this.damage += 6;
    this.targetCount += 1; // Atinge +1 monstro no encadeamento por nível
    this.range += 16;
    this.stunDurationMs += 120; // Aumenta duração do atordoamento
    this.cooldownMs = Math.max(1250, this.cooldownMs - 110);
    return true;
  }

  public getLevel(): number {
    return this.level;
  }

  public isMaxLevel(): boolean {
    return this.isEvolved || this.level >= this.maxLevel;
  }

  public isEvolved: boolean = false;

  public evolve(): void {
    if (this.isEvolved) return;
    this.isEvolved = true;
    this.level = this.maxLevel;
    this.name = 'Grilhões do Tartarus';
    this.damage = 54;
    this.targetCount = 8;
    this.range = 280;
    this.stunDurationMs = 1800;
    this.cooldownMs = 950;
    SoundManager.getInstance().playWeaponEvolve();
  }
}

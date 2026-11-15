import Phaser from 'phaser';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { ZombieDog } from '../entities/enemies/ZombieDog';
import { SkullSlime } from '../entities/enemies/SkullSlime';
import { BloodBat } from '../entities/enemies/BloodBat';
import { MummyEnemy } from '../entities/enemies/MummyEnemy';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import type { GemType } from '../entities/items/SoulGem';
import type { MapItemType } from '../entities/items/MapItem';
import { SoundManager } from './SoundManager';
import { PERFORMANCE_LIMITS, ENEMY_BALANCE, getEnemyScaling, getChapterConfig } from '../config/balance';

/** O que o sistema de spawn precisa saber sobre o personagem jogável (qualquer BaseCharacter serve). */
export interface IEnemySpawnPlayer {
  readonly x: number;
  readonly y: number;
  readonly isUltimateActive: boolean;
  gainUltimateCharge(amount: number): boolean;
}

/** Contrato mínimo que a cena de jogo expõe para o EnemySpawnSystem. */
export interface IEnemySpawnContext {
  readonly player: IEnemySpawnPlayer;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly currentChapter: number;
  readonly survivalTimeMs: number;
  readonly isBossFightActive: boolean;
  readonly isAzazelPhase3HordeActive: boolean;
  readonly chapterPurifiedSouls: number;
  readonly chapterTargetSouls: number;
  killCount: number;
  clampToArena(x: number, y: number, margin?: number): { x: number; y: number };
  addPurificationPoints(points: number): void;
  spawnGemAt(x: number, y: number, type: GemType): void;
  spawnSoulItem(x: number, y: number, value?: number): void;
  spawnMapItem(x: number, y: number, type?: MapItemType): unknown;
}

/**
 * EnemySpawnSystem — cria (com pooling) os inimigos comuns, elites e minichefes,
 * decide a composição das ondas por fase e aplica o escalonamento de atributos.
 * Os números moram em `ENEMY_BALANCE` (src/config/balance.ts).
 */
export class EnemySpawnSystem {
  private scene: Phaser.Scene;
  private ctx: IEnemySpawnContext;

  constructor(scene: Phaser.Scene, ctx: IEnemySpawnContext) {
    this.scene = scene;
    this.ctx = ctx;
  }

  private getChapterEnemyStatMultiplier(): number {
    if (this.ctx.gameMode !== 'story') return 1.0;
    return getChapterConfig(this.ctx.currentChapter).enemyStatMultiplier;
  }

  public spawnZombieDogAt(
    x: number,
    y: number,
    hp: number = ENEMY_BALANCE.zombieDog.hp,
    speed: number = ENEMY_BALANCE.zombieDog.speed,
    damage: number = ENEMY_BALANCE.zombieDog.damage,
    isElite: boolean = false,
    eliteScale: number = 1.0,
    customDrop?: GemType
  ): void {
    const clamped = this.ctx.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    const chMult = this.getChapterEnemyStatMultiplier();
    hp = Math.round(hp * chMult);
    damage = Math.round(damage * chMult);

    let enemy = this.ctx.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof ZombieDog && !child.isSpecialMiniBoss
    ) as ZombieDog | undefined;

    if (!enemy) {
      enemy = new ZombieDog(this.scene, x, y);
      enemy.setDepth(5);
      this.ctx.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number, killedEnemy?: BaseEnemy) => {
        this.ctx.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        const dog = killedEnemy instanceof ZombieDog ? killedEnemy : undefined;
        const ultBonus = dog?.isElite ? 10 : 2.5;
        this.ctx.player.gainUltimateCharge(ultBonus);
        this.ctx.addPurificationPoints(dog?.isElite ? 6 : 2);

        let gemType: GemType;
        if (dog?.customDrop) {
          gemType = dog.customDrop;
        } else if (dog?.isElite) {
          // Elites dropam gemas azuis (70%) ou vermelhas (30%)
          gemType = Math.random() < 0.3 ? 'red' : 'blue';
        } else {
          // 90% chance de gema verde (5 XP), 10% chance de gema azul (20 XP)
          gemType = Math.random() < 0.1 ? 'blue' : 'green';
        }
        this.ctx.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas: Elites garantem 2 a 3; comuns têm 4% de chance
        if (dog?.isElite) {
          this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(2, 3));
        } else if (Math.random() < 0.04) {
          this.ctx.spawnSoulItem(ex, ey, 1);
        }
      });
    }

    enemy.spawn(x, y, hp, speed, damage, isElite, eliteScale, customDrop);
  }

  public spawnSkullSlimeAt(x: number, y: number): void {
    const clamped = this.ctx.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    let enemy = this.ctx.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof SkullSlime
    ) as SkullSlime | undefined;

    if (!enemy) {
      enemy = new SkullSlime(this.scene, x, y);
      enemy.setDepth(6);
      this.ctx.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number) => {
        this.ctx.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.ctx.player.gainUltimateCharge(5); // Tanque concede +5% de carga
        this.ctx.addPurificationPoints(8);

        // Skull Slime tem chance de gema azul (70%) e vermelha (30%)
        const gemType: GemType = Math.random() < 0.3 ? 'red' : 'blue';
        this.ctx.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas (8% de chance de 1 a 2 almas)
        if (Math.random() < 0.08) {
          this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(1, 2));
        }
      });
    }

    const minutes = this.ctx.survivalTimeMs / 60000;
    const chMult = this.getChapterEnemyStatMultiplier();
    const slime = ENEMY_BALANCE.skullSlime;
    const hp = Math.round((slime.hp + (this.ctx.gameMode === 'endless' ? minutes * slime.endlessHpPerMinute : 0)) * chMult);
    const dmg = Math.round(slime.damage * chMult);
    enemy.spawn(x, y, hp, slime.speed, dmg);
  }

  private spawnBloodBatAt(x: number, y: number): void {
    const clamped = this.ctx.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    let enemy = this.ctx.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof BloodBat
    ) as BloodBat | undefined;

    if (!enemy) {
      enemy = new BloodBat(this.scene, x, y);
      enemy.setDepth(8);
      this.ctx.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number) => {
        this.ctx.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.ctx.player.gainUltimateCharge(1.5);
        this.ctx.addPurificationPoints(1);

        // 95% gema verde, 5% azul
        const gemType: GemType = Math.random() < 0.05 ? 'blue' : 'green';
        this.ctx.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas (3% de chance de 1 alma)
        if (Math.random() < 0.03) {
          this.ctx.spawnSoulItem(ex, ey, 1);
        }
      });
    }

    const minutes = this.ctx.survivalTimeMs / 60000;
    const chMult = this.getChapterEnemyStatMultiplier();
    const bat = ENEMY_BALANCE.bloodBat;
    const hp = Math.round((bat.hp + (this.ctx.gameMode === 'endless' ? minutes * bat.endlessHpPerMinute : 0)) * chMult);
    const speed = Math.floor(bat.speed + (this.ctx.gameMode === 'endless' ? minutes * bat.endlessSpeedPerMinute : 0));
    const dmg = Math.round(bat.damage * chMult);
    enemy.spawn(x, y, hp, speed, dmg);
  }

  /**
   * Spawna um bando coordenado de Blood Bats voando em nuvem do perímetro
   */
  public spawnBloodBatFlock(count: number = 5): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(360, 480);
    const originX = this.ctx.player.x + Math.cos(angle) * dist;
    const originY = this.ctx.player.y + Math.sin(angle) * dist;

    for (let i = 0; i < count; i++) {
      const offsetX = Phaser.Math.Between(-35, 35);
      const offsetY = Phaser.Math.Between(-35, 35);
      this.spawnBloodBatAt(originX + offsetX, originY + offsetY);
    }
  }

  public spawnMummyAt(
    x: number,
    y: number,
    hp: number = ENEMY_BALANCE.mummy.hp,
    speed: number = ENEMY_BALANCE.mummy.speed,
    damage: number = ENEMY_BALANCE.mummy.damage
  ): void {
    const clamped = this.ctx.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    const chMult = this.getChapterEnemyStatMultiplier();
    hp = Math.round(hp * chMult);
    damage = Math.round(damage * chMult);

    let enemy = this.ctx.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof MummyEnemy
    ) as MummyEnemy | undefined;

    if (!enemy) {
      enemy = new MummyEnemy(this.scene, x, y);
      enemy.setDepth(6);
      this.ctx.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number) => {
        this.ctx.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.ctx.player.gainUltimateCharge(4.5);
        this.ctx.addPurificationPoints(4);
        const gemType: GemType = Math.random() < 0.35 ? 'blue' : 'green';
        this.ctx.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas (25% de chance de 1 a 3 almas)
        if (Math.random() < 0.25) {
          this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(1, 3));
        }
      });
    }

    enemy.spawn(x, y, hp, speed, damage);
  }

  /**
   * Spawna horda intensa na Dimensão Corrompida de Azazel (Fase 3) enquanto o jogador captura os 3 Cristais
   */
  public spawnAzazelDimensionHordeWave(): void {
    if (this.ctx.player.isUltimateActive || !this.ctx.isAzazelPhase3HordeActive) return;
    if (this.ctx.enemiesGroup.countActive() >= PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES) return;

    const dogCount = Phaser.Math.Between(3, 5);
    for (let i = 0; i < dogCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(300, 440);
      const sx = this.ctx.player.x + Math.cos(angle) * dist;
      const sy = this.ctx.player.y + Math.sin(angle) * dist;
      this.spawnZombieDogAt(sx, sy, ENEMY_BALANCE.azazelDimensionDog.hp, ENEMY_BALANCE.azazelDimensionDog.speed, ENEMY_BALANCE.azazelDimensionDog.damage);
    }

    if (Math.random() < 0.45) {
      this.spawnBloodBatFlock(Phaser.Math.Between(4, 6));
    }

    if (Math.random() < 0.25) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(320, 420);
      this.spawnMummyAt(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist, ENEMY_BALANCE.azazelDimensionMummy.hp, ENEMY_BALANCE.azazelDimensionMummy.speed, ENEMY_BALANCE.azazelDimensionMummy.damage);
    }
  }

  public spawnEnemyRandomPerimeter(): void {
    // Não spawna se a Boss estiver em campo ou durante a Ultimate
    if (this.ctx.player.isUltimateActive || this.ctx.isBossFightActive) return;

    // Limite de Inimigos Vivos para manter 60 FPS
    if (this.ctx.enemiesGroup.countActive() >= PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES) return;

    const elapsedSec = Math.floor(this.ctx.survivalTimeMs / 1000);
    const scaling = getEnemyScaling(this.ctx.survivalTimeMs, this.ctx.gameMode === 'endless');
    const purifyRatio = this.ctx.gameMode === 'story'
      ? this.ctx.chapterPurifiedSouls / this.ctx.chapterTargetSouls
      : 0;

    // Determinar Fase Atual da Horda:
    // Fase 1: Somente Cães Zumbis (Até 25% da barra ou 90s)
    // Fase 2: Cães Zumbis + Morcegos de Sangue + Múmias (De 25% a 60% da barra ou 90s-210s)
    // Fase 3: Todos os Inimigos + Skull Slimes (A partir de 60% da barra ou >210s)
    let phase: 1 | 2 | 3;
    if (this.ctx.gameMode === 'story') {
      if (purifyRatio >= 0.60 || elapsedSec >= 210) {
        phase = 3;
      } else if (purifyRatio >= 0.25 || elapsedSec >= 90) {
        phase = 2;
      } else {
        phase = 1;
      }
    } else {
      // Modo Infinito (escalonado pelo tempo de sobrevivência)
      if (elapsedSec >= 135) {
        phase = 3;
      } else if (elapsedSec >= 60) {
        phase = 2;
      } else {
        phase = 1;
      }
    }

    // 1. BLOOD BATS: Surgem a partir da Fase 2, aumentam muito e voam em bandos numerosos
    if (phase >= 2) {
      const flockChance = phase === 3 ? 0.35 : 0.25;
      if (Math.random() < flockChance) {
        let flockSize: number;
        if (phase === 2) {
          flockSize = Phaser.Math.Between(4, 6);
        } else {
          // Na Fase 3 o bando cresce consideravelmente (muitos morcegos frágeis)
          flockSize = this.ctx.gameMode === 'endless'
            ? Math.min(12, Math.floor(6 + scaling.minutes * 1.2))
            : Phaser.Math.Between(5, 8);
        }
        this.spawnBloodBatFlock(flockSize);
      }
    }

    // 2. SKULL SLIMES: Surgem a partir da Fase 3, aumento estritamente controlado (tanques kamikaze mortais)
    if (phase === 3) {
      const activeSlimes = (this.ctx.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof SkullSlime
      ).length;

      const maxSlimes = this.ctx.gameMode === 'endless'
        ? (scaling.minutes >= 5 ? 3 : 2)
        : (purifyRatio >= 0.85 ? 2 : 1);

      const slimeChance = this.ctx.gameMode === 'endless' ? 0.25 : 0.20;

      if (activeSlimes < maxSlimes && Math.random() < slimeChance) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(340, 460);
        this.spawnSkullSlimeAt(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist);
      }
    }

    // 3. MÚMIAS DO ABISMO (Zigue-zague com rastro verde tóxico e knockback)
    if (phase >= 2) {
      const activeMummies = (this.ctx.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof MummyEnemy
      ).length;
      const maxMummies = phase === 3 ? 4 : 2;
      const mummyChance = phase === 3 ? 0.30 : 0.20;

      if (activeMummies < maxMummies && Math.random() < mummyChance) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(320, 440);
        const hp = Math.floor(ENEMY_BALANCE.mummy.hp * scaling.hpMultiplier);
        const speed = Math.floor(ENEMY_BALANCE.mummy.speed * scaling.speedMultiplier);
        const dmg = Math.floor(ENEMY_BALANCE.mummy.damage * scaling.damageMultiplier);
        this.spawnMummyAt(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist, hp, speed, dmg);
      }
    }

    // 4. ZOMBIE DOGS: Presentes em todas as fases com escalonamento de atributos
    let dogCount: number;
    if (phase === 1) {
      dogCount = Phaser.Math.Between(2, 3);
    } else if (phase === 2) {
      dogCount = this.ctx.gameMode === 'endless'
        ? Math.min(5, Math.floor(3 + scaling.minutes * 0.7))
        : Phaser.Math.Between(3, 4);
    } else {
      dogCount = this.ctx.gameMode === 'endless'
        ? Math.min(6, Math.floor(4 + scaling.minutes * 0.8))
        : Phaser.Math.Between(3, 5);
    }

    for (let i = 0; i < dogCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(340, 480);
      const spawnX = this.ctx.player.x + Math.cos(angle) * dist;
      const spawnY = this.ctx.player.y + Math.sin(angle) * dist;

      const isElite = this.ctx.gameMode === 'endless' && scaling.minutes >= ENEMY_BALANCE.zombieDogElite.minMinutes && Math.random() < ENEMY_BALANCE.zombieDogElite.chance;
      if (isElite) {
        const eliteHp = Math.floor(ENEMY_BALANCE.zombieDogElite.hp * scaling.hpMultiplier);
        const eliteSpeed = Math.floor(ENEMY_BALANCE.zombieDogElite.speed * scaling.speedMultiplier);
        const eliteDmg = Math.floor(ENEMY_BALANCE.zombieDogElite.damage * scaling.damageMultiplier);
        this.spawnZombieDogAt(spawnX, spawnY, eliteHp, eliteSpeed, eliteDmg, true, ENEMY_BALANCE.zombieDogElite.scale);
      } else {
        const hp = Math.floor(ENEMY_BALANCE.zombieDog.hp * scaling.hpMultiplier);
        const speed = Math.floor(ENEMY_BALANCE.zombieDog.speed * scaling.speedMultiplier);
        const dmg = Math.floor(ENEMY_BALANCE.zombieDog.damage * scaling.damageMultiplier);
        this.spawnZombieDogAt(spawnX, spawnY, hp, speed, dmg);
      }
    }
  }

  /**
   * Spawna o Mini-Chefe Titã Cerberus no Modo Infinito (3:00)
   */
  public spawnTitanCerberus(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 380;
    const x = this.ctx.player.x + Math.cos(angle) * dist;
    const y = this.ctx.player.y + Math.sin(angle) * dist;

    const titan = new ZombieDog(this.scene, x, y);
    titan.isSpecialMiniBoss = true;
    titan.setDepth(15);
    this.ctx.enemiesGroup.add(titan);

    const titanStats = ENEMY_BALANCE.titanCerberus;
    titan.spawn(x, y, titanStats.hp, titanStats.speed, titanStats.damage, true, titanStats.scale, 'purple');

    titan.on('enemy-killed', (ex: number, ey: number) => {
      this.ctx.killCount++;
      this.ctx.player.gainUltimateCharge(25);
      this.ctx.spawnGemAt(ex, ey, 'purple');
      // Drop garantido de 10 a 15 Almas Corrompidas
      this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(10, 15));
      // Drop de item especial de auxílio (Cálice de Cura ou Ímã)
      this.ctx.spawnMapItem(ex + 25, ey, Math.random() < 0.5 ? 'chalice' : 'magnet');
      this.scene.cameras.main.shake(250, 0.015);
    });

    this.scene.cameras.main.flash(200, 255, 60, 60);
    this.scene.cameras.main.shake(300, 0.015);
  }

  /**
   * Spawna a Mini-Chefe Matriarca Succubus (disponível via Sandbox / Modo de Teste F1)
   */
  public spawnMatriarchSuccubus(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 400;
    const x = this.ctx.player.x + Math.cos(angle) * dist;
    const y = this.ctx.player.y + Math.sin(angle) * dist;

    const matriarch = new SuccubusBoss(this.scene, x, y);
    matriarch.setDepth(21);
    this.ctx.enemiesGroup.add(matriarch);

    const matriarchStats = ENEMY_BALANCE.matriarchSuccubus;
    matriarch.spawn(x, y, matriarchStats.hp, matriarchStats.speed, matriarchStats.damage, matriarchStats.scale);
    matriarch.setTint(0xff758f);

    matriarch.on('boss-defeated', () => {
      this.ctx.killCount++;
      this.ctx.player.gainUltimateCharge(50);
      // Recompensa lendária: 2 Gemas Roxas, 15-20 Almas e Baú do Abismo
      this.ctx.spawnGemAt(matriarch.x - 20, matriarch.y, 'purple');
      this.ctx.spawnGemAt(matriarch.x + 20, matriarch.y, 'purple');
      this.ctx.spawnSoulItem(matriarch.x, matriarch.y, Phaser.Math.Between(15, 20));
      this.ctx.spawnMapItem(matriarch.x, matriarch.y - 30, 'chest');
      this.scene.cameras.main.shake(300, 0.02);
    });

    this.scene.cameras.main.flash(220, 255, 0, 128);
    this.scene.cameras.main.shake(300, 0.02);
  }
}

import Phaser from 'phaser';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { ZombieDog } from '../entities/enemies/ZombieDog';
import { SkullSlime } from '../entities/enemies/SkullSlime';
import { BloodBat } from '../entities/enemies/BloodBat';
import { MummyEnemy } from '../entities/enemies/MummyEnemy';
import { LynMiniBoss } from '../entities/enemies/LynMiniBoss';
import { getCrystalHordeScaling } from './crystalPhaseRules';
import { GhoulEnemy } from '../entities/enemies/GhoulEnemy';
import { TransporterEnemy } from '../entities/enemies/TransporterEnemy';
import { ColossusEnemy } from '../entities/enemies/ColossusEnemy';
import { ArcherEnemy } from '../entities/enemies/ArcherEnemy';
import type { GemType } from '../entities/items/SoulGem';
import type { MapItemType } from '../entities/items/MapItem';
import { SoundManager } from './SoundManager';
import { PERFORMANCE_LIMITS, ENEMY_BALANCE, HORDE_EVENT_BALANCE, ENDLESS_SCHEDULE, getStorySchedule, getEnemyScaling, getChapterConfig, getColossusMaxAlive, getArcherMaxAlive, type EnemyKind } from '../config/balance';

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
  /** Prêmio do minichefe: solta um talismã (pet ou arma única) no chão. */
  dropTalismanAt?(x: number, y: number): void;
  /** Cronograma: este inimigo já pode aparecer? (EncounterDirector). Ausente = todos liberados. */
  isEnemyUnlocked?(kind: EnemyKind): boolean;
  /** Flechas inimigas (a Arqueira dispara por aqui). */
  readonly enemyArrows?: { fire(x: number, y: number, angle: number, damage: number): void };
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
      (child) => !child.active && child instanceof ZombieDog
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
    const late = this.endlessLateScaling();
    const hp = Math.round((slime.hp + (this.ctx.gameMode === 'endless' ? minutes * slime.endlessHpPerMinute : 0)) * chMult * late.hp);
    const dmg = Math.round(slime.damage * chMult * late.damage);
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
    const late = this.endlessLateScaling();
    const hp = Math.round((bat.hp + (this.ctx.gameMode === 'endless' ? minutes * bat.endlessHpPerMinute : 0)) * chMult * late.hp);
    const speed = Math.floor(bat.speed + (this.ctx.gameMode === 'endless' ? minutes * bat.endlessSpeedPerMinute : 0));
    const dmg = Math.round(bat.damage * chMult * late.damage);
    enemy.spawn(x, y, hp, speed, dmg);
  }

  /**
   * Morcegos e slimes já ganham vida por minuto no Infinito; aqui entram a parte que acelera
   * da vida e o dano por tempo (antes eles nunca batiam mais forte). Fora do Infinito: 1.
   */
  private endlessLateScaling(): { hp: number; damage: number } {
    if (this.ctx.gameMode !== 'endless') return { hp: 1, damage: 1 };
    const s = getEnemyScaling(this.ctx.survivalTimeMs, true);
    return { hp: s.lateHpMultiplier, damage: s.damageMultiplier };
  }

  /**
   * Spawna um bando coordenado de Blood Bats voando em nuvem do perímetro
   */
  public spawnBloodBatFlock(count: number = 5, fromAngle?: number): void {
    const angle = fromAngle ?? Phaser.Math.FloatBetween(0, Math.PI * 2);
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
  public spawnAzazelDimensionHordeWave(strength: number = 1): void {
    if (!this.ctx.isAzazelPhase3HordeActive) return;
    if (this.ctx.enemiesGroup.countActive() >= PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES) return;

    // Quanto mais a fase se arrasta, mais vida e dano (os cristais são a saída)
    const s = getCrystalHordeScaling(strength);
    const dog = ENEMY_BALANCE.azazelDimensionDog;
    const mummy = ENEMY_BALANCE.azazelDimensionMummy;

    const dogCount = Phaser.Math.Between(3, 5);
    for (let i = 0; i < dogCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(300, 440);
      const sx = this.ctx.player.x + Math.cos(angle) * dist;
      const sy = this.ctx.player.y + Math.sin(angle) * dist;
      this.spawnZombieDogAt(sx, sy, Math.round(dog.hp * s.hp), dog.speed, Math.round(dog.damage * s.damage));
    }

    if (Math.random() < 0.45) {
      this.spawnBloodBatFlock(Phaser.Math.Between(4, 6));
    }

    if (Math.random() < 0.25) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(320, 420);
      this.spawnMummyAt(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist, Math.round(mummy.hp * s.hp), mummy.speed, Math.round(mummy.damage * s.damage));
    }
  }

  public spawnEnemyRandomPerimeter(): void {
    // Não spawna se a Boss estiver em campo ou durante a Ultimate
    if (this.ctx.isBossFightActive) return;

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

    // QUEM pode aparecer vem do cronograma (STORY_SCHEDULE / ENDLESS_SCHEDULE, via EncounterDirector);
    // a fase acima só regula QUANTOS e com que chance.
    const can = (kind: EnemyKind): boolean => this.ctx.isEnemyUnlocked?.(kind) ?? kind === 'dog';

    // 1. BLOOD BATS: bandos que crescem com a fase
    if (can('bat')) {
      const flockChance = phase === 3 ? 0.35 : 0.25;
      if (Math.random() < flockChance) {
        let flockSize: number;
        if (phase <= 2) {
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

    // 2. SKULL SLIMES: aumento estritamente controlado (tanques kamikaze mortais)
    if (can('slime')) {
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
    if (can('mummy')) {
      const activeMummies = (this.ctx.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof MummyEnemy
      ).length;
      const maxMummies = phase === 3 ? 4 : 2;
      const mummyChance = phase === 3 ? 0.30 : 0.20;

      if (activeMummies < maxMummies && Math.random() < mummyChance) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(320, 440);
        this.spawnScaledMummyAt(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist);
      }
    }

    const isEndless = this.ctx.gameMode === 'endless';

    // 3.1. COLOSSUS: tanque que chega na frente de uma escolta de cães
    const maxColossi = getColossusMaxAlive(isEndless, scaling.minutes);
    if (can('colossus') && Math.random() < ENEMY_BALANCE.colossus.chance) {
      const activeColossi = (this.ctx.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof ColossusEnemy
      ).length;
      if (activeColossi < maxColossi) this.spawnColossusFormation();
    }

    // 3.2. ARQUEIRAS: atiradoras que mantêm distância
    const maxArchers = getArcherMaxAlive(isEndless, scaling.minutes);
    if (can('archer') && Math.random() < ENEMY_BALANCE.archer.chance) {
      const activeArchers = (this.ctx.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof ArcherEnemy
      ).length;
      if (activeArchers < maxArchers) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(440, 520);
        this.spawnArcherAt(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist);
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

      this.spawnScaledDogAt(spawnX, spawnY, this.rollElite());
    }
  }

  /** Sorteia se o próximo cão nasce Alfa Elite (só depois que o cronograma libera o Alfa). */
  private rollElite(): boolean {
    if (this.ctx.gameMode === 'sandbox' || !(this.ctx.isEnemyUnlocked?.('elite') ?? false)) return false;
    const chance = this.ctx.gameMode === 'endless'
      ? ENDLESS_SCHEDULE.eliteChance
      : getStorySchedule(this.ctx.currentChapter).eliteChance;
    return Math.random() < chance;
  }

  /** Múmia com os atributos escalonados pelo tempo de partida. */
  public spawnScaledMummyAt(x: number, y: number): void {
    const scaling = getEnemyScaling(this.ctx.survivalTimeMs, this.ctx.gameMode === 'endless');
    const m = ENEMY_BALANCE.mummy;
    this.spawnMummyAt(x, y, Math.floor(m.hp * scaling.hpMultiplier), Math.floor(m.speed * scaling.speedMultiplier), Math.floor(m.damage * scaling.damageMultiplier));
  }

  /** Cão Zumbi (comum ou Alfa Elite) com os atributos escalonados pelo tempo de partida. */
  public spawnScaledDogAt(x: number, y: number, isElite: boolean = false): void {
    const scaling = getEnemyScaling(this.ctx.survivalTimeMs, this.ctx.gameMode === 'endless');
    const base = isElite ? ENEMY_BALANCE.zombieDogElite : ENEMY_BALANCE.zombieDog;
    const hp = Math.floor(base.hp * scaling.hpMultiplier);
    const speed = Math.floor(base.speed * scaling.speedMultiplier);
    const dmg = Math.floor(base.damage * scaling.damageMultiplier);
    if (isElite) {
      this.spawnZombieDogAt(x, y, hp, speed, dmg, true, ENEMY_BALANCE.zombieDogElite.scale);
    } else {
      this.spawnZombieDogAt(x, y, hp, speed, dmg);
    }
  }

  /** Arqueira Demônia com os atributos escalonados pelo tempo de partida. Reaproveita instâncias mortas. */
  public spawnArcherAt(x: number, y: number): ArcherEnemy {
    const pos = this.ctx.clampToArena(x, y);
    const scaling = getEnemyScaling(this.ctx.survivalTimeMs, this.ctx.gameMode === 'endless');
    const chMult = this.getChapterEnemyStatMultiplier();
    const cfg = ENEMY_BALANCE.archer;

    let archer = this.ctx.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof ArcherEnemy
    ) as ArcherEnemy | undefined;

    if (!archer) {
      archer = new ArcherEnemy(this.scene, pos.x, pos.y);
      archer.setDepth(6);
      this.ctx.enemiesGroup.add(archer);
      archer.on('enemy-killed', (ex: number, ey: number) => {
        this.ctx.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.ctx.player.gainUltimateCharge(4);
        this.ctx.addPurificationPoints(3);
        this.ctx.spawnGemAt(ex, ey, Math.random() < 0.4 ? 'blue' : 'green');
        if (Math.random() < 0.3) this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(1, 2));
      });
    }

    archer.setupArcher(
      (fx, fy, angle, dmg) => this.ctx.enemyArrows?.fire(fx, fy, angle, dmg),
      Math.round(cfg.arrow.damage * scaling.damageMultiplier * chMult)
    );
    archer.spawn(
      pos.x,
      pos.y,
      Math.round(cfg.hp * scaling.hpMultiplier * chMult),
      Math.floor(cfg.speed * scaling.speedMultiplier),
      Math.round(cfg.damage * scaling.damageMultiplier * chMult)
    );
    return archer;
  }

  /** Colossus (tanque-escudo) com os atributos escalonados pelo tempo de partida. Reaproveita instâncias mortas. */
  public spawnColossusAt(x: number, y: number): ColossusEnemy {
    const pos = this.ctx.clampToArena(x, y);
    const scaling = getEnemyScaling(this.ctx.survivalTimeMs, this.ctx.gameMode === 'endless');
    const chMult = this.getChapterEnemyStatMultiplier();
    const cfg = ENEMY_BALANCE.colossus;

    let colossus = this.ctx.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof ColossusEnemy
    ) as ColossusEnemy | undefined;

    if (!colossus) {
      colossus = new ColossusEnemy(this.scene, pos.x, pos.y);
      colossus.setDepth(7);
      this.ctx.enemiesGroup.add(colossus);
      colossus.on('enemy-killed', (ex: number, ey: number) => {
        this.ctx.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.ctx.player.gainUltimateCharge(8);
        this.ctx.addPurificationPoints(10);
        this.ctx.spawnGemAt(ex, ey, 'red');
        this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(2, 4));
        this.scene.cameras.main.shake(140, 0.006);
      });
    }

    colossus.spawn(
      pos.x,
      pos.y,
      Math.round(cfg.hp * scaling.hpMultiplier * chMult),
      Math.floor(cfg.speed * scaling.speedMultiplier),
      Math.round(cfg.damage * scaling.damageMultiplier * chMult)
    );
    return colossus;
  }

  /**
   * Formação do Colossus: ele na frente e uma fila de cães logo atrás, na mesma linha até a heroína.
   * Assim os projéteis que perfuram batem nele e não chegam na escolta.
   */
  public spawnColossusFormation(angle: number = Phaser.Math.FloatBetween(0, Math.PI * 2), dist: number = 420): void {
    const cfg = ENEMY_BALANCE.colossus;
    const p = this.ctx.player;
    this.spawnColossusAt(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist);

    const dogs = Math.min(cfg.escortDogs, Math.max(0, PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES - this.ctx.enemiesGroup.countActive()));
    for (let i = 0; i < dogs; i++) {
      // Pares lado a lado, cada par um passo mais para trás
      const back = dist + cfg.escortGapPx * (1 + Math.floor(i / 2));
      const side = (i % 2 === 0 ? -1 : 1) * 0.06;
      this.spawnScaledDogAt(p.x + Math.cos(angle + side) * back, p.y + Math.sin(angle + side) * back, this.rollElite());
    }
  }

  /**
   * Transportador: diabrete com um saco de gemas que foge do jogador. Quem o abate leva o saco
   * (chuva de gemas e almas). Instância própria, fora de qualquer pool.
   */
  public spawnSoulThief(): TransporterEnemy {
    const cfg = HORDE_EVENT_BALANCE.thief;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const pos = this.ctx.clampToArena(this.ctx.player.x + Math.cos(angle) * 260, this.ctx.player.y + Math.sin(angle) * 260);

    const thief = new TransporterEnemy(this.scene, pos.x, pos.y);
    thief.setDepth(14);
    this.ctx.enemiesGroup.add(thief);

    const minutes = this.ctx.survivalTimeMs / 60000;
    thief.spawn(pos.x, pos.y, Math.round(cfg.hp + minutes * cfg.hpPerMinute), cfg.speed, 0);

    thief.on('enemy-killed', (ex: number, ey: number) => {
      this.ctx.killCount++;
      SoundManager.getInstance().playEnemyDeath();
      this.ctx.player.gainUltimateCharge(20);
      for (let i = 0; i < cfg.gems; i++) {
        const a = (i / cfg.gems) * Math.PI * 2;
        const r = Phaser.Math.Between(24, 70);
        this.ctx.spawnGemAt(ex + Math.cos(a) * r, ey + Math.sin(a) * r, i % 4 === 0 ? 'red' : 'blue');
      }
      this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(cfg.soulsMin, cfg.soulsMax));
      if (Math.random() < cfg.chestChance) this.ctx.spawnMapItem(ex, ey - 30, 'chest');
      this.scene.cameras.main.shake(200, 0.01);
    });

    return thief;
  }

  /**
   * Spawna o Mini-Chefe Ghoul Devorador no Modo Infinito (3:00). Instância própria, fora de qualquer pool.
   */
  /** @param hpMultiplier vida extra (Círculos do Infinito) */
  public spawnGhoulDevourer(hpMultiplier: number = 1): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 380;
    const pos = this.ctx.clampToArena(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist);
    const { x, y } = pos;

    const ghoul = new GhoulEnemy(this.scene, x, y);
    ghoul.setDepth(15);
    this.ctx.enemiesGroup.add(ghoul);

    const ghoulStats = ENEMY_BALANCE.ghoulDevourer;
    ghoul.spawn(x, y, Math.round(ghoulStats.hp * hpMultiplier), ghoulStats.speed, ghoulStats.damage);

    ghoul.on('enemy-killed', (ex: number, ey: number) => {
      this.ctx.killCount++;
      this.ctx.player.gainUltimateCharge(25);
      this.ctx.spawnGemAt(ex, ey, 'purple');
      // Drop garantido de 10 a 15 Almas Corrompidas
      this.ctx.spawnSoulItem(ex, ey, Phaser.Math.Between(10, 15));
      // Drop de item especial de auxílio (Cálice de Cura ou Ímã)
      this.ctx.spawnMapItem(ex + 25, ey, Math.random() < 0.5 ? 'chalice' : 'magnet');
      this.ctx.dropTalismanAt?.(ex, ey + 40);
      this.scene.cameras.main.shake(250, 0.015);
    });

    this.scene.cameras.main.flash(200, 255, 60, 60);
    this.scene.cameras.main.shake(300, 0.015);
  }

  /**
   * Spawna a minichefe Lyn, súcubo jovem com arte própria (antes "Matriarca Succubus",
   * que era a Rosalin pintada de rosa). Usa os golpes da súcubo em escala menor.
   */
  /** @param hpMultiplier vida extra (Círculos do Infinito) */
  public spawnLyn(hpMultiplier: number = 1): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 400;
    const pos = this.ctx.clampToArena(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist);
    const { x, y } = pos;

    const lyn = new LynMiniBoss(this.scene, x, y);
    this.ctx.enemiesGroup.add(lyn);

    const stats = ENEMY_BALANCE.lyn;
    lyn.spawn(x, y, Math.round(stats.hp * hpMultiplier), stats.speed, stats.damage, stats.scale);

    lyn.on('boss-defeated', () => {
      this.ctx.killCount++;
      this.ctx.player.gainUltimateCharge(50);
      // Recompensa lendária: 2 Gemas Roxas, 15-20 Almas e Baú do Abismo
      this.ctx.spawnGemAt(lyn.x - 20, lyn.y, 'purple');
      this.ctx.spawnGemAt(lyn.x + 20, lyn.y, 'purple');
      this.ctx.spawnSoulItem(lyn.x, lyn.y, Phaser.Math.Between(15, 20));
      this.ctx.spawnMapItem(lyn.x, lyn.y - 30, 'chest');
      this.ctx.dropTalismanAt?.(lyn.x, lyn.y + 40);
      this.scene.cameras.main.shake(300, 0.02);
    });

    this.scene.cameras.main.flash(220, 255, 0, 128);
    this.scene.cameras.main.shake(300, 0.02);
  }
}

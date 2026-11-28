import Phaser from 'phaser';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import { AzazelBoss, AzazelPhantomClone } from '../entities/enemies/AzazelBoss';
import { ShylphBoss } from '../entities/enemies/ShylphBoss';
import { BossSummonAltar } from '../entities/items/BossSummonAltar';
import { AzazelCrystal } from '../entities/items/AzazelCrystal';
import type { GemType } from '../entities/items/SoulGem';
import type { MapItemType } from '../entities/items/MapItem';
import type { DialogueLine } from './DialogueSystem';
import type { ICombatBubbleTarget } from './CombatBubbleSystem';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';
import { MetaProgressManager } from './MetaProgressManager';
import { MapStorageManager, ChapterMapConfig } from '../config/mapData';
import { ROSALIN_INTRO_DIALOGUE, AZAZEL_INTRO_DIALOGUE, SHYLPH_FIGHT_TEXT, getBossRematchDialogue } from '../config/dialogues';
import {
  AZAZEL_BOSS_BALANCE,
  SHYLPH_BOSS_BALANCE,
  CAMERA_BALANCE,
  SUCCUBUS_BOSS_BALANCE,
  ENEMY_BALANCE,
  BOSS_FATIGUE,
  getBossFatigueMultiplier,
  getBossMercy,
  getBossDefeatOutcome,
} from '../config/balance';
import { CRYSTAL_ARENA_THEME, SUMMON_ALTAR_EMBERS } from '../config/theme';
import { CHAPTER_DECOR_KITS } from '../config/sceneryCatalog';
import { getCrystalHordeStrength, getCrystalWaveIntervalMs, getBossRegenHp, clampToCircle } from './crystalPhaseRules';

export type BossId = 'rosalin' | 'azazel' | 'shylph';

/** Nome curto usado nos avisos de luta. */
const BOSS_SHORT_NAME: Record<BossId, string> = { rosalin: 'ROSALIN', azazel: 'AZAZEL', shylph: 'SHYLPH' };

/** Mapa da Dimensão Corrompida (fase dos cristais do Azazel). */
const AZAZEL_DIMENSION_MAP_ID = 202;
const DEFAULT_CAMERA_ZOOM = CAMERA_BALANCE.gameplayZoom;
const AZAZEL_FIGHT_ZOOM = 1.35;
/**
 * Espera do fim do loop da intro do Azazel: a câmera desliza bem devagar até ele e se
 * aproxima (o jogador vê que algo vai acontecer, não acha que travou). Quando o loop
 * acaba, ela volta rápido para a heroína e abre para o zoom da luta.
 */
const AZAZEL_APPROACH = { zoom: 2.5, durationMs: 5000, pullBackMs: 450 } as const;

/** O que o sistema usa da HUD (a UIScene cumpre este contrato). */
export interface IBossFightHud {
  showWaveAlert(message: string, durationMs?: number): void;
  showCenterAnnouncement(title: string, subtitle?: string, durationMs?: number): void;
  showCenterBossPhrase(phrase: string, durationMs?: number): void;
  setHUDVisible(visible: boolean): void;
}

/** Contrato mínimo que a cena de jogo expõe para o BossFightSystem. */
export interface IBossFightContext {
  readonly player: BaseCharacter;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly currentChapter: number;
  readonly survivalTimeMs: number;
  killCount: number;
  isBossFightActive: boolean;
  isPlayerMovementLocked: boolean;
  isHordeSpawningPaused: boolean;
  isChapterCompleted: boolean;
  bossInstance?: SuccubusBoss;
  azazelBoss?: AzazelBoss;
  shylphBoss?: ShylphBoss;
  bossSummonAltar: BossSummonAltar | null;

  clampToArena(x: number, y: number, margin?: number): { x: number; y: number };
  playDialogue(lines: DialogueLine[], onComplete: () => void): void;
  clearCombatSpeechBubbles(): void;
  startBossCombatBanter(): void;
  showCombatSpeechBubble(target: ICombatBubbleTarget, text: string, durationMs: number, isNixy?: boolean): void;
  spawnZombieDogAt(x: number, y: number, hp?: number, speed?: number, damage?: number): void;
  spawnBloodBatFlock(count?: number): void;
  /** `strength` 1 = horda normal; sobe enquanto a fase dos cristais se arrasta. */
  spawnAzazelDimensionHordeWave(strength?: number): void;
  spawnGemAt(x: number, y: number, type: GemType): void;
  spawnSoulItem(x: number, y: number, value?: number): void;
  spawnMapItem(x: number, y: number, type?: MapItemType): unknown;
  loadCustomMapLayout(config?: ChapterMapConfig): void;
  setArenaFloorTexture(textureKey: string): void;
  playRespawnStarEffect(): void;
  setCameraZoom(zoom: number, duration?: number): void;
  /** Some com o cenário do mapa (desenho e colisão) enquanto a tela está no escuro. */
  setDecorHidden(hidden: boolean): void;
}

/**
 * BossFightSystem — tudo que é luta de chefe: Altar de Invocação, entrada
 * cinematográfica, diálogos de revanche, música, reforços da Rosalin, fases do
 * Azazel (escuridão, cristais, duelo final), recompensas e fim de capítulo.
 *
 * Também aplica a rede de segurança de balanceamento (`balance.ts`):
 *  - Revanche: cada morte para o chefe alivia a próxima tentativa.
 *  - Exaustão: luta longa demais faz o chefe receber mais dano.
 */
export class BossFightSystem {
  public crystals: AzazelCrystal[] = [];
  public crystalsCaptured = 0;
  public isPhase3HordeActive = false;

  private minionTimer = 0;
  private dimensionWaveTimer = 0;
  /** Tempo na fase dos cristais: quanto mais demora, mais forte a horda. */
  private crystalPhaseElapsedMs = 0;
  /** Centro da área da fase dos cristais (a heroína não sai do círculo em volta dele). */
  private crystalArenaCenter?: { x: number; y: number };
  /** Câmera parada na roda de caveiras do Azazel (solta ao fim da roda, na fase dos cristais e na morte). */
  private isSkullRingCameraLocked = false;
  private crystalArenaRing?: Phaser.GameObjects.Graphics;
  private fightBossId?: BossId;
  private fightElapsedMs = 0;
  private fatigueAnnounced = false;

  constructor(private readonly scene: Phaser.Scene, private readonly ctx: IBossFightContext) {}

  private get hud(): IBossFightHud | undefined {
    return this.scene.scene.get('UIScene') as unknown as IBossFightHud | undefined;
  }

  // ===========================================================================
  // Consulta
  // ===========================================================================

  /** Chefe que o jogador está enfrentando agora (para registrar mortes e revanches). */
  public getActiveBossId(): BossId | undefined {
    if (!this.ctx.isBossFightActive) return undefined;
    if (this.ctx.currentChapter === 3 || this.ctx.shylphBoss?.active) return 'shylph';
    return this.ctx.currentChapter === 2 || this.ctx.azazelBoss?.active ? 'azazel' : 'rosalin';
  }

  private getBossById(id: BossId): { active: boolean; isDead: boolean; damageTakenMultiplier: number } | undefined {
    if (id === 'azazel') return this.ctx.azazelBoss;
    if (id === 'shylph') return this.ctx.shylphBoss;
    return this.ctx.bossInstance;
  }

  /** Multiplicador atual de dano recebido pelo chefe (1 = sem exaustão). */
  public getFatigueMultiplier(): number {
    if (!this.fightBossId) return 1;
    return getBossFatigueMultiplier(this.fightElapsedMs, BOSS_FATIGUE[this.fightBossId]);
  }

  // ===========================================================================
  // Atualização por quadro
  // ===========================================================================

  public update(delta: number): void {
    const altar = this.ctx.bossSummonAltar;
    if (altar && altar.active) {
      altar.updateAltar(this.ctx.player, delta);
    }

    for (const crystal of this.crystals) {
      if (crystal && crystal.active && !crystal.isCompleted) {
        crystal.updateCrystal(this.ctx.player, delta);
      }
    }

    if (!this.ctx.isBossFightActive) return;

    this.updateFatigue(delta);

    if (this.isPhase3HordeActive) {
      this.updateCrystalPhase(delta);
      return;
    }

    const rosalin = this.ctx.bossInstance;
    if (rosalin && rosalin.active && !rosalin.isDead && !rosalin.isInvulnerable) {
      this.minionTimer += delta;
      if (this.minionTimer >= SUCCUBUS_BOSS_BALANCE.minions.intervalMs) {
        this.minionTimer = 0;
        this.summonRosalinMinions(rosalin);
      }
    }
  }

  private updateFatigue(delta: number): void {
    if (!this.fightBossId) return;
    const boss = this.getBossById(this.fightBossId);
    if (!boss || !boss.active || boss.isDead) return;

    this.fightElapsedMs += delta;
    const mult = this.getFatigueMultiplier();
    boss.damageTakenMultiplier = mult;

    if (mult > 1 && !this.fatigueAnnounced) {
      this.fatigueAnnounced = true;
      const name = BOSS_SHORT_NAME[this.fightBossId];
      this.hud?.showWaveAlert(`${name} ESTÁ CANSANDO!\nSEUS GOLPES CAUSAM MAIS DANO!`, 3500);
      DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Exaustão do chefe iniciada (${name}) aos ${Math.round(this.fightElapsedMs / 1000)}s de luta.`);
    }
  }

  private startFightClock(bossId: BossId): void {
    this.fightBossId = bossId;
    this.fightElapsedMs = 0;
    this.fatigueAnnounced = false;
    this.minionTimer = 0;
  }

  private stopFightClock(): void {
    this.fightBossId = undefined;
    this.fightElapsedMs = 0;
  }

  /** Quantas vezes o jogador já morreu para este chefe (só conta no Modo História). */
  private getMercy(bossId: BossId): ReturnType<typeof getBossMercy> {
    const deaths = this.ctx.gameMode === 'story' ? MetaProgressManager.getInstance().getDeathsToBoss(bossId) : 0;
    return getBossMercy(deaths);
  }

  // ===========================================================================
  // Altar de Invocação
  // ===========================================================================

  /** Instancia (ou reposiciona) o Altar de Invocação, inicialmente adormecido. */
  public spawnSummonAltar(x: number, y: number): void {
    if (this.ctx.bossSummonAltar) {
      this.ctx.bossSummonAltar.destroy();
      this.ctx.bossSummonAltar = null;
    }
    // Altar com a arte do capítulo, quando existe (Capítulos 2 e 3)
    const kitAltar = CHAPTER_DECOR_KITS[this.ctx.currentChapter]?.altar;
    const look = kitAltar ? { ...kitAltar, embers: SUMMON_ALTAR_EMBERS[this.ctx.currentChapter] } : undefined;
    const altar = new BossSummonAltar(this.scene, x, y, look);
    altar.on('boss-summon-triggered', () => this.handleSummonTriggered());
    this.ctx.bossSummonAltar = altar;
  }

  /** Desperta o altar e interrompe o nascimento de novas hordas. */
  public activateSummonAltar(): void {
    const altar = this.ctx.bossSummonAltar;
    if (!altar || altar.isActive) return;
    altar.activate();
    this.ctx.isHordeSpawningPaused = true;

    const bossLabel = this.ctx.currentChapter === 3 ? 'SHYLPH' : this.ctx.currentChapter === 2 ? 'AZAZEL' : 'ROSALIN';
    this.hud?.showCenterAnnouncement('O ALTAR DE INVOCAÇÃO FOI INVOCADO!', `SIGA O MARCADOR PARA O CONFRONTO CONTRA ${bossLabel}`);
    DebugSessionLogger.getInstance().log('ALTAR', 'INFO', `Altar de Invocação ativado (${bossLabel})! Hordas pausadas.`);
  }

  /** Atalho usado pelo Modo de Teste: desperta o altar ou, se já desperto, começa a luta. */
  public triggerEncounter(): void {
    const altar = this.ctx.bossSummonAltar;
    if (altar && !altar.isActive) {
      this.activateSummonAltar();
      return;
    }
    this.handleSummonTriggered();
  }

  private handleSummonTriggered(): void {
    if (this.ctx.isBossFightActive) return;
    if (this.ctx.currentChapter === 3) {
      this.startShylphEncounter();
    } else if (this.ctx.currentChapter === 2) {
      this.startAzazelEncounter();
    } else {
      this.startRosalinEncounter();
    }
  }

  // ===========================================================================
  // Utilidades compartilhadas
  // ===========================================================================

  private isBossEntity(e: BaseEnemy): boolean {
    return e === this.ctx.bossInstance || e === this.ctx.azazelBoss || e === this.ctx.shylphBoss || e instanceof AzazelPhantomClone;
  }

  /** Pulveriza todos os monstros comuns, deixando só o chefe em campo. */
  private dissipateMinions(): void {
    const mobs = this.ctx.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && !this.isBossEntity(m)) {
        m.takeDamage(99999);
      }
    }
  }

  private stopPlayer(): void {
    const body = this.ctx.player.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.setVelocity(0, 0);
  }

  private facePlayerNorth(): void {
    const player = this.ctx.player;
    this.stopPlayer();
    player.currentDirection = 'north';
    player.play(`${player.characterId}-idle-north`);
  }

  /** Posição do chefe: sobre o altar desperto, no ponto do mapa, ou perto do jogador. */
  private resolveBossSpawn(fallbackDx: number, fallbackDy: number): { x: number; y: number } {
    const altar = this.ctx.bossSummonAltar;
    if (altar && altar.isActive) {
      return { x: altar.x, y: altar.y - 15 };
    }
    const activeMap = MapStorageManager.getActiveMap(this.ctx.currentChapter);
    if (activeMap?.bossSpawn) {
      return { x: activeMap.bossSpawn.x, y: activeMap.bossSpawn.y };
    }
    return { x: this.ctx.player.x + fallbackDx, y: this.ctx.player.y + fallbackDy };
  }

  private dropBossLoot(x: number, y: number, purpleGems: number, souls: { min: number; max: number }): void {
    const spread = 30;
    for (let i = 0; i < purpleGems; i++) {
      this.ctx.spawnGemAt(x + (i - (purpleGems - 1) / 2) * spread, y, 'purple');
    }
    this.ctx.spawnSoulItem(x, y, Phaser.Math.Between(souls.min, souls.max));
    this.ctx.spawnMapItem(x, y - 38, 'chest');
  }

  /** Partida continua depois do chefe (Infinito e Modo de Teste): solta o prêmio e retoma as hordas. */
  private continueRunAfterBoss(defeatLabel: string, x: number, y: number, souls: { min: number; max: number }): void {
    this.ctx.isBossFightActive = false;
    this.ctx.isHordeSpawningPaused = false;
    this.ctx.isPlayerMovementLocked = false;
    this.ctx.clearCombatSpeechBubbles();
    SoundManager.getInstance().playBattleMusic(1500, this.ctx.currentChapter);

    if (this.ctx.gameMode === 'sandbox') {
      this.dropBossLoot(x, y, 2, souls);
      this.hud?.showWaveAlert(`${defeatLabel}! (MODO DE TESTE CONTINUA)`, 4000);
      return;
    }

    this.ctx.killCount += 5;
    this.ctx.player.gainUltimateCharge(100);
    this.dropBossLoot(x, y, 3, souls);
    this.scene.cameras.main.flash(400, 255, 215, 0);
    this.scene.cameras.main.shake(400, 0.025);
    this.hud?.showWaveAlert('CHEFE DERROTADO! A SOBREVIVÊNCIA CONTINUA...', 5000);
  }

  /** Modo História: encerra o capítulo e vai para a cena de desfecho. */
  private completeChapter(chapter: number, souls: { min: number; max: number }): void {
    MetaProgressManager.getInstance().collectRunSoul(Phaser.Math.Between(souls.min, souls.max));
    // Libera o próximo capítulo e guarda o melhor tempo (tela de escolha de capítulo)
    MetaProgressManager.getInstance().recordChapterCompleted(chapter, Math.floor(this.ctx.survivalTimeMs / 1000));

    this.ctx.isChapterCompleted = true;
    this.ctx.clearCombatSpeechBubbles();
    SoundManager.getInstance().stopMusic(1500);
    this.scene.physics.pause();
    this.stopPlayer();
    this.dissipateMinions();

    const runStats = {
      kills: this.ctx.killCount,
      level: this.ctx.player.currentLevel,
      timeSec: Math.floor(this.ctx.survivalTimeMs / 1000),
    };

    this.scene.time.delayedCall(800, () => {
      this.scene.cameras.main.fadeOut(700, 0, 0, 0);
      this.scene.cameras.main.once('camerafadeoutcomplete', () => {
        SoundManager.getInstance().stopMusic();
        this.scene.scene.stop('UIScene');
        // Banca as almas aqui: ao trocar de cena a GameScene zera o contador da partida,
        // e a cena de desfecho mostrava "ALMAS PEGAS: +0"
        const soulsEarned = MetaProgressManager.getInstance().finalizeRunSouls();
        this.scene.scene.start('Chapter1EndScene', { runStats: { ...runStats, soulsEarned }, chapter });
      });
    });
  }

  // ===========================================================================
  // ROSALIN (Capítulo 1 e chefe do Modo Infinito)
  // ===========================================================================

  private startRosalinEncounter(): void {
    this.ctx.isBossFightActive = true;
    SoundManager.getInstance().playBossMusic(2200);

    this.dissipateMinions();
    this.ctx.clearCombatSpeechBubbles();
    if (this.ctx.bossSummonAltar) this.facePlayerNorth();

    this.scene.cameras.main.flash(350, 255, 60, 60);
    this.scene.cameras.main.shake(250, 0.02);

    // Ela se materializa sobre o altar, parada e intocável, até o diálogo acabar
    this.spawnRosalin(false, true);
    this.scene.time.delayedCall(300, () => this.playRosalinIntroDialogue());
  }

  private playRosalinIntroDialogue(): void {
    const mercy = this.getMercy('rosalin');
    const deaths = this.ctx.gameMode === 'story' ? MetaProgressManager.getInstance().getDeathsToBoss('rosalin') : 0;
    const lines: DialogueLine[] = deaths > 0 ? getBossRematchDialogue('rosalin', deaths) : ROSALIN_INTRO_DIALOGUE;

    this.ctx.playDialogue(lines, () => {
      this.ctx.clearCombatSpeechBubbles();
      const boss = this.ctx.bossInstance;
      if (!boss || !boss.active) {
        this.spawnRosalin(true, false);
        return;
      }
      boss.startCombat();
      this.startFightClock('rosalin');
      this.ctx.startBossCombatBanter();
      if (mercy.stacks > 0) this.announceMercy('ROSALIN ESTÁ ENFRAQUECIDA');
    });
  }

  private announceMercy(weakenedLabel: string): void {
    this.hud?.showWaveAlert(`SUA FÚRIA CRESCE A CADA QUEDA!\n${weakenedLabel}`, 3200);
  }

  /**
   * Coloca a Rosalin em campo.
   * @param startBanter começa os balões de provocação na hora
   * @param isCinematicIntro nasce parada e intocável (aguardando o diálogo)
   * @param variant 'story' (padrão) ou 'endless' (chefe cronometrada do Infinito)
   */
  public spawnRosalin(
    startBanter = true,
    isCinematicIntro = false,
    variant: 'story' | 'endless' = 'story',
    circleScale: { hp: number; damage: number } = { hp: 1, damage: 1 }
  ): void {
    const pos = variant === 'endless'
      ? this.ctx.clampToArena(this.ctx.player.x + 240, this.ctx.player.y - 140)
      : this.resolveBossSpawn(220, -140);
    const stats = SUCCUBUS_BOSS_BALANCE[variant];
    const base = this.getMercy('rosalin');
    // Círculos do Infinito multiplicam por cima da revanche (que no Infinito é sempre 1)
    const mercy = { ...base, hpMultiplier: base.hpMultiplier * circleScale.hp, damageMultiplier: base.damageMultiplier * circleScale.damage };

    const boss = new SuccubusBoss(this.scene, pos.x, pos.y);
    boss.setDepth(22);
    this.ctx.enemiesGroup.add(boss);
    boss.spawn(
      pos.x,
      pos.y,
      Math.round(stats.hp * mercy.hpMultiplier),
      stats.speed,
      Math.round(stats.damage * mercy.damageMultiplier),
      stats.scale,
      isCinematicIntro
    );
    boss.attackDamageMultiplier = stats.attackDamageMultiplier * mercy.damageMultiplier;
    this.ctx.bossInstance = boss;

    this.scene.cameras.main.flash(260, 255, 0, 85);
    this.scene.cameras.main.shake(300, 0.022);

    if (!isCinematicIntro) this.startFightClock('rosalin');
    if (startBanter) this.ctx.startBossCombatBanter();

    boss.on('boss-defeated', () => {
      // A chefe cronometrada do Infinito não nasce do altar, então não o encerra
      if (variant === 'story') this.ctx.bossSummonAltar?.complete();
      this.handleRosalinDefeated(boss);
    });
  }

  /**
   * Chefe do Modo Infinito que surge sozinha no fim do Círculo e vem até a heroína (sem altar).
   * @param circleScale vida e dano extras do Círculo (`endlessBossMultipliers`)
   */
  public spawnEndlessTimedBoss(circleScale: { hp: number; damage: number } = { hp: 1, damage: 1 }): void {
    this.ctx.isBossFightActive = true;
    SoundManager.getInstance().playBossMusic(2200);
    this.spawnRosalin(false, false, 'endless', circleScale);
  }

  private summonRosalinMinions(boss: SuccubusBoss): void {
    const cfg = SUCCUBUS_BOSS_BALANCE.minions;
    const guard = ENEMY_BALANCE.zombieDogMapGuard;
    this.ctx.showCombatSpeechBubble(boss, 'Lacaios, devorem essa vadia!', 2000, false);
    SoundManager.getInstance().playEnemyDeath();

    for (let i = 0; i < cfg.dogs; i++) {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const p = this.ctx.clampToArena(boss.x + Math.cos(a) * 150, boss.y + Math.sin(a) * 150);
      this.ctx.spawnZombieDogAt(p.x, p.y, guard.hp, guard.speed, guard.damage);
    }
    this.ctx.spawnBloodBatFlock(cfg.bats);
  }

  private handleRosalinDefeated(boss: SuccubusBoss): void {
    DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Succubus derrotada em ${Math.round(this.fightElapsedMs / 1000)}s de luta.`);
    this.stopFightClock();

    if (getBossDefeatOutcome(this.ctx.gameMode) === 'continue-run') {
      if (this.ctx.bossInstance === boss) this.ctx.bossInstance = undefined;
      this.continueRunAfterBoss('SUCCUBUS DERROTADA', boss.x, boss.y, SUCCUBUS_BOSS_BALANCE.soulReward);
      return;
    }
    this.completeChapter(1, SUCCUBUS_BOSS_BALANCE.soulReward);
  }

  // ===========================================================================
  // SHYLPH, A SERAFIM CAÍDA (Capítulo 3): morte falsa entre as fases
  // ===========================================================================

  private startShylphEncounter(): void {
    this.ctx.isBossFightActive = true;
    SoundManager.getInstance().playShylphMusic(2200);
    this.dissipateMinions();
    this.ctx.clearCombatSpeechBubbles();
    this.scene.cameras.main.flash(350, 255, 255, 255);
    this.scene.cameras.main.shake(250, 0.02);
    this.spawnShylph();
  }

  /** Coloca a Shylph em campo já lutando (o diálogo de entrada vem com o Capítulo 3). */
  public spawnShylph(): void {
    // No Modo de Teste ela nasce perto da heroína (o ponto de chefe do mapa pode estar longe)
    const pos = this.ctx.gameMode === 'sandbox'
      ? this.ctx.clampToArena(this.ctx.player.x + 220, this.ctx.player.y - 160)
      : this.resolveBossSpawn(220, -160);
    const mercy = this.getMercy('shylph');
    const boss = new ShylphBoss(this.scene, pos.x, pos.y);
    this.ctx.enemiesGroup.add(boss);
    boss.spawn(pos.x, pos.y, Math.round(SHYLPH_BOSS_BALANCE.hp * mercy.hpMultiplier));
    boss.attackDamageMultiplier = mercy.damageMultiplier;
    this.ctx.shylphBoss = boss;
    this.startFightClock('shylph');
    if (mercy.stacks > 0) this.announceMercy('SHYLPH ESTÁ ENFRAQUECIDA');

    const logPhase = (label: string): void =>
      DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Shylph: ${label} aos ${Math.round(this.fightElapsedMs / 1000)}s de luta.`);
    boss.on('shylph-seraph', () => {
      logPhase('forma de Serafim');
      this.ctx.showCombatSpeechBubble(boss, SHYLPH_FIGHT_TEXT.seraphTaunt, 2200, false);
    });
    boss.on('shylph-collapse', () => logPhase('caiu de joelhos'));
    boss.on('shylph-rise', () => this.ctx.showCombatSpeechBubble(boss, SHYLPH_FIGHT_TEXT.risePhrase, 2400, false));
    boss.on('shylph-final', () => logPhase('fase final'));
    boss.on('shylph-lick', () => {
      const taunts = SHYLPH_FIGHT_TEXT.lickTaunts;
      this.ctx.showCombatSpeechBubble(boss, taunts[Phaser.Math.Between(0, taunts.length - 1)], 2000, false);
    });
    boss.on('boss-defeated', () => {
      this.ctx.bossSummonAltar?.complete();
      this.handleShylphDefeated(boss);
    });
  }

  private handleShylphDefeated(boss: ShylphBoss): void {
    DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Shylph derrotada em ${Math.round(this.fightElapsedMs / 1000)}s de luta.`);
    this.stopFightClock();
    if (getBossDefeatOutcome(this.ctx.gameMode) === 'continue-run') {
      if (this.ctx.shylphBoss === boss) this.ctx.shylphBoss = undefined;
      this.continueRunAfterBoss(SHYLPH_FIGHT_TEXT.defeatLabel, boss.x, boss.y, SHYLPH_BOSS_BALANCE.soulReward);
      return;
    }
    this.completeChapter(3, SHYLPH_BOSS_BALANCE.soulReward);
  }

  // ===========================================================================
  // AZAZEL (Capítulo 2): 3 fases + música sincronizada
  // ===========================================================================

  /**
   * Entrada cinematográfica no altar:
   * 1. intro.mp3 baixo em loop durante o diálogo.
   * 2. Fim do diálogo: jogador segue parado enquanto a intro termina o último loop.
   * 3. mid.mp3 (~2s): Azazel ergue a mão e grita.
   * 4. fight.mp3 em loop e a luta começa.
   */
  public startAzazelEncounter(): void {
    this.ctx.isBossFightActive = true;
    this.ctx.isPlayerMovementLocked = true;
    SoundManager.getInstance().playAzazelIntroMusic();

    this.dissipateMinions();
    this.ctx.clearCombatSpeechBubbles();
    this.facePlayerNorth();

    this.scene.cameras.main.flash(350, 255, 20, 70);
    this.scene.cameras.main.shake(250, 0.02);

    this.spawnAzazel(true);

    const boss = this.ctx.azazelBoss;
    if (boss) {
      this.ctx.player.setPosition(boss.x, boss.y + 135);
      this.facePlayerNorth();
    }

    this.scene.time.delayedCall(300, () => this.playAzazelIntroDialogue());
  }

  private playAzazelIntroDialogue(): void {
    const deaths = this.ctx.gameMode === 'story' ? MetaProgressManager.getInstance().getDeathsToBoss('azazel') : 0;
    const lines: DialogueLine[] = deaths > 0 ? getBossRematchDialogue('azazel', deaths) : AZAZEL_INTRO_DIALOGUE;

    this.ctx.playDialogue(lines, () => {
      this.ctx.clearCombatSpeechBubbles();
      this.ctx.isPlayerMovementLocked = true;
      this.facePlayerNorth();
      this.approachCameraToAzazel();

      SoundManager.getInstance().finishAzazelIntroAndTransition(
        () => {
          // Fim do loop: câmera volta rápido para a heroína e abre para caber raios e investidas
          this.pullCameraBackFromAzazel();
          const boss = this.ctx.azazelBoss;
          if (boss && boss.active) boss.playMidPrepareScream(this.ctx.player);
        },
        () => {
          this.ctx.isPlayerMovementLocked = false;
          const boss = this.ctx.azazelBoss;
          if (boss && boss.active) {
            boss.startCombat();
            this.startFightClock('azazel');
            if (this.getMercy('azazel').stacks > 0) this.announceMercy('AZAZEL ESTÁ ENFRAQUECIDO');
          }
        }
      );
    });
  }

  /**
   * A câmera continua seguindo a heroína (parada), mas o deslocamento do acompanhamento
   * desliza até centralizar o Azazel, enquanto o zoom aproxima devagar.
   */
  private approachCameraToAzazel(): void {
    const boss = this.ctx.azazelBoss;
    if (!boss || !boss.active) return;
    const cam = this.scene.cameras.main;
    const player = this.ctx.player;
    this.scene.tweens.killTweensOf(cam.followOffset);
    this.scene.tweens.add({
      targets: cam.followOffset,
      x: player.x - boss.x,
      y: player.y - boss.y,
      duration: AZAZEL_APPROACH.durationMs,
      ease: 'Sine.easeInOut',
    });
    this.ctx.setCameraZoom(AZAZEL_APPROACH.zoom, AZAZEL_APPROACH.durationMs);
  }

  private pullCameraBackFromAzazel(): void {
    const cam = this.scene.cameras.main;
    this.scene.tweens.killTweensOf(cam.followOffset);
    this.scene.tweens.killTweensOf(cam);
    this.scene.tweens.add({
      targets: cam.followOffset,
      x: 0,
      y: 0,
      duration: AZAZEL_APPROACH.pullBackMs,
      ease: 'Cubic.easeOut',
    });
    this.ctx.setCameraZoom(AZAZEL_FIGHT_ZOOM, AZAZEL_APPROACH.pullBackMs);
  }

  public spawnAzazel(isCinematicIntro = false): void {
    const raw = this.resolveBossSpawn(0, -160);
    const pos = this.ctx.clampToArena(raw.x, raw.y, 220);
    const mercy = this.getMercy('azazel');

    const boss = new AzazelBoss(this.scene, pos.x, pos.y);
    boss.setDepth(22);
    this.ctx.enemiesGroup.add(boss);
    boss.spawn(
      pos.x,
      pos.y,
      Math.round(AZAZEL_BOSS_BALANCE.maxHp * mercy.hpMultiplier),
      AZAZEL_BOSS_BALANCE.speed,
      Math.round(AZAZEL_BOSS_BALANCE.baseContactDamage * AZAZEL_BOSS_BALANCE.damageMultiplier * mercy.damageMultiplier),
      AZAZEL_BOSS_BALANCE.scale,
      isCinematicIntro
    );
    boss.attackDamageMultiplier = AZAZEL_BOSS_BALANCE.damageMultiplier * mercy.damageMultiplier;
    this.ctx.azazelBoss = boss;

    if (!isCinematicIntro) {
      this.ctx.setCameraZoom(AZAZEL_FIGHT_ZOOM, 900);
      this.startFightClock('azazel');
    }

    boss.on('azazel-lock-player', (locked: boolean) => {
      this.ctx.isPlayerMovementLocked = locked;
      if (locked) this.stopPlayer();
    });

    boss.on('azazel-center-phrase', (phrase: string, durationMs: number) => {
      this.hud?.showCenterBossPhrase(phrase, durationMs);
    });

    boss.on('azazel-darkness-active', (isDark: boolean) => {
      // A HUD fica na tela no escuro (pedido do dono em 2026-11-27): vida e barra do chefe à vista.
      // No escuro total só se vê a heroína e os ataques do Azazel (nem o cenário)
      this.ctx.setDecorHidden(isDark);
      if (isDark) this.dissipateMinions();
    });

    boss.on('azazel-skull-ring', (center: { x: number; y: number } | null) => {
      if (center) this.lockCameraOnSkullRing(center);
      else this.releaseSkullRingCamera();
    });

    boss.on('azazel-clone-created', (clone: AzazelPhantomClone) => {
      this.ctx.enemiesGroup.add(clone);
    });

    boss.on('azazel-phase3-dimension-start', () => this.startAzazelCrystalPhase());

    boss.on('boss-defeated', () => {
      this.ctx.bossSummonAltar?.complete();
      this.handleAzazelDefeated(boss);
    });
  }

  /** Roda de caveiras: câmera parada no centro da arena e afastada para caber a roda inteira. */
  private lockCameraOnSkullRing(center: { x: number; y: number }): void {
    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls.arena;
    const cam = this.scene.cameras.main;
    this.isSkullRingCameraLocked = true;
    cam.stopFollow();
    cam.pan(center.x, center.y, cfg.cameraMs, 'Sine.easeInOut', true);
    this.ctx.setCameraZoom(cfg.cameraZoom, cfg.cameraMs);
  }

  /** Volta a seguir a heroína: alcança suave e depois cola nela de novo (como no resto da luta). */
  private releaseSkullRingCamera(): void {
    if (!this.isSkullRingCameraLocked) return;
    this.isSkullRingCameraLocked = false;
    const cfg = AZAZEL_BOSS_BALANCE.darkSkulls.arena;
    const cam = this.scene.cameras.main;
    cam.panEffect.reset();
    cam.startFollow(this.ctx.player, true, cfg.releaseLerp, cfg.releaseLerp);
    this.ctx.setCameraZoom(AZAZEL_FIGHT_ZOOM, cfg.cameraMs);
    this.scene.time.delayedCall(cfg.releaseMs, () => {
      if (!this.isSkullRingCameraLocked) cam.setLerp(1, 1);
    });
  }

  /**
   * Fase dos cristais (20% de vida): leva o jogador para a Dimensão Corrompida,
   * solta hordas e faz surgir os cristais que precisam ser purificados.
   */
  public startAzazelCrystalPhase(): void {
    const count = AZAZEL_BOSS_BALANCE.crystalCount;
    this.hud?.setHUDVisible(true);

    this.scene.cameras.main.flash(420, 220, 0, 70);
    this.scene.cameras.main.shake(380, 0.022);

    this.ctx.loadCustomMapLayout(MapStorageManager.getActiveMap(AZAZEL_DIMENSION_MAP_ID));
    this.ctx.setArenaFloorTexture('floor-tile-2');
    this.ctx.playRespawnStarEffect();

    this.clearCrystals();
    this.crystalsCaptured = 0;

    // Área fechada em volta de onde a fase começa: dá para correr, não para fugir
    const cp = AZAZEL_BOSS_BALANCE.crystalPhase;
    const player = this.ctx.player;
    const center = this.ctx.clampToArena(player.x, player.y, cp.arenaRadius + 40);
    player.setPosition(center.x, center.y);
    this.crystalArenaCenter = center;
    this.crystalPhaseElapsedMs = 0;
    this.drawCrystalArenaRing(center.x, center.y, cp.arenaRadius);

    const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i * (Math.PI * 2 / count)) + Phaser.Math.FloatBetween(-0.32, 0.32);
      const dist = Phaser.Math.Between(cp.crystalDist.min, cp.crystalDist.max);
      const pt = { x: center.x + Math.cos(angle) * dist, y: center.y + Math.sin(angle) * dist };
      const crystal = new AzazelCrystal(this.scene, pt.x, pt.y);
      crystal.on('crystal-completed', () => this.handleCrystalCaptured());
      this.crystals.push(crystal);
    }

    this.dropPhaseChalice();

    this.isPhase3HordeActive = true;
    this.dimensionWaveTimer = 0;
    this.ctx.spawnAzazelDimensionHordeWave();
    this.ctx.spawnAzazelDimensionHordeWave();

    this.hud?.showWaveAlert(`PURIFIQUE OS ${count} CRISTAIS! ENQUANTO ISSO AZAZEL SE CURA E A HORDA CRESCE`, 5000);
  }

  /** Cada quadro da fase dos cristais: horda cada vez mais forte, Azazel se curando, área fechada. */
  private updateCrystalPhase(delta: number): void {
    this.crystalPhaseElapsedMs += delta;
    const strength = getCrystalHordeStrength(this.crystalPhaseElapsedMs);

    this.dimensionWaveTimer += delta;
    if (this.dimensionWaveTimer >= getCrystalWaveIntervalMs(strength)) {
      this.dimensionWaveTimer = 0;
      this.ctx.spawnAzazelDimensionHordeWave(strength);
    }

    const boss = this.ctx.azazelBoss;
    if (boss && boss.active && boss.isBanished) {
      boss.regenerateWhileBanished(getBossRegenHp(boss.hp, boss.maxHp, delta));
    }

    const c = this.crystalArenaCenter;
    if (c) {
      const player = this.ctx.player;
      const p = clampToCircle(player.x, player.y, c.x, c.y, AZAZEL_BOSS_BALANCE.crystalPhase.arenaRadius);
      if (p.clamped) {
        const body = player.body as Phaser.Physics.Arcade.Body | null;
        if (body) body.reset(p.x, p.y);
        else player.setPosition(p.x, p.y);
      }
    }
  }

  /** Borda da área em blocos de pixel (sem linha fina), pulsando devagar. */
  private drawCrystalArenaRing(cx: number, cy: number, radius: number): void {
    this.clearCrystalArena(false);
    const g = this.scene.add.graphics().setDepth(4);
    const block = 8;
    const steps = Math.round((Math.PI * 2 * radius) / 20);
    g.fillStyle(CRYSTAL_ARENA_THEME.ring, 1);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.round((cx + Math.cos(a) * radius) / 4) * 4;
      const y = Math.round((cy + Math.sin(a) * radius) / 4) * 4;
      g.fillRect(x - block / 2, y - block / 2, block, block);
    }
    g.fillStyle(CRYSTAL_ARENA_THEME.ringCore, 1);
    for (let i = 0; i < steps; i += 2) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.round((cx + Math.cos(a) * radius) / 4) * 4;
      const y = Math.round((cy + Math.sin(a) * radius) / 4) * 4;
      g.fillRect(x - 2, y - 2, 4, 4);
    }
    g.setAlpha(0.85);
    this.scene.tweens.add({ targets: g, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.crystalArenaRing = g;
  }

  /** Solta a área da fase dos cristais (fim da fase, derrota do chefe, saída da luta). */
  private clearCrystalArena(resetCenter = true): void {
    if (this.crystalArenaRing) {
      this.scene.tweens.killTweensOf(this.crystalArenaRing);
      if (this.crystalArenaRing.scene) this.crystalArenaRing.destroy();
      this.crystalArenaRing = undefined;
    }
    if (resetCenter) this.crystalArenaCenter = undefined;
  }

  /** Fôlego entre fases: um Cálice de Cura ao lado do jogador. */
  private dropPhaseChalice(): void {
    if (!AZAZEL_BOSS_BALANCE.healOnPhaseChange) return;
    const p = this.ctx.clampToArena(this.ctx.player.x + 70, this.ctx.player.y + 10);
    this.ctx.spawnMapItem(p.x, p.y, 'chalice');
  }

  private handleCrystalCaptured(): void {
    const count = AZAZEL_BOSS_BALANCE.crystalCount;
    this.crystalsCaptured++;

    if (this.crystalsCaptured < count) {
      this.hud?.showWaveAlert(`CRISTAL PURIFICADO (${this.crystalsCaptured}/${count})!`, 2600);
      return;
    }

    this.isPhase3HordeActive = false;
    this.clearCrystals();
    this.clearCrystalArena();

    this.scene.cameras.main.shake(680, 0.028);
    this.scene.cameras.main.flash(380, 255, 0, 68);
    this.dissipateMinions();
    this.dropPhaseChalice();

    this.hud?.showWaveAlert(`OS ${count} CRISTAIS CAÍRAM! AZAZEL REAPARECE PARA O CONFRONTO FINAL!`, 4000);

    const boss = this.ctx.azazelBoss;
    if (boss && !boss.isDead) {
      const pos = this.ctx.clampToArena(this.ctx.player.x, this.ctx.player.y - 220, 240);
      boss.resumeFinalShowdown(pos.x, pos.y, this.ctx.player);
    }
  }

  public clearCrystals(): void {
    for (const c of this.crystals) {
      if (c && !c.isDestroyed && c.active) c.destroy();
    }
    this.crystals = [];
  }

  private handleAzazelDefeated(boss: AzazelBoss): void {
    DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Azazel derrotado em ${Math.round(this.fightElapsedMs / 1000)}s de luta.`);
    this.stopFightClock();
    this.ctx.isPlayerMovementLocked = false;
    this.isPhase3HordeActive = false;
    this.clearCrystals();
    this.clearCrystalArena();
    this.ctx.setCameraZoom(DEFAULT_CAMERA_ZOOM, 1000);
    this.hud?.setHUDVisible(true);
    this.ctx.setDecorHidden(false);

    if (getBossDefeatOutcome(this.ctx.gameMode) === 'continue-run') {
      if (this.ctx.azazelBoss === boss) this.ctx.azazelBoss = undefined;
      this.continueRunAfterBoss('AZAZEL DERROTADO', boss.x, boss.y, AZAZEL_BOSS_BALANCE.soulReward);
      return;
    }
    this.completeChapter(2, AZAZEL_BOSS_BALANCE.soulReward);
  }

  // ===========================================================================
  // Ciclo de vida
  // ===========================================================================

  /** Chamado quando o jogador morre: para as hordas da dimensão e solta as travas. */
  public onPlayerDeath(): void {
    this.isPhase3HordeActive = false;
    this.ctx.isPlayerMovementLocked = false;
    this.clearCrystalArena();
  }

  public destroy(): void {
    this.clearCrystals();
    this.clearCrystalArena();
    this.isPhase3HordeActive = false;
    this.stopFightClock();
  }
}

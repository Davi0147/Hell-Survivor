import Phaser from 'phaser';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { SoundManager } from './SoundManager';
import { MetaProgressManager } from './MetaProgressManager';
import { AutoPlayTestAgent } from './AutoPlayTestAgent';
import { REVIVAL_BALANCE } from '../config/balance';
import { COLORS } from '../config/theme';
import type { GameOverStats } from '../ui/GameOverModal';

/** O que o sistema usa da HUD (a UIScene cumpre este contrato). */
export interface IRunEndHud {
  setHUDVisible(visible: boolean): void;
  showWaveAlert(message: string, durationMs?: number): void;
  showGameOverModal(stats: GameOverStats, onRetry: () => void, onMenu: () => void): void;
}

/** Contrato mínimo que a cena de jogo expõe para o RunEndSystem. */
export interface IRunEndContext {
  readonly player: BaseCharacter;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly currentChapter: number;
  readonly survivalTimeMs: number;
  readonly killCount: number;
  /** Maior sequência de abates da partida. */
  readonly maxCombo?: number;
  readonly weapons: ReadonlyArray<{ name?: string }>;
  readonly sandboxGodMode: boolean;
  isGameOver: boolean;
  /** Chefe enfrentado no momento da morte (para o diálogo de revanche). */
  getActiveBossId(): string | undefined;
  /** Avisa as lutas de chefe que o jogador caiu. */
  notifyPlayerDeath(): void;
  grantInvulnerability(ms: number): void;
  playRespawnStarEffect(): void;
  clearCombatSpeechBubbles(): void;
}

/**
 * RunEndSystem — o que acontece quando a vida do jogador chega a zero:
 * Pacto Demoníaco (uma ressurreição por partida), registro de recordes e
 * mortes, tela de Game Over e reinício da partida.
 */
export class RunEndSystem {
  private revivalUsed = false;

  constructor(private readonly scene: Phaser.Scene, private readonly ctx: IRunEndContext) {}

  private get hud(): IRunEndHud | undefined {
    return this.scene.scene.get('UIScene') as unknown as IRunEndHud | undefined;
  }

  public get hasRevivalUsed(): boolean {
    return this.revivalUsed;
  }

  /**
   * Chamado todo quadro. Devolve `true` quando a partida acabou e a cena deve
   * parar de atualizar.
   */
  public checkPlayerDeath(): boolean {
    const player = this.ctx.player;
    if (player.currentHp > 0) return false;

    if (this.ctx.sandboxGodMode) {
      player.currentHp = player.maxHp;
      return false;
    }

    const hasPact = MetaProgressManager.getInstance().getModifiers().hasExtraRevival;
    if (hasPact && !this.revivalUsed) {
      this.triggerDemonRevival();
      return false;
    }

    this.handlePlayerDeath();
    return true;
  }

  /** Pacto Demoníaco: volta com parte da vida, fica intocável e empurra quem está perto. */
  private triggerDemonRevival(): void {
    const cfg = REVIVAL_BALANCE;
    const player = this.ctx.player;
    this.revivalUsed = true;
    player.currentHp = Math.max(1, Math.round(player.maxHp * cfg.hpFraction));
    this.ctx.grantInvulnerability(cfg.invulnerableMs);
    this.ctx.playRespawnStarEffect();

    SoundManager.getInstance().playLevelUp();
    this.scene.cameras.main.flash(350, 192, 132, 252);
    this.scene.cameras.main.shake(350, 0.02);

    const enemies = this.ctx.enemiesGroup.getChildren() as BaseEnemy[];
    for (const enemy of enemies) {
      if (!enemy.active || enemy.isDead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= cfg.shockwaveRadius) continue;
      enemy.takeDamage(cfg.shockwaveDamage);
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (body && dist > 0) {
        body.setVelocity((dx / dist) * cfg.shockwaveKnockback, (dy / dist) * cfg.shockwaveKnockback);
      }
    }

    const pct = Math.round(cfg.hpFraction * 100);
    this.hud?.showWaveAlert(`PACTO DEMONÍACO ATIVADO!\n${player.characterName} RESSUSCITOU COM ${pct}% DE VIDA!`, 3000);
  }

  /** Derrota definitiva: computa recordes e abre a tela de Game Over. */
  private handlePlayerDeath(): void {
    if (this.ctx.isGameOver) return;
    this.ctx.isGameOver = true;

    // Precisa ser lido antes de avisar as lutas, que soltam o estado do chefe
    const bossId = this.ctx.gameMode === 'story' ? this.ctx.getActiveBossId() : undefined;
    this.ctx.notifyPlayerDeath();

    const sound = SoundManager.getInstance();
    sound.stopMusic(1200);
    sound.playGameOver();
    this.hud?.setHUDVisible(true);

    const meta = MetaProgressManager.getInstance();
    const timeSec = Math.floor(this.ctx.survivalTimeMs / 1000);
    const soulsEarned = meta.finalizeRunSouls();
    const maxCombo = this.ctx.maxCombo ?? 0;
    meta.recordRun(timeSec, this.ctx.killCount, false, this.ctx.gameMode, maxCombo);
    const bestCombo = meta.getStats().bestCombo;
    if (this.ctx.gameMode === 'story') {
      meta.recordStoryDeath(bossId);
    }

    const player = this.ctx.player;
    this.scene.physics.pause();
    this.ctx.clearCombatSpeechBubbles();
    const body = player.body as Phaser.Physics.Arcade.Body | null;
    if (body) body.setVelocity(0, 0);

    this.scene.cameras.main.shake(400, 0.02);
    this.scene.cameras.main.flash(200, 255, 0, 0);
    player.setTint(COLORS.dangerTint);

    const bot = AutoPlayTestAgent.getInstance();
    if (bot.isEnabled) {
      bot.recordRun({
        runId: 0,
        timestamp: new Date().toLocaleTimeString(),
        gameMode: this.ctx.gameMode,
        survivalTimeSec: timeSec,
        levelReached: player.currentLevel,
        kills: this.ctx.killCount,
        hpRemaining: 0,
        equippedWeapons: this.ctx.weapons.map((w) => w.name || 'Arma'),
        deathCause: bossId ? `Derrotada pelo chefe (${bossId})` : 'Dano fatal de monstros',
      });
    }

    this.scene.time.delayedCall(700, () => {
      const hud = this.hud;
      if (!hud) return;
      hud.setHUDVisible(true);
      hud.showGameOverModal(
        { kills: this.ctx.killCount, level: player.currentLevel, timeSec, mode: this.ctx.gameMode, soulsEarned, maxCombo, bestCombo },
        () => this.restartRun(),
        () => this.returnToMenu()
      );

      // Bot de testes jogando sozinho: recomeça sem esperar clique
      if (bot.isEnabled) {
        this.scene.time.delayedCall(1500, () => this.restartRun());
      }
    });
  }

  private leaveScene(): void {
    SoundManager.getInstance().stopMusic();
    if (this.scene.physics?.world) {
      this.scene.physics.resume();
    }
    this.scene.scene.stop('UIScene');
  }

  /** Recomeça o mesmo modo e capítulo, com a fala de ressurreição no Modo História. */
  private restartRun(): void {
    this.leaveScene();
    this.scene.scene.start('GameScene', { mode: this.ctx.gameMode, isRevival: true, chapter: this.ctx.currentChapter });
  }

  private returnToMenu(): void {
    this.leaveScene();
    this.scene.scene.stop('GameScene');
    this.scene.scene.start('MenuScene');
  }
}

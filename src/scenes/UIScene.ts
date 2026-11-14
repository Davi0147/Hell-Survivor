import Phaser from 'phaser';
import { DialogueSystem, DialogueLine } from '../systems/DialogueSystem';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { SoundManager } from '../systems/SoundManager';
import { UpgradeCard } from './UpgradeScene';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { DevSandboxPanel } from '../systems/DevSandboxPanel';
import { isDevSandboxEnabled } from '../config/balance';
import { MetaProgressManager } from '../systems/MetaProgressManager';
import { TouchControls } from '../ui/TouchControls';
import { GamepadManager } from '../systems/GamepadManager';
import { STORAGE_KEYS } from '../config/storageKeys';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import { PauseMenu, IPauseGameScene, IPauseMenuHost } from '../ui/PauseMenu';
import { GameOverModal, GameOverStats, IGameOverModalHost } from '../ui/GameOverModal';
import { ChapterVictoryModal, ChapterVictoryStats, IChapterVictoryModalHost } from '../ui/ChapterVictoryModal';
import { ChestRouletteModal, IChestRouletteGameScene } from '../ui/ChestRouletteModal';
import { ScreenAnnouncer } from '../ui/ScreenAnnouncer';
import { StatusPanelHud } from '../ui/StatusPanelHud';
import { TopCenterHud } from '../ui/TopCenterHud';
import { TacticalRadar } from '../ui/TacticalRadar';
import { AltarEdgeIndicator } from '../ui/AltarEdgeIndicator';

export class UIScene
  extends Phaser.Scene
  implements IPauseMenuHost, IGameOverModalHost, IChapterVictoryModalHost
{
  // Sistema de Diálogos Estilo Persona 5
  private dialogueSystem!: DialogueSystem;
  private hudElements: any[] = [];
  private isHUDVisibleState: boolean = true;
  private announcer!: ScreenAnnouncer;

  // Controles Touch Mobile
  public touchControls!: TouchControls;

  // Componentes de Modais Extraídos (Pacote UI)
  public pauseMenu!: PauseMenu;
  public gameOverModal!: GameOverModal;
  public chapterVictoryModal!: ChapterVictoryModal;

  // Estado e Container de Pausa / Sandbox (Fachadas de Contrato)
  public get isPaused(): boolean {
    return this.pauseMenu?.isPaused ?? false;
  }
  public set isPaused(val: boolean) {
    if (this.pauseMenu) this.pauseMenu.isPaused = val;
  }

  public get isGameOverModalOpen(): boolean {
    return this.gameOverModal?.isOpen ?? false;
  }
  public set isGameOverModalOpen(val: boolean) {
    if (this.gameOverModal) this.gameOverModal.isOpen = val;
  }

  public chestRoulette!: ChestRouletteModal;
  public get isChestRouletteOpen(): boolean {
    return this.chestRoulette?.isOpen ?? false;
  }
  public sandboxPanel?: DevSandboxPanel;

  // Vinheta de Alerta de Vida Crítica (Low HP)
  private lowHpVignetteGraphics!: Phaser.GameObjects.Graphics;

  // Painel de status (canto inferior direito)
  private statusPanel!: StatusPanelHud;

  // Barra Superior de Experiência (XP) e Nível
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;

  // Painel Superior Direito Minimalista (Abates e Almas)
  private killsPanelGraphics!: Phaser.GameObjects.Graphics;
  private killsIcon!: Phaser.GameObjects.Image;
  private killsText!: Phaser.GameObjects.Text;
  private weaponInfoText?: Phaser.GameObjects.Text;
  private soulsIcon!: Phaser.GameObjects.Image;
  private soulsText!: Phaser.GameObjects.Text;

  // Controles e Legenda Dinâmica (Teclado vs Gamepad)
  private controlsText!: Phaser.GameObjects.Text;
  private currentControlScheme: 'keyboard' | 'gamepad' = 'keyboard';
  private wasKeyboardKeyPressed: boolean = false;
  private keyEsc?: Phaser.Input.Keyboard.Key;

  // Radar tático (canto superior esquerdo)
  private radar!: TacticalRadar;

  // Topo central (purificação, vida do chefe, cronômetro do Infinito)
  private topCenterHud!: TopCenterHud;
  private bestRecordSec: number = 0;

  // Seta de borda para o objetivo fora da tela
  private altarEdgeIndicator!: AltarEdgeIndicator;


  constructor() {
    super('UIScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.pauseMenu = new PauseMenu(this);
    this.gameOverModal = new GameOverModal(this);
    this.chapterVictoryModal = new ChapterVictoryModal(this);

    this.chestRoulette = new ChestRouletteModal(this);

    // 0. Vinheta de Alerta de Vida Baixa (Depth 200 - acima da HUD e abaixo de modais)
    this.lowHpVignetteGraphics = this.add.graphics();
    this.lowHpVignetteGraphics.setDepth(200);

    // ==========================================
    // 0. RADAR TÁTICO / MINIMAPA CIRCULAR (CANTO SUPERIOR ESQUERDO)
    // ==========================================
    this.radar = new TacticalRadar(this, pixelFont);

    // ==========================================
    // 1-2. RETRATO E PAINEL DE STATUS (CANTO INFERIOR DIREITO)
    // ==========================================
    const gsForName = this.scene.get('GameScene') as { player?: { characterId?: string } } | null;
    this.statusPanel = new StatusPanelHud(this, pixelFont, gsForName?.player?.characterId ?? 'nixy', () => this.tryTriggerUltimate());

    // Tecla [E] também escutada diretamente na UIScene
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => this.tryTriggerUltimate());
    }

    // ==========================================
    // 4. CANTO SUPERIOR DIREITO: ABATES E ALMAS (MINIMALISTA SEM FUNDO)
    // ==========================================
    this.killsPanelGraphics = this.add.graphics();
    this.killsPanelGraphics.setDepth(60);

    const hudRightX = width - 120;
    const killsY = 46;
    const soulsY = 88;

    // Linha 1: ABATES (Sprite Kills + Quantidade com contorno preto)
    this.killsIcon = this.add.image(hudRightX, killsY, 'ui-kills-icon').setScale(1.0).setOrigin(0.5).setDepth(60);
    this.killsText = this.add.text(hudRightX + 26, killsY, '0', {
      fontFamily: pixelFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(60);

    // Linha 2: ALMAS (Sprite Alma + Quantidade com contorno preto)
    this.soulsIcon = this.add.image(hudRightX, soulsY, 'item-soul').setScale(1.0).setOrigin(0.5).setDepth(60);
    this.soulsText = this.add.text(hudRightX + 26, soulsY, '0', {
      fontFamily: pixelFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#c084fc',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(60);

    // ==========================================
    // 5. TOPO CENTRAL: PURIFICAÇÃO, VIDA DO CHEFE E CRONÔMETRO DO INFINITO
    // ==========================================
    this.bestRecordSec = this.getBestRecordSec();
    this.topCenterHud = new TopCenterHud(this, pixelFont, this.formatTime(this.bestRecordSec), (sec) => this.formatTime(sec));

    this.announcer = new ScreenAnnouncer(this, pixelFont);

    // Atalho silencioso de teclado para recarregar com F2 (sem nenhum botão ou texto na tela)
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2).on('down', () => {
        MetaProgressManager.getInstance().finalizeRunSouls();
        this.scene.stop('UIScene');
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
          gameScene.scene.start('BootScene');
        }
      });
    }

    // Captura qualquer tecla pressionada para restaurar a legenda para o Teclado e tecla ESC unificada
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', () => {
        this.wasKeyboardKeyPressed = true;
      });
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keyEsc.on('down', () => {
        const gs = this.scene.get('GameScene') as any;
        if (gs && !gs.isGameOver && !gs.isChapterCompleted && !this.scene.isActive('UpgradeScene')) {
          this.togglePause(gs);
        }
      });
    }

    // ==========================================
    // 6. CANTO INFERIOR ESQUERDO: CONTROLES
    // ==========================================
    this.controlsText = this.add.text(20, height - 36,
      '[WASD] Mover  |  [Shift] Sprint  |  [E] Ultimate  |  [ESC] Pausa', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#e0aaff',
      backgroundColor: '#0a0306ee',
      padding: { x: 10, y: 6 }
    });

    // ==========================================
    // SISTEMA DE DIÁLOGOS ESTILO PERSONA 5 (Renderizado em 1:1 sem zoom da câmera)
    // ==========================================
    this.dialogueSystem = new DialogueSystem(this);

    // ==========================================
    // 7. TOPO DA TELA: BARRA CONTÍNUA DE EXPERIÊNCIA (XP)
    // ==========================================
    this.xpBarBg = this.add.graphics();
    this.xpBarBg.setDepth(120);
    this.xpBarBg.fillStyle(0x0c0407, 0.95);
    this.xpBarBg.fillRect(0, 0, width, 14);
    this.xpBarBg.lineStyle(1.5, 0xc59b27, 0.9);
    this.xpBarBg.lineBetween(0, 14, width, 14);

    this.xpBarFill = this.add.graphics();
    this.xpBarFill.setDepth(121);

    this.xpText = this.add.text(width / 2, 7, 'LVL 1   [ 0 / 20 XP ]', {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#00f5d4',
      stroke: '#002520',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(122);

    // Lista consolidada de todos os elementos da HUD para controle unificado de visibilidade
    this.hudElements = [
      ...this.radar.getHudElements(),
      ...this.statusPanel.getHudElements(),
      this.killsPanelGraphics,
      this.killsIcon,
      this.killsText,
      this.soulsIcon,
      this.soulsText,
      ...this.topCenterHud.getHudElements(),
      this.controlsText,
      this.xpBarBg,
      this.xpBarFill,
      this.xpText
    ];

    // 8. Seta de borda para o objetivo fora da tela
    this.altarEdgeIndicator = new AltarEdgeIndicator(this, pixelFont);
    this.hudElements.push(this.altarEdgeIndicator.getHudElement());

    // ==========================================
    // 8. CONSOLE DE TESTE & GRAVADOR DE SESSÃO (SANDBOX / DEV MODE)
    // ==========================================
    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene && (gameScene.gameMode === 'sandbox' || isDevSandboxEnabled())) {
      this.sandboxPanel = new DevSandboxPanel(this, gameScene);
    }

    // ==========================================
    // 9. CONTROLES TOUCH NA TELA (MOBILE / TABLET)
    // ==========================================
    this.touchControls = new TouchControls(this);

    // ==========================================
    // 10. LIMPEZA NO DESLIGAMENTO DA CENA (DEC-006 / ANTI-LEAK)
    // ==========================================
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pauseMenu?.destroy();
      this.gameOverModal?.destroy();
      this.chapterVictoryModal?.destroy();
      this.announcer?.destroy();
      if (this.keyEsc) {
        this.keyEsc.removeAllListeners();
        this.keyEsc = undefined;
      }
      if (this.input.keyboard) {
        this.input.keyboard.removeAllKeys(true);
        this.input.keyboard.removeAllListeners();
      }
      this.input.removeAllListeners();
      this.time.removeAllEvents();
    });
  }

  /** Suprema pelo clique no frasco ou pela tecla [E]. */
  private tryTriggerUltimate(): void {
    if (!this.isHUDVisibleState || this.isDialogueActive()) return;
    const gs = this.scene.get('GameScene') as { player?: { isUltimateReady?: boolean }; triggerUltimate?: () => void } | null;
    if (gs?.player?.isUltimateReady && gs.triggerUltimate) {
      gs.triggerUltimate();
    }
  }

  update(_time: number, delta: number): void {
    if (this.sandboxPanel) {
      this.sandboxPanel.update(delta);
    }

    // 1. Atualização da Legenda Dinâmica de Controles (Teclado vs Gamepad)
    this.updateControlsHint();

    // 2. Se diálogo estiver ativo, processa navegação por Gamepad e Touch
    if (this.dialogueSystem && this.dialogueSystem.isDialogueActive()) {
      this.dialogueSystem.update(delta);
      return;
    }

    // 3. Se o modal Fim da Jornada (Game Over) estiver aberto, processa controles
    if (this.isGameOverModalOpen && this.gameOverModal?.container) {
      this.gameOverModal.updateControls();
      return;
    }

    // 4. Processa navegação por gamepad / teclado caso o jogo esteja pausado no ESC
    const gameScene = this.scene.get('GameScene') as any;
    if (this.isPaused && this.pauseMenu?.container) {
      this.pauseMenu.updateControls(gameScene);
      return;
    }

    // 5. Se a roleta do Baú do Abismo estiver aberta, processa resolução autônoma do Bot [F3]
    if (this.isChestRouletteOpen) {
      if (AutoPlayTestAgent.getInstance().isEnabled) {
        AutoPlayTestAgent.getInstance().checkAndResolveChestRoulette(this, delta);
      }
      return;
    }

    if (!this.isHUDVisibleState) return;

    if (!gameScene || !gameScene.player || (!gameScene.scene.isActive() && !gameScene.scene.isPaused())) return;

    const p = gameScene.player;

    // Painel de status: Suprema, vida, estamina, nível e retrato
    this.statusPanel.update(p, this.currentControlScheme);
    if (this.touchControls) {
      this.touchControls.update(p.isUltimateReady);
    }

    // Atualizar Abates e Almas Corrompidas (Apenas valores numéricos com ícones)
    if (typeof gameScene.killCount === 'number') {
      this.killsText.setText(`${gameScene.killCount}`);
    }
    const runSouls = MetaProgressManager.getInstance().runSoulsCollected;
    this.soulsText.setText(`${runSouls}`);

    // Atualizar Barra Superior de Experiência (XP)
    const { width, height } = this.scale;
    const xpRatio = Phaser.Math.Clamp(p.currentXp / p.xpToNextLevel, 0, 1);
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x00f5d4, 1);
    this.xpBarFill.fillRect(0, 0, width * xpRatio, 13);
    this.xpText.setText(`LVL ${p.currentLevel}   [ ${p.currentXp} / ${p.xpToNextLevel} XP ]`);

    // Topo central: purificação, vida do chefe ou cronômetro do Infinito
    this.topCenterHud.update(gameScene);

    // ==========================================
    // ALERTA DE VIDA CRÍTICA (LOW HP VIGNETTE & HEARTBEAT)
    // ==========================================
    const currentHpRatio = p.maxHp > 0 ? p.currentHp / p.maxHp : 1;
    if (currentHpRatio <= 0.30 && p.currentHp > 0 && !gameScene.isGameOver) {
      const dangerFactor = 1 - (currentHpRatio / 0.30); // 0 (a 30%) até 1 (a 0%)
      const pulse = 0.35 + Math.sin(this.time.now * 0.007) * 0.25 * dangerFactor;

      const vg = this.lowHpVignetteGraphics;
      vg.clear();

      const edgeSize = 48 + dangerFactor * 32;
      vg.fillStyle(0x780000, pulse * 0.65);

      // Faixas de vinheta sangrenta nas 4 bordas da tela
      vg.fillRect(0, 0, width, edgeSize);
      vg.fillRect(0, height - edgeSize, width, edgeSize);
      vg.fillRect(0, 0, edgeSize, height);
      vg.fillRect(width - edgeSize, 0, edgeSize, height);

      // Toca batimento cardíaco abafado periódico
      SoundManager.getInstance().playHeartbeat();
    } else {
      this.lowHpVignetteGraphics.clear();
    }

    // Atualizar Radar Tático / Minimapa
    this.radar.update(p, gameScene);

    // Atualizar Indicador Direcional de Borda para o Altar de Ascensão (quando fora da tela)
    this.altarEdgeIndicator.update(p, gameScene);
  }

  public setHUDVisible(visible: boolean): void {
    this.isHUDVisibleState = visible;
    for (const el of this.hudElements) {
      if (el && typeof el.setVisible === 'function') {
        el.setVisible(visible);
      }
    }
    if (this.touchControls) {
      this.touchControls.setVisible(visible);
    }
    if (!visible) {
      this.radar?.clearBlips();
      this.statusPanel?.clearBars();
      this.topCenterHud?.clear();
      this.announcer?.hideWaveAlert();
    }
  }

  public showCenterBossPhrase(phrase: string, durationMs: number = 2200): void {
    this.announcer.showCenterBossPhrase(phrase, durationMs);
  }

  public startDialogue(lines: DialogueLine[], onComplete: () => void): void {
    this.setHUDVisible(false);
    if (this.dialogueSystem) {
      this.dialogueSystem.startDialogue(lines, () => {
        this.setHUDVisible(true);
        onComplete();
      });
    } else {
      this.setHUDVisible(true);
      onComplete();
    }
  }

  public isDialogueActive(): boolean {
    return this.dialogueSystem ? this.dialogueSystem.isDialogueActive() : false;
  }

  public isChestRouletteActive(): boolean {
    return this.isChestRouletteOpen;
  }

  public resolveChestRoulette(): void {
    this.chestRoulette.resolve();
  }

  public showChapterVictoryModal(stats: ChapterVictoryStats, onReturnToMenu: () => void): void {
    if (!this.chapterVictoryModal) {
      this.chapterVictoryModal = new ChapterVictoryModal(this);
    }
    this.chapterVictoryModal.show(stats, onReturnToMenu);
  }

  public formatTime(totalSec: number): string {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}`;
  }

  public getBestRecordSec(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.ENDLESS_RECORD_SEC);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  public saveBestRecordSec(sec: number): boolean {
    try {
      const current = this.getBestRecordSec();
      if (sec > current) {
        localStorage.setItem(STORAGE_KEYS.ENDLESS_RECORD_SEC, sec.toString());
        return true;
      }
    } catch {}
    return false;
  }

  public showWaveAlert(message: string, durationMs: number = 3000): void {
    this.announcer.showWaveAlert(message, durationMs);
  }

  public showCenterAnnouncement(title: string, subtitle?: string, durationMs: number = 4600): void {
    this.announcer.showCenterAnnouncement(title, subtitle, durationMs);
  }

  public showChestRoulette(availableCards: UpgradeCard[], player: BaseCharacter, gameScene: IChestRouletteGameScene | null): void {
    this.chestRoulette.show(availableCards, player, gameScene);
  }

  public showGameOverModal(
    stats: GameOverStats,
    onRetry: () => void,
    onReturnToMenu: () => void
  ): void {
    if (!this.gameOverModal) {
      this.gameOverModal = new GameOverModal(this);
    }
    this.gameOverModal.show(stats, onRetry, onReturnToMenu);
  }

  // ==========================================
  // MENU DE PAUSA (ESC / PAUSE GAMEPLAY) — Fachadas do PauseMenu (Pacote UI)
  // ==========================================
  public togglePause(gameScene: IPauseGameScene): void {
    if (!this.pauseMenu) {
      this.pauseMenu = new PauseMenu(this);
    }
    this.pauseMenu.togglePause(gameScene);
  }

  public pauseGame(gameScene: IPauseGameScene): void {
    if (!this.pauseMenu) {
      this.pauseMenu = new PauseMenu(this);
    }
    this.pauseMenu.pauseGame(gameScene);
  }

  public resumeGame(gameScene: IPauseGameScene): void {
    this.pauseMenu?.resumeGame(gameScene);
  }

  public isHUDVisible(): boolean {
    return this.isHUDVisibleState;
  }

  public getBestRecordValue(): number {
    return this.bestRecordSec;
  }

  public updateBestRecordIfHigher(timeSec: number): boolean {
    if (timeSec > this.bestRecordSec) {
      this.saveBestRecordSec(timeSec);
      this.bestRecordSec = timeSec;
      return true;
    }
    return false;
  }

  public onCleanupPauseCursor(): void {
    this.pauseMenu?.cleanupCursor();
  }

  /**
   * Atualiza a legenda de controles no canto inferior esquerdo dinamicamente
   * Alterna entre Teclado e Gamepad conforme a última entrada detectada
   */
  private updateControlsHint(): void {
    if (!this.controlsText) return;

    const pad = GamepadManager.getInstance().getActivePad(this);
    let isGamepadInput = false;

    if (pad && pad.connected) {
      const stickActive =
        Math.abs(pad.leftStick.x) > 0.15 ||
        Math.abs(pad.leftStick.y) > 0.15 ||
        pad.left || pad.right || pad.up || pad.down;

      let btnActive = false;
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i] && pad.buttons[i].pressed) {
          btnActive = true;
          break;
        }
      }

      if (stickActive || btnActive) {
        isGamepadInput = true;
      }
    }

    if (isGamepadInput && this.currentControlScheme !== 'gamepad') {
      this.currentControlScheme = 'gamepad';
      this.controlsText.setText('[LS] Mover  |  [LT/RT / (B)] Sprint  |  [(Y)/(X)] Ultimate  |  [Start] Pausa');
    } else if (!isGamepadInput && this.currentControlScheme === 'gamepad') {
      if (this.wasKeyboardKeyPressed) {
        this.currentControlScheme = 'keyboard';
        this.wasKeyboardKeyPressed = false;
        this.controlsText.setText('[WASD] Mover  |  [Shift] Sprint  |  [E] Ultimate  |  [ESC] Pausa');
      }
    }
  }
}

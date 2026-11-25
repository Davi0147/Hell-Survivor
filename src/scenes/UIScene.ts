import type { GameScene } from './GameScene';
import Phaser from 'phaser';
import { DialogueSystem, DialogueLine } from '../systems/DialogueSystem';
import { SoundManager } from '../systems/SoundManager';
import { UpgradeCard } from './UpgradeScene';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { DevSandboxPanel } from '../systems/DevSandboxPanel';
import { isDevSandboxEnabled } from '../config/balance';
import { MetaProgressManager } from '../systems/MetaProgressManager';
import { TouchControls } from '../ui/TouchControls';
import { InputHint } from '../ui/InputHint';
import { STORAGE_KEYS } from '../config/storageKeys';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import { PauseMenu, IPauseGameScene, IPauseMenuHost } from '../ui/PauseMenu';
import { GameOverModal, GameOverStats, IGameOverModalHost } from '../ui/GameOverModal';
import { ChapterVictoryModal, ChapterVictoryStats, IChapterVictoryModalHost } from '../ui/ChapterVictoryModal';
import { ChestRouletteModal, IChestRouletteGameScene } from '../ui/ChestRouletteModal';
import { TalismanRevealModal, type ITalismanRevealGameScene } from '../ui/TalismanRevealModal';
import type { TalismanDef } from '../systems/TalismanCatalog';
import { ScreenAnnouncer } from '../ui/ScreenAnnouncer';
import { StatusPanelHud } from '../ui/StatusPanelHud';
import { TopCenterHud } from '../ui/TopCenterHud';
import { IdlePressureHud } from '../ui/IdlePressureHud';
import { TacticalRadar } from '../ui/TacticalRadar';
import { AltarEdgeIndicator } from '../ui/AltarEdgeIndicator';
import { ComboHud } from '../ui/ComboHud';
import { WeaponSlotsHud } from '../ui/WeaponSlotsHud';
import { getHudLayout, HUD_SIZES, type HudLayout } from '../config/hudLayout';
import { HUD_COUNTER_THEME } from '../config/theme';

export class UIScene
  extends Phaser.Scene
  implements IPauseMenuHost, IGameOverModalHost, IChapterVictoryModalHost
{
  // Sistema de Diálogos Estilo Persona 5
  private dialogueSystem!: DialogueSystem;
  private hudElements: Phaser.GameObjects.GameObject[] = [];
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
  public talismanReveal!: TalismanRevealModal;
  /** Alguma tela de prêmio aberta (roleta do baú ou carta de talismã): o combate fica congelado. */
  public get isChestRouletteOpen(): boolean {
    return (this.chestRoulette?.isOpen ?? false) || (this.talismanReveal?.isOpen ?? false);
  }
  public sandboxPanel?: DevSandboxPanel;

  // Vinheta de Alerta de Vida Crítica (Low HP)
  private lowHpVignetteGraphics!: Phaser.GameObjects.Graphics;

  /** Onde fica cada peça da HUD (config/hudLayout.ts): maior e com botões no polegar no celular. */
  private layout!: HudLayout;

  // Painel de status (topo esquerdo)
  private statusPanel!: StatusPanelHud;

  // Barra fina de experiência no alto da tela (o nível fica no painel de status)
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private lastXpRatio = -1;

  // Topo direito: abates e almas, lado a lado
  private killsPanelGraphics!: Phaser.GameObjects.Graphics;
  private killsIcon!: Phaser.GameObjects.Image;
  private killsText!: Phaser.GameObjects.Text;
  private soulsIcon!: Phaser.GameObjects.Image;
  private soulsText!: Phaser.GameObjects.Text;

  // Legenda de controles com ícones de botão (troca sozinha entre teclado e controle)
  private controlsHint!: InputHint;
  private keyEsc?: Phaser.Input.Keyboard.Key;

  // Radar tático (canto superior esquerdo)
  private radar!: TacticalRadar;

  // Topo central (purificação, vida do chefe, cronômetro do Infinito)
  private topCenterHud!: TopCenterHud;
  private idlePressureHud?: IdlePressureHud;
  private bestRecordSec: number = 0;

  // Seta de borda para o objetivo fora da tela
  private altarEdgeIndicator!: AltarEdgeIndicator;

  // Contador de combo e aviso de Frenesi
  private comboHud!: ComboHud;

  // Barra de armas equipadas (canto inferior esquerdo)
  private weaponSlots!: WeaponSlotsHud;


  constructor() {
    super('UIScene');
  }

  /**
   * A cena é reaproveitada ao "Tentar novamente" (o Phaser não roda o construtor de novo):
   * estado da partida anterior precisa voltar ao início aqui. Sem isso a HUD ficava marcada
   * como escondida depois do Fim da Jornada, e ao sair da pausa os botões de toque sumiam.
   */
  init(): void {
    this.isHUDVisibleState = true;
    this.hudElements = [];
    this.sandboxPanel = undefined;
    this.idlePressureHud = undefined;
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.pauseMenu = new PauseMenu(this);
    this.gameOverModal = new GameOverModal(this);
    this.chapterVictoryModal = new ChapterVictoryModal(this);

    this.chestRoulette = new ChestRouletteModal(this);
    this.talismanReveal = new TalismanRevealModal(this);

    // 0. Vinheta de Alerta de Vida Baixa (Depth 200 - acima da HUD e abaixo de modais)
    this.lowHpVignetteGraphics = this.add.graphics();
    this.lowHpVignetteGraphics.setDepth(200);

    // Layout único da HUD: no celular tudo fica maior (o jogo inteiro é encolhido para caber)
    const isTouchDevice = !this.sys.game.device.os.desktop;
    this.layout = getHudLayout(width, height, isTouchDevice);
    const L = this.layout;

    // ==========================================
    // 0. RADAR TÁTICO (TOPO DIREITO, SOB ABATES E ALMAS)
    // ==========================================
    this.radar = new TacticalRadar(this, pixelFont, L.radar);

    // ==========================================
    // 1-2. PAINEL DE STATUS (TOPO ESQUERDO, ROSTO NO MEDALHÃO)
    // ==========================================
    const gsForName = this.scene.get('GameScene') as { player?: { characterId?: string } } | null;
    this.statusPanel = new StatusPanelHud(this, pixelFont, gsForName?.player?.characterId ?? 'nixy', L.status, isTouchDevice);

    // Tecla [E] também escutada diretamente na UIScene
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => this.tryTriggerUltimate());
    }

    // ==========================================
    // 4. TOPO DIREITO: ABATES E ALMAS LADO A LADO, NUMA PLACA ESCURA
    // ==========================================
    const c = L.counters;
    const itemW = HUD_SIZES.counters.itemW * c.scale;
    const iconSize = 32 * c.scale;
    const counterFont = Math.round(20 * c.scale);
    const counterY = c.y;
    const killsX = c.right - itemW * 2;
    const soulsX = c.right - itemW;

    this.killsPanelGraphics = this.add.graphics();
    this.killsPanelGraphics.setDepth(59);
    const plateH = HUD_SIZES.counters.h * c.scale;
    this.killsPanelGraphics.fillStyle(HUD_COUNTER_THEME.plate, HUD_COUNTER_THEME.plateAlpha);
    this.killsPanelGraphics.fillRect(killsX, counterY - plateH / 2, itemW * 2, plateH);
    this.killsPanelGraphics.lineStyle(2, HUD_COUNTER_THEME.border, 1);
    this.killsPanelGraphics.strokeRect(killsX, counterY - plateH / 2, itemW * 2, plateH);
    this.killsPanelGraphics.lineStyle(1, HUD_COUNTER_THEME.border, 0.5);
    this.killsPanelGraphics.lineBetween(soulsX, counterY - plateH / 2 + 6, soulsX, counterY + plateH / 2 - 6);

    const counterStyle = (color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: pixelFont,
      fontSize: `${counterFont}px`,
      fontStyle: 'bold',
      color,
      stroke: HUD_COUNTER_THEME.stroke,
      strokeThickness: 4,
    });
    this.killsIcon = this.add.image(killsX + 8 + iconSize / 2, counterY, this.textures.exists('ui-icon-kills') ? 'ui-icon-kills' : 'ui-kills-icon')
      .setDisplaySize(iconSize, iconSize).setDepth(60);
    this.killsText = this.add.text(killsX + 14 + iconSize, counterY, '0', counterStyle(HUD_COUNTER_THEME.kills)).setOrigin(0, 0.5).setDepth(60);
    this.soulsIcon = this.add.image(soulsX + 8 + iconSize / 2, counterY, this.textures.exists('ui-icon-souls') ? 'ui-icon-souls' : 'item-soul')
      .setDisplaySize(iconSize, iconSize).setDepth(60);
    this.soulsText = this.add.text(soulsX + 14 + iconSize, counterY, '0', counterStyle(HUD_COUNTER_THEME.souls)).setOrigin(0, 0.5).setDepth(60);

    // ==========================================
    // 5. TOPO CENTRAL: PURIFICAÇÃO, VIDA DO CHEFE E CRONÔMETRO DO INFINITO
    // ==========================================
    this.bestRecordSec = this.getBestRecordSec();
    this.topCenterHud = new TopCenterHud(this, pixelFont, this.formatTime(this.bestRecordSec), (sec) => this.formatTime(sec), L.objective);
    this.idlePressureHud = new IdlePressureHud(
      this,
      L.objective.y + HUD_SIZES.objective.h * L.objective.scale + 18,
      // Cabe entre o status e os contadores mesmo na frase mais longa
      isTouchDevice ? 15 : 12
    );

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

    // Tecla ESC unificada (pausa)
    if (this.input.keyboard) {
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keyEsc.on('down', () => {
        const gs = this.scene.get('GameScene') as GameScene | undefined;
        if (gs && !gs.isGameOver && !gs.isChapterCompleted && !this.scene.isActive('UpgradeScene')) {
          this.togglePause(gs);
        }
      });
    }

    // ==========================================
    // 6. CANTO INFERIOR ESQUERDO: CONTROLES
    // ==========================================
    this.controlsHint = new InputHint(this, 30, height - 26, [
      'move', { text: 'Mover' },
      'sprint', { text: 'Sprint' },
      'dash', { text: 'Esquiva' },
      'ultimate', { text: 'Suprema' },
      'pause', { text: 'Pausa' },
    ], { glyphHeight: 22 });

    // ==========================================
    // SISTEMA DE DIÁLOGOS ESTILO PERSONA 5 (Renderizado em 1:1 sem zoom da câmera)
    // ==========================================
    this.dialogueSystem = new DialogueSystem(this);

    // ==========================================
    // 7. TOPO DA TELA: BARRA FINA DE EXPERIÊNCIA DE PONTA A PONTA
    // ==========================================
    // Sem texto: os números eram ilegíveis no celular; o nível fica no painel de status
    this.xpBarBg = this.add.graphics();
    this.xpBarBg.setDepth(120);
    this.xpBarBg.fillStyle(HUD_COUNTER_THEME.xpTrack, 0.95);
    this.xpBarBg.fillRect(0, 0, width, L.xpBarH);
    this.xpBarBg.lineStyle(2, HUD_COUNTER_THEME.border, 1);
    this.xpBarBg.lineBetween(0, L.xpBarH, width, L.xpBarH);

    this.xpBarFill = this.add.graphics();
    this.xpBarFill.setDepth(121);
    this.lastXpRatio = -1;

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
      this.controlsHint.container,
      this.xpBarBg,
      this.xpBarFill
    ];

    // 8. Seta de borda para o objetivo fora da tela
    this.altarEdgeIndicator = new AltarEdgeIndicator(this, pixelFont);
    this.hudElements.push(this.altarEdgeIndicator.getHudElement());

    // 8.1. Contador de combo (perto do radar)
    this.comboHud = new ComboHud(this, L.combo);
    this.hudElements.push(this.comboHud.getHudElement());

    // 8.2. Armas equipadas e espaço da Suprema (sob o painel de status)
    this.weaponSlots = new WeaponSlotsHud(this, L.weapons, () => this.tryTriggerUltimate());
    this.hudElements.push(this.weaponSlots.getHudElement());

    // ==========================================
    // 8. CONSOLE DE TESTE & GRAVADOR DE SESSÃO (SANDBOX / DEV MODE)
    // ==========================================
    const gameScene = this.scene.get('GameScene') as GameScene | undefined;
    if (gameScene && (gameScene.gameMode === 'sandbox' || isDevSandboxEnabled())) {
      this.sandboxPanel = new DevSandboxPanel(this, gameScene);
    }

    // ==========================================
    // 9. CONTROLES TOUCH NA TELA (MOBILE / TABLET)
    // ==========================================
    this.touchControls = new TouchControls(this, L.touch);

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
      // O aviso de "parada demais" ficava aceso por cima do Fim da Jornada
      this.idlePressureHud?.update(undefined, delta);
      this.gameOverModal.updateControls();
      return;
    }

    // 4. Processa navegação por gamepad / teclado caso o jogo esteja pausado no ESC
    const gameScene = this.scene.get('GameScene') as GameScene;
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

    // Aviso da Pressão do Abismo (só Infinito, só com a HUD visível)
    this.idlePressureHud?.update(
      this.isHUDVisibleState && gameScene?.gameMode === 'endless' ? gameScene.idlePressure : undefined,
      delta
    );

    if (!this.isHUDVisibleState) return;

    if (!gameScene || !gameScene.player || (!gameScene.scene.isActive() && !gameScene.scene.isPaused())) return;

    const p = gameScene.player;

    // Painel de status: Suprema, vida, estamina, nível e retrato
    this.statusPanel.update(p);
    if (this.touchControls) {
      this.touchControls.update(p.isUltimateReady);
    }

    // Atualizar Abates e Almas Corrompidas (Apenas valores numéricos com ícones)
    if (typeof gameScene.killCount === 'number') {
      this.killsText.setText(`${gameScene.killCount}`);
    }
    const runSouls = MetaProgressManager.getInstance().runSoulsCollected;
    this.soulsText.setText(`${runSouls}`);

    if (gameScene.combatFeel) {
      this.comboHud.update(gameScene.combatFeel.combo);
    }
    this.weaponSlots.update(p, gameScene.weapons);

    // Barra fina de experiência (redesenha só quando muda)
    const { width, height } = this.scale;
    const xpRatio = Phaser.Math.Clamp(p.currentXp / p.xpToNextLevel, 0, 1);
    if (Math.abs(xpRatio - this.lastXpRatio) > 0.001) {
      this.lastXpRatio = xpRatio;
      const h = this.layout.xpBarH;
      this.xpBarFill.clear();
      this.xpBarFill.fillStyle(HUD_COUNTER_THEME.xpFill, 1);
      this.xpBarFill.fillRect(0, 0, width * xpRatio, h - 1);
      this.xpBarFill.fillStyle(HUD_COUNTER_THEME.xpShine, 1);
      this.xpBarFill.fillRect(0, 0, width * xpRatio, 2);
    }

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
      const visual = el as Phaser.GameObjects.GameObject & { setVisible?: (v: boolean) => unknown };
      if (visual && typeof visual.setVisible === 'function') {
        visual.setVisible(visible);
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

  /** Avança a tela de prêmio aberta (bot [F3]): roleta do baú ou carta de talismã. */
  public resolveChestRoulette(): void {
    if (this.talismanReveal?.isOpen) this.talismanReveal.resolve();
    else this.chestRoulette.resolve();
  }

  public showTalismanReveal(def: TalismanDef, gameScene: ITalismanRevealGameScene | null, onCollected: () => void): void {
    this.talismanReveal.show(def, gameScene, onCollected);
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
    } catch {
      // Sem localStorage (modo privado): o recorde só vale nesta sessão
    }
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

  /** No toque a legenda não ajuda e ocupa o canto do joystick (os ícones já somem sozinhos no toque). */
  private updateControlsHint(): void {
    if (!this.controlsHint) return;
    const isTouch = this.touchControls?.isActive || this.touchControls?.forceEnabled;
    this.controlsHint.container.setAlpha(isTouch ? 0 : 1);
  }
}

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

  // Painel de Status Demônico (Canto Inferior Direito)
  private statusHudImage!: Phaser.GameObjects.Image;
  private charNameImage!: Phaser.GameObjects.Image;
  private baroquePanelGraphics!: Phaser.GameObjects.Graphics;
  private ultGaugeBg!: Phaser.GameObjects.Image;
  private vialGraphics!: Phaser.GameObjects.Graphics;
  private ultGaugeFrame!: Phaser.GameObjects.Image;
  private ultimatePctText!: Phaser.GameObjects.Text;
  private ultimateReadyBadge!: Phaser.GameObjects.Text;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private staminaBarFill!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;

  // Barra Superior de Experiência (XP) e Nível
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private levelTag!: Phaser.GameObjects.Text;

  // Dimensões do Painel
  private panelX: number = 0;
  private panelY: number = 0;
  private panelW: number = 440;
  private panelH: number = 116;
  private vialX: number = 0;
  private vialY: number = 0;
  private barsX: number = 0;
  private barsW: number = 328;
  private hpBarY: number = 0;
  private stBarY: number = 0;

  // Retrato Gigante da Nixy (O DOBRO DO TAMANHO: 340px, livre sem caixa ou fundo)
  private portraitImage!: Phaser.GameObjects.Image;
  private portraitBaseX: number = 0;
  private portraitBaseY: number = 0;
  private portraitSize: number = 340;

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

  // Barra de Purificação de Almas (Capítulo 1)
  private purifyBarGraphics!: Phaser.GameObjects.Graphics;
  private purifyLabelText!: Phaser.GameObjects.Text;

  // Barra de Vida da Chefe (Boss HP Bar)
  private bossBarGraphics!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;

  // Elementos do Modo Infinito (Topo Central)
  private endlessTimerText!: Phaser.GameObjects.Text;
  private endlessRecordText!: Phaser.GameObjects.Text;
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
    // 1. RETRATO GIGANTE DA NIXY (340px - DOBRO DO TAMANHO)
    // ==========================================
    // Fica em primeiro plano (Depth 150), sobrepondo a borda direita da HUD
    this.portraitBaseX = width - this.portraitSize / 2 + 60;
    this.portraitBaseY = height - this.portraitSize / 2 + 15;

    this.portraitImage = this.add.image(this.portraitBaseX, this.portraitBaseY, 'nixy-portrait-idle');
    this.portraitImage.setDisplaySize(this.portraitSize, this.portraitSize);
    this.portraitImage.setDepth(150);

    // ==========================================
    // 2. PAINEL DE STATUS DEMÔNICO (STATUS HUD & NOME DO PERSONAGEM)
    // ==========================================
    const hudScale = 1.6;
    this.panelW = Math.round(280 * hudScale); // 448
    this.panelH = Math.round(131 * hudScale); // 210

    const hudBottom = height - 14;
    this.panelX = width - this.portraitSize - this.panelW + 225;
    this.panelY = hudBottom - this.panelH;

    const hudCenterX = this.panelX + this.panelW / 2;
    const hudCenterY = this.panelY + this.panelH / 2;

    // Sprite de fundo e moldura de pedra demoníaca com lava (Depth 30)
    this.statusHudImage = this.add.image(hudCenterX, hudCenterY, 'ui-status-hud');
    this.statusHudImage.setDisplaySize(this.panelW, this.panelH);
    this.statusHudImage.setDepth(30);

    // Sprite do Nome Oficial do Personagem (Depth 62 - sobre o topo da moldura)
    const gs = this.scene.get('GameScene') as any;
    const charId = (gs && gs.player && gs.player.characterId) ? gs.player.characterId : 'nixy';
    const charNameTexture = this.textures.exists(`ui-char-name-${charId}`) ? `ui-char-name-${charId}` : 'ui-char-name-nixy';
    const nameW = 220;
    const nameH = 100;
    const nameCenterX = hudCenterX;
    const nameCenterY = this.panelY + 40;

    this.charNameImage = this.add.image(nameCenterX, nameCenterY, charNameTexture);
    this.charNameImage.setDisplaySize(nameW, nameH);
    this.charNameImage.setDepth(62);

    // Medidor de Suprema: Ult Gauge posicionado no lado esquerdo da cavidade
    this.vialX = this.panelX + Math.round(36 * hudScale) + 40;
    this.vialY = this.panelY + 125;

    this.barsX = this.vialX + 56;
    this.barsW = 230;
    this.hpBarY = this.vialY - 9;
    this.stBarY = this.hpBarY + 24;

    // Desenho base dos slots das barras (Depth 35)
    this.baroquePanelGraphics = this.add.graphics();
    this.baroquePanelGraphics.setDepth(35);
    this.drawBaroqueFrame();

    // Medidor de Suprema: Ult Gauge (Fundo, Barra Líquida Dinâmica e Moldura Ornamental)
    this.ultGaugeBg = this.add.image(this.vialX, this.vialY, 'ult-gauge-bg');
    this.ultGaugeBg.setScale(2.0).setOrigin(0.5).setDepth(48);

    this.vialGraphics = this.add.graphics();
    this.vialGraphics.setDepth(50);
    this.drawUltimateOrb(0, false);

    this.ultGaugeFrame = this.add.image(this.vialX, this.vialY, 'ult-gauge-frame');
    this.ultGaugeFrame.setScale(2.0).setOrigin(0.5).setDepth(52);

    // Texto de porcentagem centralizado durante o carregamento
    this.ultimatePctText = this.add.text(this.vialX, this.vialY, '0%', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3.5
    }).setOrigin(0.5).setDepth(60);

    // Prompt [E] pulsante no centro do medidor quando 100% pronta
    this.ultimateReadyBadge = this.add.text(this.vialX, this.vialY, '[E]', {
      fontFamily: pixelFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#ff0055',
        blur: 10,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(65);
    this.ultimateReadyBadge.setVisible(false);

    // Zona interativa sobre o frasco para ativar por clique de mouse
    const vialZone = this.add.zone(this.vialX, this.vialY, 74, 74);
    vialZone.setOrigin(0.5);
    vialZone.setInteractive({ useHandCursor: true });
    vialZone.on('pointerdown', () => {
      if (!this.isHUDVisibleState || this.isDialogueActive()) return;
      const gs = this.scene.get('GameScene') as any;
      if (gs && gs.player && gs.player.isUltimateReady) {
        gs.triggerUltimate();
      }
    });

    // Tecla [E] também escutada diretamente na UIScene
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => {
        if (!this.isHUDVisibleState || this.isDialogueActive()) return;
        const gs = this.scene.get('GameScene') as any;
        if (gs && gs.player && gs.player.isUltimateReady) {
          gs.triggerUltimate();
        }
      });
    }

    // Barras dinâmicas (Depth 40)
    this.hpBarFill = this.add.graphics();
    this.hpBarFill.setDepth(40);

    this.staminaBarFill = this.add.graphics();
    this.staminaBarFill.setDepth(40);

    // Nível: LVL 1 em ouro antigo com contorno preto
    this.levelTag = this.add.text(this.barsX, this.hpBarY - 18, 'LVL 1', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(60);

    // Texto de Vida sobreposto na barra de HP
    this.hpText = this.add.text(this.barsX + this.barsW / 2, this.hpBarY + 9, '100 / 100 HP', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    // Texto de Estamina sobreposto na barra de Estamina
    this.staminaText = this.add.text(this.barsX + this.barsW / 2, this.stBarY + 7, '100% STAMINA', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

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
    // 5. TOPO CENTRAL: PURIFICAÇÃO DE ALMAS & BARRA DA CHEFE
    // ==========================================
    this.purifyBarGraphics = this.add.graphics();
    this.purifyBarGraphics.setDepth(110);

    this.purifyLabelText = this.add.text(width / 2, 19, 'PURIFICAÇÃO DE ALMAS', {
      fontFamily: pixelFont,
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0208',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(112);

    this.bossBarGraphics = this.add.graphics();
    this.bossBarGraphics.setDepth(115);
    this.bossBarGraphics.setVisible(false);

    this.bossNameText = this.add.text(width / 2, 17, 'ROSALIN [CHEFE DO CAPÍTULO 1]', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(116);
    this.bossNameText.setVisible(false);

    // ==========================================
    // 5.1 TOPO CENTRAL: CRONÔMETRO E RECORDE DO MODO INFINITO
    // ==========================================
    this.bestRecordSec = this.getBestRecordSec();
    const formattedBest = this.formatTime(this.bestRecordSec);

    this.endlessTimerText = this.add.text(width / 2, 22, '00:00', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#3a0812',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(115);
    this.endlessTimerText.setVisible(false);

    this.endlessRecordText = this.add.text(width / 2, 38, `RECORDE: ${formattedBest}`, {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0208',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(116);
    this.endlessRecordText.setVisible(false);

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
      this.portraitImage,
      this.statusHudImage,
      this.charNameImage,
      this.baroquePanelGraphics,
      this.ultGaugeBg,
      this.vialGraphics,
      this.ultGaugeFrame,
      this.ultimatePctText,
      this.ultimateReadyBadge,
      this.hpBarFill,
      this.staminaBarFill,
      this.levelTag,
      this.hpText,
      this.staminaText,
      this.killsPanelGraphics,
      this.killsIcon,
      this.killsText,
      this.soulsIcon,
      this.soulsText,
      this.purifyBarGraphics,
      this.purifyLabelText,
      this.bossBarGraphics,
      this.bossNameText,
      this.endlessTimerText,
      this.endlessRecordText,
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

  /**
   * Desenha os trilhos base das barras de Vida e Estamina dentro da cavidade de pedra do StatusHud
   */
  private drawBaroqueFrame(): void {
    const g = this.baroquePanelGraphics;
    g.clear();

    const hpX = this.barsX;
    const hpY = this.hpBarY;
    const bW = this.barsW;
    const hpH = 18;

    // Fundo escuro e moldura do slot da barra de Vida (HP)
    g.fillStyle(0x140104, 0.95);
    g.fillRect(hpX, hpY, bW, hpH);
    g.lineStyle(1.5, 0xc59b27, 0.9);
    g.strokeRect(hpX, hpY, bW, hpH);

    // Fundo escuro e moldura do slot da barra de Estamina (ST)
    const stX = this.barsX;
    const stY = this.stBarY;
    const stH = 14;

    g.fillStyle(0x120a02, 0.95);
    g.fillRect(stX, stY, bW, stH);
    g.lineStyle(1.5, 0xc59b27, 0.8);
    g.strokeRect(stX, stY, bW, stH);
  }

  /**
   * Desenha a barra líquida mística dentro do novo Medidor da Suprema (Ult Gauge)
   * O líquido sobe entre o fundo (ult-gauge-bg) e a moldura frontal (ult-gauge-frame).
   * Violeta místico durante o carregamento; Carmesim ardente ao atingir 100%.
   */
  private drawUltimateOrb(chargeRatio: number, isReady: boolean): void {
    const g = this.vialGraphics;
    g.clear();

    const cx = this.vialX;
    const cy = this.vialY;

    // Dimensões da janela interna transparente da moldura (40x40 escalado em 2.0x)
    const winW = 46;
    const winH = 46;
    const winLeft = cx - winW / 2;
    const winBottom = cy + 22;
    const winTop = cy - 24;

    const clampedRatio = Phaser.Math.Clamp(chargeRatio, 0, 1);

    // Se pronta, projeta um halo e aura dourada pulsante ao redor do medidor
    if (isReady) {
      const now = this.time.now;
      const pulse = Math.sin(now * 0.008);
      g.lineStyle(3, 0xff0055, 0.7 + pulse * 0.3);
      g.strokeRoundedRect(cx - 40 - pulse, cy - 40 - pulse, 80 + pulse * 2, 80 + pulse * 2, 10);
      g.lineStyle(1.5, 0xffd60a, 0.9);
      g.strokeRoundedRect(cx - 38, cy - 38, 76, 76, 8);
    }

    // Líquido místico subindo verticalmente enquanto carrega
    if (clampedRatio > 0.02) {
      const fillH = winH * clampedRatio;
      const fillY = winBottom - fillH;

      // 1. Corpo principal do líquido (Violeta místico / Carmesim ardente)
      g.fillStyle(isReady ? 0xd90429 : 0x7b2cbf, 0.95);
      g.fillRect(winLeft, fillY, winW, fillH);

      // 2. Camada de brilho interno translúcido
      g.fillStyle(isReady ? 0xff0054 : 0x9d4edd, 0.65);
      g.fillRect(winLeft + 3, fillY + 2, winW - 6, Math.max(0, fillH - 4));

      // 3. Onda / menisco de energia na superfície do líquido
      const wave = isReady ? 0 : Math.sin(this.time.now * 0.007) * 1.5;
      g.fillStyle(isReady ? 0xffd60a : 0x00f5d4, 1);
      g.fillRect(winLeft, Math.max(winTop, fillY + wave), winW, 3);
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

    // Atualizar Medidor da Suprema (Ult Gauge)
    const ultRatio = Phaser.Math.Clamp(p.ultimateCharge / p.maxUltimateCharge, 0, 1);
    const isUltReady = p.isUltimateReady;
    this.drawUltimateOrb(ultRatio, isUltReady);

    if (isUltReady) {
      this.ultimatePctText.setVisible(false);
      this.ultimateReadyBadge.setVisible(true);

      const promptLabel = this.currentControlScheme === 'gamepad' ? '[Y]' : '[E]';
      if (this.ultimateReadyBadge.text !== promptLabel) {
        this.ultimateReadyBadge.setText(promptLabel);
      }

      // Efeito de pulso rítmico no prompt [E] ou [Y]
      const badgeScale = 1.0 + Math.sin(this.time.now * 0.008) * 0.14;
      this.ultimateReadyBadge.setScale(badgeScale);
    } else {
      this.ultimateReadyBadge.setVisible(false);
      this.ultimatePctText.setVisible(true);
      this.ultimatePctText.setText(`${Math.floor(ultRatio * 100)}%`);
    }

    if (this.touchControls) {
      this.touchControls.update(isUltReady);
    }

    // Atualizar Barra de Vida (HP) com gradiente carmesim
    const hpRatio = Math.max(0, p.currentHp / p.maxHp);
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(0xd90429, 1);
    this.hpBarFill.fillRect(this.barsX + 2, this.hpBarY + 2, (this.barsW - 4) * hpRatio, 14);
    this.hpText.setText(`${Math.max(0, Math.round(p.currentHp))} / ${p.maxHp} HP`);

    // Atualizar Barra de Estamina (ST)
    this.staminaBarFill.clear();
    const stRatio = Math.max(0, p.currentStamina / p.maxStamina);
    // Cor dinâmica: Ciano durante sprint, magenta esgotado, dourado/parchment normal
    const stColor = p.isSprinting ? 0x00f5d4 : (stRatio < 0.2 ? 0xf72585 : 0xe0a96d);
    this.staminaBarFill.fillStyle(stColor, 1);
    this.staminaBarFill.fillRect(this.barsX + 2, this.stBarY + 2, (this.barsW - 4) * stRatio, 10);
    this.staminaText.setText(`${Math.round(p.currentStamina)}% STAMINA`);

    // Atualizar sprite de nome caso o personagem mude
    if (p.characterId && this.charNameImage) {
      const charNameKey = `ui-char-name-${p.characterId}`;
      if (this.textures.exists(charNameKey) && this.charNameImage.texture.key !== charNameKey) {
        this.charNameImage.setTexture(charNameKey);
      }
    }

    // Feedback de Dano no Retrato Gigante da Nixy
    if (p.hurtTimer > 0) {
      if (this.portraitImage.texture.key !== 'nixy-portrait-damage') {
        this.portraitImage.setTexture('nixy-portrait-damage');
        this.portraitImage.setDisplaySize(this.portraitSize, this.portraitSize);
      }

      // Tremor orgânico livre (-6px a +6px)
      const shakeX = Phaser.Math.Between(-6, 6);
      const shakeY = Phaser.Math.Between(-6, 6);
      this.portraitImage.setPosition(this.portraitBaseX + shakeX, this.portraitBaseY + shakeY);
      this.portraitImage.setTint(0xff4444);
    } else {
      if (this.portraitImage.texture.key !== 'nixy-portrait-idle') {
        this.portraitImage.setTexture('nixy-portrait-idle');
        this.portraitImage.setDisplaySize(this.portraitSize, this.portraitSize);
      }
      this.portraitImage.setPosition(this.portraitBaseX, this.portraitBaseY);
      this.portraitImage.clearTint();
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
    this.levelTag.setText(`LVL ${p.currentLevel}`);

    // Atualizar Barra de Purificação de Almas (Modo História), Barra de Vida da Chefe, ou Cronômetro (Modo Infinito)
    if (gameScene.isBossFightActive && gameScene.bossInstance && gameScene.bossInstance.active) {
      // Exibe Barra de Vida da Chefe
      this.purifyBarGraphics.setVisible(false);
      this.purifyLabelText.setVisible(false);
      this.bossBarGraphics.setVisible(true);
      this.bossNameText.setVisible(true);

      const isAzazel = gameScene.currentChapter === 2 || gameScene.bossInstance === gameScene.azazelBoss;
      if (isAzazel) {
        if (gameScene.bossInstance.combatPhase === 3) {
          const cap = gameScene.azazelCrystalsCaptured || 0;
          this.bossNameText.setText(`AZAZEL [CRISTAIS PURIFICADOS: ${cap}/3]`);
        } else {
          this.bossNameText.setText('AZAZEL [CHEFE DO CAPÍTULO 2]');
        }
      } else {
        this.bossNameText.setText('ROSALIN [CHEFE DO CAPÍTULO 1]');
      }

      if (gameScene.gameMode === 'endless') {
        this.endlessTimerText.setVisible(true);
        this.endlessTimerText.setY(48);
        this.endlessRecordText.setVisible(false);
        const sec = Math.floor(gameScene.survivalTimeMs / 1000);
        this.endlessTimerText.setText(this.formatTime(sec));
      } else {
        this.endlessTimerText.setVisible(false);
        this.endlessRecordText.setVisible(false);
      }

      const bG = this.bossBarGraphics;
      bG.clear();

      const bW = 460;
      const bH = 12;
      const bX = width / 2 - bW / 2;
      const bY = 28;

      const boss = gameScene.bossInstance;
      const bossHpRatio = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);

      // Fundo e borda ouro da barra da chefe
      bG.fillStyle(0x1a0208, 0.96);
      bG.fillRoundedRect(bX, bY, bW, bH, 4);
      bG.lineStyle(2, 0xc59b27, 1);
      bG.strokeRoundedRect(bX, bY, bW, bH, 4);
      bG.lineStyle(1, 0xf3d17a, 0.8);
      bG.strokeRoundedRect(bX + 1, bY + 1, bW - 2, bH - 2, 3);

      // Preenchimento vermelho sangue com brilho
      if (bossHpRatio > 0.01) {
        bG.fillStyle(0xd90429, 1);
        bG.fillRoundedRect(bX + 2, bY + 2, (bW - 4) * bossHpRatio, bH - 4, 3);
        bG.fillStyle(0xff4d6d, 0.85);
        bG.fillRect(bX + 3, bY + 3, (bW - 6) * bossHpRatio, 2);
      }
    } else if (gameScene.gameMode === 'endless') {
      // MODO INFINITO: Exibe Cronômetro e Recorde Pessoal
      this.purifyBarGraphics.setVisible(false);
      this.purifyLabelText.setVisible(false);
      this.bossBarGraphics.setVisible(false);
      this.bossNameText.setVisible(false);

      this.endlessTimerText.setY(22);
      this.endlessTimerText.setVisible(true);
      this.endlessRecordText.setVisible(true);

      const sec = Math.floor(gameScene.survivalTimeMs / 1000);
      this.endlessTimerText.setText(this.formatTime(sec));
    } else if (gameScene.gameMode === 'story' && !gameScene.isBossFightActive) {
      // MODO HISTÓRIA: Exibe Barra de Purificação de Almas (SEM NÚMEROS VISÍVEIS)
      this.endlessTimerText.setVisible(false);
      this.endlessRecordText.setVisible(false);
      this.bossBarGraphics.setVisible(false);
      this.bossNameText.setVisible(false);

      this.purifyBarGraphics.setVisible(true);
      this.purifyLabelText.setVisible(true);

      const pG = this.purifyBarGraphics;
      pG.clear();

      const pW = 320;
      const pH = 8;
      const pX = width / 2 - pW / 2;
      const pY = 28;

      // Fundo e borda
      pG.fillStyle(0x140208, 0.94);
      pG.fillRoundedRect(pX, pY, pW, pH, 3);
      pG.lineStyle(1.5, 0xc59b27, 0.9);
      pG.strokeRoundedRect(pX, pY, pW, pH, 3);

      // Preenchimento carmesim suave
      const purifyRatio = Phaser.Math.Clamp(
        gameScene.chapterPurifiedSouls / gameScene.chapterTargetSouls,
        0,
        1
      );
      if (purifyRatio > 0.01) {
        pG.fillStyle(0xff0055, 1);
        pG.fillRoundedRect(pX + 1.5, pY + 1.5, (pW - 3) * purifyRatio, pH - 3, 2);
      }
    } else if (gameScene.gameMode === 'sandbox' && !gameScene.isBossFightActive) {
      // MODO DE TESTE (SANDBOX): Oculta barras de progresso no topo pois a pílula rápida do Sandbox ocupa este espaço
      this.endlessTimerText.setVisible(false);
      this.endlessRecordText.setVisible(false);
      this.bossBarGraphics.setVisible(false);
      this.bossNameText.setVisible(false);
      this.purifyBarGraphics.setVisible(false);
      this.purifyLabelText.setVisible(false);
    }

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
      if (this.hpBarFill) this.hpBarFill.clear();
      if (this.staminaBarFill) this.staminaBarFill.clear();
      if (this.purifyBarGraphics) this.purifyBarGraphics.clear();
      if (this.bossBarGraphics) this.bossBarGraphics.clear();
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

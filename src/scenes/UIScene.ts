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

export class UIScene extends Phaser.Scene {
  // Sistema de Diálogos Estilo Persona 5
  private dialogueSystem!: DialogueSystem;
  private hudElements: any[] = [];
  private isHUDVisibleState: boolean = true;
  private alertTimer?: Phaser.Time.TimerEvent;
  private alertTween?: Phaser.Tweens.Tween;

  // Controles Touch Mobile
  public touchControls!: TouchControls;

  // Estado e Container de Pausa / Sandbox
  public isPaused: boolean = false;
  public isChestRouletteOpen: boolean = false;
  public sandboxPanel?: DevSandboxPanel;
  private pauseModalContainer?: Phaser.GameObjects.Container;

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

  // Cursor Virtual para Gamepad no Menu de Pausa (ESC) e Fim da Jornada
  private pauseZones: Phaser.GameObjects.Zone[] = [];
  private pauseCursorX: number = 0;
  private pauseCursorY: number = 0;
  private pauseCursorGraphics?: Phaser.GameObjects.Graphics;
  private pauseCursorHintText?: Phaser.GameObjects.Text;
  private hoveredPauseZone: Phaser.GameObjects.Zone | null = null;
  private prevPadConfirm: boolean = false;
  private prevPadCancelOrStart: boolean = false;
  private keyEsc?: Phaser.Input.Keyboard.Key;
  private lastPauseToggleTime: number = 0;

  // Estado e Navegação do Modal FIM DA JORNADA (Gamepad / Teclado)
  public isGameOverModalOpen: boolean = false;
  private gameOverSelectedIndex: number = 0;
  private gameOverModalContainer?: Phaser.GameObjects.Container;
  private gameOverBtnRenders: ((h: boolean) => void)[] = [];
  private gameOverBtnActions: (() => void)[] = [];

  // Radar Tático / Minimapa Circular (Canto Superior Esquerdo)
  private radarFrameGraphics!: Phaser.GameObjects.Graphics;
  private radarBlipsGraphics!: Phaser.GameObjects.Graphics;
  private radarCenterX: number = 74;
  private radarCenterY: number = 84;
  private radarRadius: number = 54;
  private radarWorldRange: number = 750;
  private radarTagText!: Phaser.GameObjects.Text;

  // Barra de Purificação de Almas (Capítulo 1)
  private purifyBarGraphics!: Phaser.GameObjects.Graphics;
  private purifyLabelText!: Phaser.GameObjects.Text;

  // Barra de Vida da Chefe (Boss HP Bar)
  private bossBarGraphics!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;

  // Elementos do Modo Infinito (Topo Central)
  private endlessTimerText!: Phaser.GameObjects.Text;
  private endlessRecordText!: Phaser.GameObjects.Text;
  private waveAlertBanner!: Phaser.GameObjects.Text;
  private bestRecordSec: number = 0;

  // Indicador de Borda para o Altar de Ascensão (quando fora da tela)
  private altarIndicatorContainer!: Phaser.GameObjects.Container;
  private altarIndicatorGraphics!: Phaser.GameObjects.Graphics;
  private altarIndicatorText!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    // 0. Vinheta de Alerta de Vida Baixa (Depth 200 - acima da HUD e abaixo de modais)
    this.lowHpVignetteGraphics = this.add.graphics();
    this.lowHpVignetteGraphics.setDepth(200);

    // ==========================================
    // 0. RADAR TÁTICO / MINIMAPA CIRCULAR (CANTO SUPERIOR ESQUERDO)
    // ==========================================
    this.radarFrameGraphics = this.add.graphics();
    this.radarFrameGraphics.setDepth(100);
    this.drawRadarFrame();

    this.radarBlipsGraphics = this.add.graphics();
    this.radarBlipsGraphics.setDepth(101);

    this.radarTagText = this.add.text(this.radarCenterX, this.radarCenterY + this.radarRadius + 10, 'RADAR // 750m', {
      fontFamily: pixelFont,
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#c59b27',
      stroke: '#0e0308',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(102);

    const radarNorthText = this.add.text(this.radarCenterX, this.radarCenterY - this.radarRadius - 7, 'N', {
      fontFamily: pixelFont,
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0308',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(102);

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

    this.waveAlertBanner = this.add.text(width / 2, 60, '', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ff0055',
      backgroundColor: '#1a0208dd',
      padding: { x: 12, y: 5 },
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(120);
    this.waveAlertBanner.setVisible(false);

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

    // Captura qualquer tecla pressionada para restaurar a legenda para o Teclado
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', () => {
        this.wasKeyboardKeyPressed = true;
      });
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
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
      this.radarFrameGraphics,
      this.radarBlipsGraphics,
      this.radarTagText,
      radarNorthText,
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

    // 8. Indicador de Borda para o Altar de Ascensão (quando fora da tela)
    this.altarIndicatorContainer = this.add.container(0, 0);
    this.altarIndicatorContainer.setDepth(150);
    this.altarIndicatorContainer.setVisible(false);

    this.altarIndicatorGraphics = this.add.graphics();
    this.altarIndicatorContainer.add(this.altarIndicatorGraphics);

    this.altarIndicatorText = this.add.text(0, 0, '', {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffe600',
      stroke: '#000000',
      strokeThickness: 2.5
    }).setOrigin(0.5);
    this.altarIndicatorContainer.add(this.altarIndicatorText);

    this.hudElements.push(this.altarIndicatorContainer);

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
  }

  /**
   * Desenha a moldura barroca e retículo tático do radar circular
   */
  private drawRadarFrame(): void {
    const g = this.radarFrameGraphics;
    g.clear();

    const cx = this.radarCenterX;
    const cy = this.radarCenterY;
    const r = this.radarRadius;

    // 1. Fundo obsidiana translúcido profundo
    g.fillStyle(0x0e0308, 0.92);
    g.fillCircle(cx, cy, r);

    // 2. Anéis concêntricos de alcance tático (35% e 70%)
    g.lineStyle(1, 0x4a0e17, 0.5);
    g.strokeCircle(cx, cy, r * 0.35);
    g.strokeCircle(cx, cy, r * 0.70);

    // 3. Retículo de mira carmesim sutil
    g.lineStyle(1, 0x3d0b13, 0.6);
    g.lineBetween(cx - r + 3, cy, cx + r - 3, cy);
    g.lineBetween(cx, cy - r + 3, cx, cy + r - 3);

    // 4. Borda externa barroca em ouro envelhecido
    g.lineStyle(2, 0xc59b27, 1);
    g.strokeCircle(cx, cy, r);

    // Filete interno dourado fino
    g.lineStyle(1, 0xf3d17a, 0.75);
    g.strokeCircle(cx, cy, r - 2);

    // 5. Marcadores cardinais em ouro nos 4 pontos (Norte, Sul, Leste, Oeste)
    g.lineStyle(2, 0xf3d17a, 1);
    g.lineBetween(cx, cy - r, cx, cy - r + 5); // Norte
    g.lineBetween(cx, cy + r, cx, cy + r - 5); // Sul
    g.lineBetween(cx + r, cy, cx + r - 5, cy); // Leste
    g.lineBetween(cx - r, cy, cx - r + 5, cy); // Oeste

    // 6. Pequenas tachas douradas nos eixos diagonais (45 graus)
    const cos45 = 0.7071;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const px = cx + sx * r * cos45;
      const py = cy + sy * r * cos45;
      g.fillStyle(0xc59b27, 0.85);
      g.fillCircle(px, py, 1.5);
    }
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
    if (this.isGameOverModalOpen && this.gameOverModalContainer) {
      this.updateGameOverControls(delta);
      return;
    }

    // 4. Processa navegação por cursor virtual do gamepad caso o jogo esteja pausado no ESC
    const gameScene = this.scene.get('GameScene') as any;
    if (this.isPaused && this.pauseModalContainer) {
      this.updatePauseCursor(delta, gameScene);
      if (this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
        this.resumeGame(gameScene);
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
    this.updateRadar(p, gameScene);

    // Atualizar Indicador Direcional de Borda para o Altar de Ascensão (quando fora da tela)
    this.updateAltarOffscreenIndicator(p, gameScene);
  }

  /**
   * Atualiza dinamicamente as posições dos blips de entidades no radar
   */
  private updateRadar(p: any, gameScene: any): void {
    const g = this.radarBlipsGraphics;
    g.clear();

    const cx = this.radarCenterX;
    const cy = this.radarCenterY;
    const r = this.radarRadius;
    const maxWorldDist = this.radarWorldRange;
    const maxBlipRadius = r - 4;

    // ==========================================
    // 1. BLIPS DE INIMIGOS (DETECÇÃO UNIVERSAL AUTOMÁTICA)
    // ==========================================
    // (Gemas de XP não são exibidas no radar, apenas inimigos e futuros itens de mapa)
    if (gameScene.enemiesGroup) {
      const enemies = gameScene.enemiesGroup.getChildren();

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i] as any;
        if (!enemy.active || !enemy.visible || enemy.isDead) continue;

        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Identifica Chefes e Mini-Chefes (HP alto >= 80 ou textura succubus/boss)
        const isBoss = (enemy.maxHp && enemy.maxHp >= 80) ||
          (enemy.texture?.key && (enemy.texture.key.includes('succubus') || enemy.texture.key.includes('boss')));

        if (isBoss) {
          // Chefe/Succubus: bola um pouco maior (raio 4.5 vs 2.5 dos comuns), sem anel dourado
          const isOffRadar = dist > maxWorldDist;
          const blipDist = isOffRadar ? maxBlipRadius : (dist / maxWorldDist) * maxBlipRadius;
          const bx = cx + Math.cos(angle) * blipDist;
          const by = cy + Math.sin(angle) * blipDist;

          g.fillStyle(0xff0055, 1);
          g.fillCircle(bx, by, 4.5);
        } else {
          // Inimigo comum: desenha se dentro do alcance do radar
          if (dist > maxWorldDist) continue;

          const blipDist = (dist / maxWorldDist) * maxBlipRadius;
          const bx = cx + Math.cos(angle) * blipDist;
          const by = cy + Math.sin(angle) * blipDist;

          g.fillStyle(0xff2a4d, 0.9);
          g.fillCircle(bx, by, 2.5);
        }
      }
    }

    // ==========================================
    // 2. BLIPS DE ITENS DE MAPA (VERDE VIBRANTE COM INDICADOR DIRECIONAL)
    // ==========================================
    if (gameScene.mapItemsGroup) {
      const items = gameScene.mapItemsGroup.getChildren();
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as any;
        if (!item.active || !item.visible) continue;

        const dx = item.x - p.x;
        const dy = item.y - p.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Se estiver fora do alcance do radar, fixa na borda apontando para o item
        const isOffRadar = dist > maxWorldDist;
        const blipDist = isOffRadar ? maxBlipRadius : (dist / maxWorldDist) * maxBlipRadius;
        const bx = cx + Math.cos(angle) * blipDist;
        const by = cy + Math.sin(angle) * blipDist;

        // Ponto verde esmeralda vibrante com contorno branco fino para fácil leitura
        g.fillStyle(0x00ff66, 1);
        g.fillCircle(bx, by, 3.8);
        g.lineStyle(1, 0xffffff, 0.9);
        g.strokeCircle(bx, by, 3.8);
      }
    }

    // ==========================================
    // 2.1. BLIP DO ALTAR DE ASCENSÃO (MARCADO COM "X" NO MINIMAPA)
    // ==========================================
    if (gameScene.altarInstance && gameScene.altarInstance.active && !gameScene.altarInstance.isDestroyed) {
      const altar = gameScene.altarInstance;
      const dx = altar.x - p.x;
      const dy = altar.y - p.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // Se estiver fora do alcance do radar, fixa na borda do radar apontando na direção do Altar
      const isOffRadar = dist > maxWorldDist;
      const blipDist = isOffRadar ? maxBlipRadius : (dist / maxWorldDist) * maxBlipRadius;
      const bx = cx + Math.cos(angle) * blipDist;
      const by = cy + Math.sin(angle) * blipDist;

      // Desenho do "X" do Altar no minimapa (sem círculo ao redor)
      const xArm = 4.5;
      // Contorno escuro para máxima visibilidade contra o mapa
      g.lineStyle(3.8, 0x000000, 0.95);
      g.beginPath();
      g.moveTo(bx - xArm, by - xArm);
      g.lineTo(bx + xArm, by + xArm);
      g.moveTo(bx + xArm, by - xArm);
      g.lineTo(bx - xArm, by + xArm);
      g.strokePath();

      // Traço nítido do "X" em vermelho vibrante
      g.lineStyle(2.4, 0xff1e27, 1);
      g.beginPath();
      g.moveTo(bx - xArm, by - xArm);
      g.lineTo(bx + xArm, by + xArm);
      g.moveTo(bx + xArm, by - xArm);
      g.lineTo(bx - xArm, by + xArm);
      g.strokePath();

      // Ponto dourado no centro do X
      g.fillStyle(0xffe600, 1);
      g.fillCircle(bx, by, 1.2);
    }

    // ==========================================
    // 2.2. BLIP DO ALTAR DE INVOCAÇÃO DO CHEFE NO MINIMAPA
    // ==========================================
    if (gameScene.bossSummonAltar && !gameScene.bossSummonAltar.isCompleted) {
      const bAltar = gameScene.bossSummonAltar;
      const dx = bAltar.x - p.x;
      const dy = bAltar.y - p.y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      const isOffRadar = dist > maxWorldDist;
      const blipDist = isOffRadar ? maxBlipRadius : (dist / maxWorldDist) * maxBlipRadius;
      const bx = cx + Math.cos(angle) * blipDist;
      const by = cy + Math.sin(angle) * blipDist;

      if (bAltar.isActive) {
        // Altar Ativo: Chamas incandescentes pulsantes no radar (alaranjado/ouro)
        const pulse = Math.sin(this.time.now * 0.008) * 1.5;
        g.fillStyle(0xff2200, 0.7);
        g.fillCircle(bx, by, 7.5 + pulse);

        // Losango de chamas
        g.fillStyle(0xff9900, 1);
        g.fillTriangle(bx, by - 6 - pulse, bx - 4, by, bx + 4, by);
        g.fillTriangle(bx, by + 6 + pulse, bx - 4, by, bx + 4, by);

        // Núcleo dourado ardente
        g.fillStyle(0xffe600, 1);
        g.fillCircle(bx, by, 2.2);
      } else {
        // Altar Inativo: Pedra ancestral escura com runa sutil
        g.fillStyle(0x0e0206, 0.85);
        g.fillCircle(bx, by, 4.5);
        g.lineStyle(1.2, 0x665566, 0.8);
        g.strokeCircle(bx, by, 4.5);
        g.fillStyle(0xaa3344, 0.9);
        g.fillCircle(bx, by, 1.5);
      }
    }

    // ==========================================
    // 3. JOGADOR (CENTRO DO RADAR COM PONTEIRO DIRECIONAL)
    // ==========================================
    // Determina o ângulo da direção atual da heroína
    const dirMap: Record<string, number> = {
      'east': 0,
      'south-east': Math.PI * 0.25,
      'south': Math.PI * 0.5,
      'south-west': Math.PI * 0.75,
      'west': Math.PI,
      'north-west': -Math.PI * 0.75,
      'north': -Math.PI * 0.5,
      'north-east': -Math.PI * 0.25
    };

    let dirAngle = dirMap[p.currentDirection] ?? Math.PI * 0.5;
    if (p.body && p.body.velocity && (p.body.velocity.x !== 0 || p.body.velocity.y !== 0)) {
      dirAngle = Math.atan2(p.body.velocity.y, p.body.velocity.x);
    }

    // Ponteiro triangular em ciano apontando para onde Nixy está virada
    const arrowLen = 9;
    const tipX = cx + Math.cos(dirAngle) * arrowLen;
    const tipY = cy + Math.sin(dirAngle) * arrowLen;
    const leftX = cx + Math.cos(dirAngle + 2.45) * 5;
    const leftY = cy + Math.sin(dirAngle + 2.45) * 5;
    const rightX = cx + Math.cos(dirAngle - 2.45) * 5;
    const rightY = cy + Math.sin(dirAngle - 2.45) * 5;

    g.fillStyle(0x00f5d4, 1);
    g.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);

    // Ponto central de Nixy (Ciano brilhante com núcleo branco)
    g.fillStyle(0x00f5d4, 1);
    g.fillCircle(cx, cy, 3.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 1.5);
  }

  /**
   * Atualiza o indicador direcional de borda de tela para o Altar de Ascensão.
   * Quando o altar está fora da visão da câmera, aponta exatamente para sua direção
   * com badge [X] e distância em metros. Quando o jogador se aproxima e o altar entra na tela,
   * o indicador é ocultado automaticamente para não poluir a visão.
   */
  private updateAltarOffscreenIndicator(p: any, gameScene: any): void {
    if (!this.altarIndicatorContainer) return;

    // Prioridade máxima: se o Altar de Invocação do Chefe despertou
    let targetAltar: any = null;
    let isBossAltar = false;

    if (gameScene.bossSummonAltar && gameScene.bossSummonAltar.isActive && !gameScene.bossSummonAltar.isBossSpawned) {
      targetAltar = gameScene.bossSummonAltar;
      isBossAltar = true;
    } else if (gameScene.altarInstance && gameScene.altarInstance.active && !gameScene.altarInstance.isDestroyed) {
      targetAltar = gameScene.altarInstance;
      isBossAltar = false;
    }

    if (!targetAltar) {
      this.altarIndicatorContainer.setVisible(false);
      return;
    }

    const cam = gameScene.cameras?.main;
    if (!cam) {
      this.altarIndicatorContainer.setVisible(false);
      return;
    }

    // Verifica se o Altar está dentro da visão visível da câmera (com folga de 30px)
    const margin = 30;
    const isAltarOnScreen =
      targetAltar.x >= cam.worldView.x + margin &&
      targetAltar.x <= cam.worldView.right - margin &&
      targetAltar.y >= cam.worldView.y + margin &&
      targetAltar.y <= cam.worldView.bottom - margin;

    if (isAltarOnScreen) {
      this.altarIndicatorContainer.setVisible(false);
      return;
    }

    // Se o Altar está fora da tela, ativa o indicador na borda da tela
    this.altarIndicatorContainer.setVisible(true);

    const { width, height } = this.scale;
    const scX = width / 2;
    const scY = height / 2;

    const dx = targetAltar.x - p.x;
    const dy = targetAltar.y - p.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Margem segura da tela
    const marginX = 52;
    const marginY = 56;
    const halfW = width / 2 - marginX;
    const halfH = height / 2 - marginY;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scaleFactor = Math.min(
      Math.abs(halfW / (cos || 0.0001)),
      Math.abs(halfH / (sin || 0.0001))
    );

    const edgeX = scX + cos * scaleFactor;
    const edgeY = scY + sin * scaleFactor;

    this.altarIndicatorContainer.setPosition(Math.round(edgeX), Math.round(edgeY));

    // Desenha o marcador de borda com seta e badge
    const g = this.altarIndicatorGraphics;
    g.clear();

    // Seta / Triângulo apontando para o Altar
    const arrowDist = 18;
    const tipX = Math.cos(angle) * arrowDist;
    const tipY = Math.sin(angle) * arrowDist;
    const perpAngle = angle + Math.PI / 2;
    const wingX1 = Math.cos(perpAngle) * 7.5;
    const wingY1 = Math.sin(perpAngle) * 7.5;
    const wingX2 = -Math.cos(perpAngle) * 7.5;
    const wingY2 = -Math.sin(perpAngle) * 7.5;

    g.fillStyle(isBossAltar ? 0x28040d : 0x18040a, 0.95);
    g.beginPath();
    g.moveTo(tipX, tipY);
    g.lineTo(wingX1, wingY1);
    g.lineTo(wingX2, wingY2);
    g.closePath();
    g.fill();

    const arrowStroke = isBossAltar ? 0xff4500 : 0xff002b;
    g.lineStyle(2, arrowStroke, 1);
    g.beginPath();
    g.moveTo(tipX, tipY);
    g.lineTo(wingX1, wingY1);
    g.lineTo(wingX2, wingY2);
    g.closePath();
    g.stroke();

    // Fundo do badge de distância (compacto, sem [X])
    const badgeW = isBossAltar ? 48 : 44;
    const badgeH = 20;
    g.fillStyle(isBossAltar ? 0x1a0509 : 0x0e0206, 0.94);
    g.fillRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 4);
    g.lineStyle(1.5, isBossAltar ? 0xff7700 : 0xffe600, 0.95);
    g.strokeRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 4);

    // Texto: apenas a distância em metros
    const distMeters = Math.max(1, Math.round(dist / 10));
    this.altarIndicatorText.setText(`${distMeters}m`);
    this.altarIndicatorText.setColor(isBossAltar ? '#ffaa00' : '#ffe600');
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
      if (this.radarBlipsGraphics) this.radarBlipsGraphics.clear();
      if (this.hpBarFill) this.hpBarFill.clear();
      if (this.staminaBarFill) this.staminaBarFill.clear();
      if (this.purifyBarGraphics) this.purifyBarGraphics.clear();
      if (this.bossBarGraphics) this.bossBarGraphics.clear();
      if (this.waveAlertBanner) this.waveAlertBanner.setVisible(false);
    }
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

  public showChapterVictoryModal(stats: { kills: number; level: number; timeSec: number; soulsEarned?: number }, onReturnToMenu: () => void): void {
    this.setHUDVisible(false);
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const modal = this.add.container(0, 0);
    modal.setDepth(3500);

    const darkBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88);
    darkBg.setInteractive();
    modal.add(darkBg);

    const panelW = 540;
    const panelH = 340;
    const panelX = width / 2;
    const panelY = height / 2;

    const g = this.add.graphics();
    g.fillStyle(0x180309, 0.98);
    g.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(3, 0xf3d17a, 1);
    g.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(1.5, 0xffffff, 0.6);
    g.strokeRoundedRect(panelX - panelW / 2 + 4, panelY - panelH / 2 + 4, panelW - 8, panelH - 8, 11);
    modal.add(g);

    const title = this.add.text(panelX, panelY - 110, 'CAPÍTULO 1 CONCLUÍDO', {
      fontFamily: pixelFont,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#4a0e17',
      strokeThickness: 4
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.add.text(panelX, panelY - 70, 'AS CATACUMBAS FORAM PURIFICADAS', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    modal.add(subtitle);

    const soulsInfo = typeof stats.soulsEarned === 'number' ? `\nAlmas Corrompidas Resgatadas: +${stats.soulsEarned}` : '';
    const statsText = this.add.text(panelX, panelY, 
      `Inimigos Abatidos: ${stats.kills}\nNível Alcançado: ${stats.level}\nTempo: ${stats.timeSec}s\nChefe: Rosalin (DERROTADA)${soulsInfo}`, {
      fontFamily: pixelFont,
      fontSize: '12px',
      color: '#e0aaff',
      stroke: '#100306',
      strokeThickness: 2,
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
    modal.add(statsText);

    // Botão Voltar ao Menu
    const btnW = 300;
    const btnH = 40;
    const btnX = panelX;
    const btnY = panelY + 110;

    const btnBg = this.add.graphics();
    const renderBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xff0055 : 0x720012, 1);
      btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(2, hover ? 0xffffff : 0xf3d17a, 1);
      btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn(false);
    modal.add(btnBg);

    const btnText = this.add.text(btnX, btnY, 'VOLTAR AO MENU', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btnText);

    const btnZone = this.add.zone(btnX, btnY, btnW, btnH);
    btnZone.setInteractive({ useHandCursor: true });
    modal.add(btnZone);

    btnZone.on('pointerover', () => renderBtn(true));
    btnZone.on('pointerout', () => renderBtn(false));
    btnZone.on('pointerdown', onReturnToMenu);
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
      const val = localStorage.getItem('hell_survivor_endless_record_sec');
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  public saveBestRecordSec(sec: number): boolean {
    try {
      const current = this.getBestRecordSec();
      if (sec > current) {
        localStorage.setItem('hell_survivor_endless_record_sec', sec.toString());
        return true;
      }
    } catch {}
    return false;
  }

  public showWaveAlert(message: string, durationMs: number = 3000): void {
    if (!this.waveAlertBanner) return;

    if (this.alertTimer) {
      this.alertTimer.remove(false);
      this.alertTimer = undefined;
    }
    if (this.alertTween) {
      this.alertTween.stop();
      this.alertTween = undefined;
    }

    this.waveAlertBanner.setText(message);
    this.waveAlertBanner.setAlpha(1);
    this.waveAlertBanner.setScale(1.15);
    this.waveAlertBanner.setVisible(true);

    this.alertTween = this.tweens.add({
      targets: this.waveAlertBanner,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 220,
      ease: 'Back.easeOut'
    });

    this.alertTimer = this.time.delayedCall(durationMs, () => {
      if (this.waveAlertBanner) {
        this.alertTween = this.tweens.add({
          targets: this.waveAlertBanner,
          alpha: 0,
          duration: 350,
          ease: 'Linear',
          onComplete: () => {
            if (this.waveAlertBanner) {
              this.waveAlertBanner.setVisible(false);
            }
          }
        });
      }
    });
  }

  /**
   * Exibe uma notificação dramática no centro da tela (um pouco mais para cima),
   * sem fundo, com texto grande e efeito de flutuação suave.
   */
  public showCenterAnnouncement(title: string, subtitle?: string, durationMs: number = 4600): void {
    const { width, height } = this.scale;
    const centerY = Math.round(height * 0.32);

    // Remove qualquer anúncio anterior se ainda estiver na tela
    const existing = this.children.getByName('center-announcement-container');
    if (existing) {
      existing.destroy();
    }

    const container = this.add.container(width / 2, centerY);
    container.setName('center-announcement-container');
    container.setDepth(999);
    container.setAlpha(0);
    container.setScale(0.8);

    // 1. Título Principal em Letra Bem Grande, Dourada e com Contorno Forte (Sem nenhum fundo!)
    const titleText = this.add.text(0, subtitle ? -22 : 0, title, {
      fontFamily: 'Pixelzone, Silkscreen, monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffe600',
      stroke: '#000000',
      strokeThickness: 7,
      align: 'center',
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#ff2200',
        blur: 14,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    titleText.setResolution(2);
    container.add(titleText);

    // 2. Subtítulo em Letra Maior e Perfeitamente Legível
    if (subtitle) {
      const subText = this.add.text(0, 26, subtitle, {
        fontFamily: 'Pixelzone, Silkscreen, monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center',
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: '#000000',
          blur: 8,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      subText.setResolution(2);
      container.add(subText);
    }

    // Toca som dramático de anúncio
    SoundManager.getInstance().playWeaponEvolve();

    // 3. Animação de entrada fluida (Bounce in)
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Efeito contínuo de flutuação suave (onda senoidal para cima e para baixo)
        this.tweens.add({
          targets: container,
          y: centerY - 10,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // 4. Animação de saída (Fade out e subida suave antes de destruir)
    this.time.delayedCall(durationMs, () => {
      if (container.scene) {
        this.tweens.add({
          targets: container,
          alpha: 0,
          y: container.y - 20,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 450,
          ease: 'Power2.easeIn',
          onComplete: () => {
            container.destroy();
          }
        });
      }
    });
  }

  /**
   * Roleta Minimalista de Bênçãos do Baú do Abismo:
   * Sem painéis pesados, caixas ou bordas geométricas.
   * Os nomes sobem continuamente na vertical com estalos satisfatórios (playRouletteTick),
   * desaceleram, e revelam a bênção com fanfarra de prêmio (playRouletteJackpot),
   * "BÊNÇÃO CONCEDIDA" no topo, descrição limpa e prompt sutil de coleta.
   */
  public showChestRoulette(
    availableCards: UpgradeCard[],
    player: BaseCharacter,
    gameScene: any
  ): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    // 1. Pausa total do GameScene (física e loop de atualização para impedir spawns acumulados)
    this.isChestRouletteOpen = true;
    if (gameScene) {
      if (gameScene.physics) gameScene.physics.pause();
      if (gameScene.scene) gameScene.scene.pause();
    }

    const modal = this.add.container(0, 0);
    modal.setDepth(3400);

    // 2. Fundo escuro suave translúcido (sem caixas ou molduras)
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);
    backdrop.setInteractive();
    modal.add(backdrop);

    const centerX = width / 2;
    const centerY = height / 2;

    // Ícone do Baú flutuante no topo
    let chestSprite: Phaser.GameObjects.Image | undefined;
    if (this.textures.exists('item-chest')) {
      chestSprite = this.add.image(centerX, centerY - 82, 'item-chest');
      chestSprite.setScale(1.4);
      modal.add(chestSprite);

      this.tweens.add({
        targets: chestSprite,
        y: chestSprite.y - 6,
        duration: 480,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Texto superior de status ("BÊNÇÃO CONCEDIDA" ou "SORTEANDO BÊNÇÃO...")
    const headerText = this.add.text(centerX, centerY - 40, 'SORTEANDO BÊNÇÃO...', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ff4d6d',
      letterSpacing: 2
    }).setOrigin(0.5);
    modal.add(headerText);

    // Container dedicado onde os nomes vão subir
    const reelContainer = this.add.container(centerX, centerY);
    modal.add(reelContainer);

    // Texto descritivo breve
    const descText = this.add.text(centerX, centerY + 40, '', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#e2e8f0',
      align: 'center',
      wordWrap: { width: Math.min(width - 60, 460) }
    }).setOrigin(0.5).setVisible(false);
    modal.add(descText);

    // Texto minimalista de coleta (sem formas nem quadrados ao redor!)
    const collectPrompt = this.add.text(centerX, centerY + 86, '[ COLETAR BÊNÇÃO ]', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setVisible(false);
    collectPrompt.setInteractive({ useHandCursor: true });
    modal.add(collectPrompt);

    const keyHint = this.add.text(centerX, centerY + 106, '(ou pressione Espaço)', {
      fontFamily: pixelFont,
      fontSize: '8px',
      color: '#64748b'
    }).setOrigin(0.5).setVisible(false);
    modal.add(keyHint);

    // Animação de pulso suave no texto de coleta
    this.tweens.add({
      targets: collectPrompt,
      alpha: 0.6,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    collectPrompt.on('pointerover', () => {
      collectPrompt.setColor('#ffffff');
      SoundManager.getInstance().playMenuHover();
    });
    collectPrompt.on('pointerout', () => {
      collectPrompt.setColor('#f3d17a');
    });

    // Lista de nomes para a animação da roleta
    const dummyNames = [
      'LÂMINAS ORBITAIS',
      'ADAGAS DE SANGUE',
      'CADEIAS ABISSAIS',
      'METEORO INFERNAL',
      'FÚRIA INFERNAL',
      'PULMÕES DO DEMÔNIO',
      'ALMA EXTRA',
      'PERFURAÇÃO MÍSTICA',
      'CELERIDADE ABISSAL',
      'ÍMÃ DE ALMAS',
      'VITALIDADE SANGRENTA',
      'DRENO VITAL',
      'REGENERAÇÃO SOMBRIA'
    ];

    const pool = availableCards.length > 0 ? availableCards : [];
    const evoCards = pool.filter((c) => c.isEvolution);
    const chosenCard =
      evoCards.length > 0
        ? Phaser.Math.RND.pick(evoCards)
        : pool.length > 0
          ? Phaser.Math.RND.pick(pool)
          : null;

    // Curva de desaceleração (14 passos progressivos simulando carretel de slot)
    const stepDelays = [40, 45, 50, 55, 65, 75, 90, 110, 140, 180, 230, 290, 370, 480];
    let stepIndex = 0;
    let currentSlotText: Phaser.GameObjects.Text | null = null;

    const rollNextName = () => {
      const isFinal = stepIndex >= stepDelays.length;

      // Nome a ser exibido neste passo
      let displayName: string;
      if (isFinal) {
        displayName = chosenCard ? chosenCard.title : 'RESTAURAÇÃO TOTAL';
      } else {
        displayName = pool.length > 0
          ? Phaser.Math.RND.pick(pool).title
          : Phaser.Math.RND.pick(dummyNames);
      }

      // Novo texto nascendo de baixo (+28px)
      const nextSlotText = this.add.text(0, 28, displayName, {
        fontFamily: pixelFont,
        fontSize: isFinal ? '18px' : '15px',
        fontStyle: 'bold',
        color: isFinal ? '#ffe600' : '#ffd700',
        stroke: '#000000',
        strokeThickness: isFinal ? 4 : 3
      }).setOrigin(0.5);
      nextSlotText.setAlpha(0);
      reelContainer.add(nextSlotText);

      const animDuration = isFinal ? 280 : Math.max(30, stepDelays[stepIndex] * 0.75);

      // O texto atual sobe (-28px) e desaparece
      if (currentSlotText && currentSlotText.active) {
        const oldText = currentSlotText;
        this.tweens.add({
          targets: oldText,
          y: -28,
          alpha: 0,
          duration: animDuration,
          ease: 'Quad.easeOut',
          onComplete: () => oldText.destroy()
        });
      }

      // O novo texto sobe para o centro (0) e ganha opacidade
      this.tweens.add({
        targets: nextSlotText,
        y: 0,
        alpha: 1,
        duration: animDuration,
        ease: isFinal ? 'Back.easeOut' : 'Quad.easeOut'
      });

      currentSlotText = nextSlotText;

      if (!isFinal) {
        // Toca o barulhinho satisfatório de clique místico
        const pitchProgress = 0.95 + (stepIndex / stepDelays.length) * 0.35;
        SoundManager.getInstance().playRouletteTick(pitchProgress);

        const delay = stepDelays[stepIndex];
        stepIndex++;
        this.time.delayedCall(delay, rollNextName);
      } else {
        // FINAL: PAROU NA BÊNÇÃO!
        // 1. Toca o som de prêmio / jackpot triunfante
        SoundManager.getInstance().playRouletteJackpot();
        this.cameras.main.flash(220, 255, 215, 0);

        // 2. Altera o texto do topo para "BÊNÇÃO CONCEDIDA"
        headerText.setText('BÊNÇÃO CONCEDIDA').setColor('#00f5d4');

        // 3. Formata brevemente a descrição sem quebras excessivas
        let cleanDesc: string;
        if (chosenCard) {
          cleanDesc = chosenCard.description
            .replace(/\n\n/g, ' — ')
            .replace(/\n/g, ' ');
        } else {
          cleanDesc = 'Sua vitalidade foi 100% regenerada pelo fogo abissal.';
        }
        descText.setText(cleanDesc).setVisible(true).setAlpha(0);
        this.tweens.add({
          targets: descText,
          alpha: 1,
          y: centerY + 36,
          duration: 300,
          ease: 'Quad.easeOut'
        });

        // 4. Mostra o texto minimalista de coletar bênção
        collectPrompt.setVisible(true).setAlpha(0);
        keyHint.setVisible(true).setAlpha(0);
        this.tweens.add({
          targets: [collectPrompt, keyHint],
          alpha: 1,
          duration: 350,
          delay: 150,
          ease: 'Linear'
        });
      }
    };

    // Inicia o primeiro giro após breve suspense (100ms)
    this.time.delayedCall(100, rollNextName);

    // Finalização e Coleta
    let collected = false;
    const finalizeCollection = () => {
      if (collected || stepIndex < stepDelays.length) return;
      collected = true;

      window.removeEventListener('keydown', onKey);
      SoundManager.getInstance().playMenuClick();

      // Aplica a bênção
      if (chosenCard) {
        chosenCard.apply(player, gameScene);
      } else {
        player.heal(player.maxHp);
      }

      // Fecha o modal e retoma o jogo com imunidade de proteção
      this.isChestRouletteOpen = false;
      modal.destroy();
      if (gameScene && !gameScene.isGameOver && !gameScene.isChapterCompleted) {
        if (gameScene.scene) gameScene.scene.resume();
        if (gameScene.physics) gameScene.physics.resume();
        if (typeof gameScene.grantChestSafetyGrace === 'function') {
          gameScene.grantChestSafetyGrace();
        }
      }
    };

    collectPrompt.on('pointerdown', finalizeCollection);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        finalizeCollection();
      }
    };
    window.addEventListener('keydown', onKey);
  }

  public showGameOverModal(
    stats: { kills: number; level: number; timeSec: number; mode: 'story' | 'endless' | 'sandbox'; soulsEarned?: number },
    onRetry: () => void,
    onReturnToMenu: () => void
  ): void {
    this.setHUDVisible(false);
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const isNewRecord = stats.mode === 'endless' && stats.timeSec > this.bestRecordSec;
    if (isNewRecord) {
      this.saveBestRecordSec(stats.timeSec);
      this.bestRecordSec = stats.timeSec;
    }

    const modal = this.add.container(0, 0);
    modal.setDepth(3600);

    const darkBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.90);
    darkBg.setInteractive();
    modal.add(darkBg);

    const panelW = 560;
    const panelH = 370;
    const panelX = width / 2;
    const panelY = height / 2;

    const g = this.add.graphics();
    // Fundo carmesim/obsidiana profundo
    g.fillStyle(0x180208, 0.98);
    g.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(3, 0xff0055, 1);
    g.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(1.5, 0xf3d17a, 0.7);
    g.strokeRoundedRect(panelX - panelW / 2 + 4, panelY - panelH / 2 + 4, panelW - 8, panelH - 8, 11);
    modal.add(g);

    const title = this.add.text(panelX, panelY - 125, 'FIM DA JORNADA', {
      fontFamily: pixelFont,
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);
    modal.add(title);

    const isStory = stats.mode === 'story';
    const subtitleText = isStory
      ? 'A MORTE NÃO É O FIM PARA QUEM JÁ ESTÁ NO PURGATÓRIO'
      : 'SUA ALMA FOI REIVINDICADA PELO ABISMO';

    const subtitle = this.add.text(panelX, panelY - 85, subtitleText, {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e0aaff',
      stroke: '#100306',
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(subtitle);

    const formattedTime = this.formatTime(stats.timeSec);
    const bestText = stats.mode === 'endless' ? `\nRecorde Pessoal: ${this.formatTime(this.bestRecordSec)}` : '';
    const newRecordNotice = isNewRecord ? '\nNOVO RECORDE PESSOAL ALCANÇADO!\n' : '\n';
    const soulsNotice = typeof stats.soulsEarned === 'number' ? `\nAlmas Corrompidas Resgatadas: +${stats.soulsEarned}` : '';

    const statsText = this.add.text(panelX, panelY - 5,
      `Tempo Sobrevivido: ${formattedTime}${bestText}${newRecordNotice}` +
      `Inimigos Abatidos: ${stats.kills}\nNível Alcançado: LVL ${stats.level}${soulsNotice}`, {
      fontFamily: pixelFont,
      fontSize: '12px',
      color: isNewRecord ? '#ffd60a' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);
    modal.add(statsText);

    // Botões Lado a Lado: [ JOGAR NOVAMENTE ] e [ VOLTAR AO MENU ]
    const btnW = 230;
    const btnH = 42;
    const btn1X = panelX - btnW / 2 - 12;
    const btn2X = panelX + btnW / 2 + 12;
    const btnY = panelY + 125;

    // Botão 1: Tentar Novamente / Ressurgir
    const btn1Bg = this.add.graphics();
    const renderBtn1 = (h: boolean) => {
      btn1Bg.clear();
      btn1Bg.fillStyle(h ? 0xff0055 : 0x720012, 1);
      btn1Bg.fillRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn1Bg.lineStyle(2, h ? 0xffffff : 0xf3d17a, 1);
      btn1Bg.strokeRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn1(false);
    modal.add(btn1Bg);

    const btn1Label = isStory ? 'RESSURGIR DAS CINZAS' : 'TENTAR NOVAMENTE';
    const btn1Text = this.add.text(btn1X, btnY, btn1Label, {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btn1Text);

    const onRetryWrapped = () => {
      this.isGameOverModalOpen = false;
      this.cleanupPauseCursor();
      if (this.gameOverModalContainer) {
        this.gameOverModalContainer.destroy();
        this.gameOverModalContainer = undefined;
      }
      onRetry();
    };

    const onReturnToMenuWrapped = () => {
      this.isGameOverModalOpen = false;
      this.cleanupPauseCursor();
      if (this.gameOverModalContainer) {
        this.gameOverModalContainer.destroy();
        this.gameOverModalContainer = undefined;
      }
      onReturnToMenu();
    };

    const btn1Zone = this.add.zone(btn1X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    btn1Zone.on('pointerover', () => {
      this.selectGameOverBtn(0);
    });
    btn1Zone.on('pointerout', () => renderBtn1(this.gameOverSelectedIndex === 0));
    btn1Zone.on('pointerdown', onRetryWrapped);
    modal.add(btn1Zone);

    // Botão 2: Voltar ao Menu
    const btn2Bg = this.add.graphics();
    const renderBtn2 = (h: boolean) => {
      btn2Bg.clear();
      btn2Bg.fillStyle(h ? 0x240046 : 0x10002b, 1);
      btn2Bg.fillRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn2Bg.lineStyle(2, h ? 0x00f5d4 : 0x7b2cbf, 1);
      btn2Bg.strokeRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn2(false);
    modal.add(btn2Bg);

    const btn2Text = this.add.text(btn2X, btnY, 'MENU PRINCIPAL', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btn2Text);

    const btn2Zone = this.add.zone(btn2X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    btn2Zone.on('pointerover', () => {
      this.selectGameOverBtn(1);
    });
    btn2Zone.on('pointerout', () => renderBtn2(this.gameOverSelectedIndex === 1));
    btn2Zone.on('pointerdown', onReturnToMenuWrapped);
    modal.add(btn2Zone);

    this.isGameOverModalOpen = true;
    this.gameOverSelectedIndex = 0;
    this.gameOverModalContainer = modal;
    this.gameOverBtnRenders = [renderBtn1, renderBtn2];
    this.gameOverBtnActions = [onRetryWrapped, onReturnToMenuWrapped];

    // Destaque inicial no Botão 1
    renderBtn1(true);
    renderBtn2(false);

    // Garante que o cursor virtual de pause esteja limpo
    this.cleanupPauseCursor();
  }

  // ==========================================
  // MENU DE PAUSA (ESC / PAUSE GAMEPLAY)
  // ==========================================
  public togglePause(gameScene: any): void {
    if (this.dialogueSystem && this.dialogueSystem.isDialogueActive()) return;
    if (this.scene.isActive('UpgradeScene')) return; // NUNCA pausar/despausar durante a escolha de cartas!
    if (this.isChestRouletteOpen) return;
    if (this.isGameOverModalOpen) return;
    if (gameScene.isGameOver || gameScene.isChapterCompleted) return;
    if (this.sandboxPanel && this.sandboxPanel.isOpen) {
      this.sandboxPanel.togglePanel();
      return;
    }

    const now = Date.now();
    if (now - this.lastPauseToggleTime < 320) return;
    this.lastPauseToggleTime = now;

    if (this.isPaused) {
      this.resumeGame(gameScene);
    } else {
      this.pauseGame(gameScene);
    }
  }

  public pauseGame(gameScene: any): void {
    if (this.isPaused || gameScene.isGameOver || gameScene.isChapterCompleted) return;
    this.isPaused = true;
    SoundManager.getInstance().playMenuClick();
    gameScene.physics.pause();
    gameScene.scene.pause();
    if (this.touchControls) {
      this.touchControls.setVisible(false);
    }

    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.cleanupPauseCursor();
    this.pauseZones = [];
    this.hoveredPauseZone = null;
    this.prevPadConfirm = false;
    this.prevPadCancelOrStart = true;

    this.pauseModalContainer = this.add.container(0, 0);
    this.pauseModalContainer.setDepth(3500);

    // 1. Fundo escuro semitransparente que bloqueia cliques no jogo
    const darkBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.82);
    darkBg.setInteractive();
    this.pauseModalContainer.add(darkBg);

    // 2. Painel gótico barroco
    const panelW = 540;
    const panelH = 390;
    const panelX = width / 2;
    const panelY = height / 2;

    const g = this.add.graphics();
    g.fillStyle(0x150308, 0.98);
    g.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(3, 0xc59b27, 1);
    g.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(1.5, 0xff4500, 0.6);
    g.strokeRoundedRect(panelX - panelW / 2 + 4, panelY - panelH / 2 + 4, panelW - 8, panelH - 8, 10);
    this.pauseModalContainer.add(g);

    // 3. Título
    const title = this.add.text(panelX, panelY - panelH / 2 + 38, 'JOGO PAUSADO', {
      fontFamily: pixelFont,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffa200',
      stroke: '#300207',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.pauseModalContainer.add(title);

    // 4. Estatísticas da Partida Atual
    const sec = Math.floor(gameScene.survivalTimeMs / 1000);
    const runSouls = MetaProgressManager.getInstance().runSoulsCollected;
    const statsText = this.add.text(
      panelX,
      panelY - 95,
      `TEMPO: ${this.formatTime(sec)}   |   ABATES: ${gameScene.killCount}   |   NÍVEL: ${gameScene.player?.currentLevel || 1}   |   ALMAS: ${runSouls}`,
      {
        fontFamily: pixelFont,
        fontSize: '11px',
        color: '#f3d17a'
      }
    ).setOrigin(0.5);
    this.pauseModalContainer.add(statsText);

    // Divisória sutil
    const div = this.add.graphics();
    div.lineStyle(1.5, 0xc59b27, 0.35);
    div.lineBetween(panelX - 200, panelY - 75, panelX + 200, panelY - 75);
    this.pauseModalContainer.add(div);

    // 5. Volume de Música (ao vivo na partida)
    const bgmRowY = panelY - 30;
    const bgmLabel = this.add.text(panelX, bgmRowY - 18, 'VOLUME DA MÚSICA', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.pauseModalContainer.add(bgmLabel);

    const bgmPct = this.add.text(
      panelX + 138,
      bgmRowY + 10,
      '',
      {
        fontFamily: pixelFont,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f3d17a'
      }
    ).setOrigin(0, 0.5);
    this.pauseModalContainer.add(bgmPct);

    const bgmBarGraphics = this.add.graphics();
    this.pauseModalContainer.add(bgmBarGraphics);

    const updateBgmDisplay = () => {
      const vol = SoundManager.getInstance().getMusicVolume();
      bgmPct.setText(`${Math.round(vol * 100)}%`);

      bgmBarGraphics.clear();
      const barX = panelX - 98;
      const barY = bgmRowY + 3;
      const barW = 188;
      const barH = 14;

      bgmBarGraphics.fillStyle(0x280d15, 1);
      bgmBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

      const fillW = Math.max(0, barW * vol);
      if (fillW > 0) {
        bgmBarGraphics.fillStyle(0xff7700, 1);
        bgmBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 4);
      }

      bgmBarGraphics.lineStyle(1.5, 0xc59b27, 0.85);
      bgmBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
    };
    updateBgmDisplay();

    this.createPauseStepperBtn(panelX - 125, bgmRowY + 10, '-', () => {
      const cur = SoundManager.getInstance().getMusicVolume();
      SoundManager.getInstance().setMusicVolume(Math.max(0, parseFloat((cur - 0.05).toFixed(2))));
      updateBgmDisplay();
    });

    this.createPauseStepperBtn(panelX + 112, bgmRowY + 10, '+', () => {
      const cur = SoundManager.getInstance().getMusicVolume();
      SoundManager.getInstance().setMusicVolume(Math.min(1, parseFloat((cur + 0.05).toFixed(2))));
      updateBgmDisplay();
    });

    // 6. Volume de SFX (ao vivo na partida)
    const sfxRowY = panelY + 40;
    const sfxLabel = this.add.text(panelX, sfxRowY - 18, 'VOLUME DE EFEITOS (SFX)', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.pauseModalContainer.add(sfxLabel);

    const sfxPct = this.add.text(
      panelX + 138,
      sfxRowY + 10,
      '',
      {
        fontFamily: pixelFont,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#00f5d4'
      }
    ).setOrigin(0, 0.5);
    this.pauseModalContainer.add(sfxPct);

    const sfxBarGraphics = this.add.graphics();
    this.pauseModalContainer.add(sfxBarGraphics);

    const updateSfxDisplay = () => {
      const vol = SoundManager.getInstance().getSfxVolume();
      sfxPct.setText(`${Math.round(vol * 100)}%`);

      sfxBarGraphics.clear();
      const barX = panelX - 98;
      const barY = sfxRowY + 3;
      const barW = 188;
      const barH = 14;

      sfxBarGraphics.fillStyle(0x280d15, 1);
      sfxBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

      const fillW = Math.max(0, barW * vol);
      if (fillW > 0) {
        sfxBarGraphics.fillStyle(0x00f5d4, 1);
        sfxBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 4);
      }

      sfxBarGraphics.lineStyle(1.5, 0xc59b27, 0.85);
      sfxBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
    };
    updateSfxDisplay();

    this.createPauseStepperBtn(panelX - 125, sfxRowY + 10, '-', () => {
      const cur = SoundManager.getInstance().getSfxVolume();
      SoundManager.getInstance().setSfxVolume(Math.max(0, parseFloat((cur - 0.05).toFixed(2))));
      updateSfxDisplay();
      SoundManager.getInstance().playEnemyHit();
    });

    this.createPauseStepperBtn(panelX + 112, sfxRowY + 10, '+', () => {
      const cur = SoundManager.getInstance().getSfxVolume();
      SoundManager.getInstance().setSfxVolume(Math.min(1, parseFloat((cur + 0.05).toFixed(2))));
      updateSfxDisplay();
      SoundManager.getInstance().playEnemyHit();
    });

    // 7. Botões Inferiores: CONTINUAR | REINICIAR | MENU
    const btnY = panelY + panelH / 2 - 42;
    const bW = 150;
    const bH = 34;
    const bSpacing = 16;
    const bTotalW = 3 * bW + 2 * bSpacing;
    const bStartX = panelX - bTotalW / 2 + bW / 2;

    this.createPauseActionBtn(bStartX, btnY, bW, bH, 'CONTINUAR', 0x225522, 0x00ff88, () => {
      this.resumeGame(gameScene);
    });

    this.createPauseActionBtn(bStartX + (bW + bSpacing), btnY, bW, bH, 'REINICIAR', 0x553311, 0xffaa00, () => {
      MetaProgressManager.getInstance().finalizeRunSouls();
      this.isPaused = false;
      this.cleanupPauseCursor();
      if (this.pauseModalContainer) {
        this.pauseModalContainer.destroy();
        this.pauseModalContainer = undefined;
      }
      this.scene.stop('UIScene');
      gameScene.scene.restart({ mode: gameScene.gameMode });
    });

    this.createPauseActionBtn(bStartX + 2 * (bW + bSpacing), btnY, bW, bH, 'MENU', 0x551122, 0xff0055, () => {
      MetaProgressManager.getInstance().finalizeRunSouls();
      this.isPaused = false;
      this.cleanupPauseCursor();
      if (this.pauseModalContainer) {
        this.pauseModalContainer.destroy();
        this.pauseModalContainer = undefined;
      }
      this.scene.stop('UIScene');
      gameScene.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    // 8. Cursor Virtual (Ponto/Mira) para controle com Analógico / Gamepad no Menu de Pausa
    this.pauseCursorX = width / 2;
    this.pauseCursorY = height / 2;

    this.pauseCursorGraphics = this.add.graphics();
    this.pauseCursorGraphics.setDepth(3700);

    this.pauseCursorHintText = this.add.text(this.pauseCursorX + 16, this.pauseCursorY - 12, '[A] SELECIONAR', {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#00f5d4',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5).setDepth(3701);
    this.pauseCursorHintText.setVisible(false);

    this.drawPauseCursor(false);
  }

  public resumeGame(gameScene: any): void {
    if (!this.isPaused) return;
    SoundManager.getInstance().playMenuClick();
    this.cleanupPauseCursor();
    if (this.pauseModalContainer) {
      this.pauseModalContainer.destroy();
      this.pauseModalContainer = undefined;
    }
    gameScene.physics.resume();
    gameScene.scene.resume();
    this.isPaused = false;
    if (this.touchControls) {
      this.touchControls.setVisible(this.isHUDVisibleState);
    }
  }

  private createPauseStepperBtn(x: number, y: number, symbol: string, onClick: () => void): void {
    if (!this.pauseModalContainer) return;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const bg = this.add.graphics();
    const render = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? 0xff4500 : 0x22050e, 1);
      bg.fillCircle(x, y, 14);
      bg.lineStyle(1.5, hover ? 0xffffff : 0xc59b27, 1);
      bg.strokeCircle(x, y, 14);
    };
    render(false);
    this.pauseModalContainer.add(bg);

    const txt = this.add.text(x, y, symbol, {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.pauseModalContainer.add(txt);

    const zone = this.add.zone(x, y, 36, 36);
    zone.setInteractive({ useHandCursor: true });
    this.pauseModalContainer.add(zone);

    zone.on('pointerover', () => {
      render(true);
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerout', () => render(false));
    zone.on('pointerdown', () => onClick());

    this.pauseZones.push(zone);
  }

  private createPauseActionBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgCol: number,
    borderCol: number,
    onClick: () => void
  ): void {
    if (!this.pauseModalContainer) return;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const bg = this.add.graphics();
    const render = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? borderCol : bgCol, 1);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
      bg.lineStyle(1.5, hover ? 0xffffff : borderCol, 1);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
    };
    render(false);
    this.pauseModalContainer.add(bg);

    const txt = this.add.text(x, y, label, {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.pauseModalContainer.add(txt);

    const zone = this.add.zone(x, y, w, h);
    zone.setInteractive({ useHandCursor: true });
    this.pauseModalContainer.add(zone);

    zone.on('pointerover', () => {
      render(true);
      txt.setColor('#000000');
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerout', () => {
      render(false);
      txt.setColor('#ffffff');
    });
    zone.on('pointerdown', () => onClick());

    this.pauseZones.push(zone);
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

  /**
   * Renderiza visualmente o ponto / retículo do cursor virtual para Gamepad
   */
  private drawPauseCursor(isHovering: boolean): void {
    if (!this.pauseCursorGraphics) return;
    const g = this.pauseCursorGraphics;
    g.clear();

    const x = this.pauseCursorX;
    const y = this.pauseCursorY;

    if (isHovering) {
      const pulse = Math.sin(this.time.now * 0.012) * 2;
      g.lineStyle(2, 0x00f5d4, 0.9);
      g.strokeCircle(x, y, 14 + pulse);

      g.lineStyle(1.5, 0xffd60a, 0.95);
      g.lineBetween(x - 18, y, x - 8, y);
      g.lineBetween(x + 8, y, x + 18, y);
      g.lineBetween(x, y - 18, x, y - 8);
      g.lineBetween(x, y + 8, x, y + 18);

      g.fillStyle(0xffffff, 1);
      g.fillCircle(x, y, 4.5);
    } else {
      g.lineStyle(2, 0xff0055, 0.85);
      g.strokeCircle(x, y, 10);

      g.lineStyle(1, 0xff77a9, 0.65);
      g.lineBetween(x - 13, y, x - 6, y);
      g.lineBetween(x + 6, y, x + 13, y);
      g.lineBetween(x, y - 13, x, y - 6);
      g.lineBetween(x, y + 6, x, y + 13);

      g.fillStyle(0xff0055, 1);
      g.fillCircle(x, y, 3.5);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(x, y, 1.5);
    }
  }

  /**
   * Move o cursor virtual pelo analógico/D-Pad, detecta sobreposição com botões e dispara clique com Botão (A)
   */
  private updatePauseCursor(delta: number, gameScene: any): void {
    if (!this.isPaused || !this.pauseModalContainer) return;

    const pad = GamepadManager.getInstance().getActivePad(this);
    if (!pad) {
      if (this.pauseCursorGraphics) this.pauseCursorGraphics.setVisible(false);
      if (this.pauseCursorHintText) this.pauseCursorHintText.setVisible(false);
      return;
    }

    const deadzone = 0.18;
    let stickX = pad.leftStick.x;
    let stickY = pad.leftStick.y;
    if (Math.abs(stickX) < deadzone) stickX = 0;
    if (Math.abs(stickY) < deadzone) stickY = 0;

    let dpadX = 0;
    let dpadY = 0;
    if (pad.left) dpadX -= 1;
    if (pad.right) dpadX += 1;
    if (pad.up) dpadY -= 1;
    if (pad.down) dpadY += 1;

    let moveX = dpadX !== 0 ? dpadX : stickX;
    let moveY = dpadY !== 0 ? dpadY : stickY;

    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
      moveX /= mag;
      moveY /= mag;
    }

    const speed = 540;
    const dt = delta / 1000;
    this.pauseCursorX += moveX * speed * dt;
    this.pauseCursorY += moveY * speed * dt;

    const { width, height } = this.scale;
    this.pauseCursorX = Phaser.Math.Clamp(this.pauseCursorX, 20, width - 20);
    this.pauseCursorY = Phaser.Math.Clamp(this.pauseCursorY, 20, height - 20);

    if (this.pauseCursorGraphics) this.pauseCursorGraphics.setVisible(true);

    let foundZone: Phaser.GameObjects.Zone | null = null;
    for (const zone of this.pauseZones) {
      if (!zone.active || !zone.visible) continue;
      const hw = zone.width / 2;
      const hh = zone.height / 2;
      if (
        this.pauseCursorX >= zone.x - hw &&
        this.pauseCursorX <= zone.x + hw &&
        this.pauseCursorY >= zone.y - hh &&
        this.pauseCursorY <= zone.y + hh
      ) {
        foundZone = zone;
        break;
      }
    }

    const isHovering = foundZone !== null;
    if (foundZone !== this.hoveredPauseZone) {
      if (this.hoveredPauseZone) {
        try { this.hoveredPauseZone.emit('pointerout'); } catch {}
      }
      this.hoveredPauseZone = foundZone;
      if (this.hoveredPauseZone) {
        try { this.hoveredPauseZone.emit('pointerover'); } catch {}
      }
    }

    this.drawPauseCursor(isHovering);

    if (this.pauseCursorHintText) {
      if (isHovering) {
        this.pauseCursorHintText.setVisible(true);
        this.pauseCursorHintText.setPosition(this.pauseCursorX + 16, this.pauseCursorY - 12);
      } else {
        this.pauseCursorHintText.setVisible(false);
      }
    }

    const isPadAPressed = Boolean(
      pad.A ||
      (pad.buttons[0] && pad.buttons[0].pressed)
    );
    const justDownA = isPadAPressed && !this.prevPadConfirm;
    this.prevPadConfirm = isPadAPressed;

    if (justDownA && this.hoveredPauseZone) {
      try {
        this.hoveredPauseZone.emit('pointerdown');
      } catch {}
    }

    const isPadBPressed = Boolean(
      pad.B ||
      (pad.buttons[1] && pad.buttons[1].pressed)
    );
    const isPadStartPressed = Boolean(
      (pad.buttons[9] && pad.buttons[9].pressed) ||
      (pad.buttons[8] && pad.buttons[8].pressed)
    );
    if (isPadBPressed || isPadStartPressed) {
      if (!this.prevPadCancelOrStart) {
        this.prevPadCancelOrStart = true;
        if (gameScene) {
          this.resumeGame(gameScene);
        }
      }
    } else {
      this.prevPadCancelOrStart = false;
    }
  }

  /**
   * Processa entrada de Gamepad, Teclado e Analógico para a tela Fim da Jornada
   */
  private updateGameOverControls(delta: number): void {
    if (!this.isGameOverModalOpen || !this.gameOverModalContainer) return;

    const nav = GamepadManager.getInstance().getMenuNavigation(this);
    const k = this.input.keyboard;

    const leftPressed = nav.left || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.A))
    ));
    const rightPressed = nav.right || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.D))
    ));

    if (leftPressed && this.gameOverSelectedIndex !== 0) {
      this.selectGameOverBtn(0);
    } else if (rightPressed && this.gameOverSelectedIndex !== 1) {
      this.selectGameOverBtn(1);
    }

    const confirmPressed = nav.confirm || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER))
    ));

    if (confirmPressed) {
      SoundManager.getInstance().playMenuClick();
      this.triggerGameOverChoice(this.gameOverSelectedIndex);
      return;
    }
  }

  private selectGameOverBtn(index: number): void {
    if (this.gameOverSelectedIndex !== index) {
      SoundManager.getInstance().playMenuHover();
    }
    this.gameOverSelectedIndex = index;
    if (this.gameOverBtnRenders[0]) this.gameOverBtnRenders[0](index === 0);
    if (this.gameOverBtnRenders[1]) this.gameOverBtnRenders[1](index === 1);
  }

  private triggerGameOverChoice(index: number): void {
    this.isGameOverModalOpen = false;
    this.cleanupPauseCursor();
    if (this.gameOverModalContainer) {
      this.gameOverModalContainer.destroy();
      this.gameOverModalContainer = undefined;
    }
    const action = this.gameOverBtnActions[index];
    if (action) action();
  }

  /**
   * Limpa referências, eventos e objetos do cursor virtual de pausa
   */
  private cleanupPauseCursor(): void {
    if (this.hoveredPauseZone) {
      try { this.hoveredPauseZone.emit('pointerout'); } catch {}
      this.hoveredPauseZone = null;
    }
    this.pauseZones = [];
    if (this.pauseCursorGraphics) {
      this.pauseCursorGraphics.destroy();
      this.pauseCursorGraphics = undefined;
    }
    if (this.pauseCursorHintText) {
      this.pauseCursorHintText.destroy();
      this.pauseCursorHintText = undefined;
    }
  }
}

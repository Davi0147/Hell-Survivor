import Phaser from 'phaser';
import { DialogueSystem, DialogueLine } from '../systems/DialogueSystem';

export class UIScene extends Phaser.Scene {
  // Sistema de Diálogos Estilo Persona 5
  private dialogueSystem!: DialogueSystem;
  private hudElements: any[] = [];
  private isHUDVisibleState: boolean = true;

  // Painel de Status Barroco Vampírico (Canto Inferior Direito)
  private baroquePanelGraphics!: Phaser.GameObjects.Graphics;
  private vialGraphics!: Phaser.GameObjects.Graphics;
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

  // Painel Superior Direito (Abates e Arma)
  private killsPanelGraphics!: Phaser.GameObjects.Graphics;
  private killsText!: Phaser.GameObjects.Text;
  private weaponInfoText!: Phaser.GameObjects.Text;

  // Controles
  private controlsText!: Phaser.GameObjects.Text;

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

  constructor() {
    super('UIScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

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
    // 2. PAINEL BARROCO VAMPÍRICO (MOVIDO MAIS PARA A DIREITA)
    // ==========================================
    // A borda direita do painel fica elegantemente atrás do sprite da Nixy
    this.panelW = 440;
    this.panelH = 116;
    this.panelX = width - this.portraitSize - this.panelW + 185;
    this.panelY = height - this.panelH - 22;

    this.barsX = this.panelX + 88;
    this.barsW = 328;
    this.hpBarY = this.panelY + 46;
    this.stBarY = this.panelY + 76;
    this.vialX = this.panelX + 44;
    this.vialY = this.panelY + 64;

    // Desenho estático do painel e decorações de filigrana dourada (Depth 30)
    this.baroquePanelGraphics = this.add.graphics();
    this.baroquePanelGraphics.setDepth(30);
    this.drawBaroqueFrame();

    // Orbe Alado da Suprema (Ultimate: Eternal Despair) (Depth 50)
    this.vialGraphics = this.add.graphics();
    this.vialGraphics.setDepth(50);
    this.drawUltimateOrb(0, false);

    // Texto de porcentagem da carga da Suprema (ex: 45%)
    this.ultimatePctText = this.add.text(this.vialX, this.vialY + 4, '0%', {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0208',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    // Badge pulsante de ativação quando a Suprema atinge 100%
    this.ultimateReadyBadge = this.add.text(this.vialX, this.vialY - 32, '[E] READY', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffd60a',
      backgroundColor: '#720012ee',
      padding: { x: 4, y: 2 },
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(65);
    this.ultimateReadyBadge.setVisible(false);

    // Zona interativa sobre o frasco para ativar por clique de mouse
    const vialZone = this.add.zone(this.vialX, this.vialY, 56, 56);
    vialZone.setOrigin(0.5);
    vialZone.setInteractive({ useHandCursor: true });
    vialZone.on('pointerdown', () => {
      if (!this.isHUDVisibleState || this.isDialogueActive()) return;
      const gameScene = this.scene.get('GameScene') as any;
      if (gameScene && gameScene.player && gameScene.player.isUltimateReady) {
        gameScene.triggerUltimate();
      }
    });

    // Tecla [E] também escutada diretamente na UIScene
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => {
        if (!this.isHUDVisibleState || this.isDialogueActive()) return;
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.player && gameScene.player.isUltimateReady) {
          gameScene.triggerUltimate();
        }
      });
    }

    // Barras dinâmicas (Depth 40)
    this.hpBarFill = this.add.graphics();
    this.hpBarFill.setDepth(40);

    this.staminaBarFill = this.add.graphics();
    this.staminaBarFill.setDepth(40);

    // ==========================================
    // 3. TIPOGRAFIA EM ESTILO PIXEL ART (SILKSCREEN / PRESS START 2P)
    // ==========================================
    // Nome da Heroína: NIXY (MAIOR: 26px, branco com contorno carmesim)
    const nameLabel = this.add.text(this.barsX, this.panelY + 10, 'NIXY', {
      fontFamily: pixelFont,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4a0e17',
      strokeThickness: 4
    });
    nameLabel.setDepth(60);

    // Nível: LVL 1 em ouro antigo
    this.levelTag = this.add.text(this.barsX + 115, this.panelY + 16, 'LVL 1', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#3a2004',
      strokeThickness: 2
    });
    this.levelTag.setDepth(60);

    // Texto de Vida sobreposto na barra de HP
    this.hpText = this.add.text(this.barsX + this.barsW / 2, this.hpBarY + 11, '100 / 100 HP', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#2b0006',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    // Texto de Estamina sobreposto na barra de Estamina
    this.staminaText = this.add.text(this.barsX + this.barsW / 2, this.stBarY + 8, '100% STAMINA', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#261702',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    // ==========================================
    // 4. CANTO SUPERIOR DIREITO: ABATES E ARMA ATIVA (ESTILO BARROCO)
    // ==========================================
    const margin = 20;
    const killsPanelW = 250;
    const killsPanelH = 68;
    const killsPanelX = width - killsPanelW - margin;
    const killsPanelY = 20;

    this.killsPanelGraphics = this.add.graphics();
    this.killsPanelGraphics.fillStyle(0x1a0308, 0.92);
    this.killsPanelGraphics.fillRoundedRect(killsPanelX, killsPanelY, killsPanelW, killsPanelH, 8);
    this.killsPanelGraphics.lineStyle(2, 0xc59b27, 1);
    this.killsPanelGraphics.strokeRoundedRect(killsPanelX, killsPanelY, killsPanelW, killsPanelH, 8);
    this.killsPanelGraphics.lineStyle(1, 0xf3d17a, 0.7);
    this.killsPanelGraphics.strokeRoundedRect(killsPanelX + 3, killsPanelY + 3, killsPanelW - 6, killsPanelH - 6, 6);

    this.killsText = this.add.text(killsPanelX + 16, killsPanelY + 14, '💀 ABATES: 0', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#3a0812',
      strokeThickness: 2
    });

    this.weaponInfoText = this.add.text(killsPanelX + 16, killsPanelY + 38, '🔮 Soul Bolts (Nív 1)', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#00f5d4',
      stroke: '#003530',
      strokeThickness: 2
    });

    // ==========================================
    // 5. TOPO CENTRAL: PURIFICAÇÃO DE ALMAS & BARRA DA CHEFE
    // ==========================================
    this.purifyBarGraphics = this.add.graphics();
    this.purifyBarGraphics.setDepth(110);

    this.purifyLabelText = this.add.text(width / 2, 19, '✦ PURIFICAÇÃO DE ALMAS ✦', {
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

    this.bossNameText = this.add.text(width / 2, 17, '👑 SUCCUBUS IMPERIAL [CHEFE DO CAPÍTULO 1]', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(116);
    this.bossNameText.setVisible(false);

    // Atalho silencioso de teclado para recarregar com F2 (sem nenhum botão ou texto na tela)
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2).on('down', () => {
        this.scene.stop('UIScene');
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
          gameScene.scene.start('BootScene');
        }
      });
    }

    // ==========================================
    // 6. CANTO INFERIOR ESQUERDO: CONTROLES
    // ==========================================
    this.controlsText = this.add.text(20, height - 36,
      '🕹️ [WASD] Mover  |  ⚡ [Shift] Sprint  |  🎯 Auto-Aim  |  💀 [E] Ultimate', {
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
      this.baroquePanelGraphics,
      this.vialGraphics,
      this.ultimatePctText,
      this.ultimateReadyBadge,
      this.hpBarFill,
      this.staminaBarFill,
      nameLabel,
      this.levelTag,
      this.hpText,
      this.staminaText,
      this.killsPanelGraphics,
      this.killsText,
      this.weaponInfoText,
      this.purifyBarGraphics,
      this.purifyLabelText,
      this.bossBarGraphics,
      this.bossNameText,
      this.controlsText,
      this.xpBarBg,
      this.xpBarFill,
      this.xpText
    ];
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
   * Desenha a moldura barroca ornamentada com veludo vermelho e filigranas douradas
   */
  private drawBaroqueFrame(): void {
    const g = this.baroquePanelGraphics;
    g.clear();

    const x = this.panelX;
    const y = this.panelY;
    const w = this.panelW;
    const h = this.panelH;

    // 1. Fundo de veludo vermelho profundo
    g.fillStyle(0x1a0208, 0.94);
    g.fillRoundedRect(x, y, w, h, 10);

    // Padrão interno de veludo carmesim sutil
    g.fillStyle(0x28040d, 0.85);
    g.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 8);

    // 2. Borda externa em ouro envelhecido
    g.lineStyle(2, 0xc59b27, 1);
    g.strokeRoundedRect(x, y, w, h, 10);

    // 3. Filete interno dourado claro
    g.lineStyle(1, 0xf3d17a, 0.8);
    g.strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, 7);

    // 4. Cantoneiras de filigrana dourada nos 4 cantos
    const cornerSize = 14;
    g.lineStyle(2, 0xf3d17a, 1);
    // Canto Superior Esquerdo
    g.strokeLineShape(new Phaser.Geom.Line(x + 4, y + 4 + cornerSize, x + 4, y + 4));
    g.strokeLineShape(new Phaser.Geom.Line(x + 4, y + 4, x + 4 + cornerSize, y + 4));
    g.strokeLineShape(new Phaser.Geom.Line(x + 8, y + 8 + cornerSize / 2, x + 8, y + 8));
    g.strokeLineShape(new Phaser.Geom.Line(x + 8, y + 8, x + 8 + cornerSize / 2, y + 8));

    // Canto Superior Direito
    g.strokeLineShape(new Phaser.Geom.Line(x + w - 4 - cornerSize, y + 4, x + w - 4, y + 4));
    g.strokeLineShape(new Phaser.Geom.Line(x + w - 4, y + 4, x + w - 4, y + 4 + cornerSize));

    // Canto Inferior Esquerdo
    g.strokeLineShape(new Phaser.Geom.Line(x + 4, y + h - 4 - cornerSize, x + 4, y + h - 4));
    g.strokeLineShape(new Phaser.Geom.Line(x + 4, y + h - 4, x + 4 + cornerSize, y + h - 4));

    // Canto Inferior Direito
    g.strokeLineShape(new Phaser.Geom.Line(x + w - 4 - cornerSize, y + h - 4, x + w - 4, y + h - 4));
    g.strokeLineShape(new Phaser.Geom.Line(x + w - 4, y + h - 4 - cornerSize, x + w - 4, y + h - 4));

    // 5. Ornato central inferior (Flor-de-lis / brasão dourado)
    const midX = x + w / 2;
    g.fillStyle(0xf3d17a, 1);
    g.fillTriangle(midX, y + h - 1, midX - 6, y + h + 5, midX + 6, y + h + 5);
    g.fillCircle(midX, y + h - 2, 3);

    // 6. Moldura base da Barra de Vida (HP)
    const hpX = this.barsX;
    const hpY = this.hpBarY;
    const bW = this.barsW;
    const hpH = 22;

    // Fundo escuro da barra de HP
    g.fillStyle(0x140104, 1);
    g.fillRect(hpX, hpY, bW, hpH);
    g.lineStyle(2, 0xc59b27, 1);
    g.strokeRect(hpX, hpY, bW, hpH);
    g.lineStyle(1, 0xf3d17a, 0.7);
    g.strokeRect(hpX + 1, hpY + 1, bW - 2, hpH - 2);

    // 7. Moldura base da Barra de Estamina
    const stX = this.barsX;
    const stY = this.stBarY;
    const stH = 16;

    // Fundo escuro da barra de Estamina
    g.fillStyle(0x120a02, 1);
    g.fillRect(stX, stY, bW, stH);
    g.lineStyle(2, 0xc59b27, 1);
    g.strokeRect(stX, stY, bW, stH);
    g.lineStyle(1, 0xf3d17a, 0.6);
    g.strokeRect(stX + 1, stY + 1, bW - 2, stH - 2);
  }

  /**
   * Desenha o Orbe Alado da Suprema (Ultimate: Eternal Despair)
   * Carrega com abates e gemas de alma.
   * Ao atingir 100%, emite chamas douradas e o prompt [E] READY!
   */
  private drawUltimateOrb(chargeRatio: number, isReady: boolean): void {
    const g = this.vialGraphics;
    g.clear();

    const cx = this.vialX;
    const cy = this.vialY;
    const now = this.time.now;
    const pulse = isReady ? Math.sin(now * 0.008) * 3 : 0;

    // ========================
    // 1. ASAS DOURADAS LATERAIS (WINGS)
    // ========================
    const drawWing = (dir: number) => {
      // Penas douradas superiores
      g.fillStyle(isReady ? 0xf3d17a : 0xc59b27, 0.95);
      g.fillTriangle(cx + dir * 18, cy - 10, cx + dir * (36 + pulse), cy - 26, cx + dir * 26, cy);
      g.fillTriangle(cx + dir * 18, cy - 2, cx + dir * (34 + pulse), cy - 12, cx + dir * 24, cy + 8);
      g.fillTriangle(cx + dir * 16, cy + 6, cx + dir * (30 + pulse), cy + 2, cx + dir * 22, cy + 16);

      // Relevo de pena clara
      g.lineStyle(1.5, isReady ? 0xffffff : 0xf3d17a, 1);
      g.strokeLineShape(new Phaser.Geom.Line(cx + dir * 18, cy - 10, cx + dir * (36 + pulse), cy - 26));
      g.strokeLineShape(new Phaser.Geom.Line(cx + dir * 18, cy - 2, cx + dir * (34 + pulse), cy - 12));
    };
    drawWing(-1); // Asa Esquerda
    drawWing(1);  // Asa Direita

    // Se pronta, desenha uma aura pulsante dourada em volta do bulbo
    if (isReady) {
      g.lineStyle(2, 0xffd60a, 0.75 + Math.sin(now * 0.01) * 0.25);
      g.strokeCircle(cx, cy + 4, 25 + pulse * 0.6);
    }

    // ========================
    // 2. CORPO DO FRASCO DE VIDRO
    // ========================
    const bulbRadius = 22;

    // Sombra interna do vidro
    g.fillStyle(0x0e0208, 0.92);
    g.fillCircle(cx, cy + 4, bulbRadius);

    // ========================
    // 3. ESSÊNCIA DA SUPREMA (LÍQUIDO MÍSTICO VIOLETA -> CARMESIM)
    // ========================
    const clampedRatio = Phaser.Math.Clamp(chargeRatio, 0, 1);
    if (clampedRatio > 0.04) {
      const liquidHeight = bulbRadius * 2 * clampedRatio;
      const fillY = cy + 4 + bulbRadius - liquidHeight;

      // Cor do líquido: Eletrizante carmesim quando pronta, violeta profundo durante carga
      g.fillStyle(isReady ? 0xff0055 : 0x7209b7, 1);
      g.beginPath();
      g.arc(cx, cy + 4, bulbRadius - 2, 0, Math.PI * 2);
      g.fill();

      // Corte superior do nível de carga
      g.fillStyle(0x0e0208, 0.92);
      g.fillRect(cx - bulbRadius, cy + 4 - bulbRadius, bulbRadius * 2, (bulbRadius * 2) * (1 - clampedRatio));

      // Linha de superfície brilhante (menisco de fogo/energia)
      g.fillStyle(isReady ? 0xffd60a : 0xf72585, 0.95);
      g.fillRect(cx - bulbRadius + 4, fillY, (bulbRadius - 4) * 2, 2.5);
    }

    // ========================
    // 4. REFLEXO E BRILHO DO VIDRO
    // ========================
    // Contorno do bulbo em ouro e vidro
    g.lineStyle(2.5, isReady ? 0xffd60a : 0xc59b27, 1);
    g.strokeCircle(cx, cy + 4, bulbRadius);
    g.lineStyle(1, 0xffffff, 0.6);
    g.strokeCircle(cx, cy + 4, bulbRadius - 1);

    // Reflexo de luz branco no vidro (Curva superior esquerda)
    g.lineStyle(2, 0xffffff, 0.75);
    g.beginPath();
    g.arc(cx - 6, cy - 2, 12, Math.PI * 0.9, Math.PI * 1.4);
    g.stroke();

    // ========================
    // 5. GARGALO E ROLHA DE OURO
    // ========================
    g.fillStyle(0xc59b27, 1);
    g.fillRect(cx - 7, cy - 24, 14, 6);
    g.lineStyle(1, 0xf3d17a, 1);
    g.strokeRect(cx - 7, cy - 24, 14, 6);

    g.fillStyle(0x936639, 1);
    g.fillRect(cx - 5, cy - 32, 10, 8);
    g.lineStyle(1, 0xc48b52, 1);
    g.strokeRect(cx - 5, cy - 32, 10, 8);
  }

  update(): void {
    if (this.isDialogueActive() || !this.isHUDVisibleState) return;

    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.player || !gameScene.scene.isActive()) return;

    const p = gameScene.player;

    // Atualizar Orbe Alado da Suprema (Ultimate: Eternal Despair)
    const ultRatio = Phaser.Math.Clamp(p.ultimateCharge / p.maxUltimateCharge, 0, 1);
    const isUltReady = p.isUltimateReady;
    this.drawUltimateOrb(ultRatio, isUltReady);

    if (isUltReady) {
      this.ultimatePctText.setVisible(false);
      this.ultimateReadyBadge.setVisible(true);

      // Efeito de pulso suave no badge
      const badgeScale = 1.0 + Math.sin(this.time.now * 0.008) * 0.08;
      this.ultimateReadyBadge.setScale(badgeScale);
    } else {
      this.ultimateReadyBadge.setVisible(false);
      this.ultimatePctText.setVisible(true);
      this.ultimatePctText.setText(`${Math.floor(ultRatio * 100)}%`);
    }

    // Atualizar Barra de Vida (HP) com gradiente carmesim
    const hpRatio = Math.max(0, p.currentHp / p.maxHp);
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(0xd90429, 1);
    this.hpBarFill.fillRect(this.barsX + 2, this.hpBarY + 2, (this.barsW - 4) * hpRatio, 18);
    this.hpText.setText(`${Math.max(0, Math.round(p.currentHp))} / ${p.maxHp} HP`);

    // Atualizar Barra de Estamina (ST)
    this.staminaBarFill.clear();
    const stRatio = Math.max(0, p.currentStamina / p.maxStamina);
    // Cor dinâmica: Ciano durante sprint, magenta esgotado, dourado/parchment normal
    const stColor = p.isSprinting ? 0x00f5d4 : (stRatio < 0.2 ? 0xf72585 : 0xe0a96d);
    this.staminaBarFill.fillStyle(stColor, 1);
    this.staminaBarFill.fillRect(this.barsX + 2, this.stBarY + 2, (this.barsW - 4) * stRatio, 12);
    this.staminaText.setText(`${Math.round(p.currentStamina)}% STAMINA`);

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

    // Atualizar Abates
    if (typeof gameScene.killCount === 'number') {
      this.killsText.setText(`💀 ABATES: ${gameScene.killCount}`);
    }

    // Atualizar Barra Superior de Experiência (XP)
    const { width } = this.scale;
    const xpRatio = Phaser.Math.Clamp(p.currentXp / p.xpToNextLevel, 0, 1);
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x00f5d4, 1);
    this.xpBarFill.fillRect(0, 0, width * xpRatio, 13);
    this.xpText.setText(`LVL ${p.currentLevel}   [ ${p.currentXp} / ${p.xpToNextLevel} XP ]`);
    this.levelTag.setText(`LVL ${p.currentLevel}`);

    // Atualizar Armas Ativas no Painel Superior Direito
    if (gameScene.weapons && gameScene.weapons.length > 0) {
      const names = gameScene.weapons.map((w: any) => w.name).join(', ');
      this.weaponInfoText.setText(`🔮 ${names}`);
    }

    // Atualizar Barra de Purificação de Almas (Modo História) ou Barra de Vida da Chefe
    if (gameScene.isBossFightActive && gameScene.bossInstance && gameScene.bossInstance.active) {
      // Exibe Barra de Vida da Chefe
      this.purifyBarGraphics.setVisible(false);
      this.purifyLabelText.setVisible(false);
      this.bossBarGraphics.setVisible(true);
      this.bossNameText.setVisible(true);

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
    } else if (gameScene.gameMode === 'story' && !gameScene.isBossFightActive) {
      // Exibe Barra de Purificação de Almas (SEM NÚMEROS VISÍVEIS)
      this.purifyBarGraphics.setVisible(true);
      this.purifyLabelText.setVisible(true);
      this.bossBarGraphics.setVisible(false);
      this.bossNameText.setVisible(false);

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
    } else {
      this.purifyBarGraphics.setVisible(false);
      this.purifyLabelText.setVisible(false);
      this.bossBarGraphics.setVisible(false);
      this.bossNameText.setVisible(false);
    }

    // Atualizar Radar Tático / Minimapa
    this.updateRadar(p, gameScene);
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

  public setHUDVisible(visible: boolean): void {
    this.isHUDVisibleState = visible;
    for (const el of this.hudElements) {
      if (el && typeof el.setVisible === 'function') {
        el.setVisible(visible);
      }
    }
    if (!visible) {
      if (this.radarBlipsGraphics) this.radarBlipsGraphics.clear();
      if (this.hpBarFill) this.hpBarFill.clear();
      if (this.staminaBarFill) this.staminaBarFill.clear();
      if (this.purifyBarGraphics) this.purifyBarGraphics.clear();
      if (this.bossBarGraphics) this.bossBarGraphics.clear();
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

  public showChapterVictoryModal(stats: { kills: number; level: number; timeSec: number }, onReturnToMenu: () => void): void {
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

    const title = this.add.text(panelX, panelY - 110, '★ CAPÍTULO 1 CONCLUÍDO ★', {
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

    const statsText = this.add.text(panelX, panelY, 
      `💀 Inimigos Abatidos: ${stats.kills}\n⭐ Nível Alcançado: ${stats.level}\n⏱️ Tempo: ${stats.timeSec}s\n👑 Chefe: Succubus Imperial (DERROTADA)`, {
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

    const btnText = this.add.text(btnX, btnY, '🏠 VOLTAR AO MENU', {
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
}

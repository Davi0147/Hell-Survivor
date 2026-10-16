import Phaser from 'phaser';
import { DebugSessionLogger } from './DebugSessionLogger';
import { SoundManager } from './SoundManager';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { BloodDaggersWeapon } from '../entities/weapons/BloodDaggersWeapon';
import { AbyssalChainsWeapon } from '../entities/weapons/AbyssalChainsWeapon';
import { InfernalMeteorWeapon } from '../entities/weapons/InfernalMeteorWeapon';
import { UpgradeScene } from '../scenes/UpgradeScene';

type SandboxTab = 'CHEATS' | 'SPAWNER' | 'WEAPONS' | 'UPGRADES' | 'LOGS';

export class DevSandboxPanel {
  private uiScene: Phaser.Scene;
  private gameScene: any;

  private topBarContainer!: Phaser.GameObjects.Container;
  private topStatusText!: Phaser.GameObjects.Text;
  private modalContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private hitboxGraphics!: Phaser.GameObjects.Graphics;
  private toastText?: Phaser.GameObjects.Text;

  public isOpen: boolean = false;
  private activeTab: SandboxTab = 'CHEATS';
  private tabButtons: { tab: SandboxTab; bg: Phaser.GameObjects.Graphics; txt: Phaser.GameObjects.Text; x: number; w: number }[] = [];

  // Referência para atualização dinâmica na aba de Logs
  private liveLogText?: Phaser.GameObjects.Text;
  private liveTelemetryText?: Phaser.GameObjects.Text;
  private refreshTimer: number = 0;

  private readonly pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

  constructor(uiScene: Phaser.Scene, gameScene: any) {
    this.uiScene = uiScene;
    this.gameScene = gameScene;

    // Camada gráfica no mundo do GameScene para desenhar Hitboxes reais quando ativado
    this.hitboxGraphics = this.gameScene.add.graphics();
    this.hitboxGraphics.setDepth(999);

    this.createTopQuickBar();
    this.createMainModal();
    this.setupKeyboardShortcuts();

    // Se entrou diretamente no MODO DE TESTE, exibe um aviso amigável
    if (this.gameScene.gameMode === 'sandbox') {
      this.showToast('MODO DE TESTE ATIVO! PRESSIONE [F1] OU CLIQUE NO TOPO PARA ABRIR O PAINEL', '#00f5d4');
    }
  }

  private createTopQuickBar(): void {
    const { width } = this.uiScene.scale;
    this.topBarContainer = this.uiScene.add.container(width / 2, 29);
    this.topBarContainer.setDepth(3500);
    this.topBarContainer.setVisible(this.gameScene.gameMode === 'sandbox');

    // Barra compacta no topo central
    const barW = 580;
    const barH = 26;
    const bg = this.uiScene.add.graphics();
    bg.fillStyle(0x090d16, 0.92);
    bg.fillRoundedRect(-barW / 2, -barH / 2, barW, barH, 6);
    bg.lineStyle(1.5, 0x00f5d4, 0.85);
    bg.strokeRoundedRect(-barW / 2, -barH / 2, barW, barH, 6);
    this.topBarContainer.add(bg);

    // Botão Esquerdo: Abrir/Fechar Painel (F1)
    const toggleBtn = this.uiScene.add.text(-barW / 2 + 12, 0, '[F1] PAINEL DE TESTE', {
      fontFamily: this.pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#00f5d4'
    }).setOrigin(0, 0.5);
    toggleBtn.setInteractive({ useHandCursor: true });
    toggleBtn.on('pointerover', () => toggleBtn.setColor('#ffffff'));
    toggleBtn.on('pointerout', () => toggleBtn.setColor('#00f5d4'));
    toggleBtn.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      this.togglePanel();
    });
    this.topBarContainer.add(toggleBtn);

    // Status central ao vivo (FPS, Inimigos, GodMode)
    this.topStatusText = this.uiScene.add.text(10, 0, 'FPS: 60 | INIMIGOS: 0 | GOD: ON', {
      fontFamily: this.pixelFont,
      fontSize: '8px',
      color: '#e2e8f0'
    }).setOrigin(0.5, 0.5);
    this.topBarContainer.add(this.topStatusText);

    // Botão Direito Rápido: Copiar Log p/ IA
    const copyQuickBtn = this.uiScene.add.text(barW / 2 - 12, 0, '[COPIAR LOG IA]', {
      fontFamily: this.pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffe600'
    }).setOrigin(1, 0.5);
    copyQuickBtn.setInteractive({ useHandCursor: true });
    copyQuickBtn.on('pointerover', () => copyQuickBtn.setColor('#ffffff'));
    copyQuickBtn.on('pointerout', () => copyQuickBtn.setColor('#ffe600'));
    copyQuickBtn.on('pointerdown', async () => {
      SoundManager.getInstance().playMenuClick();
      const ok = await DebugSessionLogger.getInstance().copyReportToClipboard(this.gameScene);
      this.showToast(
        ok ? 'RELATÓRIO COPIADO! COLE NO CHAT DA IA' : 'FALHA AO COPIAR LOG',
        ok ? '#06d6a0' : '#ef233c'
      );
    });
    this.topBarContainer.add(copyQuickBtn);
  }

  private createMainModal(): void {
    const { width, height } = this.uiScene.scale;
    this.modalContainer = this.uiScene.add.container(0, 0);
    this.modalContainer.setDepth(3600);
    this.modalContainer.setVisible(false);

    const panelW = 920;
    const panelH = 540;
    const px = width / 2 - panelW / 2;
    const py = height / 2 - panelH / 2 + 10;

    // Fundo escurecido ao redor
    const backdrop = this.uiScene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    backdrop.setInteractive();
    this.modalContainer.add(backdrop);

    // Moldura Principal do Console Sandbox
    const panelBg = this.uiScene.add.graphics();
    panelBg.fillStyle(0x0b0f19, 0.97);
    panelBg.fillRoundedRect(px, py, panelW, panelH, 10);
    panelBg.lineStyle(2, 0x00f5d4, 0.95);
    panelBg.strokeRoundedRect(px, py, panelW, panelH, 10);
    panelBg.lineStyle(1, 0x1e293b, 1);
    panelBg.strokeRoundedRect(px + 4, py + 4, panelW - 8, panelH - 8, 8);
    this.modalContainer.add(panelBg);

    // Cabeçalho do Painel
    const headerTitle = this.uiScene.add.text(
      px + 20,
      py + 22,
      'SANDBOX & DEBUG CONSOLE // MODO DE TESTE',
      {
        fontFamily: this.pixelFont,
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#00f5d4'
      }
    ).setOrigin(0, 0.5);
    this.modalContainer.add(headerTitle);

    // Botão Fechar [X]
    const closeBtn = this.uiScene.add.text(px + panelW - 20, py + 22, '[FECHAR / F1]', {
      fontFamily: this.pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ff4d6d'
    }).setOrigin(1, 0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff4d6d'));
    closeBtn.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      this.togglePanel(false);
    });
    this.modalContainer.add(closeBtn);

    // Barra de Abas (5 Tabs)
    const tabs: { id: SandboxTab; label: string }[] = [
      { id: 'CHEATS', label: '1. HEROÍNA & CHEATS' },
      { id: 'SPAWNER', label: '2. HORDAS & BOSS' },
      { id: 'WEAPONS', label: '3. ARMAS & EVOLUÇÕES' },
      { id: 'UPGRADES', label: '4. BÊNÇÃOS & ITENS' },
      { id: 'LOGS', label: '5. LOGS & EXPORTAR IA' }
    ];

    const tabY = py + 56;
    const tabSpacing = 8;
    const totalTabW = panelW - 40;
    const singleTabW = Math.floor((totalTabW - tabSpacing * (tabs.length - 1)) / tabs.length);

    this.tabButtons = [];
    tabs.forEach((t, idx) => {
      const tx = px + 20 + idx * (singleTabW + tabSpacing);
      const tabBg = this.uiScene.add.graphics();
      const tabTxt = this.uiScene.add.text(tx + singleTabW / 2, tabY + 15, t.label, {
        fontFamily: this.pixelFont,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hitZone = this.uiScene.add.zone(tx + singleTabW / 2, tabY + 15, singleTabW, 30);
      hitZone.setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        SoundManager.getInstance().playMenuClick();
        this.activeTab = t.id;
        this.refreshTabVisuals(tabY, 30);
        this.renderActiveTabContent(px + 20, py + 100, panelW - 40, panelH - 115);
      });

      this.modalContainer.add(tabBg);
      this.modalContainer.add(tabTxt);
      this.modalContainer.add(hitZone);
      this.tabButtons.push({ tab: t.id, bg: tabBg, txt: tabTxt, x: tx, w: singleTabW });
    });

    this.contentContainer = this.uiScene.add.container(0, 0);
    this.modalContainer.add(this.contentContainer);

    this.refreshTabVisuals(tabY, 30);
  }

  private refreshTabVisuals(tabY: number, tabH: number): void {
    for (const tb of this.tabButtons) {
      const isSelected = tb.tab === this.activeTab;
      tb.bg.clear();
      tb.bg.fillStyle(isSelected ? 0x00f5d4 : 0x162032, isSelected ? 0.22 : 0.9);
      tb.bg.fillRoundedRect(tb.x, tabY, tb.w, tabH, 5);
      tb.bg.lineStyle(isSelected ? 2 : 1, isSelected ? 0x00f5d4 : 0x334155, 1);
      tb.bg.strokeRoundedRect(tb.x, tabY, tb.w, tabH, 5);
      tb.txt.setColor(isSelected ? '#00f5d4' : '#94a3b8');
    }
  }

  private setupKeyboardShortcuts(): void {
    const kb = this.uiScene.input.keyboard;
    if (!kb) return;

    kb.on('keydown-F1', () => {
      this.togglePanel();
    });
  }

  public togglePanel(forceState?: boolean): void {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    this.modalContainer.setVisible(this.isOpen);

    if (this.isOpen) {
      const { width, height } = this.uiScene.scale;
      const panelW = 920;
      const panelH = 540;
      const px = width / 2 - panelW / 2;
      const py = height / 2 - panelH / 2 + 10;
      this.renderActiveTabContent(px + 20, py + 100, panelW - 40, panelH - 115);
    }
  }

  private renderActiveTabContent(x: number, y: number, w: number, h: number): void {
    this.contentContainer.removeAll(true);
    this.liveLogText = undefined;
    this.liveTelemetryText = undefined;

    switch (this.activeTab) {
      case 'CHEATS':
        this.renderCheatsTab(x, y, w, h);
        break;
      case 'SPAWNER':
        this.renderSpawnerTab(x, y, w, h);
        break;
      case 'WEAPONS':
        this.renderWeaponsTab(x, y, w, h);
        break;
      case 'UPGRADES':
        this.renderUpgradesTab(x, y, w, h);
        break;
      case 'LOGS':
        this.renderLogsTab(x, y, w, h);
        break;
    }
  }

  // ===========================================================================
  // ABA 1: HEROÍNA & CHEATS
  // ===========================================================================
  private renderCheatsTab(x: number, y: number, w: number, _h: number): void {
    const gs = this.gameScene;
    const p = gs.player;
    const colW = Math.floor((w - 24) / 2);

    this.addSectionTitle(x, y, 'MODIFICADORES DE INVENCIBILIDADE & MOTOR');

    // Coluna 1: Toggles de Trapaça
    const toggles = [
      {
        label: `VIDA INFINITA (GOD MODE): ${gs.sandboxGodMode ? 'ATIVADO' : 'DESATIVADO'}`,
        active: Boolean(gs.sandboxGodMode),
        onClick: () => {
          gs.sandboxGodMode = !gs.sandboxGodMode;
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `God Mode alterado para: ${gs.sandboxGodMode}`);
          this.reRenderCurrentTab();
        }
      },
      {
        label: `ULTIMATE INFINITA (SEMPRE 100%): ${gs.sandboxInfiniteUlt ? 'ATIVADO' : 'DESATIVADO'}`,
        active: Boolean(gs.sandboxInfiniteUlt),
        onClick: () => {
          gs.sandboxInfiniteUlt = !gs.sandboxInfiniteUlt;
          if (gs.sandboxInfiniteUlt && p) {
            p.ultimateCharge = p.maxUltimateCharge;
          }
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Ultimate Infinita alterada para: ${gs.sandboxInfiniteUlt}`);
          this.reRenderCurrentTab();
        }
      },
      {
        label: `ESTAMINA INFINITA (SPRINT LIVRE): ${gs.sandboxInfiniteStamina ? 'ATIVADO' : 'DESATIVADO'}`,
        active: Boolean(gs.sandboxInfiniteStamina),
        onClick: () => {
          gs.sandboxInfiniteStamina = !gs.sandboxInfiniteStamina;
          if (gs.sandboxInfiniteStamina && p) {
            p.currentStamina = p.maxStamina;
            p.isStaminaExhausted = false;
          }
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Estamina Infinita alterada para: ${gs.sandboxInfiniteStamina}`);
          this.reRenderCurrentTab();
        }
      },
      {
        label: `AUTO-SPAWN CONTÍNUO DE HORDAS: ${gs.sandboxAutoSpawn ? 'ATIVADO' : 'DESATIVADO'}`,
        active: Boolean(gs.sandboxAutoSpawn),
        onClick: () => {
          gs.sandboxAutoSpawn = !gs.sandboxAutoSpawn;
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Auto-Spawn de Hordas alterado para: ${gs.sandboxAutoSpawn}`);
          this.reRenderCurrentTab();
        }
      },
      {
        label: `EXIBIR HITBOXES DE COLISÃO: ${gs.sandboxShowHitboxes ? 'ATIVADO' : 'DESATIVADO'}`,
        active: Boolean(gs.sandboxShowHitboxes),
        onClick: () => {
          gs.sandboxShowHitboxes = !gs.sandboxShowHitboxes;
          if (!gs.sandboxShowHitboxes) {
            this.hitboxGraphics.clear();
          }
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Visualizador de Hitboxes alterado para: ${gs.sandboxShowHitboxes}`);
          this.reRenderCurrentTab();
        }
      }
    ];

    toggles.forEach((t, i) => {
      this.createActionButton(
        x,
        y + 30 + i * 48,
        colW,
        38,
        t.label,
        t.active ? 0x065f46 : 0x1e293b,
        t.active ? 0x10b981 : 0x475569,
        t.active ? '#a7f3d0' : '#cbd5e1',
        t.onClick
      );
    });

    // Coluna 2: Ações Instantâneas da Nixy e Controle de Tempo
    const col2X = x + colW + 24;
    this.addSectionTitle(col2X, y, 'AÇÕES INSTANTÂNEAS & VELOCIDADE DO JOGO');

    this.createActionButton(
      col2X,
      y + 30,
      colW,
      38,
      'CURAR 100% DA VIDA & ESTAMINA AGORA',
      0x1e3a8a,
      0x3b82f6,
      '#bfdbfe',
      () => {
        if (p) {
          p.currentHp = p.maxHp;
          p.currentStamina = p.maxStamina;
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Nixy curada em 100% via Sandbox.');
          this.showToast('VIDA E ESTAMINA 100% RESTAURADAS!', '#38bdf8');
        }
      }
    );

    this.createActionButton(
      col2X,
      y + 78,
      colW,
      38,
      'SUBIR +1 NÍVEL (ABRIR TELA DE LEVEL UP)',
      0x78350f,
      0xf59e0b,
      '#fde68a',
      () => {
        if (p) {
          this.togglePanel(false);
          p.gainXp(p.xpToNextLevel - p.currentXp);
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Level Up manual acionado (Nível ${p.currentLevel})`);
        }
      }
    );

    this.createActionButton(
      col2X,
      y + 126,
      colW,
      38,
      'DISPARAR HABILIDADE SUPREMA (ULTIMATE)',
      0x4c1d95,
      0x8b5cf6,
      '#ddd6fe',
      () => {
        if (p) {
          p.ultimateCharge = p.maxUltimateCharge;
          this.togglePanel(false);
          gs.triggerUltimate();
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Ultimate disparada via Sandbox.');
        }
      }
    );

    this.createActionButton(
      col2X,
      y + 174,
      colW,
      38,
      'SIMULAR DANO NA NIXY (-25 HP / TESTAR HURT)',
      0x7f1d1d,
      0xef4444,
      '#fecaca',
      () => {
        if (p) {
          p.takeDamage(25, true);
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Simulação de -25 HP na Nixy (HP atual: ${p.currentHp}/${p.maxHp})`);
          this.showToast(`DANO SIMULADO: HP ${Math.ceil(p.currentHp)}/${p.maxHp}`, '#f87171');
        }
      }
    );

    // Controles de TimeScale (0.5x, 1x, 2x)
    const curScale = gs.time?.timeScale ?? 1;
    const scales = [0.5, 1.0, 2.0];
    const scaleBtnW = Math.floor((colW - 16) / 3);
    scales.forEach((sc, idx) => {
      const active = Math.abs(curScale - sc) < 0.05;
      this.createActionButton(
        col2X + idx * (scaleBtnW + 8),
        y + 222,
        scaleBtnW,
        38,
        `VELOCIDADE ${sc}x`,
        active ? 0x065f46 : 0x1e293b,
        active ? 0x00f5d4 : 0x475569,
        active ? '#00f5d4' : '#94a3b8',
        () => {
          gs.time.timeScale = sc;
          gs.physics.world.timeScale = 1 / sc;
          DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', `Velocidade do Jogo (TimeScale) alterada para ${sc}x`);
          this.reRenderCurrentTab();
        }
      );
    });

    // Rodapé informativo de status da Nixy
    if (p) {
      const statsInfo = this.uiScene.add.text(
        x,
        y + 290,
        [
          `STATUS ATUAL DA NIXY:`,
          `Nível: ${p.currentLevel}  |  HP: ${Math.ceil(p.currentHp)}/${p.maxHp}  |  Estamina: ${Math.round(p.currentStamina)}/${p.maxStamina}`,
          `Dano Bônus: +${p.bonusDamagePercent}%  |  Velocidade: +${p.bonusSpeedPercent}%  |  Tiros Extras: +${p.extraProjectiles}  |  Perfuração: +${p.extraPierce}`,
          `Regen Sombria: ${p.hpRegenPerSec.toFixed(1)} HP/s  |  Dreno Vital: ${p.lifeStealPerHit.toFixed(1)} HP/hit  |  Rerolls: ${p.rerollsRemaining}`
        ].join('\n'),
        {
          fontFamily: this.pixelFont,
          fontSize: '9px',
          color: '#94a3b8',
          lineSpacing: 6
        }
      );
      this.contentContainer.add(statsInfo);
    }
  }

  // ===========================================================================
  // ABA 2: HORDAS, MONSTROS & BOSS
  // ===========================================================================
  private renderSpawnerTab(x: number, y: number, w: number, _h: number): void {
    const gs = this.gameScene;
    const colW = Math.floor((w - 24) / 2);

    this.addSectionTitle(x, y, 'INVOCAR HORDAS DE MONSTros AO REDOR');

    const mobButtons = [
      {
        label: 'SPAWNAR +10 CÃES ZUMBIS',
        color: 0x1e293b,
        border: 0x38bdf8,
        action: () => {
          gs.sandboxSpawnHorde('dog', 10);
          this.showToast('+10 CÃES ZUMBIS INVOCADOS!', '#38bdf8');
        }
      },
      {
        label: 'SPAWNAR +3 CÃES ALFA ELITE',
        color: 0x3b0764,
        border: 0xa855f7,
        action: () => {
          gs.sandboxSpawnHorde('elite_dog', 3);
          this.showToast('+3 CÃES ALFA ELITE INVOCADOS!', '#c084fc');
        }
      },
      {
        label: 'SPAWNAR +15 MORCEGOS DE SANGUE',
        color: 0x450a0a,
        border: 0xf87171,
        action: () => {
          gs.sandboxSpawnHorde('bat', 15);
          this.showToast('+15 MORCEGOS DE SANGUE INVOCADOS!', '#f87171');
        }
      },
      {
        label: 'SPAWNAR +5 SKULL SLIMES (EXPLOSIVOS)',
        color: 0x14532d,
        border: 0x4ade80,
        action: () => {
          gs.sandboxSpawnHorde('slime', 5);
          this.showToast('+5 SKULL SLIMES INVOCADOS!', '#4ade80');
        }
      },
      {
        label: 'INVOCAR MINI-BOSS: TITÃ CERBERUS',
        color: 0x7c2d12,
        border: 0xfb923c,
        action: () => {
          gs.sandboxSpawnHorde('titan_cerberus', 1);
          this.showToast('MINI-BOSS TITÃ CERBERUS INVOCADO!', '#fb923c');
        }
      },
      {
        label: 'INVOCAR MINI-BOSS: MATRIARCA SUCCUBUS',
        color: 0x701a75,
        border: 0xe879f9,
        action: () => {
          gs.sandboxSpawnHorde('matriarch', 1);
          this.showToast('MINI-BOSS MATRIARCA SUCCUBUS INVOCADA!', '#e879f9');
        }
      }
    ];

    mobButtons.forEach((b, i) => {
      this.createActionButton(
        x,
        y + 30 + i * 48,
        colW,
        38,
        b.label,
        b.color,
        b.border,
        '#ffffff',
        b.action
      );
    });

    // Coluna 2: Controle de Boss e Limpeza da Arena
    const col2X = x + colW + 24;
    this.addSectionTitle(col2X, y, 'CONTROLE DE CHEFE (BOSS) & LIMPEZA DE MAPA');

    this.createActionButton(
      col2X,
      y + 30,
      colW,
      44,
      'INICIAR LUTA DA BOSS SUCCUBUS (DIRETO)',
      0x881337,
      0xf43f5e,
      '#ffe4e6',
      () => {
        this.togglePanel(false);
        gs.sandboxSpawnBoss(false);
        this.showToast('BOSS SUCCUBUS IMPERIAL INVOCADA!', '#fb7185');
      }
    );

    this.createActionButton(
      col2X,
      y + 84,
      colW,
      44,
      'INICIAR BOSS SUCCUBUS (COM DIÁLOGO DE INTRO)',
      0x581c87,
      0xc084fc,
      '#f3e8ff',
      () => {
        this.togglePanel(false);
        gs.sandboxSpawnBoss(true);
      }
    );

    this.createActionButton(
      col2X,
      y + 138,
      colW,
      44,
      'REMOVER / DERROTAR BOSS ATUAL (RESTAURAR BGM)',
      0x1e293b,
      0x94a3b8,
      '#e2e8f0',
      () => {
        gs.sandboxRemoveBoss();
        this.showToast('BOSS REMOVIDA E MÚSICA DE BATALHA RESTAURADA!', '#38bdf8');
      }
    );

    this.createActionButton(
      col2X,
      y + 204,
      colW,
      44,
      'MATAR TODOS OS MONSTROS (GERAR DROPS/XP)',
      0x78350f,
      0xfbbf24,
      '#fef3c7',
      () => {
        const count = gs.sandboxClearEnemies(true);
        this.showToast(`${count} MONSTROS ELIMINADOS COM DROP!`, '#fbbf24');
      }
    );

    this.createActionButton(
      col2X,
      y + 258,
      colW,
      44,
      'LIMPAR HORDAS INSTANTANEAMENTE (SEM DROPS)',
      0x064e3b,
      0x34d399,
      '#d1fae5',
      () => {
        const count = gs.sandboxClearEnemies(false);
        this.showToast(`${count} MONSTROS REMOVIDOS DA ARENA!`, '#34d399');
      }
    );
  }

  // ===========================================================================
  // ABA 3: ARMAS & EVOLUÇÕES SUPREMAS
  // ===========================================================================
  private renderWeaponsTab(x: number, y: number, w: number, _h: number): void {
    const gs = this.gameScene;
    const p = gs.player;
    const weapons: any[] = gs.weapons || [];

    this.addSectionTitle(x, y, 'GERENCIADOR COMPLETO DE ARMAS ATIVAS & EVOLUÇÕES SUPREMAS');

    const weaponConfigs = [
      {
        title: 'DISPARO DE ALMAS',
        evoTitle: 'RAIO DO APOCALIPSE',
        instance: weapons.find((wp) => wp instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined,
        onAddOrUpgrade: () => {
          let wp = weapons.find((item) => item instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined;
          if (!wp) {
            wp = new SoulBoltWeapon(gs, p);
            weapons.push(wp);
            gs.registerSoulBoltOverlap(wp);
          } else {
            p.extraProjectiles += 1;
          }
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Disparo de Almas equipado/melhorado via Sandbox');
        },
        onMaxOrEvolve: () => {
          let wp = weapons.find((item) => item instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined;
          if (!wp) {
            wp = new SoulBoltWeapon(gs, p);
            weapons.push(wp);
            gs.registerSoulBoltOverlap(wp);
          }
          wp.evolve();
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Disparo de Almas evoluído para RAIO DO APOCALIPSE via Sandbox');
        },
        onRemove: () => {
          gs.sandboxRemoveWeapon(SoulBoltWeapon);
        },
        getStatus: (wp?: SoulBoltWeapon) => {
          if (!wp) return 'NÃO EQUIPADA';
          return wp.isEvolved ? 'EVOLUÍDA: RAIO DO APOCALIPSE' : `EQUIPADA (+${p.extraProjectiles} Tiros)`;
        }
      },
      {
        title: 'LÂMINAS ORBITAIS',
        evoTitle: 'CEIFADORA DO VAZIO',
        instance: weapons.find((wp) => wp instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined,
        onAddOrUpgrade: () => {
          let wp = weapons.find((item) => item instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined;
          if (!wp) {
            weapons.push(new VoidScythesWeapon(gs, p));
          } else {
            wp.addBlade();
          }
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Lâminas Orbitais equipada/melhorada via Sandbox');
        },
        onMaxOrEvolve: () => {
          let wp = weapons.find((item) => item instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined;
          if (!wp) {
            wp = new VoidScythesWeapon(gs, p);
            weapons.push(wp);
          }
          wp.evolve();
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Lâminas Orbitais evoluída para CEIFADORA DO VAZIO via Sandbox');
        },
        onRemove: () => {
          gs.sandboxRemoveWeapon(VoidScythesWeapon);
        },
        getStatus: (wp?: VoidScythesWeapon) => {
          if (!wp) return 'NÃO EQUIPADA';
          return wp.isEvolved ? 'EVOLUÍDA: CEIFADORA DO VAZIO' : `NÍVEL ${wp.getBladeCount()}/6 FOICES`;
        }
      },
      {
        title: 'CHAMAS DO PURGATÓRIO',
        evoTitle: 'SUPERNOVA ABISSAL',
        instance: weapons.find((wp) => wp instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined,
        onAddOrUpgrade: () => {
          let wp = weapons.find((item) => item instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined;
          if (!wp) {
            weapons.push(new HellfireAuraWeapon(gs, p));
          } else {
            wp.upgrade();
          }
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Chamas do Purgatório equipada/melhorada via Sandbox');
        },
        onMaxOrEvolve: () => {
          let wp = weapons.find((item) => item instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined;
          if (!wp) {
            wp = new HellfireAuraWeapon(gs, p);
            weapons.push(wp);
          }
          while (!wp.isMaxLevel()) wp.upgrade();
          wp.evolve();
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Chamas do Purgatório evoluída para SUPERNOVA ABISSAL via Sandbox');
        },
        onRemove: () => {
          gs.sandboxRemoveWeapon(HellfireAuraWeapon);
        },
        getStatus: (wp?: HellfireAuraWeapon) => {
          if (!wp) return 'NÃO EQUIPADA';
          return wp.isEvolved ? 'EVOLUÍDA: SUPERNOVA ABISSAL' : `NÍVEL ${wp.getLevel()}/5`;
        }
      },
      {
        title: 'ADAGAS DE SANGUE',
        evoTitle: 'MÁXIMO (NÍV 5)',
        instance: weapons.find((wp) => wp instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined,
        onAddOrUpgrade: () => {
          let wp = weapons.find((item) => item instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined;
          if (!wp) {
            weapons.push(new BloodDaggersWeapon(gs, p));
          } else {
            wp.upgrade();
          }
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Adagas de Sangue equipada/melhorada via Sandbox');
        },
        onMaxOrEvolve: () => {
          let wp = weapons.find((item) => item instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined;
          if (!wp) {
            wp = new BloodDaggersWeapon(gs, p);
            weapons.push(wp);
          }
          while (!wp.isMaxLevel()) wp.upgrade();
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Adagas de Sangue maximizada (Nív 5) via Sandbox');
        },
        onRemove: () => {
          gs.sandboxRemoveWeapon(BloodDaggersWeapon);
        },
        getStatus: (wp?: BloodDaggersWeapon) => {
          if (!wp) return 'NÃO EQUIPADA';
          return `NÍVEL ${wp.getLevel()}/5 (${wp.projectileCount} Adagas)`;
        }
      },
      {
        title: 'CADEIAS ABISSAIS',
        evoTitle: 'MÁXIMO (NÍV 5)',
        instance: weapons.find((wp) => wp instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined,
        onAddOrUpgrade: () => {
          let wp = weapons.find((item) => item instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined;
          if (!wp) {
            weapons.push(new AbyssalChainsWeapon(gs, p));
          } else {
            wp.upgrade();
          }
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Cadeias Abissais equipada/melhorada via Sandbox');
        },
        onMaxOrEvolve: () => {
          let wp = weapons.find((item) => item instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined;
          if (!wp) {
            wp = new AbyssalChainsWeapon(gs, p);
            weapons.push(wp);
          }
          while (!wp.isMaxLevel()) wp.upgrade();
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Cadeias Abissais maximizada (Nív 5) via Sandbox');
        },
        onRemove: () => {
          gs.sandboxRemoveWeapon(AbyssalChainsWeapon);
        },
        getStatus: (wp?: AbyssalChainsWeapon) => {
          if (!wp) return 'NÃO EQUIPADA';
          return `NÍVEL ${wp.getLevel()}/5`;
        }
      },
      {
        title: 'METEORO INFERNAL',
        evoTitle: 'MÁXIMO (NÍV 5)',
        instance: weapons.find((wp) => wp instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined,
        onAddOrUpgrade: () => {
          let wp = weapons.find((item) => item instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined;
          if (!wp) {
            weapons.push(new InfernalMeteorWeapon(gs, p));
          } else {
            wp.upgrade();
          }
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Meteoro Infernal equipado/melhorado via Sandbox');
        },
        onMaxOrEvolve: () => {
          let wp = weapons.find((item) => item instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined;
          if (!wp) {
            wp = new InfernalMeteorWeapon(gs, p);
            weapons.push(wp);
          }
          while (!wp.isMaxLevel()) wp.upgrade();
          DebugSessionLogger.getInstance().log('WEAPON', 'INFO', 'Meteoro Infernal maximizado (Nív 5) via Sandbox');
        },
        onRemove: () => {
          gs.sandboxRemoveWeapon(InfernalMeteorWeapon);
        },
        getStatus: (wp?: InfernalMeteorWeapon) => {
          if (!wp) return 'NÃO EQUIPADA';
          return `NÍVEL ${wp.getLevel()}/5`;
        }
      }
    ];

    weaponConfigs.forEach((wc, idx) => {
      const rowY = y + 28 + idx * 52;
      const hasWeapon = Boolean(wc.instance);

      // Linha de fundo
      const rowBg = this.uiScene.add.graphics();
      rowBg.fillStyle(hasWeapon ? 0x111c2d : 0x0f1420, 0.9);
      rowBg.fillRoundedRect(x, rowY, w, 44, 6);
      rowBg.lineStyle(1, hasWeapon ? 0x38bdf8 : 0x334155, 0.8);
      rowBg.strokeRoundedRect(x, rowY, w, 44, 6);
      this.contentContainer.add(rowBg);

      // Nome e Status
      const titleTxt = this.uiScene.add.text(x + 14, rowY + 14, wc.title, {
        fontFamily: this.pixelFont,
        fontSize: '10px',
        fontStyle: 'bold',
        color: hasWeapon ? '#ffffff' : '#94a3b8'
      }).setOrigin(0, 0.5);
      this.contentContainer.add(titleTxt);

      const statusTxt = this.uiScene.add.text(x + 14, rowY + 31, wc.getStatus(wc.instance as any), {
        fontFamily: this.pixelFont,
        fontSize: '8px',
        color: (wc.instance as any)?.isEvolved ? '#ffe600' : hasWeapon ? '#00f5d4' : '#64748b'
      }).setOrigin(0, 0.5);
      this.contentContainer.add(statusTxt);

      // Botões à direita: [+NÍVEL / EQUIPAR], [EVOLUIR / MAX], [REMOVER]
      this.createActionButton(
        x + w - 455,
        rowY + 6,
        145,
        32,
        hasWeapon ? '+1 NÍVEL' : 'EQUIPAR',
        0x065f46,
        0x10b981,
        '#d1fae5',
        () => {
          wc.onAddOrUpgrade();
          this.reRenderCurrentTab();
        }
      );

      this.createActionButton(
        x + w - 300,
        rowY + 6,
        180,
        32,
        wc.evoTitle,
        0x78350f,
        0xf59e0b,
        '#fef08a',
        () => {
          wc.onMaxOrEvolve();
          this.reRenderCurrentTab();
        }
      );

      this.createActionButton(
        x + w - 110,
        rowY + 6,
        100,
        32,
        'REMOVER',
        0x450a0a,
        0xef4444,
        '#fecaca',
        () => {
          wc.onRemove();
          this.reRenderCurrentTab();
        }
      );
    });

    // Botões Globais no rodapé da aba
    const footerY = y + 350;
    this.createActionButton(
      x,
      footerY,
      Math.floor(w / 2 - 10),
      40,
      'EQUIPAR & EVOLUIR TODAS AS 6 ARMAS',
      0x78350f,
      0xffe600,
      '#ffe600',
      () => {
        weaponConfigs.forEach((wc) => wc.onMaxOrEvolve());
        this.showToast('TODAS AS ARMAS EQUIPADAS NO PODER SUPREMO!', '#ffe600');
        this.reRenderCurrentTab();
      }
    );

    this.createActionButton(
      x + Math.floor(w / 2 + 10),
      footerY,
      Math.floor(w / 2 - 10),
      40,
      'REMOVER TODAS AS ARMAS (DESARMAR)',
      0x450a0a,
      0xef4444,
      '#fecaca',
      () => {
        weaponConfigs.forEach((wc) => wc.onRemove());
        this.showToast('TODAS AS ARMAS FORAM REMOVIDAS!', '#f87171');
        this.reRenderCurrentTab();
      }
    );
  }

  // ===========================================================================
  // ABA 4: BÊNÇÃOS PASSIVAS & ITENS DE MAPA
  // ===========================================================================
  private renderUpgradesTab(x: number, y: number, w: number, _h: number): void {
    const gs = this.gameScene;
    const p = gs.player;
    const colW = Math.floor((w - 24) / 2);

    this.addSectionTitle(x, y, 'AJUSTAR BÊNÇÃOS PASSIVAS (- / +)');

    const passives = [
      {
        name: 'ALMA EXTRA (+TIROS)',
        val: `+${p.extraProjectiles}`,
        dec: () => { p.extraProjectiles = Math.max(0, p.extraProjectiles - 1); },
        inc: () => { p.extraProjectiles += 1; }
      },
      {
        name: 'PERFURAÇÃO MÍSTICA',
        val: `+${p.extraPierce}`,
        dec: () => { p.extraPierce = Math.max(0, p.extraPierce - 1); },
        inc: () => { p.extraPierce += 1; }
      },
      {
        name: 'FÚRIA INFERNAL (DANO)',
        val: `+${p.bonusDamagePercent}%`,
        dec: () => { p.bonusDamagePercent = Math.max(0, p.bonusDamagePercent - 25); },
        inc: () => { p.bonusDamagePercent += 25; }
      },
      {
        name: 'CELERIDADE (VELOCIDADE)',
        val: `+${p.bonusSpeedPercent}%`,
        dec: () => { p.bonusSpeedPercent = Math.max(0, p.bonusSpeedPercent - 15); },
        inc: () => { p.bonusSpeedPercent += 15; }
      },
      {
        name: 'PULMÕES (ESTAMINA MÁX)',
        val: `${p.maxStamina}`,
        dec: () => {
          p.maxStamina = Math.max(100, p.maxStamina - 30);
          p.currentStamina = Math.min(p.currentStamina, p.maxStamina);
        },
        inc: () => {
          p.maxStamina += 30;
          p.currentStamina = p.maxStamina;
        }
      },
      {
        name: 'ÍMÃ DE ALMAS (COLETA)',
        val: `+${p.bonusPickupRadiusPercent}%`,
        dec: () => { p.bonusPickupRadiusPercent = Math.max(0, p.bonusPickupRadiusPercent - 50); },
        inc: () => { p.bonusPickupRadiusPercent += 50; }
      },
      {
        name: 'VITALIDADE (HP MÁXIMO)',
        val: `${p.maxHp} HP`,
        dec: () => {
          p.maxHp = Math.max(100, p.maxHp - 25);
          p.currentHp = Math.min(p.currentHp, p.maxHp);
        },
        inc: () => {
          p.maxHp += 25;
          p.heal(25);
        }
      },
      {
        name: 'REGENERAÇÃO SOMBRIA',
        val: `${p.hpRegenPerSec.toFixed(1)}/s`,
        dec: () => { p.hpRegenPerSec = Math.max(0, Number((p.hpRegenPerSec - 0.2).toFixed(1))); },
        inc: () => { p.hpRegenPerSec = Number((p.hpRegenPerSec + 0.2).toFixed(1)); }
      },
      {
        name: 'DRENO VITAL (ROUBO/HIT)',
        val: `${p.lifeStealPerHit.toFixed(1)}`,
        dec: () => { p.lifeStealPerHit = Math.max(0, Number((p.lifeStealPerHit - 0.1).toFixed(1))); },
        inc: () => { p.lifeStealPerHit = Number((p.lifeStealPerHit + 0.1).toFixed(1)); }
      }
    ];

    passives.forEach((pas, i) => {
      const py = y + 26 + i * 36;
      const lbl = this.uiScene.add.text(x, py + 14, `${pas.name}: `, {
        fontFamily: this.pixelFont,
        fontSize: '8px',
        color: '#cbd5e1'
      }).setOrigin(0, 0.5);
      this.contentContainer.add(lbl);

      const valTxt = this.uiScene.add.text(x + colW - 108, py + 14, pas.val, {
        fontFamily: this.pixelFont,
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#00f5d4'
      }).setOrigin(1, 0.5);
      this.contentContainer.add(valTxt);

      this.createActionButton(x + colW - 96, py, 42, 28, '-', 0x450a0a, 0xef4444, '#ffffff', () => {
        pas.dec();
        DebugSessionLogger.getInstance().log('UPGRADE', 'INFO', `Bênção reduzida: ${pas.name}`);
        this.reRenderCurrentTab();
      });

      this.createActionButton(x + colW - 46, py, 42, 28, '+', 0x065f46, 0x10b981, '#ffffff', () => {
        pas.inc();
        DebugSessionLogger.getInstance().log('UPGRADE', 'INFO', `Bênção aumentada: ${pas.name}`);
        this.reRenderCurrentTab();
      });
    });

    this.createActionButton(
      x,
      y + 356,
      colW,
      34,
      'RESETAR TODAS AS BÊNÇÃOS PASSIVAS',
      0x450a0a,
      0xef4444,
      '#fecaca',
      () => {
        p.extraProjectiles = 0;
        p.extraPierce = 0;
        p.bonusDamagePercent = 0;
        p.bonusSpeedPercent = 0;
        p.maxStamina = 100;
        p.currentStamina = 100;
        p.bonusPickupRadiusPercent = 0;
        p.maxHp = 100;
        p.currentHp = 100;
        p.hpRegenPerSec = 0;
        p.lifeStealPerHit = 0;
        DebugSessionLogger.getInstance().log('UPGRADE', 'INFO', 'Todas as bênçãos passivas foram resetadas.');
        this.showToast('BÊNÇÃOS PASSIVAS RESETADAS!', '#f87171');
        this.reRenderCurrentTab();
      }
    );

    // Coluna 2: Spawnar Itens de Mapa Próximos à Nixy
    const col2X = x + colW + 24;
    this.addSectionTitle(col2X, y, 'SPAWNAR ITENS DE MAPA PRÓXIMOS À NIXY');

    const itemActions = [
      {
        label: 'SPAWNAR TAÇA DE VINHO (CURA 50% HP)',
        color: 0x4c0519,
        border: 0xf43f5e,
        action: () => {
          gs.spawnMapItem(p.x + 75, p.y, 'chalice');
          DebugSessionLogger.getInstance().log('ITEM', 'INFO', 'Taça de Vinho spawnada ao lado da Nixy.');
          this.showToast('TAÇA DE VINHO SPAWNADA AO LADO DA NIXY!', '#fb7185');
        }
      },
      {
        label: 'SPAWNAR ÍMÃ DE ALMAS (ATRAI TODO XP)',
        color: 0x1e3a8a,
        border: 0x38bdf8,
        action: () => {
          gs.spawnMapItem(p.x - 75, p.y, 'magnet');
          DebugSessionLogger.getInstance().log('ITEM', 'INFO', 'Ímã de Almas spawnado ao lado da Nixy.');
          this.showToast('ÍMÃ DE ALMAS SPAWNADO AO LADO DA NIXY!', '#38bdf8');
        }
      },
      {
        label: 'SPAWNAR BAÚ DO ABISMO NO CHÃO',
        color: 0x78350f,
        border: 0xfbbf24,
        action: () => {
          gs.spawnMapItem(p.x, p.y + 75, 'chest');
          DebugSessionLogger.getInstance().log('ITEM', 'INFO', 'Baú do Abismo spawnado ao lado da Nixy.');
          this.showToast('BAÚ DO ABISMO SPAWNADO AO LADO DA NIXY!', '#fbbf24');
        }
      },
      {
        label: 'ABRIR ROLETA DO BAÚ DIRETAMENTE AGORA',
        color: 0x713f12,
        border: 0xffe600,
        action: () => {
          this.togglePanel(false);
          const cards = UpgradeScene.getAvailableUpgrades(p, gs);
          (this.uiScene as any).showChestRoulette(cards, p, gs);
          DebugSessionLogger.getInstance().log('ITEM', 'INFO', 'Roleta do Baú aberta diretamente via Sandbox.');
        }
      },
      {
        label: 'CHUVA DE GEMAS DE XP (+20 GEMAS AO REDOR)',
        color: 0x064e3b,
        border: 0x10b981,
        action: () => {
          gs.sandboxSpawnGemShower(20);
          this.showToast('+20 GEMAS DE ALMA GERADAS AO REDOR!', '#34d399');
        }
      },
      {
        label: 'LIMPAR TODOS OS ITENS E GEMAS DO CHÃO',
        color: 0x1e293b,
        border: 0x64748b,
        action: () => {
          gs.sandboxClearItemsAndGems();
          this.showToast('ITENS E GEMAS DO MAPA REMOVIDOS!', '#94a3b8');
        }
      }
    ];

    itemActions.forEach((act, idx) => {
      this.createActionButton(
        col2X,
        y + 30 + idx * 52,
        colW,
        42,
        act.label,
        act.color,
        act.border,
        '#ffffff',
        act.action
      );
    });
  }

  // ===========================================================================
  // ABA 5: LOGS DE DEBUG & EXPORTAÇÃO PARA IA
  // ===========================================================================
  private renderLogsTab(x: number, y: number, w: number, _h: number): void {
    this.addSectionTitle(x, y, 'GRAVADOR DE VOO (FLIGHT RECORDER) & TELEMETRIA EM TEMPO REAL');

    // Caixa de Telemetria ao Vivo
    const teleBg = this.uiScene.add.graphics();
    teleBg.fillStyle(0x06101e, 0.95);
    teleBg.fillRoundedRect(x, y + 24, w, 66, 6);
    teleBg.lineStyle(1, 0x00f5d4, 0.6);
    teleBg.strokeRoundedRect(x, y + 24, w, 66, 6);
    this.contentContainer.add(teleBg);

    this.liveTelemetryText = this.uiScene.add.text(x + 12, y + 32, '', {
      fontFamily: this.pixelFont,
      fontSize: '9px',
      color: '#a7f3d0',
      lineSpacing: 5
    });
    this.contentContainer.add(this.liveTelemetryText);

    // Visor de Eventos Recentes da Sessão
    const logBoxY = y + 100;
    const logBoxH = 225;
    const logBg = this.uiScene.add.graphics();
    logBg.fillStyle(0x05070c, 0.96);
    logBg.fillRoundedRect(x, logBoxY, w, logBoxH, 6);
    logBg.lineStyle(1, 0x334155, 0.9);
    logBg.strokeRoundedRect(x, logBoxY, w, logBoxH, 6);
    this.contentContainer.add(logBg);

    this.liveLogText = this.uiScene.add.text(x + 12, logBoxY + 10, '', {
      fontFamily: this.pixelFont,
      fontSize: '8px',
      color: '#e2e8f0',
      lineSpacing: 5,
      wordWrap: { width: w - 24 }
    });
    this.contentContainer.add(this.liveLogText);

    this.refreshLiveLogDisplay();

    // Botões de Exportação
    const btnY = y + 338;
    const btnW1 = Math.floor(w * 0.48);
    const btnW2 = Math.floor(w * 0.28);
    const btnW3 = w - btnW1 - btnW2 - 20;

    this.createActionButton(
      x,
      btnY,
      btnW1,
      44,
      'COPIAR RELATÓRIO COMPLETO P/ IA (CLIPBOARD)',
      0x065f46,
      0x00f5d4,
      '#ffffff',
      async () => {
        const ok = await DebugSessionLogger.getInstance().copyReportToClipboard(this.gameScene);
        this.showToast(
          ok ? 'RELATÓRIO COPIADO! BASTA COLAR NO CHAT DA IA!' : 'ERRO AO COPIAR RELATÓRIO',
          ok ? '#00f5d4' : '#ef4444'
        );
        this.refreshLiveLogDisplay();
      }
    );

    this.createActionButton(
      x + btnW1 + 10,
      btnY,
      btnW2,
      44,
      'BAIXAR LOG (.JSON)',
      0x1e3a8a,
      0x38bdf8,
      '#bfdbfe',
      () => {
        DebugSessionLogger.getInstance().downloadJsonLog(this.gameScene);
        this.showToast('ARQUIVO .JSON DE DEBUG BAIXADO!', '#38bdf8');
        this.refreshLiveLogDisplay();
      }
    );

    this.createActionButton(
      x + btnW1 + btnW2 + 20,
      btnY,
      btnW3,
      44,
      'LIMPAR LOGS',
      0x450a0a,
      0xef4444,
      '#fecaca',
      () => {
        DebugSessionLogger.getInstance().clearLogs();
        this.refreshLiveLogDisplay();
      }
    );
  }

  private refreshLiveLogDisplay(): void {
    const logger = DebugSessionLogger.getInstance();
    const snap = logger.captureSnapshot(this.gameScene);

    if (this.liveTelemetryText && this.liveTelemetryText.active) {
      this.liveTelemetryText.setText([
        `FPS ATUAL: ${snap.fps} (Méd: ${snap.avgFps} | Mín: ${snap.minFps})   |   INIMIGOS ATIVOS: ${snap.enemiesActive}   |   GEMAS: ${snap.gemsActive}   |   PROJÉTEIS: ${snap.projectilesActive}`,
        `NIXY HP: ${snap.playerHp}   |   POSIÇÃO: ${snap.playerPos}   |   BOSS ATIVA: ${snap.bossActive ? 'SIM (' + snap.bossHp + ')' : 'NÃO'}`,
        `ARMAS (${snap.equippedWeapons.length}): ${snap.equippedWeapons.join(', ') || 'Nenhuma'}`
      ].join('\n'));
    }

    if (this.liveLogText && this.liveLogText.active) {
      const recent = logger.getRecentEntries(13);
      if (recent.length === 0) {
        this.liveLogText.setText('Nenhum evento registrado ainda.');
      } else {
        const lines = recent.map((e) => {
          const det = e.details ? ` ${JSON.stringify(e.details)}` : '';
          return `[+${e.elapsedSec}s] [${e.category}] ${e.message}${det}`;
        });
        this.liveLogText.setText(lines.join('\n'));
      }
    }
  }

  // ===========================================================================
  // LOOP DE ATUALIZAÇÃO EM TEMPO REAL (CHAMADO PELA UISCENE)
  // ===========================================================================
  public update(deltaMs: number): void {
    if (!this.gameScene) return;

    // 1. Amostragem de telemetria e detecção de anomalias
    DebugSessionLogger.getInstance().sampleTelemetry(this.gameScene);

    // 1.5 Ajuste dinâmico de posição da barra superior caso a Barra de Vida da Chefe esteja visível
    if (this.topBarContainer && this.topBarContainer.active) {
      const targetY = (this.gameScene.isBossFightActive && this.gameScene.bossInstance?.active) ? 56 : 29;
      if (this.topBarContainer.y !== targetY) {
        this.topBarContainer.setY(targetY);
      }
      if (this.isOpen && !this.topBarContainer.visible) {
        this.topBarContainer.setVisible(true);
      }
    }

    // 2. Atualiza pílula de status no topo a cada 250ms
    this.refreshTimer += deltaMs;
    if (this.refreshTimer >= 250) {
      this.refreshTimer = 0;
      const fps = Math.round(this.gameScene.game?.loop?.actualFps || 60);
      const enemies = this.gameScene.enemiesGroup ? this.gameScene.enemiesGroup.countActive() : 0;
      const god = this.gameScene.sandboxGodMode ? 'ON' : 'OFF';
      if (this.topStatusText && this.topStatusText.active) {
        this.topStatusText.setText(`FPS: ${fps} | INIMIGOS: ${enemies} | GOD: ${god}`);
      }
      if (this.isOpen && this.activeTab === 'LOGS') {
        this.refreshLiveLogDisplay();
      }
    }

    // 3. Desenho de Hitboxes Físicas se ativado
    if (this.gameScene.sandboxShowHitboxes) {
      this.renderHitboxes();
    }
  }

  private renderHitboxes(): void {
    this.hitboxGraphics.clear();
    const g = this.hitboxGraphics;
    const p = this.gameScene.player;

    // Hitbox da Nixy (Verde Brilhante)
    if (p && p.body) {
      const b = p.body as Phaser.Physics.Arcade.Body;
      g.lineStyle(1.5, 0x00ff66, 0.95);
      g.strokeRect(b.x, b.y, b.width, b.height);
      // Raio de coleta de gemas (Azul tracejado/fino)
      g.lineStyle(1, 0x38bdf8, 0.45);
      g.strokeCircle(p.x, p.y, p.effectivePickupRadius);
    }

    // Hitboxes dos Inimigos (Vermelho)
    if (this.gameScene.enemiesGroup) {
      g.lineStyle(1.2, 0xff2244, 0.9);
      const enemies = this.gameScene.enemiesGroup.getChildren();
      for (const e of enemies) {
        if (e.active && e.body) {
          const b = e.body as Phaser.Physics.Arcade.Body;
          g.strokeRect(b.x, b.y, b.width, b.height);
        }
      }
    }
  }

  // ===========================================================================
  // UTILITÁRIOS DE UI
  // ===========================================================================
  private addSectionTitle(x: number, y: number, text: string): void {
    const title = this.uiScene.add.text(x, y, text, {
      fontFamily: this.pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3d17a'
    });
    this.contentContainer.add(title);
  }

  private createActionButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgColor: number,
    borderColor: number,
    textColor: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.uiScene.add.container(x, y);
    const bg = this.uiScene.add.graphics();

    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? borderColor : bgColor, hover ? 0.35 : 0.92);
      bg.fillRoundedRect(0, 0, w, h, 5);
      bg.lineStyle(hover ? 2 : 1.5, hover ? 0xffffff : borderColor, 1);
      bg.strokeRoundedRect(0, 0, w, h, 5);
    };
    draw(false);
    container.add(bg);

    const txt = this.uiScene.add.text(w / 2, h / 2, label, {
      fontFamily: this.pixelFont,
      fontSize: '8px',
      fontStyle: 'bold',
      color: textColor,
      align: 'center',
      wordWrap: { width: w - 12 }
    }).setOrigin(0.5);
    container.add(txt);

    const zone = this.uiScene.add.zone(w / 2, h / 2, w, h);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      SoundManager.getInstance().playMenuHover();
      draw(true);
      txt.setColor('#ffffff');
    });
    zone.on('pointerout', () => {
      draw(false);
      txt.setColor(textColor);
    });
    zone.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      onClick();
    });
    container.add(zone);

    this.contentContainer.add(container);
    return container;
  }

  private reRenderCurrentTab(): void {
    const { width, height } = this.uiScene.scale;
    const panelW = 920;
    const panelH = 540;
    const px = width / 2 - panelW / 2;
    const py = height / 2 - panelH / 2 + 10;
    this.renderActiveTabContent(px + 20, py + 100, panelW - 40, panelH - 115);
  }

  public showToast(message: string, color: string = '#00f5d4'): void {
    if (this.toastText && this.toastText.active) {
      this.toastText.destroy();
    }

    const { width, height } = this.uiScene.scale;
    this.toastText = this.uiScene.add.text(width / 2, height - 68, message, {
      fontFamily: this.pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color,
      backgroundColor: '#090d16',
      padding: { x: 14, y: 8 },
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(3700);

    this.uiScene.tweens.add({
      targets: this.toastText,
      y: height - 78,
      alpha: { from: 1, to: 0 },
      delay: 2400,
      duration: 500,
      onComplete: () => {
        this.toastText?.destroy();
      }
    });
  }

  public destroy(): void {
    this.topBarContainer?.destroy();
    this.modalContainer?.destroy();
    this.hitboxGraphics?.destroy();
    this.toastText?.destroy();
  }
}

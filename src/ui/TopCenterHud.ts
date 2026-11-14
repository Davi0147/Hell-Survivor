import Phaser from 'phaser';

/** O que o topo central lê da GameScene a cada quadro. */
export interface ITopCenterHudWorld {
  gameMode: 'story' | 'endless' | 'sandbox';
  currentChapter: number;
  isBossFightActive: boolean;
  bossInstance?: { active: boolean; hp: number; maxHp: number; combatPhase?: number } | null;
  azazelBoss?: unknown;
  azazelCrystalsCaptured?: number;
  survivalTimeMs: number;
  chapterPurifiedSouls: number;
  chapterTargetSouls: number;
}

/**
 * Topo central da HUD: barra de purificação de almas (História),
 * barra de vida do chefe e cronômetro/recorde do Modo Infinito.
 */
export class TopCenterHud {
  private readonly purifyBar: Phaser.GameObjects.Graphics;
  private readonly purifyLabel: Phaser.GameObjects.Text;
  private readonly bossBar: Phaser.GameObjects.Graphics;
  private readonly bossName: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly recordText: Phaser.GameObjects.Text;

  constructor(
    private readonly ui: Phaser.Scene,
    pixelFont: string,
    formattedBestRecord: string,
    private readonly formatTime: (sec: number) => string
  ) {
    const { width } = ui.scale;

    this.purifyBar = ui.add.graphics();
    this.purifyBar.setDepth(110);

    this.purifyLabel = ui.add.text(width / 2, 19, 'PURIFICAÇÃO DE ALMAS', {
      fontFamily: pixelFont,
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0208',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(112);

    this.bossBar = ui.add.graphics();
    this.bossBar.setDepth(115);
    this.bossBar.setVisible(false);

    this.bossName = ui.add.text(width / 2, 17, 'ROSALIN [CHEFE DO CAPÍTULO 1]', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(116);
    this.bossName.setVisible(false);

    this.timerText = ui.add.text(width / 2, 22, '00:00', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#3a0812',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(115);
    this.timerText.setVisible(false);

    this.recordText = ui.add.text(width / 2, 38, `RECORDE: ${formattedBestRecord}`, {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0208',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(116);
    this.recordText.setVisible(false);
  }

  public getHudElements(): Phaser.GameObjects.GameObject[] {
    return [this.purifyBar, this.purifyLabel, this.bossBar, this.bossName, this.timerText, this.recordText];
  }

  public clear(): void {
    this.purifyBar.clear();
    this.bossBar.clear();
  }

  private show(parts: { purify?: boolean; boss?: boolean; timer?: boolean; record?: boolean }): void {
    this.purifyBar.setVisible(!!parts.purify);
    this.purifyLabel.setVisible(!!parts.purify);
    this.bossBar.setVisible(!!parts.boss);
    this.bossName.setVisible(!!parts.boss);
    this.timerText.setVisible(!!parts.timer);
    this.recordText.setVisible(!!parts.record);
  }

  public update(gs: ITopCenterHudWorld): void {
    const boss = gs.bossInstance;
    if (gs.isBossFightActive && boss && boss.active) {
      const isEndless = gs.gameMode === 'endless';
      this.show({ boss: true, timer: isEndless });
      this.bossName.setText(this.bossLabel(gs, boss));
      if (isEndless) {
        // Durante a luta no Infinito o cronômetro desce para baixo da barra do chefe
        this.timerText.setY(48);
        this.timerText.setText(this.formatTime(Math.floor(gs.survivalTimeMs / 1000)));
      }
      this.drawBossBar(Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1));
    } else if (gs.gameMode === 'endless') {
      this.show({ timer: true, record: true });
      this.timerText.setY(22);
      this.timerText.setText(this.formatTime(Math.floor(gs.survivalTimeMs / 1000)));
    } else if (gs.gameMode === 'story' && !gs.isBossFightActive) {
      // Sem números visíveis: só a barra
      this.show({ purify: true });
      this.drawPurifyBar(Phaser.Math.Clamp(gs.chapterPurifiedSouls / gs.chapterTargetSouls, 0, 1));
    } else if (gs.gameMode === 'sandbox' && !gs.isBossFightActive) {
      // A pílula do Modo de Teste ocupa este espaço
      this.show({});
    }
  }

  private bossLabel(gs: ITopCenterHudWorld, boss: NonNullable<ITopCenterHudWorld['bossInstance']>): string {
    const isAzazel = gs.currentChapter === 2 || boss === gs.azazelBoss;
    if (!isAzazel) return 'ROSALIN [CHEFE DO CAPÍTULO 1]';
    if (boss.combatPhase === 3) return `AZAZEL [CRISTAIS PURIFICADOS: ${gs.azazelCrystalsCaptured || 0}/3]`;
    return 'AZAZEL [CHEFE DO CAPÍTULO 2]';
  }

  private drawBossBar(ratio: number): void {
    const g = this.bossBar;
    g.clear();
    const bW = 460;
    const bH = 12;
    const bX = this.ui.scale.width / 2 - bW / 2;
    const bY = 28;

    g.fillStyle(0x1a0208, 0.96);
    g.fillRoundedRect(bX, bY, bW, bH, 4);
    g.lineStyle(2, 0xc59b27, 1);
    g.strokeRoundedRect(bX, bY, bW, bH, 4);
    g.lineStyle(1, 0xf3d17a, 0.8);
    g.strokeRoundedRect(bX + 1, bY + 1, bW - 2, bH - 2, 3);

    if (ratio > 0.01) {
      g.fillStyle(0xd90429, 1);
      g.fillRoundedRect(bX + 2, bY + 2, (bW - 4) * ratio, bH - 4, 3);
      g.fillStyle(0xff4d6d, 0.85);
      g.fillRect(bX + 3, bY + 3, (bW - 6) * ratio, 2);
    }
  }

  private drawPurifyBar(ratio: number): void {
    const g = this.purifyBar;
    g.clear();
    const pW = 320;
    const pH = 8;
    const pX = this.ui.scale.width / 2 - pW / 2;
    const pY = 28;

    g.fillStyle(0x140208, 0.94);
    g.fillRoundedRect(pX, pY, pW, pH, 3);
    g.lineStyle(1.5, 0xc59b27, 0.9);
    g.strokeRoundedRect(pX, pY, pW, pH, 3);

    if (ratio > 0.01) {
      g.fillStyle(0xff0055, 1);
      g.fillRoundedRect(pX + 1.5, pY + 1.5, (pW - 3) * ratio, pH - 3, 2);
    }
  }
}

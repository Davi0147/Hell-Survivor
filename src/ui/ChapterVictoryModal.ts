import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';
import { createModalFrame } from './ModalFrame';

export interface ChapterVictoryStats {
  kills: number;
  level: number;
  timeSec: number;
  soulsEarned?: number;
}

export interface IChapterVictoryModalHost extends Phaser.Scene {
  setHUDVisible(visible: boolean): void;
  showWaveAlert(message: string, durationMs?: number): void;
}

/**
 * Modal de Vitória de Capítulo extraído da UIScene (Pacote UI).
 * Usa a moldura compartilhada ModalFrame e tokens do MODAL_THEME.
 */
export class ChapterVictoryModal {
  private host: IChapterVictoryModalHost;
  public container?: Phaser.GameObjects.Container;

  constructor(host: IChapterVictoryModalHost) {
    this.host = host;
  }

  public show(stats: ChapterVictoryStats, onReturnToMenu: () => void): void {
    this.host.setHUDVisible(false);
    const pixelFont = FONTS.body;
    const t = MODAL_THEME.victory;

    const frame = createModalFrame(this.host, {
      depth: 3500,
      backdropAlpha: t.backdropAlpha,
      panelWidth: 540,
      panelHeight: 340,
      panelFill: t.panelFill,
      panelAlpha: t.panelAlpha,
      outerBorderColor: t.outerBorderColor,
      outerBorderWidth: t.outerBorderWidth,
      outerRadius: t.outerRadius,
      innerBorderColor: t.innerBorderColor,
      innerBorderWidth: t.innerBorderWidth,
      innerBorderAlpha: t.innerBorderAlpha,
      innerRadius: t.innerRadius
    });

    const modal = frame.container;
    this.container = modal;
    const { panelX, panelY } = frame;

    const title = this.host.add.text(panelX, panelY - 110, 'CAPÍTULO 1 CONCLUÍDO', {
      fontFamily: pixelFont,
      fontSize: '22px',
      fontStyle: 'bold',
      color: t.titleColor,
      stroke: t.titleStroke,
      strokeThickness: 4
    }).setOrigin(0.5);
    modal.add(title);

    const subtitle = this.host.add.text(panelX, panelY - 70, 'A SUCCUBUS FOI DERROTADA', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: t.subtitleColor,
      stroke: COLORS.strokeBlack,
      strokeThickness: 3
    }).setOrigin(0.5);
    modal.add(subtitle);

    const soulsInfo = typeof stats.soulsEarned === 'number' ? `\nAlmas Corrompidas Resgatadas: +${stats.soulsEarned}` : '';
    const statsText = this.host.add.text(
      panelX,
      panelY - 10,
      `Inimigos Abatidos: ${stats.kills}\nNível Alcançado: ${stats.level}\nTempo: ${stats.timeSec}s\nChefe: Succubus (DERROTADA)${soulsInfo}`,
      {
        fontFamily: pixelFont,
        fontSize: '12px',
        color: COLORS.textWhite,
        stroke: t.statsStroke,
        strokeThickness: 2,
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5);
    modal.add(statsText);

    const btnW = 200;
    const btnH = 38;
    const btnY = panelY + 95;
    const btn1X = panelX - 110;
    const btn2X = panelX + 110;

    const btn1Bg = this.host.add.graphics();
    const renderBtn1 = (hover: boolean) => {
      btn1Bg.clear();
      btn1Bg.fillStyle(hover ? t.btnNextHoverFill : t.btnNextIdleFill, 1);
      btn1Bg.fillRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn1Bg.lineStyle(2, hover ? t.btnNextHoverBorder : t.btnNextIdleBorder, 1);
      btn1Bg.strokeRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn1(false);
    modal.add(btn1Bg);

    const btn1Text = this.host.add.text(btn1X, btnY, 'PRÓXIMO CAPÍTULO', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: COLORS.textWhite,
      stroke: COLORS.strokeBlack,
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btn1Text);

    const btn1Zone = this.host.add.zone(btn1X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    modal.add(btn1Zone);
    btn1Zone.on('pointerover', () => renderBtn1(true));
    btn1Zone.on('pointerout', () => renderBtn1(false));
    btn1Zone.on('pointerdown', () => {
      this.host.showWaveAlert('Capítulo 2 em desenvolvimento nas próximas atualizações!', 3000);
    });

    const btn2Bg = this.host.add.graphics();
    const renderBtn2 = (hover: boolean) => {
      btn2Bg.clear();
      btn2Bg.fillStyle(hover ? t.btnMenuHoverFill : t.btnMenuIdleFill, 1);
      btn2Bg.fillRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn2Bg.lineStyle(2, hover ? COLORS.white : t.btnMenuIdleBorder, 1);
      btn2Bg.strokeRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn2(false);
    modal.add(btn2Bg);

    const btn2Text = this.host.add.text(btn2X, btnY, 'VOLTAR AO MENU', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: COLORS.textWhite,
      stroke: COLORS.strokeBlack,
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btn2Text);

    const btn2Zone = this.host.add.zone(btn2X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    modal.add(btn2Zone);
    btn2Zone.on('pointerover', () => renderBtn2(true));
    btn2Zone.on('pointerout', () => renderBtn2(false));
    btn2Zone.on('pointerdown', onReturnToMenu);
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
  }
}

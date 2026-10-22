import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { createModalFrame } from './ModalFrame';

export interface GameOverStats {
  kills: number;
  level: number;
  timeSec: number;
  mode: 'story' | 'endless' | 'sandbox';
  soulsEarned?: number;
}

export interface IGameOverModalHost extends Phaser.Scene {
  setHUDVisible(visible: boolean): void;
  formatTime(totalSec: number): string;
  getBestRecordValue(): number;
  updateBestRecordIfHigher(timeSec: number): boolean;
  onCleanupPauseCursor(): void;
}

/**
 * Modal de Fim da Jornada (Game Over) extraído da UIScene (Pacote UI).
 * Gerencia exibição de estatísticas, recorde pessoal do modo infinito,
 * navegação por teclado/gamepad/mouse e callbacks de tentar novamente ou voltar ao menu.
 */
export class GameOverModal {
  private host: IGameOverModalHost;
  public isOpen: boolean = false;
  public container?: Phaser.GameObjects.Container;

  private selectedIndex: number = 0;
  private btnRenders: ((h: boolean) => void)[] = [];
  private btnActions: (() => void)[] = [];

  constructor(host: IGameOverModalHost) {
    this.host = host;
  }

  public show(
    stats: GameOverStats,
    onRetry: () => void,
    onReturnToMenu: () => void
  ): void {
    this.host.setHUDVisible(false);
    const pixelFont = FONTS.body;
    const t = MODAL_THEME.gameOver;

    const isNewRecord = stats.mode === 'endless' && this.host.updateBestRecordIfHigher(stats.timeSec);
    const bestRecordSec = this.host.getBestRecordValue();

    const frame = createModalFrame(this.host, {
      depth: 3600,
      backdropAlpha: t.backdropAlpha,
      panelWidth: 560,
      panelHeight: 370,
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
    const { panelX, panelY } = frame;

    const title = this.host.add.text(panelX, panelY - 125, 'FIM DA JORNADA', {
      fontFamily: pixelFont,
      fontSize: '24px',
      fontStyle: 'bold',
      color: t.titleColor,
      stroke: COLORS.strokeBlack,
      strokeThickness: 5
    }).setOrigin(0.5);
    modal.add(title);

    const isStory = stats.mode === 'story';
    const subtitleText = isStory
      ? 'A MORTE NÃO É O FIM PARA QUEM JÁ ESTÁ NO PURGATÓRIO'
      : 'SUA ALMA FOI REIVINDICADA PELO ABISMO';

    const subtitle = this.host.add.text(panelX, panelY - 85, subtitleText, {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: t.subtitleColor,
      stroke: t.subtitleStroke,
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(subtitle);

    const formattedTime = this.host.formatTime(stats.timeSec);
    const bestText = stats.mode === 'endless' ? `\nRecorde Pessoal: ${this.host.formatTime(bestRecordSec)}` : '';
    const newRecordNotice = isNewRecord ? '\nNOVO RECORDE PESSOAL ALCANÇADO!\n' : '\n';
    const soulsNotice = typeof stats.soulsEarned === 'number' ? `\nAlmas Corrompidas Resgatadas: +${stats.soulsEarned}` : '';

    const statsText = this.host.add.text(
      panelX,
      panelY - 5,
      `Tempo Sobrevivido: ${formattedTime}${bestText}${newRecordNotice}` +
        `Inimigos Abatidos: ${stats.kills}\nNível Alcançado: LVL ${stats.level}${soulsNotice}`,
      {
        fontFamily: pixelFont,
        fontSize: '12px',
        color: isNewRecord ? t.newRecordColor : COLORS.textWhite,
        stroke: COLORS.strokeBlack,
        strokeThickness: 3,
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5);
    modal.add(statsText);

    const btnW = 230;
    const btnH = 42;
    const btn1X = panelX - btnW / 2 - 12;
    const btn2X = panelX + btnW / 2 + 12;
    const btnY = panelY + 125;

    const btn1Bg = this.host.add.graphics();
    const renderBtn1 = (h: boolean) => {
      btn1Bg.clear();
      btn1Bg.fillStyle(h ? t.btnRetryHoverFill : t.btnRetryIdleFill, 1);
      btn1Bg.fillRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn1Bg.lineStyle(2, h ? COLORS.white : t.btnRetryIdleBorder, 1);
      btn1Bg.strokeRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn1(false);
    modal.add(btn1Bg);

    const btn1Label = isStory ? 'RESSURGIR DAS CINZAS' : 'TENTAR NOVAMENTE';
    const btn1Text = this.host.add.text(btn1X, btnY, btn1Label, {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: COLORS.textWhite,
      stroke: COLORS.strokeBlack,
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btn1Text);

    const onRetryWrapped = () => {
      this.close();
      SoundManager.getInstance().stopMusic();
      onRetry();
    };

    const onReturnToMenuWrapped = () => {
      this.close();
      SoundManager.getInstance().stopMusic();
      onReturnToMenu();
    };

    const btn1Zone = this.host.add.zone(btn1X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    btn1Zone.on('pointerover', () => {
      this.selectBtn(0);
    });
    btn1Zone.on('pointerout', () => renderBtn1(this.selectedIndex === 0));
    btn1Zone.on('pointerdown', onRetryWrapped);
    modal.add(btn1Zone);

    const btn2Bg = this.host.add.graphics();
    const renderBtn2 = (h: boolean) => {
      btn2Bg.clear();
      btn2Bg.fillStyle(h ? t.btnMenuHoverFill : t.btnMenuIdleFill, 1);
      btn2Bg.fillRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn2Bg.lineStyle(2, h ? t.btnMenuHoverBorder : t.btnMenuIdleBorder, 1);
      btn2Bg.strokeRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn2(false);
    modal.add(btn2Bg);

    const btn2Text = this.host.add.text(btn2X, btnY, 'MENU PRINCIPAL', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: COLORS.textWhite,
      stroke: COLORS.strokeBlack,
      strokeThickness: 2
    }).setOrigin(0.5);
    modal.add(btn2Text);

    const btn2Zone = this.host.add.zone(btn2X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    btn2Zone.on('pointerover', () => {
      this.selectBtn(1);
    });
    btn2Zone.on('pointerout', () => renderBtn2(this.selectedIndex === 1));
    btn2Zone.on('pointerdown', onReturnToMenuWrapped);
    modal.add(btn2Zone);

    this.isOpen = true;
    this.selectedIndex = 0;
    this.container = modal;
    this.btnRenders = [renderBtn1, renderBtn2];
    this.btnActions = [onRetryWrapped, onReturnToMenuWrapped];

    renderBtn1(true);
    renderBtn2(false);

    this.host.onCleanupPauseCursor();
  }

  public updateControls(): void {
    if (!this.isOpen || !this.container) return;

    const nav = GamepadManager.getInstance().getMenuNavigation(this.host);
    const k = this.host.input.keyboard;

    const leftPressed = nav.left || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.A))
    ));
    const rightPressed = nav.right || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.D))
    ));

    if (leftPressed && this.selectedIndex !== 0) {
      this.selectBtn(0);
    } else if (rightPressed && this.selectedIndex !== 1) {
      this.selectBtn(1);
    }

    const confirmPressed = nav.confirm || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER))
    ));

    if (confirmPressed) {
      SoundManager.getInstance().playMenuClick();
      this.triggerChoice(this.selectedIndex);
    }
  }

  public selectBtn(index: number): void {
    if (this.selectedIndex !== index) {
      SoundManager.getInstance().playMenuHover();
    }
    this.selectedIndex = index;
    if (this.btnRenders[0]) this.btnRenders[0](index === 0);
    if (this.btnRenders[1]) this.btnRenders[1](index === 1);
  }

  public triggerChoice(index: number): void {
    const action = this.btnActions[index];
    this.close();
    if (action) action();
  }

  public close(): void {
    this.isOpen = false;
    this.host.onCleanupPauseCursor();
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
    this.btnRenders = [];
    this.btnActions = [];
  }

  public destroy(): void {
    this.close();
  }
}

import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { InputHint } from './InputHint';

export interface GameOverStats {
  kills: number;
  level: number;
  timeSec: number;
  mode: 'story' | 'endless' | 'sandbox';
  soulsEarned?: number;
  /** Maior combo da partida e o recorde salvo (já contando esta partida). */
  maxCombo?: number;
  bestCombo?: number;
}

export interface IGameOverModalHost extends Phaser.Scene {
  setHUDVisible(visible: boolean): void;
  formatTime(totalSec: number): string;
  getBestRecordValue(): number;
  updateBestRecordIfHigher(timeSec: number): boolean;
  onCleanupPauseCursor(): void;
}

/** Um número da tela: valor grande que conta do zero, nome pequeno e uma linha opcional. */
interface StatCell {
  label: string;
  value: number;
  format: (v: number) => string;
  sub?: string;
  highlight?: boolean;
}

const COUNT_MS = 750;

/**
 * Tela de Fim da Jornada (Game Over). Sem painel nem caixas (decisão do dono, 2026-11-25):
 * o jogo escurecido ao fundo com uma vinheta carmesim, título grande que cai na tela
 * (sem linhas nem ornamentos),
 * os números contando do zero e as opções só como texto (seta e traço dourado na escolhida).
 * Teclado, controle e toque navegam igual.
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

  public show(stats: GameOverStats, onRetry: () => void, onReturnToMenu: () => void): void {
    const s = this.host;
    s.setHUDVisible(false);
    const t = MODAL_THEME.gameOver;
    const { width, height } = s.scale;
    const cx = width / 2;
    // Tudo medido pela altura: no celular o jogo inteiro é encolhido
    const u = height / 720;
    const px = (n: number): string => `${Math.max(9, Math.round(n * u))}px`;

    const isNewRecord = stats.mode === 'endless' && s.updateBestRecordIfHigher(stats.timeSec);
    const bestRecordSec = s.getBestRecordValue();
    const isStory = stats.mode === 'story';

    const modal = s.add.container(0, 0).setDepth(3600);
    this.container = modal;

    // Véu escuro sobre o jogo (bloqueia cliques) + vinheta carmesim nas bordas
    const veil = s.add.rectangle(cx, height / 2, width, height, t.veil, t.veilAlpha).setInteractive();
    const vignette = s.add.graphics();
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const band = (height * 0.05) * (i + 1);
      vignette.fillStyle(t.vignette, 0.045);
      vignette.fillRect(0, 0, width, band);
      vignette.fillRect(0, height - band, width, band);
      vignette.fillRect(0, 0, band, height);
      vignette.fillRect(width - band, 0, band, height);
    }
    modal.add([veil, vignette]);
    veil.setAlpha(0);
    vignette.setAlpha(0);
    s.tweens.add({ targets: [veil, vignette], alpha: 1, duration: 400 });

    // Título que cai pesado
    const titleY = height * 0.2;
    const title = s.add.text(cx, titleY, 'FIM DA JORNADA', {
      fontFamily: FONTS.body, fontSize: px(46), fontStyle: 'bold',
      color: t.titleColor, stroke: t.titleStroke, strokeThickness: Math.round(8 * u),
    }).setOrigin(0.5).setAlpha(0).setScale(1.5);
    s.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 420, delay: 150, ease: 'Back.easeOut' });

    const subtitle = s.add.text(cx, titleY + 46 * u, isStory
      ? 'A MORTE NÃO É O FIM PARA QUEM JÁ ESTÁ NO PURGATÓRIO'
      : 'SUA ALMA FOI REIVINDICADA PELO ABISMO', {
      fontFamily: FONTS.body, fontSize: px(13), color: t.subtitleColor, stroke: t.subtitleStroke, strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    s.tweens.add({ targets: subtitle, alpha: 1, duration: 400, delay: 450 });

    modal.add([title, subtitle]);

    // Números da partida
    const cells: StatCell[] = [
      {
        label: 'TEMPO', value: stats.timeSec, format: (v) => s.formatTime(Math.round(v)),
        sub: isNewRecord ? 'NOVO RECORDE!' : stats.mode === 'endless' ? `RECORDE ${s.formatTime(bestRecordSec)}` : undefined,
        highlight: isNewRecord,
      },
      { label: 'ABATES', value: stats.kills, format: (v) => `${Math.round(v)}` },
      { label: 'NÍVEL', value: stats.level, format: (v) => `${Math.round(v)}` },
    ];
    if (stats.maxCombo) {
      const comboRecord = !stats.bestCombo || stats.bestCombo <= stats.maxCombo;
      cells.push({
        label: 'MAIOR COMBO', value: stats.maxCombo, format: (v) => `x${Math.round(v)}`,
        sub: comboRecord ? 'NOVO RECORDE!' : `RECORDE x${stats.bestCombo}`, highlight: comboRecord,
      });
    }
    if (typeof stats.soulsEarned === 'number') {
      cells.push({ label: 'ALMAS', value: stats.soulsEarned, format: (v) => `+${Math.round(v)}` });
    }

    const cellW = Math.min((width * 0.86) / cells.length, 230 * u);
    const statsY = height * 0.5;
    cells.forEach((c, i) => {
      const x = cx + (i - (cells.length - 1) / 2) * cellW;
      const delay = 650 + i * 130;
      const valueText = s.add.text(x, statsY, c.format(0), {
        fontFamily: FONTS.body, fontSize: px(34), fontStyle: 'bold',
        color: c.highlight ? t.newRecordColor : t.statValue, stroke: COLORS.strokeBlack, strokeThickness: Math.round(5 * u),
      }).setOrigin(0.5);
      const label = s.add.text(x, statsY + 36 * u, c.label, {
        fontFamily: FONTS.body, fontSize: px(14), color: t.statLabel, stroke: COLORS.strokeBlack, strokeThickness: 3,
      }).setOrigin(0.5);
      const parts: Phaser.GameObjects.Text[] = [valueText, label];
      if (c.sub) {
        const sub = s.add.text(x, statsY + 60 * u, c.sub, {
          fontFamily: FONTS.body, fontSize: px(12), color: c.highlight ? t.newRecordColor : t.statSub, stroke: COLORS.strokeBlack, strokeThickness: 3,
        }).setOrigin(0.5);
        parts.push(sub);
        if (c.highlight) s.tweens.add({ targets: sub, alpha: 0.45, duration: 500, yoyo: true, repeat: -1, delay: delay + COUNT_MS });
      }
      for (const p of parts) {
        p.setAlpha(0).setY(p.y + 14 * u);
        s.tweens.add({ targets: p, alpha: 1, y: p.y - 14 * u, duration: 320, delay, ease: 'Quad.easeOut' });
      }
      modal.add(parts);
      // Conta do zero até o valor, com um estalo no fim
      s.tweens.addCounter({
        from: 0, to: c.value, duration: COUNT_MS, delay, ease: 'Cubic.easeOut',
        onUpdate: (tw) => valueText.setText(c.format(tw.getValue() ?? 0)),
        onComplete: () => {
          valueText.setText(c.format(c.value));
          SoundManager.getInstance().playRouletteTick(1 + i * 0.08);
          if (c.highlight) s.tweens.add({ targets: valueText, scale: 1.18, duration: 120, yoyo: true });
        },
      });
    });

    // Opções só como texto: a escolhida fica dourada, com seta e traço embaixo
    const optY = height * 0.74;
    const optGap = Math.min(width * 0.18, 260 * u);
    const options = [
      { label: isStory ? 'RESSURGIR DAS CINZAS' : 'TENTAR NOVAMENTE', x: cx - optGap },
      { label: 'MENU PRINCIPAL', x: cx + optGap },
    ];
    const underline = s.add.graphics();
    const arrow = s.add.text(0, optY, '▶', {
      fontFamily: FONTS.body, fontSize: px(16), color: t.optionActive, stroke: COLORS.strokeBlack, strokeThickness: 3,
    }).setOrigin(1, 0.5);
    s.tweens.add({ targets: arrow, x: '-=5', duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const optTexts = options.map((o, i) => {
      const txt = s.add.text(o.x, optY, o.label, {
        fontFamily: FONTS.body, fontSize: px(17), fontStyle: 'bold', color: t.optionIdle, stroke: COLORS.strokeBlack, strokeThickness: 4,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on('pointerover', () => this.selectBtn(i));
      txt.on('pointerdown', () => this.triggerChoice(i));
      return txt;
    });
    const hint = new InputHint(s, cx, optY + 50 * u, ['confirm', { text: 'CONFIRMAR' }], {
      glyphHeight: Math.round(22 * u), fontSize: Math.round(10 * u), align: 'center',
    }).container;
    modal.add([underline, arrow, ...optTexts, hint]);

    const renderOption = (i: number) => (active: boolean): void => {
      const txt = optTexts[i];
      txt.setColor(active ? t.optionActive : t.optionIdle).setScale(active ? 1.06 : 1);
      if (!active) return;
      arrow.setPosition(txt.x - txt.displayWidth / 2 - 10 * u, optY);
      underline.clear();
      underline.fillStyle(t.optionUnderline, 1);
      underline.fillRect(txt.x - txt.displayWidth / 2, optY + txt.displayHeight / 2 + 2, txt.displayWidth, Math.max(2, 2 * u));
    };

    for (const o of [underline, arrow, ...optTexts, hint]) {
      o.setAlpha(0);
      s.tweens.add({ targets: o, alpha: 1, duration: 350, delay: 900 + cells.length * 130 });
    }

    const onRetryWrapped = (): void => {
      this.close();
      SoundManager.getInstance().stopMusic();
      onRetry();
    };
    const onReturnToMenuWrapped = (): void => {
      this.close();
      SoundManager.getInstance().stopMusic();
      onReturnToMenu();
    };

    this.isOpen = true;
    this.selectedIndex = 0;
    this.btnRenders = [renderOption(0), renderOption(1)];
    this.btnActions = [onRetryWrapped, onReturnToMenuWrapped];
    this.btnRenders[0](true);
    this.btnRenders[1](false);

    s.onCleanupPauseCursor();
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

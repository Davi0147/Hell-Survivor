import Phaser from 'phaser';
import { OBJECTIVE_THEME as T, COLORS } from '../config/theme';
import { HUD_SIZES } from '../config/hudLayout';

/** Chefe com barra de vida no topo. */
interface IBossBarSource {
  active: boolean;
  hp: number;
  maxHp: number;
  combatPhase?: number;
}

/** O que o topo central lê da GameScene a cada quadro. */
export interface ITopCenterHudWorld {
  gameMode: 'story' | 'endless' | 'sandbox';
  currentChapter: number;
  isBossFightActive: boolean;
  bossInstance?: IBossBarSource | null;
  azazelBoss?: IBossBarSource | null;
  azazelCrystalsCaptured?: number;
  survivalTimeMs: number;
  chapterPurifiedSouls: number;
  chapterTargetSouls: number;
}

type PlateMode = 'none' | 'purify' | 'timer' | 'boss' | 'bossTimer';

const W = HUD_SIZES.objective.w;
const H = HUD_SIZES.objective.h;
const BOSS_W = HUD_SIZES.objective.bossW;

/**
 * Topo central da HUD: uma placa de obsidiana com moldura dourada que mostra o objetivo do
 * momento — purificação de almas (História), relógio e recorde (Infinito) ou a vida do chefe.
 * Tudo num container escalado pelo layout (maior no celular).
 */
export class TopCenterHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly plate: Phaser.GameObjects.Graphics;
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly recordText: Phaser.GameObjects.Text;
  private readonly timerIcon?: Phaser.GameObjects.Image;
  private mode: PlateMode = 'none';

  constructor(
    private readonly ui: Phaser.Scene,
    pixelFont: string,
    formattedBestRecord: string,
    private readonly formatTime: (sec: number) => string,
    layout: { x: number; y: number; scale: number }
  ) {
    this.container = ui.add.container(layout.x, layout.y).setScale(layout.scale).setDepth(110);
    this.plate = ui.add.graphics();
    this.bar = ui.add.graphics();

    const text = (size: number, color: string, stroke: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: pixelFont,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke,
      strokeThickness: 3,
    });
    this.label = ui.add.text(0, 12, 'PURIFICAÇÃO DE ALMAS', text(12, T.label, T.labelStroke)).setOrigin(0.5);
    this.timerText = ui.add.text(0, 17, '00:00', text(20, T.timer, T.timerStroke)).setOrigin(0.5);
    this.recordText = ui.add.text(0, 36, `RECORDE: ${formattedBestRecord}`, text(10, T.label, T.labelStroke)).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [this.plate, this.bar, this.label, this.timerText, this.recordText];
    if (ui.textures.exists('ui-icon-timer')) {
      this.timerIcon = ui.add.image(0, 17, 'ui-icon-timer').setDisplaySize(22, 22);
      parts.push(this.timerIcon);
    }
    this.container.add(parts);
    this.setMode('none');
  }

  public getHudElements(): Phaser.GameObjects.GameObject[] {
    return [this.container];
  }

  public clear(): void {
    this.bar.clear();
  }

  public update(gs: ITopCenterHudWorld): void {
    // Azazel tem prioridade quando está em campo; antes a barra só lia a Rosalin
    const azazel = gs.azazelBoss && gs.azazelBoss.active ? gs.azazelBoss : undefined;
    const boss = azazel ?? gs.bossInstance;
    const timeText = this.formatTime(Math.floor(gs.survivalTimeMs / 1000));

    if (gs.isBossFightActive && boss && boss.active) {
      const isEndless = gs.gameMode === 'endless';
      this.setMode(isEndless ? 'bossTimer' : 'boss');
      this.label.setText(this.bossLabel(gs, boss));
      if (isEndless) this.setTimer(timeText);
      this.drawBar(BOSS_W - 40, 28, Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1), T.bossFill, T.bossShine, 14);
    } else if (gs.gameMode === 'endless') {
      this.setMode('timer');
      this.setTimer(timeText);
    } else if (gs.gameMode === 'story' && !gs.isBossFightActive) {
      // Sem números visíveis: só a barra
      this.setMode('purify');
      this.drawBar(W - 40, 26, Phaser.Math.Clamp(gs.chapterPurifiedSouls / gs.chapterTargetSouls, 0, 1), T.purifyFill, T.purifyShine, 10);
    } else {
      // Modo de Teste: a pílula do painel ocupa este espaço
      this.setMode('none');
    }
  }

  private setTimer(text: string): void {
    if (this.timerText.text !== text) this.timerText.setText(text);
    this.timerIcon?.setX(this.timerText.x - this.timerText.width / 2 - 16);
  }

  /** Liga as partes do modo e redesenha a placa só quando o modo muda. */
  private setMode(mode: PlateMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    const isBoss = mode === 'boss' || mode === 'bossTimer';
    const hasTimer = mode === 'timer' || mode === 'bossTimer';
    this.label.setVisible(mode === 'purify' || isBoss);
    this.label.setColor(isBoss ? T.bossName : T.label);
    this.timerText.setVisible(hasTimer);
    this.timerIcon?.setVisible(hasTimer);
    this.recordText.setVisible(mode === 'timer');
    this.bar.setVisible(mode === 'purify' || isBoss);
    this.bar.clear();

    // No Infinito com chefe, o relógio desce para baixo da barra
    this.timerText.setY(mode === 'bossTimer' ? 58 : 17);
    this.timerIcon?.setY(this.timerText.y);
    this.label.setY(isBoss ? 13 : 12);

    const plateW = isBoss ? BOSS_W : mode === 'timer' ? 200 : W;
    const plateH = mode === 'bossTimer' ? H + 26 : H;
    this.drawPlate(mode === 'none' ? 0 : plateW, plateH);
  }

  private drawPlate(w: number, h: number): void {
    const g = this.plate;
    g.clear();
    if (w <= 0) return;
    const x = -w / 2;
    g.fillStyle(T.plate, T.plateAlpha);
    g.fillRect(x, 0, w, h);
    g.lineStyle(1, T.innerBorder, 1);
    g.strokeRect(x + 3, 3, w - 6, h - 6);
    g.lineStyle(2, T.border, 1);
    g.strokeRect(x, 0, w, h);
    // Cantos reforçados (mesma moldura da barra de armas e das cartas)
    g.fillStyle(T.border, 1);
    for (const [cx, cy] of [[x, 0], [x + w, 0], [x, h], [x + w, h]]) g.fillRect(cx - 3, cy - 3, 6, 6);
  }

  private drawBar(w: number, y: number, ratio: number, fill: number, shine: number, h: number): void {
    const g = this.bar;
    g.clear();
    const x = -w / 2;
    g.fillStyle(T.barTrack, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, T.border, 0.9);
    g.strokeRect(x, y, w, h);
    if (ratio > 0.005) {
      g.fillStyle(fill, 1);
      g.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4);
      g.fillStyle(shine, 0.85);
      g.fillRect(x + 2, y + 2, (w - 4) * ratio, 2);
      g.fillStyle(COLORS.white, 0.9);
      g.fillRect(x + 2 + (w - 4) * ratio - 2, y + 1, 2, h - 2);
    }
  }

  /** O nome vem de quem está na luta, não do capítulo (no Infinito o capítulo é sempre 1). */
  private bossLabel(gs: ITopCenterHudWorld, boss: IBossBarSource): string {
    const isAzazel = boss === gs.azazelBoss;
    // Hífen, não ponto médio: a fonte pixel não tem todos os símbolos
    if (!isAzazel) return 'ROSALIN - CHEFE DO CAPÍTULO 1';
    // A vida dele volta a subir enquanto os cristais estão de pé: o rótulo avisa
    if (boss.combatPhase === 3) return `AZAZEL SE CURA - CRISTAIS ${gs.azazelCrystalsCaptured || 0}/3`;
    return 'AZAZEL - CHEFE DO CAPÍTULO 2';
  }
}

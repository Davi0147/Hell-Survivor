import Phaser from 'phaser';
import { CHAPTERS, type ChapterInfo } from '../config/chapterCatalog';
import { CHAPTER_SELECT_THEME as T, FONTS, chapterUiKey, type ChapterUiPiece } from '../config/theme';
import {
  accordionWidths,
  chapterState,
  formatBestTime,
  initialFocus,
  isPlayable,
  type ChapterRecord,
  type ChapterState,
} from '../systems/chapterProgress';
import { SoundManager } from '../systems/SoundManager';
import { drawPixelOutline } from './pixelFrame';
import { InputHint } from './InputHint';

export type ChapterNavAction = 'left' | 'right' | 'up' | 'down' | 'confirm';

export interface ChapterSelectOptions {
  /** Progresso salvo (capítulos vencidos e melhor tempo). */
  records: Readonly<Record<number, ChapterRecord>>;
  onPlay(chapter: number): void;
  onClose(): void;
  depth?: number;
}

/** Medidas no espaço lógico (720 de altura; a largura acompanha a tela, 1280 a 1680). */
const L = {
  sideMargin: 70,
  top: 132,
  panelH: 446,
  gap: 10,
  /** Largura do painel aberto (no máximo esta fração da área). */
  openW: 520,
  openMaxFrac: 0.44,
  /** Arte do capítulo em foco cobrindo a tela atrás dos painéis (bem apagada). */
  bgArtAlpha: 0.42,
  bgFadeMs: 260,
  minClosedW: 58,
  px: 4,
  /** Velocidade da animação de abrir/fechar (fração do caminho por segundo). */
  ease: 11,
  titleY: 62,
  /** Margem do nome até as pontas da placa do título (soma dos dois lados). */
  titlePadX: 28,
  backY: 626,
  backW: 220,
  backH: 72,
  hintY: 692,
  arrowW: 64,
} as const;

/**
 * Molduras esticáveis (NineSlice): só os cantos têm enfeite (até ~100 px da borda na folha),
 * as bordas retas esticam. Reduzidas para a borda ficar com ~8 px na tela. A moldura de
 * bloqueado tem correntes penduradas 68 px abaixo da borda.
 */
const FRAME = { scale: 0.3, inset: 100, lockedChainsPx: 68, pad: 3 } as const;
/** Placa do resumo (NineSlice): enfeite dourado só em cima. */
const TEXT_PANEL = { scale: 0.5, left: 56, right: 56, top: 60, bottom: 24 } as const;
/**
 * Fita do título: a faixa vermelha ocupa só o alto da peça (as pontas descem embaixo). O centro
 * da faixa fica a 37% da altura (linhas 0 a 83 de 113), e é ali que o texto vai.
 */
const RIBBON_BAND_CENTER = 41.5 / 113;
/**
 * Correntes do "em breve" aberto: duas diagonais de canto a canto (faixa de elos repetida),
 * cruzando no meio com o cadeado. `inset` = distância dos cantos; `scale` deixa a corrente
 * com ~19 px de espessura.
 */
const CHAINS = { inset: 14, scale: 0.6, lockH: 78 } as const;
/** Ampulheta dentro da placa do tempo: altura (fração da placa) e centro (fração da largura). */
const HOURGLASS = { heightFrac: 0.62, xFrac: 0.09 } as const;

/** Fração da largura da placa do título que é a parte reta (sem as pontas laterais). */
const TITLE_PLAQUE_FLAT = 0.76;

/** Altura dos pés do sprite provisório do chefe (fração do painel). */
const SPRITE_FEET_Y = 0.6;

interface Panel {
  info: ChapterInfo;
  state: ChapterState;
  record?: ChapterRecord;
  x: number;
  w: number;
  bg: Phaser.GameObjects.Graphics;
  art?: Phaser.GameObjects.Image;
  /** 'cover' = arte de fundo do capítulo; 'sprite' = sprite do chefe (arte provisória). */
  artMode: 'cover' | 'sprite';
  artScale: number;
  band: Phaser.GameObjects.Graphics;
  textPanel?: Phaser.GameObjects.NineSlice;
  frameArt?: Phaser.GameObjects.NineSlice;
  frameKey: string;
  frameG: Phaser.GameObjects.Graphics;
  badge?: Phaser.GameObjects.Image;
  numeral: Phaser.GameObjects.Text;
  padlock?: Phaser.GameObjects.Image;
  lockG: Phaser.GameObjects.Graphics;
  /** Correntes em X do "em breve" aberto (duas faixas repetidas e o cadeado do cruzamento). */
  chains?: { a: Phaser.GameObjects.TileSprite; b: Phaser.GameObjects.TileSprite; lock?: Phaser.GameObjects.Image };
  seal?: Phaser.GameObjects.Image;
  /** Tudo que só aparece com o painel aberto. */
  open: Phaser.GameObjects.Container;
  ribbon?: Phaser.GameObjects.Image;
  heading: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  boss: Phaser.GameObjects.Text;
  summary: Phaser.GameObjects.Text;
  plate?: Phaser.GameObjects.Image;
  hourglass?: Phaser.GameObjects.Image;
  footer: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
  shakeMs: number;
}

/**
 * Escolha de capítulo: 10 painéis lado a lado com a arte do chefe de fundo. O painel em foco
 * abre (mostra título, chefe, mini resumo e melhor tempo); os outros viram faixas com o
 * número. Bloqueados e não lançados ficam cinza e apagados, com cadeado.
 * Mouse: passar por cima foca, clicar joga. Toque: o primeiro toque foca, o segundo joga.
 */
export class ChapterSelectMenu {
  public readonly container: Phaser.GameObjects.Container;
  private readonly panels: Panel[] = [];
  private focus = 0;
  private backFocused = false;
  private readonly openW: number;
  private readonly regionLeft: number;
  private readonly regionW: number;
  private readonly useNineSlice: boolean;
  private renderBack!: (focused: boolean) => void;
  private readonly onUpdate: (time: number, delta: number) => void;
  private bgArt?: Phaser.GameObjects.Image;
  private bgArtKey = '';
  private lastFocusDrawn = -1;

  constructor(private readonly scene: Phaser.Scene, private readonly opts: ChapterSelectOptions) {
    const { width, height } = scene.scale;
    this.container = scene.add.container(0, 0).setDepth(opts.depth ?? 100);
    this.regionLeft = L.sideMargin;
    this.regionW = width - L.sideMargin * 2;
    this.openW = Math.round(Math.min(L.openW, this.regionW * L.openMaxFrac));
    // NineSlice só existe no WebGL; no Canvas (iPhone que perdeu a memória de vídeo) desenha por código
    this.useNineSlice = scene.game.renderer.type === Phaser.WEBGL;

    const backdrop = scene.add.rectangle(width / 2, height / 2, width, height, T.backdrop, T.backdropAlpha).setInteractive();
    this.container.add(backdrop);
    this.buildBackgroundArt(width, height);
    this.buildTitle(width / 2);

    const states = CHAPTERS.map((c) => chapterState(c.number, c.released, opts.records));
    CHAPTERS.forEach((info, i) => this.panels.push(this.buildPanel(info, states[i], i)));
    this.focus = initialFocus(states);

    this.buildArrows(width);
    this.buildBack(width / 2);
    const hint = new InputHint(scene, width / 2, L.hintY, [
      'navigate', { text: 'ESCOLHER' },
      'confirm', { text: 'JOGAR' },
      'back', { text: 'VOLTAR' },
    ], { glyphHeight: 22, fontSize: 10, color: T.hint, align: 'center' });
    this.container.add(hint.container);

    // Começa já na posição final (sem animar a abertura da tela)
    const widths = this.targetWidths();
    this.panels.forEach((p, i) => (p.w = widths[i]));
    this.layout();
    this.showBackgroundArt(true);

    this.onUpdate = (_t, delta) => this.tick(delta);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    this.container.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate));
  }

  /** Teclado e controle (a cena repassa as setas, confirmar e cancelar). */
  public nav(action: ChapterNavAction): void {
    if (action === 'confirm') {
      if (this.backFocused) this.close();
      else this.tryPlay(this.focus);
      return;
    }
    if (action === 'down') return this.setBackFocused(true);
    if (action === 'up') return this.setBackFocused(false);
    if (this.backFocused) return;
    this.step(action === 'left' ? -1 : 1);
  }

  public close(): void {
    SoundManager.getInstance().playMenuClick();
    this.opts.onClose();
  }

  // ---------------------------------------------------------------------------
  // Peças de arte
  // ---------------------------------------------------------------------------

  private has(piece: ChapterUiPiece): boolean {
    return this.scene.textures.exists(chapterUiKey(piece));
  }

  private image(piece: ChapterUiPiece): Phaser.GameObjects.Image | undefined {
    return this.has(piece) ? this.scene.add.image(0, 0, chapterUiKey(piece)) : undefined;
  }

  private nineSlice(piece: ChapterUiPiece, l: number, r: number, t: number, b: number): Phaser.GameObjects.NineSlice | undefined {
    if (!this.useNineSlice || !this.has(piece)) return undefined;
    return this.scene.add.nineslice(0, 0, chapterUiKey(piece), undefined, 100, 100, l, r, t, b);
  }

  // ---------------------------------------------------------------------------
  // Montagem
  // ---------------------------------------------------------------------------

  /** Arte do capítulo em foco atrás de tudo, cobrindo a tela, com sombra em cima e embaixo. */
  private buildBackgroundArt(width: number, height: number): void {
    const s = this.scene;
    this.bgArt = s.add.image(width / 2, height / 2, '__DEFAULT').setAlpha(0).setVisible(false);
    this.container.add(this.bgArt);
    const shade = s.add.graphics();
    const steps = 8;
    for (let k = 0; k < steps; k++) {
      const a = 0.85 * (1 - k / steps);
      shade.fillStyle(T.backdrop, a);
      shade.fillRect(0, (height * 0.2 * k) / steps, width, (height * 0.2) / steps + 1);
      shade.fillRect(0, height - (height * 0.24 * (k + 1)) / steps, width, (height * 0.24) / steps + 1);
    }
    this.container.add(shade);
  }

  private buildTitle(cx: number): void {
    const s = this.scene;
    const text = s.add.text(cx, L.titleY, 'ESCOLHA O CAPÍTULO', {
      fontFamily: FONTS.body, fontSize: '17px', fontStyle: 'bold', color: T.title, stroke: T.textStroke, strokeThickness: 4,
    }).setOrigin(0.5);
    const plaque = this.image('title-plaque');
    if (plaque) {
      // Do tamanho do nome (dono): a parte reta da placa ocupa ~76% da largura (o resto são as
      // pontas), então ela fica com o texto + margem dividido por isso
      const width = (text.width + L.titlePadX) / TITLE_PLAQUE_FLAT;
      plaque.setScale(width / plaque.width).setPosition(cx, L.titleY);
      // O caveirão com asas ocupa o topo da placa: o texto fica na parte reta, mais embaixo
      text.setY(L.titleY + plaque.displayHeight * 0.13);
      this.container.add(plaque);
    } else if (s.textures.exists('ui-pause-title')) {
      this.container.add(s.add.image(cx, L.titleY, 'ui-pause-title').setDisplaySize(380, 80));
    }
    this.container.add(text);
  }

  private buildPanel(info: ChapterInfo, state: ChapterState, index: number): Panel {
    const s = this.scene;
    const playable = isPlayable(state);
    const bg = s.add.graphics();
    this.container.add(bg);

    // Arte: a de fundo do capítulo, a parede "em breve" ou o sprite do chefe (provisório)
    let art: Phaser.GameObjects.Image | undefined;
    let artMode: Panel['artMode'] = 'cover';
    let artScale = 1;
    const artKey = info.art ? `chapter-art-${info.number}` : undefined;
    if (artKey && s.textures.exists(artKey)) {
      art = s.add.image(0, 0, artKey);
    } else if (state === 'coming-soon' && this.has('coming-soon-bg')) {
      art = this.image('coming-soon-bg');
    } else if (info.fallbackSprite && s.textures.exists(info.fallbackSprite)) {
      art = s.add.image(0, 0, info.fallbackSprite).setOrigin(0.5, 1);
      artMode = 'sprite';
    }
    if (art) {
      artScale = artMode === 'cover'
        ? Math.max(this.openW / art.width, L.panelH / art.height)
        : Math.max(1, Math.floor((L.panelH * 0.6) / art.height));
      art.setScale(artScale);
      if (!playable && state !== 'coming-soon') this.greyOut(art);
      this.container.add(art);
    }

    const band = s.add.graphics();
    this.container.add(band);
    // Atrás da placa de texto: as correntes passam por baixo dela e aparecem nos cantos de baixo
    const chains = state === 'coming-soon' ? this.buildChains() : undefined;
    // "Em breve" fica sem a placa de texto (o enfeite dourado não combina com o capítulo
    // fechado; decisão do dono): o texto fica sobre a sombra de baixo do painel
    const textPanel = state === 'coming-soon'
      ? undefined
      : this.nineSlice('text-panel', TEXT_PANEL.left, TEXT_PANEL.right, TEXT_PANEL.top, TEXT_PANEL.bottom);
    if (textPanel) {
      textPanel.setOrigin(0.5, 0).setScale(TEXT_PANEL.scale);
      this.container.add(textPanel);
    }

    const frameKey = playable ? 'frame-normal' : 'frame-locked';
    const frameArt = this.nineSlice(
      frameKey as ChapterUiPiece,
      FRAME.inset, FRAME.inset, FRAME.inset,
      frameKey === 'frame-locked' ? FRAME.inset + FRAME.lockedChainsPx : FRAME.inset
    );
    if (frameArt) {
      frameArt.setOrigin(0, 0).setScale(FRAME.scale);
      this.container.add(frameArt);
    }
    const frameG = s.add.graphics();
    this.container.add(frameG);

    const badge = this.image(playable ? 'badge-unlocked' : 'badge-locked');
    if (badge) {
      badge.setScale(46 / badge.height);
      this.container.add(badge);
    }
    const numeral = s.add.text(0, 0, info.numeral, {
      fontFamily: FONTS.body, fontSize: info.numeral.length > 2 ? '12px' : '15px', fontStyle: 'bold',
      color: playable ? T.numeral : T.numeralLocked, stroke: T.textStroke, strokeThickness: 4,
    }).setOrigin(0.5);
    this.container.add(numeral);

    const padlock = !playable ? this.image('padlock') : undefined;
    if (padlock) this.container.add(padlock);
    const lockG = s.add.graphics();
    this.container.add(lockG);

    const seal = state === 'cleared' ? this.image('cleared-seal') : undefined;
    if (seal) this.container.add(seal);

    // Conteúdo do painel aberto
    const open = s.add.container(0, 0);
    const ribbon = this.image('heading-ribbon')?.setOrigin(0.5, RIBBON_BAND_CENTER);
    if (ribbon && !playable) this.greyOut(ribbon, true);
    const heading = s.add.text(0, 0, `CAPÍTULO ${info.numeral}`, {
      fontFamily: FONTS.body, fontSize: '17px', fontStyle: 'bold',
      color: playable ? T.titleFocus : T.lockedText, stroke: T.textStroke, strokeThickness: 5,
    }).setOrigin(0.5);
    // Não lançado: o "EM BREVE" já fica na placa de baixo
    const title = s.add.text(0, 0, info.released ? info.title : '???', {
      fontFamily: FONTS.body, fontSize: '15px', fontStyle: 'bold',
      color: playable ? T.title : T.lockedText, stroke: T.textStroke, strokeThickness: 4, align: 'center',
    }).setOrigin(0.5, 0);
    const boss = s.add.text(0, 0, info.released ? `CHEFE: ${info.boss}` : '', {
      fontFamily: FONTS.body, fontSize: '10px', fontStyle: 'bold',
      color: playable ? T.boss : T.lockedText, stroke: T.textStroke, strokeThickness: 3, align: 'center',
    }).setOrigin(0.5, 0);
    const summary = s.add.text(0, 0, this.summaryFor(info, state), {
      fontFamily: FONTS.body, fontSize: '10px', color: playable ? T.summary : T.lockedText,
      stroke: T.textStroke, strokeThickness: 3, align: 'center', lineSpacing: 5,
    }).setOrigin(0.5, 0);
    const plate = this.image('best-time-plate');
    if (plate && !playable) this.greyOut(plate, true);
    const hourglass = plate ? this.image('hourglass') : undefined;
    if (hourglass && !playable) this.greyOut(hourglass, true);
    const footer = s.add.text(0, 0, this.footerText(state, this.opts.records[info.number]), {
      fontFamily: FONTS.body, fontSize: '12px', fontStyle: 'bold',
      color: playable ? T.bestValue : T.lockedText, stroke: T.textStroke, strokeThickness: 3,
    }).setOrigin(0.5);
    open.add([...(ribbon ? [ribbon] : []), heading, title, boss, summary, ...(plate ? [plate] : []), ...(hourglass ? [hourglass] : []), footer]);
    this.container.add(open);

    const zone = s.add.zone(0, 0, 10, 10).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.container.add(zone);
    zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.wasTouch) this.setFocus(index);
    });
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Toque: o primeiro foca, o segundo joga. Mouse: já focou ao passar por cima.
      if (pointer.wasTouch && this.focus !== index) this.setFocus(index);
      else this.tryPlay(index);
    });

    return {
      info, state, record: this.opts.records[info.number], x: 0, w: L.minClosedW, bg, art, artMode, artScale,
      band, textPanel, frameArt, frameKey, frameG, badge, numeral, padlock, lockG, chains, seal,
      open, ribbon, heading, title, boss, summary, plate, hourglass, footer, zone, shakeMs: 0,
    };
  }

  private buildChains(): Panel['chains'] {
    if (!this.has('chain-strip')) return undefined;
    const s = this.scene;
    // Altura da faixa = altura da arte (os elos inteiros); a largura é ajustada por quadro
    const src = s.textures.get(chapterUiKey('chain-strip')).getSourceImage() as { width: number; height: number };
    const strip = (): Phaser.GameObjects.TileSprite => {
      const t = s.add.tileSprite(0, 0, src.width, src.height, chapterUiKey('chain-strip')).setScale(CHAINS.scale);
      this.container.add(t);
      return t;
    };
    const a = strip();
    const b = strip();
    const lock = this.image('chain-lock');
    if (lock) {
      lock.setScale(CHAINS.lockH / lock.height);
      this.container.add(lock);
    }
    return { a, b, lock };
  }

  /** Setas douradas nas laterais: mostram que dá para andar e funcionam no clique/toque. */
  private buildArrows(width: number): void {
    const y = L.top + L.panelH / 2;
    for (const dir of [-1, 1] as const) {
      const x = dir < 0 ? L.sideMargin / 2 : width - L.sideMargin / 2;
      const arrow = this.image('arrow');
      if (!arrow) continue;
      arrow.setScale(L.arrowW / arrow.width).setFlipX(dir < 0).setPosition(x, y);
      this.container.add(arrow);
      this.scene.tweens.add({ targets: arrow, x: x + dir * 5, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      arrow.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.step(dir));
    }
    this.container.once(Phaser.GameObjects.Events.DESTROY, () => this.scene.tweens.killTweensOf(this.container.list));
  }

  private buildBack(cx: number): void {
    const s = this.scene;
    const normal = this.image('button-normal');
    const selected = this.image('button-selected');
    for (const b of [normal, selected]) b?.setPosition(cx, L.backY).setDisplaySize(L.backW, L.backH);
    const fallback = !normal && s.textures.exists('ui-pause-btn-menu') ? s.add.image(cx, L.backY, 'ui-pause-btn-menu').setDisplaySize(200, 54) : undefined;
    const txt = s.add.text(cx, L.backY, 'VOLTAR', {
      fontFamily: FONTS.body, fontSize: '16px', fontStyle: 'bold', color: T.title, stroke: T.textStroke, strokeThickness: 4,
    }).setOrigin(0.5);
    const outline = s.add.graphics();
    this.container.add([...[normal, selected, fallback].filter((o): o is Phaser.GameObjects.Image => !!o), outline, txt]);
    this.renderBack = (focused) => {
      txt.setColor(focused ? T.titleFocus : T.title);
      normal?.setVisible(!focused || !selected);
      selected?.setVisible(focused);
      outline.clear();
      if (focused && !selected) drawPixelOutline(outline, cx - 108, L.backY - 35, 216, 70, T.panelBorderFocus, 1, L.px);
    };
    const zone = s.add.zone(cx, L.backY, L.backW, L.backH).setInteractive({ useHandCursor: true });
    this.container.add(zone);
    zone.on('pointerover', () => this.setBackFocused(true));
    zone.on('pointerdown', () => this.close());
    this.renderBack(false);
  }

  /** Apagado e cinza (WebGL: filtro de cinza; Canvas: tinta escura). `light` = só cinza, sem apagar. */
  private greyOut(img: Phaser.GameObjects.Image, light = false): void {
    const fx = (img as Phaser.GameObjects.Image & { preFX?: Phaser.GameObjects.Components.FX | null }).preFX;
    if (fx) {
      fx.addColorMatrix().grayscale(1);
      if (!light) img.setAlpha(0.42);
    } else {
      img.setTint(T.lockedTint).setAlpha(light ? 1 : 0.5);
    }
  }

  private summaryFor(info: ChapterInfo, state: ChapterState): string {
    if (state === 'coming-soon') return 'ESTE CAPÍTULO AINDA ESTÁ SENDO FORJADO NAS PROFUNDEZAS.';
    if (state === 'locked') {
      const prev = CHAPTERS.find((c) => c.number === info.number - 1);
      return `VENÇA O CAPÍTULO ${prev?.numeral ?? ''} PARA LIBERAR.`;
    }
    return info.summary;
  }

  private footerText(state: ChapterState, record?: ChapterRecord): string {
    if (state === 'coming-soon') return 'EM BREVE';
    if (state === 'locked') return 'BLOQUEADO';
    return `MELHOR TEMPO  ${formatBestTime(record?.bestTimeSec ?? 0)}`;
  }

  // ---------------------------------------------------------------------------
  // Foco e ações
  // ---------------------------------------------------------------------------

  private step(dir: number): void {
    this.setBackFocused(false, true);
    this.setFocus((this.focus + dir + this.panels.length) % this.panels.length);
  }

  private setFocus(index: number): void {
    if (index === this.focus && !this.backFocused) return;
    this.focus = index;
    this.setBackFocused(false, true);
    this.showBackgroundArt();
    SoundManager.getInstance().playMenuHover();
  }

  private setBackFocused(focused: boolean, silent = false): void {
    if (focused === this.backFocused) return;
    this.backFocused = focused;
    this.renderBack(focused);
    this.lastFocusDrawn = -1;
    if (!silent) SoundManager.getInstance().playMenuHover();
  }

  private tryPlay(index: number): void {
    const p = this.panels[index];
    if (!isPlayable(p.state)) {
      p.shakeMs = 260;
      SoundManager.getInstance().playMenuHover();
      return;
    }
    SoundManager.getInstance().playMenuClick();
    this.opts.onPlay(p.info.number);
  }

  private showBackgroundArt(instant = false): void {
    const img = this.bgArt;
    if (!img) return;
    const p = this.panels[this.focus];
    const key = p?.info.art ? `chapter-art-${p.info.number}` : '';
    if (key === this.bgArtKey) return;
    this.bgArtKey = key;
    const s = this.scene;
    s.tweens.killTweensOf(img);
    if (!key || !s.textures.exists(key)) {
      s.tweens.add({ targets: img, alpha: 0, duration: instant ? 0 : L.bgFadeMs, onComplete: () => img.setVisible(false) });
      return;
    }
    const { width, height } = s.scale;
    img.setTexture(key).setVisible(true).setAlpha(0);
    img.setScale(Math.max(width / img.width, height / img.height));
    // Capítulo bloqueado: fundo também cinza
    const fx = (img as Phaser.GameObjects.Image & { preFX?: Phaser.GameObjects.Components.FX | null }).preFX;
    fx?.clear();
    if (!isPlayable(p.state)) {
      if (fx) fx.addColorMatrix().grayscale(1);
      else img.setTint(T.lockedTint);
    } else {
      img.clearTint();
    }
    s.tweens.add({ targets: img, alpha: isPlayable(p.state) ? L.bgArtAlpha : L.bgArtAlpha * 0.5, duration: instant ? 0 : L.bgFadeMs });
  }

  // ---------------------------------------------------------------------------
  // Animação e desenho
  // ---------------------------------------------------------------------------

  private targetWidths(): number[] {
    return accordionWidths(this.panels.length, this.focus, this.regionW, L.gap, this.openW, L.minClosedW);
  }

  private tick(delta: number): void {
    const widths = this.targetWidths();
    const k = Math.min(1, (L.ease * delta) / 1000);
    let moving = false;
    this.panels.forEach((p, i) => {
      const diff = widths[i] - p.w;
      if (Math.abs(diff) > 0.5) {
        p.w += diff * k;
        moving = true;
      } else {
        p.w = widths[i];
      }
      if (p.shakeMs > 0) {
        p.shakeMs = Math.max(0, p.shakeMs - delta);
        moving = true;
      }
    });
    if (moving || this.lastFocusDrawn !== this.focus) this.layout();
  }

  private layout(): void {
    this.lastFocusDrawn = this.focus;
    const closedW = this.targetWidths().find((_, i) => i !== this.focus) ?? L.minClosedW;
    let x = this.regionLeft;
    this.panels.forEach((p, i) => {
      const shake = p.shakeMs > 0 ? Math.sin(p.shakeMs * 0.12) * 5 : 0;
      p.x = x + shake;
      this.drawPanel(p, i === this.focus && !this.backFocused, Phaser.Math.Clamp((p.w - closedW) / Math.max(1, this.openW - closedW), 0, 1));
      x += p.w + L.gap;
    });
  }

  private drawPanel(p: Panel, focused: boolean, openness: number): void {
    const x = Math.round(p.x);
    const y = L.top;
    const w = Math.round(p.w);
    const h = L.panelH;
    const cx = x + w / 2;
    const playable = isPlayable(p.state);

    p.bg.clear();
    p.bg.fillStyle(T.panelFill, 1);
    p.bg.fillRect(x, y, w, h);

    // Arte recortada pela largura atual do painel (sempre centrada nele)
    if (p.art) {
      const s = p.artScale;
      const texW = p.art.width;
      const texH = p.art.height;
      const cropW = Math.min(texW, w / s);
      const cropH = Math.min(texH, h / s);
      p.art.setCrop((texW - cropW) / 2, p.artMode === 'cover' ? (texH - cropH) / 2 : 0, cropW, cropH);
      p.art.setPosition(cx, p.artMode === 'cover' ? y + h / 2 : y + h * SPRITE_FEET_Y);
      if (p.artMode === 'sprite' && playable) p.art.setAlpha(0.55 + 0.45 * Math.max(openness, focused ? 1 : 0));
    }

    // Sombra de baixo (degraus de pixel) e faixa curta em cima para o número
    p.band.clear();
    const bandH = Math.round(h * (0.16 + 0.3 * openness));
    const steps = 6;
    for (let k = 0; k < steps; k++) {
      p.band.fillStyle(T.textBand, 0.2 + (0.55 * k) / steps);
      p.band.fillRect(x, Math.round(y + h - bandH + (bandH / steps) * k), w, Math.ceil(bandH / steps) + 1);
    }
    p.band.fillStyle(T.textBand, 0.5 * (1 - openness));
    p.band.fillRect(x, y, w, 64);

    this.drawFrame(p, x, y, w, h, focused);

    // Número no escudo (faixa fechada); some quando o painel abre e entra a fita com o título
    const closedAlpha = 1 - openness;
    p.badge?.setPosition(cx, y + 32).setAlpha(closedAlpha);
    p.numeral.setPosition(cx, y + 30).setAlpha(closedAlpha);
    p.seal?.setScale((openness > 0.5 ? 54 : 30) / (p.seal?.height ?? 1));
    p.seal?.setPosition(openness > 0.5 ? x + w - 34 : cx, openness > 0.5 ? y + 34 : y + 74);

    // Cadeado: no meio da faixa fechada; aberto, desce para cima da placa de texto
    const lockY = y + h * (0.46 + 0.1 * openness);
    const lockSize = 36 + 34 * openness;
    p.lockG.clear();
    if (!playable) {
      if (p.padlock) p.padlock.setScale(lockSize / p.padlock.width).setPosition(cx, lockY).setAlpha(p.chains ? closedAlpha : 1);
      else this.drawLock(p.lockG, cx, lockY, 1 + openness * 0.4);
    }
    // Correntes em X de canto a canto do "em breve" aberto (o cadeado delas substitui o solto)
    if (p.chains) this.layoutChains(p.chains, x, y, w, h, openness);

    // Conteúdo do painel aberto
    const contentAlpha = openness < 0.35 ? 0 : (openness - 0.35) / 0.65;
    p.open.setAlpha(contentAlpha).setVisible(openness > 0.35);
    p.textPanel?.setVisible(openness > 0.35).setAlpha(contentAlpha);
    if (openness > 0.35) this.layoutOpenContent(p, x, y, w, h, cx);

    p.zone.setPosition(x, y).setSize(w, h);
    if (p.zone.input) (p.zone.input.hitArea as Phaser.Geom.Rectangle).setSize(w, h);
  }

  private layoutChains(chains: NonNullable<Panel['chains']>, x: number, y: number, w: number, h: number, openness: number): void {
    const visible = openness > 0.05;
    const spanW = w - CHAINS.inset * 2;
    const spanH = h - CHAINS.inset * 2;
    const length = Math.hypot(spanW, spanH);
    const angle = Math.atan2(spanH, spanW);
    const cx = x + w / 2;
    const cy = y + h / 2;
    for (const [strip, rot] of [[chains.a, angle], [chains.b, -angle]] as const) {
      // Largura da faixa em unidades da textura (a escala reduz); centrada no meio do painel
      strip.setSize(length / CHAINS.scale, strip.height).setPosition(cx, cy).setRotation(rot);
      strip.setAlpha(openness).setVisible(visible);
    }
    chains.lock?.setPosition(cx, cy).setAlpha(openness).setVisible(visible);
  }

  private layoutOpenContent(p: Panel, x: number, y: number, w: number, h: number, cx: number): void {
    // Fita com "CAPÍTULO II" no topo
    // Texto e fita no mesmo ponto: a fita está ancorada no centro da faixa vermelha
    const ribbonW = Math.min(w - 40, 320);
    const headingY = y + 30;
    if (p.ribbon) p.ribbon.setScale(ribbonW / p.ribbon.width).setPosition(cx, headingY);
    p.heading.setPosition(cx, headingY);

    // Placa do melhor tempo embaixo, com a ampulheta dentro da barra e o texto depois dela
    const plateW = Math.min(w - 48, 270);
    const plateY = y + h - 30;
    if (p.plate) {
      p.plate.setScale(plateW / p.plate.width).setPosition(cx, plateY);
      if (p.hourglass) {
        p.hourglass.setScale((p.plate.displayHeight * HOURGLASS.heightFrac) / p.hourglass.height);
        p.hourglass.setPosition(cx - plateW / 2 + plateW * HOURGLASS.xFrac, plateY);
      }
    }
    p.footer.setPosition(cx + (p.hourglass ? plateW * 0.06 : 0), plateY);

    // Placa de texto: título, chefe e resumo, logo acima da placa do tempo
    const inner = Math.min(w - 56, 440);
    p.summary.setWordWrapWidth(inner);
    p.boss.setWordWrapWidth(inner);
    p.title.setWordWrapWidth(inner);
    const contentH = p.title.height + 6 + p.boss.height + 10 + p.summary.height;
    const panelH = contentH + 44;
    const panelTop = plateY - 30 - panelH;
    if (p.textPanel) {
      p.textPanel.setPosition(cx, panelTop).setSize((w - 20) / TEXT_PANEL.scale, panelH / TEXT_PANEL.scale);
    }
    p.title.setPosition(cx, panelTop + 28);
    p.boss.setPosition(cx, p.title.y + p.title.height + 6);
    p.summary.setPosition(cx, p.boss.y + p.boss.height + 10);
  }

  private drawFrame(p: Panel, x: number, y: number, w: number, h: number, focused: boolean): void {
    p.frameG.clear();
    const art = p.frameArt;
    if (art) {
      const wantKey = chapterUiKey((isPlayable(p.state) && focused ? 'frame-selected' : p.frameKey) as ChapterUiPiece);
      if (art.texture.key !== wantKey && this.scene.textures.exists(wantKey)) art.setTexture(wantKey);
      const chains = p.frameKey === 'frame-locked' ? FRAME.lockedChainsPx : 0;
      art.setPosition(x - FRAME.pad, y - FRAME.pad);
      art.setSize((w + FRAME.pad * 2) / FRAME.scale, (h + FRAME.pad * 2) / FRAME.scale + chains);
      // Fora de foco a moldura fica um pouco apagada; focada (até a de ferro) acende
      if (focused) art.clearTint();
      else art.setTint(T.frameIdleTint);
      return;
    }
    if (focused) {
      drawPixelOutline(p.frameG, x - 3 * L.px, y - 3 * L.px, w + 6 * L.px, h + 6 * L.px, T.panelGlowFocus, 0.35, L.px);
      drawPixelOutline(p.frameG, x - 2 * L.px, y - 2 * L.px, w + 4 * L.px, h + 4 * L.px, T.panelBorderFocus, 1, L.px);
    }
    drawPixelOutline(p.frameG, x - L.px, y - L.px, w + 2 * L.px, h + 2 * L.px, focused ? T.panelHighlight : T.panelBorder, 1, L.px);
  }

  /** Cadeado em pixel art (só se a peça `padlock` não carregou). */
  private drawLock(g: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number): void {
    const u = Math.round(4 * scale);
    g.fillStyle(T.panelShade, 0.85);
    g.fillRect(cx - 5 * u, cy - 6 * u, 10 * u, 13 * u);
    g.fillStyle(T.lockedTint, 1);
    g.fillRect(cx - 3 * u, cy - 5 * u, u, 4 * u);
    g.fillRect(cx + 2 * u, cy - 5 * u, u, 4 * u);
    g.fillRect(cx - 2 * u, cy - 6 * u, 4 * u, u);
    g.fillRect(cx - 4 * u, cy - u, 8 * u, 7 * u);
    g.fillStyle(T.panelShade, 1);
    g.fillRect(cx - u / 2, cy + u, u, 3 * u);
  }
}

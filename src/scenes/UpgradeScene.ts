import Phaser from 'phaser';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { getAvailableUpgrades, getAltarEvolutionCards, C_WHITE, C_WEAPON, CARD_ICON_KEYS } from '../systems/UpgradeCatalog';
import { shouldAutoCloseAltarScreen } from '../systems/altarRules';
import { COLORS, ACTION_BUTTON_THEME, PICK_LOCK_BAR_THEME, CARD_FOCUS_THEME, CARD_RARITY_THEME } from '../config/theme';
import { ActionKeyButton } from '../ui/ActionKeyButton';
import { InputHint } from '../ui/InputHint';
import type { UpgradeCard, RichTextSegment, UpgradeGameScene } from '../systems/UpgradeCatalog';
export type { UpgradeCard, RichTextSegment } from '../systems/UpgradeCatalog';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { UPGRADE_SKIP_BALANCE } from '../config/balance';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import { getSkipLockRemainingMs, getPickLockRemainingMs, formatSkipLockBadge } from '../systems/UpgradeSkipLock';
import { drawPixelFrame } from '../ui/pixelFrame';

/** Cena de jogo que abriu a tela de cartas: além das armas, sinaliza a reabertura da fila de níveis. */
export type UpgradeHostScene = UpgradeGameScene & { isUpgradeSceneOpening?: boolean; survivalTimeMs?: number };

export interface UpgradeSceneData {
  player: BaseCharacter;
  gameScene: UpgradeHostScene;
  isAltar?: boolean;
  onAltarChosen?: () => void;
}

export class UpgradeScene extends Phaser.Scene {
  private player!: BaseCharacter;
  private gameScene!: UpgradeHostScene;
  private isAltar: boolean = false;
  private onAltarChosen?: () => void;
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private currentCardIds: string[] = [];
  private selectedCardIndex: number = 0;
  private rerollButton?: ActionKeyButton;
  private skipButton?: ActionKeyButton;
  private isClosing: boolean = false;
  /** Quando a tela abriu (relógio do jogo): base da trava do CANALIZAR. */
  private openedAtMs: number = 0;
  /** Barrinha sob o título que enche durante a trava de escolher carta; some ao liberar. */
  private pickLockBar?: Phaser.GameObjects.Graphics;

  public getCardContainers(): Phaser.GameObjects.Container[] {
    return this.cardContainers;
  }

  public getIsClosing(): boolean {
    return this.isClosing;
  }

  public getPlayer(): BaseCharacter {
    return this.player;
  }

  public getGameScene(): UpgradeHostScene {
    return this.gameScene;
  }

  public getIsAltar(): boolean {
    return this.isAltar;
  }

  private readonly cardFont = "'Pixelzone', 'Silkscreen', monospace";
  private readonly uiFont = "'Silkscreen', 'Press Start 2P', monospace";

  constructor() {
    super('UpgradeScene');
  }

  create(data: UpgradeSceneData): void {
    this.player = data.player;
    this.gameScene = data.gameScene;
    if (this.gameScene && typeof this.gameScene.isUpgradeSceneOpening !== 'undefined') {
      this.gameScene.isUpgradeSceneOpening = false;
    }
    this.isAltar = !!data.isAltar;
    this.onAltarChosen = data.onAltarChosen;
    this.cardContainers = [];
    this.currentCardIds = [];
    this.isClosing = false;
    // A cena é reaproveitada: botões da abertura anterior (level up) já foram destruídos.
    // Sem zerar, a tela do altar (que não cria botões) tentava pintar o botão morto no
    // primeiro quadro, quebrava e o jogo ficava pausado atrás do clarão do altar.
    this.rerollButton = undefined;
    this.skipButton = undefined;
    // Relógio do jogo, não da cena: o da cena começa em 0 (ou parado no último valor)
    // até o primeiro quadro, e a trava parecia já vencida na primeira abertura
    this.openedAtMs = this.game.loop.time;

    // Toca fanfarra viciante estilo Cassino / Arcade Slot ao abrir as cartas
    SoundManager.getInstance().playCasinoLevelUp();

    const { width, height } = this.scale;

    // 1. Overlay sombrio de fundo com vinheta dramática
    const overlay = this.add.graphics();
    overlay.fillStyle(0x060205, 0.86);
    overlay.fillRect(0, 0, width, height);

    // Faixas diagonais sutis no fundo
    overlay.fillStyle(0x1c040d, 0.4);
    overlay.beginPath();
    overlay.moveTo(0, height * 0.18);
    overlay.lineTo(width, height * 0.08);
    overlay.lineTo(width, height * 0.36);
    overlay.lineTo(0, height * 0.46);
    overlay.closePath();
    overlay.fill();

    overlay.beginPath();
    overlay.moveTo(0, height * 0.64);
    overlay.lineTo(width, height * 0.54);
    overlay.lineTo(width, height * 0.84);
    overlay.lineTo(0, height * 0.94);
    overlay.closePath();
    overlay.fill();

    // 2. Banner de Título Superior
    const titleY = 46;
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x080206, 0.95);
    titleBox.fillRoundedRect(width / 2 - 270, titleY - 20, 540, 40, 6);
    titleBox.lineStyle(2, this.isAltar ? 0xff4500 : 0xc59b27, 1);
    titleBox.strokeRoundedRect(width / 2 - 270, titleY - 20, 540, 40, 6);

    const titleText = this.isAltar
      ? 'ALTAR DOS ANCESTRAIS // ASCENSÃO SUPREMA'
      : 'LEVEL UP! // ESCOLHA SUA CARTA';
    const titleColor = this.isAltar ? '#ffe600' : '#f3d17a';

    this.add.text(width / 2, titleY, titleText, {
      fontFamily: this.uiFont,
      fontSize: '14px',
      fontStyle: 'bold',
      color: titleColor,
      stroke: '#2b0914',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 2.1. Barrinha da trava de escolha (aperto acidental ao subir de nível não escolhe carta)
    this.pickLockBar = this.add.graphics().setDepth(5);
    this.drawPickLockBar();

    // 3. Renderização das Cartas Flutuantes
    this.dealCards(false);

    // Rede de segurança: tela do altar sem carta nenhuma não tem como fechar; devolve o jogo
    if (shouldAutoCloseAltarScreen(this.isAltar, this.cardContainers.length)) {
      this.onAltarChosen?.();
      this.time.delayedCall(0, () => {
        this.scene.stop('UpgradeScene');
        this.gameScene.scene.resume();
        this.gameScene.physics.resume();
      });
      return;
    }

    // 4. Barra Tática Inferior: Botões de Re-rolar e Pular (apenas no Level-Up)
    this.createTacticalFooter(width, height);

    // 5. Atalhos de Teclado (R para Re-rolar, Espaço para Canalizar/Skip)
    const onKeyDownR = () => {
      this.handleReroll();
    };
    // Espaço também é a esquiva no combate: tecla presa é ignorada, e a trava de tempo
    // fica em handleSkipAndHeal (vale para teclado, clique e controle)
    const onKeyDownSpace = (event?: KeyboardEvent) => {
      if (event?.repeat) return;
      this.handleSkipAndHeal();
    };

    if (!this.isAltar && this.input.keyboard) {
      this.input.keyboard.on('keydown-R', onKeyDownR);
      this.input.keyboard.on('keydown-SPACE', onKeyDownSpace);
    }

    // 6. Limpeza no Desligamento da Cena (DEC-006 / Anti-Leak)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input.keyboard) {
        this.input.keyboard.off('keydown-R', onKeyDownR);
        this.input.keyboard.off('keydown-SPACE', onKeyDownSpace);
        this.input.keyboard.removeAllListeners();
      }
    });
  }

  private dealCards(isReroll: boolean): void {
    const { width, height } = this.scale;

    for (const c of this.cardContainers) {
      c.destroy();
    }
    this.cardContainers = [];

    let chosenCards: UpgradeCard[];
    if (this.isAltar) {
      const availableCards = UpgradeScene.getAltarEvolutionCards(this.player, this.gameScene);
      const shuffled = [...availableCards].sort(() => 0.5 - Math.random());
      chosenCards = shuffled.slice(0, Math.min(3, shuffled.length));
    } else {
      const availableCards = this.getAvailableCards();
      chosenCards = this.pickRandomCards(availableCards, 3, isReroll ? this.currentCardIds : []);
    }
    this.currentCardIds = chosenCards.map((c) => c.id);

    // Cada carta 120x200 escalada em 2.2x = 264x440
    const cardScale = 2.2;
    const cardW = Math.round(120 * cardScale); // 264px
    const cardH = Math.round(200 * cardScale); // 440px
    const spacing = 52;
    const totalW = chosenCards.length * cardW + (chosenCards.length - 1) * spacing;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const cardY = Math.round(height / 2 + 2);

    chosenCards.forEach((card, index) => {
      const cx = Math.round(startX + index * (cardW + spacing));
      this.createCard(cx, cardY, cardW, cardH, cardScale, card, index);
    });

    this.selectedCardIndex = 0;
    if (this.cardContainers[0]) {
      this.cardContainers[0].emit('pointerover');
    }
  }

  private createTacticalFooter(width: number, height: number): void {
    const footerY = height - 36;

    if (this.isAltar) {
      new InputHint(this, width / 2, footerY, ['pick', { text: 'ESCOLHA UMA CARTA PARA DESPERTAR SEU PODER MÁXIMO' }], {
        glyphHeight: 28,
        fontSize: 11,
        color: COLORS.goldTextAccent,
        align: 'center',
      });
      return;
    }

    // Botões minimalistas: ícone, nome e a tecla do controle em uso (atualizada em update)
    this.rerollButton = new ActionKeyButton(this, {
      x: width / 2 - 158,
      y: footerY,
      width: 296,
      height: 46,
      iconKey: 'ui-icon-reroll',
      label: 'RE-ROLAR',
      badge: `${this.player.rerollsRemaining}`,
      badgeColor: ACTION_BUTTON_THEME.count,
      action: 'reroll',
      onHover: () => SoundManager.getInstance().playCardHover(),
      onClick: () => this.handleReroll()
    });
    this.skipButton = new ActionKeyButton(this, {
      x: width / 2 + 158,
      y: footerY,
      width: 296,
      height: 46,
      iconKey: 'ui-icon-skip',
      label: 'CANALIZAR',
      badge: `+${Math.round(UPGRADE_SKIP_BALANCE.healFractionOfMaxHp * 100)}%`,
      badgeColor: ACTION_BUTTON_THEME.heal,
      action: 'channel',
      onHover: () => SoundManager.getInstance().playCardHover(),
      onClick: () => this.handleSkipAndHeal()
    });
    this.updateRerollButtonVisual();
    this.updateSkipButtonVisual();
  }

  private get skipLockRemainingMs(): number {
    return getSkipLockRemainingMs(this.openedAtMs, this.game.loop.time);
  }

  private get pickLockRemainingMs(): number {
    return getPickLockRemainingMs(this.openedAtMs, this.game.loop.time);
  }

  /** Enche da esquerda para a direita durante a trava; ao liberar, some. */
  private drawPickLockBar(): void {
    const bar = this.pickLockBar;
    if (!bar || !bar.visible) return;
    const remaining = this.pickLockRemainingMs;
    if (remaining <= 0) {
      bar.setVisible(false);
      return;
    }
    const w = 240;
    const h = 16;
    const x = Math.round(this.scale.width / 2 - w / 2);
    const y = 74;
    const px = 4;
    const progress = 1 - remaining / UPGRADE_SKIP_BALANCE.pickLockMs;
    bar.clear();
    drawPixelFrame(bar, x, y, w, h, { fill: PICK_LOCK_BAR_THEME.track, border: PICK_LOCK_BAR_THEME.border, px });
    // Enche em passos de 4 px para manter a cara de pixel art
    const innerW = w - 4 * px;
    const filled = Math.floor((innerW * progress) / px) * px;
    if (filled > 0) {
      bar.fillStyle(PICK_LOCK_BAR_THEME.fill, 1);
      bar.fillRect(x + 2 * px, y + px, filled, h - 2 * px);
    }
  }

  /** Travado: botão apagado com a contagem no lugar da cura. Liberado: volta a mostrar a cura. */
  private updateSkipButtonVisual(): void {
    if (!this.skipButton) return;
    const remaining = this.skipLockRemainingMs;
    this.skipButton.setEnabled(remaining <= 0);
    this.skipButton.setBadge(remaining > 0
      ? formatSkipLockBadge(remaining)
      : `+${Math.round(UPGRADE_SKIP_BALANCE.healFractionOfMaxHp * 100)}%`);
  }

  private updateRerollButtonVisual(): void {
    const charges = this.player.rerollsRemaining;
    this.rerollButton?.setBadge(`${charges}`);
    this.rerollButton?.setEnabled(charges > 0 && this.pickLockRemainingMs <= 0);
  }
  private handleReroll(): void {
    if (this.isClosing || this.player.rerollsRemaining <= 0 || this.pickLockRemainingMs > 0) return;
    this.player.rerollsRemaining--;
    SoundManager.getInstance().playCasinoLevelUp();
    this.updateRerollButtonVisual();
    this.dealCards(true);
  }

  private handleSkipAndHeal(): void {
    if (this.isClosing || this.skipLockRemainingMs > 0) return;
    this.isClosing = true;
    SoundManager.getInstance().playMenuClick();
    this.player.heal(this.player.maxHp * UPGRADE_SKIP_BALANCE.healFractionOfMaxHp);
    this.time.delayedCall(100, () => {
      this.scene.stop('UpgradeScene');
      this.gameScene.scene.resume();
      if (!this.player || this.player.pendingLevelUps <= 0) {
        this.gameScene.physics.resume();
      }
    });
  }

  public static getAvailableUpgrades(player: BaseCharacter, gameScene: UpgradeGameScene): UpgradeCard[] {
    return getAvailableUpgrades(player, gameScene);
  }

  public static getAltarEvolutionCards(player: BaseCharacter, gameScene: UpgradeGameScene): UpgradeCard[] {
    return getAltarEvolutionCards(player, gameScene);
  }

  private getAvailableCards(): UpgradeCard[] {
    return UpgradeScene.getAvailableUpgrades(this.player, this.gameScene);
  }

  private pickRandomCards(cards: UpgradeCard[], count: number, excludeIds: string[] = []): UpgradeCard[] {
    const evolutions = cards.filter((c) => c.isEvolution && !excludeIds.includes(c.id));
    const regularPool = cards.filter((c) => !c.isEvolution && !excludeIds.includes(c.id));
    const fallbackPool = cards.filter((c) => !c.isEvolution);

    const poolToUse = regularPool.length >= count ? regularPool : fallbackPool;
    const shuffled = [...poolToUse].sort(() => 0.5 - Math.random());

    if (evolutions.length > 0) {
      const chosenEvo = Phaser.Math.RND.pick(evolutions);
      return [chosenEvo, ...shuffled.slice(0, count - 1)];
    }

    return shuffled.slice(0, count);
  }

  /** A carta selecionada fica com a cor cheia; as outras, levemente escurecidas. */
  private applyCardFocusTint(): void {
    this.cardContainers.forEach((c, i) => {
      const frame = c.getData('frameSprite') as Phaser.GameObjects.Image | undefined;
      if (!frame) return;
      if (i === this.selectedCardIndex) frame.clearTint();
      else frame.setTint(CARD_FOCUS_THEME.unfocusedTint);
    });
  }

  /**
   * Constrói uma carta usando as molduras em pixel-art (120x200px escaladas)
   * com a fonte Pixelzone, brilho traseiro, flutuação e explosão de cash ao clicar.
   */
  private createCard(
    x: number,
    y: number,
    w: number,
    h: number,
    cardScale: number,
    card: UpgradeCard,
    index: number
  ): void {
    // Container raiz posicionado na coluna da carta
    const rootContainer = this.add.container(x, y + 70);
    rootContainer.setAlpha(0);
    rootContainer.setScale(0.75);
    rootContainer.setData('upgradeCard', card);
    this.cardContainers.push(rootContainer);

    // Sub-container interno dedicado à flutuação contínua
    const floatContainer = this.add.container(0, 0);
    rootContainer.add(floatContainer);

    // Animação de entrada estilo cassino (cascata elástica)
    this.tweens.add({
      targets: rootContainer,
      y: y,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: index * 90,
      ease: 'Back.easeOut'
    });

    // Tween infinito de levitação / flutuação suave
    const floatTween = this.tweens.add({
      targets: floatContainer,
      y: -8,
      duration: 1300 + index * 190,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Balanço da carta selecionada (~1,7 graus para cada lado)
    const SWAY_RAD = 0.03;
    let swayTween: Phaser.Tweens.Tween | undefined;
    let frameGlow: Phaser.GameObjects.Image | undefined;
    let glowTween: Phaser.Tweens.Tween | undefined;

    const glowColor = card.glowColor ?? card.badgeColor ?? 0xfacc15;

    // 1. Moldura da raridade (textura 240x400 = o dobro da unidade 120x200, por isso cardScale / 2 -> 264x440)
    // Sem formas semitransparentes ou bordas brancas atrás, destacando a arte da moldura
    const rarity = CARD_RARITY_THEME[card.rarity];
    const spriteKey = rarity.frame;
    const frameScale = cardScale / 2;

    if (this.textures.exists(spriteKey)) {
      const cardSprite = this.add.image(0, 0, spriteKey);
      cardSprite.setScale(frameScale);
      floatContainer.add(cardSprite);
      rootContainer.setData('frameSprite', cardSprite);
      // Cópia somada por cima: acende e apaga quando a carta está selecionada (tint não clareia além do original)
      frameGlow = this.add.image(0, 0, spriteKey).setScale(frameScale).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      floatContainer.add(frameGlow);
    } else {
      // Fallback caso alguma textura ainda não tenha carregado
      const fallbackBg = this.add.graphics();
      fallbackBg.fillStyle(0x16061c, 0.96);
      fallbackBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      fallbackBg.lineStyle(3, glowColor, 1);
      fallbackBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      floatContainer.add(fallbackBg);
    }

    // Largura interna segura: a janela mais estreita é a da Suprema (~128px na tela, entre as asas)
    const SAFE_INNER_WIDTH = 120;

    // =========================================================================
    // JANELA SUPERIOR DA CARTA (Y entre -117px e -14px nas 5 molduras)
    // Contém: RARIDADE no topo superior + NOME DA CARTA central ampliado + NÍVEL discreto abaixo
    // =========================================================================
    const rarityText = this.add.text(0, -100, rarity.label, {
      fontFamily: this.cardFont,
      fontSize: '24px',
      color: rarity.text,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    rarityText.setResolution(2);
    if (rarityText.width > SAFE_INNER_WIDTH) {
      rarityText.setScale(SAFE_INNER_WIDTH / rarityText.width);
    }
    floatContainer.add(rarityText);

    const cardTitleStr = (card.cardName || card.icon || card.title).toUpperCase();
    const cardTitleCol = card.cardNameColor || C_WEAPON;

    const nameText = this.add.text(0, -62, cardTitleStr, {
      fontFamily: this.cardFont,
      fontSize: '38px',
      color: cardTitleCol,
      stroke: '#000000',
      strokeThickness: 4.5,
      align: 'center'
    }).setOrigin(0.5);
    nameText.setResolution(2);
    if (nameText.width > SAFE_INNER_WIDTH) {
      nameText.setScale(SAFE_INNER_WIDTH / nameText.width);
    }
    floatContainer.add(nameText);

    if (card.levelLabel) {
      const lvlText = this.add.text(0, -28, card.levelLabel.toUpperCase(), {
        fontFamily: this.cardFont,
        fontSize: '16px',
        color: '#cbd5e1',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5);
      lvlText.setResolution(2);
      if (lvlText.width > SAFE_INNER_WIDTH) {
        lvlText.setScale(SAFE_INNER_WIDTH / lvlText.width);
      }
      floatContainer.add(lvlText);
    }

    // =========================================================================
    // JANELA INFERIOR DA CARTA (Y entre +26px e +137px nas 5 molduras, centro em Y = +82px)
    // Contém: Descrição em linhas com palavras-chave coloridas (Dano, Arma, Vida, etc.)
    // =========================================================================
    const richLines: RichTextSegment[][] = card.richLines || [
      [{ text: card.description.toUpperCase(), color: C_WHITE }]
    ];

    this.renderRichDescriptionBox(floatContainer, richLines, 82, SAFE_INNER_WIDTH, 100);

    // Ícone de arte da carta, dentro do encaixe redondo entre as duas janelas (~50px de vão)
    const iconKey = CARD_ICON_KEYS[card.id];
    if (iconKey && this.textures.exists(iconKey)) {
      const ICON_Y = 5;
      const iconGlow = this.add.circle(0, ICON_Y, 23, glowColor, 0.35);
      iconGlow.setBlendMode(Phaser.BlendModes.ADD);
      const icon = this.add.image(0, ICON_Y, iconKey);
      icon.setDisplaySize(42, 42);
      floatContainer.add([iconGlow, icon]);
      this.tweens.add({
        targets: iconGlow,
        scale: { from: 0.9, to: 1.18 },
        alpha: { from: 0.25, to: 0.55 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // =========================================================================
    // INTERATIVIDADE: HOVER (FLUTUAÇÃO E ESCALA) & CLICK (CASH + EXPLOSÃO)
    // =========================================================================
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    rootContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (rootContainer.input) {
      rootContainer.input.cursor = 'pointer';
    }

    rootContainer.on('pointerover', () => {
      if (this.isClosing) return;
      SoundManager.getInstance().playCardHover();
      rootContainer.setDepth(50);
      // Mouse e controle dividem a mesma seleção: a carta sob o cursor vira a selecionada
      const prev = this.selectedCardIndex;
      this.selectedCardIndex = index;
      if (prev !== index) this.cardContainers[prev]?.emit('pointerout');
      this.applyCardFocusTint();

      // Balanço leve de um lado para o outro enquanto está selecionada
      swayTween?.stop();
      floatContainer.setRotation(-SWAY_RAD);
      swayTween = this.tweens.add({
        targets: floatContainer,
        rotation: SWAY_RAD,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      if (frameGlow) {
        glowTween?.stop();
        frameGlow.setAlpha(0.04);
        glowTween = this.tweens.add({
          targets: frameGlow,
          alpha: 0.22,
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      this.tweens.add({
        targets: rootContainer,
        scaleX: 1.09,
        scaleY: 1.09,
        y: y - 12,
        duration: 150,
        ease: 'Back.easeOut'
      });
    });

    rootContainer.on('pointerout', () => {
      if (this.isClosing) return;
      rootContainer.setDepth(10);

      // Só para de balançar quando outra carta virou a selecionada (o mouse sair não basta)
      if (this.selectedCardIndex !== index) {
        swayTween?.stop();
        swayTween = undefined;
        glowTween?.stop();
        glowTween = undefined;
        frameGlow?.setAlpha(0);
        this.tweens.add({ targets: floatContainer, rotation: 0, duration: 160, ease: 'Quad.easeOut' });
      }

      this.tweens.add({
        targets: rootContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        y: y,
        duration: 160,
        ease: 'Quad.easeOut'
      });
    });

    rootContainer.on('pointerdown', () => {
      // Trava curta ao abrir: o aperto que estava em curso no combate não escolhe carta
      if (this.isClosing || this.pickLockRemainingMs > 0) return;
      this.isClosing = true;

      // 1. Som viciante de Cash / Prêmio ("KA-CHING!")
      SoundManager.getInstance().playCardCashSelect();

      // 2. Aplica o benefício da carta na heroína Nixy
      card.apply(this.player, this.gameScene);

      // 3. Notifica o Altar no mundo para explodir e se desintegrar
      if (this.isAltar && typeof this.onAltarChosen === 'function') {
        this.onAltarChosen();
      }

      // 3. As outras duas cartas não escolhidas descem para baixo da tela!
      this.cardContainers.forEach((otherContainer, otherIdx) => {
        if (otherIdx !== index) {
          this.tweens.killTweensOf(otherContainer);
          this.tweens.add({
            targets: otherContainer,
            y: y + 520,
            alpha: 0,
            rotation: otherIdx < index ? -0.18 : 0.18,
            scaleX: 0.85,
            scaleY: 0.85,
            duration: 360,
            ease: 'Back.easeIn'
          });
        }
      });

      // 4. A carta escolhida brilha, infla e EXPLODE em partículas!
      floatTween.stop();
      this.tweens.killTweensOf(rootContainer);
      rootContainer.setDepth(100);

      // Flash intenso e expansão antes da explosão
      this.tweens.add({
        targets: rootContainer,
        scaleX: 1.24,
        scaleY: 1.24,
        duration: 130,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Dispara explosão de partículas douradas e da cor da carta
          this.spawnCardExplosionParticles(rootContainer.x, rootContainer.y, glowColor);

          // Desintegra a carta em um clarão
          this.tweens.add({
            targets: rootContainer,
            scaleX: 1.62,
            scaleY: 1.62,
            alpha: 0,
            duration: 230,
            ease: 'Cubic.easeOut'
          });
        }
      });

      // 5. Fecha a cena após a celebração de partículas e retoma a partida
      this.time.delayedCall(520, () => {
        this.scene.stop('UpgradeScene');
        this.gameScene.scene.resume();
        if (!this.player || this.player.pendingLevelUps <= 0) {
          this.gameScene.physics.resume();
        }
      });
    });
  }

  /**
   * Renderiza linhas de descrição multicoloridas perfeitamente centralizadas e contidas
   * dentro da janela inferior da moldura da carta, impedindo qualquer vazamento.
   */
  private renderRichDescriptionBox(
    parent: Phaser.GameObjects.Container,
    lines: RichTextSegment[][],
    centerY: number,
    maxWidth: number,
    maxHeight: number
  ): void {
    const boxContainer = this.add.container(0, centerY);
    parent.add(boxContainer);

    const lineSpacing = 24;
    const totalH = (lines.length - 1) * lineSpacing;
    const startY = -totalH / 2;

    lines.forEach((segments, lineIdx) => {
      const lineContainer = this.add.container(0, startY + lineIdx * lineSpacing);
      boxContainer.add(lineContainer);

      const textObjs: Phaser.GameObjects.Text[] = [];
      let totalLineW = 0;

      for (const seg of segments) {
        const t = this.add.text(0, 0, seg.text.toUpperCase(), {
          fontFamily: this.cardFont,
          fontSize: '21px',
          color: seg.color,
          stroke: '#000000',
          strokeThickness: 3.5
        }).setOrigin(0, 0.5);
        t.setResolution(2);
        textObjs.push(t);
        lineContainer.add(t);
        totalLineW += t.width;
      }

      // Posiciona cada segmento lado a lado centralizando a linha inteira em X = 0
      let curX = -totalLineW / 2;
      for (const t of textObjs) {
        t.setX(Math.round(curX));
        curX += t.width;
      }

      // Garantia absoluta contra vazamento horizontal nos ossos laterais
      if (totalLineW > maxWidth) {
        const scaleFit = maxWidth / totalLineW;
        lineContainer.setScale(scaleFit);
      }
    });

    // Garantia absoluta contra vazamento vertical
    const estimatedBoxH = lines.length * lineSpacing;
    if (estimatedBoxH > maxHeight) {
      boxContainer.setScale(maxHeight / estimatedBoxH);
    }
  }

  /**
   * Cria a explosão satisfatória de partículas, moedas e ondas de choque quando a carta é escolhida
   */
  private spawnCardExplosionParticles(cx: number, cy: number, themeColor: number): void {
    this.cameras.main.shake(140, 0.006);

    // 1. Onda de choque expansiva
    const ring = this.add.graphics();
    ring.setDepth(120);
    ring.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.addCounter({
      from: 20,
      to: 240,
      duration: 340,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const r = tw.getValue() ?? 20;
        const alpha = Math.max(0, 1 - (r - 20) / 220);
        ring.clear();
        ring.lineStyle(5, 0xffe600, alpha);
        ring.strokeCircle(cx, cy, r);
        ring.lineStyle(3, themeColor, alpha * 0.8);
        ring.strokeCircle(cx, cy, r * 0.78);
      },
      onComplete: () => ring.destroy()
    });

    // 2. Explosão de 40 partículas (faíscas douradas, cristais e fragmentos da cor da carta)
    const palette = [themeColor, 0xffe600, 0xffffff, 0x00f5d4, 0xff4d6d];
    for (let i = 0; i < 40; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speedDist = Phaser.Math.Between(70, 260);
      const startX = cx + Phaser.Math.Between(-50, 50);
      const startY = cy + Phaser.Math.Between(-80, 80);
      const color = Phaser.Math.RND.pick(palette);
      const size = Phaser.Math.Between(3, 8);

      const spark = this.add.rectangle(startX, startY, size, size, color, 1);
      spark.setDepth(125);
      spark.setBlendMode(Phaser.BlendModes.ADD);
      spark.setRotation(Phaser.Math.FloatBetween(0, Math.PI));

      this.tweens.add({
        targets: spark,
        x: startX + Math.cos(angle) * speedDist,
        y: startY + Math.sin(angle) * speedDist,
        rotation: spark.rotation + Phaser.Math.FloatBetween(2, 6),
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: Phaser.Math.Between(240, 420),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  update(_time: number, delta: number): void {
    if (this.isClosing) return;
    this.updateSkipButtonVisual();
    this.updateRerollButtonVisual();
    this.drawPickLockBar();

    if (AutoPlayTestAgent.getInstance().isEnabled) {
      AutoPlayTestAgent.getInstance().checkAndResolveUpgradeModal(this, delta);
      return;
    }

    const nav = GamepadManager.getInstance().getMenuNavigation(this);
    if (this.cardContainers.length > 0) {
      if (nav.left) {
        const prev = this.selectedCardIndex;
        this.selectedCardIndex = (this.selectedCardIndex - 1 + this.cardContainers.length) % this.cardContainers.length;
        if (this.cardContainers[prev]) this.cardContainers[prev].emit('pointerout');
        if (this.cardContainers[this.selectedCardIndex]) this.cardContainers[this.selectedCardIndex].emit('pointerover');
      } else if (nav.right) {
        const prev = this.selectedCardIndex;
        this.selectedCardIndex = (this.selectedCardIndex + 1) % this.cardContainers.length;
        if (this.cardContainers[prev]) this.cardContainers[prev].emit('pointerout');
        if (this.cardContainers[this.selectedCardIndex]) this.cardContainers[this.selectedCardIndex].emit('pointerover');
      }
      if (nav.confirm) {
        if (this.cardContainers[this.selectedCardIndex]) {
          this.cardContainers[this.selectedCardIndex].emit('pointerdown');
        }
      }
    }
    if (!this.isAltar) {
      if (nav.reroll) {
        this.handleReroll();
      } else if (nav.cancel) {
        this.handleSkipAndHeal();
      }
    }
  }
}


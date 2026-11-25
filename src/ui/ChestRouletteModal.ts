import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { InputHint } from './InputHint';
import { CHEST_ROULETTE_THEME as TH, FONTS } from '../config/theme';
import { CARD_ICON_KEYS, type UpgradeCard, type UpgradeGameScene } from '../systems/UpgradeCatalog';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';

/** O que a roleta usa da GameScene: pausar/retomar e dar a imunidade de saída. */
export type IChestRouletteGameScene = UpgradeGameScene & {
  isGameOver?: boolean;
  isChapterCompleted?: boolean;
  grantChestSafetyGrace?: () => void;
};

/** Quantos ícones passam antes do prêmio (quanto mais, mais longa a corrida). */
const REEL_ITEMS_BEFORE_PRIZE = 26;
/** Ícones depois do prêmio, para a faixa não terminar vazia à direita dele. */
const REEL_ITEMS_AFTER_PRIZE = 4;
const SPIN_MS = 3400;
const COLLECT_LOCK_MS = 220;

/** Arte da carta; null quando ela não tem (aí o espaço mostra o rótulo curto da carta). */
function iconOf(s: Phaser.Scene, card: UpgradeCard | null): string | null {
  if (!card) return s.textures.exists('item-chalice') ? 'item-chalice' : null;
  const key = CARD_ICON_KEYS[card.id];
  return key && s.textures.exists(key) ? key : null;
}

/**
 * Roleta do Baú do Abismo (instância por UIScene): uma faixa de ícones das bênçãos
 * possíveis corre da direita para a esquerda, desacelera com um estalo a cada ícone
 * que passa pelo centro e para no prêmio, que cresce e brilha.
 * Tocar durante a corrida pula direto para o prêmio; o toque seguinte coleta.
 */
export class ChestRouletteModal {
  /** Verdadeiro enquanto a roleta está na tela (bloqueia pausa e level up). */
  public isOpen = false;
  /** Ação de "pular/coletar" usada pelo bot [F3]; nula quando fechada. */
  public resolver: (() => void) | null = null;

  constructor(private readonly ui: Phaser.Scene) {}

  public resolve(): void {
    if (this.resolver) this.resolver();
  }

  public show(availableCards: UpgradeCard[], player: BaseCharacter, gameScene: IChestRouletteGameScene | null): void {
    const s = this.ui;
    const { width, height } = s.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Pausa total do combate enquanto a roleta está aberta
    this.isOpen = true;
    gameScene?.physics?.pause();
    gameScene?.scene?.pause();

    const modal = s.add.container(0, 0).setDepth(3400);
    const backdrop = s.add.rectangle(cx, cy, width, height, TH.backdrop, TH.backdropAlpha).setInteractive({ useHandCursor: true });
    modal.add(backdrop);

    // Prêmio: evolução tem prioridade; sem cartas, cura total
    const pool = availableCards;
    const evo = pool.filter((c) => c.isEvolution);
    const prize: UpgradeCard | null = evo.length > 0 ? Phaser.Math.RND.pick(evo) : pool.length > 0 ? Phaser.Math.RND.pick(pool) : null;

    // Tamanho medido pela tela: no celular o jogo é encolhido inteiro
    const slot = Math.round(Math.min(height * 0.17, 120));
    const gap = Math.round(slot * 0.18);
    const step = slot + gap;
    const stripW = Math.min(width * 0.86, step * 7);
    const font = (f: number): string => `${Math.max(10, Math.round(slot * f))}px`;

    const header = s.add.text(cx, cy - slot * 1.05, 'SORTEANDO BÊNÇÃO...', {
      fontFamily: FONTS.body, fontSize: font(0.16), color: TH.header, stroke: TH.stroke, strokeThickness: 3,
    }).setOrigin(0.5);
    modal.add(header);

    // Trilho escuro com moldura dourada atrás da faixa
    const rail = s.add.graphics();
    rail.fillStyle(TH.stripFill, 0.92).fillRect(cx - stripW / 2, cy - slot * 0.68, stripW, slot * 1.36);
    rail.lineStyle(2, TH.stripBorder, 1).strokeRect(cx - stripW / 2, cy - slot * 0.68, stripW, slot * 1.36);
    modal.add(rail);

    // Faixa: ícones sorteados, o prêmio na posição REEL_ITEMS_BEFORE_PRIZE
    const reel = s.add.container(0, cy);
    const items: Phaser.GameObjects.Container[] = [];
    const total = REEL_ITEMS_BEFORE_PRIZE + 1 + REEL_ITEMS_AFTER_PRIZE;
    for (let i = 0; i < total; i++) {
      const card = i === REEL_ITEMS_BEFORE_PRIZE ? prize : pool.length > 0 ? Phaser.Math.RND.pick(pool) : null;
      const item = s.add.container(i * step, 0);
      const plate = s.add.graphics();
      plate.fillStyle(TH.slotFill, 1).fillRect(-slot / 2, -slot / 2, slot, slot);
      const border = card?.isEvolution ? TH.slotEvolutionBorder : card?.glowColor ?? TH.slotBorder;
      plate.lineStyle(2, border, 1).strokeRect(-slot / 2, -slot / 2, slot, slot);
      item.add(plate);
      const key = iconOf(s, card);
      if (key) {
        const icon = s.add.image(0, 0, key);
        icon.setScale(Math.min((slot * 0.72) / icon.width, (slot * 0.72) / icon.height));
        item.add(icon);
      } else {
        // Carta sem arte: o rótulo curto dela ("METEORO", "ALMAS"), na cor da raridade
        const label = s.add.text(0, 0, card?.icon ?? '', {
          fontFamily: FONTS.body, fontSize: font(0.13), color: card?.rarityColor ?? TH.collect,
          stroke: TH.stroke, strokeThickness: 3, align: 'center', wordWrap: { width: slot - 8 },
        }).setOrigin(0.5);
        item.add(label);
      }
      reel.add(item);
      items.push(item);
    }
    modal.add(reel);

    // Ponteiros dourados em cima e embaixo do centro
    const pointer = s.add.graphics();
    pointer.fillStyle(TH.pointer, 1);
    const top = cy - slot * 0.68;
    const bottom = cy + slot * 0.68;
    pointer.fillTriangle(cx - 9, top - 12, cx + 9, top - 12, cx, top + 2);
    pointer.fillTriangle(cx - 9, bottom + 12, cx + 9, bottom + 12, cx, bottom - 2);
    pointer.lineStyle(2, TH.pointer, 0.9).strokeRect(cx - slot * 0.58, cy - slot * 0.58, slot * 1.16, slot * 1.16);
    modal.add(pointer);

    const nameText = s.add.text(cx, cy + slot * 0.95, '', {
      fontFamily: FONTS.body, fontSize: font(0.2), color: TH.prizeName, stroke: TH.stroke, strokeThickness: 4,
    }).setOrigin(0.5).setVisible(false);
    const descText = s.add.text(cx, cy + slot * 1.25, '', {
      fontFamily: FONTS.body, fontSize: font(0.12), color: TH.desc, align: 'center', wordWrap: { width: Math.min(width - 60, stripW) },
    }).setOrigin(0.5, 0).setVisible(false);
    const collectPrompt = s.add.text(cx, cy + slot * 1.9, '[ COLETAR BÊNÇÃO ]', {
      fontFamily: FONTS.body, fontSize: font(0.15), color: TH.collect, stroke: TH.stroke, strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false).setInteractive({ useHandCursor: true });
    const keyHint = new InputHint(s, cx, cy + slot * 2.15, ['advance', { text: 'COLETAR' }], {
      glyphHeight: 20, fontSize: 9, align: 'center',
    }).container.setVisible(false);
    modal.add([nameText, descText, collectPrompt, keyHint]);
    s.tweens.add({ targets: collectPrompt, alpha: 0.6, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    collectPrompt.on('pointerover', () => {
      collectPrompt.setColor(TH.collectHover);
      SoundManager.getInstance().playMenuHover();
    });
    collectPrompt.on('pointerout', () => collectPrompt.setColor(TH.collect));

    // Começa com o primeiro ícone entrando pela borda direita; termina com o prêmio no centro
    const startX = cx + stripW / 2 + slot / 2;
    const endX = cx - REEL_ITEMS_BEFORE_PRIZE * step;
    reel.x = startX;

    /** Ícones perto do centro crescem; perto das bordas somem (a faixa não tem máscara). */
    const layout = (): void => {
      for (let i = 0; i < items.length; i++) {
        const sx = reel.x + i * step;
        const d = Math.abs(sx - cx);
        const it = items[i];
        it.setScale(1 + Math.max(0, 1 - d / step) * 0.25);
        // Some antes de a borda do ícone passar da moldura
        it.setAlpha(Phaser.Math.Clamp((stripW / 2 - slot * 0.55 - d) / (slot * 0.5), 0, 1));
      }
    };
    layout();

    let lastIndex = -1;
    let finished = false;
    let collected = false;
    let canCollectAt = 0;

    const spin = s.tweens.add({
      targets: reel,
      x: endX,
      duration: SPIN_MS,
      ease: 'Quart.easeOut',
      onUpdate: (tw) => {
        layout();
        // Um estalo por ícone que passa pelo centro, mais agudo conforme desacelera
        const idx = Math.round((cx - reel.x) / step);
        if (idx !== lastIndex && idx >= 0) {
          lastIndex = idx;
          SoundManager.getInstance().playRouletteTick(0.95 + tw.progress * 0.4);
        }
      },
      onComplete: () => reveal(),
    });

    const reveal = (): void => {
      if (finished || collected) return;
      finished = true;
      canCollectAt = s.time.now + COLLECT_LOCK_MS;
      spin.stop();
      reel.x = endX;
      layout();

      const winner = items[REEL_ITEMS_BEFORE_PRIZE];
      s.tweens.add({ targets: winner, scale: 1.45, duration: 180, ease: 'Back.easeOut' });
      const glow = s.add.circle(cx, cy, slot * 0.8, TH.winnerGlow, 0.35).setBlendMode(Phaser.BlendModes.ADD);
      modal.addAt(glow, modal.getIndex(reel));
      s.tweens.add({ targets: glow, scale: { from: 0.6, to: 1.15 }, alpha: { from: 0.55, to: 0.25 }, duration: 600, yoyo: true, repeat: -1 });

      SoundManager.getInstance().playRouletteJackpot();
      s.cameras.main.flash(220, 255, 215, 0);
      header.setText('BÊNÇÃO CONCEDIDA').setColor(TH.headerDone);
      nameText.setText(prize ? prize.title : 'RESTAURAÇÃO TOTAL').setVisible(true);
      const desc = prize
        ? prize.description.replace(/\n\n/g, ' — ').replace(/\n/g, ' ')
        : 'Sua vitalidade foi 100% regenerada pelo fogo abissal.';
      descText.setText(desc).setVisible(true);
      collectPrompt.setVisible(true);
      keyHint.setVisible(true);
    };

    const collect = (): void => {
      if (collected) return;
      collected = true;
      window.removeEventListener('keydown', onKey);
      this.resolver = null;
      SoundManager.getInstance().playMenuClick();
      if (prize && gameScene) prize.apply(player, gameScene);
      else player.heal(player.maxHp);

      this.isOpen = false;
      modal.destroy();
      if (gameScene && !gameScene.isGameOver && !gameScene.isChapterCompleted) {
        gameScene.scene?.resume();
        gameScene.physics?.resume();
        gameScene.grantChestSafetyGrace?.();
      }
    };

    const handleInteraction = (): void => {
      if (collected) return;
      if (!finished) {
        reveal();
        return;
      }
      // Anti-toque duplo: não coleta sem o jogador ver o prêmio
      if (s.time.now < canCollectAt) return;
      collect();
    };

    collectPrompt.on('pointerdown', handleInteraction);
    backdrop.on('pointerdown', handleInteraction);
    this.resolver = handleInteraction;

    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.code === 'Enter') handleInteraction();
    };
    window.addEventListener('keydown', onKey);

    // Controle: A pula e depois coleta. Lê uma vez ao abrir: um A apertado no combate não conta
    GamepadManager.getInstance().getMenuNavigation(s);
    const onUpdate = (): void => {
      if (GamepadManager.getInstance().getMenuNavigation(s).confirm) handleInteraction();
    };
    s.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

    modal.once(Phaser.GameObjects.Events.DESTROY, () => {
      window.removeEventListener('keydown', onKey);
      s.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
      spin.stop();
      if (this.resolver === handleInteraction) this.resolver = null;
      this.isOpen = false;
    });
  }
}

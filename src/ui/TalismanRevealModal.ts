import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { TALISMAN_BALANCE } from '../config/balance';
import { FONTS, TALISMAN_THEME } from '../config/theme';
import { createRevealState, rarityIndex, tapReveal, type TalismanRarity } from '../systems/talismanRules';
import type { TalismanDef } from '../systems/TalismanCatalog';

/** O que a tela da carta usa da GameScene: pausar, retomar e a imunidade curta de saída. */
export interface ITalismanRevealGameScene {
  scene: Phaser.Scenes.ScenePlugin;
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  isGameOver?: boolean;
  isChapterCompleted?: boolean;
  grantChestSafetyGrace?: () => void;
}

const KIND_LABEL = { pet: 'PET AJUDANTE', weapon: 'ARMA ÚNICA' } as const;

/**
 * Tela da carta do talismã. A carta começa COMUM; cada toque pode subir de raridade
 * (gira, troca de moldura, brilha e toca um som mais rico). Quando não sobe mais,
 * o toque abre a carta e mostra o prêmio. A raridade já foi sorteada antes; os toques só revelam.
 */
export class TalismanRevealModal {
  public isOpen = false;
  /** Ação de toque usada pelo bot [F3]; nula quando fechada. */
  public resolver: (() => void) | null = null;

  constructor(private readonly ui: Phaser.Scene) {}

  public resolve(): void {
    this.resolver?.();
  }

  public show(def: TalismanDef, gameScene: ITalismanRevealGameScene | null, onCollected: () => void): void {
    const s = this.ui;
    const { width, height } = s.scale;
    const th = TALISMAN_THEME;
    const cfg = TALISMAN_BALANCE.reveal;
    const cx = width / 2;
    const cy = height / 2 - 10;

    this.isOpen = true;
    gameScene?.physics.pause();
    gameScene?.scene.pause();

    const modal = s.add.container(0, 0).setDepth(3400);
    const backdrop = s.add.rectangle(cx, height / 2, width, height, th.backdrop, 0.86).setInteractive({ useHandCursor: true });
    modal.add(backdrop);

    const cardH = Math.round(Math.min(height * 0.46, 300));
    const cardW = Math.round(cardH * 0.62);
    // Textos medidos pela carta: no celular o jogo inteiro é encolhido, então tamanho fixo ficava ilegível
    const px = (f: number): string => `${Math.max(10, Math.round(cardH * f))}px`;

    const title = s.add.text(cx, cy - cardH / 2 - cardH * 0.14, 'TALISMÃ DO MINICHEFE', {
      fontFamily: FONTS.body, fontSize: px(0.06), color: th.kindText, stroke: th.textStroke, strokeThickness: 5,
    }).setOrigin(0.5);
    modal.add(title);

    // Brilho atrás da carta (cresce com a raridade) e raios girando nas épicas e lendárias
    const aura = s.add.circle(cx, cy, 120, th.rarity.common.color, 0.18).setBlendMode(Phaser.BlendModes.ADD);
    const rays = s.add.graphics({ x: cx, y: cy }).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    modal.add([aura, rays]);
    s.tweens.add({ targets: aura, scale: { from: 0.92, to: 1.08 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const cardC = s.add.container(cx, cy);
    const card = s.add.image(0, 0, th.rarity.common.card).setDisplaySize(cardW, cardH);
    const back = s.add.text(0, 0, '?', {
      fontFamily: FONTS.display, fontSize: `${Math.round(cardH * 0.3)}px`, color: th.rarity.common.text, stroke: th.textStroke, strokeThickness: 6,
    }).setOrigin(0.5);
    cardC.add([card, back]);
    modal.add(cardC);

    const rarityText = s.add.text(cx, cy + cardH / 2 + cardH * 0.09, th.rarity.common.label, {
      fontFamily: FONTS.body, fontSize: px(0.08), color: th.rarity.common.text, stroke: th.textStroke, strokeThickness: 5,
    }).setOrigin(0.5);
    // Preso pelo topo: a descrição de várias linhas cresce para baixo, sem cobrir a raridade
    const hint = s.add.text(cx, cy + cardH / 2 + cardH * 0.17, 'TOQUE NA CARTA!', {
      fontFamily: FONTS.body, fontSize: px(0.05), color: th.hint, stroke: th.textStroke, strokeThickness: 3,
    }).setOrigin(0.5, 0);
    modal.add([rarityText, hint]);
    s.tweens.add({ targets: hint, alpha: 0.45, duration: 520, yoyo: true, repeat: -1 });

    // Respira, esperando o toque
    const idle = s.tweens.add({ targets: cardC, scale: { from: 1, to: 1.04 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const state = createRevealState(def.rarity);
    let lockedUntil = s.time.now + cfg.tapLockMs;
    let collectAt = Infinity;
    let busy = false;
    let finished = false;

    const paint = (r: TalismanRarity): void => {
      const look = th.rarity[r];
      const tier = rarityIndex(r);
      card.setTexture(s.textures.exists(look.card) ? look.card : 'card-base').setDisplaySize(cardW, cardH);
      back.setColor(look.text);
      rarityText.setText(look.label).setColor(look.text);
      aura.setFillStyle(look.color, 0.16 + tier * 0.08).setRadius(110 + tier * 18);
      if (tier >= 3) {
        rays.setVisible(true).clear();
        rays.fillStyle(look.color, 0.14 + (tier - 3) * 0.08);
        const count = tier >= 4 ? 12 : 8;
        const len = cardH * (tier >= 4 ? 1.1 : 0.9);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          rays.fillTriangle(0, 0, Math.cos(a - 0.09) * len, Math.sin(a - 0.09) * len, Math.cos(a + 0.09) * len, Math.sin(a + 0.09) * len);
        }
      }
    };

    const burst = (color: number, amount: number): void => {
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Phaser.Math.Between(cardW * 0.6, cardW * 1.5);
        const p = s.add.circle(cx, cy, Phaser.Math.Between(2, 5), color, 1).setBlendMode(Phaser.BlendModes.ADD);
        modal.add(p);
        s.tweens.add({ targets: p, x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, alpha: 0, scale: 0.2, duration: Phaser.Math.Between(380, 640), ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
      }
    };

    /** Gira a carta (encolhe na largura, troca no meio, volta). */
    const spin = (midway: () => void, duration: number, onDone: () => void): void => {
      s.tweens.add({
        targets: cardC, scaleX: 0, duration: duration / 2, ease: 'Quad.easeIn',
        onComplete: () => {
          midway();
          s.tweens.add({ targets: cardC, scaleX: 1, duration: duration / 2, ease: 'Back.easeOut', onComplete: onDone });
        },
      });
    };

    const tierUp = (): void => {
      const tier = rarityIndex(state.current);
      const look = th.rarity[state.current];
      busy = true;
      SoundManager.getInstance().playTalismanTierUp(tier);
      spin(() => paint(state.current), 220 + tier * 30, () => { busy = false; });
      s.cameras.main.flash(120 + tier * 40, (look.color >> 16) & 255, (look.color >> 8) & 255, look.color & 255);
      s.cameras.main.shake(100 + tier * 40, 0.002 + tier * 0.0015);
      burst(look.color, 10 + tier * 6);
      hint.setText(tier >= 4 ? 'LENDÁRIA! TOQUE PARA ABRIR' : 'TOQUE DE NOVO!');
    };

    const open = (): void => {
      const tier = rarityIndex(state.current);
      const look = th.rarity[state.current];
      busy = true;
      idle.stop();
      cardC.setScale(1);
      // Carga: treme antes de abrir (mais forte nas raras)
      s.tweens.add({
        targets: cardC, x: { from: cx - 4, to: cx + 4 }, duration: 40, yoyo: true, repeat: 3 + tier,
        onComplete: () => {
          cardC.x = cx;
          spin(() => {
            back.setVisible(false);
            const icon = s.textures.exists(def.icon) ? s.add.image(0, -cardH * 0.12, def.icon) : null;
            if (icon) {
              const fit = Math.min((cardW * 0.62) / icon.width, (cardH * 0.4) / icon.height);
              icon.setScale(fit);
              cardC.add(icon);
            }
            const name = s.add.text(0, cardH * 0.17, def.name, {
              fontFamily: FONTS.body, fontSize: px(0.052), color: look.text, stroke: th.textStroke, strokeThickness: 4, align: 'center', wordWrap: { width: cardW - 24 },
            }).setOrigin(0.5);
            const kind = s.add.text(0, cardH * 0.3, KIND_LABEL[def.kind], {
              fontFamily: FONTS.body, fontSize: px(0.04), color: th.kindText, stroke: th.textStroke, strokeThickness: 3,
            }).setOrigin(0.5);
            cardC.add([name, kind]);
          }, 300, () => {
            busy = false;
            collectAt = s.time.now + cfg.collectLockMs;
            hint.setText(`${def.description}\n\nTOQUE PARA RECEBER`).setAlign('center').setWordWrapWidth(Math.min(width - 40, cardW * 3)).setColor(th.kindText);
          });
          SoundManager.getInstance().playTalismanOpen(tier);
          s.cameras.main.flash(200 + tier * 80, (look.color >> 16) & 255, (look.color >> 8) & 255, look.color & 255);
          s.cameras.main.shake(150 + tier * 70, 0.003 + tier * 0.002);
          burst(look.color, 18 + tier * 10);
        },
      });
    };

    const close = (): void => {
      if (finished) return;
      finished = true;
      this.resolver = null;
      SoundManager.getInstance().playMenuClick();
      onCollected();
      this.isOpen = false;
      modal.destroy();
      if (gameScene && !gameScene.isGameOver && !gameScene.isChapterCompleted) {
        gameScene.scene.resume();
        gameScene.physics.resume();
        gameScene.grantChestSafetyGrace?.();
      }
    };

    const handleTap = (): void => {
      if (finished || busy || s.time.now < lockedUntil) return;
      lockedUntil = s.time.now + cfg.tapLockMs;
      if (state.opened) {
        if (s.time.now >= collectAt) close();
        return;
      }
      SoundManager.getInstance().playTalismanTap(rarityIndex(state.current));
      const step = tapReveal(state);
      if (step === 'tier-up') tierUp();
      else if (step === 'open') open();
    };

    backdrop.on('pointerdown', handleTap);
    this.resolver = handleTap;
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.code === 'Enter') handleTap();
    };
    window.addEventListener('keydown', onKey);
    // Lê uma vez ao abrir: um A que vinha apertado do combate não conta como toque
    GamepadManager.getInstance().getMenuNavigation(s);
    const onUpdate = (): void => {
      if (GamepadManager.getInstance().getMenuNavigation(s).confirm) handleTap();
      if (rays.visible) rays.rotation += 0.004;
    };
    s.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

    modal.once(Phaser.GameObjects.Events.DESTROY, () => {
      window.removeEventListener('keydown', onKey);
      s.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
      if (this.resolver === handleTap) this.resolver = null;
      this.isOpen = false;
    });

    SoundManager.getInstance().playRouletteJackpot();
  }
}

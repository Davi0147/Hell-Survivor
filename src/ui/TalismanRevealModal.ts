import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { TALISMAN_BALANCE } from '../config/balance';
import { FONTS, TALISMAN_THEME } from '../config/theme';
import {
  createRevealState,
  dampPendulum,
  pendulumAngle,
  pendulumKick,
  rarityIndex,
  tapReveal,
  type TalismanRarity,
} from '../systems/talismanRules';
import type { TalismanDef } from '../systems/TalismanCatalog';

/** O que a tela do talismã usa da GameScene: pausar, retomar e a imunidade curta de saída. */
export interface ITalismanRevealGameScene {
  scene: Phaser.Scenes.ScenePlugin;
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  isGameOver?: boolean;
  isChapterCompleted?: boolean;
  grantChestSafetyGrace?: () => void;
}

const KIND_LABEL = { pet: 'PET AJUDANTE', weapon: 'ARMA ÚNICA', active: 'HABILIDADE' } as const;

/**
 * Altura da pedra do talismã no desenho (0 = topo da corrente, 1 = base da tela do recorte).
 * O brilho, as faíscas e o ícone do prêmio saem dali.
 */
const GEM_Y = 0.58;

/**
 * Tela do talismã do minichefe. Um amuleto pendurado balança como um pêndulo. Começa COMUM;
 * cada toque o faz evoluir para a raridade seguinte (troca de arte, clarão, empurrão no
 * balanço) até a raridade sorteada. O toque seguinte racha a pedra e o amuleto some no clarão:
 * no lugar fica o ícone do talismã ganho flutuando, com nome e descrição embaixo.
 * A raridade já foi sorteada antes; os toques só revelam.
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
    const pend = cfg.pendulum;
    const cx = width / 2;

    this.isOpen = true;
    gameScene?.physics.pause();
    gameScene?.scene.pause();

    const modal = s.add.container(0, 0).setDepth(3400);
    const backdrop = s.add.rectangle(cx, height / 2, width, height, th.backdrop, 0.86).setInteractive({ useHandCursor: true });
    modal.add(backdrop);

    // Tamanho do talismã (a tela do recorte é quadrada) e textos medidos por ele: no celular o
    // jogo inteiro é encolhido, então tamanho fixo ficava ilegível
    const size = Math.round(Math.min(height * 0.5, 320));
    const px = (f: number): string => `${Math.max(10, Math.round(size * f))}px`;
    const pivotY = Math.round(height * 0.5 - size * 0.62);
    const gemDist = size * GEM_Y;

    const title = s.add.text(cx, pivotY - size * 0.07, 'TALISMÃ DO MINICHEFE', {
      fontFamily: FONTS.body, fontSize: px(0.055), color: th.kindText, stroke: th.textStroke, strokeThickness: 5,
    }).setOrigin(0.5, 1);
    modal.add(title);

    // Brilho atrás da pedra (cresce com a raridade) e raios girando nas épicas e lendárias
    const aura = s.add.circle(cx, pivotY + gemDist, size * 0.3, th.rarity.common.color, 0.18).setBlendMode(Phaser.BlendModes.ADD);
    const rays = s.add.graphics({ x: cx, y: pivotY + gemDist }).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    modal.add([aura, rays]);
    s.tweens.add({ targets: aura, scale: { from: 0.92, to: 1.08 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // O amuleto, preso pelo topo da corrente: o pivô do pêndulo
    const talisman = s.add.image(cx, pivotY, this.artKey(th.rarity.common.art)).setOrigin(0.5, 0).setDisplaySize(size, size);
    modal.add(talisman);

    const rarityText = s.add.text(cx, pivotY + size * 1.02, th.rarity.common.label, {
      fontFamily: FONTS.body, fontSize: px(0.075), color: th.rarity.common.text, stroke: th.textStroke, strokeThickness: 5,
    }).setOrigin(0.5, 0);
    // Preso pelo topo: a descrição de várias linhas cresce para baixo, sem cobrir a raridade
    const hint = s.add.text(cx, pivotY + size * 1.13, 'TOQUE NO TALISMÃ!', {
      fontFamily: FONTS.body, fontSize: px(0.048), color: th.hint, stroke: th.textStroke, strokeThickness: 3,
    }).setOrigin(0.5, 0);
    modal.add([rarityText, hint]);
    const hintBlink = s.tweens.add({ targets: hint, alpha: 0.45, duration: 520, yoyo: true, repeat: -1 });

    const state = createRevealState(def.rarity);
    let lockedUntil = s.time.now + cfg.tapLockMs;
    let collectAt = Infinity;
    let busy = false;
    let finished = false;
    let swingAmp: number = pend.kickAmpDeg;
    let swingClock = 0;
    let swinging = true;

    /** Onde está a pedra agora (gira junto com o pêndulo). */
    const gemPoint = (): { x: number; y: number } => {
      const a = talisman.rotation;
      return { x: cx - Math.sin(a) * gemDist, y: pivotY + Math.cos(a) * gemDist };
    };

    const paint = (r: TalismanRarity): void => {
      const look = th.rarity[r];
      const tier = rarityIndex(r);
      talisman.setTexture(this.artKey(look.art)).setDisplaySize(size, size);
      rarityText.setText(look.label).setColor(look.text);
      aura.setFillStyle(look.color, 0.16 + tier * 0.08).setRadius(size * (0.3 + tier * 0.04));
      if (tier >= 3) {
        rays.setVisible(true).clear();
        rays.fillStyle(look.color, 0.14 + (tier - 3) * 0.08);
        const count = tier >= 4 ? 12 : 8;
        const len = size * (tier >= 4 ? 0.95 : 0.75);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          rays.fillTriangle(0, 0, Math.cos(a - 0.09) * len, Math.sin(a - 0.09) * len, Math.cos(a + 0.09) * len, Math.sin(a + 0.09) * len);
        }
      }
    };

    const burst = (color: number, amount: number): void => {
      const from = gemPoint();
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Phaser.Math.Between(size * 0.3, size * 0.8);
        const p = s.add.circle(from.x, from.y, Phaser.Math.Between(2, 5), color, 1).setBlendMode(Phaser.BlendModes.ADD);
        modal.add(p);
        s.tweens.add({ targets: p, x: from.x + Math.cos(a) * d, y: from.y + Math.sin(a) * d, alpha: 0, scale: 0.2, duration: Phaser.Math.Between(380, 640), ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
      }
    };

    /** Empurrão no balanço e um "pulo" rápido de tamanho na troca de arte. */
    const kick = (tier: number): void => {
      swingAmp = Math.max(swingAmp, pendulumKick(tier, pend.kickAmpDeg, pend.kickPerTierDeg));
      const sx = talisman.scaleX;
      const sy = talisman.scaleY;
      s.tweens.add({ targets: talisman, scaleX: sx * 1.12, scaleY: sy * 1.12, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    };

    const tierUp = (): void => {
      const tier = rarityIndex(state.current);
      const look = th.rarity[state.current];
      busy = true;
      SoundManager.getInstance().playTalismanTierUp(tier);
      paint(state.current);
      kick(tier);
      s.cameras.main.flash(120 + tier * 40, (look.color >> 16) & 255, (look.color >> 8) & 255, look.color & 255);
      s.cameras.main.shake(100 + tier * 40, 0.002 + tier * 0.0015);
      burst(look.color, 10 + tier * 6);
      hint.setText(tier >= 4 ? 'LENDÁRIA! TOQUE PARA ABRIR' : 'TOQUE DE NOVO!');
      s.time.delayedCall(220 + tier * 30, () => { busy = false; });
    };

    /** Depois do clarão: o ícone do prêmio flutuando, com nome, tipo e descrição embaixo. */
    const showPrize = (look: (typeof th.rarity)[TalismanRarity]): void => {
      const center = { x: cx, y: pivotY + gemDist };
      const iconBox = size * 0.66;
      const icon = s.textures.exists(def.icon) ? s.add.image(center.x, center.y, def.icon) : null;
      if (icon) {
        const fit = Math.min(iconBox / icon.width, iconBox / icon.height);
        icon.setScale(0);
        modal.add(icon);
        s.tweens.add({
          targets: icon, scale: fit, duration: 340, ease: 'Back.easeOut',
          onComplete: () => {
            s.tweens.add({ targets: icon, y: center.y - cfg.iconFloatPx, duration: cfg.iconFloatMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          },
        });
      }
      const nameY = center.y + iconBox / 2 + size * 0.06;
      const name = s.add.text(cx, nameY, def.name, {
        fontFamily: FONTS.body, fontSize: px(0.07), color: look.text, stroke: th.textStroke, strokeThickness: 5, align: 'center',
      }).setOrigin(0.5, 0);
      const kind = s.add.text(cx, nameY + size * 0.095, `${look.label} · ${KIND_LABEL[def.kind]}`, {
        fontFamily: FONTS.body, fontSize: px(0.042), color: th.kindText, stroke: th.textStroke, strokeThickness: 3,
      }).setOrigin(0.5, 0);
      modal.add([name, kind]);
      rarityText.setVisible(false);
      hintBlink.stop();
      hint
        .setY(nameY + size * 0.17)
        .setAlpha(1)
        .setText(`${def.description}\n\nTOQUE PARA RECEBER`)
        .setAlign('center')
        .setWordWrapWidth(Math.min(width - 40, size * 1.6))
        .setColor(th.kindText);
      s.tweens.add({ targets: [name, kind, hint], alpha: { from: 0, to: 1 }, duration: 260 });
    };

    const open = (): void => {
      const tier = rarityIndex(state.current);
      const look = th.rarity[state.current];
      busy = true;
      // Racha: troca para a arte da pedra quebrada, dá um tranco e treme mais nas raras
      talisman.setTexture(this.artKey(look.openArt, look.art)).setDisplaySize(size, size);
      kick(tier + 1);
      SoundManager.getInstance().playTalismanOpen(tier);
      s.cameras.main.shake(150 + tier * 70, 0.003 + tier * 0.002);
      burst(look.color, 12 + tier * 6);
      s.time.delayedCall(320 + tier * 40, () => {
        // Clarão: o amuleto some e a luz vira o prêmio
        s.cameras.main.flash(200 + tier * 80, (look.color >> 16) & 255, (look.color >> 8) & 255, look.color & 255);
        burst(look.color, 18 + tier * 10);
        swinging = false;
        s.tweens.add({ targets: talisman, alpha: 0, scaleX: talisman.scaleX * 1.25, scaleY: talisman.scaleY * 1.25, duration: 220, ease: 'Quad.easeIn' });
        s.tweens.add({ targets: title, alpha: 0.6, duration: 220 });
        rays.setPosition(cx, pivotY + gemDist);
        aura.setPosition(cx, pivotY + gemDist);
        showPrize(look);
        s.time.delayedCall(340, () => {
          busy = false;
          collectAt = s.time.now + cfg.collectLockMs;
        });
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
    const onUpdate = (_time: number, delta: number): void => {
      if (GamepadManager.getInstance().getMenuNavigation(s).confirm) handleTap();
      if (rays.visible) rays.rotation += 0.004;
      if (swinging) {
        swingClock += delta;
        swingAmp = dampPendulum(swingAmp, pend.idleAmpDeg, pend.dampPerSec, delta);
        talisman.setAngle(pendulumAngle(swingAmp, swingClock, pend.periodMs));
        // Brilho e raios acompanham a pedra
        const gem = gemPoint();
        aura.setPosition(gem.x, gem.y);
        rays.setPosition(gem.x, gem.y);
      }
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

  /** Arte que carregou: a pedida, a reserva ou a do comum. */
  private artKey(key: string, fallback: string = TALISMAN_THEME.rarity.common.art): string {
    return this.ui.textures.exists(key) ? key : fallback;
  }
}

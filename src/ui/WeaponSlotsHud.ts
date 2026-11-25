import Phaser from 'phaser';
import type { BaseWeapon } from '../entities/weapons/BaseWeapon';
import { getWeaponIconInfo } from '../systems/UpgradeCatalog';
import { WEAPON_SLOT_THEME as T } from '../config/theme';
import { HUD_SIZES } from '../config/hudLayout';
import { InputHint } from './InputHint';

// Medidas compartilhadas com o layout da HUD (que confere se nada se sobrepõe)
const SLOT = HUD_SIZES.weapons.slot;
/** O espaço da Suprema é maior para chamar atenção quando ela fica pronta. */
const ULT = HUD_SIZES.weapons.ult;
const KEYCAP = HUD_SIZES.weapons.keyCap;
const GAP = HUD_SIZES.weapons.gap;
const MAX_WEAPON_SLOTS = HUD_SIZES.weapons.slots;

/** Onde a barra fica: borda esquerda, centro vertical e escala (ver `config/hudLayout.ts`). */
export interface WeaponSlotsLayout {
  x: number;
  y: number;
  scale: number;
}

/** O que a barra lê do personagem para o espaço da Suprema. */
export interface IWeaponSlotsPlayer {
  ultimateCharge: number;
  maxUltimateCharge: number;
  isUltimateReady: boolean;
  isUltimateActive: boolean;
}

interface Slot {
  frame: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  pips: Phaser.GameObjects.Graphics;
  /** Assinatura do que está desenhado (evita redesenhar todo quadro). */
  drawn: string;
}

/**
 * Barra de armas equipadas no canto inferior esquerdo: o primeiro espaço é a Suprema
 * (escurece enquanto carrega, borda pulsando quando pronta) e os outros mostram cada
 * arma com seu ícone, nível em pontinhos e moldura dourada quando evoluída.
 */
export class WeaponSlotsHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly ultFrame: Phaser.GameObjects.Graphics;
  private readonly ultIcon?: Phaser.GameObjects.Image;
  private readonly ultShade: Phaser.GameObjects.Graphics;
  /** Ícone do botão da Suprema (E, Y, triângulo...); vazio no toque, onde já existe o botão na tela. */
  private readonly ultKey: InputHint;
  private readonly slots: Slot[] = [];

  constructor(private readonly ui: Phaser.Scene, layout: WeaponSlotsLayout, onUltimateClick?: () => void) {
    this.container = ui.add.container(layout.x + (ULT / 2) * layout.scale, layout.y);
    this.container.setScale(layout.scale).setDepth(58);

    this.ultFrame = ui.add.graphics();
    this.ultShade = ui.add.graphics();
    this.container.add(this.ultFrame);
    if (ui.textures.exists('icon-ultimate')) {
      this.ultIcon = ui.add.image(0, 0, 'icon-ultimate').setDisplaySize(ULT - 8, ULT - 8);
      this.container.add(this.ultIcon);
    }
    this.container.add(this.ultShade);
    // Botão da Suprema: centralizado na borda de baixo do ícone, sem invadir os espaços vizinhos
    this.ultKey = new InputHint(ui, 0, ULT / 2, ['ultimate'], { glyphHeight: KEYCAP, align: 'center' });

    if (onUltimateClick) {
      const zone = ui.add.zone(0, 0, ULT, ULT).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', onUltimateClick);
      this.container.add(zone);
    }

    for (let i = 0; i < MAX_WEAPON_SLOTS; i++) {
      const x = ULT / 2 + GAP + SLOT / 2 + i * (SLOT + GAP);
      const frame = ui.add.graphics();
      frame.setPosition(x, 0);
      const icon = ui.add.image(x, 0, '__DEFAULT').setVisible(false);
      const pips = ui.add.graphics();
      pips.setPosition(x, 0);
      this.container.add([frame, icon, pips]);
      this.slots.push({ frame, icon, pips, drawn: '' });
    }

    // Por último, para ficar por cima de tudo
    this.container.add(this.ultKey.container);
  }

  /** Some junto com o resto da HUD. */
  public getHudElement(): Phaser.GameObjects.Container {
    return this.container;
  }

  public update(player: IWeaponSlotsPlayer, weapons: ReadonlyArray<BaseWeapon>): void {
    this.updateUltimateSlot(player);

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const info = weapons[i] ? getWeaponIconInfo(weapons[i]) : undefined;
      const signature = info ? `${info.key}|${info.level}|${info.maxLevel}` : 'empty';
      if (signature === slot.drawn) {
        if (info?.isEvolved) slot.frame.setAlpha(0.8 + Math.sin(this.ui.time.now * 0.006) * 0.2);
        continue;
      }
      slot.drawn = signature;
      this.drawFrame(slot.frame, info?.isEvolved ? T.evolvedBorder : T.border, !info);
      slot.frame.setAlpha(1);

      if (info && this.ui.textures.exists(info.key)) {
        slot.icon.setTexture(info.key).setDisplaySize(SLOT - 6, SLOT - 6).setVisible(true);
        // Ícone novo entra com um pulo
        slot.icon.setScale(slot.icon.scaleX * 1.4);
        this.ui.tweens.add({ targets: slot.icon, scaleX: slot.icon.scaleX / 1.4, scaleY: slot.icon.scaleY / 1.4, duration: 220, ease: 'Back.easeOut' });
      } else {
        slot.icon.setVisible(false);
      }

      slot.pips.clear();
      if (info && !info.isEvolved) {
        const pipW = 5;
        const total = info.maxLevel * pipW + (info.maxLevel - 1) * 2;
        const startX = -total / 2;
        for (let p = 0; p < info.maxLevel; p++) {
          slot.pips.fillStyle(p < info.level ? T.pipOn : T.pipOff, 1);
          slot.pips.fillRect(startX + p * (pipW + 2), SLOT / 2 + 4, pipW, 4);
        }
      }
    }
  }

  private updateUltimateSlot(player: IWeaponSlotsPlayer): void {
    const ratio = Phaser.Math.Clamp(player.ultimateCharge / player.maxUltimateCharge, 0, 1);
    const isReady = player.isUltimateReady;
    const isActive = player.isUltimateActive;
    const pulse = Math.sin(this.ui.time.now * 0.01);

    this.drawFrame(this.ultFrame, isReady || isActive ? T.ultReadyBorder : T.border, false, isReady ? 3 + pulse * 2 : 0, ULT);

    // Sombra cobre a parte ainda não carregada (de cima para baixo)
    this.ultShade.clear();
    if (!isReady && !isActive) {
      const inner = ULT - 8;
      const shadeH = inner * (1 - ratio);
      this.ultShade.fillStyle(T.ultShade, T.ultShadeAlpha);
      this.ultShade.fillRect(-inner / 2, -inner / 2, inner, shadeH);
    }
    this.ultIcon?.setScale(((ULT - 8) / (this.ultIcon.width || 1)) * (isReady ? 1 + pulse * 0.07 : 1));

    // O botão aparece sempre (menos durante a Suprema); pronta, ele cresce, acende e pulsa
    const keyScale = isReady ? 1.15 + pulse * 0.08 : 1;
    this.ultKey.container.setVisible(!isActive).setScale(keyScale).setAlpha(isReady ? 1 : 0.7);
  }

  private drawFrame(g: Phaser.GameObjects.Graphics, border: number, isEmpty: boolean, glow: number = 0, size: number = SLOT): void {
    const h = size / 2;
    g.clear();
    if (glow > 0) {
      g.lineStyle(2, border, 0.45);
      g.strokeRect(-h - 2 - glow, -h - 2 - glow, size + 4 + glow * 2, size + 4 + glow * 2);
    }
    g.fillStyle(T.fill, isEmpty ? T.fillAlpha * 0.45 : T.fillAlpha);
    g.fillRect(-h, -h, size, size);
    g.lineStyle(1, T.innerBorder, isEmpty ? 0.4 : 1);
    g.strokeRect(-h + 3, -h + 3, size - 6, size - 6);
    g.lineStyle(2, border, isEmpty ? 0.35 : 1);
    g.strokeRect(-h, -h, size, size);
    // Cantos reforçados, estilo moldura barroca
    if (!isEmpty) {
      g.fillStyle(border, 1);
      for (const [cx, cy] of [[-h, -h], [h, -h], [-h, h], [h, h]]) {
        g.fillRect(cx - 3, cy - 3, 6, 6);
      }
    }
  }
}

import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';

const SOFT_GLOW_KEY = 'ui-soft-glow';

/**
 * Luz macia (mancha oval branca que some nas bordas), gerada uma vez. Pintada com a cor do
 * botão, vira o brilho de fundo dele.
 */
function ensureSoftGlow(scene: Phaser.Scene): boolean {
  const tex = scene.textures;
  if (!tex) return false;
  if (tex.exists(SOFT_GLOW_KEY)) return true;
  const canvas = tex.createCanvas?.(SOFT_GLOW_KEY, 256, 128);
  if (!canvas) return false;
  const ctx = canvas.getContext();
  ctx.save();
  ctx.scale(2, 1); // círculo esticado = oval
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.restore();
  canvas.refresh();
  return true;
}

export interface IGlowButton {
  /** Peças na ordem de desenho (de trás para a frente) para pôr num container. */
  objects: Phaser.GameObjects.GameObject[];
  zone: Phaser.GameObjects.Zone;
  render(hover: boolean): void;
}

export interface IGlowButtonStyle {
  label: string;
  /** Arte da placa; sem ela o botão é desenhado por código. */
  artKey: string;
  bgCol: number;
  borderCol: number;
}

/**
 * Botão do menu de pausa. Texto sempre branco; selecionado cresce um pouco e acende uma luz
 * macia da cor do botão por trás.
 */
export function createGlowButton(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, style: IGlowButtonStyle
): IGlowButton {
  const t = MODAL_THEME.pause;
  const hasArt = Boolean(scene.textures?.exists(style.artKey));
  const objects: Phaser.GameObjects.GameObject[] = [];

  const glow = hasArt && ensureSoftGlow(scene)
    ? scene.add.image(x, y, SOFT_GLOW_KEY).setTint(style.borderCol).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
    : undefined;
  const bg = scene.add.graphics();
  const plate = hasArt ? scene.add.image(x, y, style.artKey).setDisplaySize(w, h) : undefined;
  const txt = scene.add.text(x, y - 1, style.label, {
    fontFamily: FONTS.body,
    fontSize: '13px',
    fontStyle: 'bold',
    color: COLORS.textWhite,
    stroke: t.textStroke,
    strokeThickness: 4
  }).setOrigin(0.5, 0.5);
  if (glow) objects.push(glow);
  objects.push(bg);
  if (plate) objects.push(plate);
  objects.push(txt);

  const render = (hover: boolean): void => {
    bg.clear();
    if (plate) {
      const s = hover ? 1.07 : 1;
      plate.setDisplaySize(w * s, h * s);
      txt.setScale(s);
      glow?.setDisplaySize(w * 1.45, h * 2.2).setAlpha(hover ? 0.75 : 0);
      return;
    }
    bg.fillStyle(style.bgCol, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    bg.lineStyle(hover ? 3 : 2, hover ? t.btnHoverBorder : style.borderCol, 1);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
  };
  render(false);

  const zone = scene.add.zone(x, y, w, h);
  zone.setInteractive({ useHandCursor: true });
  objects.push(zone);
  return { objects, zone, render };
}

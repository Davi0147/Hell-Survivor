import type Phaser from 'phaser';
import { ITEM_COLORS } from '../config/theme';

/**
 * Arte provisória (40x40, desenhada por código) dos itens de mapa novos.
 * Regra 10 do AGENTS.md: sprite antes de código. Isto é o plano B até a sprite sheet
 * pedida em `docs/ART_PROMPTS.md` §11 chegar; quando chegar, a BootScene carrega as
 * imagens com as mesmas chaves e estas funções deixam de desenhar (só desenham se a
 * textura não existir).
 */
const SIZE = 40;
const P = ITEM_COLORS.placeholder;

type Painter = (ctx: CanvasRenderingContext2D) => void;

/** Retângulo com contorno de 1 pixel, no espírito da pixel art do jogo. */
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = P.outline;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string): void {
  ctx.fillStyle = P.outline;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

const PAINTERS: Record<string, Painter> = {
  'item-bomb': (ctx) => {
    disc(ctx, 19, 24, 12, P.bombBody);
    ctx.fillStyle = P.bombShine;
    ctx.fillRect(12, 17, 4, 3);
    ctx.fillRect(11, 20, 2, 3);
    block(ctx, 16, 10, 6, 3, P.bombShine);
    // Pavio e faísca
    ctx.fillStyle = P.fuse;
    ctx.fillRect(21, 6, 2, 5);
    ctx.fillRect(23, 4, 3, 2);
    ctx.fillStyle = P.flame;
    ctx.fillRect(25, 1, 5, 5);
    ctx.fillStyle = P.flameCore;
    ctx.fillRect(26, 2, 3, 3);
  },
  'item-hourglass': (ctx) => {
    block(ctx, 9, 4, 22, 3, P.glassFrame);
    block(ctx, 9, 33, 22, 3, P.glassFrame);
    ctx.fillStyle = P.outline;
    ctx.beginPath();
    ctx.moveTo(10, 7); ctx.lineTo(30, 7); ctx.lineTo(21, 20); ctx.lineTo(30, 33); ctx.lineTo(10, 33); ctx.lineTo(19, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.glass;
    ctx.beginPath();
    ctx.moveTo(12, 8); ctx.lineTo(28, 8); ctx.lineTo(20, 19); ctx.lineTo(28, 32); ctx.lineTo(12, 32); ctx.lineTo(20, 19);
    ctx.closePath();
    ctx.fill();
    // Areia caindo e acumulada
    ctx.fillStyle = P.sand;
    ctx.fillRect(16, 10, 8, 3);
    ctx.fillRect(19, 19, 2, 8);
    ctx.fillRect(14, 27, 12, 5);
    // Rachadura
    ctx.fillStyle = P.outline;
    ctx.fillRect(25, 11, 1, 3);
    ctx.fillRect(24, 14, 1, 2);
  },
  'item-fury': (ctx) => {
    block(ctx, 17, 3, 6, 4, P.flaskCork);
    block(ctx, 16, 7, 8, 6, P.flaskGlass);
    disc(ctx, 20, 25, 12, P.flaskGlass);
    ctx.fillStyle = P.flaskLiquid;
    ctx.beginPath();
    ctx.arc(20, 26, 10, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(10, 22, 20, 4);
    ctx.fillStyle = P.flaskLiquidLight;
    ctx.fillRect(13, 22, 6, 2);
    ctx.fillRect(24, 28, 2, 2);
    ctx.fillRect(16, 31, 2, 2);
  },
  'item-relic': (ctx) => {
    disc(ctx, 20, 20, 15, P.relicGoldDark);
    disc(ctx, 20, 20, 12, P.relicGold);
    // Estrela de 4 pontas gravada
    ctx.fillStyle = P.relicGoldDark;
    ctx.fillRect(19, 9, 2, 22);
    ctx.fillRect(9, 19, 22, 2);
    disc(ctx, 20, 20, 4, P.relicGem);
    ctx.fillStyle = P.flameCore;
    ctx.fillRect(18, 18, 2, 2);
  },
};

/** Desenha (uma vez) a arte provisória dos itens novos que ainda não têm sprite. */
export function ensurePlaceholderItemTextures(scene: Phaser.Scene): void {
  for (const [key, paint] of Object.entries(PAINTERS)) {
    if (scene.textures.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    paint(ctx);
    scene.textures.addCanvas(key, canvas);
  }
}

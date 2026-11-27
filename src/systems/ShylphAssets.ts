import type Phaser from 'phaser';
import { SHYLPH_SHEET, SHYLPH_FRAME_SIZE, type ShylphSheetKey } from '../config/shylphSheet';
import { SHYLPH_TORNADO_SHEET, SHYLPH_SERAPH_SHEET } from '../config/shylphFxSheet';

/** Textura da folha da Shylph (Capítulo 3) e da pena dela. */
export const SHYLPH_TEXTURE = 'shylph-sheet';
export const SHYLPH_FEATHER_TEXTURE = 'shylph-feather';
/** Forma de Serafim: quadro 0 = asas em cima, quadro 1 = asas embaixo (a chefe alterna no código). */
export const SHYLPH_SERAPH_TEXTURE = 'shylph-seraph';
export const SERAPH_FRAME_WINGS_UP = 0;
export const SERAPH_FRAME_WINGS_DOWN = 1;
/** Só para a galeria de testes (na luta o bater de asas é feito pela chefe, com o corpo subindo). */
export const SHYLPH_SERAPH_GALLERY_ANIM = 'shylph-seraph-gallery';
/** Furacão do Vendaval (girando em loop). */
export const SHYLPH_TORNADO_TEXTURE = 'shylph-tornado';
export const SHYLPH_TORNADO_ANIM = 'shylph-tornado-spin';

/** Quadros por segundo de cada animação (andar arrastado é mais lento de propósito). */
const FRAME_RATE: Record<string, number> = {
  walk: 7,
  lick: 4,
  throw: 13,
  flap: 11,
  kneel: 6,
};
const TORNADO_FRAME_RATE = 16;

/** Chave da animação no Phaser: `shylph-walk-east`, `shylph-kneel-south`... */
export const shylphAnimKey = (k: ShylphSheetKey | 'rise-south'): string => `shylph-${k}`;

/** Primeiro quadro da pose parada numa direção da folha. */
export const shylphRotationFrame = (dir: 'south' | 'east' | 'north'): number => SHYLPH_SHEET[`rot-${dir}`].start;

export function preloadShylphAssets(load: Phaser.Loader.LoaderPlugin, cacheBuster: string | number): void {
  const dir = 'assets/sprites/enemies/Shylph';
  load.spritesheet(SHYLPH_TEXTURE, `${dir}/shylph-sheet.png?t=${cacheBuster}`, {
    frameWidth: SHYLPH_FRAME_SIZE,
    frameHeight: SHYLPH_FRAME_SIZE,
  });
  load.image(SHYLPH_FEATHER_TEXTURE, `${dir}/shylph-feather.png?t=${cacheBuster}`);
  load.spritesheet(SHYLPH_TORNADO_TEXTURE, `${dir}/shylph-tornado.png?t=${cacheBuster}`, {
    frameWidth: SHYLPH_TORNADO_SHEET.frameWidth,
    frameHeight: SHYLPH_TORNADO_SHEET.frameHeight,
  });
  load.spritesheet(SHYLPH_SERAPH_TEXTURE, `${dir}/shylph-seraph.png?t=${cacheBuster}`, {
    frameWidth: SHYLPH_SERAPH_SHEET.frameWidth,
    frameHeight: SHYLPH_SERAPH_SHEET.frameHeight,
  });
}

/** Remove texturas e animações (o BootScene recarrega tudo no hot-reload). */
export function unloadShylphAssets(textures: Phaser.Textures.TextureManager, anims: Phaser.Animations.AnimationManager): void {
  for (const k of Object.keys(SHYLPH_SHEET) as ShylphSheetKey[]) {
    if (anims.exists(shylphAnimKey(k))) anims.remove(shylphAnimKey(k));
  }
  for (const a of [shylphAnimKey('rise-south'), SHYLPH_TORNADO_ANIM, SHYLPH_SERAPH_GALLERY_ANIM]) {
    if (anims.exists(a)) anims.remove(a);
  }
  for (const t of [SHYLPH_TEXTURE, SHYLPH_FEATHER_TEXTURE, SHYLPH_TORNADO_TEXTURE, SHYLPH_SERAPH_TEXTURE]) {
    if (textures.exists(t)) textures.remove(t);
  }
}

export function createShylphAnims(anims: Phaser.Animations.AnimationManager): void {
  for (const k of Object.keys(SHYLPH_SHEET) as ShylphSheetKey[]) {
    if (k.startsWith('rot-')) continue;
    const { start, count } = SHYLPH_SHEET[k];
    const kind = k.split('-')[0];
    anims.create({
      key: shylphAnimKey(k),
      frames: anims.generateFrameNumbers(SHYLPH_TEXTURE, { start, end: start + count - 1 }),
      frameRate: FRAME_RATE[kind] ?? 10,
      repeat: kind === 'walk' ? -1 : 0,
    });
  }
  // Levantar = ajoelhar de trás para frente (sem gastar geração de arte)
  const kneel = SHYLPH_SHEET['kneel-south'];
  anims.create({
    key: shylphAnimKey('rise-south'),
    frames: Array.from({ length: kneel.count }, (_, i) => ({ key: SHYLPH_TEXTURE, frame: kneel.start + kneel.count - 1 - i })),
    frameRate: 8,
    repeat: 0,
  });
  anims.create({
    key: SHYLPH_TORNADO_ANIM,
    frames: anims.generateFrameNumbers(SHYLPH_TORNADO_TEXTURE, { start: 0, end: SHYLPH_TORNADO_SHEET.frames - 1 }),
    frameRate: TORNADO_FRAME_RATE,
    repeat: -1,
  });
  anims.create({
    key: SHYLPH_SERAPH_GALLERY_ANIM,
    frames: anims.generateFrameNumbers(SHYLPH_SERAPH_TEXTURE, { start: 0, end: SHYLPH_SERAPH_SHEET.frames - 1 }),
    frameRate: 3,
    repeat: -1,
  });
}

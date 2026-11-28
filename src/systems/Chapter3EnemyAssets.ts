import type Phaser from 'phaser';

/** Olho Alado: chaves da textura e da animação de voo. */
export const WINGED_EYE_TEXTURE = 'winged-eye-fly';
export const WINGED_EYE_ANIM = 'winged-eye-fly';

/**
 * Arte dos monstros do Capítulo 3 (PixelLab, só de lado; o outro lado é espelhado).
 * Fonte em art-source/novos/cap3-inimigos/; tiras montadas por scripts/pack-strip.py.
 */

/** Olho Alado: 7 quadros de 41x62 voando para a direita (o 4º quadro gerado foi descartado). */
const EYE_FRAME = { width: 41, height: 62, count: 7, frameRate: 14 } as const;

/** Guardião de Mármore: tira com os 8 quadros do andar e depois os 8 do martelo (120x139). */
export const STATUE_TEXTURE = 'statue-guardian';
export const STATUE_SHEET = {
  frameWidth: 120,
  frameHeight: 139,
  /** A arte foi desenhada olhando para a direita. */
  facesRight: true,
  walk: { start: 0, count: 8 },
  /**
   * Martelo: 0-3 segurando no ombro, 4 erguido, 5 batida no chão (com poeira), 6-7 martelo
   * parado no chão. `impact` = primeiro quadro da batida.
   */
  slam: { start: 8, count: 8, raised: 4, impact: 5 },
  /** Caixa de colisão no corpo/pés (px do quadro, antes da escala). */
  body: { width: 46, height: 52, bottomGap: 10 },
} as const;
export const STATUE_ANIMS = { walk: 'statue-guardian-walk' } as const;
/** Passos de estátua: devagar e pesado. */
const STATUE_WALK_FRAME_RATE = 7;

export function preloadChapter3EnemyAssets(load: Phaser.Loader.LoaderPlugin, cacheBuster: string | number): void {
  load.spritesheet(WINGED_EYE_TEXTURE, `assets/sprites/enemies/WingedEye/winged-eye-fly.png?t=${cacheBuster}`, {
    frameWidth: EYE_FRAME.width,
    frameHeight: EYE_FRAME.height,
  });
  load.spritesheet(STATUE_TEXTURE, `assets/sprites/enemies/StatueGuardian/statue-guardian.png?t=${cacheBuster}`, {
    frameWidth: STATUE_SHEET.frameWidth,
    frameHeight: STATUE_SHEET.frameHeight,
  });
}

/** Remove texturas e animações (o BootScene recarrega tudo no hot-reload). */
export function unloadChapter3EnemyAssets(textures: Phaser.Textures.TextureManager, anims: Phaser.Animations.AnimationManager): void {
  for (const a of [WINGED_EYE_ANIM, STATUE_ANIMS.walk]) if (anims.exists(a)) anims.remove(a);
  for (const t of [WINGED_EYE_TEXTURE, STATUE_TEXTURE]) if (textures.exists(t)) textures.remove(t);
}

export function createChapter3EnemyAnims(anims: Phaser.Animations.AnimationManager): void {
  anims.create({
    key: WINGED_EYE_ANIM,
    frames: anims.generateFrameNumbers(WINGED_EYE_TEXTURE, { start: 0, end: EYE_FRAME.count - 1 }),
    frameRate: EYE_FRAME.frameRate,
    repeat: -1,
  });
  const w = STATUE_SHEET.walk;
  anims.create({
    key: STATUE_ANIMS.walk,
    frames: anims.generateFrameNumbers(STATUE_TEXTURE, { start: w.start, end: w.start + w.count - 1 }),
    frameRate: STATUE_WALK_FRAME_RATE,
    repeat: -1,
  });
}

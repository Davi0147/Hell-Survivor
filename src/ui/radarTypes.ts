import Phaser from 'phaser';

/** Contrato mínimo que o radar e a seta de borda leem do jogador. */
export interface RadarPlayer {
  x: number;
  y: number;
  currentDirection?: string;
  body?: { velocity: { x: number; y: number } } | null;
}

interface RadarGroup {
  getChildren(): Phaser.GameObjects.GameObject[];
}

export interface RadarCrystal {
  x: number;
  y: number;
  active: boolean;
  isCompleted?: boolean;
  isDestroyed?: boolean;
}

/** Contrato mínimo que o radar e a seta de borda leem da GameScene. */
export interface RadarWorld {
  enemiesGroup?: RadarGroup;
  mapItemsGroup?: RadarGroup;
  azazelCrystals?: RadarCrystal[];
  altarInstance?: { x: number; y: number; active: boolean; isDestroyed?: boolean } | null;
  bossSummonAltar?: { x: number; y: number; isCompleted: boolean; isActive: boolean; isBossSpawned: boolean } | null;
  /** Ladrão de Almas vivo (sempre no radar e na seta de borda). */
  soulThief?: { x: number; y: number; timeLeftMs: number };
  /** Talismãs no chão (prêmio do minichefe): sempre no radar e na seta de borda. */
  talismanDrops?: readonly { x: number; y: number; active: boolean }[];
  cameras?: { main?: Phaser.Cameras.Scene2D.Camera };
}

/** Campos lidos de cada inimigo para desenhar o blip. */
export interface RadarEnemy {
  x: number;
  y: number;
  active: boolean;
  visible: boolean;
  isDead?: boolean;
  maxHp?: number;
  texture?: { key: string };
}

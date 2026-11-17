import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { IntroScene } from '../scenes/IntroScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';
import { UpgradeScene } from '../scenes/UpgradeScene';
import { Chapter1EndScene } from '../scenes/Chapter1EndScene';

import { GAME_HEIGHT, GAME_MIN_WIDTH } from './screenFit';
export { GAME_HEIGHT, GAME_MIN_WIDTH, GAME_MAX_WIDTH, getGameWidthForScreen } from './screenFit';

export function createGameConfig(width: number = GAME_MIN_WIDTH): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    input: {
      activePointers: 4,
      gamepad: true
    },
    backgroundColor: '#0d0b0e',
    scene: [BootScene, MenuScene, IntroScene, GameScene, UIScene, UpgradeScene, Chapter1EndScene]
  };
}


import Phaser from 'phaser';
import { GAME_CONFIG } from './config/gameConfig';

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(GAME_CONFIG);
});

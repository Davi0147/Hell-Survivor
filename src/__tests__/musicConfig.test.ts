import { describe, it, expect } from 'vitest';
import {
  clampVolume,
  getMusicConfig,
  MUSIC_CONFIGS,
  ALL_BGM_KEYS,
  battleMusicState,
  dialogueDuckFor,
  type MusicState
} from '../config/musicConfig';

describe('Music Configuration (musicConfig.ts)', () => {
  describe('clampVolume utility', () => {
    it('clamps values below minimum', () => {
      expect(clampVolume(-1, 0, 10)).toBe(0);
      expect(clampVolume(0.01, 0.02, 0.06)).toBe(0.02);
    });

    it('clamps values above maximum', () => {
      expect(clampVolume(15, 0, 10)).toBe(10);
      expect(clampVolume(0.9, 0.02, 0.06)).toBe(0.06);
    });

    it('preserves values within range', () => {
      expect(clampVolume(5, 0, 10)).toBe(5);
      expect(clampVolume(0.04, 0.02, 0.06)).toBe(0.04);
    });
  });

  describe('Track Keys Catalog', () => {
    it('contains all 11 audio keys used across the game', () => {
      expect(ALL_BGM_KEYS).toEqual([
        'bgm-menu',
        'bgm-battle',
        'bgm-boss',
        'bgm-intro',
        'bgm-spooky',
        'bgm-azazel-intro',
        'bgm-azazel-mid',
        'bgm-azazel-fight',
        'bgm-battle-ch2',
        'bgm-battle-ch3',
        'bgm-boss-shylph'
      ]);
    });

    it('every state track is in the stop-all list', () => {
      for (const cfg of Object.values(MUSIC_CONFIGS)) {
        if (cfg.trackKey) expect(ALL_BGM_KEYS).toContain(cfg.trackKey);
      }
    });
  });

  describe('Music during dialogue', () => {
    it('background music gets quieter while a dialogue is open and back to normal after', () => {
      expect(dialogueDuckFor('BATTLE_CH3', true)).toBeLessThan(0.5);
      expect(dialogueDuckFor('BATTLE_CH3', false)).toBe(1);
    });

    it('Azazel intro (already the quiet dialogue track) is not lowered again', () => {
      expect(dialogueDuckFor('AZAZEL_INTRO', true)).toBe(1);
    });
  });

  describe('Horde music per chapter', () => {
    it('chapters 2 and 3 have their own horde track; chapter 1 (and others) keep the original', () => {
      expect(battleMusicState(1)).toBe('BATTLE');
      expect(battleMusicState(2)).toBe('BATTLE_CH2');
      expect(battleMusicState(3)).toBe('BATTLE_CH3');
      expect(battleMusicState(202)).toBe('BATTLE');
      expect(MUSIC_CONFIGS.BATTLE_CH2).toMatchObject({ trackKey: 'bgm-battle-ch2', loop: true });
      expect(MUSIC_CONFIGS.BATTLE_CH3).toMatchObject({ trackKey: 'bgm-battle-ch3', loop: true });
    });

    it('Shylph has her own boss track, about as loud as the Rosalin fight', () => {
      expect(MUSIC_CONFIGS.BOSS_SHYLPH).toMatchObject({ trackKey: 'bgm-boss-shylph', loop: true });
      // Faixa medida 0,8 dB mais alta: volume ~0,91x o da Rosalin (10^(-0.8/20))
      const ratio = MUSIC_CONFIGS.BOSS_SHYLPH.calculateVolume(0.1) / MUSIC_CONFIGS.BOSS_SUCCUBUS.calculateVolume(0.1);
      expect(ratio).toBeCloseTo(0.91, 1);
    });
  });

  describe('State Definitions, Loops and Fades', () => {
    const expectedStates: MusicState[] = [
      'MENU',
      'INTRO',
      'BATTLE',
      'BATTLE_CH2',
      'BATTLE_CH3',
      'BOSS_SUCCUBUS',
      'BOSS_SHYLPH',
      'AZAZEL_INTRO',
      'AZAZEL_MID',
      'AZAZEL_FIGHT',
      'VICTORY_SCENE',
      'SILENCE'
    ];

    it.each(expectedStates)('defines configuration for state: %s', (state) => {
      const cfg = getMusicConfig(state);
      expect(cfg).toBeDefined();
      expect(cfg.state).toBe(state);
    });

    it('defines exact track keys, loop flags and default fade times matching legacy SoundManager', () => {
      expect(MUSIC_CONFIGS.MENU).toMatchObject({
        trackKey: 'bgm-menu',
        defaultFadeInMs: 1800,
        loop: true
      });

      expect(MUSIC_CONFIGS.INTRO).toMatchObject({
        trackKey: 'bgm-intro',
        defaultFadeInMs: 2500,
        loop: true
      });

      expect(MUSIC_CONFIGS.BATTLE).toMatchObject({
        trackKey: 'bgm-battle',
        defaultFadeInMs: 2500,
        loop: true
      });

      expect(MUSIC_CONFIGS.BOSS_SUCCUBUS).toMatchObject({
        trackKey: 'bgm-boss',
        defaultFadeInMs: 2000,
        loop: true
      });

      expect(MUSIC_CONFIGS.AZAZEL_INTRO).toMatchObject({
        trackKey: 'bgm-azazel-intro',
        defaultFadeInMs: 900,
        loop: true
      });

      expect(MUSIC_CONFIGS.AZAZEL_MID).toMatchObject({
        trackKey: 'bgm-azazel-mid',
        defaultFadeInMs: 0,
        loop: false
      });

      expect(MUSIC_CONFIGS.AZAZEL_FIGHT).toMatchObject({
        trackKey: 'bgm-azazel-fight',
        defaultFadeInMs: 0,
        loop: true
      });

      expect(MUSIC_CONFIGS.VICTORY_SCENE).toMatchObject({
        trackKey: 'bgm-spooky',
        defaultFadeInMs: 2500,
        loop: true
      });

      expect(MUSIC_CONFIGS.SILENCE).toMatchObject({
        trackKey: null,
        defaultFadeInMs: 0,
        loop: false
      });
    });
  });

  describe('Volume Formulas vs Current Game Defaults (baseVolume = 0.10)', () => {
    const baseVol = 0.10;

    it('computes exact values at default volume (0.10)', () => {
      expect(MUSIC_CONFIGS.MENU.calculateVolume(baseVol)).toBeCloseTo(0.10, 5);
      expect(MUSIC_CONFIGS.INTRO.calculateVolume(baseVol)).toBeCloseTo(0.05, 5); // 0.10 * 0.50
      expect(MUSIC_CONFIGS.BATTLE.calculateVolume(baseVol)).toBeCloseTo(0.10, 5);
      expect(MUSIC_CONFIGS.BOSS_SUCCUBUS.calculateVolume(baseVol)).toBeCloseTo(0.115, 5); // 0.10 * 1.15
      expect(MUSIC_CONFIGS.AZAZEL_INTRO.calculateVolume(baseVol)).toBeCloseTo(0.32, 5); // 0.10 * 3.2
      expect(MUSIC_CONFIGS.AZAZEL_MID.calculateVolume(baseVol)).toBeCloseTo(0.42, 5); // 0.10 * 4.2
      expect(MUSIC_CONFIGS.AZAZEL_FIGHT.calculateVolume(baseVol, 1.0)).toBeCloseTo(0.38, 5); // 0.10 * 3.8
      expect(MUSIC_CONFIGS.AZAZEL_FIGHT.calculateVolume(baseVol, 1.3)).toBeCloseTo(0.494, 5); // 0.10 * 3.8 * 1.3
      expect(MUSIC_CONFIGS.VICTORY_SCENE.calculateVolume(baseVol)).toBeCloseTo(0.045, 5); // 0.10 * 0.45
      expect(MUSIC_CONFIGS.SILENCE.calculateVolume(baseVol)).toBe(0);
    });

    it('enforces clamps under extreme high volume (baseVolume = 1.0)', () => {
      const highVol = 1.0;
      expect(MUSIC_CONFIGS.INTRO.calculateVolume(highVol)).toBe(0.06); // clamped to 0.06
      expect(MUSIC_CONFIGS.VICTORY_SCENE.calculateVolume(highVol)).toBe(0.06); // clamped to 0.06
      expect(MUSIC_CONFIGS.AZAZEL_INTRO.calculateVolume(highVol)).toBe(0.65); // clamped to 0.65
      expect(MUSIC_CONFIGS.AZAZEL_MID.calculateVolume(highVol)).toBe(1.0); // clamped to 1.0
      expect(MUSIC_CONFIGS.AZAZEL_FIGHT.calculateVolume(highVol)).toBe(1.0); // clamped to 1.0
    });

    it('enforces clamps under extreme low volume (baseVolume = 0.01)', () => {
      const lowVol = 0.01;
      expect(MUSIC_CONFIGS.INTRO.calculateVolume(lowVol)).toBe(0.02); // floored at 0.02
      expect(MUSIC_CONFIGS.VICTORY_SCENE.calculateVolume(lowVol)).toBe(0.02); // floored at 0.02
      expect(MUSIC_CONFIGS.AZAZEL_INTRO.calculateVolume(lowVol)).toBe(0.18); // floored at 0.18
      expect(MUSIC_CONFIGS.AZAZEL_MID.calculateVolume(lowVol)).toBe(0.28); // floored at 0.28
      expect(MUSIC_CONFIGS.AZAZEL_FIGHT.calculateVolume(lowVol)).toBe(0.25); // floored at 0.25
    });
  });

  describe('Legacy setMusicVolume Inconsistencies Documentation', () => {
    it('documents legacy setMusicVolume clamp difference on VICTORY_SCENE (0.07 vs 0.06)', () => {
      expect(MUSIC_CONFIGS.VICTORY_SCENE.calculateVolume(1.0)).toBe(0.06);
      expect(MUSIC_CONFIGS.VICTORY_SCENE.calculateLegacySetVolume(1.0)).toBe(0.07);
    });

    it('documents legacy setMusicVolume formula difference on AZAZEL_INTRO', () => {
      expect(MUSIC_CONFIGS.AZAZEL_INTRO.calculateVolume(0.10)).toBeCloseTo(0.32, 5);
      // Legado agrupava com spooky (0.10 * 0.45 = 0.045)
      expect(MUSIC_CONFIGS.AZAZEL_INTRO.calculateLegacySetVolume(0.10)).toBeCloseTo(0.045, 5);
    });

    it('documents legacy setMusicVolume formula difference on AZAZEL_FIGHT and AZAZEL_MID', () => {
      expect(MUSIC_CONFIGS.AZAZEL_FIGHT.calculateVolume(0.10, 1.0)).toBeCloseTo(0.38, 5);
      // Legado agrupava com boss (0.10 * 1.15 = 0.115)
      expect(MUSIC_CONFIGS.AZAZEL_FIGHT.calculateLegacySetVolume(0.10, 1.0)).toBeCloseTo(0.115, 5);

      expect(MUSIC_CONFIGS.AZAZEL_MID.calculateVolume(0.10)).toBeCloseTo(0.42, 5);
      expect(MUSIC_CONFIGS.AZAZEL_MID.calculateLegacySetVolume(0.10, 1.0)).toBeCloseTo(0.115, 5);
    });
  });
});

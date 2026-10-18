/**
 * musicConfig.ts - Configuração Pura do Diretor de Música (Pacote ÁUDIO-1)
 *
 * Mapeamento determinístico de estado -> { trackKey, calculateVolume, defaultFadeInMs, loop }.
 * Os valores foram copiados com precisão cirúrgica de SoundManager.ts:
 *  - playMenuMusic (linha 182)
 *  - playIntroMusic (linha 191)
 *  - playBattleMusic (linha 201)
 *  - playBossMusic (linha 210)
 *  - playSpookyMusic (linha 219)
 *  - playAzazelIntroMusic (linha 229)
 *  - finishAzazelIntroAndTransition (linha 317)
 *  - playAzazelFightMusic (linha 239)
 *  - setMusicVolume (linhas ~73-79)
 */

export function clampVolume(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export type MusicState =
  | 'MENU'
  | 'INTRO'
  | 'BATTLE'
  | 'BOSS_SUCCUBUS'
  | 'AZAZEL_INTRO'
  | 'AZAZEL_MID'
  | 'AZAZEL_FIGHT'
  | 'VICTORY_SCENE'
  | 'SILENCE';

export interface MusicTrackConfig {
  readonly state: MusicState;
  readonly trackKey: string | null;
  readonly defaultFadeInMs: number;
  readonly loop: boolean;
  /**
   * Fórmula exata executada ao disparar play*Music ou transição de Azazel
   */
  readonly calculateVolume: (baseVolume: number, boostMultiplier?: number) => number;
  /**
   * Fórmula exata preservada das linhas ~73-79 do SoundManager.setMusicVolume legado
   */
  readonly calculateLegacySetVolume: (baseVolume: number, boostMultiplier?: number) => number;
}

export const ALL_BGM_KEYS: readonly string[] = [
  'bgm-menu',
  'bgm-battle',
  'bgm-boss',
  'bgm-intro',
  'bgm-spooky',
  'bgm-azazel-intro',
  'bgm-azazel-mid',
  'bgm-azazel-fight'
] as const;

export const MUSIC_CONFIGS: Readonly<Record<MusicState, MusicTrackConfig>> = {
  MENU: {
    state: 'MENU',
    trackKey: 'bgm-menu',
    defaultFadeInMs: 1800,
    loop: true,
    calculateVolume: (baseVolume: number) => baseVolume,
    calculateLegacySetVolume: (baseVolume: number) => baseVolume
  },
  INTRO: {
    state: 'INTRO',
    trackKey: 'bgm-intro',
    defaultFadeInMs: 2500,
    loop: true,
    calculateVolume: (baseVolume: number) => clampVolume(baseVolume * 0.50, 0.02, 0.06),
    calculateLegacySetVolume: (baseVolume: number) => clampVolume(baseVolume * 0.50, 0.02, 0.06)
  },
  BATTLE: {
    state: 'BATTLE',
    trackKey: 'bgm-battle',
    defaultFadeInMs: 2500,
    loop: true,
    calculateVolume: (baseVolume: number) => baseVolume,
    calculateLegacySetVolume: (baseVolume: number) => baseVolume
  },
  BOSS_SUCCUBUS: {
    state: 'BOSS_SUCCUBUS',
    trackKey: 'bgm-boss',
    defaultFadeInMs: 2000,
    loop: true,
    // playBossMusic usa this.musicVolume * 1.15
    calculateVolume: (baseVolume: number, boostMultiplier = 1.0) => baseVolume * 1.15 * boostMultiplier,
    // setMusicVolume linha 74 usa Clamp(this.musicVolume * 1.15 * this.bgmBoostMultiplier, 0, 1)
    calculateLegacySetVolume: (baseVolume: number, boostMultiplier = 1.0) =>
      clampVolume(baseVolume * 1.15 * boostMultiplier, 0, 1)
  },
  AZAZEL_INTRO: {
    state: 'AZAZEL_INTRO',
    trackKey: 'bgm-azazel-intro',
    defaultFadeInMs: 900,
    loop: true,
    // playAzazelIntroMusic linha 229: Clamp(this.musicVolume * 3.2, 0.18, 0.65)
    calculateVolume: (baseVolume: number) => clampVolume(baseVolume * 3.2, 0.18, 0.65),
    // Inconsistência no código legado em setMusicVolume linha 77-78:
    // Agrupado com bgm-spooky como Clamp(this.musicVolume * 0.45, 0.02, 0.07)
    calculateLegacySetVolume: (baseVolume: number) => clampVolume(baseVolume * 0.45, 0.02, 0.07)
  },
  AZAZEL_MID: {
    state: 'AZAZEL_MID',
    trackKey: 'bgm-azazel-mid',
    defaultFadeInMs: 0,
    loop: false,
    // finishAzazelIntroAndTransition linha 317: Clamp(this.musicVolume * 4.2, 0.28, 1)
    calculateVolume: (baseVolume: number) => clampVolume(baseVolume * 4.2, 0.28, 1),
    // Inconsistência no código legado em setMusicVolume linha 73-74:
    // Agrupado com bgm-boss como Clamp(this.musicVolume * 1.15 * this.bgmBoostMultiplier, 0, 1)
    calculateLegacySetVolume: (baseVolume: number, boostMultiplier = 1.0) =>
      clampVolume(baseVolume * 1.15 * boostMultiplier, 0, 1)
  },
  AZAZEL_FIGHT: {
    state: 'AZAZEL_FIGHT',
    trackKey: 'bgm-azazel-fight',
    defaultFadeInMs: 0,
    loop: true,
    // playAzazelFightMusic linha 239: Clamp(this.musicVolume * 3.8 * this.bgmBoostMultiplier, 0.25, 1)
    calculateVolume: (baseVolume: number, boostMultiplier = 1.0) =>
      clampVolume(baseVolume * 3.8 * boostMultiplier, 0.25, 1),
    // Inconsistência no código legado em setMusicVolume linha 73-74:
    // Agrupado com bgm-boss como Clamp(this.musicVolume * 1.15 * this.bgmBoostMultiplier, 0, 1)
    calculateLegacySetVolume: (baseVolume: number, boostMultiplier = 1.0) =>
      clampVolume(baseVolume * 1.15 * boostMultiplier, 0, 1)
  },
  VICTORY_SCENE: {
    state: 'VICTORY_SCENE',
    trackKey: 'bgm-spooky',
    defaultFadeInMs: 2500,
    loop: true,
    // playSpookyMusic linha 219: Clamp(this.musicVolume * 0.45, 0.02, 0.06)
    calculateVolume: (baseVolume: number) => clampVolume(baseVolume * 0.45, 0.02, 0.06),
    // Inconsistência no código legado em setMusicVolume linha 78:
    // Teto de 0.07 em vez de 0.06
    calculateLegacySetVolume: (baseVolume: number) => clampVolume(baseVolume * 0.45, 0.02, 0.07)
  },
  SILENCE: {
    state: 'SILENCE',
    trackKey: null,
    defaultFadeInMs: 0,
    loop: false,
    calculateVolume: () => 0,
    calculateLegacySetVolume: () => 0
  }
};

export function getMusicConfig(state: MusicState): MusicTrackConfig {
  return MUSIC_CONFIGS[state];
}

import type Phaser from 'phaser';
import {
  ALL_BGM_KEYS,
  clampVolume,
  getMusicConfig,
  type MusicState
} from '../config/musicConfig';
import { DebugSessionLogger } from './DebugSessionLogger';
import { STORAGE_KEYS } from '../config/storageKeys';

interface PlayableSound extends Phaser.Sound.BaseSound {
  volume: number;
  loop?: boolean;
  seek?: number;
  source?: { loop?: boolean };
  setVolume?(volume: number): PlayableSound;
  setLoop?(loop: boolean): PlayableSound;
  volumeNode?: { gain?: { value?: number } };
  currentConfig?: { volume?: number };
}

interface ActiveFade {
  intervalId: number;
  sound: Phaser.Sound.BaseSound;
  onComplete?: () => void;
}

function setSoundVolume(sound: Phaser.Sound.BaseSound | undefined, volume: number): void {
  if (!sound) return;
  const pSound = sound as PlayableSound;
  if (typeof pSound.setVolume === 'function') {
    pSound.setVolume(volume);
  } else {
    pSound.volume = volume;
  }
}

function getSoundVolume(sound: Phaser.Sound.BaseSound | undefined): number {
  if (!sound) return 0;
  return (sound as PlayableSound).volume ?? 0;
}

function stopAndDestroySound(sound: Phaser.Sound.BaseSound | undefined): void {
  if (!sound) return;
  try {
    sound.stop();
    sound.destroy();
  } catch {
    /* Silencia caso o som ja tenha sido desmontado pelo Phaser */
  }
}

/**
 * MusicDirector - Diretor Central de Música (Pacote ÁUDIO-1)
 *
 * Responsabilidades:
 *  - Garantir no máximo UMA faixa de música tocando no jogo inteiro.
 *  - Gerenciar transições de estado via setMusicState(estado, motivo).
 *  - Executar fade-in e fade-out usando temporizadores independentes do ciclo
 *    de vida de cenas (não depende de this.scene.tweens).
 *  - Compatibilidade com Web Audio e HTML5 Audio (usa setVolume em vez de AudioNode direto).
 *  - Registrar cada transição no DebugSessionLogger.
 */
export class MusicDirector {
  private static instance: MusicDirector;

  private scene?: Phaser.Scene;
  private currentState: MusicState = 'SILENCE';
  private currentBgm?: Phaser.Sound.BaseSound;
  private currentBgmKey?: string;
  private masterMusicVolume: number = 0.10;
  private bgmBoostMultiplier: number = 1.0;

  private activeFades: ActiveFade[] = [];
  private azazelTimers: number[] = [];

  private constructor() {
    this.loadSavedVolume();
  }

  public static getInstance(): MusicDirector {
    if (!MusicDirector.instance) {
      MusicDirector.instance = new MusicDirector();
    }
    return MusicDirector.instance;
  }

  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  private loadSavedVolume(): void {
    try {
      const savedMusic = localStorage.getItem(STORAGE_KEYS.BGM_VOLUME);
      if (savedMusic !== null) {
        const val = parseFloat(savedMusic);
        if (!isNaN(val)) this.masterMusicVolume = clampVolume(val, 0, 1);
      }
    } catch {
      /* LocalStorage indisponivel em ambiente restrito */
    }
  }

  public getMusicVolume(): number {
    return this.masterMusicVolume;
  }

  public setMusicVolume(volume: number): void {
    this.masterMusicVolume = clampVolume(volume, 0, 1);
    try {
      localStorage.setItem(STORAGE_KEYS.BGM_VOLUME, this.masterMusicVolume.toString());
    } catch {
      /* Falha silenciosa no storage */
    }

    // Cancela fades em andamento para o ajuste manual ter resposta imediata
    this.clearAllActiveFades(false);

    if (this.currentBgm) {
      const config = getMusicConfig(this.currentState);
      const targetVol = config.calculateLegacySetVolume(this.masterMusicVolume, this.bgmBoostMultiplier);
      setSoundVolume(this.currentBgm, targetVol);
    }
  }

  public getCurrentState(): MusicState {
    return this.currentState;
  }

  public getCurrentBgmKey(): string | undefined {
    return this.currentBgmKey;
  }

  public getBoostMultiplier(): number {
    return this.bgmBoostMultiplier;
  }

  /**
   * Altera o estado musical de forma determinística e atômica.
   * Garante que no máximo UMA faixa continue tocando.
   */
  public setMusicState(
    targetState: MusicState,
    reason: string,
    options?: { fadeInMs?: number; fadeOutMs?: number }
  ): void {
    const oldState = this.currentState;

    DebugSessionLogger.getInstance().log(
      'AUDIO',
      'INFO',
      `MusicDirector: [${oldState}] -> [${targetState}] (Motivo: ${reason})`
    );

    // Se já estiver no mesmo estado e o áudio estiver tocando, apenas atualiza volume se necessário
    if (oldState === targetState && this.currentBgm && this.currentBgm.isPlaying) {
      const config = getMusicConfig(targetState);
      const targetVol = config.calculateVolume(this.masterMusicVolume, this.bgmBoostMultiplier);
      setSoundVolume(this.currentBgm, targetVol);
      return;
    }

    // 1. Limpa todos os timers de transições de Azazel
    this.clearAzazelTimers();

    // 2. Trata o áudio anterior: fade-out ou parada imediata
    const fadeOutDuration = options?.fadeOutMs ?? 0;
    if (fadeOutDuration > 0 && this.currentBgm) {
      this.fadeOutAndDestroy(this.currentBgm, fadeOutDuration);
      this.currentBgm = undefined;
      this.currentBgmKey = undefined;
    } else {
      this.stopAndDestroyCurrent();
    }

    // 3. Interrompe todas as faixas registradas no sound manager do Phaser como rede de segurança
    if (this.scene?.sound) {
      for (const k of ALL_BGM_KEYS) {
        try {
          this.scene.sound.stopByKey(k);
        } catch {
          /* Ignora faixas nao instanciadas */
        }
      }
    }

    // 4. Se o novo estado for SILENCE, finaliza aqui
    if (targetState === 'SILENCE') {
      this.currentState = 'SILENCE';
      this.bgmBoostMultiplier = 1.0;
      return;
    }

    // 5. Configuração da nova faixa
    const config = getMusicConfig(targetState);
    if (!config.trackKey) {
      this.currentState = targetState;
      return;
    }

    if (!this.scene?.sound) {
      this.currentState = targetState;
      return;
    }

    try {
      if (!this.scene.cache.audio.exists(config.trackKey)) {
        console.warn(`[MusicDirector] Áudio "${config.trackKey}" não encontrado no cache.`);
        this.currentState = targetState;
        return;
      }

      const targetVolume = config.calculateVolume(this.masterMusicVolume, this.bgmBoostMultiplier);
      const fadeInDuration = options?.fadeInMs ?? config.defaultFadeInMs;
      const startVolume = fadeInDuration > 0 ? 0 : targetVolume;

      const newBgm = this.scene.sound.add(config.trackKey, {
        loop: config.loop,
        volume: startVolume
      });

      // Blindagem contra crash "Cannot set properties of null (setting 'volume')"
      this.protectSoundVolumeProperty(newBgm);

      newBgm.play();
      this.currentBgm = newBgm;
      this.currentBgmKey = config.trackKey;
      this.currentState = targetState;

      if (fadeInDuration > 0) {
        this.startVolumeFade(newBgm, 0, targetVolume, fadeInDuration);
      } else {
        setSoundVolume(newBgm, targetVolume);
      }
    } catch (e) {
      console.warn(`[MusicDirector] Falha ao iniciar BGM "${config.trackKey}":`, e);
      this.currentState = targetState;
    }
  }

  /**
   * Eleva ou restaura o multiplicador de volume (ex.: Fase 2 de Azazel)
   */
  public boostCurrentMusicVolume(multiplier: number = 1.3): void {
    this.bgmBoostMultiplier = multiplier;
    if (this.currentBgm) {
      const config = getMusicConfig(this.currentState);
      const targetVol = config.calculateVolume(this.masterMusicVolume, this.bgmBoostMultiplier);
      this.startVolumeFade(this.currentBgm, getSoundVolume(this.currentBgm), targetVol, 500);
    }
  }

  /**
   * Encerra a reprodução com ou sem fade-out
   */
  public stopMusic(fadeOutMs: number = 0, reason: string = 'stopMusic chamado'): void {
    this.setMusicState('SILENCE', reason, { fadeOutMs });
  }

  /**
   * Transição musical tripartite de Azazel: intro.mp3 -> mid.mp3 -> fight.mp3
   */
  public finishAzazelIntroAndTransition(onMidStart: () => void, onFightStart: () => void): void {
    this.clearAzazelTimers();

    let midStarted = false;
    let fightStarted = false;

    const startFightStage = () => {
      if (fightStarted) return;
      fightStarted = true;
      this.clearAzazelTimers();
      this.setMusicState('AZAZEL_FIGHT', 'Azazel transição para fight.mp3', { fadeInMs: 0 });
      try {
        onFightStart();
      } catch (e) {
        console.error('[MusicDirector] Erro em onFightStart:', e);
      }
    };

    const startMidStage = () => {
      if (midStarted) return;
      midStarted = true;
      this.clearAzazelTimers();

      // Interrompe a intro e entra em AZAZEL_MID
      this.stopAndDestroyCurrent();

      let midDurationMs = 2050;
      if (this.scene?.sound && this.scene.cache.audio.exists('bgm-azazel-mid')) {
        try {
          const config = getMusicConfig('AZAZEL_MID');
          const midVol = config.calculateVolume(this.masterMusicVolume);
          const midBgm = this.scene.sound.add('bgm-azazel-mid', {
            loop: false,
            volume: midVol
          });
          this.protectSoundVolumeProperty(midBgm);

          this.currentBgm = midBgm;
          this.currentBgmKey = 'bgm-azazel-mid';
          this.currentState = 'AZAZEL_MID';

          midBgm.once('complete', () => {
            startFightStage();
          });
          midBgm.play();

          const pMid = midBgm as PlayableSound;
          const durSec = pMid.duration || pMid.totalDuration || 2.0;
          if (durSec > 0.3 && durSec < 10) {
            midDurationMs = Math.round(durSec * 1000);
          }
        } catch (e) {
          console.warn('[MusicDirector] Erro ao tocar bgm-azazel-mid:', e);
        }
      }

      try {
        onMidStart();
      } catch (e) {
        console.error('[MusicDirector] Erro em onMidStart:', e);
      }

      // Fallback timer caso o evento 'complete' não dispare
      const fallbackFightId = window.setTimeout(() => {
        startFightStage();
      }, midDurationMs + 80);
      this.azazelTimers.push(fallbackFightId);
    };

    // Se 'bgm-azazel-intro' está tocando, toca até o fim do loop atual
    if (this.currentBgm && this.currentBgmKey === 'bgm-azazel-intro' && this.currentBgm.isPlaying) {
      const introSound = this.currentBgm as PlayableSound;
      try {
        if (typeof introSound.setLoop === 'function') {
          introSound.setLoop(false);
        } else {
          introSound.loop = false;
        }
        if (introSound.source) {
          introSound.source.loop = false;
        }
      } catch {
        /* Falha segura ao remover loop */
      }

      this.currentBgm.once('complete', () => {
        startMidStage();
      });

      const duration = introSound.duration || introSound.totalDuration || 4.0;
      const rawSeek = introSound.seek || 0;
      const currentPos = duration > 0 ? rawSeek % duration : 0;
      const remainingMs = Math.max(350, Math.round((duration - currentPos) * 1000));

      const fallbackMidId = window.setTimeout(() => {
        startMidStage();
      }, remainingMs + 100);
      this.azazelTimers.push(fallbackMidId);
    } else {
      const fallbackMidId = window.setTimeout(() => {
        startMidStage();
      }, 450);
      this.azazelTimers.push(fallbackMidId);
    }
  }

  // =========================================================================
  // GESTÃO DE FADES INDEPENDENTES (NÃO DEPENDE DE this.scene.tweens)
  // =========================================================================

  private startVolumeFade(
    sound: Phaser.Sound.BaseSound,
    fromVol: number,
    toVol: number,
    durationMs: number,
    onComplete?: () => void
  ): void {
    if (durationMs <= 0) {
      setSoundVolume(sound, toVol);
      if (onComplete) onComplete();
      return;
    }

    const startTime = performance.now();
    setSoundVolume(sound, fromVol);

    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const currentVol = fromVol + (toVol - fromVol) * progress;

      setSoundVolume(sound, currentVol);

      if (progress >= 1) {
        window.clearInterval(intervalId);
        this.removeFade(intervalId);
        if (onComplete) {
          onComplete();
        }
      }
    }, 25);

    this.activeFades.push({ intervalId, sound, onComplete });
  }

  private fadeOutAndDestroy(sound: Phaser.Sound.BaseSound, durationMs: number): void {
    const startVol = getSoundVolume(sound);
    this.startVolumeFade(sound, startVol, 0, durationMs, () => {
      stopAndDestroySound(sound);
    });
  }

  private stopAndDestroyCurrent(): void {
    this.clearAllActiveFades(true);
    if (this.currentBgm) {
      stopAndDestroySound(this.currentBgm);
      this.currentBgm = undefined;
      this.currentBgmKey = undefined;
    }
  }

  private clearAllActiveFades(destroySounds: boolean): void {
    for (const fade of this.activeFades) {
      window.clearInterval(fade.intervalId);
      if (destroySounds) {
        stopAndDestroySound(fade.sound);
      }
    }
    this.activeFades = [];
  }

  private removeFade(intervalId: number): void {
    const idx = this.activeFades.findIndex((f) => f.intervalId === intervalId);
    if (idx !== -1) {
      this.activeFades.splice(idx, 1);
    }
  }

  private clearAzazelTimers(): void {
    for (const tid of this.azazelTimers) {
      window.clearTimeout(tid);
    }
    this.azazelTimers = [];
  }

  private protectSoundVolumeProperty(sound: Phaser.Sound.BaseSound): void {
    const soundObj = sound as unknown as Record<string, unknown>;
    const proto = Object.getPrototypeOf(soundObj);
    const origVolumeDesc = proto ? Object.getOwnPropertyDescriptor(proto, 'volume') : undefined;
    if (origVolumeDesc && origVolumeDesc.set) {
      const origSet = origVolumeDesc.set;
      Object.defineProperty(soundObj, 'volume', {
        set(this: PlayableSound, val: number) {
          if (!this.volumeNode || !this.volumeNode.gain) return;
          origSet.call(this, val);
        },
        get(this: PlayableSound) {
          return origVolumeDesc.get
            ? origVolumeDesc.get.call(this)
            : (this.volumeNode?.gain?.value ?? this.currentConfig?.volume ?? 0);
        },
        configurable: true
      });
    }
  }
}

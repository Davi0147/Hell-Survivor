import Phaser from 'phaser';
import { STORAGE_KEYS } from '../config/storageKeys';
import { MusicDirector } from './MusicDirector';
import type { SfxOutput } from './audio/SfxOutput';
import * as uiSfx from './audio/uiSfx';
import * as dialogueSfx from './audio/dialogueSfx';
import * as combatSfx from './audio/combatSfx';
import * as cutsceneSfx from './audio/cutsceneSfx';
import * as weaponSfx from './audio/weaponSfx';
import * as talismanSfx from './audio/talismanSfx';

export class SoundManager {
  private static instance: SoundManager;

  private scene?: Phaser.Scene;
  private audioCtx?: AudioContext;
  private sfxGainNode?: GainNode;

  // SFX Volume
  private sfxVolume: number = 0.60;

  // Rate limiter para digitação e dano
  private lastTypewriterTime: number = 0;
  private readonly TYPEWRITER_MIN_INTERVAL = 38; // ms
  private lastHurtTime: number = 0;
  private readonly HURT_MIN_INTERVAL = 140; // ms
  private lastHeartbeatTime: number = 0;

  private isAudioUnlocked: boolean = false;

  private constructor() {
    this.loadSavedVolumes();
    this.initAudioContext();
    this.setupAutoplayUnlock();
    try {
      (window as Window & { __hellSurvivorSoundManager?: SoundManager }).__hellSurvivorSoundManager = this;
    } catch {
      // Armazenamento/áudio indisponível: segue sem quebrar o jogo
    }
  }

  private loadSavedVolumes(): void {
    try {
      const savedSfx = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME);
      if (savedSfx !== null) {
        const val = parseFloat(savedSfx);
        if (!isNaN(val)) this.sfxVolume = Phaser.Math.Clamp(val, 0, 1);
      }
    } catch {
      // Armazenamento/áudio indisponível: segue sem quebrar o jogo
    }
  }

  public getMusicVolume(): number {
    return MusicDirector.getInstance().getMusicVolume();
  }

  public setMusicVolume(volume: number): void {
    MusicDirector.getInstance().setMusicVolume(volume);
  }

  public setBgmVolume(volume: number): void {
    this.setMusicVolume(volume);
  }

  public getBgmVolume(): number {
    return this.getMusicVolume();
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    try {
      localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, this.sfxVolume.toString());
    } catch {
      // Armazenamento/áudio indisponível: segue sem quebrar o jogo
    }
    if (this.sfxGainNode && this.audioCtx) {
      this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
    MusicDirector.getInstance().setScene(scene);
    // Se Phaser já tiver um AudioContext WebAudio criado, usamos ele
    if (scene.sound instanceof Phaser.Sound.WebAudioSoundManager && !this.audioCtx) {
      this.audioCtx = scene.sound.context;
      this.setupSfxChain();
    }
  }

  private initAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();
        this.setupSfxChain();
      }
    } catch (e) {
      console.warn('[SoundManager] Não foi possível instanciar AudioContext inicial:', e);
    }
  }

  private setupSfxChain(): void {
    if (!this.audioCtx) return;
    try {
      this.sfxGainNode = this.audioCtx.createGain();
      this.sfxGainNode.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
      this.sfxGainNode.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('[SoundManager] Erro ao configurar canal de SFX:', e);
    }
  }

  /**
   * Garante desbloqueio do áudio no navegador ao primeiro clique/toque/tecla do jogador
   */
  private setupAutoplayUnlock(): void {
    const unlockHandler = () => {
      this.unlockAudio();
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  public unlockAudio(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => {
        this.isAudioUnlocked = true;
      }).catch(() => {
        // Navegador ainda bloqueia o áudio; tenta de novo no próximo toque
      });
    }

    if (this.scene && this.scene.sound && this.scene.sound.locked) {
      try {
        this.scene.sound.unlock();
      } catch {
        // Armazenamento/áudio indisponível: segue sem quebrar o jogo
      }
    }
  }

  // =========================================================================
  // MÚSICAS DE FUNDO (BGM) - FACHADA PARA O MUSIC DIRECTOR (PACOTE ÁUDIO-1)
  // =========================================================================

  /**
   * Toca a música oficial do Menu Inicial ("Hell Survivor") com fade-in suave
   */
  public playMenuMusic(fadeInMs: number = 1800): void {
    MusicDirector.getInstance().setMusicState('MENU', 'SoundManager.playMenuMusic', { fadeInMs });
  }

  /**
   * Toca a música da Intro ("Halloween") bem baixinha de fundo com fade-in suave em loop
   */
  public playIntroMusic(fadeInMs: number = 2500): void {
    MusicDirector.getInstance().setMusicState('INTRO', 'SoundManager.playIntroMusic', { fadeInMs });
  }

  /**
   * Toca a música da horda normal ("Eternal Shadow") com fade-in suave
   */
  public playBattleMusic(fadeInMs: number = 2500): void {
    MusicDirector.getInstance().setMusicState('BATTLE', 'SoundManager.playBattleMusic', { fadeInMs });
  }

  /**
   * Toca a música épica da Boss ("Orchestral Overture") com fade-in dramático
   */
  public playBossMusic(fadeInMs: number = 2000): void {
    MusicDirector.getInstance().setMusicState('BOSS_SUCCUBUS', 'SoundManager.playBossMusic', { fadeInMs });
  }

  /**
   * Toca a música da cena pós-chefe ("Spooky Halloween") bem baixinha de fundo
   */
  public playSpookyMusic(fadeInMs: number = 2500): void {
    MusicDirector.getInstance().setMusicState('VICTORY_SCENE', 'SoundManager.playSpookyMusic', { fadeInMs });
  }

  /**
   * Toca a Parte 1 da música de Azazel (intro.mp3) em loop e volume adequado durante o diálogo
   */
  public playAzazelIntroMusic(fadeInMs: number = 900): void {
    MusicDirector.getInstance().setMusicState('AZAZEL_INTRO', 'SoundManager.playAzazelIntroMusic', { fadeInMs });
  }

  /**
   * Toca diretamente a música de batalha de Azazel (fight.mp3) em loop com volume épico
   */
  public playAzazelFightMusic(fadeInMs: number = 0): void {
    MusicDirector.getInstance().setMusicState('AZAZEL_FIGHT', 'SoundManager.playAzazelFightMusic', { fadeInMs });
  }

  /**
   * Aumenta ou restaura o multiplicador de volume da música atual (ex: +30% na Fase 2 Escuridão de Azazel)
   */
  public boostCurrentMusicVolume(multiplier: number = 1.3): void {
    MusicDirector.getInstance().boostCurrentMusicVolume(multiplier);
  }

  /**
   * Sincronização Musical Tripla de Azazel (intro -> mid -> fight)
   */
  public finishAzazelIntroAndTransition(onMidStart: () => void, onFightStart: () => void): void {
    MusicDirector.getInstance().finishAzazelIntroAndTransition(onMidStart, onFightStart);
  }

  /**
   * Para a música atual com interrupção instantânea ou fade-out determinístico
   */
  public stopMusic(fadeOutMs: number = 0): void {
    MusicDirector.getInstance().stopMusic(fadeOutMs, 'SoundManager.stopMusic');
  }

  // =========================================================================
  // SÍNTESE PROCEDURAL DE EFEITOS SONOROS (WEB AUDIO API RETRO SFX)
  // =========================================================================

  private getAudioContext(): AudioContext | undefined {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {
        // Navegador ainda bloqueia o áudio; tenta de novo no próximo toque
      });
    }
    return this.audioCtx;
  }

  private getSfxOutput(): SfxOutput | undefined {
    const ctx = this.getAudioContext();
    if (!ctx) return undefined;
    return { ctx, out: this.sfxGainNode || ctx.destination, volume: this.sfxVolume };
  }

  // Efeitos sonoros: corpo em src/systems/audio/*Sfx.ts; aqui ficam só limitadores de repetição.

  public playMenuHover(): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playMenuHover(s);
  }

  public playMenuClick(): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playMenuClick(s);
  }

  public playRouletteTick(pitchMult: number = 1.0): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playRouletteTick(s, pitchMult);
  }

  public playRouletteJackpot(): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playRouletteJackpot(s);
  }

  /** Talismã: toque na carta (`tier` 0 = comum ... 4 = lendária). */
  public playTalismanTap(tier: number): void {
    const s = this.getSfxOutput();
    if (s) talismanSfx.playTalismanTap(s, tier);
  }

  public playTalismanTierUp(tier: number): void {
    const s = this.getSfxOutput();
    if (s) talismanSfx.playTalismanTierUp(s, tier);
  }

  public playTalismanOpen(tier: number): void {
    const s = this.getSfxOutput();
    if (s) talismanSfx.playTalismanOpen(s, tier);
  }

  public playCasinoLevelUp(): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playCasinoLevelUp(s);
  }

  public playCardHover(): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playCardHover(s);
  }

  public playCardCashSelect(): void {
    const s = this.getSfxOutput();
    if (s) uiSfx.playCardCashSelect(s);
  }

  public playDialogueVoice(speaker: string): void {
    const s = this.getSfxOutput();
    if (s) dialogueSfx.playDialogueVoice(s, speaker);
  }

  public playDialogueTypewriter(char?: string): void {
    // Ignora espaços e quebras de linha para simular cadência humana
    if (!char || char === ' ' || char === '\n') return;
    const nowMs = performance.now();
    if (nowMs - this.lastTypewriterTime < this.TYPEWRITER_MIN_INTERVAL) return;
    this.lastTypewriterTime = nowMs;
    const s = this.getSfxOutput();
    if (s) dialogueSfx.playDialogueTypewriter(s);
  }

  public playGemCollect(gemType: string = 'green'): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playGemCollect(s, gemType);
  }

  public playPlayerHurt(): void {
    const nowMs = Date.now();
    if (nowMs - this.lastHurtTime < this.HURT_MIN_INTERVAL) return;
    this.lastHurtTime = nowMs;
    const s = this.getSfxOutput();
    if (s) combatSfx.playPlayerHurt(s);
  }

  public playGameOver(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playGameOver(s);
  }

  public playEnemyHit(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playEnemyHit(s);
  }

  public playEnemyDeath(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playEnemyDeath(s);
  }

  public playSoulBoltFire(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playSoulBoltFire(s);
  }

  public playUltimateCast(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playUltimateCast(s);
  }

  public playLevelUp(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playLevelUp(s);
  }

  public playSlimeExplode(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playSlimeExplode(s);
  }

  public playBossDash(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playBossDash(s);
  }

  public playBossSlam(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playBossSlam(s);
  }

  public playHellfireBurst(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playHellfireBurst(s);
  }

  public playHeartbeat(): void {
    const nowMs = Date.now();
    if (nowMs - this.lastHeartbeatTime < 850) return;
    this.lastHeartbeatTime = nowMs;
    const s = this.getSfxOutput();
    if (s) combatSfx.playHeartbeat(s);
  }

  public playDash(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playDash(s);
  }

  public playCritHit(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playCritHit(s);
  }

  public playComboTier(tierIndex: number): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playComboTier(s, tierIndex);
  }

  public playFrenzyStart(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playFrenzyStart(s);
  }

  public playHordeEventAlarm(): void {
    const s = this.getSfxOutput();
    if (s) combatSfx.playHordeEventAlarm(s);
  }

  public playPenSnap(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playPenSnap(s);
  }

  public playTableKick(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playTableKick(s);
  }

  public playRageBoom(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playRageBoom(s);
  }

  public playPaperRustle(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playPaperRustle(s);
  }

  public playSmokePoof(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playSmokePoof(s);
  }

  public playLightFlicker(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playLightFlicker(s);
  }

  public playDogBark(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playDogBark(s);
  }

  public playStampImpact(): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playStampImpact(s);
  }

  public playStarSlam(starIndex: number = 0): void {
    const s = this.getSfxOutput();
    if (s) cutsceneSfx.playStarSlam(s, starIndex);
  }

  public playBloodDaggerThrow(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playBloodDaggerThrow(s);
  }

  public playExecutionSlash(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playExecutionSlash(s);
  }

  public playAbyssalChainsWhip(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playAbyssalChainsWhip(s);
  }

  public playMeteorImpact(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playMeteorImpact(s);
  }

  public playWeaponEvolve(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playWeaponEvolve(s);
  }

  public playEnemyExplosion(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playEnemyExplosion(s);
  }

  public playAzazelTeleport(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playAzazelTeleport(s);
  }

  public playAzazelLightningStrike(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playAzazelLightningStrike(s);
  }

  public playAzazelOrbShoot(): void {
    const s = this.getSfxOutput();
    if (s) weaponSfx.playAzazelOrbShoot(s);
  }
}

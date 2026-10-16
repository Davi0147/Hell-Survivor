import Phaser from 'phaser';

export class SoundManager {
  private static instance: SoundManager;

  private scene?: Phaser.Scene;
  private audioCtx?: AudioContext;
  private sfxGainNode?: GainNode;

  // Gerenciamento de BGM
  private currentBgm?: Phaser.Sound.BaseSound;
  private currentBgmKey?: string;
  private musicVolume: number = 0.10; // Volume padrão das músicas ajustado para 10%
  private sfxVolume: number = 0.60;

  // Rate limiter para digitação e dano
  private lastTypewriterTime: number = 0;
  private readonly TYPEWRITER_MIN_INTERVAL = 38; // ms
  private lastHurtTime: number = 0;
  private readonly HURT_MIN_INTERVAL = 140; // ms

  private isAudioUnlocked: boolean = false;

  private constructor() {
    this.loadSavedVolumes();
    this.initAudioContext();
    this.setupAutoplayUnlock();
    try {
      (window as any).__hellSurvivorSoundManager = this;
    } catch {}
  }

  private loadSavedVolumes(): void {
    try {
      const savedMusic = localStorage.getItem('hell_survivor_bgm_vol');
      if (savedMusic !== null) {
        const val = parseFloat(savedMusic);
        if (!isNaN(val)) this.musicVolume = Phaser.Math.Clamp(val, 0, 1);
      }
      const savedSfx = localStorage.getItem('hell_survivor_sfx_vol');
      if (savedSfx !== null) {
        const val = parseFloat(savedSfx);
        if (!isNaN(val)) this.sfxVolume = Phaser.Math.Clamp(val, 0, 1);
      }
    } catch {}
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    try {
      localStorage.setItem('hell_survivor_bgm_vol', this.musicVolume.toString());
    } catch {}
    if (this.currentBgm && (this.currentBgm as any).setVolume) {
      (this.currentBgm as any).setVolume(this.musicVolume);
    }
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
      localStorage.setItem('hell_survivor_sfx_vol', this.sfxVolume.toString());
    } catch {}
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
    // Se Phaser já tiver um AudioContext WebAudio criado, usamos ele
    if ((scene.sound as any)?.context && !this.audioCtx) {
      this.audioCtx = (scene.sound as any).context as AudioContext;
      this.setupSfxChain();
    }
  }

  private initAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
      }).catch(() => {});
    }

    if (this.scene && this.scene.sound && (this.scene.sound as any).locked) {
      try {
        (this.scene.sound as any).unlock();
      } catch {}
    }
  }

  // =========================================================================
  // MÚSICAS DE FUNDO (BGM) COM FADE-IN SUAVE E LOOP PERFEITO
  // =========================================================================

  /**
   * Toca a música oficial do Menu Inicial ("Hell Survivor") com fade-in suave
   */
  public playMenuMusic(fadeInMs: number = 1800): void {
    this.playMusicTrack('bgm-menu', this.musicVolume, fadeInMs);
  }

  /**
   * Toca a música da Intro ("Halloween") bem baixinha de fundo com fade-in suave em loop
   */
  public playIntroMusic(fadeInMs: number = 2500): void {
    const lowIntroVol = Phaser.Math.Clamp(this.musicVolume * 0.50, 0.02, 0.06);
    this.playMusicTrack('bgm-intro', lowIntroVol, fadeInMs);
  }

  /**
   * Toca a música da horda normal ("Eternal Shadow") com fade-in suave
   */
  public playBattleMusic(fadeInMs: number = 2500): void {
    this.playMusicTrack('bgm-battle', this.musicVolume, fadeInMs);
  }

  /**
   * Toca a música épica da Boss ("Orchestral Overture") com fade-in dramático
   */
  public playBossMusic(fadeInMs: number = 2000): void {
    this.playMusicTrack('bgm-boss', this.musicVolume * 1.15, fadeInMs);
  }

  private readonly ALL_BGM_KEYS = ['bgm-menu', 'bgm-battle', 'bgm-boss', 'bgm-intro'];

  private playMusicTrack(key: string, targetVolume: number, fadeInMs: number): void {
    if (!this.scene || !this.scene.sound) return;

    // Se já estiver tocando essa mesma faixa, apenas assegura que o volume está correto
    if (this.currentBgmKey === key && this.currentBgm && this.currentBgm.isPlaying) {
      if ((this.currentBgm as any).setVolume) {
        (this.currentBgm as any).setVolume(targetVolume);
      }
      return;
    }

    // 1. Interrompe IMEDIATAMENTE todas as outras instâncias de BGM no sound manager global do Phaser
    for (const k of this.ALL_BGM_KEYS) {
      if (k !== key) {
        try {
          this.scene.sound.stopByKey(k);
        } catch {}
      }
    }

    // 2. Destrói o objeto de áudio anterior se existir
    if (this.currentBgm) {
      try {
        (this.currentBgm as any).stop();
        (this.currentBgm as any).destroy();
      } catch {}
      this.currentBgm = undefined;
      this.currentBgmKey = undefined;
    }

    try {
      if (!this.scene.cache.audio.exists(key)) {
        console.warn(`[SoundManager] Áudio "${key}" não encontrado no cache.`);
        return;
      }

      const newBgm = this.scene.sound.add(key, {
        loop: true,
        volume: 0
      });

      newBgm.play();
      this.currentBgm = newBgm;
      this.currentBgmKey = key;

      // Fade-in suave a partir de volume zero
      if (fadeInMs > 0 && this.scene.tweens) {
        this.scene.tweens.add({
          targets: newBgm,
          volume: targetVolume,
          duration: fadeInMs,
          ease: 'Linear'
        });
      } else {
        (newBgm as any).setVolume(targetVolume);
      }
    } catch (e) {
      console.warn(`[SoundManager] Falha ao reproduzir BGM "${key}":`, e);
    }
  }

  /**
   * Para a música atual com interrupção instantânea e limpa de todas as BGMs no Phaser
   */
  public stopMusic(fadeOutMs: number = 0): void {
    if (!this.scene || !this.scene.sound) return;

    // Interrompe imediatamente todas as faixas de música de fundo
    for (const k of this.ALL_BGM_KEYS) {
      try {
        this.scene.sound.stopByKey(k);
      } catch {}
    }

    if (this.currentBgm) {
      try {
        (this.currentBgm as any).stop();
        (this.currentBgm as any).destroy();
      } catch {}
      this.currentBgm = undefined;
      this.currentBgmKey = undefined;
    }
  }

  // =========================================================================
  // SÍNTESE PROCEDURAL DE EFEITOS SONOROS (WEB AUDIO API RETRO SFX)
  // =========================================================================

  private getAudioContext(): AudioContext | undefined {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Som de passar o cursor sobre botões de menu
   */
  public playMenuHover(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

    gain.gain.setValueAtTime(0.08 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Som de clique / confirmação de menu
   */
  public playMenuClick(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(1040, now + 0.04);

    gain.gain.setValueAtTime(0.20 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Barulhinho satisfatório de clique místico / roleta ao rolar cada nome de bênção
   */
  public playRouletteTick(pitchMult: number = 1.0): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Timbre cristalino e estalado estilo slot machine retrô
    osc.type = 'triangle';
    const baseFreq = 1150 * pitchMult;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.025);

    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Som triunfante de prêmio / jackpot ao selecionar a bênção final
   */
  public playRouletteJackpot(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Arpeggio cintilante e alegre de prêmio (C6, E6, G6, B6, C7)
    const notes = [1046.5, 1318.5, 1567.98, 1975.53, 2093.0];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
      const noteStart = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, noteStart);

      const noteDuration = idx === notes.length - 1 ? 0.45 : 0.14;
      const vol = (idx === notes.length - 1 ? 0.32 : 0.20) * this.sfxVolume;

      gain.gain.setValueAtTime(vol, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + noteDuration + 0.01);
    });

    // Brilho de sinos ressonantes (chime shimmer)
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'sine';
    const shimmerStart = now + 0.28;
    shimmerOsc.frequency.setValueAtTime(3135.96, shimmerStart);
    shimmerOsc.frequency.exponentialRampToValueAtTime(4186.01, shimmerStart + 0.35);

    shimmerGain.gain.setValueAtTime(0.15 * this.sfxVolume, shimmerStart);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + 0.40);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.sfxGainNode || ctx.destination);

    shimmerOsc.start(shimmerStart);
    shimmerOsc.stop(shimmerStart + 0.42);
  }

  /**
   * Fanfarra estilo Cassino / Arcade Slot ao subir de nível e abrir as 3 cartas
   */
  public playCasinoLevelUp(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Arpeggio rápido de cassino (C5, E5, G5, B5, C6, E6, G6, C7)
    const casinoNotes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5, 1567.98, 2093.0];

    casinoNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.042;
      const isLast = i === casinoNotes.length - 1;
      const dur = isLast ? 0.52 : 0.11;

      osc.type = isLast ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, start);
      if (isLast) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + dur);
      }

      const vol = (isLast ? 0.24 : 0.12) * this.sfxVolume;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.01);
    });

    // 3 cliques táteis de distribuição das 3 cartas na mesa
    [0.06, 0.16, 0.26].forEach((delay, idx) => {
      const flipOsc = ctx.createOscillator();
      const flipGain = ctx.createGain();
      const t = now + delay;

      flipOsc.type = 'triangle';
      flipOsc.frequency.setValueAtTime(900 + idx * 180, t);
      flipOsc.frequency.exponentialRampToValueAtTime(1600 + idx * 220, t + 0.03);

      flipGain.gain.setValueAtTime(0.18 * this.sfxVolume, t);
      flipGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      flipOsc.connect(flipGain);
      flipGain.connect(this.sfxGainNode || ctx.destination);

      flipOsc.start(t);
      flipOsc.stop(t + 0.04);
    });
  }

  /**
   * Som tátil e viciante ao passar o mouse sobre uma carta flutuante
   */
  public playCardHover(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Estalo suave de carta (snap curto)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(740, now);
    snapOsc.frequency.exponentialRampToValueAtTime(1480, now + 0.035);

    snapGain.gain.setValueAtTime(0.16 * this.sfxVolume, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGainNode || ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.045);

    // 2. Brilho harmônico místico sutil (shimmer)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(1975.53, now + 0.01); // B6
    chimeOsc.frequency.exponentialRampToValueAtTime(2637.02, now + 0.08); // E7

    chimeGain.gain.setValueAtTime(0.09 * this.sfxVolume, now + 0.01);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.sfxGainNode || ctx.destination);
    chimeOsc.start(now + 0.01);
    chimeOsc.stop(now + 0.095);
  }

  /**
   * Som explosivo de "CASH / KA-CHING!" + moedas tilintando ao escolher uma carta
   */
  public playCardCashSelect(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Impacto grave de explosão da carta escolhida (punch)
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'sine';
    punchOsc.frequency.setValueAtTime(190, now);
    punchOsc.frequency.exponentialRampToValueAtTime(52, now + 0.14);

    punchGain.gain.setValueAtTime(0.32 * this.sfxVolume, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    punchOsc.connect(punchGain);
    punchGain.connect(this.sfxGainNode || ctx.destination);
    punchOsc.start(now);
    punchOsc.stop(now + 0.16);

    // 2. Primeiro toque metálico do "KA-" (Sino de Caixa Registradora C7)
    const bell1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    bell1.type = 'triangle';
    bell1.frequency.setValueAtTime(2093.0, now + 0.02); // C7
    gain1.gain.setValueAtTime(0.28 * this.sfxVolume, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    bell1.connect(gain1);
    gain1.connect(this.sfxGainNode || ctx.destination);
    bell1.start(now + 0.02);
    bell1.stop(now + 0.12);

    // 3. Segundo toque ressonante do "-CHING!" (Acorde de Ouro: E7 + G7 + C8)
    const chingFreqs = [2637.02, 3135.96, 4186.01];
    chingFreqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + 0.085 + idx * 0.012;
      osc.type = idx === 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, start);

      const vol = (idx === 0 ? 0.28 : 0.18) * this.sfxVolume;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.52);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);
      osc.start(start);
      osc.stop(start + 0.54);
    });

    // 4. Chuva de moedas / partículas cintilantes (6 tilintares rápidos)
    for (let i = 0; i < 6; i++) {
      const coinOsc = ctx.createOscillator();
      const coinGain = ctx.createGain();
      const t = now + 0.14 + i * 0.045;
      const freq = 2400 + (i % 3) * 550 + i * 160;

      coinOsc.type = 'sine';
      coinOsc.frequency.setValueAtTime(freq, t);
      coinOsc.frequency.setValueAtTime(freq * 1.25, t + 0.02);

      coinGain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
      coinGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      coinOsc.connect(coinGain);
      coinGain.connect(this.sfxGainNode || ctx.destination);
      coinOsc.start(t);
      coinOsc.stop(t + 0.065);
    }
  }

  /**
   * Som característico de "Voz" no início da fala de cada personagem
   */
  public playDialogueVoice(speaker: string): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const sLower = speaker.toLowerCase();

    if (sLower === 'nixy') {
      // Nixy: Formante místico agudo e cintilante (dois tons rápidos ascendentes)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174, now + 0.15); // D6

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.19);
      osc2.stop(now + 0.19);
    } else if (sLower === 'succubus') {
      // Succubus / Boss: Tom demoníaco cavernoso e gutural (grave com filtro passa-baixa)
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.30 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (sLower === 'boss' || sLower === 'chefe') {
      // Chefe / Demônio da Administração: Tom corporativo demoníaco grave e cavernoso
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(130, now);
      osc1.frequency.exponentialRampToValueAtTime(85, now + 0.18);

      osc2.frequency.setValueAtTime(65, now);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);

      gain.gain.setValueAtTime(0.32 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
    } else {
      // NPC / Outros: Blip amigável retro
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(630, now + 0.12);

      gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  /**
   * Barulhinho suave de máquina de escrever / digitação a cada letra revelada
   */
  public playDialogueTypewriter(char?: string): void {
    // Ignora espaços e quebras de linha para simular cadência humana
    if (!char || char === ' ' || char === '\n') return;

    const nowMs = performance.now();
    if (nowMs - this.lastTypewriterTime < this.TYPEWRITER_MIN_INTERVAL) return;
    this.lastTypewriterTime = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Variação micro-aleatória de afinação para naturalidade (estilo Undertale/Animal Crossing)
    const pitch = 1350 + Math.random() * 300;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.75, now + 0.022);

    gain.gain.setValueAtTime(0.05 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Som de coleta de Gema de Alma com escala musical pentatônica cristalina
   */
  public playGemCollect(gemType: string = 'green'): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    // Frequências harmoniosas por raridade
    let freq = 1046.5; // Verde: C6
    if (gemType === 'blue') freq = 1318.5; // Azul: E6
    else if (gemType === 'red') freq = 1567.98; // Vermelho: G6
    else if (gemType === 'orange') freq = 1760.0; // Laranja: A6
    else if (gemType === 'purple') freq = 2093.0; // Roxo: C7
    else if (gemType === 'gold') freq = 2349.32; // Ouro: D7

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + 0.08);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Som visceral quando a Nixy sofre dano (Impacto pesado e crunch com debounce)
   */
  public playPlayerHurt(): void {
    const nowMs = Date.now();
    if (nowMs - this.lastHurtTime < this.HURT_MIN_INTERVAL) return;
    this.lastHurtTime = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Pancada subgrave rápida (Punch / Thud)
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(160, now);
    punchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    punchGain.gain.setValueAtTime(0.40 * this.sfxVolume, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    punchOsc.connect(punchGain);
    punchGain.connect(this.sfxGainNode || ctx.destination);
    punchOsc.start(now);
    punchOsc.stop(now + 0.15);

    // 2. Crunch cortante (Dano recebido)
    const crunchOsc = ctx.createOscillator();
    const crunchGain = ctx.createGain();
    crunchOsc.type = 'sawtooth';
    crunchOsc.frequency.setValueAtTime(280, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(65, now + 0.10);
    crunchGain.gain.setValueAtTime(0.30 * this.sfxVolume, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    crunchOsc.connect(crunchGain);
    crunchGain.connect(this.sfxGainNode || ctx.destination);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.13);
  }

  /**
   * Som dramático e fúnebre de Game Over / Derrota da heroína
   */
  public playGameOver(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Sino fúnebre sub-bass profundo
    const tollOsc = ctx.createOscillator();
    const tollGain = ctx.createGain();
    tollOsc.type = 'sine';
    tollOsc.frequency.setValueAtTime(95, now);
    tollOsc.frequency.exponentialRampToValueAtTime(22, now + 1.8);
    tollGain.gain.setValueAtTime(0.60 * this.sfxVolume, now);
    tollGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
    tollOsc.connect(tollGain);
    tollGain.connect(this.sfxGainNode || ctx.destination);
    tollOsc.start(now);
    tollOsc.stop(now + 2.0);

    // 2. Acorde menor descendente fúnebre retrô (Eb4 -> C4 -> Ab3 -> D3)
    const funeralNotes = [
      { freq: 311.13, delay: 0.00, dur: 0.8 },
      { freq: 261.63, delay: 0.28, dur: 0.9 },
      { freq: 207.65, delay: 0.60, dur: 1.1 },
      { freq: 146.83, delay: 0.95, dur: 1.4 }
    ];

    funeralNotes.forEach((note) => {
      const noteOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const noteStart = now + note.delay;

      noteOsc.type = 'sawtooth';
      noteOsc.frequency.setValueAtTime(note.freq, noteStart);
      noteOsc.frequency.exponentialRampToValueAtTime(note.freq * 0.92, noteStart + note.dur);

      noteGain.gain.setValueAtTime(0.18 * this.sfxVolume, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.dur);

      noteOsc.connect(noteGain);
      noteGain.connect(this.sfxGainNode || ctx.destination);

      noteOsc.start(noteStart);
      noteOsc.stop(noteStart + note.dur + 0.05);
    });
  }

  /**
   * Som quando um inimigo leva dano
   */
  public playEnemyHit(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    const pitch = 360 + Math.random() * 80;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);

    gain.gain.setValueAtTime(0.09 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.065);
  }

  /**
   * Som de morte do inimigo (dispersão de alma/estouro)
   */
  public playEnemyDeath(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    gain.gain.setValueAtTime(0.14 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Disparo dos Projéteis Místicos (Soul Bolts)
   */
  public playSoulBoltFire(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 720 + Math.random() * 80;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);

    gain.gain.setValueAtTime(0.11 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.10);
  }

  /**
   * Ativação da Suprema (Eternal Despair: Sub-bass boom, dark reverse sweep e impacto celestial)
   */
  public playUltimateCast(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass boom
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.7);

    subGain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGainNode || ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.85);

    // Acorde místico ressonante
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      chordOsc.type = 'triangle';
      chordOsc.frequency.setValueAtTime(freq, now + 0.05);

      chordGain.gain.setValueAtTime(0.12 * this.sfxVolume, now + 0.05);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      chordOsc.connect(chordGain);
      chordGain.connect(this.sfxGainNode || ctx.destination);
      chordOsc.start(now + 0.05);
      chordOsc.stop(now + 0.95);
    });
  }

  /**
   * Fanfarra triunfante ao subir de nível (Level Up)
   */
  public playLevelUp(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.20 * this.sfxVolume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.30);
    });
  }

  /**
   * Som de explosão e ácido do Skull Slime
   */
  public playSlimeExplode(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Som do Dash feroz da Boss Succubus
   */
  public playBossDash(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

    gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Impacto colossal do Salto Esmagador da Boss Succubus
   */
  public playBossSlam(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.40);

    gain.gain.setValueAtTime(0.40 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.48);
  }

  private lastHeartbeatTime: number = 0;

  /**
   * Som de pulso ígneo das Chamas do Purgatório (Whoosh flamejante com ressonância)
   */
  public playHellfireBurst(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.32);

    gain.gain.setValueAtTime(0.24 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * Som de batimento cardíaco tenso quando a heroína está com pouca vida (Low HP)
   */
  public playHeartbeat(): void {
    const nowMs = Date.now();
    if (nowMs - this.lastHeartbeatTime < 850) return;
    this.lastHeartbeatTime = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Duplo impacto abafado de batimento (Lub-Dub)
    [0, 0.16].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 75 : 60, now + delay);
      osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.14);

      gain.gain.setValueAtTime((idx === 0 ? 0.35 : 0.28) * this.sfxVolume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.16);
    });
  }

  /**
   * Estalo seco e crocante de caneta quebrando sob fúria
   */
  public playPenSnap(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Click agudo de plástico quebrando (Transient)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(2400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(600, now + 0.025);
    snapGain.gain.setValueAtTime(0.50 * this.sfxVolume, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGainNode || ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.035);

    // 2. Ruído / crack elástico
    const noiseOsc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noiseOsc.type = 'square';
    noiseOsc.frequency.setValueAtTime(1400, now + 0.005);
    noiseOsc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
    noiseGain.gain.setValueAtTime(0.35 * this.sfxVolume, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    noiseOsc.connect(noiseGain);
    noiseGain.connect(this.sfxGainNode || ctx.destination);
    noiseOsc.start(now + 0.005);
    noiseOsc.stop(now + 0.05);
  }

  /**
   * Chute violento na mesa de madeira / queda de objetos
   */
  public playTableKick(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Impacto grave do chute (Sub thud)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.28);
    subGain.gain.setValueAtTime(0.65 * this.sfxVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGainNode || ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.35);

    // 2. Estrondo de madeira quebrando / chacoalhar de mesa
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'sawtooth';
    woodOsc.frequency.setValueAtTime(360, now + 0.02);
    woodOsc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
    woodGain.gain.setValueAtTime(0.40 * this.sfxVolume, now + 0.02);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    woodOsc.connect(woodGain);
    woodGain.connect(this.sfxGainNode || ctx.destination);
    woodOsc.start(now + 0.02);
    woodOsc.stop(now + 0.26);
  }

  /**
   * Estrondo de choque / fúria dramática para gritos de desespero e raiva
   */
  public playRageBoom(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Boom cinematográfico
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(140, now);
    boomOsc.frequency.exponentialRampToValueAtTime(28, now + 0.65);
    boomGain.gain.setValueAtTime(0.55 * this.sfxVolume, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.70);
    boomOsc.connect(boomGain);
    boomGain.connect(this.sfxGainNode || ctx.destination);
    boomOsc.start(now);
    boomOsc.stop(now + 0.75);

    // Rasgo agudo de distorção
    const distOsc = ctx.createOscillator();
    const distGain = ctx.createGain();
    distOsc.type = 'sawtooth';
    distOsc.frequency.setValueAtTime(320, now);
    distOsc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
    distGain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
    distGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
    distOsc.connect(distGain);
    distGain.connect(this.sfxGainNode || ctx.destination);
    distOsc.start(now);
    distOsc.stop(now + 0.22);
  }

  /**
   * Barulho de folhas de papel voando e farfalhando pelo ar
   */
  public playPaperRustle(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Três rajadas rápidas de farfalhar de alta frequência
    [0, 0.06, 0.13].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800 + Math.random() * 600, startTime);
      osc.frequency.exponentialRampToValueAtTime(900, startTime + 0.08);

      gain.gain.setValueAtTime(0.12 * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.10);
    });
  }

  /**
   * Nuvem de fumaça negra / evaporação demoníaca
   */
  public playSmokePoof(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Oscilação e zumbido elétrico de lâmpadas piscando
   */
  public playLightFlicker(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    [0, 0.05, 0.12, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + delay;

      osc.type = 'square';
      osc.frequency.setValueAtTime(120, startTime);

      gain.gain.setValueAtTime(0.15 * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.04);
    });
  }

  /**
   * Arremesso veloz e cortante das Adagas de Sangue
   */
  public playBloodDaggerThrow(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sibilo metálico agudo cortando o vento
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.075);

    gain.gain.setValueAtTime(0.16 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  /**
   * Chicoteio metálico e eco espectral das Cadeias Abissais
   */
  public playAbyssalChainsWhip(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tilintar de elos de ferro + chicote grave
    [0, 0.035, 0.07].forEach((delay, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + delay;

      osc.type = idx === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(980 + idx * 320, start);
      osc.frequency.exponentialRampToValueAtTime(220, start + 0.09);

      gain.gain.setValueAtTime(0.14 * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.10);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);
      osc.start(start);
      osc.stop(start + 0.11);
    });
  }

  /**
   * Impacto explosivo e grave do Meteoro Infernal
   */
  public playMeteorImpact(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Estrondo sísmico sub-grave
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.34);

    subGain.gain.setValueAtTime(0.32 * this.sfxVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGainNode || ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.38);

    // Estalo vulcânico de rocha partindo
    const crackOsc = ctx.createOscillator();
    const crackFilter = ctx.createBiquadFilter();
    const crackGain = ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(340, now);
    crackOsc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

    crackFilter.type = 'lowpass';
    crackFilter.frequency.setValueAtTime(900, now);
    crackFilter.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    crackGain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    crackOsc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.sfxGainNode || ctx.destination);
    crackOsc.start(now);
    crackOsc.stop(now + 0.25);
  }

  /**
   * Fanfarra lendária de Evolução Suprema de Arma (Weapon Fusion)
   */
  public playWeaponEvolve(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.055;

      osc.type = i >= 4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || ctx.destination);
      osc.start(start);
      osc.stop(start + 0.48);
    });
  }
}


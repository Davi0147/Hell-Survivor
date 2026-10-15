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

  private playMusicTrack(key: string, targetVolume: number, fadeInMs: number): void {
    if (!this.scene || !this.scene.sound) return;

    // Se já estiver tocando essa mesma faixa, apenas assegura que o volume está correto
    if (this.currentBgmKey === key && this.currentBgm && this.currentBgm.isPlaying) {
      return;
    }

    // Se houver uma música tocando, faz fade out antes
    if (this.currentBgm && this.currentBgm.isPlaying) {
      const oldBgm = this.currentBgm;
      this.scene.tweens.add({
        targets: oldBgm,
        volume: 0,
        duration: 1000,
        onComplete: () => {
          oldBgm.stop();
          oldBgm.destroy();
        }
      });
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
      this.scene.tweens.add({
        targets: newBgm,
        volume: targetVolume,
        duration: fadeInMs,
        ease: 'Linear'
      });
    } catch (e) {
      console.warn(`[SoundManager] Falha ao reproduzir BGM "${key}":`, e);
    }
  }

  /**
   * Para a música atual com fade out suave
   */
  public stopMusic(fadeOutMs: number = 1500): void {
    if (!this.scene || !this.currentBgm || !this.currentBgm.isPlaying) return;

    const bgmToStop = this.currentBgm;
    this.currentBgm = undefined;
    this.currentBgmKey = undefined;

    this.scene.tweens.add({
      targets: bgmToStop,
      volume: 0,
      duration: fadeOutMs,
      onComplete: () => {
        bgmToStop.stop();
        bgmToStop.destroy();
      }
    });
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
}

import type { SfxOutput } from './SfxOutput';

// Vozes e digitação dos diálogos. Síntese procedural (Web Audio), chamada pela fachada SoundManager.

/**
 * Som característico de "Voz" no início da fala de cada personagem
 */
export function playDialogueVoice(s: SfxOutput, speaker: string): void {
  const { ctx } = s;
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

    gain.gain.setValueAtTime(0.22 * s.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(s.out);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.19);
    osc2.stop(now + 0.19);
  } else if (sLower === 'succubus' || sLower === 'rosalin' || sLower === 'chefe') {
    // Succubus / Boss: Tom demoníaco cavernoso e gutural (grave com filtro passa-baixa)
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.30 * s.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(s.out);

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

    gain.gain.setValueAtTime(0.32 * s.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(s.out);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.23);
    osc2.stop(now + 0.23);
  } else if (sLower === 'azazel') {
    // Azazel: Timbre soberano abissal (sub-grave ressonante + harmônico metálico escuro)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(115, now);
    osc1.frequency.exponentialRampToValueAtTime(75, now + 0.24);

    osc2.frequency.setValueAtTime(230, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, now);

    gain.gain.setValueAtTime(0.32 * s.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(s.out);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.27);
    osc2.stop(now + 0.27);
  } else {
    // NPC / Outros: Blip amigável retro
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(630, now + 0.12);

    gain.gain.setValueAtTime(0.18 * s.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(s.out);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

/**
 * Barulhinho suave de máquina de escrever / digitação a cada letra revelada
 */
export function playDialogueTypewriter(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Variação micro-aleatória de afinação para naturalidade (estilo Undertale/Animal Crossing)
  const pitch = 1350 + Math.random() * 300;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.75, now + 0.022);

  gain.gain.setValueAtTime(0.05 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.025);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.03);
}

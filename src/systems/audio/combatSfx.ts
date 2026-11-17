import type { SfxOutput } from './SfxOutput';

// Combate geral: coleta, dano, mortes e chefes. Síntese procedural (Web Audio), chamada pela fachada SoundManager.

/**
 * Som de coleta de Gema de Alma com escala musical pentatônica cristalina
 */
export function playGemCollect(s: SfxOutput, gemType: string): void {
  const { ctx } = s;
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

  gain.gain.setValueAtTime(0.18 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.15);
}

/**
 * Som visceral quando a Nixy sofre dano (Impacto pesado e crunch com debounce)
 */
export function playPlayerHurt(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Pancada subgrave rápida (Punch / Thud)
  const punchOsc = ctx.createOscillator();
  const punchGain = ctx.createGain();
  punchOsc.type = 'triangle';
  punchOsc.frequency.setValueAtTime(160, now);
  punchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
  punchGain.gain.setValueAtTime(0.40 * s.volume, now);
  punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  punchOsc.connect(punchGain);
  punchGain.connect(s.out);
  punchOsc.start(now);
  punchOsc.stop(now + 0.15);

  // 2. Crunch cortante (Dano recebido)
  const crunchOsc = ctx.createOscillator();
  const crunchGain = ctx.createGain();
  crunchOsc.type = 'sawtooth';
  crunchOsc.frequency.setValueAtTime(280, now);
  crunchOsc.frequency.exponentialRampToValueAtTime(65, now + 0.10);
  crunchGain.gain.setValueAtTime(0.30 * s.volume, now);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  crunchOsc.connect(crunchGain);
  crunchGain.connect(s.out);
  crunchOsc.start(now);
  crunchOsc.stop(now + 0.13);
}

/**
 * Som dramático e fúnebre de Game Over / Derrota da heroína
 */
export function playGameOver(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Sino fúnebre sub-bass profundo
  const tollOsc = ctx.createOscillator();
  const tollGain = ctx.createGain();
  tollOsc.type = 'sine';
  tollOsc.frequency.setValueAtTime(95, now);
  tollOsc.frequency.exponentialRampToValueAtTime(22, now + 1.8);
  tollGain.gain.setValueAtTime(0.60 * s.volume, now);
  tollGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
  tollOsc.connect(tollGain);
  tollGain.connect(s.out);
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

    noteGain.gain.setValueAtTime(0.18 * s.volume, noteStart);
    noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + note.dur);

    noteOsc.connect(noteGain);
    noteGain.connect(s.out);

    noteOsc.start(noteStart);
    noteOsc.stop(noteStart + note.dur + 0.05);
  });
}

/**
 * Som quando um inimigo leva dano
 */
export function playEnemyHit(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  const pitch = 360 + Math.random() * 80;
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.05);

  gain.gain.setValueAtTime(0.09 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.065);
}

/**
 * Som de morte do inimigo (dispersão de alma/estouro)
 */
export function playEnemyDeath(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(240, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

  gain.gain.setValueAtTime(0.14 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Disparo dos Projéteis Místicos (Soul Bolts)
 */
export function playSoulBoltFire(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  const baseFreq = 720 + Math.random() * 80;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + 0.08);

  gain.gain.setValueAtTime(0.11 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.10);
}

/**
 * Ativação da Suprema (Eternal Despair: Sub-bass boom, dark reverse sweep e impacto celestial)
 */
export function playUltimateCast(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Sub-bass boom
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(110, now);
  subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.7);

  subGain.gain.setValueAtTime(0.45 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  subOsc.connect(subGain);
  subGain.connect(s.out);
  subOsc.start(now);
  subOsc.stop(now + 0.85);

  // Acorde místico ressonante
  [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
    const chordOsc = ctx.createOscillator();
    const chordGain = ctx.createGain();
    chordOsc.type = 'triangle';
    chordOsc.frequency.setValueAtTime(freq, now + 0.05);

    chordGain.gain.setValueAtTime(0.12 * s.volume, now + 0.05);
    chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    chordOsc.connect(chordGain);
    chordGain.connect(s.out);
    chordOsc.start(now + 0.05);
    chordOsc.stop(now + 0.95);
  });
}

/**
 * Fanfarra triunfante ao subir de nível (Level Up)
 */
export function playLevelUp(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteTime = now + idx * 0.07;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.20 * s.volume, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

    osc.connect(gain);
    gain.connect(s.out);

    osc.start(noteTime);
    osc.stop(noteTime + 0.30);
  });
}

/**
 * Som de explosão e ácido do Skull Slime
 */
export function playSlimeExplode(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

  gain.gain.setValueAtTime(0.25 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.32);
}

/**
 * Som do Dash feroz da Boss Succubus
 */
export function playBossDash(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

  gain.gain.setValueAtTime(0.28 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.24);
}

/**
 * Impacto colossal do Salto Esmagador da Boss Succubus
 */
export function playBossSlam(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.40);

  gain.gain.setValueAtTime(0.40 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.48);
}

/**
 * Som de pulso ígneo das Chamas do Purgatório (Whoosh flamejante com ressonância)
 */
export function playHellfireBurst(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.32);

  gain.gain.setValueAtTime(0.24 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.38);
}

/**
 * Som de batimento cardíaco tenso quando a heroína está com pouca vida (Low HP)
 */
export function playHeartbeat(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Duplo impacto abafado de batimento (Lub-Dub)
  [0, 0.16].forEach((delay, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(idx === 0 ? 75 : 60, now + delay);
    osc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.14);

    gain.gain.setValueAtTime((idx === 0 ? 0.35 : 0.28) * s.volume, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

    osc.connect(gain);
    gain.connect(s.out);

    osc.start(now + delay);
    osc.stop(now + delay + 0.16);
  });
}

/** Tom curto com rampa de frequência: bloco básico dos efeitos de ritmo de combate. */
function blip(
  s: SfxOutput,
  type: OscillatorType,
  fromHz: number,
  toHz: number,
  durationSec: number,
  volume: number,
  delaySec: number = 0
): void {
  const { ctx } = s;
  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, toHz), start + durationSec);
  gain.gain.setValueAtTime(volume * s.volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
  osc.connect(gain);
  gain.connect(s.out);
  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

/** Esquiva: sopro rápido descendo de tom. */
export function playDash(s: SfxOutput): void {
  blip(s, 'sawtooth', 900, 180, 0.13, 0.12);
  blip(s, 'sine', 1400, 500, 0.09, 0.08);
}

/** Golpe crítico: estalo agudo e curto. */
export function playCritHit(s: SfxOutput): void {
  blip(s, 'square', 1900, 900, 0.06, 0.07);
}

/** Degrau de combo: arpejo que sobe de tom a cada degrau (0 = primeiro). */
export function playComboTier(s: SfxOutput, tierIndex: number): void {
  const base = 523.25 * Math.pow(1.122, Math.max(0, tierIndex) * 2);
  blip(s, 'triangle', base, base * 1.02, 0.1, 0.2);
  blip(s, 'triangle', base * 1.26, base * 1.28, 0.1, 0.2, 0.07);
  blip(s, 'triangle', base * 1.5, base * 1.55, 0.18, 0.22, 0.14);
}

/** Frenesi: rugido grave subindo, com brilho por cima. */
export function playFrenzyStart(s: SfxOutput): void {
  blip(s, 'sawtooth', 70, 320, 0.45, 0.3);
  blip(s, 'square', 440, 1320, 0.35, 0.12, 0.08);
  blip(s, 'triangle', 1760, 2640, 0.25, 0.1, 0.3);
}

/** Aviso de evento de horda: duas notas graves de alarme. */
export function playHordeEventAlarm(s: SfxOutput): void {
  blip(s, 'sawtooth', 220, 200, 0.22, 0.2);
  blip(s, 'sawtooth', 165, 150, 0.32, 0.22, 0.24);
}

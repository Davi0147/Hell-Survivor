import type { SfxOutput } from './SfxOutput';

// Objetos e efeitos das cenas de história. Síntese procedural (Web Audio), chamada pela fachada SoundManager.

/**
 * Estalo seco e crocante de caneta quebrando sob fúria
 */
export function playPenSnap(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Click agudo de plástico quebrando (Transient)
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snapOsc.type = 'sawtooth';
  snapOsc.frequency.setValueAtTime(2400, now);
  snapOsc.frequency.exponentialRampToValueAtTime(600, now + 0.025);
  snapGain.gain.setValueAtTime(0.50 * s.volume, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  snapOsc.connect(snapGain);
  snapGain.connect(s.out);
  snapOsc.start(now);
  snapOsc.stop(now + 0.035);

  // 2. Ruído / crack elástico
  const noiseOsc = ctx.createOscillator();
  const noiseGain = ctx.createGain();
  noiseOsc.type = 'square';
  noiseOsc.frequency.setValueAtTime(1400, now + 0.005);
  noiseOsc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
  noiseGain.gain.setValueAtTime(0.35 * s.volume, now + 0.005);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
  noiseOsc.connect(noiseGain);
  noiseGain.connect(s.out);
  noiseOsc.start(now + 0.005);
  noiseOsc.stop(now + 0.05);
}

/**
 * Chute violento na mesa de madeira / queda de objetos
 */
export function playTableKick(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Impacto grave do chute (Sub thud)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(120, now);
  subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.28);
  subGain.gain.setValueAtTime(0.65 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
  subOsc.connect(subGain);
  subGain.connect(s.out);
  subOsc.start(now);
  subOsc.stop(now + 0.35);

  // 2. Estrondo de madeira quebrando / chacoalhar de mesa
  const woodOsc = ctx.createOscillator();
  const woodGain = ctx.createGain();
  woodOsc.type = 'sawtooth';
  woodOsc.frequency.setValueAtTime(360, now + 0.02);
  woodOsc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
  woodGain.gain.setValueAtTime(0.40 * s.volume, now + 0.02);
  woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
  woodOsc.connect(woodGain);
  woodGain.connect(s.out);
  woodOsc.start(now + 0.02);
  woodOsc.stop(now + 0.26);
}

/**
 * Estrondo de choque / fúria dramática para gritos de desespero e raiva
 */
export function playRageBoom(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Boom cinematográfico
  const boomOsc = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boomOsc.type = 'sine';
  boomOsc.frequency.setValueAtTime(140, now);
  boomOsc.frequency.exponentialRampToValueAtTime(28, now + 0.65);
  boomGain.gain.setValueAtTime(0.55 * s.volume, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.70);
  boomOsc.connect(boomGain);
  boomGain.connect(s.out);
  boomOsc.start(now);
  boomOsc.stop(now + 0.75);

  // Rasgo agudo de distorção
  const distOsc = ctx.createOscillator();
  const distGain = ctx.createGain();
  distOsc.type = 'sawtooth';
  distOsc.frequency.setValueAtTime(320, now);
  distOsc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
  distGain.gain.setValueAtTime(0.28 * s.volume, now);
  distGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
  distOsc.connect(distGain);
  distGain.connect(s.out);
  distOsc.start(now);
  distOsc.stop(now + 0.22);
}

/**
 * Barulho de folhas de papel voando e farfalhando pelo ar
 */
export function playPaperRustle(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Três rajadas rápidas de farfalhar de alta frequência
  [0, 0.06, 0.13].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + delay;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, startTime);
    osc.frequency.exponentialRampToValueAtTime(900, startTime + 0.08);

    gain.gain.setValueAtTime(0.12 * s.volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

    osc.connect(gain);
    gain.connect(s.out);

    osc.start(startTime);
    osc.stop(startTime + 0.10);
  });
}

/**
 * Nuvem de fumaça negra / evaporação demoníaca
 */
export function playSmokePoof(s: SfxOutput): void {
  const { ctx } = s;
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

  gain.gain.setValueAtTime(0.35 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.42);
}

/**
 * Oscilação e zumbido elétrico de lâmpadas piscando
 */
export function playLightFlicker(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  [0, 0.05, 0.12, 0.18].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + delay;

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, startTime);

    gain.gain.setValueAtTime(0.15 * s.volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

    osc.connect(gain);
    gain.connect(s.out);

    osc.start(startTime);
    osc.stop(startTime + 0.04);
  });
}

/**
 * Som de carimbo/impacto pesado ao colar o título "CAPÍTULO 1 CONCLUÍDO" na tela
 */
export function playStampImpact(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Batida grave seca (Sub-thud)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(160, now);
  subOsc.frequency.exponentialRampToValueAtTime(34, now + 0.18);

  subGain.gain.setValueAtTime(0.45 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

  subOsc.connect(subGain);
  subGain.connect(s.out);
  subOsc.start(now);
  subOsc.stop(now + 0.22);

  // 2. Estalo de impacto na tela (Slap transitório)
  const slapOsc = ctx.createOscillator();
  const slapFilter = ctx.createBiquadFilter();
  const slapGain = ctx.createGain();
  slapOsc.type = 'triangle';
  slapOsc.frequency.setValueAtTime(520, now);
  slapOsc.frequency.exponentialRampToValueAtTime(95, now + 0.09);

  slapFilter.type = 'lowpass';
  slapFilter.frequency.setValueAtTime(1800, now);

  slapGain.gain.setValueAtTime(0.32 * s.volume, now);
  slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

  slapOsc.connect(slapFilter);
  slapFilter.connect(slapGain);
  slapGain.connect(s.out);
  slapOsc.start(now);
  slapOsc.stop(now + 0.12);
}

/**
 * Som de batida de cada estrela (STAR) na classificação final, subindo o tom a cada estrela
 */
export function playStarSlam(s: SfxOutput, starIndex: number): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const pitchMult = 1 + starIndex * 0.10;

  // 1. Impacto físico grave
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = 'sine';
  thudOsc.frequency.setValueAtTime(140 * pitchMult, now);
  thudOsc.frequency.exponentialRampToValueAtTime(42, now + 0.14);

  thudGain.gain.setValueAtTime(0.36 * s.volume, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  thudOsc.connect(thudGain);
  thudGain.connect(s.out);
  thudOsc.start(now);
  thudOsc.stop(now + 0.17);

  // 2. Brilho metálico estelar (Chime de impacto)
  const chimeOsc = ctx.createOscillator();
  const chimeGain = ctx.createGain();
  chimeOsc.type = 'triangle';
  chimeOsc.frequency.setValueAtTime(587.33 * pitchMult, now); // D5 escalonado
  chimeOsc.frequency.exponentialRampToValueAtTime(880 * pitchMult, now + 0.12);

  chimeGain.gain.setValueAtTime(0.24 * s.volume, now);
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  chimeOsc.connect(chimeGain);
  chimeGain.connect(s.out);
  chimeOsc.start(now);
  chimeOsc.stop(now + 0.24);
}

/**
 * Latido rouco de cão do inferno (prólogo): um "wuf" grave com rosnado em cima.
 */
export function playDogBark(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Corpo do latido: sobe e cai rápido, como uma boca abrindo e fechando
  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  body.type = 'sawtooth';
  body.frequency.setValueAtTime(190, now);
  body.frequency.exponentialRampToValueAtTime(420, now + 0.04);
  body.frequency.exponentialRampToValueAtTime(140, now + 0.2);
  bodyGain.gain.setValueAtTime(0.001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.55 * s.volume, now + 0.025);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  body.connect(bodyGain);
  bodyGain.connect(s.out);
  body.start(now);
  body.stop(now + 0.24);

  // 2. Rosnado: quadrada grave tremendo (modulada por um oscilador lento)
  const growl = ctx.createOscillator();
  const growlGain = ctx.createGain();
  const wobble = ctx.createOscillator();
  const wobbleDepth = ctx.createGain();
  growl.type = 'square';
  growl.frequency.setValueAtTime(85, now);
  wobble.frequency.setValueAtTime(38, now);
  wobbleDepth.gain.setValueAtTime(30, now);
  wobble.connect(wobbleDepth);
  wobbleDepth.connect(growl.frequency);
  growlGain.gain.setValueAtTime(0.001, now);
  growlGain.gain.exponentialRampToValueAtTime(0.3 * s.volume, now + 0.03);
  growlGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
  growl.connect(growlGain);
  growlGain.connect(s.out);
  growl.start(now);
  wobble.start(now);
  growl.stop(now + 0.28);
  wobble.stop(now + 0.28);
}

/** Ruído branco curto (rajada de ar, rasgo, grito chiado). */
function noiseSource(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  return src;
}

/**
 * Soco seco de corte de cena: estalo de pele + baque grave curto.
 */
export function playPunchHit(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(190, now);
  thud.frequency.exponentialRampToValueAtTime(40, now + 0.16);
  thudGain.gain.setValueAtTime(0.7 * s.volume, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  thud.connect(thudGain);
  thudGain.connect(s.out);
  thud.start(now);
  thud.stop(now + 0.22);

  const slap = noiseSource(ctx, 0.08);
  const slapFilter = ctx.createBiquadFilter();
  const slapGain = ctx.createGain();
  slapFilter.type = 'bandpass';
  slapFilter.frequency.setValueAtTime(1600, now);
  slapFilter.Q.setValueAtTime(0.8, now);
  slapGain.gain.setValueAtTime(0.55 * s.volume, now);
  slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  slap.connect(slapFilter);
  slapFilter.connect(slapGain);
  slapGain.connect(s.out);
  slap.start(now);
  slap.stop(now + 0.08);
}

/**
 * Estrondo de carne e osso arrancados: baque enorme + rasgo chiado descendo.
 */
export function playGoreRip(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  const boom = ctx.createOscillator();
  const boomGain = ctx.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(110, now);
  boom.frequency.exponentialRampToValueAtTime(22, now + 0.9);
  boomGain.gain.setValueAtTime(0.85 * s.volume, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  boom.connect(boomGain);
  boomGain.connect(s.out);
  boom.start(now);
  boom.stop(now + 1.05);

  const rip = noiseSource(ctx, 0.5);
  const ripFilter = ctx.createBiquadFilter();
  const ripGain = ctx.createGain();
  ripFilter.type = 'lowpass';
  ripFilter.frequency.setValueAtTime(5000, now);
  ripFilter.frequency.exponentialRampToValueAtTime(300, now + 0.45);
  ripGain.gain.setValueAtTime(0.6 * s.volume, now);
  ripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
  rip.connect(ripFilter);
  ripFilter.connect(ripGain);
  ripGain.connect(s.out);
  rip.start(now);
  rip.stop(now + 0.5);

  const crack = ctx.createOscillator();
  const crackGain = ctx.createGain();
  crack.type = 'square';
  crack.frequency.setValueAtTime(900, now);
  crack.frequency.exponentialRampToValueAtTime(120, now + 0.06);
  crackGain.gain.setValueAtTime(0.4 * s.volume, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  crack.connect(crackGain);
  crackGain.connect(s.out);
  crack.start(now);
  crack.stop(now + 0.08);
}

/**
 * Grito demoníaco: voz rasgada que sobe, treme e despenca, com chiado de garganta por cima.
 */
export function playDemonScream(s: SfxOutput, seconds: number = 2.2): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const end = now + seconds;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.001, now);
  master.gain.exponentialRampToValueAtTime(0.5 * s.volume, now + 0.08);
  master.gain.setValueAtTime(0.5 * s.volume, now + seconds * 0.55);
  master.gain.exponentialRampToValueAtTime(0.001, end);
  master.connect(s.out);

  // Duas vozes desafinadas entre si (som de garganta, não de apito)
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();
  vibrato.frequency.setValueAtTime(7, now);
  vibratoDepth.gain.setValueAtTime(35, now);
  vibrato.connect(vibratoDepth);

  const formant = ctx.createBiquadFilter();
  formant.type = 'bandpass';
  formant.frequency.setValueAtTime(900, now);
  formant.frequency.linearRampToValueAtTime(1400, now + seconds * 0.3);
  formant.frequency.exponentialRampToValueAtTime(500, end);
  formant.Q.setValueAtTime(1.4, now);
  formant.connect(master);

  for (const detune of [0, 1.07]) {
    const voice = ctx.createOscillator();
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(260 * (1 + detune * 0.04), now);
    voice.frequency.exponentialRampToValueAtTime(620 * (1 + detune * 0.04), now + seconds * 0.3);
    voice.frequency.exponentialRampToValueAtTime(140, end);
    vibratoDepth.connect(voice.frequency);
    voice.connect(formant);
    voice.start(now);
    voice.stop(end + 0.05);
  }

  const rasp = noiseSource(ctx, seconds);
  const raspFilter = ctx.createBiquadFilter();
  const raspGain = ctx.createGain();
  raspFilter.type = 'bandpass';
  raspFilter.frequency.setValueAtTime(2400, now);
  raspFilter.Q.setValueAtTime(0.7, now);
  raspGain.gain.setValueAtTime(0.35, now);
  rasp.connect(raspFilter);
  raspFilter.connect(raspGain);
  raspGain.connect(master);
  rasp.start(now);
  rasp.stop(end);

  vibrato.start(now);
  vibrato.stop(end + 0.05);
}

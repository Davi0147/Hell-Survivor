import type { SfxOutput } from './SfxOutput';

// Armas, evoluções e ataques de Azazel. Síntese procedural (Web Audio), chamada pela fachada SoundManager.

/**
 * Arremesso veloz e cortante das Adagas de Sangue
 */
export function playBloodDaggerThrow(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Sibilo metálico agudo cortando o vento
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1600, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.075);

  gain.gain.setValueAtTime(0.16 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(s.out);
  osc.start(now);
  osc.stop(now + 0.085);
}

/**
 * Corte cinematográfico de execução: sibilo metálico rápido e impacto sub-grave pesado
 */
export function playExecutionSlash(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Sibilo cortante da lâmina em alta frequência
  const slashOsc = ctx.createOscillator();
  const slashGain = ctx.createGain();
  slashOsc.type = 'sawtooth';
  slashOsc.frequency.setValueAtTime(3200, now);
  slashOsc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

  slashGain.gain.setValueAtTime(0.35 * s.volume, now);
  slashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  slashOsc.connect(slashGain);
  slashGain.connect(s.out);
  slashOsc.start(now);
  slashOsc.stop(now + 0.23);

  // 2. Impacto de sub-grave pesado
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(130, now);
  subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.35);

  subGain.gain.setValueAtTime(0.40 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  subOsc.connect(subGain);
  subGain.connect(s.out);
  subOsc.start(now);
  subOsc.stop(now + 0.40);
}

/**
 * Chicoteio metálico e eco espectral das Cadeias Abissais
 */
export function playAbyssalChainsWhip(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Tilintar de elos de ferro + chicote grave
  [0, 0.035, 0.07].forEach((delay, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + delay;

    osc.type = idx === 0 ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(980 + idx * 320, start);
    osc.frequency.exponentialRampToValueAtTime(220, start + 0.09);

    gain.gain.setValueAtTime(0.14 * s.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.10);

    osc.connect(gain);
    gain.connect(s.out);
    osc.start(start);
    osc.stop(start + 0.11);
  });
}

/**
 * Impacto explosivo e grave do Meteoro Infernal
 */
export function playMeteorImpact(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Estrondo sísmico sub-grave
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(150, now);
  subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.34);

  subGain.gain.setValueAtTime(0.32 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

  subOsc.connect(subGain);
  subGain.connect(s.out);
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

  crackGain.gain.setValueAtTime(0.22 * s.volume, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  crackOsc.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(s.out);
  crackOsc.start(now);
  crackOsc.stop(now + 0.25);
}

/**
 * Fanfarra lendária de Evolução Suprema de Arma (Weapon Fusion)
 */
export function playWeaponEvolve(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.055;

    osc.type = i >= 4 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.22 * s.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

    osc.connect(gain);
    gain.connect(s.out);
    osc.start(start);
    osc.stop(start + 0.48);
  });
}

/**
 * Som de explosão massiva e detonação de rochas (usado no Altar de Ascensão e chefes)
 */
export function playEnemyExplosion(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // Sub-bass estrondoso
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(140, now);
  subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

  subGain.gain.setValueAtTime(0.42 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  subOsc.connect(subGain);
  subGain.connect(s.out);
  subOsc.start(now);
  subOsc.stop(now + 0.40);

  // Ruído/estalo de rocha estilhaçando
  const crackOsc = ctx.createOscillator();
  const crackFilter = ctx.createBiquadFilter();
  const crackGain = ctx.createGain();
  crackOsc.type = 'sawtooth';
  crackOsc.frequency.setValueAtTime(420, now);
  crackOsc.frequency.exponentialRampToValueAtTime(60, now + 0.28);

  crackFilter.type = 'lowpass';
  crackFilter.frequency.setValueAtTime(1200, now);
  crackFilter.frequency.exponentialRampToValueAtTime(120, now + 0.28);

  crackGain.gain.setValueAtTime(0.3 * s.volume, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

  crackOsc.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(s.out);
  crackOsc.start(now);
  crackOsc.stop(now + 0.32);
}

/**
 * Som de teleporte sombrio de Azazel (blink reverso + deslocamento de ar)
 */
export function playAzazelTeleport(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(620, now);
  osc.frequency.exponentialRampToValueAtTime(95, now + 0.14);

  gain.gain.setValueAtTime(0.22 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(s.out);
  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Som de queda de raio abissal de Azazel (estalo elétrico agudo + trovão grave)
 */
export function playAzazelLightningStrike(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Estalo elétrico cortante
  const zapOsc = ctx.createOscillator();
  const zapGain = ctx.createGain();
  zapOsc.type = 'sawtooth';
  zapOsc.frequency.setValueAtTime(2200, now);
  zapOsc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

  zapGain.gain.setValueAtTime(0.28 * s.volume, now);
  zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  zapOsc.connect(zapGain);
  zapGain.connect(s.out);
  zapOsc.start(now);
  zapOsc.stop(now + 0.15);

  // 2. Trovão sub-grave
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(135, now);
  subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

  subGain.gain.setValueAtTime(0.32 * s.volume, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

  subOsc.connect(subGain);
  subGain.connect(s.out);
  subOsc.start(now);
  subOsc.stop(now + 0.32);
}

/**
 * Som de disparo de projétil de energia de Azazel
 */
export function playAzazelOrbShoot(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);

  gain.gain.setValueAtTime(0.15 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

  osc.connect(gain);
  gain.connect(s.out);
  osc.start(now);
  osc.stop(now + 0.11);
}

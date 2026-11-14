import type { SfxOutput } from './SfxOutput';

// Interface, roleta e cartas. Síntese procedural (Web Audio), chamada pela fachada SoundManager.

/**
 * Som de passar o cursor sobre botões de menu
 */
export function playMenuHover(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

  gain.gain.setValueAtTime(0.08 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.05);
}

/**
 * Som de clique / confirmação de menu
 */
export function playMenuClick(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.setValueAtTime(1040, now + 0.04);

  gain.gain.setValueAtTime(0.20 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Barulhinho satisfatório de clique místico / roleta ao rolar cada nome de bênção
 */
export function playRouletteTick(s: SfxOutput, pitchMult: number): void {
  const { ctx } = s;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Timbre cristalino e estalado estilo slot machine retrô
  osc.type = 'triangle';
  const baseFreq = 1150 * pitchMult;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.025);

  gain.gain.setValueAtTime(0.22 * s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gain);
  gain.connect(s.out);

  osc.start(now);
  osc.stop(now + 0.04);
}

/**
 * Som triunfante de prêmio / jackpot ao selecionar a bênção final
 */
export function playRouletteJackpot(s: SfxOutput): void {
  const { ctx } = s;
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
    const vol = (idx === notes.length - 1 ? 0.32 : 0.20) * s.volume;

    gain.gain.setValueAtTime(vol, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

    osc.connect(gain);
    gain.connect(s.out);

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

  shimmerGain.gain.setValueAtTime(0.15 * s.volume, shimmerStart);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + 0.40);

  shimmerOsc.connect(shimmerGain);
  shimmerGain.connect(s.out);

  shimmerOsc.start(shimmerStart);
  shimmerOsc.stop(shimmerStart + 0.42);
}

/**
 * Fanfarra estilo Cassino / Arcade Slot ao subir de nível e abrir as 3 cartas
 */
export function playCasinoLevelUp(s: SfxOutput): void {
  const { ctx } = s;
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

    const vol = (isLast ? 0.24 : 0.12) * s.volume;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(s.out);

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

    flipGain.gain.setValueAtTime(0.18 * s.volume, t);
    flipGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    flipOsc.connect(flipGain);
    flipGain.connect(s.out);

    flipOsc.start(t);
    flipOsc.stop(t + 0.04);
  });
}

/**
 * Som tátil e viciante ao passar o mouse sobre uma carta flutuante
 */
export function playCardHover(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Estalo suave de carta (snap curto)
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();
  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(740, now);
  snapOsc.frequency.exponentialRampToValueAtTime(1480, now + 0.035);

  snapGain.gain.setValueAtTime(0.16 * s.volume, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  snapOsc.connect(snapGain);
  snapGain.connect(s.out);
  snapOsc.start(now);
  snapOsc.stop(now + 0.045);

  // 2. Brilho harmônico místico sutil (shimmer)
  const chimeOsc = ctx.createOscillator();
  const chimeGain = ctx.createGain();
  chimeOsc.type = 'sine';
  chimeOsc.frequency.setValueAtTime(1975.53, now + 0.01); // B6
  chimeOsc.frequency.exponentialRampToValueAtTime(2637.02, now + 0.08); // E7

  chimeGain.gain.setValueAtTime(0.09 * s.volume, now + 0.01);
  chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  chimeOsc.connect(chimeGain);
  chimeGain.connect(s.out);
  chimeOsc.start(now + 0.01);
  chimeOsc.stop(now + 0.095);
}

/**
 * Som explosivo de "CASH / KA-CHING!" + moedas tilintando ao escolher uma carta
 */
export function playCardCashSelect(s: SfxOutput): void {
  const { ctx } = s;
  const now = ctx.currentTime;

  // 1. Impacto grave de explosão da carta escolhida (punch)
  const punchOsc = ctx.createOscillator();
  const punchGain = ctx.createGain();
  punchOsc.type = 'sine';
  punchOsc.frequency.setValueAtTime(190, now);
  punchOsc.frequency.exponentialRampToValueAtTime(52, now + 0.14);

  punchGain.gain.setValueAtTime(0.32 * s.volume, now);
  punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  punchOsc.connect(punchGain);
  punchGain.connect(s.out);
  punchOsc.start(now);
  punchOsc.stop(now + 0.16);

  // 2. Primeiro toque metálico do "KA-" (Sino de Caixa Registradora C7)
  const bell1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  bell1.type = 'triangle';
  bell1.frequency.setValueAtTime(2093.0, now + 0.02); // C7
  gain1.gain.setValueAtTime(0.28 * s.volume, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
  bell1.connect(gain1);
  gain1.connect(s.out);
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

    const vol = (idx === 0 ? 0.28 : 0.18) * s.volume;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.52);

    osc.connect(gain);
    gain.connect(s.out);
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

    coinGain.gain.setValueAtTime(0.12 * s.volume, t);
    coinGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    coinOsc.connect(coinGain);
    coinGain.connect(s.out);
    coinOsc.start(t);
    coinOsc.stop(t + 0.065);
  }
}

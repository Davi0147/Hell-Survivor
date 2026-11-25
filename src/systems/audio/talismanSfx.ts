import type { SfxOutput } from './SfxOutput';

// Talismãs: sons da carta que sobe de raridade. `tier` vai de 0 (comum) a 4 (lendária):
// quanto mais alto, mais agudo, mais notas e mais longo, para a raridade "ser sentida".

function tone(s: SfxOutput, type: OscillatorType, freq: number, start: number, dur: number, vol: number, slideTo?: number): void {
  const osc = s.ctx.createOscillator();
  const gain = s.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(vol * s.volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(s.out);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Toque na carta: baque grave e um estalo, um pouco mais agudo a cada raridade. */
export function playTalismanTap(s: SfxOutput, tier: number): void {
  const now = s.ctx.currentTime;
  tone(s, 'sine', 180 + tier * 30, now, 0.12, 0.4, 70);
  tone(s, 'triangle', 1400 + tier * 180, now, 0.03, 0.12);
}

// Escala maior pentatônica (fica bonita em qualquer ordem)
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];

/** A carta subiu de raridade: arpejo que sobe, com mais notas quanto mais rara. */
export function playTalismanTierUp(s: SfxOutput, tier: number): void {
  const now = s.ctx.currentTime;
  const notes = 3 + tier;
  const startIdx = Math.min(tier, SCALE.length - notes);
  for (let i = 0; i < notes; i++) {
    const t = now + i * 0.05;
    const isLast = i === notes - 1;
    tone(s, isLast ? 'sine' : 'triangle', SCALE[startIdx + i], t, isLast ? 0.35 + tier * 0.08 : 0.12, isLast ? 0.28 : 0.18);
  }
  // Varrida de brilho por baixo
  tone(s, 'sawtooth', 220 + tier * 60, now, 0.25, 0.05, 900 + tier * 300);
}

/** A carta abriu: fanfarra; épica e lendária ganham acorde longo e brilho de sino. */
export function playTalismanOpen(s: SfxOutput, tier: number): void {
  const now = s.ctx.currentTime;
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((f, i) => tone(s, 'triangle', f * (1 + tier * 0.06), now + i * 0.06, 0.2, 0.2));
  if (tier >= 3) {
    const t = now + 0.26;
    const dur = tier >= 4 ? 1.6 : 1.0;
    for (const f of [261.63, 392, 523.25, 659.25, 783.99]) tone(s, 'sine', f, t, dur, 0.12);
    tone(s, 'sine', 2093, t + 0.1, dur * 0.8, 0.1, 4186);
  }
  if (tier >= 4) {
    // Lendária: batida grave e um segundo brilho subindo
    tone(s, 'sine', 90, now, 0.6, 0.5, 40);
    tone(s, 'triangle', 1567.98, now + 0.5, 0.9, 0.14, 3135.96);
  }
}

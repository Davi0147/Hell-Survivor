import { SHYLPH_BOSS_BALANCE } from '../../../config/balance';
import type { SeraphPattern } from '../../../systems/shylphRules';
import { fanAngles } from '../../../systems/shylphRules';

const S = SHYLPH_BOSS_BALANCE.seraph;

/**
 * Ritmo dos padrões de tiro do Serafim: decide QUANDO e PARA ONDE sai cada pena.
 * Não desenha nada; chama `fire(angulo)` e quem chamou cria a pena.
 */
export class SeraphVolley {
  private pattern: SeraphPattern = 'ring';
  private timer = 0;
  private shots = 0;
  private spin = 0;

  public start(pattern: SeraphPattern, startAngle: number): void {
    this.pattern = pattern;
    this.timer = 0;
    this.shots = 0;
    this.spin = startAngle;
  }

  /** `aimAngle`: direção atual da heroína (só o padrão mirado usa). */
  public update(deltaMs: number, aimAngle: number, fire: (angle: number) => void): void {
    this.timer -= deltaMs;
    while (this.timer <= 0) {
      this.timer += this.interval();
      this.emit(aimAngle, fire);
      this.shots++;
    }
  }

  private interval(): number {
    switch (this.pattern) {
      case 'ring':
        // As ondas cabem no tempo de tiro; depois disso o anel fica quieto até sumir
        return this.shots < S.ring.waves ? S.ring.intervalMs : Number.POSITIVE_INFINITY;
      case 'spiral':
        return S.spiral.intervalMs;
      case 'aimed':
        return S.aimed.intervalMs;
      case 'star':
        return S.star.intervalMs;
    }
  }

  private emit(aimAngle: number, fire: (angle: number) => void): void {
    switch (this.pattern) {
      case 'ring': {
        if (this.shots >= S.ring.waves) return;
        const step = (Math.PI * 2) / S.ring.bolts;
        // Ondas desencontradas: cada uma sai no meio dos buracos da anterior
        const offset = this.spin + (this.shots % 2) * (step / 2);
        for (let i = 0; i < S.ring.bolts; i++) fire(offset + step * i);
        return;
      }
      case 'spiral': {
        this.spin += S.spiral.angleStep;
        for (let i = 0; i < S.spiral.arms; i++) fire(this.spin + (Math.PI * 2 * i) / S.spiral.arms);
        return;
      }
      case 'aimed': {
        for (const a of fanAngles(aimAngle, S.aimed.bolts, S.aimed.spread)) fire(a);
        return;
      }
      case 'star': {
        this.spin += S.star.rotateStep;
        for (let i = 0; i < S.star.points; i++) fire(this.spin + (Math.PI * 2 * i) / S.star.points);
        return;
      }
    }
  }
}

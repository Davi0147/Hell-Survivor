/**
 * Regras puras da luta da Shylph (sem Phaser): escolha de animação por direção,
 * leque das penas e força do puxão dos tornados. Testadas em `__tests__/shylphRules.test.ts`.
 */

/** Direções que existem na folha (o oeste é o leste espelhado). */
export type ShylphSheetDir = 'south' | 'east' | 'north';

export interface ShylphFacing {
  dir: ShylphSheetDir;
  flipX: boolean;
}

/**
 * Andar: 4 direções. `angle` em radianos no sistema da tela (y para baixo):
 * 0 = leste, PI/2 = sul.
 */
export function pickWalkFacing(angle: number): ShylphFacing {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  if (Math.abs(dx) >= Math.abs(dy)) return { dir: 'east', flipX: dx < 0 };
  return { dir: dy > 0 ? 'south' : 'north', flipX: false };
}

/**
 * Ataques e lambida só têm frente e lado: alvo bem abaixo usa a frente; o resto usa o
 * lado virado para o alvo (de costas ela não arremessa).
 */
export function pickAttackFacing(angle: number, hasSouth: boolean): ShylphFacing {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  if (hasSouth && dy > 0 && dy >= Math.abs(dx)) return { dir: 'south', flipX: false };
  return { dir: 'east', flipX: dx < 0 };
}

/** Ângulos das penas espalhadas igualmente num leque de abertura total `spread`. */
export function fanAngles(baseAngle: number, count: number, spread: number): number[] {
  if (count <= 1) return [baseAngle];
  const step = spread / (count - 1);
  return Array.from({ length: count }, (_, i) => baseAngle - spread / 2 + step * i);
}

/** Puxão do tornado (px/s): zero fora do raio, cresce até `strength` no centro. */
export function tornadoPullSpeed(dist: number, pullRadius: number, strength: number): number {
  if (dist >= pullRadius || pullRadius <= 0) return 0;
  return strength * (1 - Math.max(0, dist) / pullRadius);
}

/** Fases da luta, na ordem. */
export type ShylphPhase = 'normal' | 'seraph' | 'final';

/**
 * Vida mínima dentro da fase: um golpe enorme não pula a fase seguinte, ele para no limite
 * e a troca de fase acontece. Na fase final não há limite (0 = pode morrer).
 */
export function phaseFloorHp(maxHp: number, phase: ShylphPhase, phaseAt: { seraph: number; final: number }): number {
  if (phase === 'normal') return Math.ceil(maxHp * phaseAt.seraph) - 1;
  if (phase === 'seraph') return Math.ceil(maxHp * phaseAt.final) - 1;
  return 0;
}

export interface SeraphFlapConfig {
  periodMs: number;
  /** Parte do ciclo gasta na batida para baixo (rápida). */
  downstrokeFraction: number;
  /** Quanto a batida ergue o corpo (px). */
  liftPx: number;
  /** Quanto o corpo afunda no fim da subida das asas (px). */
  sinkPx: number;
}

/**
 * Bater de asas do Serafim com 2 quadros: na batida para baixo (rápida) as asas ficam
 * embaixo e o corpo é erguido; na subida das asas (lenta) o corpo afunda um pouco.
 * `offsetY` negativo = mais alto na tela. O movimento é contínuo entre os ciclos.
 */
export function seraphFlap(timeMs: number, cfg: SeraphFlapConfig): { wingsDown: boolean; offsetY: number } {
  const p = (((timeMs % cfg.periodMs) + cfg.periodMs) % cfg.periodMs) / cfg.periodMs;
  const d = cfg.downstrokeFraction;
  if (p < d) {
    const k = p / d;
    const easeOut = 1 - (1 - k) * (1 - k);
    return { wingsDown: true, offsetY: cfg.sinkPx + (-cfg.liftPx - cfg.sinkPx) * easeOut };
  }
  const k = (p - d) / (1 - d);
  const easeInOut = (1 - Math.cos(Math.PI * k)) / 2;
  return { wingsDown: false, offsetY: -cfg.liftPx + (cfg.sinkPx + cfg.liftPx) * easeInOut };
}

/** Ordem dos padrões de tiro do Serafim (cada reaparição usa o seguinte). */
export const SERAPH_PATTERNS = ['ring', 'spiral', 'aimed', 'star'] as const;
export type SeraphPattern = (typeof SERAPH_PATTERNS)[number];

export function nextSeraphPattern(index: number): SeraphPattern {
  const n = SERAPH_PATTERNS.length;
  return SERAPH_PATTERNS[((index % n) + n) % n];
}

/**
 * Ponto onde o Serafim reaparece: em volta da heroína, entre `min` e `max` de distância.
 * `angle01` e `dist01` são sorteios de 0 a 1 (injetados para dar para testar).
 */
export function seraphTeleportPoint(
  px: number,
  py: number,
  angle01: number,
  dist01: number,
  min: number,
  max: number
): { x: number; y: number } {
  const a = angle01 * Math.PI * 2;
  const d = min + (max - min) * dist01;
  return { x: px + Math.cos(a) * d, y: py + Math.sin(a) * d };
}

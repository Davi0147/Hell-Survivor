import { describe, it, expect } from 'vitest';

/** Arquivos de arte do Azazel que existem em public/ (só os nomes; nada é carregado). */
const AZAZEL_ART = Object.keys(import.meta.glob('/public/assets/sprites/enemies/Azazel/**/*.png'));
const existsSync = (path: string): boolean => AZAZEL_ART.includes(`/${path}`);
import { AZAZEL_BOSS_BALANCE as A, BALANCE } from '../config/balance';

/**
 * Regra de ouro das lutas de chefe (balance.ts): nenhum golpe sozinho tira mais de ~45%
 * da vida base da heroína, e golpes não se somam no mesmo instante.
 */
describe('Azazel: nenhum golpe mata de uma vez', () => {
  const maxSingleHit = BALANCE.NIXY.maxHp * 0.45;
  const hits: Record<string, number> = {
    contato: A.baseContactDamage,
    clone: A.cloneContactDamage,
    orbeDirecionada: A.directedBurstOrbDamage,
    orbeTeleporte: A.teleportOrbDamage,
    orbeEspiral: A.spiralOrbDamage,
    orbeClones: A.darkCloneOrbDamage,
    dash: A.rapidDashDamage,
    raio: A.lightningBoltDamage,
    dashEscuridao: A.darkFiveDashesDamage,
    pena: A.featherFan.damage,
    tapaDaMao: A.crystalPhase.handSlam.damage,
    aureola: A.haloWave.damage,
  };

  for (const [name, dmg] of Object.entries(hits)) {
    it(`${name} (${dmg}) fica abaixo de 45% da vida base`, () => {
      expect(dmg).toBeGreaterThan(0);
      expect(dmg).toBeLessThanOrEqual(maxSingleHit);
    });
  }

  it('existe imunidade curta entre golpes (no máximo ~2 acertos por segundo)', () => {
    expect(A.playerHitCooldownMs).toBeGreaterThanOrEqual(400);
  });

  it('o cone das penas trava antes de disparar (dá tempo de sair)', () => {
    expect(A.featherFan.lockMs).toBeGreaterThan(200);
    expect(A.featherFan.lockMs).toBeLessThan(A.featherFan.telegraphMs);
  });

  it('a auréola cabe na arena e carrega antes de soltar', () => {
    expect(A.haloWave.telegraphMs).toBeGreaterThanOrEqual(800);
    expect(A.haloWave.endRadius).toBeGreaterThan(A.haloWave.startRadius);
  });

  it('roda de caveiras: a boca fecha antes da próxima salva e nem todas atiram juntas', () => {
    const s = A.darkSkulls;
    expect(s.mouthOpenMs).toBeLessThan(s.volleyEveryMs);
    expect(s.shootersPerVolley).toBeGreaterThan(0);
    expect(s.shootersPerVolley).toBeLessThan(s.count);
    // A orbe nasce fora do raio de quem está no centro da roda
    expect(s.radius - s.mouthOffset).toBeGreaterThan(200);
  });

  it('cada golpe aponta para uma arte que existe, com a cabeça dentro do desenho', () => {
    const files: Record<string, string> = {
      'azazel-skull-orb': 'Skull/skull-orb.png',
    };
    for (const [name, look] of Object.entries(A.projectileArt)) {
      const file = files[look.texture] ?? `Projectiles/${look.texture.replace('azazel-proj-', '')}.png`;
      expect(existsSync(`public/assets/sprites/enemies/Azazel/${file}`), `${name}: ${file}`).toBe(true);
      expect(look.originX).toBeGreaterThanOrEqual(0);
      expect(look.originX).toBeLessThanOrEqual(1);
      expect(look.scale).toBeGreaterThan(0);
    }
  });
});

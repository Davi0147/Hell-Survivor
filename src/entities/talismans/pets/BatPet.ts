import { TALISMAN_BALANCE } from '../../../config/balance';
import type { SoulGem } from '../../items/SoulGem';
import { BasePet } from './BasePet';
import { hitEnemy, nearestEnemy, type ITalismanContext } from '../talismanContext';

/** Morcego Coletor (comum): orbita a heroína, puxa gemas próximas e bica monstros perto. */
export class BatPet extends BasePet {
  private angle = 0;
  private pullTimer = 0;
  private peckTimer = 0;

  constructor(ctx: ITalismanContext) {
    super(ctx, { run: 'blood-bat-fly', idle: 'blood-bat-idle', runCardinalOnly: true }, TALISMAN_BALANCE.pets.bat.scale);
  }

  public update(deltaMs: number): void {
    const cfg = TALISMAN_BALANCE.pets.bat;
    this.angle += cfg.orbitSpeed * (deltaMs / 1000);
    const p = this.restPoint(this.angle);
    // Balança um pouco para cima e para baixo, como um morcego voando
    const bob = Math.sin(this.angle * 3) * 4;
    this.placeAt(p.x, p.y - 14 + bob, true, p.x - this.x, p.y - this.y);

    this.pullTimer -= deltaMs;
    if (this.pullTimer <= 0) {
      this.pullTimer = cfg.pullEveryMs;
      this.pullGems(cfg.pullRadius);
    }

    this.peckTimer -= deltaMs;
    if (this.peckTimer <= 0) {
      const target = nearestEnemy(this.ctx, this.x, this.y, cfg.peckRange);
      if (target) {
        this.peckTimer = cfg.peckEveryMs;
        hitEnemy(this.ctx, target, cfg.peckDamage);
      }
    }
    this.syncOutline();
  }

  private pullGems(radius: number): void {
    const gems = this.ctx.gemsGroup?.getChildren() as SoulGem[] | undefined;
    if (!gems) return;
    const rSq = radius * radius;
    for (const g of gems) {
      if (!g.active) continue;
      if ((g.x - this.x) ** 2 + (g.y - this.y) ** 2 <= rSq) g.forceMagnetPull();
    }
  }
}

import Phaser from 'phaser';
import { RadarEnemy, RadarPlayer, RadarWorld } from './radarTypes';
import { FX_COLORS } from '../config/theme';

/**
 * Radar tático circular do canto superior direito da HUD (posição em `config/hudLayout.ts`).
 * Desenha a moldura uma vez e redesenha os blips (inimigos, itens, cristais,
 * altares e o ponteiro da heroína) a cada quadro.
 */
export class TacticalRadar {
  private readonly centerX: number;
  private readonly centerY: number;
  private readonly radius: number;
  private readonly worldRange = 750;

  private readonly frameGraphics: Phaser.GameObjects.Graphics;
  private readonly blipsGraphics: Phaser.GameObjects.Graphics;
  private readonly tagText: Phaser.GameObjects.Text;
  private readonly northText: Phaser.GameObjects.Text;

  /** @param area centro e raio (maior no celular, onde a tela é pequena) */
  constructor(private readonly scene: Phaser.Scene, pixelFont: string, area: { x: number; y: number; r: number }) {
    this.radius = area.r;
    this.centerX = area.x;
    this.centerY = area.y;
    const labelSize = `${Math.round(10 * Math.min(1.6, area.r / 54))}px`;
    this.frameGraphics = scene.add.graphics();
    this.frameGraphics.setDepth(100);
    this.drawFrame();

    this.blipsGraphics = scene.add.graphics();
    this.blipsGraphics.setDepth(101);

    this.tagText = scene.add.text(this.centerX, this.centerY + this.radius + 11, 'RADAR // 750m', {
      fontFamily: pixelFont,
      fontSize: labelSize,
      fontStyle: 'bold',
      color: '#c59b27',
      stroke: '#0e0308',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(102);

    this.northText = scene.add.text(this.centerX, this.centerY - this.radius - 7, 'N', {
      fontFamily: pixelFont,
      fontSize: labelSize,
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#0e0308',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(102);
  }

  /** Objetos que entram no liga/desliga geral da HUD. */
  public getHudElements(): Phaser.GameObjects.GameObject[] {
    return [this.frameGraphics, this.blipsGraphics, this.tagText, this.northText];
  }

  public clearBlips(): void {
    this.blipsGraphics.clear();
  }

  /** Posição do blip no radar; fora do alcance, fica preso na borda apontando para o alvo. */
  private toRadar(dx: number, dy: number): { bx: number; by: number; dist: number } {
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const maxBlipRadius = this.radius - 4;
    const blipDist = dist > this.worldRange ? maxBlipRadius : (dist / this.worldRange) * maxBlipRadius;
    return { bx: this.centerX + Math.cos(angle) * blipDist, by: this.centerY + Math.sin(angle) * blipDist, dist };
  }

  public update(p: RadarPlayer, world: RadarWorld): void {
    const g = this.blipsGraphics;
    g.clear();

    // 1. Inimigos (gemas de XP não aparecem no radar)
    if (world.enemiesGroup) {
      const enemies = world.enemiesGroup.getChildren();
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i] as unknown as RadarEnemy;
        if (!enemy.active || !enemy.visible || enemy.isDead) continue;

        // Chefes e minichefes: HP alto ou textura de chefe; sempre visíveis (presos na borda)
        const key = enemy.texture?.key ?? '';
        const isBoss = (enemy.maxHp !== undefined && enemy.maxHp >= 80) ||
          key.includes('succubus') || key.includes('boss') || key.includes('azazel');

        const { bx, by, dist } = this.toRadar(enemy.x - p.x, enemy.y - p.y);
        if (isBoss) {
          g.fillStyle(0xff0055, 1);
          g.fillCircle(bx, by, 4.5);
        } else {
          if (dist > this.worldRange) continue;
          g.fillStyle(0xff2a4d, 0.9);
          g.fillCircle(bx, by, 2.5);
        }
      }
    }

    // 2. Itens de mapa (verde com contorno branco)
    if (world.mapItemsGroup) {
      const items = world.mapItemsGroup.getChildren();
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as unknown as RadarEnemy;
        if (!item.active || !item.visible) continue;
        const { bx, by } = this.toRadar(item.x - p.x, item.y - p.y);
        g.fillStyle(0x00ff66, 1);
        g.fillCircle(bx, by, 3.8);
        g.lineStyle(1, 0xffffff, 0.9);
        g.strokeCircle(bx, by, 3.8);
      }
    }

    // 3. Cristais de Azazel (fase 3)
    if (Array.isArray(world.azazelCrystals)) {
      for (const crystal of world.azazelCrystals) {
        if (!crystal || !crystal.active || crystal.isCompleted || crystal.isDestroyed) continue;
        const { bx, by } = this.toRadar(crystal.x - p.x, crystal.y - p.y);
        g.fillStyle(0x00f5d4, 1);
        g.fillCircle(bx, by, 5.2);
        g.lineStyle(1.8, 0xff0055, 1);
        g.strokeCircle(bx, by, 5.2);
      }
    }

    // 4. Altar de Ascensão: "X" vermelho com contorno escuro
    const altar = world.altarInstance;
    if (altar && altar.active && !altar.isDestroyed) {
      const { bx, by } = this.toRadar(altar.x - p.x, altar.y - p.y);
      const xArm = 4.5;
      const drawX = (): void => {
        g.beginPath();
        g.moveTo(bx - xArm, by - xArm);
        g.lineTo(bx + xArm, by + xArm);
        g.moveTo(bx + xArm, by - xArm);
        g.lineTo(bx - xArm, by + xArm);
        g.strokePath();
      };
      g.lineStyle(3.8, 0x000000, 0.95);
      drawX();
      g.lineStyle(2.4, 0xff1e27, 1);
      drawX();
      g.fillStyle(0xffe600, 1);
      g.fillCircle(bx, by, 1.2);
    }

    // 5. Altar de Invocação do Chefe
    const bAltar = world.bossSummonAltar;
    if (bAltar && !bAltar.isCompleted) {
      const { bx, by } = this.toRadar(bAltar.x - p.x, bAltar.y - p.y);
      if (bAltar.isActive) {
        // Ativo: chamas pulsantes
        const pulse = Math.sin(this.scene.time.now * 0.008) * 1.5;
        g.fillStyle(0xff2200, 0.7);
        g.fillCircle(bx, by, 7.5 + pulse);
        g.fillStyle(0xff9900, 1);
        g.fillTriangle(bx, by - 6 - pulse, bx - 4, by, bx + 4, by);
        g.fillTriangle(bx, by + 6 + pulse, bx - 4, by, bx + 4, by);
        g.fillStyle(0xffe600, 1);
        g.fillCircle(bx, by, 2.2);
      } else {
        // Inativo: pedra escura com runa
        g.fillStyle(0x0e0206, 0.85);
        g.fillCircle(bx, by, 4.5);
        g.lineStyle(1.2, 0x665566, 0.8);
        g.strokeCircle(bx, by, 4.5);
        g.fillStyle(0xaa3344, 0.9);
        g.fillCircle(bx, by, 1.5);
      }
    }

    // 6. Ladrão de Almas: estrela dourada pulsando, sempre visível (presa na borda se longe)
    const thief = world.soulThief;
    if (thief) {
      const { bx, by } = this.toRadar(thief.x - p.x, thief.y - p.y);
      const pulse = 1 + Math.sin(this.scene.time.now * 0.012) * 0.25;
      const outer = 6.5 * pulse;
      const inner = 2.8 * pulse;
      const points: Phaser.Types.Math.Vector2Like[] = [];
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 4;
        const r = i % 2 === 0 ? outer : inner;
        points.push({ x: bx + Math.cos(a) * r, y: by + Math.sin(a) * r });
      }
      g.fillStyle(FX_COLORS.thiefBlipOutline, 0.9);
      g.fillCircle(bx, by, outer * 0.75);
      g.fillStyle(FX_COLORS.thiefArrowBorder, 1);
      g.fillPoints(points, true);
      g.fillStyle(FX_COLORS.thiefBlipCore, 1);
      g.fillCircle(bx, by, 1.6);
    }

    this.drawPlayerPointer(p);
  }

  private drawPlayerPointer(p: RadarPlayer): void {
    const g = this.blipsGraphics;
    const cx = this.centerX;
    const cy = this.centerY;
    const dirMap: Record<string, number> = {
      'east': 0,
      'south-east': Math.PI * 0.25,
      'south': Math.PI * 0.5,
      'south-west': Math.PI * 0.75,
      'west': Math.PI,
      'north-west': -Math.PI * 0.75,
      'north': -Math.PI * 0.5,
      'north-east': -Math.PI * 0.25
    };

    // Em movimento, a seta segue a velocidade; parada, segue a direção do sprite
    let dirAngle = (p.currentDirection !== undefined ? dirMap[p.currentDirection] : undefined) ?? Math.PI * 0.5;
    const v = p.body?.velocity;
    if (v && (v.x !== 0 || v.y !== 0)) {
      dirAngle = Math.atan2(v.y, v.x);
    }

    const arrowLen = 9;
    g.fillStyle(0x00f5d4, 1);
    g.fillTriangle(
      cx + Math.cos(dirAngle) * arrowLen, cy + Math.sin(dirAngle) * arrowLen,
      cx + Math.cos(dirAngle + 2.45) * 5, cy + Math.sin(dirAngle + 2.45) * 5,
      cx + Math.cos(dirAngle - 2.45) * 5, cy + Math.sin(dirAngle - 2.45) * 5
    );

    g.fillStyle(0x00f5d4, 1);
    g.fillCircle(cx, cy, 3.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 1.5);
  }

  /** Moldura barroca e retículo tático (desenhada uma vez). */
  private drawFrame(): void {
    const g = this.frameGraphics;
    g.clear();
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    g.fillStyle(0x0e0308, 0.92);
    g.fillCircle(cx, cy, r);

    // Anéis de alcance (35% e 70%)
    g.lineStyle(1, 0x4a0e17, 0.5);
    g.strokeCircle(cx, cy, r * 0.35);
    g.strokeCircle(cx, cy, r * 0.70);

    g.lineStyle(1, 0x3d0b13, 0.6);
    g.lineBetween(cx - r + 3, cy, cx + r - 3, cy);
    g.lineBetween(cx, cy - r + 3, cx, cy + r - 3);

    g.lineStyle(2, 0xc59b27, 1);
    g.strokeCircle(cx, cy, r);
    g.lineStyle(1, 0xf3d17a, 0.75);
    g.strokeCircle(cx, cy, r - 2);

    // Marcadores cardinais
    g.lineStyle(2, 0xf3d17a, 1);
    g.lineBetween(cx, cy - r, cx, cy - r + 5);
    g.lineBetween(cx, cy + r, cx, cy + r - 5);
    g.lineBetween(cx + r, cy, cx + r - 5, cy);
    g.lineBetween(cx - r, cy, cx - r + 5, cy);

    // Tachas nas diagonais
    const cos45 = 0.7071;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      g.fillStyle(0xc59b27, 0.85);
      g.fillCircle(cx + sx * r * cos45, cy + sy * r * cos45, 1.5);
    }
  }
}

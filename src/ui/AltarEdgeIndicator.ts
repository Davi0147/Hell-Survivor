import Phaser from 'phaser';
import { RadarPlayer, RadarWorld } from './radarTypes';
import { FX_COLORS } from '../config/theme';

/** Tipo de alvo: muda as cores da seta. */
type EdgeKind = 'boss' | 'altar' | 'thief';

interface EdgeTarget {
  x: number;
  y: number;
}

/**
 * Seta na borda da tela apontando para o objetivo fora da câmera, com a distância em metros.
 * Prioridade: cristal de Azazel mais próximo > Ladrão de Almas > Altar de Invocação ativo > Altar de Ascensão.
 * Some quando o alvo entra na tela.
 */
export class AltarEdgeIndicator {
  private readonly container: Phaser.GameObjects.Container;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene, pixelFont: string) {
    this.container = scene.add.container(0, 0);
    this.container.setDepth(150);
    this.container.setVisible(false);

    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    this.text = scene.add.text(0, 0, '', {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffe600',
      stroke: '#000000',
      strokeThickness: 2.5
    }).setOrigin(0.5);
    this.container.add(this.text);
  }

  public getHudElement(): Phaser.GameObjects.Container {
    return this.container;
  }

  private pickTarget(p: RadarPlayer, world: RadarWorld): { target: EdgeTarget; kind: EdgeKind; timeLeftMs?: number } | null {
    if (Array.isArray(world.azazelCrystals)) {
      let nearest: EdgeTarget | null = null;
      let minDist = Infinity;
      for (const c of world.azazelCrystals) {
        if (c && c.active && !c.isCompleted && !c.isDestroyed) {
          const d = Math.hypot(c.x - p.x, c.y - p.y);
          if (d < minDist) {
            minDist = d;
            nearest = c;
          }
        }
      }
      if (nearest) return { target: nearest, kind: 'boss' };
    }

    // O ladrão tem tempo contado: passa na frente dos altares, que esperam
    const thief = world.soulThief;
    if (thief) return { target: thief, kind: 'thief', timeLeftMs: thief.timeLeftMs };

    const bAltar = world.bossSummonAltar;
    if (bAltar && bAltar.isActive && !bAltar.isBossSpawned) return { target: bAltar, kind: 'boss' };

    const altar = world.altarInstance;
    if (altar && altar.active && !altar.isDestroyed) return { target: altar, kind: 'altar' };

    return null;
  }

  public update(p: RadarPlayer, world: RadarWorld): void {
    const picked = this.pickTarget(p, world);
    const cam = world.cameras?.main;
    if (!picked || !cam) {
      this.container.setVisible(false);
      return;
    }
    const { target, kind, timeLeftMs } = picked;
    const isBossAltar = kind === 'boss';
    const isThief = kind === 'thief';

    // Alvo visível na câmera (com folga de 30px): esconde a seta
    const margin = 30;
    if (
      target.x >= cam.worldView.x + margin &&
      target.x <= cam.worldView.right - margin &&
      target.y >= cam.worldView.y + margin &&
      target.y <= cam.worldView.bottom - margin
    ) {
      this.container.setVisible(false);
      return;
    }
    this.container.setVisible(true);

    const { width, height } = this.scene.scale;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Projeta a direção até a borda segura da tela
    const halfW = width / 2 - 52;
    const halfH = height / 2 - 56;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scaleFactor = Math.min(Math.abs(halfW / (cos || 0.0001)), Math.abs(halfH / (sin || 0.0001)));
    this.container.setPosition(Math.round(width / 2 + cos * scaleFactor), Math.round(height / 2 + sin * scaleFactor));

    const g = this.graphics;
    g.clear();

    // Plaquinha da distância no centro, seta para fora dela apontando o alvo
    const badgeW = isThief ? 76 : isBossAltar ? 48 : 44;
    const badgeH = 20;
    g.fillStyle(isThief ? FX_COLORS.thiefBadgeFill : isBossAltar ? 0x1a0509 : 0x0e0206, 0.94);
    g.fillRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 4);
    g.lineStyle(1.5, isThief ? FX_COLORS.thiefArrowBorder : isBossAltar ? 0xff7700 : 0xffe600, 0.95);
    g.strokeRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 4);

    // Onde a direção do alvo cruza a borda da plaquinha
    const edge = Math.min(Math.abs(badgeW / 2 / (cos || 0.0001)), Math.abs(badgeH / 2 / (sin || 0.0001))) + 3;
    const arrowLen = isThief ? 16 : 13;
    const baseX = cos * edge;
    const baseY = sin * edge;
    const tipX = cos * (edge + arrowLen);
    const tipY = sin * (edge + arrowLen);
    const wingX = -sin * 7.5;
    const wingY = cos * 7.5;
    const tracePath = (): void => {
      g.beginPath();
      g.moveTo(tipX, tipY);
      g.lineTo(baseX + wingX, baseY + wingY);
      g.lineTo(baseX - wingX, baseY - wingY);
      g.closePath();
    };
    g.fillStyle(isThief ? FX_COLORS.thiefArrowBorder : isBossAltar ? 0xff4500 : 0xff002b, 1);
    tracePath();
    g.fill();
    g.lineStyle(1.5, isThief ? FX_COLORS.thiefArrowFill : 0x000000, 1);
    tracePath();
    g.stroke();
    const meters = `${Math.max(1, Math.round(dist / 10))}m`;
    // Ladrão: distância e segundos que faltam para ele fugir
    this.text.setText(isThief && timeLeftMs !== undefined ? `${meters} | ${Math.ceil(timeLeftMs / 1000)}s` : meters);
    this.text.setColor(isThief ? FX_COLORS.thiefText : isBossAltar ? '#ffaa00' : '#ffe600');
    // Pulsa para chamar atenção enquanto ele pode escapar
    this.container.setScale(isThief ? 1.15 + Math.sin(this.scene.time.now * 0.012) * 0.08 : 1);
  }
}

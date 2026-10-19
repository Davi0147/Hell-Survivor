import Phaser from 'phaser';
import { ARENA_CONFIG } from '../config/balance';

/**
 * Interface estrita de contexto que expõe apenas o necessário da cena para o ArenaScenerySystem
 */
export interface ISceneryContext {
  readonly add: Phaser.GameObjects.GameObjectFactory;
  readonly tweens: Phaser.Tweens.TweenManager;
  readonly cameras: Phaser.Cameras.Scene2D.CameraManager;
  mapItemsGroup?: Phaser.GameObjects.Group;
  bossSummonAltar?: { setVisible(visible: boolean): void } | null;
}

/**
 * ArenaScenerySystem — Responsável por limites visuais da arena, névoa de borda,
 * agrupamentos decorativos de cenário e controle de visibilidade/limpeza dos props.
 */
export class ArenaScenerySystem {
  public sceneryProps: Phaser.GameObjects.GameObject[] = [];
  public borderMistEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  public borderGraphics?: Phaser.GameObjects.Graphics;
  public lastMistCheckTime: number = 0;

  private context: ISceneryContext;

  constructor(context: ISceneryContext) {
    this.context = context;
  }

  /**
   * Desenha os limites visuais da Arena com dissolução suave de fumaça (sem linhas duras)
   */
  public drawArenaBorders(): void {
    if (this.borderGraphics) {
      this.borderGraphics.destroy();
      this.borderGraphics = undefined;
    }

    const g = this.context.add.graphics();
    this.borderGraphics = g;
    g.setDepth(-40);

    const minX = ARENA_CONFIG.MIN_X;
    const minY = ARENA_CONFIG.MIN_Y;
    const maxX = ARENA_CONFIG.MAX_X;
    const maxY = ARENA_CONFIG.MAX_Y;
    const w = ARENA_CONFIG.WIDTH;
    const h = ARENA_CONFIG.HEIGHT;
    const voidPadding = 2400;

    // 1. O Vazio do Abismo que circunda a arena (preto profundo absoluto)
    g.fillStyle(0x050104, 1);
    g.fillRect(minX - voidPadding, minY - voidPadding, w + voidPadding * 2, voidPadding);
    g.fillRect(minX - voidPadding, maxY, w + voidPadding * 2, voidPadding);
    g.fillRect(minX - voidPadding, minY, voidPadding, h);
    g.fillRect(maxX, minY, voidPadding, h);

    // 2. Dissolução Suave do Chão no Abismo (Bruma / Névoa de Borda em 16 passos de gradiente)
    const fadeSteps = 16;
    const stepSize = 14; // 16 * 14 = 224px de transição suave sem nenhuma linha delimitadora
    for (let i = 0; i < fadeSteps; i++) {
      const alpha = Math.pow((i + 1) / fadeSteps, 1.85);
      g.fillStyle(0x050104, alpha);

      // Borda Superior
      g.fillRect(minX - 50, minY + (fadeSteps - 1 - i) * stepSize, w + 100, stepSize);
      // Borda Inferior
      g.fillRect(minX - 50, maxY - (fadeSteps - i) * stepSize, w + 100, stepSize);
      // Borda Esquerda
      g.fillRect(minX + (fadeSteps - 1 - i) * stepSize, minY - 50, stepSize, h + 100);
      // Borda Direita
      g.fillRect(maxX - (fadeSteps - i) * stepSize, minY - 50, stepSize, h + 100);
    }

    // 3. Emitter de Bruma e Fumaça Carmesim Ondulante nas Bordas (Custo de CPU Zero no interior)
    if (this.borderMistEmitter) {
      this.borderMistEmitter.destroy();
      this.borderMistEmitter = undefined;
    }

    this.borderMistEmitter = this.context.add.particles(0, 0, 'particle-smoke', {
      lifespan: { min: 2500, max: 4200 },
      speed: { min: 10, max: 28 },
      scale: { start: 1.1, end: 2.6 },
      alpha: { start: 0.35, end: 0 },
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false
    });
    this.borderMistEmitter.setDepth(-30);
  }

  /**
   * Emite baforadas de fumaça viva nas bordas visíveis apenas quando a câmera estiver próxima aos limites
   */
  public updateBorderMist(): void {
    if (!this.borderMistEmitter || !this.context.cameras.main) return;

    const cam = this.context.cameras.main;
    const view = cam.worldView;
    const margin = 350;

    // Borda Superior (minY)
    if (view.y <= ARENA_CONFIG.MIN_Y + margin) {
      const rx = Phaser.Math.Between(Math.max(ARENA_CONFIG.MIN_X, view.x - 100), Math.min(ARENA_CONFIG.MAX_X, view.right + 100));
      this.borderMistEmitter.emitParticleAt(rx, ARENA_CONFIG.MIN_Y + Phaser.Math.Between(0, 80));
    }
    // Borda Inferior (maxY)
    if (view.bottom >= ARENA_CONFIG.MAX_Y - margin) {
      const rx = Phaser.Math.Between(Math.max(ARENA_CONFIG.MIN_X, view.x - 100), Math.min(ARENA_CONFIG.MAX_X, view.right + 100));
      this.borderMistEmitter.emitParticleAt(rx, ARENA_CONFIG.MAX_Y - Phaser.Math.Between(0, 80));
    }
    // Borda Esquerda (minX)
    if (view.x <= ARENA_CONFIG.MIN_X + margin) {
      const ry = Phaser.Math.Between(Math.max(ARENA_CONFIG.MIN_Y, view.y - 100), Math.min(ARENA_CONFIG.MAX_Y, view.bottom + 100));
      this.borderMistEmitter.emitParticleAt(ARENA_CONFIG.MIN_X + Phaser.Math.Between(0, 80), ry);
    }
    // Borda Direita (maxX)
    if (view.right >= ARENA_CONFIG.MAX_X - margin) {
      const ry = Phaser.Math.Between(Math.max(ARENA_CONFIG.MIN_Y, view.y - 100), Math.min(ARENA_CONFIG.MAX_Y, view.bottom + 100));
      this.borderMistEmitter.emitParticleAt(ARENA_CONFIG.MAX_X - Phaser.Math.Between(0, 80), ry);
    }
  }

  public addSceneryRock(x: number, y: number, variation?: number): void {
    const rockKeys = ['scenery-rocha', 'scenery-rocha-2'];
    const key = variation !== undefined && rockKeys[variation] ? rockKeys[variation] : rockKeys[Phaser.Math.Between(0, rockKeys.length - 1)];
    const rock = this.context.add.image(x, y, key);
    rock.setOrigin(0.5, 0.7);
    rock.setDepth(-10); // Decorativo sem colisão: permite trânsito 100% desobstruído para Nixy e monstros
    const baseScale = 0.85 + Math.random() * 0.25;
    // Rocha 2 aumentada em 50% conforme solicitado (1.5x)
    const scale = key === 'scenery-rocha-2' ? baseScale * 1.5 : baseScale;
    rock.setScale(scale);
    this.sceneryProps.push(rock);
  }

  public addSceneryTorch(x: number, y: number): void {
    const torch = this.context.add.image(x, y, 'scenery-tocha');
    torch.setOrigin(0.5, 0.7);
    torch.setDepth(-10); // Decorativo sem colisão: evita prender Nixy ou monstros
    torch.setScale(0.5); // Diminuído pela metade conforme solicitado
    this.sceneryProps.push(torch);

    // Halo de Luz Quente e Suave (Âmbar / Dourado) com Pulsação de Chama Crepitando
    const halo = this.context.add.image(x, y - 9, 'torch-light');
    halo.setOrigin(0.5, 0.5);
    halo.setDepth(-11);
    halo.setBlendMode(Phaser.BlendModes.ADD);
    halo.setAlpha(0.72);
    halo.setScale(0.46);

    this.context.tweens.add({
      targets: halo,
      scaleX: { from: 0.44, to: 0.53 },
      scaleY: { from: 0.44, to: 0.53 },
      alpha: { from: 0.58, to: 0.82 },
      duration: 380 + Math.random() * 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.sceneryProps.push(halo);
  }

  public addSceneryCrystal(x: number, y: number): void {
    const crystal = this.context.add.image(x, y, 'scenery-cristal');
    crystal.setOrigin(0.5, 0.65);
    crystal.setDepth(-15);
    crystal.setScale((0.85 + Math.random() * 0.25) * 0.5); // Reduzido em 50%
    this.sceneryProps.push(crystal);
  }

  public addSceneryMushroom(x: number, y: number): void {
    const mush = this.context.add.image(x, y, 'scenery-cogumelos');
    mush.setOrigin(0.5, 0.65);
    mush.setDepth(-15);
    mush.setScale(0.85 + Math.random() * 0.25);
    this.sceneryProps.push(mush);
  }

  public addSceneryBones(x: number, y: number): void {
    const bones = this.context.add.image(x, y, 'scenery-ossos');
    bones.setOrigin(0.5, 0.65);
    bones.setDepth(-15);
    bones.setScale(0.80 + Math.random() * 0.35);
    this.sceneryProps.push(bones);
  }

  public addProp(prop: Phaser.GameObjects.GameObject): void {
    this.sceneryProps.push(prop);
  }

  /**
   * Instancia agrupamentos temáticos de cenário (rochas variadas, tochas com luz, cogumelos, cristais e ossos abundantes)
   * com espaçamento defensivo garantido para que nenhum sprite fique colado ou sobreposto.
   */
  public spawnSceneryProps(): void {
    const placedProps: { x: number; y: number; radius: number }[] = [];

    const placeSafely = (
      x: number,
      y: number,
      radius: number,
      addCallback: (px: number, py: number) => void
    ): boolean => {
      // Garante distância segura entre qualquer elemento para que não fiquem colados
      for (const p of placedProps) {
        const dist = Math.hypot(p.x - x, p.y - y);
        if (dist < p.radius + radius + 18) {
          return false;
        }
      }
      placedProps.push({ x, y, radius });
      addCallback(x, y);
      return true;
    };

    const placeInArea = (
      cx: number,
      cy: number,
      maxSpread: number,
      radius: number,
      addCallback: (px: number, py: number) => void
    ): boolean => {
      for (let attempt = 0; attempt < 35; attempt++) {
        const ang = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * maxSpread;
        const px = cx + Math.cos(ang) * r;
        const py = cy + Math.sin(ang) * r;
        if (placeSafely(px, py, radius, addCallback)) {
          return true;
        }
      }
      return false;
    };

    // 1. Santuário das Tochas ao redor do Altar de Invocação (1450, -1200)
    const altarX = 1450;
    const altarY = -1200;
    placeSafely(altarX - 140, altarY + 130, 20, (x, y) => this.addSceneryTorch(x, y));
    placeSafely(altarX + 140, altarY + 130, 20, (x, y) => this.addSceneryTorch(x, y));
    placeSafely(altarX - 180, altarY - 90, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(altarX + 180, altarY - 90, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(altarX - 110, altarY - 170, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(altarX + 110, altarY - 170, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(altarX - 220, altarY + 50, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(altarX + 220, altarY + 50, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(altarX - 150, altarY + 230, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(altarX + 150, altarY + 230, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(altarX - 280, altarY - 120, 40, (x, y) => this.addSceneryRock(x, y, 0));
    placeSafely(altarX + 280, altarY - 120, 60, (x, y) => this.addSceneryRock(x, y, 1));

    // 2. Trilhas de Tochas guiando para áreas estratégicas da arena com rochas e ossos dispersos
    const trailCoords = [
      { x: 950, y: -750 },
      { x: 1150, y: -950 },
      { x: 600, y: -400 },
      { x: -550, y: -500 },
      { x: 550, y: 500 },
      { x: -550, y: 500 },
      { x: -800, y: 0 },
      { x: 800, y: 0 }
    ];
    for (const t of trailCoords) {
      placeSafely(t.x, t.y, 20, (x, y) => this.addSceneryTorch(x, y));
      placeInArea(t.x, t.y, 140, 50, (x, y) => this.addSceneryRock(x, y));
      placeInArea(t.x, t.y, 160, 38, (x, y) => this.addSceneryBones(x, y));
    }

    // 3. Postos Avançados ao redor da clareira central (raio de 450px do centro totalmente limpo)
    placeSafely(-520, -450, 38, (x, y) => this.addSceneryMushroom(x, y));
    placeSafely(-440, -530, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(-620, -540, 60, (x, y) => this.addSceneryRock(x, y, 1));

    placeSafely(520, -450, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(440, -530, 38, (x, y) => this.addSceneryMushroom(x, y));
    placeSafely(620, -540, 40, (x, y) => this.addSceneryRock(x, y, 0));

    placeSafely(-520, 520, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(-610, 450, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(-640, 560, 40, (x, y) => this.addSceneryRock(x, y, 0));

    placeSafely(520, 520, 38, (x, y) => this.addSceneryMushroom(x, y));
    placeSafely(610, 480, 38, (x, y) => this.addSceneryCrystal(x, y));
    placeSafely(540, 620, 38, (x, y) => this.addSceneryBones(x, y));
    placeSafely(650, 580, 60, (x, y) => this.addSceneryRock(x, y, 1));

    // 4. Clusters Temáticos Grandes pelos 4 Quadrantes da Arena (com grande quantidade de ossos)
    const clusterCenters = [
      // Noroeste (Bosques Místicos, Cavernas de Cristal e Ossuários)
      { x: -1500, y: -1100, type: 'nature' },
      { x: -2200, y: -2000, type: 'crystals' },
      { x: -1100, y: -2300, type: 'graveyard' },
      { x: -2500, y: -900,  type: 'rocks' },

      // Sudoeste (Cemitérios das Almas e Cumes Sombrios)
      { x: -1400, y: 1400,  type: 'graveyard' },
      { x: -2400, y: 400,   type: 'graveyard' },
      { x: -2300, y: 1200,  type: 'rocks' },
      { x: -1700, y: 2200,  type: 'nature' },
      { x: -900,  y: 1900,  type: 'crystals' },

      // Sudeste (Jardins Demoníacos e Ossuários dos Condenados)
      { x: 1500,  y: 1500,  type: 'nature' },
      { x: 2300,  y: 1700,  type: 'graveyard' },
      { x: 1100,  y: 2200,  type: 'crystals' },
      { x: 2400,  y: 900,   type: 'rocks' },

      // Nordeste (Vale das Sombras, Fossa dos Martirizados e Picos Rúnicos)
      { x: 2200,  y: -1700, type: 'graveyard' },
      { x: 2100,  y: -2100, type: 'graveyard' },
      { x: 2100,  y: -700,  type: 'crystals' },
      { x: 900,   y: -2200, type: 'nature' },
      { x: 2500,  y: -2400, type: 'rocks' }
    ];

    for (const c of clusterCenters) {
      if (c.type === 'nature') {
        placeSafely(c.x, c.y, 20, (x, y) => this.addSceneryTorch(x, y));
        placeInArea(c.x, c.y, 160, 50, (x, y) => this.addSceneryRock(x, y));
        for (let i = 0; i < 5; i++) {
          placeInArea(c.x, c.y, 180, 38, (x, y) => this.addSceneryMushroom(x, y));
        }
        for (let i = 0; i < 3; i++) {
          placeInArea(c.x, c.y, 180, 38, (x, y) => this.addSceneryCrystal(x, y));
        }
        for (let i = 0; i < 4; i++) {
          placeInArea(c.x, c.y, 200, 38, (x, y) => this.addSceneryBones(x, y));
        }
      } else if (c.type === 'crystals') {
        placeInArea(c.x, c.y, 160, 40, (x, y) => this.addSceneryRock(x, y, 0));
        placeInArea(c.x, c.y, 180, 60, (x, y) => this.addSceneryRock(x, y, 1));
        for (let i = 0; i < 6; i++) {
          placeInArea(c.x, c.y, 200, 38, (x, y) => this.addSceneryCrystal(x, y));
        }
        for (let i = 0; i < 2; i++) {
          placeInArea(c.x, c.y, 180, 38, (x, y) => this.addSceneryMushroom(x, y));
        }
        for (let i = 0; i < 3; i++) {
          placeInArea(c.x, c.y, 200, 38, (x, y) => this.addSceneryBones(x, y));
        }
      } else if (c.type === 'graveyard') {
        placeSafely(c.x, c.y, 20, (x, y) => this.addSceneryTorch(x, y));
        placeInArea(c.x, c.y, 180, 40, (x, y) => this.addSceneryRock(x, y, 0));
        placeInArea(c.x, c.y, 200, 60, (x, y) => this.addSceneryRock(x, y, 1));
        for (let i = 0; i < 14; i++) {
          placeInArea(c.x, c.y, 220, 38, (x, y) => this.addSceneryBones(x, y));
        }
      } else if (c.type === 'rocks') {
        placeSafely(c.x, c.y, 20, (x, y) => this.addSceneryTorch(x, y));
        placeInArea(c.x, c.y, 160, 40, (x, y) => this.addSceneryRock(x, y, 0));
        placeInArea(c.x, c.y, 180, 60, (x, y) => this.addSceneryRock(x, y, 1));
        placeInArea(c.x, c.y, 200, 50, (x, y) => this.addSceneryRock(x, y));
        for (let i = 0; i < 6; i++) {
          placeInArea(c.x, c.y, 200, 38, (x, y) => this.addSceneryBones(x, y));
        }
      }
    }
  }

  /**
   * Remove e destrói todos os props de cenário e itens de mapa da cena
   */
  public clearAllSceneryProps(): void {
    this.clearSceneryPropsOnly();

    if (this.context.mapItemsGroup && this.context.mapItemsGroup.children) {
      const mapItems = this.context.mapItemsGroup.getChildren();
      for (let i = mapItems.length - 1; i >= 0; i--) {
        const item = mapItems[i];
        if (item && typeof item.destroy === 'function') {
          item.destroy();
        }
      }
    }
  }

  /**
   * Remove e destrói apenas os props de cenário
   */
  public clearSceneryPropsOnly(): void {
    for (const prop of this.sceneryProps) {
      if (prop && typeof prop.destroy === 'function') {
        prop.destroy();
      }
    }
    this.sceneryProps = [];
  }

  /**
   * Altera a visibilidade de todos os elementos de cenário e altar do jogo real
   */
  public setSceneryPropsVisible(visible: boolean): void {
    for (const prop of this.sceneryProps) {
      if (prop && 'setVisible' in prop && typeof (prop as unknown as { setVisible: (v: boolean) => void }).setVisible === 'function') {
        (prop as unknown as { setVisible: (v: boolean) => void }).setVisible(visible);
      }
    }
    if (this.context.bossSummonAltar) {
      this.context.bossSummonAltar.setVisible(visible);
    }
    if (this.context.mapItemsGroup && this.context.mapItemsGroup.children) {
      const mapItems = this.context.mapItemsGroup.getChildren();
      for (const item of mapItems) {
        if (item && 'setVisible' in item && typeof (item as unknown as { setVisible: (v: boolean) => void }).setVisible === 'function') {
          (item as unknown as { setVisible: (v: boolean) => void }).setVisible(visible);
        }
      }
    }
  }

  /**
   * Libera recursos, destruindo emissores, gráficos e limpando props
   */
  public destroy(): void {
    if (this.borderMistEmitter) {
      this.borderMistEmitter.destroy();
      this.borderMistEmitter = undefined;
    }
    if (this.borderGraphics) {
      this.borderGraphics.destroy();
      this.borderGraphics = undefined;
    }
    this.clearSceneryPropsOnly();
    this.lastMistCheckTime = 0;
  }
}

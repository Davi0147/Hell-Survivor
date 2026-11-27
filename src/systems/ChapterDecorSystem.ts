import Phaser from 'phaser';
import type { MapEntityProp } from '../config/mapData';
import { ARENA_CONFIG } from '../config/balance';
import {
  CHAPTER_DECOR_KITS,
  DECOR_SCATTER,
  DECOR_TEXTURE_SCALE,
  DecorPiece,
  type ChapterDecorKit,
} from '../config/sceneryCatalog';
import { SCENERY_LIGHT_TINT } from '../config/theme';

/** Contrato mínimo que a cena expõe para o ChapterDecorSystem. */
export interface IChapterDecorContext {
  readonly add: Phaser.GameObjects.GameObjectFactory;
  readonly tweens: Phaser.Tweens.TweenManager;
  readonly cameras: Phaser.Cameras.Scene2D.CameraManager;
  readonly textures: Phaser.Textures.TextureManager;
  readonly physics: Phaser.Physics.Arcade.ArcadePhysics;
  readonly currentChapter: number;
}

/** Quem guarda os objetos criados (o ArenaScenerySystem limpa e esconde tudo junto). */
export interface IDecorOwner {
  addProp(prop: Phaser.GameObjects.GameObject): void;
}

/** Monstro como a física enxerga (posição e corpo). */
type DetourEnemy = Phaser.GameObjects.GameObject & { x: number; y: number; body: Phaser.Physics.Arcade.Body };

/** Quanto tempo o monstro anda de lado depois de encostar num obstáculo. */
/** Vão mínimo entre duas pegadas sólidas vizinhas (um Cão Alfa passa com folga). */
const PASSAGE_GAP = 60;
const DETOUR_MS = 520;
/** Encostado em obstáculos por mais que isto, sem desgrudar, conta como preso. */
const STUCK_MS = 1000;
/** Pausa máxima entre dois contatos para ainda contar como o mesmo aperto. */
const CONTACT_GAP_MS = 250;
/** Quanto tempo o monstro preso atravessa o cenário para se soltar. */
const PHASE_MS = 900;

interface TallPiece {
  image: Phaser.GameObjects.Image;
  baseY: number;
  halfW: number;
  height: number;
}

/** Profundidades: chão < decalques < entulho < monstros (5–15) < heroína (20) < objetos altos à frente. */
const DEPTH = {
  decal: -95,
  clutter: -14,
  low: -10,
  light: -11,
  tallBehindPlayer: 4,
  tallInFront: 24,
} as const;

/** Mesma conta para sempre dar a mesma peça no mesmo ponto do mapa. */
function stablePick<T>(options: T[], x: number, y: number): T {
  const h = Math.abs(Math.floor(x * 73856093) ^ Math.floor(y * 19349663));
  return options[h % options.length];
}

/**
 * ChapterDecorSystem — monta o cenário com o kit de arte do capítulo: troca as peças
 * antigas dos mapas pelas novas, espalha composições (peça grande + entorno), manchas
 * e entulho pela arena, acende as fontes de luz e faz a heroína passar atrás dos
 * objetos altos. Capítulos sem kit continuam com o cenário antigo.
 */
export class ChapterDecorSystem {
  private readonly pieces = new Map<string, DecorPiece>();
  private tall: TallPiece[] = [];
  private cullable: Phaser.GameObjects.Image[] = [];
  private cullTimer = 0;
  private readonly detours = new Map<DetourEnemy, { ms: number; dx: number; dy: number }>();
  /** Desde quando cada monstro está encostando em obstáculos sem conseguir sair. */
  private readonly contacts = new Map<DetourEnemy, { start: number; last: number }>();
  /** Monstros que atravessam o cenário até o instante marcado (saída de emergência). */
  private readonly phasing = new Map<DetourEnemy, number>();
  private clock = 0;
  /** Cenário escondido (domínio escuro do Azazel): nada aparece nem bloqueia. */
  private hidden = false;
  /** Pegadas sólidas dos objetos grandes (a cena liga a colisão com a heroína e os monstros). */
  public readonly blockers: Phaser.Physics.Arcade.StaticGroup;

  /** Capítulo do mapa carregado (a Dimensão Corrompida, 202, não tem kit e usa o cenário antigo). */
  private kitChapter = 1;

  constructor(private readonly ctx: IChapterDecorContext, private readonly owner: IDecorOwner) {
    for (const kit of Object.values(CHAPTER_DECOR_KITS)) {
      for (const p of kit.pieces) this.pieces.set(p.key, p);
    }
    this.blockers = ctx.physics.add.staticGroup();
  }

  /** Escolhe o kit pelo capítulo do mapa que vai ser montado. */
  public useChapter(chapter: number): void {
    this.kitChapter = chapter;
  }

  private get kit(): ChapterDecorKit | undefined {
    return CHAPTER_DECOR_KITS[this.kitChapter];
  }

  /** O kit vale para este mapa e a arte carregou? */
  public get isActive(): boolean {
    const kit = this.kit;
    return !!kit && this.ctx.textures.exists(kit.pieces[0].key);
  }

  public isDecorKey(key: string): boolean {
    return this.pieces.has(key);
  }

  /** Coloca os props de um mapa trocando os tipos antigos pelos novos. */
  public placeMapProps(props: MapEntityProp[], placeOther: (p: MapEntityProp) => void): void {
    for (const p of props) {
      const swap = this.kit?.legacySwap[p.type];
      if (swap) {
        this.addPiece(stablePick(swap, p.x, p.y), p.x, p.y);
      } else if (this.pieces.has(p.type)) {
        this.addPiece(p.type, p.x, p.y);
      } else {
        placeOther(p);
      }
    }
  }

  /**
   * Espalha composições, manchas e entulho pela arena (sempre o mesmo arranjo,
   * longe do ponto de partida e dos pontos informados em `keepClear`).
   */
  public scatter(keepClear: { x: number; y: number }[]): void {
    const kit = this.kit;
    if (!kit) return;
    const rng = new Phaser.Math.RandomDataGenerator([kit.seed]);
    const margin = 260;
    const randomPoint = (): { x: number; y: number } => ({
      x: rng.between(ARENA_CONFIG.MIN_X + margin, ARENA_CONFIG.MAX_X - margin),
      y: rng.between(ARENA_CONFIG.MIN_Y + margin, ARENA_CONFIG.MAX_Y - margin),
    });
    const isClear = (x: number, y: number, extra: number = 0): boolean =>
      keepClear.every((k) => Math.hypot(k.x - x, k.y - y) > DECOR_SCATTER.keepClearRadius + extra);

    const landmarkSpots: { x: number; y: number }[] = [];
    let attempts = 0;
    while (landmarkSpots.length < DECOR_SCATTER.landmarks && attempts < 600) {
      attempts++;
      const pt = randomPoint();
      if (!isClear(pt.x, pt.y, 80)) continue;
      if (landmarkSpots.some((s) => Math.hypot(s.x - pt.x, s.y - pt.y) < 520)) continue;
      landmarkSpots.push(pt);
    }

    for (const spot of landmarkSpots) {
      const recipe = rng.pick(kit.landmarks);
      for (const floorKey of recipe.floor) {
        this.addPiece(floorKey, spot.x + rng.between(-30, 30), spot.y + rng.between(-10, 30));
      }
      const centerKey = rng.pick(recipe.center);
      this.addPiece(centerKey, spot.x, spot.y);
      const around = rng.between(2, 3);
      // Peças sólidas em volta ficam longe o bastante para sempre sobrar um vão de passagem
      const centerHalf = this.blockHalfWidth(centerKey);
      for (let i = 0; i < around; i++) {
        const key = rng.pick(recipe.around);
        const solid = this.blockHalfWidth(key);
        const a = rng.realInRange(0, Math.PI * 2);
        const minR = solid > 0 ? centerHalf + solid + PASSAGE_GAP : 70;
        const r = rng.between(Math.max(70, minR), Math.max(120, minR + 40));
        this.addPiece(key, spot.x + Math.cos(a) * r, spot.y + Math.sin(a) * r * (solid > 0 ? 1 : 0.7));
      }
    }

    const decals = kit.pieces.filter((p) => p.layer === 'decal').map((p) => p.key);
    const clutter = kit.pieces.filter((p) => p.layer === 'clutter').map((p) => p.key);
    for (let i = 0; i < DECOR_SCATTER.decals; i++) {
      const pt = randomPoint();
      if (isClear(pt.x, pt.y)) this.addPiece(rng.pick(decals), pt.x, pt.y);
    }
    for (let i = 0; i < DECOR_SCATTER.clutter; i++) {
      const pt = randomPoint();
      if (isClear(pt.x, pt.y)) this.addPiece(rng.pick(clutter), pt.x, pt.y);
    }
  }

  /** Meia largura da pegada sólida de uma peça (0 se não bloqueia). */
  private blockHalfWidth(key: string): number {
    const boxes = this.pieces.get(key)?.block;
    if (!boxes) return 0;
    return Math.max(...boxes.map((b) => Math.abs(b.dx ?? 0) + b.w / 2));
  }

  /** Cria uma peça do kit na posição (a base do objeto fica no ponto). */
  public addPiece(key: string, x: number, y: number): Phaser.GameObjects.Image | undefined {
    const piece = this.pieces.get(key);
    if (!piece || !this.ctx.textures.exists(key)) return undefined;

    const img = this.ctx.add.image(x, y, key);
    img.setScale(DECOR_TEXTURE_SCALE);
    if (piece.alpha !== undefined) img.setAlpha(piece.alpha);
    // Variação leve: espelha metade das peças para o mapa não parecer carimbado
    if (piece.layer !== 'tall' && stablePick([false, true], x, y)) img.setFlipX(true);

    if (piece.layer === 'decal') {
      img.setOrigin(0.5, 0.5);
      img.setDepth(DEPTH.decal);
    } else {
      img.setOrigin(0.5, 0.94);
      img.setDepth(piece.layer === 'clutter' ? DEPTH.clutter : piece.layer === 'low' ? DEPTH.low : DEPTH.tallBehindPlayer);
    }
    this.owner.addProp(img);
    this.cullable.push(img);

    if (piece.layer === 'tall') {
      this.tall.push({ image: img, baseY: y, halfW: img.displayWidth / 2, height: img.displayHeight });
    }
    if (piece.light) this.addLight(x, y - piece.light.offsetY, piece.light.scale, piece.light.tint);
    if (piece.block) this.addBlockers(piece.block, x, y);
    return img;
  }

  /**
   * Monstro que encosta num obstáculo entra em "desvio": por um instante anda de lado
   * (rumo à ponta mais próxima) até passar do canto, e só então volta a perseguir.
   * Sem isso ele empurra parado, porque a física só zera o eixo bloqueado.
   */
  public slideAround(enemyObj: Phaser.GameObjects.GameObject, blockerObj: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObj as DetourEnemy;
    const zone = blockerObj as Phaser.GameObjects.Zone;
    const touching = enemy.body?.touching;
    if (!touching) return;

    // Encostado por tempo demais (preso num cantinho entre dois objetos): atravessa por um instante
    let rec = this.contacts.get(enemy);
    if (!rec || this.clock - rec.last > CONTACT_GAP_MS) rec = { start: this.clock, last: this.clock };
    rec.last = this.clock;
    this.contacts.set(enemy, rec);
    if (this.clock - rec.start > STUCK_MS) {
      this.contacts.delete(enemy);
      this.detours.delete(enemy);
      this.phasing.set(enemy, this.clock + PHASE_MS);
      return;
    }

    if (this.detours.has(enemy)) return;
    if (touching.up || touching.down) {
      this.detours.set(enemy, { ms: DETOUR_MS, dx: enemy.x < zone.x ? -1 : 1, dy: 0 });
    } else if (touching.left || touching.right) {
      this.detours.set(enemy, { ms: DETOUR_MS, dx: 0, dy: enemy.y < zone.y ? -1 : 1 });
    }
  }

  /** A colisão com o cenário vale para este monstro agora? */
  public collidesWith(enemyObj: Phaser.GameObjects.GameObject): boolean {
    const until = this.phasing.get(enemyObj as DetourEnemy);
    if (until === undefined) return true;
    if (until > this.clock) return false;
    this.phasing.delete(enemyObj as DetourEnemy);
    return true;
  }

  /** Chamado depois da IA dos monstros: quem está em desvio anda de lado. */
  public applyDetours(delta: number): void {
    this.clock += delta;
    for (const [enemy, d] of this.detours) {
      d.ms -= delta;
      if (d.ms <= 0 || !enemy.active || !enemy.body) {
        this.detours.delete(enemy);
        continue;
      }
      const v = enemy.body.velocity;
      const speed = Math.max(40, Math.hypot(v.x, v.y));
      if (d.dx !== 0) enemy.body.setVelocity(d.dx * speed, v.y * 0.25);
      else enemy.body.setVelocity(v.x * 0.25, d.dy * speed);
    }
  }
  /** Caixas sólidas invisíveis na base do objeto (a parte alta continua atravessável por trás). */
  private addBlockers(boxes: { w: number; h: number; dx?: number }[], x: number, y: number): void {
    for (const b of boxes) {
      const zone = this.ctx.add.zone(x + (b.dx ?? 0), y - b.h / 2 + 2, b.w, b.h);
      this.ctx.physics.add.existing(zone, true);
      this.blockers.add(zone);
      this.owner.addProp(zone);
    }
  }

  private addLight(x: number, y: number, scale: number, tint?: keyof typeof SCENERY_LIGHT_TINT): void {
    if (!this.ctx.textures.exists('torch-light')) return;
    const halo = this.ctx.add.image(x, y, 'torch-light');
    halo.setDepth(DEPTH.light).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setScale(scale);
    if (tint) halo.setTint(SCENERY_LIGHT_TINT[tint]);
    this.ctx.tweens.add({
      targets: halo,
      scaleX: { from: scale * 0.92, to: scale * 1.1 },
      scaleY: { from: scale * 0.92, to: scale * 1.1 },
      alpha: { from: 0.55, to: 0.8 },
      duration: 360 + Math.random() * 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.owner.addProp(halo);
    this.cullable.push(halo);
  }

  /**
   * Por quadro: objetos altos ficam na frente da heroína quando ela está atrás da base
   * (e ficam meio transparentes se a cobrem); fora da tela, nada é desenhado.
   */
  public update(delta: number, playerX: number, playerY: number): void {
    if (this.hidden) return;
    if (this.tall.length === 0 && this.cullable.length === 0) return;

    for (let i = this.tall.length - 1; i >= 0; i--) {
      const t = this.tall[i];
      if (!t.image.scene) {
        this.tall.splice(i, 1);
        continue;
      }
      const isBehind = playerY < t.baseY - 4;
      t.image.setDepth(isBehind ? DEPTH.tallInFront : DEPTH.tallBehindPlayer);
      const covers = isBehind && Math.abs(playerX - t.image.x) < t.halfW && playerY > t.baseY - t.height;
      t.image.setAlpha(covers ? 0.55 : 1);
    }

    this.cullTimer -= delta;
    if (this.cullTimer > 0) return;
    this.cullTimer = 150;
    const view = this.ctx.cameras.main.worldView;
    const m = 160;
    this.cullable = this.cullable.filter((img) => img.scene);
    for (const img of this.cullable) {
      img.setVisible(img.x > view.x - m && img.x < view.right + m && img.y > view.y - m && img.y < view.bottom + m * 1.6);
    }
  }

  /**
   * Some com o cenário inteiro (desenho, luzes e colisão) ou traz de volta. No domínio escuro
   * do Azazel a tela é toda preta: os objetos altos, que passam para a frente da heroína
   * (profundidade 24, acima do véu preto 14), apareciam no meio do escuro, e as pegadas
   * sólidas viravam paredes invisíveis.
   */
  public setHidden(hidden: boolean): void {
    if (this.hidden === hidden) return;
    this.hidden = hidden;
    this.cullable = this.cullable.filter((img) => img.scene);
    for (const img of this.cullable) img.setVisible(!hidden);
    for (const zone of this.blockers.getChildren()) {
      const body = (zone as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) body.enable = !hidden;
    }
    // Ao voltar, a próxima passada do update recalcula o que está fora da tela
    this.cullTimer = 0;
  }

  public get isHidden(): boolean {
    return this.hidden;
  }

  /** Esquece as referências (os objetos em si são destruídos pelo ArenaScenerySystem). */
  public reset(): void {
    this.hidden = false;
    this.detours.clear();
    this.contacts.clear();
    this.phasing.clear();
    this.tall = [];
    this.cullable = [];
  }
}

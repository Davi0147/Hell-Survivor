import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';
import { ARENA_CONFIG } from '../config/balance';

export interface ShowroomItemConfig {
  name: string;
  texture: string;
  scale?: number;
  tint?: number;
  anim?: string;
  isTorch?: boolean;
  frame?: number;
}

export interface ShowroomCategory {
  title: string;
  accentColor: string;
  y: number;
  items: ShowroomItemConfig[];
}

export class TestShowroomSystem {
  private scene: GameScene;
  private isBuilt: boolean = false;

  // Coordenadas centrais da Galeria Showroom (isolada 20.000 pixels ao norte fora da arena de combate)
  public static readonly SHOWROOM_CENTER_X = 0;
  public static readonly SHOWROOM_CENTER_Y = -20000;
  public static readonly SHOWROOM_WIDTH = 1450;
  public static readonly SHOWROOM_HEIGHT = 1000;

  // Posição de Teleporte do Spawn (ao lado de 0, 0)
  public static readonly SPAWN_PAD_X = 180;
  public static readonly SPAWN_PAD_Y = 0;

  // Posição do Portal de Retorno dentro da sala
  public static readonly RETURN_PAD_X = 0;
  public static readonly RETURN_PAD_Y = -19530;

  // Posição de destino ao entrar na sala
  public static readonly SHOWROOM_ENTRY_X = 0;
  public static readonly SHOWROOM_ENTRY_Y = -19600;

  // Posição de destino ao retornar ao spawn central
  public static readonly SPAWN_DEST_X = 60;
  public static readonly SPAWN_DEST_Y = 0;

  private spawnPadGraphics?: Phaser.GameObjects.Graphics;
  private spawnPadText?: Phaser.GameObjects.Text;
  private spawnPadSubtext?: Phaser.GameObjects.Text;

  private returnPadGraphics?: Phaser.GameObjects.Graphics;
  private returnPadText?: Phaser.GameObjects.Text;
  private returnPadSubtext?: Phaser.GameObjects.Text;

  private floorGraphics?: Phaser.GameObjects.Graphics;
  private showroomElements: Phaser.GameObjects.GameObject[] = [];

  private teleportCooldown: number = 0;
  private pulseTimer: number = 0;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  /**
   * Constrói o Teleportador de Entrada e a Galeria Completa no Modo de Teste
   */
  public init(): void {
    if (this.isBuilt) return;
    this.isBuilt = true;

    this.createSpawnTeleporterPad();
    this.createShowroomRoom();
    DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Área de Teste (Showroom de Sprites) inicializada com sucesso.');
  }

  /**
   * Cria o quadrado interativo "ÁREA DE TESTE" ao lado do spawn inicial (180, 0)
   */
  private createSpawnTeleporterPad(): void {
    const px = TestShowroomSystem.SPAWN_PAD_X;
    const py = TestShowroomSystem.SPAWN_PAD_Y;

    this.spawnPadGraphics = this.scene.add.graphics();
    this.spawnPadGraphics.setDepth(10);

    const pixelFont = 'Pixelzone, Silkscreen, monospace';

    this.spawnPadText = this.scene.add.text(px, py - 46, 'ÁREA DE TESTE', {
      fontFamily: pixelFont,
      fontSize: '13px',
      color: '#facc15',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.spawnPadSubtext = this.scene.add.text(px, py + 48, '[ Pise para Teleportar ]', {
      fontFamily: pixelFont,
      fontSize: '9px',
      color: '#38bdf8',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);

    // Efeito de pulsação suave no texto
    this.scene.tweens.add({
      targets: [this.spawnPadText, this.spawnPadSubtext],
      alpha: { from: 0.85, to: 1 },
      scaleX: { from: 0.98, to: 1.04 },
      scaleY: { from: 0.98, to: 1.04 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Constrói a Sala Showroom isolada (piso decorativo, portal de retorno e todos os sprites organizados)
   */
  private createShowroomRoom(): void {
    const cx = TestShowroomSystem.SHOWROOM_CENTER_X;
    const cy = TestShowroomSystem.SHOWROOM_CENTER_Y;
    const w = TestShowroomSystem.SHOWROOM_WIDTH;
    const h = TestShowroomSystem.SHOWROOM_HEIGHT;

    // 1. Piso Estilizado em Pedra Negra / Rúnica com Bordas Iluminadas
    this.floorGraphics = this.scene.add.graphics();
    this.floorGraphics.setDepth(-12);

    // Base do chão
    this.floorGraphics.fillStyle(0x0c0915, 0.95);
    this.floorGraphics.fillRect(cx - w / 2, cy - h / 2, w, h);

    // Grade sutil interna
    this.floorGraphics.lineStyle(1, 0x1f1730, 0.6);
    for (let x = cx - w / 2 + 50; x < cx + w / 2; x += 60) {
      this.floorGraphics.lineBetween(x, cy - h / 2, x, cy + h / 2);
    }
    for (let y = cy - h / 2 + 50; y < cy + h / 2; y += 60) {
      this.floorGraphics.lineBetween(cx - w / 2, y, cx + w / 2, y);
    }

    // Moldura externa néon mística
    this.floorGraphics.lineStyle(4, 0x8b5cf6, 0.85);
    this.floorGraphics.strokeRect(cx - w / 2, cy - h / 2, w, h);

    // Borda interna dupla
    this.floorGraphics.lineStyle(1, 0xc084fc, 0.5);
    this.floorGraphics.strokeRect(cx - w / 2 + 10, cy - h / 2 + 10, w - 20, h - 20);

    // 2. Portal de Retorno ao Spawn
    const rx = TestShowroomSystem.RETURN_PAD_X;
    const ry = TestShowroomSystem.RETURN_PAD_Y;

    this.returnPadGraphics = this.scene.add.graphics();
    this.returnPadGraphics.setDepth(10);

    const pixelFont = 'Pixelzone, Silkscreen, monospace';

    this.returnPadText = this.scene.add.text(rx, ry - 42, 'PORTAL DE RETORNO', {
      fontFamily: pixelFont,
      fontSize: '12px',
      color: '#f87171',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.returnPadSubtext = this.scene.add.text(rx, ry + 44, '[ Voltar ao Spawn Central ]', {
      fontFamily: pixelFont,
      fontSize: '9px',
      color: '#cbd5e1',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: [this.returnPadText, this.returnPadSubtext],
      alpha: { from: 0.85, to: 1 },
      scaleX: { from: 0.98, to: 1.04 },
      scaleY: { from: 0.98, to: 1.04 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Título Central da Galeria
    const titleText = this.scene.add.text(cx, cy - h / 2 + 35, '🏛️ SALA DE TESTE - GALERIA GERAL DE SPRITES & ELEMENTOS', {
      fontFamily: pixelFont,
      fontSize: '15px',
      color: '#e2e8f0',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(25);
    this.showroomElements.push(titleText);

    const subtitleText = this.scene.add.text(cx, cy - h / 2 + 58, 'Todos os sprites e itens do jogo exibidos em escala real in-game para inspeção visual imediata.', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#94a3b8',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.showroomElements.push(subtitleText);

    // 4. Catálogo Completo de Sprites Organizado por Categorias
    this.buildCatalog(cx, cy, w);
  }

  /**
   * Monta o catálogo completo de sprites dispostos ordenadamente em linhas temáticas
   */
  private buildCatalog(cx: number, cy: number, totalWidth: number): void {
    const pixelFont = 'Pixelzone, Silkscreen, monospace';

    const categories: ShowroomCategory[] = [
      // CATEGORIA 1: CENÁRIO & PROPS
      {
        title: '1. CENÁRIO & AMBIENTAÇÃO (PROPS DO MUNDO)',
        accentColor: '#38bdf8',
        y: cy - 380,
        items: [
          { name: 'Tocha (0.5x)', texture: 'scenery-tocha', scale: 0.5, isTorch: true },
          { name: 'Rocha 1', texture: 'scenery-rocha', scale: 1.0 },
          { name: 'Rocha 2 (1.5x)', texture: 'scenery-rocha-2', scale: 1.5 },
          { name: 'Pilha Ossos', texture: 'scenery-ossos', scale: 1.0 },
          { name: 'Cogumelos', texture: 'scenery-cogumelos', scale: 1.0 },
          { name: 'Cristais (0.5x)', texture: 'scenery-cristal', scale: 0.5 },
          { name: 'Cristal Azazel', texture: 'azazel-crystal', scale: 0.5 },
          { name: 'Altar 1', texture: 'altar-1', scale: 0.55 },
          { name: 'Altar 2', texture: 'altar-2', scale: 0.55 },
          { name: 'Altar 3', texture: 'altar-3', scale: 0.55 },
          { name: 'Altar Invoc. Inativo', texture: 'altar-invoc-inactive', scale: 0.55 },
          { name: 'Altar Invoc. Ativo', texture: 'altar-invoc-active-1', scale: 0.55 },
          { name: 'Piso Chao2 (Cap2)', texture: 'floor-tile-2', scale: 0.08 }
        ]
      },

      // CATEGORIA 2: ITENS & COLETÁVEIS
      {
        title: '2. ITENS & COLETÁVEIS (DROPS & ECONOMIA)',
        accentColor: '#34d399',
        y: cy - 230,
        items: [
          { name: 'Gema Verde (5xp)', texture: 'gem-green', scale: 1.0 },
          { name: 'Gema Azul (20xp)', texture: 'gem-blue', scale: 1.0 },
          { name: 'Gema Vermelha', texture: 'gem-red', scale: 1.0 },
          { name: 'Gema Laranja', texture: 'gem-orange', scale: 1.0 },
          { name: 'Gema Roxa (250xp)', texture: 'gem-purple', scale: 1.0 },
          { name: 'Gema Ouro (500xp)', texture: 'gem-gold', scale: 1.0 },
          { name: 'Cálice Cura', texture: 'item-chalice', scale: 1.0 },
          { name: 'Ímã de Almas', texture: 'item-magnet', scale: 1.0 },
          { name: 'Baú do Abismo', texture: 'item-chest', scale: 1.0 },
          { name: 'Alma Corrompida', texture: 'item-soul', scale: 1.0 }
        ]
      },

      // CATEGORIA 3: ARMAS & PROJÉTEIS
      {
        title: '3. ARMAS & PROJÉTEIS (COMBATE)',
        accentColor: '#fb923c',
        y: cy - 90,
        items: [
          { name: 'Disparo Alma', texture: 'soul-shoot', scale: 1.0 },
          { name: 'Raio Apocalipse', texture: 'apocalypse-shoot', scale: 1.0 },
          { name: 'Foice do Vazio', texture: 'void-scythe', scale: 1.0 },
          { name: 'Adaga Sangue', texture: 'blood-dagger', scale: 1.0 },
          { name: 'Meteoro Infernal', texture: 'infernal-meteor', scale: 1.0 },
          { name: 'Heart Attack', texture: 'projectile-heart-attack', scale: 1.0 },
          { name: 'Gosma Tóxica', texture: 'mummy-poison-gosma', scale: 1.0 },
          { name: 'Orbe Azazel (VFX)', texture: 'azazel-orb', scale: 1.15 },
          { name: 'Raio Azazel (VFX)', texture: 'azazel-lightning-bolt', scale: 0.25 }
        ]
      },

      // CATEGORIA 4: INIMIGOS & CHEFES (MANEQUINS ESTÁTICOS)
      {
        title: '4. INIMIGOS & CHEFES (MANEQUINS DE EXIBIÇÃO)',
        accentColor: '#f43f5e',
        y: cy + 50,
        items: [
          { name: 'Cão Zumbi', texture: 'zombie-dog-idle-south', scale: 1.0, anim: 'zombie-dog-idle-south' },
          { name: 'Cão Alfa Elite', texture: 'zombie-dog-idle-south', scale: 1.35, tint: 0xff4455, anim: 'zombie-dog-idle-south' },
          { name: 'Morcego Sangue', texture: 'blood-bat-idle-south', scale: 0.75, anim: 'blood-bat-fly-south' },
          { name: 'Múmia Abissal', texture: 'mummy-idle-south', scale: 1.05, anim: 'mummy-idle-south' },
          { name: 'Skull Slime', texture: 'skull-slime-idle-south', scale: 1.0, anim: 'skull-slime-idle-south' },
          { name: 'Succubus Menor', texture: 'succubus-idle-south', scale: 1.0, anim: 'succubus-fly-south' },
          { name: 'Rosalin (Chefe 1)', texture: 'succubus-idle-south', scale: 1.75, anim: 'succubus-fly-south' },
          { name: 'Azazel (Parado)', texture: 'azazel-idle-south', scale: 1.55, anim: 'azazel-idle-south' },
          { name: 'Azazel (Correndo)', texture: 'azazel-run-south-0', scale: 1.55, anim: 'azazel-run-south' },
          { name: 'Azazel (Mão Erguida)', texture: 'azazel-hand-south', scale: 1.55, anim: 'azazel-hand-south' }
        ]
      },

      // CATEGORIA 5: CARTAS DE BÊNÇÃO
      {
        title: '5. MOLDURAS DE CARTAS DE BÊNÇÃO (CARDS)',
        accentColor: '#e879f9',
        y: cy + 200,
        items: [
          { name: 'Base Card', texture: 'card-base', scale: 0.45 },
          { name: 'Fire Card', texture: 'card-fire', scale: 0.45 },
          { name: 'Gold Card', texture: 'card-gold', scale: 0.45 },
          { name: 'Green Card', texture: 'card-green', scale: 0.45 },
          { name: 'Ice Card', texture: 'card-ice', scale: 0.45 },
          { name: 'Inferno Card', texture: 'card-inferno', scale: 0.45 },
          { name: 'Mystic Card', texture: 'card-mystic', scale: 0.45 },
          { name: 'Obsidian Card', texture: 'card-obsidian', scale: 0.45 }
        ]
      },

      // CATEGORIA 6: ANIMAÇÕES, RETRATOS & UI
      {
        title: '6. ANIMAÇÕES, RETRATOS DE CHAT & INTERFACE',
        accentColor: '#facc15',
        y: cy + 340,
        items: [
          { name: 'Estrela Respawn', texture: 'respawn-star-1', scale: 1.0, anim: 'anim-respawn-star' },
          { name: 'Explosão VFX', texture: 'explosion-1', scale: 0.60, anim: 'anim-explosion' },
          { name: 'Ícone Kills', texture: 'ui-kills-icon', scale: 1.0 },
          { name: 'Seta Menu', texture: 'ui-menu-arrow', scale: 1.0 },
          { name: 'Estrela STAR', texture: 'ui-star', scale: 0.70 },
          { name: 'Ult Gauge Frame', texture: 'ult-gauge-frame', scale: 0.55 },
          { name: 'Nixy Damage UI', texture: 'chat-nixy-damage', scale: 0.75 },
          { name: 'Rosalin Defeated', texture: 'chat-rosalin-defeated', scale: 0.75 },
          { name: 'Azazel Chat UI', texture: 'chat-azazel', scale: 0.14 },
          { name: 'Logo Oficial', texture: 'game-title-logo', scale: 0.35 }
        ]
      }
    ];

    for (const cat of categories) {
      // Cabeçalho da Categoria com barra decorativa
      const banner = this.scene.add.text(cx, cat.y - 40, `─── ${cat.title} ───`, {
        fontFamily: pixelFont,
        fontSize: '11px',
        color: cat.accentColor,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(20);
      this.showroomElements.push(banner);

      const count = cat.items.length;
      const usableWidth = totalWidth - 140;
      const spacing = usableWidth / Math.max(1, count - 1);
      const startX = cx - usableWidth / 2;

      cat.items.forEach((item, index) => {
        const itemX = count === 1 ? cx : startX + index * spacing;
        const itemY = cat.y;

        if (this.scene.textures.exists(item.texture)) {
          const sprite = this.scene.add.sprite(itemX, itemY, item.texture);
          sprite.setOrigin(0.5, 0.5);
          sprite.setDepth(15);
          if (item.scale !== undefined) {
            sprite.setScale(item.scale);
          }
          if (item.tint !== undefined) {
            sprite.setTint(item.tint);
          }

          // Se for tocha, instancia também seu halo de iluminação proporcional
          if (item.isTorch) {
            const halo = this.scene.add.image(itemX, itemY - 9, 'torch-light');
            halo.setOrigin(0.5, 0.5);
            halo.setDepth(14);
            halo.setBlendMode(Phaser.BlendModes.ADD);
            halo.setAlpha(0.72);
            halo.setScale(0.46);

            this.scene.tweens.add({
              targets: halo,
              scaleX: { from: 0.44, to: 0.53 },
              scaleY: { from: 0.44, to: 0.53 },
              alpha: { from: 0.58, to: 0.82 },
              duration: 450,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
            this.showroomElements.push(halo);
          }

          // Se possui animação contínua (ex: estrela, inimigo, explosão)
          if (item.anim && this.scene.anims.exists(item.anim)) {
            sprite.play({ key: item.anim, repeat: -1 });
          }

          this.showroomElements.push(sprite);

          // Rótulo informativo sob o sprite
          const label = this.scene.add.text(itemX, itemY + 34, item.name, {
            fontFamily: pixelFont,
            fontSize: '8px',
            color: '#cbd5e1',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
          }).setOrigin(0.5, 0).setDepth(20);
          this.showroomElements.push(label);
        } else {
          // Placeholder caso textura ainda esteja carregando
          const ph = this.scene.add.text(itemX, itemY, `[${item.name}]`, {
            fontFamily: pixelFont,
            fontSize: '9px',
            color: '#ef4444'
          }).setOrigin(0.5).setDepth(20);
          this.showroomElements.push(ph);
        }
      });
    }
  }

  /**
   * Atualização contínua (detecta aproximação de Nixy aos quadrados de teleporte e pulsa visuais)
   */
  public update(delta: number): void {
    if (!this.isBuilt || !this.scene.player || this.scene.mapEditorSystem?.isOpen) return;

    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= delta;
    }

    this.pulseTimer += delta * 0.004;

    // 1. Renderiza o quadrado pulsante do Spawn
    this.renderSpawnPad();

    // 2. Renderiza o quadrado pulsante do Retorno
    this.renderReturnPad();

    // 3. Verificação de teleporte: Spawn -> Showroom
    const distToSpawnPad = Math.hypot(
      this.scene.player.x - TestShowroomSystem.SPAWN_PAD_X,
      this.scene.player.y - TestShowroomSystem.SPAWN_PAD_Y
    );

    if (distToSpawnPad <= 48 && this.teleportCooldown <= 0) {
      this.teleportToShowroom();
      return;
    }

    // 4. Verificação de teleporte: Showroom -> Spawn Central
    const distToReturnPad = Math.hypot(
      this.scene.player.x - TestShowroomSystem.RETURN_PAD_X,
      this.scene.player.y - TestShowroomSystem.RETURN_PAD_Y
    );

    if (distToReturnPad <= 48 && this.teleportCooldown <= 0) {
      this.teleportToSpawn();
    }
  }

  public teleportToShowroom(): void {
    // 1. Define limites de física e câmera para o quarto isolado da galeria
    this.scene.physics.world.setBounds(
      TestShowroomSystem.SHOWROOM_CENTER_X - 1000,
      TestShowroomSystem.SHOWROOM_CENTER_Y - 700,
      2000,
      1400
    );
    this.scene.cameras.main.setBounds(
      TestShowroomSystem.SHOWROOM_CENTER_X - 1000,
      TestShowroomSystem.SHOWROOM_CENTER_Y - 700,
      2000,
      1400
    );
    this.teleportTo(
      TestShowroomSystem.SHOWROOM_ENTRY_X,
      TestShowroomSystem.SHOWROOM_ENTRY_Y,
      'TELEPORTADO PARA A ÁREA DE TESTE (GALERIA DE SPRITES)'
    );
  }

  public teleportToSpawn(): void {
    // 2. Restaura os limites da arena de combate ao retornar ao spawn
    this.scene.physics.world.setBounds(ARENA_CONFIG.MIN_X, ARENA_CONFIG.MIN_Y, ARENA_CONFIG.WIDTH, ARENA_CONFIG.HEIGHT);
    this.scene.cameras.main.setBounds(ARENA_CONFIG.MIN_X, ARENA_CONFIG.MIN_Y, ARENA_CONFIG.WIDTH, ARENA_CONFIG.HEIGHT);
    this.teleportTo(
      TestShowroomSystem.SPAWN_DEST_X,
      TestShowroomSystem.SPAWN_DEST_Y,
      'RETORNADO AO SPAWN CENTRAL'
    );
  }

  /**
   * Altera a visibilidade de todos os componentes da galeria e dos pads de teleporte
   */
  public setVisible(visible: boolean): void {
    if (this.spawnPadGraphics) this.spawnPadGraphics.setVisible(visible);
    if (this.spawnPadText) this.spawnPadText.setVisible(visible);
    if (this.spawnPadSubtext) this.spawnPadSubtext.setVisible(visible);
    if (this.returnPadGraphics) this.returnPadGraphics.setVisible(visible);
    if (this.returnPadText) this.returnPadText.setVisible(visible);
    if (this.returnPadSubtext) this.returnPadSubtext.setVisible(visible);
    if (this.floorGraphics) this.floorGraphics.setVisible(visible);
    for (const el of this.showroomElements) {
      if (el && 'setVisible' in el) {
        (el as any).setVisible(visible);
      }
    }
  }

  /**
   * Executa a transição suave de teleporte de Nixy com flash e efeitos sonoros
   */
  private teleportTo(destX: number, destY: number, toastMsg: string): void {
    this.teleportCooldown = 1200; // Debounce de 1.2s para evitar vai-e-volta acidental

    SoundManager.getInstance().playLevelUp();
    this.scene.cameras.main.flash(200, 168, 85, 247);

    // Reposiciona o corpo físico e sprite da Nixy
    this.scene.player.setPosition(destX, destY);
    const body = this.scene.player.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.reset(destX, destY);
    }

    // Estrela ritual nos pés na chegada
    this.scene.playRespawnStarEffect();

    const uiScene = this.scene.scene.get('UIScene') as any;
    if (uiScene && typeof uiScene.showCenterAnnouncement === 'function') {
      uiScene.showCenterAnnouncement('TELEPORTE ATIVADO', toastMsg);
    }

    DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', toastMsg, { destX, destY });
  }

  /**
   * Desenha o quadrado mágico pulsante ao lado do spawn
   */
  private renderSpawnPad(): void {
    if (!this.spawnPadGraphics) return;

    const g = this.spawnPadGraphics;
    g.clear();

    const px = TestShowroomSystem.SPAWN_PAD_X;
    const py = TestShowroomSystem.SPAWN_PAD_Y;
    const size = 68;

    const pulse = 0.5 + Math.sin(this.pulseTimer) * 0.35;

    // Fundo semitransparente ciano
    g.fillStyle(0x0284c7, 0.25 + pulse * 0.15);
    g.fillRect(px - size / 2, py - size / 2, size, size);

    // Linha de borda externa pulsante
    g.lineStyle(3, 0x38bdf8, 0.8 + pulse * 0.2);
    g.strokeRect(px - size / 2, py - size / 2, size, size);

    // Moldura interna rúnica
    g.lineStyle(1, 0x7dd3fc, 0.5);
    g.strokeRect(px - size / 2 + 5, py - size / 2 + 5, size - 10, size - 10);

    // Glifo central (Cruz rúnica rotativa)
    const crossSize = 14 + Math.sin(this.pulseTimer * 1.5) * 3;
    g.lineStyle(2, 0xfacc15, 0.9);
    g.lineBetween(px - crossSize, py, px + crossSize, py);
    g.lineBetween(px, py - crossSize, px, py + crossSize);
  }

  /**
   * Desenha o quadrado mágico pulsante de retorno na galeria
   */
  private renderReturnPad(): void {
    if (!this.returnPadGraphics) return;

    const g = this.returnPadGraphics;
    g.clear();

    const rx = TestShowroomSystem.RETURN_PAD_X;
    const ry = TestShowroomSystem.RETURN_PAD_Y;
    const size = 68;

    const pulse = 0.5 + Math.sin(this.pulseTimer + Math.PI) * 0.35;

    // Fundo avermelhado/âmbar
    g.fillStyle(0xd97706, 0.25 + pulse * 0.15);
    g.fillRect(rx - size / 2, ry - size / 2, size, size);

    // Linha de borda externa
    g.lineStyle(3, 0xf59e0b, 0.8 + pulse * 0.2);
    g.strokeRect(rx - size / 2, ry - size / 2, size, size);

    // Moldura interna
    g.lineStyle(1, 0xfcd34d, 0.5);
    g.strokeRect(rx - size / 2 + 5, ry - size / 2 + 5, size - 10, size - 10);

    // Glifo central
    const crossSize = 14 + Math.sin(this.pulseTimer * 1.5) * 3;
    g.lineStyle(2, 0xf87171, 0.9);
    g.lineBetween(rx - crossSize, ry, rx + crossSize, ry);
    g.lineBetween(rx, ry - crossSize, rx, ry + crossSize);
  }

  public destroy(): void {
    this.spawnPadGraphics?.destroy();
    this.spawnPadText?.destroy();
    this.spawnPadSubtext?.destroy();

    this.returnPadGraphics?.destroy();
    this.returnPadText?.destroy();
    this.returnPadSubtext?.destroy();

    this.floorGraphics?.destroy();

    for (const el of this.showroomElements) {
      if (el && el.destroy) {
        el.destroy();
      }
    }
    this.showroomElements = [];
    this.isBuilt = false;
  }
}

import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { ChapterMapConfig, MapEntityProp, MapStorageManager } from '../config/mapData';
import { ARENA_CONFIG } from '../config/balance';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';

export type EditorCategory = 'structures' | 'props' | 'floor' | 'checklist';

export interface EditorPaletteItem {
  id: string;
  name: string;
  category: 'structures' | 'props' | 'tools';
  texture?: string;
  scale?: number;
  icon: string;
}

export class MapEditorSystem {
  private scene: GameScene;
  public isOpen: boolean = false;

  private editingChapter: number = 1; // 1 = Cap 1, 2 = Cap 2, 202 = Dimensão Azazel (chao2)
  private currentMap: ChapterMapConfig;
  private currentTool: string = 'select';
  private activeCategory: EditorCategory = 'structures';
  private gridSnap: number = 32; // 0 = livre, 32, 64

  // Elementos do DOM Overlay do Editor
  private domRoot?: HTMLDivElement;
  private coordBadge?: HTMLSpanElement;
  private gridButton?: HTMLButtonElement;
  private mapSwitchButton?: HTMLButtonElement;
  private activeToolButtons: Map<string, HTMLButtonElement> = new Map();
  private categoryTabButtons: Map<EditorCategory, HTMLButtonElement> = new Map();
  private dynamicPaletteContainer?: HTMLDivElement;
  private checklistBadge?: HTMLSpanElement;

  // Controle de Câmera Livre
  private savedCameraPos: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 };
  private cameraKeys?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  };
  private isMiddleMouseDown: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;

  // Marcadores Visuais Interativos no Mundo
  private editorDisplayGroup?: Phaser.GameObjects.Group;
  private ghostPreview?: Phaser.GameObjects.Container;
  private ghostSprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

  // Paleta de Objetos e Estruturas Filtrada e Balanceada
  public static readonly BASE_PALETTE: EditorPaletteItem[] = [
    // 1. Estruturas e Altares
    { id: 'player_spawn', name: 'Spawn da Nixy', category: 'structures', icon: '👤', texture: 'nixy-idle-south', scale: 1.0 },
    { id: 'boss_portal', name: 'Altar do Chefe (Portal)', category: 'structures', icon: '🏛️', texture: 'altar-invoc-inactive', scale: 0.75 },
    { id: 'altar-1', name: 'Altar de Ascensão', category: 'structures', icon: '✨', texture: 'altar-1', scale: 0.55 },
    { id: 'item_spawner', name: 'Item Aleatório (Exploração)', category: 'structures', icon: '🎁', texture: 'item-chest', scale: 1.0 },

    // 2. Props de Cenário e Ambientação
    { id: 'scenery-tocha', name: 'Tocha Iluminada', category: 'props', icon: '🔥', texture: 'scenery-tocha', scale: 0.5 },
    { id: 'scenery-rocha', name: 'Rocha Comum (1)', category: 'props', icon: '🪨', texture: 'scenery-rocha', scale: 1.0 },
    { id: 'scenery-rocha-2', name: 'Rocha Grande (2)', category: 'props', icon: '⛰️', texture: 'scenery-rocha-2', scale: 1.5 },
    { id: 'scenery-ossos', name: 'Pilha de Ossos', category: 'props', icon: '💀', texture: 'scenery-ossos', scale: 1.0 },
    { id: 'scenery-cogumelos', name: 'Cogumelos Infernais', category: 'props', icon: '🍄', texture: 'scenery-cogumelos', scale: 1.0 },
    { id: 'scenery-cristal', name: 'Cristais Abissais', category: 'props', icon: '💎', texture: 'scenery-cristal', scale: 0.5 },

    // 3. Ferramentas Utilitárias
    { id: 'select', name: 'Mão / Mover Câmera', category: 'tools', icon: '🖐️' },
    { id: 'eraser', name: 'Borracha / Deletar', category: 'tools', icon: '🧹' }
  ];

  constructor(scene: GameScene) {
    this.scene = scene;
    this.editingChapter = (scene as any).currentChapter || 1;
    this.currentMap = MapStorageManager.getActiveMap(this.editingChapter);
  }

  /**
   * Alterna a abertura do Editor de Mapa
   */
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Abre o Editor de Mapa em tela cheia com Câmera Livre e Paleta
   */
  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    // 1. Oculta todos os props, altares e itens da cena para visão limpa do editor
    this.scene.setSceneryPropsVisible(false);
    if (this.scene.player) {
      this.scene.player.setVisible(false);
    }
    this.scene.setMapEditorLauncherButtonVisible(false);
    this.scene.testShowroomSystem?.setVisible(false);

    // 2. Oculta o HUD de jogo (UIScene)
    const uiScene = this.scene.scene.get('UIScene') as any;
    if (uiScene && typeof uiScene.setHUDVisible === 'function') {
      uiScene.setHUDVisible(false);
    }

    // 3. Carrega o mapa ativo e monta os elementos editáveis
    this.currentMap = MapStorageManager.getActiveMap(this.editingChapter);
    if ((this.scene as any).setArenaFloorTexture) {
      (this.scene as any).setArenaFloorTexture(
        this.currentMap.floorTexture || (this.editingChapter === 202 ? 'floor-tile-2' : 'floor-tile')
      );
    }
    this.saveCameraState();
    this.setupCameraControls();
    this.createDomOverlay();
    this.renderAllMapEntities();
    this.createGhostPreview();

    SoundManager.getInstance().playLevelUp();
    DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Editor de Mapas Aberto.');
  }

  /**
   * Fecha o Editor e restaura a câmera seguindo a Nixy
   */
  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.destroyDomOverlay();
    this.clearEditorDisplay();

    // 1. Aplica o mapa atualizado à cena do jogo e restaura a visibilidade de tudo
    this.scene.loadCustomMapLayout(this.currentMap);
    this.scene.setSceneryPropsVisible(true);
    if (this.scene.player) {
      this.scene.player.setVisible(true);
    }
    this.scene.setMapEditorLauncherButtonVisible(true);
    this.scene.testShowroomSystem?.setVisible(true);

    const uiScene = this.scene.scene.get('UIScene') as any;
    if (uiScene && typeof uiScene.setHUDVisible === 'function') {
      uiScene.setHUDVisible(true);
    }

    this.restoreCameraState();
    DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Editor de Mapas Fechado.');
  }

  private saveCameraState(): void {
    const cam = this.scene.cameras.main;
    this.savedCameraPos = {
      x: cam.scrollX + cam.width / 2,
      y: cam.scrollY + cam.height / 2,
      zoom: cam.zoom
    };
    cam.stopFollow();
    cam.removeBounds();
    if (this.savedCameraPos.y < ARENA_CONFIG.MIN_Y || this.savedCameraPos.y > ARENA_CONFIG.MAX_Y) {
      cam.centerOn(this.currentMap.playerSpawn.x, this.currentMap.playerSpawn.y);
    }
  }

  private restoreCameraState(): void {
    const cam = this.scene.cameras.main;
    cam.setBounds(ARENA_CONFIG.MIN_X, ARENA_CONFIG.MIN_Y, ARENA_CONFIG.WIDTH, ARENA_CONFIG.HEIGHT);
    cam.setZoom(2);
    if (this.scene.player) {
      cam.startFollow(this.scene.player, true, 0.1, 0.1);
    }
  }

  private setupCameraControls(): void {
    if (!this.scene.input.keyboard) return;

    this.cameraKeys = {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shift: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    };

    // Zoom da Câmera Livre com a Roda do Mouse
    this.scene.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (!this.isOpen) return;
      const cam = this.scene.cameras.main;
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * zoomFactor, 0.35, 3.0));
      this.updateHudBadges();
    });

    // Clique no mundo: Botão Esquerdo = Inserir/Mover | Botão Direito = Apagar
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isOpen) return;

      if (pointer.rightButtonDown()) {
        const worldPoint = this.getWorldPointer(pointer);
        this.deleteAtWorldPosition(worldPoint.x, worldPoint.y);
        return;
      }

      if (pointer.middleButtonDown() || this.currentTool === 'select') {
        this.isMiddleMouseDown = true;
        this.lastDragX = pointer.x;
        this.lastDragY = pointer.y;
        return;
      }

      if (pointer.leftButtonDown()) {
        const worldPoint = this.getWorldPointer(pointer);
        this.handleWorldClick(worldPoint.x, worldPoint.y);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isOpen) return;

      if (this.isMiddleMouseDown) {
        const dx = (pointer.x - this.lastDragX) / this.scene.cameras.main.zoom;
        const dy = (pointer.y - this.lastDragY) / this.scene.cameras.main.zoom;
        this.scene.cameras.main.scrollX -= dx;
        this.scene.cameras.main.scrollY -= dy;
        this.lastDragX = pointer.x;
        this.lastDragY = pointer.y;
      }

      this.updateGhostPreview(pointer);
      this.updateHudBadges();
    });

    this.scene.input.on('pointerup', () => {
      this.isMiddleMouseDown = false;
    });

    this.scene.game.canvas.oncontextmenu = (e) => {
      if (this.isOpen) {
        e.preventDefault();
        return false;
      }
    };
  }

  private getWorldPointer(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    const rawX = pointer.worldX;
    const rawY = pointer.worldY;

    if (this.gridSnap <= 0) {
      return { x: Math.round(rawX), y: Math.round(rawY) };
    }

    return {
      x: Math.round(rawX / this.gridSnap) * this.gridSnap,
      y: Math.round(rawY / this.gridSnap) * this.gridSnap
    };
  }

  /**
   * Trata o clique no chão do mundo com a ferramenta selecionada
   */
  private handleWorldClick(worldX: number, worldY: number): void {
    if (this.currentTool === 'select') return;

    if (this.currentTool === 'eraser') {
      this.deleteAtWorldPosition(worldX, worldY);
      return;
    }

    // 1. Spawn da Nixy (Exatamente 1 por mapa)
    if (this.currentTool === 'player_spawn') {
      this.currentMap.playerSpawn = { x: worldX, y: worldY };
      MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
      this.renderAllMapEntities();
      this.updateChecklistStatus();
      this.showToast(`Ponto de Spawn da Nixy reposicionado para (${worldX}, ${worldY})`);
      SoundManager.getInstance().playLevelUp();
      return;
    }

    // 2. Altar do Chefe do Capítulo (Exatamente 1 por mapa - define portal e spawn do chefe)
    if (this.currentTool === 'boss_portal') {
      this.currentMap.bossPortal = { x: worldX, y: worldY };
      this.currentMap.bossSpawn = { x: worldX, y: worldY - 15 };
      MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
      this.renderAllMapEntities();
      this.updateChecklistStatus();
      const bossName = this.editingChapter >= 2 ? 'Azazel' : 'Rosalin';
      this.showToast(`Altar de Invocação de ${bossName} posicionado em (${worldX}, ${worldY})`);
      SoundManager.getInstance().playLevelUp();
      return;
    }

    // 3. Altar de Ascensão / Evolução de Armas (apenas altar-1)
    if (this.currentTool === 'altar-1') {
      const tooClose = this.currentMap.props.some(
        (p) => p.type === 'altar-1' && Math.hypot(p.x - worldX, p.y - worldY) < 60
      );
      if (!tooClose) {
        this.currentMap.props.push({
          type: 'altar-1',
          x: worldX,
          y: worldY,
          scale: 0.55
        });
        MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
        this.renderAllMapEntities();
        this.updateChecklistStatus();
        this.showToast(`Altar de Ascensão adicionado em (${worldX}, ${worldY})`);
        SoundManager.getInstance().playWeaponEvolve();
      }
      return;
    }

    // 4. Spawner de Item Aleatório (Exploração)
    if (this.currentTool === 'item_spawner') {
      const exists = this.currentMap.itemSpawners.some(
        (sp) => Math.hypot(sp.x - worldX, sp.y - worldY) < 30
      );
      if (!exists) {
        this.currentMap.itemSpawners.push({ x: worldX, y: worldY });
        MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
        this.renderAllMapEntities();
        this.updateChecklistStatus();
        this.showToast(`Spawner de Item Aleatório criado em (${worldX}, ${worldY})`);
        SoundManager.getInstance().playGemCollect();
      }
      return;
    }

    // 5. Props de Cenário Comuns
    const paletteDef = MapEditorSystem.BASE_PALETTE.find((p) => p.id === this.currentTool);
    if (paletteDef && paletteDef.category === 'props') {
      const tooClose = this.currentMap.props.some(
        (p) => Math.hypot(p.x - worldX, p.y - worldY) < 22
      );
      if (!tooClose) {
        const newProp: MapEntityProp = {
          type: paletteDef.id,
          x: worldX,
          y: worldY,
          scale: paletteDef.scale ?? 1.0
        };
        this.currentMap.props.push(newProp);
        MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
        this.renderAllMapEntities();
        this.updateChecklistStatus();
        SoundManager.getInstance().playCardCashSelect();
      }
    }
  }

  /**
   * Deleta qualquer objeto, spawner ou prop presente no ponto do mundo
   */
  private deleteAtWorldPosition(worldX: number, worldY: number): void {
    const clickRadius = 40;

    // 1. Tenta deletar spawner de item
    const spawnerIdx = this.currentMap.itemSpawners.findIndex(
      (sp) => Math.hypot(sp.x - worldX, sp.y - worldY) <= clickRadius
    );
    if (spawnerIdx !== -1) {
      this.currentMap.itemSpawners.splice(spawnerIdx, 1);
      MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
      this.renderAllMapEntities();
      this.updateChecklistStatus();
      this.showToast('Spawner de Item Aleatório removido!');
      SoundManager.getInstance().playPlayerHurt();
      return;
    }

    // 2. Tenta deletar prop de cenário ou altar de ascensão
    const propIdx = this.currentMap.props.findIndex(
      (p) => Math.hypot(p.x - worldX, p.y - worldY) <= clickRadius
    );
    if (propIdx !== -1) {
      const removed = this.currentMap.props.splice(propIdx, 1)[0];
      MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
      this.renderAllMapEntities();
      this.updateChecklistStatus();
      this.showToast(`Objeto [${removed.type}] removido do mapa!`);
      SoundManager.getInstance().playPlayerHurt();
      return;
    }

    // 3. Spawns obrigatórios não podem ser deletados (apenas reposicionados)
    if (Math.hypot(this.currentMap.playerSpawn.x - worldX, this.currentMap.playerSpawn.y - worldY) <= clickRadius) {
      this.showToast('O Spawn da Nixy é obrigatório! Selecione a ferramenta para reposicioná-lo.', '#fbbf24');
      return;
    }
    if (Math.hypot(this.currentMap.bossPortal.x - worldX, this.currentMap.bossPortal.y - worldY) <= clickRadius) {
      this.showToast('O Altar do Chefe é obrigatório! Selecione a ferramenta para reposicioná-lo.', '#fbbf24');
      return;
    }
  }

  private createGhostPreview(): void {
    this.destroyGhostPreview();

    this.ghostPreview = this.scene.add.container(0, 0);
    this.ghostPreview.setDepth(2000);
    this.ghostPreview.setAlpha(0.72);

    this.ghostSprite = this.scene.add.sprite(0, 0, 'scenery-rocha');
    this.ghostPreview.add(this.ghostSprite);
  }

  private updateGhostPreview(pointer: Phaser.Input.Pointer): void {
    if (!this.ghostPreview || !this.ghostSprite) return;

    if (this.currentTool === 'select') {
      this.ghostPreview.setVisible(false);
      return;
    }

    this.ghostPreview.setVisible(true);
    const worldPoint = this.getWorldPointer(pointer);
    this.ghostPreview.setPosition(worldPoint.x, worldPoint.y);

    const paletteDef = MapEditorSystem.BASE_PALETTE.find((p) => p.id === this.currentTool);
    if (paletteDef && paletteDef.texture && this.scene.textures.exists(paletteDef.texture)) {
      this.ghostSprite.setTexture(paletteDef.texture);
      this.ghostSprite.setScale(paletteDef.scale ?? 1.0);
      this.ghostSprite.clearTint();
    } else if (this.currentTool === 'eraser') {
      this.ghostSprite.setTexture('ui-menu-arrow');
      this.ghostSprite.setTint(0xff2222);
      this.ghostSprite.setScale(1.2);
    }
  }

  private destroyGhostPreview(): void {
    this.ghostPreview?.destroy();
    this.ghostPreview = undefined;
    this.ghostSprite = undefined;
  }

  /**
   * Renderiza todos os objetos, props e marcadores no mapa no modo de edição
   */
  private renderAllMapEntities(): void {
    this.clearEditorDisplay();
    this.editorDisplayGroup = this.scene.add.group();
    const pixelFont = 'Pixelzone, Silkscreen, monospace';

    // 1. Marcador do Spawn da Nixy com SPRITE EM TAMANHO REAL (1.0x) e Anel Místico
    const ps = this.currentMap.playerSpawn;
    const playerBase = this.scene.add.circle(ps.x, ps.y + 12, 32, 0x10b981, 0.4);
    playerBase.setStrokeStyle(3, 0x34d399, 0.95);
    playerBase.setDepth(18);

    const playerSprite = this.scene.add.sprite(ps.x, ps.y, 'nixy-idle-south');
    playerSprite.setOrigin(0.5, 0.5);
    playerSprite.setDepth(20);
    playerSprite.setScale(1.0);

    const playerLabel = this.scene.add.text(ps.x, ps.y - 48, 'SPAWN DA NIXY', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#34d399',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.editorDisplayGroup.addMultiple([playerBase, playerSprite, playerLabel]);

    // 2. Marcador do Altar / Portal de Invocação do Chefe (único)
    const bp = this.currentMap.bossPortal;
    const isAzazelMap = this.editingChapter >= 2;
    const portalBase = this.scene.add.circle(bp.x, bp.y, 45, isAzazelMap ? 0x9d4edd : 0x8b5cf6, 0.4);
    portalBase.setStrokeStyle(3, isAzazelMap ? 0xc084fc : 0xa855f7, 0.95);
    portalBase.setDepth(18);

    const portalSprite = this.scene.add.sprite(bp.x, bp.y - 10, 'altar-invoc-inactive');
    portalSprite.setOrigin(0.5, 0.5);
    portalSprite.setDepth(19);
    portalSprite.setScale(0.75);

    const portalLabelText = isAzazelMap ? 'ALTAR DE INVOCAÇÃO (AZAZEL)' : 'ALTAR DE INVOCAÇÃO (ROSALIN)';
    const portalLabel = this.scene.add.text(bp.x, bp.y - 68, portalLabelText, {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: isAzazelMap ? '#e0aaff' : '#c084fc',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.editorDisplayGroup.addMultiple([portalBase, portalSprite, portalLabel]);

    // 3. Marcador da Área do Chefe (acoplada ao Altar)
    const bs = this.currentMap.bossSpawn || { x: bp.x, y: bp.y - 15 };
    const bossZone = this.scene.add.circle(bs.x, bs.y, 60, 0xef4444, 0.22);
    bossZone.setStrokeStyle(2.5, 0xf87171, 0.85);
    bossZone.setDepth(17);

    const bossTex = isAzazelMap && this.scene.textures.exists('azazel-idle-south') ? 'azazel-idle-south' : 'succubus-idle-south';
    const bossSprite = this.scene.add.sprite(bs.x, bs.y, bossTex);
    bossSprite.setOrigin(0.5, 0.5);
    bossSprite.setDepth(19);
    bossSprite.setScale(1.2);

    this.editorDisplayGroup.addMultiple([bossZone, bossSprite]);

    // 4. Quadrados de Spawn de Item Aleatório
    for (const sp of this.currentMap.itemSpawners) {
      const box = this.scene.add.rectangle(sp.x, sp.y, 56, 56, 0xd97706, 0.35);
      box.setStrokeStyle(2, 0xfbbf24, 0.95);
      box.setDepth(16);

      const icon = this.scene.add.image(sp.x, sp.y, 'item-chest');
      icon.setScale(0.75);
      icon.setDepth(17);

      const tag = this.scene.add.text(sp.x, sp.y + 36, 'ITEM ?', {
        fontFamily: pixelFont,
        fontSize: '8px',
        color: '#fde047',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(25);

      this.editorDisplayGroup.addMultiple([box, icon, tag]);
    }

    // 5. Props de Cenário e Altares de Ascensão
    for (const prop of this.currentMap.props) {
      if (this.scene.textures.exists(prop.type)) {
        const sprite = this.scene.add.image(prop.x, prop.y, prop.type);
        sprite.setOrigin(0.5, 0.65);
        sprite.setDepth(15);
        sprite.setScale(prop.scale ?? 1.0);

        this.editorDisplayGroup.add(sprite);

        if (prop.type === 'scenery-tocha') {
          const halo = this.scene.add.image(prop.x, prop.y - 9, 'torch-light');
          halo.setOrigin(0.5, 0.5);
          halo.setDepth(14);
          halo.setScale(0.46);
          halo.setBlendMode(Phaser.BlendModes.ADD);
          halo.setAlpha(0.68);
          this.editorDisplayGroup.add(halo);
        } else if (prop.type === 'altar-1') {
          const tag = this.scene.add.text(prop.x, prop.y - 48, 'ALTAR DE ASCENSÃO', {
            fontFamily: pixelFont,
            fontSize: '9px',
            color: '#00f5d4',
            stroke: '#000000',
            strokeThickness: 2
          }).setOrigin(0.5).setDepth(22);
          this.editorDisplayGroup.add(tag);
        }
      }
    }
  }

  private clearEditorDisplay(): void {
    if (this.editorDisplayGroup) {
      this.editorDisplayGroup.clear(true, true);
      this.editorDisplayGroup = undefined;
    }
  }

  public update(delta: number): void {
    if (!this.isOpen || !this.cameraKeys) return;

    const cam = this.scene.cameras.main;
    const speed = (this.cameraKeys.shift.isDown ? 1100 : 550) * (delta / 1000) / cam.zoom;

    if (this.cameraKeys.w.isDown || this.cameraKeys.up.isDown) cam.scrollY -= speed;
    if (this.cameraKeys.s.isDown || this.cameraKeys.down.isDown) cam.scrollY += speed;
    if (this.cameraKeys.a.isDown || this.cameraKeys.left.isDown) cam.scrollX -= speed;
    if (this.cameraKeys.d.isDown || this.cameraKeys.right.isDown) cam.scrollX += speed;

    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, ARENA_CONFIG.MIN_X, ARENA_CONFIG.MAX_X - cam.width);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, ARENA_CONFIG.MIN_Y, ARENA_CONFIG.MAX_Y - cam.height);
  }

  /**
   * Constrói a interface moderna e categorizada do Editor com DOM Overlay
   */
  private createDomOverlay(): void {
    this.destroyDomOverlay();

    this.domRoot = document.createElement('div');
    this.domRoot.id = 'map-editor-overlay';
    this.domRoot.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      font-family: 'Silkscreen', 'Press Start 2P', monospace;
      color: #e2e8f0;
      user-select: none;
    `;

    // 1. BARRA SUPERIOR
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      position: absolute;
      top: 10px;
      left: 14px;
      right: 14px;
      background: rgba(15, 12, 25, 0.95);
      border: 2px solid #8b5cf6;
      box-shadow: 0 4px 25px rgba(139, 92, 246, 0.35);
      border-radius: 8px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: auto;
      gap: 10px;
      flex-wrap: wrap;
    `;

    const leftSection = document.createElement('div');
    leftSection.style.cssText = `display: flex; align-items: center; gap: 10px; flex-wrap: wrap;`;

    const titleBadge = document.createElement('span');
    titleBadge.textContent = '🗺️ CRIADOR DE MAPAS';
    titleBadge.style.cssText = `
      font-size: 13px;
      font-weight: bold;
      color: #facc15;
      text-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
    `;
    leftSection.appendChild(titleBadge);

    this.coordBadge = document.createElement('span');
    this.coordBadge.textContent = 'X: 0 | Y: 0 | Zoom: 1.0x';
    this.coordBadge.style.cssText = `
      font-size: 10px;
      color: #94a3b8;
      background: #1e1730;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #33264d;
    `;
    leftSection.appendChild(this.coordBadge);

    // Botão de Grade
    this.gridButton = document.createElement('button');
    this.gridButton.textContent = `🔲 GRADE: ${this.gridSnap}px`;
    this.gridButton.style.cssText = this.getActionButtonStyle('#38bdf8');
    this.gridButton.onclick = () => {
      if (this.gridSnap === 32) this.gridSnap = 64;
      else if (this.gridSnap === 64) this.gridSnap = 0;
      else this.gridSnap = 32;

      this.gridButton!.textContent = this.gridSnap === 0 ? '🔲 GRADE: LIVRE' : `🔲 GRADE: ${this.gridSnap}px`;
      this.showToast(`Grade ajustada para: ${this.gridSnap === 0 ? 'LIVRE' : this.gridSnap + 'px'}`);
    };
    leftSection.appendChild(this.gridButton);

    // Seletor de Capítulo
    const getMapLabel = (ch: number) => {
      if (ch === 2) return 'MAPA: CAPÍTULO 2 (AZAZEL)';
      if (ch === 202) return 'MAPA: DIMENSÃO AZAZEL (CHAO 2)';
      return 'MAPA: CAPÍTULO 1 (ROSALIN)';
    };
    this.mapSwitchButton = document.createElement('button');
    this.mapSwitchButton.textContent = getMapLabel(this.editingChapter);
    this.mapSwitchButton.style.cssText = this.getActionButtonStyle('#f43f5e');
    this.mapSwitchButton.onclick = () => {
      if (this.editingChapter === 1) this.editingChapter = 2;
      else if (this.editingChapter === 2) this.editingChapter = 202;
      else this.editingChapter = 1;

      this.currentMap = MapStorageManager.getActiveMap(this.editingChapter);
      this.mapSwitchButton!.textContent = getMapLabel(this.editingChapter);
      if ((this.scene as any).setArenaFloorTexture) {
        (this.scene as any).setArenaFloorTexture(
          this.currentMap.floorTexture || (this.editingChapter === 202 ? 'floor-tile-2' : 'floor-tile')
        );
      }
      this.renderAllMapEntities();
      this.renderDynamicPalette();
      this.updateChecklistStatus();
      this.showToast(`Editando: ${getMapLabel(this.editingChapter)}`, '#f43f5e');
    };
    leftSection.appendChild(this.mapSwitchButton);

    topBar.appendChild(leftSection);

    // BOTÕES DE AÇÃO SUPERIORES
    const actionGroup = document.createElement('div');
    actionGroup.style.cssText = `display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;

    // Testar Mapa
    const playBtn = document.createElement('button');
    playBtn.textContent = '⚔️ TESTAR MAPA';
    playBtn.style.cssText = this.getActionButtonStyle('#10b981', true);
    playBtn.onclick = () => this.applyAndTestCurrentMap();
    actionGroup.appendChild(playBtn);

    // Baixar .JSON
    const exportFileBtn = document.createElement('button');
    exportFileBtn.textContent = '💾 BAIXAR .JSON';
    exportFileBtn.style.cssText = this.getActionButtonStyle('#3b82f6');
    exportFileBtn.onclick = () => this.downloadMapJsonFile();
    actionGroup.appendChild(exportFileBtn);

    // Copiar JSON
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 COPIAR JSON';
    copyBtn.style.cssText = this.getActionButtonStyle('#a855f7');
    copyBtn.onclick = () => this.copyMapJsonToClipboard();
    actionGroup.appendChild(copyBtn);

    // Importar JSON
    const importBtn = document.createElement('button');
    importBtn.textContent = '📂 IMPORTAR JSON';
    importBtn.style.cssText = this.getActionButtonStyle('#eab308');
    importBtn.onclick = () => this.openImportModal();
    actionGroup.appendChild(importBtn);

    // Limpar Tudo
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ LIMPAR TUDO';
    clearBtn.style.cssText = this.getActionButtonStyle('#ef4444');
    clearBtn.onclick = () => {
      if (confirm('Deseja realmente limpar todos os props e spawners de itens deste mapa?')) {
        this.currentMap.props = [];
        this.currentMap.itemSpawners = [];
        MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
        this.scene.clearAllSceneryProps();
        this.renderAllMapEntities();
        this.updateChecklistStatus();
        this.showToast('Mapa limpo! Todos os props e spawners foram removidos.', '#ef4444');
      }
    };
    actionGroup.appendChild(clearBtn);

    // Restaurar Padrão
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '🔄 RESTAURAR PADRÃO';
    resetBtn.style.cssText = this.getActionButtonStyle('#64748b');
    resetBtn.onclick = () => {
      if (confirm('Restaurar este mapa para o layout padrão original do jogo?')) {
        this.currentMap = MapStorageManager.getDefaultMap(this.editingChapter);
        MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
        this.scene.loadCustomMapLayout(this.currentMap);
        this.scene.setSceneryPropsVisible(false);
        this.renderAllMapEntities();
        this.updateChecklistStatus();
        this.showToast('Mapa padrão restaurado com sucesso!', '#38bdf8');
      }
    };
    actionGroup.appendChild(resetBtn);

    // Fechar Editor
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌ SAIR';
    closeBtn.style.cssText = this.getActionButtonStyle('#94a3b8');
    closeBtn.onclick = () => this.close();
    actionGroup.appendChild(closeBtn);

    topBar.appendChild(actionGroup);
    this.domRoot.appendChild(topBar);

    // 2. PALETA INFERIOR CATEGORIZADA E ORGANIZADA
    const bottomPalette = document.createElement('div');
    bottomPalette.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 14px;
      right: 14px;
      background: rgba(15, 12, 25, 0.96);
      border: 2px solid #8b5cf6;
      box-shadow: 0 -4px 30px rgba(139, 92, 246, 0.4);
      border-radius: 10px;
      padding: 10px 14px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    // LINHA DE ABAS CATEGORIZADAS
    const categoryTabsRow = document.createElement('div');
    categoryTabsRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #33264d;
      padding-bottom: 8px;
      flex-wrap: wrap;
    `;

    const categories: { id: EditorCategory; label: string; icon: string; color: string }[] = [
      { id: 'structures', label: 'ESTRUTURAS & ALTARES', icon: '🏛️', color: '#c084fc' },
      { id: 'props', label: 'CENÁRIO & PROPS', icon: '🌲', color: '#38bdf8' },
      { id: 'floor', label: 'TEXTURA DO CHÃO', icon: '🗺️', color: '#fbbf24' },
      { id: 'checklist', label: 'CHECKLIST OBRIGATÓRIO', icon: '📋', color: '#10b981' }
    ];

    this.categoryTabButtons.clear();
    for (const cat of categories) {
      const tabBtn = document.createElement('button');
      tabBtn.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>`;
      tabBtn.style.cssText = this.getCategoryTabStyle(this.activeCategory === cat.id, cat.color);

      tabBtn.onclick = () => {
        this.activeCategory = cat.id;
        for (const [cId, btn] of this.categoryTabButtons.entries()) {
          const cfg = categories.find((c) => c.id === cId);
          btn.style.cssText = this.getCategoryTabStyle(cId === this.activeCategory, cfg?.color || '#8b5cf6');
        }
        this.renderDynamicPalette();
      };

      this.categoryTabButtons.set(cat.id, tabBtn);
      categoryTabsRow.appendChild(tabBtn);
    }

    // Ferramentas Utilitárias Rápidas (Sempre Visíveis à Direita)
    const quickToolsSection = document.createElement('div');
    quickToolsSection.style.cssText = `margin-left: auto; display: flex; gap: 8px; align-items: center;`;

    const selectToolBtn = document.createElement('button');
    selectToolBtn.innerHTML = `<span>🖐️</span> <span>MÃO / MOVER</span>`;
    selectToolBtn.style.cssText = this.getPaletteButtonStyle(this.currentTool === 'select');
    selectToolBtn.onclick = () => this.selectTool('select');
    this.activeToolButtons.set('select', selectToolBtn);
    quickToolsSection.appendChild(selectToolBtn);

    const eraserToolBtn = document.createElement('button');
    eraserToolBtn.innerHTML = `<span>🧹</span> <span>BORRACHA</span>`;
    eraserToolBtn.style.cssText = this.getPaletteButtonStyle(this.currentTool === 'eraser');
    eraserToolBtn.onclick = () => this.selectTool('eraser');
    this.activeToolButtons.set('eraser', eraserToolBtn);
    quickToolsSection.appendChild(eraserToolBtn);

    categoryTabsRow.appendChild(quickToolsSection);
    bottomPalette.appendChild(categoryTabsRow);

    // CONTAINER DE FERRAMENTAS DINÂMICAS DA CATEGORIA ATIVA
    this.dynamicPaletteContainer = document.createElement('div');
    this.dynamicPaletteContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
      min-height: 48px;
    `;
    bottomPalette.appendChild(this.dynamicPaletteContainer);

    this.domRoot.appendChild(bottomPalette);
    document.body.appendChild(this.domRoot);

    this.renderDynamicPalette();
    this.updateChecklistStatus();
  }

  /**
   * Renderiza os itens dentro da categoria atualmente selecionada
   */
  private renderDynamicPalette(): void {
    if (!this.dynamicPaletteContainer) return;
    this.dynamicPaletteContainer.innerHTML = '';

    const isAzazel = this.editingChapter >= 2;

    // ABA 1: ESTRUTURAS & ALTARES
    if (this.activeCategory === 'structures') {
      const items: { id: string; name: string; icon: string }[] = [
        { id: 'player_spawn', name: 'Spawn da Nixy', icon: '👤' },
        { id: 'boss_portal', name: isAzazel ? 'Altar do Chefe: Azazel' : 'Altar do Chefe: Rosalin', icon: '🏛️' },
        { id: 'altar-1', name: 'Altar de Ascensão', icon: '✨' },
        { id: 'item_spawner', name: 'Spawner Item Aleatório', icon: '🎁' }
      ];

      for (const it of items) {
        const btn = document.createElement('button');
        btn.innerHTML = `<span style="font-size: 16px;">${it.icon}</span> <span style="font-size: 10px;">${it.name}</span>`;
        btn.style.cssText = this.getPaletteButtonStyle(this.currentTool === it.id);
        btn.onclick = () => this.selectTool(it.id);
        this.activeToolButtons.set(it.id, btn);
        this.dynamicPaletteContainer.appendChild(btn);
      }
    }
    // ABA 2: CENÁRIO & PROPS
    else if (this.activeCategory === 'props') {
      const props = MapEditorSystem.BASE_PALETTE.filter((p) => p.category === 'props');
      for (const it of props) {
        const btn = document.createElement('button');
        btn.innerHTML = `<span style="font-size: 16px;">${it.icon}</span> <span style="font-size: 10px;">${it.name}</span>`;
        btn.style.cssText = this.getPaletteButtonStyle(this.currentTool === it.id);
        btn.onclick = () => this.selectTool(it.id);
        this.activeToolButtons.set(it.id, btn);
        this.dynamicPaletteContainer.appendChild(btn);
      }
    }
    // ABA 3: TEXTURA DO CHÃO
    else if (this.activeCategory === 'floor') {
      const curFloor = this.currentMap.floorTexture || 'floor-tile';

      const textures = [
        { key: 'floor-tile', label: 'PISO 1: CATACUMBAS INFERNAIS (PADRÃO)', desc: 'Chão clássico de pedras vulcânicas do Capítulo 1' },
        { key: 'floor-tile-2', label: 'PISO 2: DIMENSÃO ABISSAL (CHAO 2)', desc: 'Textura corrompida de rochas obscuras do Capítulo 2' }
      ];

      for (const t of textures) {
        const isSelected = curFloor === t.key;
        const btn = document.createElement('button');
        btn.innerHTML = `
          <div style="font-weight: bold; font-size: 10px; color: ${isSelected ? '#facc15' : '#ffffff'};">${t.label}</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">${t.desc}</div>
        `;
        btn.style.cssText = `
          background: ${isSelected ? '#311042' : '#1e1730'};
          border: 2px solid ${isSelected ? '#facc15' : '#473268'};
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Silkscreen', monospace;
          text-align: left;
          transition: all 0.15s ease;
        `;
        btn.onclick = () => {
          this.currentMap.floorTexture = t.key;
          MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
          if ((this.scene as any).setArenaFloorTexture) {
            (this.scene as any).setArenaFloorTexture(t.key);
          }
          this.renderDynamicPalette();
          this.showToast(`Textura do chão alterada para: ${t.key === 'floor-tile' ? 'Catacumbas' : 'Dimensão Abissal'}!`);
          SoundManager.getInstance().playLevelUp();
        };
        this.dynamicPaletteContainer.appendChild(btn);
      }
    }
    // ABA 4: CHECKLIST OBRIGATÓRIO
    else if (this.activeCategory === 'checklist') {
      this.renderChecklistDetails();
    }
  }

  /**
   * Renderiza o painel explicativo da aba Checklist com todos os status em tempo real
   */
  private renderChecklistDetails(): void {
    if (!this.dynamicPaletteContainer) return;
    this.dynamicPaletteContainer.innerHTML = '';

    const status = this.getMapValidationStatus();

    const container = document.createElement('div');
    container.style.cssText = `display: flex; align-items: center; gap: 14px; flex-wrap: wrap; width: 100%;`;

    const makeCard = (valid: boolean, title: string, detail: string) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: ${valid ? '#062d22' : '#3d0a15'};
        border: 1px solid ${valid ? '#10b981' : '#f43f5e'};
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 9px;
      `;
      card.innerHTML = `
        <div style="font-weight: bold; color: ${valid ? '#34d399' : '#fb7185'};">${valid ? '✅' : '⚠️'} ${title}</div>
        <div style="color: #cbd5e1; font-size: 8px; margin-top: 2px;">${detail}</div>
      `;
      return card;
    };

    container.appendChild(makeCard(
      status.hasPlayerSpawn,
      'SPAWN DA NIXY',
      status.hasPlayerSpawn ? `Configurado em (${this.currentMap.playerSpawn.x}, ${this.currentMap.playerSpawn.y})` : 'Falta posicionar no mapa!'
    ));

    const bossName = this.editingChapter >= 2 ? 'Azazel' : 'Rosalin';
    container.appendChild(makeCard(
      status.hasBossPortal,
      `ALTAR DE ${bossName.toUpperCase()}`,
      status.hasBossPortal ? `Posicionado em (${this.currentMap.bossPortal.x}, ${this.currentMap.bossPortal.y})` : 'Falta posicionar o altar do chefe!'
    ));

    container.appendChild(makeCard(
      status.hasAscensionAltar,
      'ALTAR DE ASCENSÃO',
      status.hasAscensionAltar ? `${status.ascensionCount} instalado(s) no mapa` : 'Obrigatório ter pelo menos 1 altar de ascensão!'
    ));

    container.appendChild(makeCard(
      status.hasEnoughItemSpawners,
      'SPAWNERS DE ITENS',
      status.hasEnoughItemSpawners ? `${status.itemSpawnersCount} instalados (Mínimo 4 ✅)` : `${status.itemSpawnersCount}/4 instalados (Faltam ${4 - status.itemSpawnersCount})`
    ));

    this.dynamicPaletteContainer.appendChild(container);
  }

  private getMapValidationStatus(): {
    hasPlayerSpawn: boolean;
    hasBossPortal: boolean;
    hasAscensionAltar: boolean;
    ascensionCount: number;
    hasEnoughItemSpawners: boolean;
    itemSpawnersCount: number;
    isAllValid: boolean;
  } {
    const hasPlayerSpawn = Boolean(this.currentMap.playerSpawn && typeof this.currentMap.playerSpawn.x === 'number');
    const hasBossPortal = Boolean(this.currentMap.bossPortal && typeof this.currentMap.bossPortal.x === 'number');
    const ascensionCount = this.currentMap.props.filter((p) => p.type === 'altar-1').length;
    const hasAscensionAltar = ascensionCount >= 1;
    const itemSpawnersCount = this.currentMap.itemSpawners?.length ?? 0;
    const hasEnoughItemSpawners = itemSpawnersCount >= 4;

    const isAllValid = hasPlayerSpawn && hasBossPortal && hasAscensionAltar && hasEnoughItemSpawners;

    return {
      hasPlayerSpawn,
      hasBossPortal,
      hasAscensionAltar,
      ascensionCount,
      hasEnoughItemSpawners,
      itemSpawnersCount,
      isAllValid
    };
  }

  private updateChecklistStatus(): void {
    const status = this.getMapValidationStatus();
    const checklistTab = this.categoryTabButtons.get('checklist');
    if (checklistTab) {
      checklistTab.innerHTML = `<span>📋</span> <span>CHECKLIST ${status.isAllValid ? '✅' : '⚠️'}</span>`;
    }
  }

  private selectTool(toolId: string): void {
    this.currentTool = toolId;
    for (const [id, btn] of this.activeToolButtons.entries()) {
      btn.style.cssText = this.getPaletteButtonStyle(id === toolId);
    }
    const def = MapEditorSystem.BASE_PALETTE.find((p) => p.id === toolId);
    if (def) {
      this.showToast(`Ferramenta: [${def.name}]`);
    }
  }

  private updateHudBadges(): void {
    if (!this.coordBadge) return;
    const cam = this.scene.cameras.main;
    const centerX = Math.round(cam.scrollX + cam.width / 2);
    const centerY = Math.round(cam.scrollY + cam.height / 2);
    const zoom = cam.zoom.toFixed(1);
    this.coordBadge.textContent = `X: ${centerX} | Y: ${centerY} | Zoom: ${zoom}x`;
  }

  /**
   * Aplica o mapa customizado diretamente no jogo e fecha o editor para teste imediato
   */
  public applyAndTestCurrentMap(): void {
    const status = this.getMapValidationStatus();
    if (!status.isAllValid) {
      const warnings: string[] = [];
      if (!status.hasPlayerSpawn) warnings.push('Spawn da Nixy');
      if (!status.hasBossPortal) warnings.push('Altar do Chefe');
      if (!status.hasAscensionAltar) warnings.push('Altar de Ascensão (altar-1)');
      if (!status.hasEnoughItemSpawners) warnings.push(`Spawners de Itens (mín. 4, atual: ${status.itemSpawnersCount})`);

      const proceed = confirm(
        `Atenção! Os seguintes itens obrigatórios estão incompletos:\n- ${warnings.join('\n- ')}\n\nDeseja testar mesmo assim?`
      );
      if (!proceed) {
        this.activeCategory = 'checklist';
        this.renderDynamicPalette();
        return;
      }
    }

    MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
    this.close();

    this.scene.loadCustomMapLayout(this.currentMap);
    this.showToast('MAPA CARREGADO COM SUCESSO! BOM JOGO!', '#10b981');
    DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Mapa Customizado Aplicado para Teste.', this.currentMap);
  }

  public downloadMapJsonFile(): void {
    MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
    const jsonStr = JSON.stringify(this.currentMap, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa_capitulo_${this.currentMap.chapter}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('ARQUIVO .JSON BAIXADO COM SUCESSO!', '#38bdf8');
  }

  public copyMapJsonToClipboard(): void {
    MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
    const jsonStr = JSON.stringify(this.currentMap, null, 2);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        this.showToast('CÓDIGO JSON COPIADO! Cole aqui no chat para aplicarmos permanentemente.', '#a855f7');
      }).catch(() => {
        this.fallbackCopyText(jsonStr);
      });
    } else {
      this.fallbackCopyText(jsonStr);
    }
  }

  private fallbackCopyText(text: string): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    this.showToast('CÓDIGO JSON COPIADO PARA A ÁREA DE TRANSFERÊNCIA!', '#a855f7');
  }

  private openImportModal(): void {
    const jsonInput = prompt('Cole aqui o código JSON do mapa que deseja carregar:');
    if (!jsonInput) return;

    try {
      const parsed = JSON.parse(jsonInput) as ChapterMapConfig;
      if (!parsed.playerSpawn || !parsed.bossPortal || !Array.isArray(parsed.props)) {
        alert('Formato de JSON inválido! O mapa precisa conter playerSpawn, bossPortal e props.');
        return;
      }

      this.currentMap = parsed;
      MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
      this.renderAllMapEntities();
      this.updateChecklistStatus();
      this.showToast('Mapa importado com sucesso a partir do JSON!', '#10b981');
    } catch (e) {
      alert('Erro ao interpretar JSON! Certifique-se de que colou o conteúdo válido.');
    }
  }

  private showToast(msg: string, color: string = '#facc15'): void {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      top: 75px;
      left: 50%;
      transform: translateX(-50%);
      background: #110e1c;
      color: ${color};
      border: 2px solid ${color};
      padding: 8px 16px;
      font-size: 11px;
      border-radius: 6px;
      z-index: 100000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      font-family: 'Silkscreen', 'Press Start 2P', monospace;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  private getActionButtonStyle(accentColor: string, isPrimary: boolean = false): string {
    return `
      background: ${isPrimary ? accentColor : '#1e1730'};
      color: ${isPrimary ? '#0b090a' : accentColor};
      border: 1px solid ${accentColor};
      padding: 6px 12px;
      border-radius: 5px;
      font-size: 10px;
      font-family: 'Silkscreen', monospace;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
  }

  private getCategoryTabStyle(isActive: boolean, accentColor: string): string {
    return `
      background: ${isActive ? accentColor : '#1e1730'};
      color: ${isActive ? '#0b090a' : '#cbd5e1'};
      border: 2px solid ${accentColor};
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Silkscreen', monospace;
      font-weight: bold;
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    `;
  }

  private getPaletteButtonStyle(isActive: boolean): string {
    return `
      background: ${isActive ? '#8b5cf6' : '#1e1730'};
      color: ${isActive ? '#ffffff' : '#cbd5e1'};
      border: 2px solid ${isActive ? '#c084fc' : '#33264d'};
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Silkscreen', monospace;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.12s ease;
    `;
  }

  private destroyDomOverlay(): void {
    this.domRoot?.remove();
    this.domRoot = undefined;
    this.coordBadge = undefined;
    this.gridButton = undefined;
    this.activeToolButtons.clear();
    this.categoryTabButtons.clear();
    this.dynamicPaletteContainer = undefined;
  }

  public destroy(): void {
    this.close();
    this.destroyGhostPreview();
    this.clearEditorDisplay();
  }
}

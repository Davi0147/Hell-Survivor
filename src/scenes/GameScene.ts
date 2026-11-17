import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { SkullSlime } from '../entities/enemies/SkullSlime';
import { BloodBat } from '../entities/enemies/BloodBat';
import { MummyEnemy, PoisonPuddle } from '../entities/enemies/MummyEnemy';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import { AzazelBoss, AzazelPhantomClone } from '../entities/enemies/AzazelBoss';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { SoulBoltProjectile } from '../entities/weapons/SoulBoltProjectile';
import { BaseWeapon } from '../entities/weapons/BaseWeapon';
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { CorruptedSoulItem } from '../entities/items/CorruptedSoulItem';
import { MetaProgressManager } from '../systems/MetaProgressManager';
import { MapItem, MapItemType } from '../entities/items/MapItem';
import { EvolutionAltar } from '../entities/items/EvolutionAltar';
import type { BossSummonAltar } from '../entities/items/BossSummonAltar';
import type { AzazelCrystal } from '../entities/items/AzazelCrystal';
import { UltimateSystem } from '../systems/UltimateSystem';
import { DialogueLine } from '../systems/DialogueSystem';
import { SoundManager } from '../systems/SoundManager';
import { DebugSessionLogger } from '../systems/DebugSessionLogger';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import { PERFORMANCE_LIMITS, ARENA_CONFIG, getChapterConfig } from '../config/balance';
import { UIScene } from './UIScene';
import { GamepadManager } from '../systems/GamepadManager';
import { TestShowroomSystem } from '../systems/TestShowroomSystem';
import { MapEditorSystem } from '../systems/MapEditorSystem';
import { MapStorageManager, ChapterMapConfig } from '../config/mapData';
import { SandboxController, ISandboxContext, HordeEnemyType } from '../systems/SandboxController';
import { CombatBubbleSystem, ICombatBubbleContext, ICombatBubbleTarget } from '../systems/CombatBubbleSystem';
import { ArenaScenerySystem, ISceneryContext } from '../systems/ArenaScenerySystem';
import { CHAPTER_OPENING_DIALOGUE, getStoryRevivalDialogue } from '../config/dialogues';
import { EnemySpawnSystem, IEnemySpawnContext } from '../systems/EnemySpawnSystem';
import { PickupSpawnSystem, IPickupSpawnContext } from '../systems/PickupSpawnSystem';
import { PlayerInputSystem } from '../systems/PlayerInputSystem';
import { BossFightSystem, IBossFightContext, BossId } from '../systems/BossFightSystem';
import { RunEndSystem, IRunEndContext } from '../systems/RunEndSystem';
import { FONTS, getArenaFloorTint } from '../config/theme';
import { CombatFeelSystem, ICombatFeelContext } from '../systems/CombatFeelSystem';
import { HordeEventSystem, IHordeEventContext } from '../systems/HordeEventSystem';

export class GameScene extends Phaser.Scene implements ISandboxContext, ICombatBubbleContext, ISceneryContext, IEnemySpawnContext, IPickupSpawnContext, IBossFightContext, IRunEndContext, ICombatFeelContext, IHordeEventContext {
  public player!: Nixy;
  private floorTile!: Phaser.GameObjects.TileSprite;

  // Controlador do Modo Sandbox / Testes
  public sandboxController!: SandboxController;

  // Sistema de Balões de Fala de Combate (Pacote 3 — Etapa 2)
  public combatBubbleSystem!: CombatBubbleSystem;

  // Sistema de Cenário e Limites da Arena (Pacote 3 — Etapa 3)
  public arenaScenerySystem!: ArenaScenerySystem;

  // Sistema de Spawn de Inimigos, Elites e Minichefes
  public enemySpawner!: EnemySpawnSystem;
  public pickupSpawner!: PickupSpawnSystem;

  // Lutas de chefe (altar, fases, recompensas) e fim de jogo (morte e Pacto Demoníaco)
  public bossFights!: BossFightSystem;
  private runEnd!: RunEndSystem;

  // Ritmo de combate (combo, Frenesi, críticos, impacto) e diretor de eventos de horda
  public combatFeel?: CombatFeelSystem;
  public hordeEvents?: HordeEventSystem;

  /** Maior sequência de abates da partida (tela de fim de jogo). */
  public get maxCombo(): number {
    return this.combatFeel?.combo.maxCombo ?? 0;
  }

  // Modo de Jogo e Campanha
  public gameMode: 'story' | 'endless' | 'sandbox' = 'story';
  public currentChapter: number = 1;

  public get sandboxGodMode(): boolean {
    return this.sandboxController?.godMode ?? (this.gameMode === 'sandbox');
  }
  public set sandboxGodMode(v: boolean) {
    if (this.sandboxController) this.sandboxController.godMode = v;
  }

  public get sandboxInfiniteUlt(): boolean {
    return this.sandboxController?.infiniteUlt ?? false;
  }
  public set sandboxInfiniteUlt(v: boolean) {
    if (this.sandboxController) this.sandboxController.infiniteUlt = v;
  }

  public get sandboxInfiniteStamina(): boolean {
    return this.sandboxController?.infiniteStamina ?? false;
  }
  public set sandboxInfiniteStamina(v: boolean) {
    if (this.sandboxController) this.sandboxController.infiniteStamina = v;
  }

  public get sandboxAutoSpawn(): boolean {
    return this.sandboxController?.autoSpawn ?? false;
  }
  public set sandboxAutoSpawn(v: boolean) {
    if (this.sandboxController) this.sandboxController.autoSpawn = v;
  }

  public get sandboxShowHitboxes(): boolean {
    return this.sandboxController?.showHitboxes ?? false;
  }
  public set sandboxShowHitboxes(v: boolean) {
    if (this.sandboxController) this.sandboxController.showHitboxes = v;
  }

  public testShowroomSystem?: TestShowroomSystem;
  public mapEditorSystem?: MapEditorSystem;
  private mapEditorLauncherButton?: Phaser.GameObjects.Container;

  public chapterPurifiedSouls: number = 0;
  public chapterTargetSouls: number = 900;
  public isBossFightActive: boolean = false;
  public bossInstance?: SuccubusBoss;
  public azazelBoss?: AzazelBoss;
  public isPlayerMovementLocked: boolean = false;
  public survivalTimeMs: number = 0;
  public isChapterCompleted: boolean = false;
  public isGameOver: boolean = false;
  public miniBoss3mSpawned: boolean = false;
  public boss10mSpawned: boolean = false;
  public isRevival: boolean = false;
  public isUpgradeSceneOpening: boolean = false;

  // Estado das lutas de chefe exposto para HUD, radar e Modo de Teste (mora no BossFightSystem)
  public get azazelCrystals(): AzazelCrystal[] {
    return this.bossFights?.crystals ?? [];
  }
  public get azazelCrystalsCaptured(): number {
    return this.bossFights?.crystalsCaptured ?? 0;
  }
  public get isAzazelPhase3HordeActive(): boolean {
    return this.bossFights?.isPhase3HordeActive ?? false;
  }
  public set isAzazelPhase3HordeActive(active: boolean) {
    if (this.bossFights) this.bossFights.isPhase3HordeActive = active;
  }
  public get hasRevivalUsed(): boolean {
    return this.runEnd?.hasRevivalUsed ?? false;
  }

  // Sistema de Combate e Armas
  public weapons: BaseWeapon[] = [];
  public soulBoltWeapon!: SoulBoltWeapon;
  public enemiesGroup!: Phaser.GameObjects.Group;
  public gemsGroup!: Phaser.GameObjects.Group;
  public soulsGroup!: Phaser.GameObjects.Group;
  public mapItemsGroup!: Phaser.GameObjects.Group;
  public altarInstance: EvolutionAltar | null = null;
  public bossSummonAltar: BossSummonAltar | null = null;
  public isHordeSpawningPaused: boolean = false;
  private spawnTimer: number = 0;
  public killCount: number = 0;
  private playerInvulnerableTimer: number = 0;
  public poisonPuddles: PoisonPuddle[] = [];

  // Elementos de Cenário e Fumaça nas Bordas (delegados ao ArenaScenerySystem)
  public get sceneryProps(): Phaser.GameObjects.GameObject[] {
    return this.arenaScenerySystem ? this.arenaScenerySystem.sceneryProps : [];
  }
  public set sceneryProps(props: Phaser.GameObjects.GameObject[]) {
    if (this.arenaScenerySystem) {
      this.arenaScenerySystem.sceneryProps = props;
    }
  }

  public get borderMistEmitter(): Phaser.GameObjects.Particles.ParticleEmitter | undefined {
    return this.arenaScenerySystem?.borderMistEmitter;
  }
  public set borderMistEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter | undefined) {
    if (this.arenaScenerySystem) {
      this.arenaScenerySystem.borderMistEmitter = emitter;
    }
  }

  public get lastMistCheckTime(): number {
    return this.arenaScenerySystem ? this.arenaScenerySystem.lastMistCheckTime : 0;
  }
  public set lastMistCheckTime(time: number) {
    if (this.arenaScenerySystem) {
      this.arenaScenerySystem.lastMistCheckTime = time;
    }
  }

  // Teclas de controle
  private playerInput!: PlayerInputSystem;
  private keyE!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('GameScene');
  }

  init(data?: { mode?: 'story' | 'endless' | 'sandbox'; isRevival?: boolean; chapter?: number }): void {
    this.gameMode = data?.mode ?? 'story';
    this.currentChapter = data?.chapter ?? 1;
    this.isRevival = data?.isRevival ?? false;
    MetaProgressManager.getInstance().finalizeRunSouls();
    this.sandboxController = new SandboxController(this);

    this.chapterPurifiedSouls = 0;
    this.chapterTargetSouls = getChapterConfig(this.currentChapter).targetSouls;
    this.killCount = 0;
    this.isBossFightActive = false;
    this.isChapterCompleted = false;
    this.isGameOver = false;
    this.miniBoss3mSpawned = false;
    this.boss10mSpawned = false;
    this.survivalTimeMs = 0;
    this.bossInstance = undefined;
    this.azazelBoss = undefined;
    this.isPlayerMovementLocked = false;
    this.altarInstance = null;
    this.bossSummonAltar = null;
    this.isHordeSpawningPaused = false;
    this.spawnTimer = 0;
    this.playerInvulnerableTimer = 0;
    this.poisonPuddles = [];
    this.weapons = [];
    this.combatFeel = undefined;
    this.hordeEvents = undefined;
    this.clearCombatSpeechBubbles();
    this.arenaScenerySystem?.destroy();
    this.arenaScenerySystem = undefined!;
    this.testShowroomSystem = undefined;
    this.mapEditorSystem = undefined;
    this.mapEditorLauncherButton = undefined;

    DebugSessionLogger.getInstance().startNewSession(this.gameMode);
  }

  create(): void {
    const { width, height } = this.scale;

    this.time.timeScale = 1;
    if (this.physics?.world) {
      this.physics.world.timeScale = 1;
      this.physics.resume();
    }
    if (this.input.keyboard) {
      this.input.keyboard.resetKeys();
    }

    SoundManager.getInstance().setScene(this);
    // Inicia a música de batalha com fade-in suave
    SoundManager.getInstance().playBattleMusic(3000);

    // Inicializa o controlador do Modo Sandbox
    if (!this.sandboxController) {
      this.sandboxController = new SandboxController(this);
    }

    // Inicializa o sistema de balões de fala de combate (Pacote 3 — Etapa 2)
    if (!this.combatBubbleSystem) {
      this.combatBubbleSystem = new CombatBubbleSystem(this);
    }

    // Inicializa o sistema de cenário e limites da arena (Pacote 3 — Etapa 3)
    if (!this.arenaScenerySystem) {
      this.arenaScenerySystem = new ArenaScenerySystem(this);
    this.enemySpawner = new EnemySpawnSystem(this, this);
    }
    // Recriado a cada partida para zerar o relógio do Altar de Ascensão
    this.pickupSpawner = new PickupSpawnSystem(this, this);
    this.bossFights = new BossFightSystem(this, this);
    this.runEnd = new RunEndSystem(this, this);

    // 1. Chão infinito repetido (TileSprite duplicando a textura do piso ativo em proporção adequada)
    const floorScale = 0.10;
    this.floorTile = this.add.tileSprite(width / 2, height / 2, width * 2, height * 2, 'floor-tile');
    this.floorTile.setOrigin(0.5);
    this.floorTile.setScrollFactor(0);
    this.floorTile.setDepth(-100);
    this.floorTile.setTileScale(floorScale, floorScale);
    // Chão escurecido para destacar monstros e heroína; a cor muda por capítulo
    this.floorTile.setTint(getArenaFloorTint('floor-tile', this.currentChapter));

    // 2. Carrega o mapa ativo do capítulo correspondente (Cap 1 ou Cap 2)
    const activeMap = MapStorageManager.getActiveMap(this.currentChapter);
    const spawnX = activeMap.playerSpawn?.x ?? 0;
    const spawnY = activeMap.playerSpawn?.y ?? 0;

    // 2. Instanciação da Nixy na posição de spawn do mapa
    this.player = new Nixy(this, spawnX, spawnY);
    this.player.setDepth(20);

    // 2.1. Animação ritual da Estrela de Respawn (Pentagrama de Invocação) nos pés de Nixy
    this.playRespawnStarEffect();

    // 3. Câmera travada no jogador com zoom 2x inteiro e pixels arredondados (pixel-perfect)
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setRoundPixels(true);

    // 3.1. Configuração dos Limites Rígidos da Arena e Câmera (6400 x 6400 px)
    this.physics.world.setBounds(ARENA_CONFIG.MIN_X, ARENA_CONFIG.MIN_Y, ARENA_CONFIG.WIDTH, ARENA_CONFIG.HEIGHT);
    this.cameras.main.setBounds(ARENA_CONFIG.MIN_X, ARENA_CONFIG.MIN_Y, ARENA_CONFIG.WIDTH, ARENA_CONFIG.HEIGHT);
    this.player.setCollideWorldBounds(true);

    // 3.2. Desenha o abismo e a bruma mística nas bordas da arena
    this.drawArenaBorders();

    // 3.3. Inicialização dos Grupos de Entidades e Itens antes de carregar o layout do mapa
    this.enemiesGroup = this.add.group({
      classType: BaseEnemy,
      runChildUpdate: false
    });

    this.gemsGroup = this.add.group({
      classType: SoulGem,
      runChildUpdate: false
    });

    this.soulsGroup = this.add.group({
      classType: CorruptedSoulItem,
      runChildUpdate: false
    });

    this.mapItemsGroup = this.add.group({
      classType: MapItem,
      runChildUpdate: false
    });

    // 3.35. Ritmo de combate e diretor de eventos (precisam do jogador e do grupo de inimigos)
    this.combatFeel = new CombatFeelSystem(this, this);
    this.hordeEvents = new HordeEventSystem(this, this, this.enemySpawner);

    // 3.4. Instancia os Elementos de Cenário, Altar e Itens respeitando o layout do mapa ativo
    this.loadCustomMapLayout(activeMap);

    // Sincronizar o chão infinito no POST_UPDATE compensando o scroll da câmera
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, () => {
      if (this.floorTile && this.cameras.main) {
        this.floorTile.tilePositionX = Math.round(this.cameras.main.scrollX / floorScale);
        this.floorTile.tilePositionY = Math.round(this.cameras.main.scrollY / floorScale);
      }
    });

    // 4. Controles de movimento (teclado, gamepad, toque e bot [F3])
    this.playerInput = new PlayerInputSystem(this, {
      onUltimatePressed: () => {
        if (this.player.isUltimateReady && !this.isGameOver) this.triggerUltimate();
      },
      onPausePressed: () => {
        if (this.isGameOver || this.isChapterCompleted || this.scene.isActive('UpgradeScene')) return;
        const uiScene = this.scene.get('UIScene') as UIScene;
        if (uiScene) uiScene.togglePause(this);
      }
    });

    // Atalhos de teclado (Suprema e pausa)
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.keyE = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

      this.keyE.on('down', () => {
        if (this.player.isUltimateReady && !this.isGameOver) {
          this.triggerUltimate();
        }
      });

      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
        if (!this.isGameOver && !this.isChapterCompleted && !this.scene.isActive('UpgradeScene')) {
          const uiScene = this.scene.get('UIScene') as UIScene;
          if (uiScene) {
            uiScene.togglePause(this);
          }
        }
      });

      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3).on('down', () => {
        const active = AutoPlayTestAgent.getInstance().toggle();
        const uiScene = this.scene.get('UIScene') as UIScene | undefined;
        if (uiScene) {
          uiScene.showWaveAlert(
            active ? 'BOT IA: TESTE AUTÔNOMO ATIVADO [F3]' : 'BOT IA: CONTROLE MANUAL RESTAURADO [F3]',
            2500
          );
        }
      });

      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => {
        if (this.gameMode === 'sandbox' && !this.isGameOver) {
          this.mapEditorSystem?.toggle();
        }
      });
    }

    // 5. Inicialização de Armas e Armamento da Nixy
    this.weapons = [];
    this.soulBoltWeapon = new SoulBoltWeapon(this, this.player);
    this.weapons.push(this.soulBoltWeapon);

    // Escutar Level Up da heroína com Fila Segura Anti-Crash
    this.player.on('player-level-up', () => {
      this.checkAndOpenUpgradeScene();
    });

    // 6. Configuração de Colisão Projétil -> Inimigo
    this.registerSoulBoltOverlap(this.soulBoltWeapon);

    // 6.1. Configuração de Coleta de Itens do Mapa (Cálice, Ímã, Baú)
    this.physics.add.overlap(
      this.player,
      this.mapItemsGroup,
      (_playerObj, itemObj) => {
        const item = itemObj as MapItem;
        if (item.active && !this.isGameOver) {
          DebugSessionLogger.getInstance().log('ITEM', 'INFO', `Item coletado: ${item.itemType}`);
          item.collect(this.player, this);
        }
      }
    );

    // 6.2. Configuração de Coleta de Gemas de Alma (Garante 100% de absorção por contato)
    this.physics.add.overlap(
      this.player,
      this.gemsGroup,
      (_playerObj, gemObj) => {
        const gem = gemObj as SoulGem;
        if (gem.active && !this.isGameOver) {
          gem.collect(this.player);
        }
      }
    );

    // 6.3. Configuração de Coleta de Almas Corrompidas
    this.physics.add.overlap(
      this.player,
      this.soulsGroup,
      (_playerObj, soulObj) => {
        const soul = soulObj as CorruptedSoulItem;
        if (soul.active && !this.isGameOver) {
          soul.collect(this.player);
        }
      }
    );

    // 7. Configuração de Colisão Inimigo -> Nixy (Dano de contato e Knockback)
    this.physics.add.overlap(
      this.player,
      this.enemiesGroup,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        // Quem não causa dano (Ladrão de Almas) não fere; durante a esquiva nada acerta
        if (enemy.active && !enemy.isDead && enemy.damage > 0 && this.playerInvulnerableTimer <= 0 && !this.player.isDashInvulnerable && !this.isGameOver) {
          this.playerInvulnerableTimer = 450; // Tempo de imunidade contra hit consecutivo
          if (this.sandboxGodMode) {
            DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Hit de contato bloqueado (God Mode): ${enemy.damage} dano`);
            if (enemy instanceof MummyEnemy) {
              enemy.onPlayerCollide(this.player);
            }
            return;
          }
          SoundManager.getInstance().playPlayerHurt();
          this.player.takeDamage(enemy.damage);
          if (enemy instanceof MummyEnemy) {
            enemy.onPlayerCollide(this.player);
          }
          DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Nixy recebeu ${enemy.damage} de dano de contato`, {
            hpRestante: Math.ceil(this.player.currentHp)
          });
          this.cameras.main.shake(120, 0.005);
          GamepadManager.getInstance().vibrate(this, 180, 0.4, 0.6);
          this.player.setTint(0xff3333);
          this.time.delayedCall(150, () => {
            if (!this.isGameOver) {
              if (this.player.isRooted) {
                this.player.setTint(0x55ff77);
              } else {
                this.player.clearTint();
              }
            }
          });
        }
      }
    );

    // 8. Inicialização da Interface (UIScene em camada separada desacoplada do zoom da câmera)
    const ui = this.scene.get('UIScene');
    if (ui && this.scene.isActive('UIScene')) {
      ui.scene.restart();
    } else {
      this.scene.launch('UIScene');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.POST_UPDATE);
      this.events.off(Phaser.Scenes.Events.PRE_RENDER);
      if (this.player) {
        this.player.off('player-level-up');
      }
      this.isUpgradeSceneOpening = false;
      if (this.input.keyboard) {
        this.input.keyboard.removeAllKeys(true);
        this.input.keyboard.removeAllListeners();
      }
      this.input.removeAllListeners();
      this.time.removeAllEvents();

      MetaProgressManager.getInstance().finalizeRunSouls();
      this.clearCombatSpeechBubbles();
      this.scene.stop('UIScene');
      this.sandboxController?.destroy();
      this.combatFeel?.destroy();
      this.hordeEvents?.destroy();
      this.bossFights?.destroy();
      this.combatBubbleSystem?.destroy();
      this.combatBubbleSystem = undefined!;
      this.arenaScenerySystem?.destroy();
      this.arenaScenerySystem = undefined!;
      this.testShowroomSystem?.destroy();
      this.mapEditorSystem?.destroy();
      if (this.mapEditorLauncherButton) {
        this.mapEditorLauncherButton.destroy();
        this.mapEditorLauncherButton = undefined;
      }
    });

    // Os itens iniciais de exploração são instanciados exclusivamente via loadCustomMapLayout(activeMap)

    // Spawns Iniciais de Monstros (apenas Cães Zumbis no início de História/Infinito; limpo no Sandbox)
    if (this.gameMode === 'sandbox') {
      // No Modo de Teste a arena começa limpa e pronta para os comandos do usuário
      DebugSessionLogger.getInstance().log('SANDBOX', 'INFO', 'Arena Sandbox pronta. God Mode ativo por padrão.');
      this.testShowroomSystem = new TestShowroomSystem(this);
      this.testShowroomSystem.init();

      // Inicializa o Editor de Mapas completo do Capítulo 1 / Sandbox
      this.mapEditorSystem = new MapEditorSystem(this);
      this.createMapEditorLauncherButton();
    } else if (this.gameMode === 'endless') {
      this.spawnZombieDogAt(-220, -100);
      this.spawnZombieDogAt(220, -120);
      this.spawnZombieDogAt(-160, 160);
      this.spawnZombieDogAt(180, 150);
    } else {
      // No Modo História: Inicia com o diálogo adaptado da fuga/capítulo ou com a fala de ressurreição (estilo Hades)
      this.time.delayedCall(200, () => {
        let dialogueLines: DialogueLine[];

        if (this.isRevival) {
          // Mecânica de Ressurreição Estilo Hades com Ódio Crescente a cada morte
          const deathCount = Math.max(1, MetaProgressManager.getInstance().getStoryDeathCount());
          dialogueLines = getStoryRevivalDialogue(deathCount);

          const rageIntensity = Math.min(0.032, 0.016 + deathCount * 0.002);
          this.cameras.main.flash(350 + Math.min(250, deathCount * 25), 180, 0, 70);
          this.cameras.main.shake(260 + Math.min(200, deathCount * 20), rageIntensity);
        } else if (this.currentChapter === 2) {
          dialogueLines = CHAPTER_OPENING_DIALOGUE[2];
        } else {
          // Chegada inicial logo após chutar a mesa e fugir do escritório
          dialogueLines = CHAPTER_OPENING_DIALOGUE[1];
        }

        this.playDialogue(dialogueLines, () => {
          // Os primeiros monstros surgem somente APÓS a conclusão do diálogo! (Apenas Cães na Fase 1)
          const px = this.player.x;
          const py = this.player.y;
          this.spawnZombieDogAt(px - 220, py - 100);
          this.spawnZombieDogAt(px + 220, py - 120);
          this.spawnZombieDogAt(px - 160, py + 160);
          this.spawnZombieDogAt(px + 180, py + 150);
        });
      });
    }
  }

  /**
   * Abre a tela de upgrades a partir da fila segura de níveis pendentes
   */
  public checkAndOpenUpgradeScene(): void {
    if (this.isGameOver || this.isChapterCompleted) return;
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene && (uiScene.isDialogueActive() || uiScene.isChestRouletteActive())) return;
    if (!this.player || this.player.pendingLevelUps <= 0) return;
    if (this.scene.isActive('UpgradeScene') || this.isUpgradeSceneOpening) return;

    this.isUpgradeSceneOpening = true;
    this.player.pendingLevelUps--;
    DebugSessionLogger.getInstance().log('UPGRADE', 'INFO', `Nixy alcançou o Nível ${this.player.currentLevel} (Níveis na Fila: ${this.player.pendingLevelUps})`);
    this.cameras.main.flash(220, 255, 215, 0);
    this.combatFeel?.queueLevelUpNova();
    this.physics.pause();
    this.scene.pause();

    const upgradeScene = this.scene.get('UpgradeScene');
    if (upgradeScene) {
      upgradeScene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.isUpgradeSceneOpening = false;
      });
    }

    this.scene.launch('UpgradeScene', { player: this.player, gameScene: this });
  }

  /**
   * Dispara um diálogo na UIScene (1:1 com a tela) pausando a física da arena
   */
  public playDialogue(lines: DialogueLine[], onComplete: () => void): void {
    const uiScene = this.scene.get('UIScene') as UIScene;
    this.physics.pause();
    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
    if (uiScene) {
      uiScene.startDialogue(lines, () => {
        if (!this.isChapterCompleted) {
          this.physics.resume();
        }
        onComplete();
      });
    } else {
      if (!this.isChapterCompleted) {
        this.physics.resume();
      }
      onComplete();
    }
  }

  update(_time: number, delta: number): void {
    // Se o Editor de Mapas estiver aberto, processa câmera livre e ignora movimentação da Nixy e combate
    if (this.mapEditorSystem?.isOpen) {
      this.mapEditorSystem.update(delta);
      return;
    }

    // Se o jogo acabou ou capítulo foi concluído ou diálogo/roleta de baú estiver ativo, congela toda a ação do jogo
    if (this.isGameOver || this.isChapterCompleted) return;
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene && (uiScene.isDialogueActive() || uiScene.isChestRouletteActive())) return;

    // Fila de escolhas de melhoria pendentes (garante que múltiplos níveis ganhos de uma vez sejam ofertados em sequência)
    if (this.player && this.player.pendingLevelUps > 0 && !this.scene.isActive('UpgradeScene') && !this.isUpgradeSceneOpening) {
      this.checkAndOpenUpgradeScene();
      return;
    }

    // Vida zerada: Pacto Demoníaco, ou fim de partida
    if (this.runEnd.checkPlayerDeath()) return;

    if (this.sandboxInfiniteUlt) {
      this.player.ultimateCharge = this.player.maxUltimateCharge;
    }

    if (this.sandboxInfiniteStamina) {
      this.player.currentStamina = this.player.maxStamina;
      this.player.isStaminaExhausted = false;
    }

    this.survivalTimeMs += delta;

    // 1. Controles (teclado, gamepad, toque ou bot [F3]); travas cinematográficas zeram o movimento
    const move = this.playerInput.read(delta, this.isPlayerMovementLocked);

    // 1.1. Esquiva: um toque = uma arrancada com invulnerabilidade
    if (move.isDash) this.player.tryDash(move.dx, move.dy);

    // 1.2. Combo, Frenesi e bônus de XP do momento (combo + evento de horda)
    this.combatFeel?.update(delta);
    this.hordeEvents?.update(delta);
    this.player.xpGainMultiplier = 1 + (this.combatFeel?.xpBonus ?? 0) + (this.hordeEvents?.xpBonus ?? 0);

    // 2. Atualizar lógica e animações da Nixy
    this.player.updateNixy(move.dx, move.dy, move.isSprint, delta);

    // 3. Atualizar tempo de imunidade
    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer -= delta;
    }

    // 4. Atualizar Todas as Armas Ativas
    for (const weapon of this.weapons) {
      const custom = weapon as BaseWeapon & { updateWeapon?: (d: number, x: number, y: number, g: Phaser.GameObjects.Group) => void };
      if (typeof custom.updateWeapon === 'function') {
        custom.updateWeapon(delta, this.player.x, this.player.y, this.enemiesGroup);
      } else {
        weapon.update(delta, this.player.x, this.player.y, this.enemiesGroup);
      }
    }

    // Limites de Câmera para Otimização de Renderização (Viewport Culling)
    const cam = this.cameras.main;
    const worldView = cam.worldView;
    const margin = PERFORMANCE_LIMITS.VIEWPORT_CULLING_MARGIN;
    const cLeft = worldView.x - margin;
    const cRight = worldView.right + margin;
    const cTop = worldView.y - margin;
    const cBottom = worldView.bottom + margin;

    // 5. Gemas, almas, itens de mapa e Altar de Ascensão (culling, coleta e surgimento)
    this.pickupSpawner.update(delta);

    // 5.4. Lutas de chefe: altar, cristais, reforços e exaustão
    this.bossFights.update(delta);

    // 5.5. Atualizar Poças de Veneno da Múmia no Chão (desacoplado do ciclo de vida dos inimigos)
    for (let i = this.poisonPuddles.length - 1; i >= 0; i--) {
      const p = this.poisonPuddles[i];
      if (p && p.active) {
        p.updatePuddle(delta, this.player, this.time.now);
      } else {
        this.poisonPuddles.splice(i, 1);
      }
    }

    // 6. Atualizar Inimigos Ativos (Culling + IA de Cada Espécie)
    const enemies = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.active) {
        if (!(e instanceof AzazelBoss) && !(e instanceof AzazelPhantomClone)) {
          const inView = e.x >= cLeft && e.x <= cRight && e.y >= cTop && e.y <= cBottom;
          e.setVisible(inView);
        }

        if (e instanceof AzazelBoss) {
          e.updateBoss(this.player, delta);
        } else if (e instanceof AzazelPhantomClone) {
          // Clones espectrais são atualizados diretamente pelo AzazelBoss pai
        } else if (e instanceof SuccubusBoss) {
          e.updateBoss(this.player, delta);
        } else if (e instanceof SkullSlime) {
          e.updateSlime(this.player, delta);
        } else if (e instanceof MummyEnemy) {
          e.updateMummy(this.player, delta, this.time.now);
        } else if (e instanceof BloodBat) {
          e.updateBat(this.player.x, this.player.y, delta);
        } else {
          e.updateEnemy(this.player.x, this.player.y, delta);
        }
      }
    }

    // 7. Spawner Escalável Contínuo de Hordas
    // Se o Altar de Invocação despertou (isHordeSpawningPaused) ou a Boss está ativa, não spawna novas levas da horda
    if (!this.isBossFightActive && !this.isHordeSpawningPaused && (this.gameMode !== 'sandbox' || this.sandboxAutoSpawn)) {
      this.spawnTimer += delta;

      // Intervalo de spawn diminui de 1500ms para até 450ms no Modo Infinito
      const minutes = this.survivalTimeMs / 60000;
      const minInterval = this.gameMode === 'endless' ? 450 : 650;
      const currentInterval = Math.max(minInterval, 1500 - minutes * 350) * (this.hordeEvents?.spawnIntervalMultiplier ?? 1);

      if (this.spawnTimer >= currentInterval) {
        this.spawnTimer = 0;
        this.spawnEnemyRandomPerimeter();
      }

      // Diretor de Ondas do Modo Infinito (Marcos de tempo, Mini-Chefes e Chefe Suprema)
      if (this.gameMode === 'endless') {
        const elapsedSec = Math.floor(this.survivalTimeMs / 1000);

        // 3:00 (180s): Titã Cerberus Mini-Boss
        if (!this.miniBoss3mSpawned && elapsedSec >= 180) {
          this.miniBoss3mSpawned = true;
          if (uiScene) {
            uiScene.showWaveAlert('ALERTA: TITÃ CERBERUS DETECTADO!', 4500);
          }
          this.spawnTitanCerberus();
        }

        // 5:00 (300s): Altar de Invocação desperta no Modo Infinito
        if (!this.bossSummonAltar?.isActive && elapsedSec >= 300 && !this.boss10mSpawned) {
          this.activateBossSummonAltar();
        }

        // 10:00 (600s): Succubus Desperta (Chefe Suprema do Modo Infinito - não spawna se já houver chefe ativo)
        if (!this.boss10mSpawned && elapsedSec >= 600 && !this.isBossFightActive) {
          this.boss10mSpawned = true;
          if (uiScene) {
            uiScene.showWaveAlert('ALERTA CRÍTICO: SUCCUBUS DESPERTA!', 5000);
          }
          this.bossFights.spawnEndlessTimedBoss();
        }
      }
    }

    // 7. Atualização da Bruma e Fumaça nas Bordas (quando perto dos limites da arena)
    if (_time - this.lastMistCheckTime > 160) {
      this.lastMistCheckTime = _time;
      this.updateBorderMist();
    }

    // 8. Atualização da Área de Teste / Showroom de Sprites (Apenas no Modo de Teste)
    if (this.testShowroomSystem) {
      this.testShowroomSystem.update(delta);
    }

    // 9. Atualização do Editor de Mapas
    if (this.mapEditorSystem) {
      this.mapEditorSystem.update(delta);
    }
  }

  /**
   * Adiciona pontos ponderados de energia para purificação do Capítulo (Modo História).
   * Cão Zumbi: 2 pts | Alfa Elite: 6 pts | Morcego: 1 pt | Skull Slime: 8 pts
   */
  public addPurificationPoints(points: number): void {
    if (this.gameMode !== 'story' || this.isBossFightActive || this.isChapterCompleted) return;
    this.chapterPurifiedSouls += points;
    if (this.chapterPurifiedSouls >= this.chapterTargetSouls) {
      this.activateBossSummonAltar();
    }
  }

  public spawnZombieDogAt(x: number, y: number, hp?: number, speed?: number, damage?: number, isElite?: boolean, eliteScale?: number, customDrop?: GemType): void {
    this.enemySpawner.spawnZombieDogAt(x, y, hp, speed, damage, isElite, eliteScale, customDrop);
  }

  public spawnSkullSlimeAt(x: number, y: number): void {
    this.enemySpawner.spawnSkullSlimeAt(x, y);
  }

  public spawnBloodBatFlock(count?: number): void {
    this.enemySpawner.spawnBloodBatFlock(count);
  }

  public spawnMummyAt(x: number, y: number, hp?: number, speed?: number, damage?: number): void {
    this.enemySpawner.spawnMummyAt(x, y, hp, speed, damage);
  }

  public spawnAzazelDimensionHordeWave(): void {
    this.enemySpawner.spawnAzazelDimensionHordeWave();
  }

  public spawnGemAt(x: number, y: number, type: GemType): void {
    this.pickupSpawner.spawnGemAt(x, y, type);
  }

  /** Ímã de Almas: traz de volta as gemas guardadas fora da tela para serem puxadas. */
  public releaseStoredGems(): void {
    this.pickupSpawner.releaseStoredGems();
  }

  public spawnSoulItem(x: number, y: number, value: number = 1): void {
    this.pickupSpawner.spawnSoulItem(x, y, value);
  }

  public spawnMapItem(x: number, y: number, type?: MapItemType): MapItem {
    return this.pickupSpawner.spawnMapItem(x, y, type);
  }

  public spawnRandomMapItem(): void {
    this.pickupSpawner.spawnRandomMapItem();
  }

  public updateAltarSpawning(delta: number): void {
    this.pickupSpawner.updateAltarSpawning(delta);
  }

  public spawnEvolutionAltar(customX?: number, customY?: number): EvolutionAltar | null {
    return this.pickupSpawner.spawnEvolutionAltar(customX, customY);
  }


  /**
   * Concede 1.5s de imunidade de segurança e afasta monstros ao sair da tela do Baú
   */
  public grantChestSafetyGrace(): void {
    this.grantInvulnerability(1500);

    // Empurrão místico suave em inimigos muito próximos para não punir a heroína
    if (this.enemiesGroup) {
      const enemies = this.enemiesGroup.getChildren() as BaseEnemy[];
      for (const e of enemies) {
        if (!e.active || e.isDead) continue;
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist <= 140) {
          const angle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          const body = e.body as Phaser.Physics.Arcade.Body;
          if (body) {
            body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
          }
        }
      }
    }
  }

  private spawnEnemyRandomPerimeter(): void {
    this.enemySpawner.spawnEnemyRandomPerimeter();
  }

  public spawnTitanCerberus(): void {
    this.enemySpawner.spawnTitanCerberus();
  }

  public spawnMatriarchSuccubus(): void {
    this.enemySpawner.spawnMatriarchSuccubus();
  }

  /**
   * Limita qualquer coordenada x, y dentro dos limites da Arena Gigante
   */
  public clampToArena(x: number, y: number, margin: number = ARENA_CONFIG.SPAWN_MARGIN): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(x, ARENA_CONFIG.MIN_X + margin, ARENA_CONFIG.MAX_X - margin),
      y: Phaser.Math.Clamp(y, ARENA_CONFIG.MIN_Y + margin, ARENA_CONFIG.MAX_Y - margin)
    };
  }

  /**
   * Desenha os limites visuais da Arena com dissolução suave de fumaça (sem linhas duras)
   */
  public drawArenaBorders(): void {
    this.arenaScenerySystem?.drawArenaBorders();
  }

  /**
   * Emite baforadas de fumaça viva nas bordas visíveis apenas quando a câmera estiver próxima aos limites
   */
  public updateBorderMist(): void {
    this.arenaScenerySystem?.updateBorderMist();
  }

  public addSceneryRock(x: number, y: number, variation?: number): void {
    this.arenaScenerySystem?.addSceneryRock(x, y, variation);
  }

  public addSceneryTorch(x: number, y: number): void {
    this.arenaScenerySystem?.addSceneryTorch(x, y);
  }

  public addSceneryCrystal(x: number, y: number): void {
    this.arenaScenerySystem?.addSceneryCrystal(x, y);
  }

  public addSceneryMushroom(x: number, y: number): void {
    this.arenaScenerySystem?.addSceneryMushroom(x, y);
  }

  public addSceneryBones(x: number, y: number): void {
    this.arenaScenerySystem?.addSceneryBones(x, y);
  }

  /**
   * Instancia agrupamentos temáticos de cenário (rochas variadas, tochas com luz, cogumelos, cristais e ossos abundantes)
   */
  public spawnSceneryProps(): void {
    this.arenaScenerySystem?.spawnSceneryProps();
  }

  /**
   * Altera a textura do chão infinito (ex: 'floor-tile' = chao1.jpg ou 'floor-tile-2' = chao2.jpg)
   */
  public setArenaFloorTexture(textureKey: string): void {
    if (!this.floorTile || !this.textures.exists(textureKey)) return;
    this.floorTile.setTexture(textureKey);
    this.floorTile.setTint(getArenaFloorTint(textureKey, this.currentChapter));
  }

  /**
   * Carrega um layout customizado de mapa (ou do editor) aplicando props, portais, itens e spawn de Nixy
   */
  public loadCustomMapLayout(config?: ChapterMapConfig): void {
    const map = config ?? MapStorageManager.getActiveMap(this.currentChapter);

    // 0. Atualiza textura do piso do mapa (chao1.jpg ou chao2.jpg)
    this.setArenaFloorTexture(map.floorTexture || 'floor-tile');

    // 1. Limpa props de cenário anteriores
    this.arenaScenerySystem?.clearSceneryPropsOnly();

    // 2. Reposiciona jogador se definido
    if (this.player && map.playerSpawn) {
      this.player.setPosition(map.playerSpawn.x, map.playerSpawn.y);
      if (this.cameras.main) {
        this.cameras.main.pan(map.playerSpawn.x, map.playerSpawn.y, 300, 'Power2');
      }
    }

    // 3. Spawna ou reposiciona o Altar de Invocação (apenas se não estivermos no meio de uma luta de Boss)
    if (!this.isBossFightActive) {
      const portalX = map.bossPortal?.x ?? 1450;
      const portalY = map.bossPortal?.y ?? -1200;
      this.bossFights.spawnSummonAltar(portalX, portalY);
    } else if (this.bossSummonAltar) {
      this.bossSummonAltar.setVisible(false);
    }

    // 4. Instancia os props definidos no mapa
    if (map.props && Array.isArray(map.props)) {
      this.arenaScenerySystem.placeMapProps(map.props);
    } else {
      this.spawnSceneryProps();
    }

    // 5. Spawna itens de exploração se definidos nas zonas de item (apenas em modo História e Infinito; Sandbox começa limpo)
    if (this.mapItemsGroup && this.mapItemsGroup.children) {
      const oldItems = this.mapItemsGroup.getChildren() as MapItem[];
      for (let i = oldItems.length - 1; i >= 0; i--) {
        oldItems[i].destroy();
      }
      if (this.gameMode !== 'sandbox' && map.itemSpawners && Array.isArray(map.itemSpawners)) {
        for (const sp of map.itemSpawners) {
          // Tipo sorteado entre cálice, ímã e baú
          this.spawnMapItem(sp.x, sp.y);
        }
      }
    }
  }

  /**
   * Remove e destrói 100% de todos os props de cenário e itens de mapa da cena
   */
  public clearAllSceneryProps(): void {
    this.arenaScenerySystem?.clearAllSceneryProps();
  }

  /**
   * Altera a visibilidade de todos os elementos de cenário e altar do jogo real
   */
  public setSceneryPropsVisible(visible: boolean): void {
    this.arenaScenerySystem?.setSceneryPropsVisible(visible);
  }

  /**
   * Altera a visibilidade do botão flutuante de abrir o Editor
   */
  public setMapEditorLauncherButtonVisible(visible: boolean): void {
    if (this.mapEditorLauncherButton) {
      this.mapEditorLauncherButton.setVisible(visible);
    }
  }

  /**
   * Cria o botão HUD de acesso rápido ao Editor de Fases no Modo Sandbox
   */
  private createMapEditorLauncherButton(): void {
    const { width } = this.scale;
    const btnContainer = this.add.container(width - 150, 45);
    btnContainer.setScrollFactor(0);
    btnContainer.setDepth(9999);

    const bg = this.add.graphics();
    bg.fillStyle(0x1e1e2e, 0.9);
    bg.lineStyle(2, 0xa855f7, 0.9);
    bg.fillRoundedRect(-65, -18, 130, 36, 8);
    bg.strokeRoundedRect(-65, -18, 130, 36, 8);

    const text = this.add.text(0, 0, 'EDITOR [M]', {
      fontFamily: FONTS.body,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    btnContainer.add([bg, text]);
    btnContainer.setSize(130, 36);
    btnContainer.setInteractive(new Phaser.Geom.Rectangle(-65, -18, 130, 36), Phaser.Geom.Rectangle.Contains);

    btnContainer.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3b0764, 0.95);
      bg.lineStyle(2, 0xd8b4fe, 1.0);
      bg.fillRoundedRect(-65, -18, 130, 36, 8);
      bg.strokeRoundedRect(-65, -18, 130, 36, 8);
    });

    btnContainer.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1e1e2e, 0.9);
      bg.lineStyle(2, 0xa855f7, 0.9);
      bg.fillRoundedRect(-65, -18, 130, 36, 8);
      bg.strokeRoundedRect(-65, -18, 130, 36, 8);
    });

    btnContainer.on('pointerdown', () => {
      this.mapEditorSystem?.toggle();
    });

    this.mapEditorLauncherButton = btnContainer;
  }

  /**
   * Executa a animação ritual da Estrela de Respawn (Pentagrama de Invocação) nos pés de Nixy
   */
  public playRespawnStarEffect(): void {
    if (!this.player) return;

    const starX = this.player.x;
    const starY = this.player.y + 12;

    const star = this.add.sprite(starX, starY, 'respawn-star-1');
    star.setOrigin(0.5, 0.5);
    star.setDepth(15);
    star.setScale(1.2);
    star.setBlendMode(Phaser.BlendModes.ADD);

    star.play('anim-respawn-star');

    star.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.tweens.add({
        targets: star,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: { from: 0.9, to: 1 },
        duration: 500,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut'
      });

      this.time.delayedCall(1000, () => {
        this.tweens.add({
          targets: star,
          alpha: 0,
          scaleX: 1.45,
          scaleY: 1.45,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            star.destroy();
          }
        });
      });
    });
  }

  // ===========================================================================
  // Fachadas das lutas de chefe e do fim de jogo (lógica no BossFightSystem / RunEndSystem)
  // ===========================================================================

  public activateBossSummonAltar(): void {
    this.bossFights.activateSummonAltar();
  }

  public triggerBossEncounter(): void {
    this.bossFights.triggerEncounter();
  }

  public spawnSuccubusBoss(startBanterImmediate: boolean = true, isCinematicIntro: boolean = false): void {
    this.bossFights.spawnRosalin(startBanterImmediate, isCinematicIntro);
  }

  public triggerAzazelEncounterFromAltar(): void {
    this.bossFights.startAzazelEncounter();
  }

  public spawnAzazelBoss(isCinematicIntro: boolean = false): void {
    this.bossFights.spawnAzazel(isCinematicIntro);
  }

  public clearAzazelCrystals(): void {
    this.bossFights?.clearCrystals();
  }

  public getActiveBossId(): BossId | undefined {
    return this.bossFights.getActiveBossId();
  }

  public notifyPlayerDeath(): void {
    this.bossFights.onPlayerDeath();
  }

  /** Deixa o jogador intocável por contato durante `ms` (nunca encurta uma imunidade maior). */
  public grantInvulnerability(ms: number): void {
    this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, ms);
  }

  /**
   * Dispara a Habilidade Suprema (Ultimate: Eternal Despair)
   */
  public triggerUltimate(): void {
    if (!this.player.isUltimateReady || this.player.isUltimateActive) return;
    SoundManager.getInstance().playUltimateCast();
    GamepadManager.getInstance().vibrate(this, 350, 0.7, 1.0);
    UltimateSystem.execute(this, this.player, this.enemiesGroup);
  }

  // ==========================================
  // Fachadas do Sistema de Balões de Fala de Combate (Pacote 3 — Etapa 2)
  // ==========================================
  public startBossCombatBanter(): void {
    this.combatBubbleSystem?.startBossCombatBanter();
  }

  public showCombatSpeechBubble(
    target: ICombatBubbleTarget,
    text: string,
    durationMs: number,
    isNixy: boolean = true
  ): void {
    this.combatBubbleSystem?.showCombatSpeechBubble(target, text, durationMs, isNixy);
  }

  public clearCombatSpeechBubbles(): void {
    this.combatBubbleSystem?.clearCombatSpeechBubbles();
  }

  public registerPoisonPuddle(puddle: PoisonPuddle): void {
    this.poisonPuddles.push(puddle);
  }

  public clearAllPoisonPuddles(): void {
    for (const p of this.poisonPuddles) {
      if (p && p.active) {
        this.tweens.add({
          targets: p,
          alpha: 0,
          scale: 0.1,
          duration: 280,
          ease: 'Power2',
          onComplete: () => p.destroy()
        });
      }
    }
    this.poisonPuddles = [];
  }

  // ===========================================================================
  // MÉTODOS DO MODO DE TESTE (SANDBOX & DEBUG)
  // ===========================================================================

  public registerSoulBoltOverlap(weapon: SoulBoltWeapon): void {
    this.physics.add.overlap(
      weapon.projectilesGroup,
      this.enemiesGroup,
      (projObj, enemyObj) => {
        const proj = projObj as SoulBoltProjectile;
        const enemy = enemyObj as BaseEnemy;
        if (proj.active && enemy.active && !enemy.isDead) {
          SoundManager.getInstance().playEnemyHit();
          proj.onHit(enemy);
          this.player.triggerLifeSteal(1);
        }
      }
    );
  }

  public setHUDVisible(visible: boolean): void {
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.setHUDVisible(visible);
    }
  }

  public setCameraZoom(zoom: number, duration: number = 600): void {
    this.tweens.add({
      targets: this.cameras.main,
      zoom,
      duration,
      ease: 'Cubic.easeOut'
    });
  }

  // ===========================================================================
  // Fachadas do Modo Sandbox (Pacote 3 — Etapa 1)
  // Delegam 100% da lógica e estado ao SandboxController desacoplado
  // ===========================================================================

  public sandboxSpawnHorde(type: HordeEnemyType, count: number = 1): void {
    this.sandboxController.spawnHorde(type, count);
  }

  public sandboxSpawnBoss(withIntroDialogue: boolean): void {
    this.sandboxController.spawnBoss(withIntroDialogue);
  }

  public sandboxSpawnAzazel(withIntroDialogue: boolean): void {
    this.sandboxController.spawnAzazel(withIntroDialogue);
  }

  public sandboxForceAzazelPhase2(): void {
    this.sandboxController.forceAzazelPhase2();
  }

  public sandboxForceAzazelPhase3(): void {
    this.sandboxController.forceAzazelPhase3();
  }

  public sandboxRemoveBoss(restoreBattleMusic: boolean = true): void {
    this.sandboxController.removeBoss(restoreBattleMusic);
  }

  public sandboxClearEnemies(withDrops: boolean): number {
    return this.sandboxController.clearEnemies(withDrops);
  }

  public sandboxRemoveWeapon(weaponClass: abstract new (...args: never[]) => unknown): void {
    this.sandboxController.removeWeapon(weaponClass);
  }

  public sandboxSpawnGemShower(count: number = 20): void {
    this.sandboxController.spawnGemShower(count);
  }

  public sandboxClearItemsAndGems(): void {
    this.sandboxController.clearItemsAndGems();
    this.pickupSpawner.clearStoredGems();
  }
}


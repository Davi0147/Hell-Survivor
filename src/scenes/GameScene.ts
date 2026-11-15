import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { SkullSlime } from '../entities/enemies/SkullSlime';
import { BloodBat } from '../entities/enemies/BloodBat';
import { MummyEnemy } from '../entities/enemies/MummyEnemy';
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
import { BossSummonAltar } from '../entities/items/BossSummonAltar';
import { AzazelCrystal } from '../entities/items/AzazelCrystal';
import { UltimateSystem } from '../systems/UltimateSystem';
import { DialogueLine } from '../systems/DialogueSystem';
import { SoundManager } from '../systems/SoundManager';
import { DebugSessionLogger } from '../systems/DebugSessionLogger';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import { PERFORMANCE_LIMITS, ARENA_CONFIG, getChapterConfig, getBossDefeatOutcome, AZAZEL_BOSS_BALANCE, ENEMY_BALANCE, SUCCUBUS_BOSS_BALANCE } from '../config/balance';
import { UIScene } from './UIScene';
import { GamepadManager } from '../systems/GamepadManager';
import { TestShowroomSystem } from '../systems/TestShowroomSystem';
import { MapEditorSystem } from '../systems/MapEditorSystem';
import { MapStorageManager, ChapterMapConfig } from '../config/mapData';
import { SandboxController, ISandboxContext, HordeEnemyType } from '../systems/SandboxController';
import { CombatBubbleSystem, ICombatBubbleContext, ICombatBubbleTarget } from '../systems/CombatBubbleSystem';
import { ArenaScenerySystem, ISceneryContext } from '../systems/ArenaScenerySystem';
import { CHAPTER_OPENING_DIALOGUE, ROSALIN_INTRO_DIALOGUE, AZAZEL_INTRO_DIALOGUE, getStoryRevivalDialogue, getBossRematchDialogue } from '../config/dialogues';
import { EnemySpawnSystem, IEnemySpawnContext } from '../systems/EnemySpawnSystem';
import { PickupSpawnSystem, IPickupSpawnContext } from '../systems/PickupSpawnSystem';
import { PlayerInputSystem } from '../systems/PlayerInputSystem';
import { FONTS } from '../config/theme';

export class GameScene extends Phaser.Scene implements ISandboxContext, ICombatBubbleContext, ISceneryContext, IEnemySpawnContext, IPickupSpawnContext {
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
  public azazelCrystals: AzazelCrystal[] = [];
  public azazelCrystalsCaptured: number = 0;
  public isPlayerMovementLocked: boolean = false;
  public isAzazelPhase3HordeActive: boolean = false;
  public survivalTimeMs: number = 0;
  public isChapterCompleted: boolean = false;
  public isGameOver: boolean = false;
  public miniBoss3mSpawned: boolean = false;
  public boss10mSpawned: boolean = false;
  public isRevival: boolean = false;
  public hasRevivalUsed: boolean = false;
  public isUpgradeSceneOpening: boolean = false;
  private bossMinionTimer: number = 0;

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
  public poisonPuddles: any[] = [];

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
    this.hasRevivalUsed = false;
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
    this.azazelCrystals = [];
    this.azazelCrystalsCaptured = 0;
    this.isPlayerMovementLocked = false;
    this.isAzazelPhase3HordeActive = false;
    this.altarInstance = null;
    this.bossSummonAltar = null;
    this.isHordeSpawningPaused = false;
    this.spawnTimer = 0;
    this.bossMinionTimer = 0;
    this.playerInvulnerableTimer = 0;
    this.poisonPuddles = [];
    this.weapons = [];
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

    // 1. Chão infinito repetido (TileSprite duplicando a textura do piso ativo em proporção adequada)
    const floorScale = 0.10;
    this.floorTile = this.add.tileSprite(width / 2, height / 2, width * 2, height * 2, 'floor-tile');
    this.floorTile.setOrigin(0.5);
    this.floorTile.setScrollFactor(0);
    this.floorTile.setDepth(-100);
    this.floorTile.setTileScale(floorScale, floorScale);
    this.floorTile.setTint(0x423232); // Diminui a cor e saturação das pedras para destacar monstros e Nixy

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
        const uiScene = this.scene.get('UIScene') as any;
        if (uiScene && typeof uiScene.showWaveAlert === 'function') {
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
        if (enemy.active && !enemy.isDead && this.playerInvulnerableTimer <= 0 && !this.isGameOver) {
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

    // Verificar se Nixy foi derrotada
    if (this.player.currentHp <= 0) {
      if (this.sandboxGodMode) {
        this.player.currentHp = this.player.maxHp;
      } else {
        const hasExtraRevival = MetaProgressManager.getInstance().getModifiers().hasExtraRevival;
        if (hasExtraRevival && !this.hasRevivalUsed) {
          this.triggerDemonRevival();
        } else {
          this.handlePlayerDeath();
          return;
        }
      }
    }

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

    // 5.4. Atualizar Altar de Invocação do Chefe
    if (this.bossSummonAltar && this.bossSummonAltar.active) {
      this.bossSummonAltar.updateAltar(this.player, delta);
    }

    // 5.4.1. Atualizar Cristais de Azazel (Fase 3 - 5 segundos na zona de captura)
    if (this.azazelCrystals.length > 0) {
      for (const crystal of this.azazelCrystals) {
        if (crystal && crystal.active && !crystal.isCompleted) {
          crystal.updateCrystal(this.player, delta);
        }
      }
    }

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
      const currentInterval = Math.max(minInterval, 1500 - minutes * 350);

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
          this.spawnSuccubusBossEndless();
        }
      }
    } else if (this.isAzazelPhase3HordeActive) {
      // Na Fase 3 de Azazel (Dimensão chao2 com 3 Cristais), monstros são spawnados em grandes quantidades!
      this.spawnTimer += delta;
      if (this.spawnTimer >= 920) {
        this.spawnTimer = 0;
        this.spawnAzazelDimensionHordeWave();
      }
    } else if (this.bossInstance && this.bossInstance.active && !this.bossInstance.isDead) {
      // Durante o confronto contra a Boss, ela invoca reforços periodicamente para auxiliá-la
      this.bossMinionTimer += delta;
      if (this.bossMinionTimer >= 8500) {
        this.bossMinionTimer = 0;
        this.showCombatSpeechBubble(this.bossInstance, 'Lacaios, devorem essa vadia!', 2000, false);
        SoundManager.getInstance().playEnemyDeath();

        // Invoca 2 Cães Zumbis e 3 Morcegos de Sangue nos arredores do confronto
        for (let i = 0; i < 2; i++) {
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const p = this.clampToArena(this.bossInstance.x + Math.cos(a) * 150, this.bossInstance.y + Math.sin(a) * 150);
          this.spawnZombieDogAt(p.x, p.y, ENEMY_BALANCE.zombieDogMapGuard.hp, ENEMY_BALANCE.zombieDogMapGuard.speed, ENEMY_BALANCE.zombieDogMapGuard.damage);
        }
        this.spawnBloodBatFlock(3);
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

  private spawnAzazelDimensionHordeWave(): void {
    this.enemySpawner.spawnAzazelDimensionHordeWave();
  }

  public spawnGemAt(x: number, y: number, type: GemType): void {
    this.pickupSpawner.spawnGemAt(x, y, type);
  }

  public spawnSoulItem(x: number, y: number, value: number = 1): void {
    this.pickupSpawner.spawnSoulItem(x, y, value);
  }

  private triggerDemonRevival(): void {
    this.hasRevivalUsed = true;
    this.player.currentHp = Math.max(1, Math.round(this.player.maxHp * 0.5));
    this.playerInvulnerableTimer = 3500;
    this.playRespawnStarEffect();

    SoundManager.getInstance().playLevelUp();
    this.cameras.main.flash(350, 192, 132, 252);
    this.cameras.main.shake(350, 0.02);

    // Efeito de onda de choque mística que repele monstros próximos
    if (this.enemiesGroup) {
      const enemies = this.enemiesGroup.getChildren() as BaseEnemy[];
      for (const enemy of enemies) {
        if (enemy.active && !enemy.isDead) {
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 260) {
            enemy.takeDamage(40);
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            if (body && dist > 0) {
              body.setVelocity((dx / dist) * 350, (dy / dist) * 350);
            }
          }
        }
      }
    }

    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.showWaveAlert('PACTO DEMONÍACO ATIVADO!\nNIXY RESSUSCITOU COM 50% DE VIDA!', 3000);
    }
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
    this.playerInvulnerableTimer = Math.max(this.playerInvulnerableTimer, 1500);

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
   * Spawna a Succubus Imperial como Chefe Suprema do Modo Infinito (10:00)
   */
  private spawnSuccubusBossEndless(): void {
    this.isBossFightActive = true;
    SoundManager.getInstance().playBossMusic(2200);
    const bossX = this.player.x + 240;
    const bossY = this.player.y - 140;

    this.bossInstance = new SuccubusBoss(this, bossX, bossY);
    this.bossInstance.setDepth(25);
    this.enemiesGroup.add(this.bossInstance);

    const endlessBoss = SUCCUBUS_BOSS_BALANCE.endless;
    this.bossInstance.spawn(bossX, bossY, endlessBoss.hp, endlessBoss.speed, endlessBoss.damage, endlessBoss.scale);

    this.cameras.main.flash(300, 255, 0, 85);
    this.cameras.main.shake(400, 0.025);

    this.bossInstance.on('boss-defeated', () => {
      this.isBossFightActive = false;
      this.bossInstance = undefined;
      this.killCount += 5;
      this.player.gainUltimateCharge(100);

      // Recompensa suprema: 3 Gemas Roxas, 60-80 Almas, Baú de Upgrade e celebração de sobrevivência
      this.spawnGemAt(bossX - 30, bossY, 'purple');
      this.spawnGemAt(bossX, bossY, 'purple');
      this.spawnGemAt(bossX + 30, bossY, 'purple');
      this.spawnSoulItem(bossX, bossY, Phaser.Math.Between(60, 80));
      this.spawnMapItem(bossX, bossY - 40, 'chest');

      this.cameras.main.flash(400, 255, 215, 0);
      this.cameras.main.shake(400, 0.025);

      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.showWaveAlert('CHEFE SUPREMA DERROTADA! A SOBREVIVÊNCIA CONTINUA...', 5000);
      }
    });
  }

  /**
   * Trata a derrota de Nixy exibindo a tela de Game Over e computando recordes
   */
  private handlePlayerDeath(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isPlayerMovementLocked = false;
    this.isAzazelPhase3HordeActive = false;
    SoundManager.getInstance().stopMusic(1200);
    SoundManager.getInstance().playGameOver();

    const uiSceneEarly = this.scene.get('UIScene') as UIScene;
    if (uiSceneEarly) {
      uiSceneEarly.setHUDVisible(true);
    }

    // Finaliza economia de almas e recordes
    const soulsEarned = MetaProgressManager.getInstance().finalizeRunSouls();
    MetaProgressManager.getInstance().recordRun(
      Math.floor(this.survivalTimeMs / 1000),
      this.killCount,
      false,
      this.gameMode
    );
    if (this.gameMode === 'story') {
      const bossId = this.isBossFightActive
        ? (this.currentChapter === 2 || this.azazelBoss?.active ? 'azazel' : 'rosalin')
        : undefined;
      MetaProgressManager.getInstance().recordStoryDeath(bossId);
    }

    this.physics.pause();
    this.clearCombatSpeechBubbles();
    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Efeito dramático de morte
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.flash(200, 255, 0, 0);
    this.player.setTint(0xff0000);

    // Registro da run no Agente de Testes Autônomo (Bot IA)
    if (AutoPlayTestAgent.getInstance().isEnabled) {
      AutoPlayTestAgent.getInstance().recordRun({
        runId: 0,
        timestamp: new Date().toLocaleTimeString(),
        gameMode: this.gameMode,
        survivalTimeSec: Math.floor(this.survivalTimeMs / 1000),
        levelReached: this.player.currentLevel,
        kills: this.killCount,
        hpRemaining: 0,
        equippedWeapons: this.weapons.map((w) => (w as { name?: string }).name || 'Arma'),
        deathCause: 'Dano fatal de monstros'
      });
    }

    this.time.delayedCall(700, () => {
      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.setHUDVisible(true);
        uiScene.showGameOverModal(
          {
            kills: this.killCount,
            level: this.player.currentLevel,
            timeSec: Math.floor(this.survivalTimeMs / 1000),
            mode: this.gameMode,
            soulsEarned
          },
          () => {
            // Reiniciar o modo e capítulo atuais com mecânica de ressurreição (Hades)
            SoundManager.getInstance().stopMusic();
            if (this.physics?.world) {
              this.physics.resume();
            }
            this.scene.stop('UIScene');
            this.scene.start('GameScene', { mode: this.gameMode, isRevival: true, chapter: this.currentChapter });
          },
          () => {
            // Retornar ao Menu Principal
            SoundManager.getInstance().stopMusic();
            if (this.physics?.world) {
              this.physics.resume();
            }
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
          }
        );

        if (AutoPlayTestAgent.getInstance().isEnabled) {
          // Se o Bot IA estiver jogando sozinho para testes contínuos, reinicia após 1.5s
          this.time.delayedCall(1500, () => {
            SoundManager.getInstance().stopMusic();
            if (this.physics?.world) {
              this.physics.resume();
            }
            this.scene.stop('UIScene');
            this.scene.start('GameScene', { mode: this.gameMode, isRevival: true, chapter: this.currentChapter });
          });
        }
      }
    });
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
    if (textureKey === 'floor-tile-2') {
      this.floorTile.setTint(0x684b4b);
    } else {
      this.floorTile.setTint(0x423232);
    }
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
      this.spawnBossSummonAltar(portalX, portalY);
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

  /**
   * Instancia o Altar de Invocação do Chefe no mapa (inicialmente inativo)
   */
  private spawnBossSummonAltar(altarX: number = 1450, altarY: number = -1200): void {
    if (this.bossSummonAltar) {
      this.bossSummonAltar.destroy();
      this.bossSummonAltar = null;
    }
    this.bossSummonAltar = new BossSummonAltar(this, altarX, altarY);
    this.bossSummonAltar.on('boss-summon-triggered', () => {
      this.handleBossSummonTriggered();
    });
  }

  /**
   * Desperta o Altar de Invocação e interrompe o nascimento de novas hordas normais
   */
  public activateBossSummonAltar(): void {
    if (!this.bossSummonAltar || this.bossSummonAltar.isActive) return;
    this.bossSummonAltar.activate();
    this.isHordeSpawningPaused = true;

    const bossLabel = this.currentChapter === 2 ? 'AZAZEL' : 'ROSALIN';
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.showCenterAnnouncement('O ALTAR DE INVOCAÇÃO FOI INVOCADO!', `SIGA O MARCADOR PARA O CONFRONTO CONTRA ${bossLabel}`);
    }
    DebugSessionLogger.getInstance().log('ALTAR', 'INFO', `Altar de Invocação ativado (${bossLabel})! Hordas pausadas.`);
  }

  /**
   * Acionado quando Nixy chega ao Altar de Invocação Ativo
   */
  private handleBossSummonTriggered(): void {
    if (this.isBossFightActive) return;

    if (this.currentChapter === 2) {
      this.triggerAzazelEncounterFromAltar();
      return;
    }

    this.isBossFightActive = true;
    SoundManager.getInstance().playBossMusic(2200);

    // 1. Dissipa todos os inimigos normais da arena
    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && !(m instanceof SuccubusBoss)) {
        m.takeDamage(999);
      }
    }

    // 2. Limpa quaisquer balões de combate antigos antes do diálogo
    this.clearCombatSpeechBubbles();

    // 3. Posiciona Nixy em frente ao Altar olhando para cima
    if (this.bossSummonAltar) {
      const pBody = this.player.body as Phaser.Physics.Arcade.Body;
      if (pBody) {
        pBody.setVelocity(0, 0);
      }
      this.player.currentDirection = 'north';
      this.player.play('nixy-idle-north');
    }

    this.cameras.main.flash(350, 255, 60, 60);
    this.cameras.main.shake(250, 0.02);

    // 4. Spawna Rosalin materializando sobre o pentagrama do altar em modo INTRO (invulnerável e estática)
    this.spawnSuccubusBoss(false, true);

    // 5. Inicia diálogo pré-boss (a Rosalin já está sobre o altar, sem levar dano!)
    this.time.delayedCall(300, () => {
      this.triggerBossDialogueOnly();
    });
  }

  /**
   * Inicia o confronto épico contra a Boss Rosalin
   */
  public triggerBossEncounter(): void {
    if (this.bossSummonAltar && !this.bossSummonAltar.isActive) {
      this.activateBossSummonAltar();
      return;
    }
    this.handleBossSummonTriggered();
  }

  private triggerBossDialogueOnly(): void {
    const deathsToRosalin = this.gameMode === 'story'
      ? MetaProgressManager.getInstance().getDeathsToBoss('rosalin')
      : 0;

    const lines: DialogueLine[] = deathsToRosalin > 0
      ? getBossRematchDialogue('rosalin', deathsToRosalin)
      : ROSALIN_INTRO_DIALOGUE;

    this.playDialogue(lines, () => {
      this.clearCombatSpeechBubbles();
      if (!this.bossInstance || !this.bossInstance.active) {
        this.spawnSuccubusBoss(true, false);
      } else {
        // Ativa Rosalin para o combate: ela agora se move, pode levar dano e ataca!
        this.bossInstance.startCombat();
        this.startBossCombatBanter();
      }
    });
  }

  public spawnSuccubusBoss(startBanterImmediate: boolean = true, isCinematicIntro: boolean = false): void {
    let bossX = this.player.x + 220;
    let bossY = this.player.y - 140;

    const activeMap = MapStorageManager.getActiveMap(this.currentChapter);
    if (this.bossSummonAltar && this.bossSummonAltar.isActive) {
      bossX = this.bossSummonAltar.x;
      bossY = this.bossSummonAltar.y - 15;
    } else if (activeMap?.bossSpawn) {
      bossX = activeMap.bossSpawn.x;
      bossY = activeMap.bossSpawn.y;
    }

    this.bossInstance = new SuccubusBoss(this, bossX, bossY);
    this.bossInstance.setDepth(22);
    this.enemiesGroup.add(this.bossInstance);
    const storyBoss = SUCCUBUS_BOSS_BALANCE.story;
    this.bossInstance.spawn(bossX, bossY, storyBoss.hp, storyBoss.speed, storyBoss.damage, storyBoss.scale, isCinematicIntro);

    this.cameras.main.flash(260, 255, 0, 85);
    this.cameras.main.shake(300, 0.022);

    // Inicia os balões dinâmicos de fala em tempo real durante a batalha apenas se solicitado
    if (startBanterImmediate) {
      this.startBossCombatBanter();
    }

    this.bossInstance.on('boss-defeated', () => {
      if (this.bossSummonAltar) {
        this.bossSummonAltar.complete();
      }
      this.handleBossDefeated();
    });
  }

  // ===========================================================================
  // CAPÍTULO 2: BOSS FIGHT ÉPICA DE AZAZEL (3 FASES + MÚSICA SINCRONIZADA)
  // ===========================================================================

  /**
   * Inicia o encontro cinematográfico contra Azazel no Altar:
   * 1. Toca intro.mp3 baixo em loop durante o diálogo.
   * 2. Ao fechar o diálogo, Nixy continua parada de frente para Azazel enquanto intro.mp3 termina seu último loop.
   * 3. Entra mid.mp3 (~2s): Azazel levanta a mão e grita acima da cabeça "SUA ALMA É MINHA!".
   * 4. Entra fight.mp3 em loop e começa a batalha!
   */
  public triggerAzazelEncounterFromAltar(): void {
    this.isBossFightActive = true;
    this.isPlayerMovementLocked = true;

    // 1. Inicia a música intro.mp3 tocando baixo em loop durante o diálogo
    SoundManager.getInstance().playAzazelIntroMusic();

    // 2. Dissipa todos os inimigos normais da arena
    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && !(m instanceof AzazelBoss)) {
        m.takeDamage(9999);
      }
    }

    this.clearCombatSpeechBubbles();

    // 3. Posiciona Nixy parada de frente para Azazel
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (pBody) {
      pBody.setVelocity(0, 0);
    }
    this.player.currentDirection = 'north';
    this.player.play('nixy-idle-north');

    this.cameras.main.flash(350, 255, 20, 70);
    this.cameras.main.shake(250, 0.02);

    // 4. Spawna Azazel sobre o altar em modo INTRO (parado e invulnerável)
    this.spawnAzazelBoss(true);

    // Posiciona Nixy alinhada à frente de Azazel se necessário
    if (this.azazelBoss) {
      this.player.setPosition(this.azazelBoss.x, this.azazelBoss.y + 135);
      this.player.currentDirection = 'north';
      this.player.play('nixy-idle-north');
    }

    // 5. Abre o diálogo pré-boss com Azazel
    this.time.delayedCall(300, () => {
      this.triggerAzazelDialogueOnly();
    });
  }

  private triggerAzazelDialogueOnly(): void {
    const deathsToAzazel = this.gameMode === 'story'
      ? MetaProgressManager.getInstance().getDeathsToBoss('azazel')
      : 0;

    // Diálogo placeholder do Capítulo 2 (pronto para ser substituído pelo roteiro definitivo depois)
    const lines: DialogueLine[] = deathsToAzazel > 0
      ? getBossRematchDialogue('azazel', deathsToAzazel)
      : AZAZEL_INTRO_DIALOGUE;

    this.playDialogue(lines, () => {
      this.clearCombatSpeechBubbles();
      // O chat sai, mas o jogador continua parado de frente para o Azazel enquanto a intro termina seu último loop!
      this.isPlayerMovementLocked = true;
      if (this.player?.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
      this.player.currentDirection = 'north';
      this.player.play('nixy-idle-north');

      SoundManager.getInstance().finishAzazelIntroAndTransition(
        // onMidStart: Toca o mid.mp3 (~2s), Azazel levanta a mão e grita em destaque "SUA ALMA É MINHA!"
        () => {
          // Diminui o zoom da câmera suavemente para 1.35x para dar visão ampla de todos os raios e investidas
          this.tweens.add({
            targets: this.cameras.main,
            zoom: 1.35,
            duration: 1200,
            ease: 'Cubic.easeInOut'
          });

          if (this.azazelBoss && this.azazelBoss.active) {
            this.azazelBoss.playMidPrepareScream(this.player);
          }
        },
        // onFightStart: Terminou os 2s do mid, entra fight.mp3 em loop e libera o combate!
        () => {
          this.isPlayerMovementLocked = false;
          if (this.azazelBoss && this.azazelBoss.active) {
            this.azazelBoss.startCombat();
          }
        }
      );
    });
  }

  public spawnAzazelBoss(isCinematicIntro: boolean = false): void {
    let bossX = this.player.x;
    let bossY = this.player.y - 160;

    const activeMap = MapStorageManager.getActiveMap(this.currentChapter);
    if (this.bossSummonAltar && this.bossSummonAltar.isActive) {
      bossX = this.bossSummonAltar.x;
      bossY = this.bossSummonAltar.y - 15;
    } else if (activeMap?.bossSpawn) {
      bossX = activeMap.bossSpawn.x;
      bossY = activeMap.bossSpawn.y;
    }

    const clamped = this.clampToArena(bossX, bossY, 220);
    bossX = clamped.x;
    bossY = clamped.y;

    this.azazelBoss = new AzazelBoss(this, bossX, bossY);
    this.azazelBoss.setDepth(22);
    this.enemiesGroup.add(this.azazelBoss);
    this.azazelBoss.spawn(
      bossX,
      bossY,
      AZAZEL_BOSS_BALANCE.maxHp,
      AZAZEL_BOSS_BALANCE.speed,
      AZAZEL_BOSS_BALANCE.baseContactDamage,
      AZAZEL_BOSS_BALANCE.scale,
      isCinematicIntro
    );

    if (!isCinematicIntro) {
      this.tweens.add({
        targets: this.cameras.main,
        zoom: 1.35,
        duration: 900,
        ease: 'Cubic.easeOut'
      });
    }

    // Eventos de controle de câmera, movimento, HUD e fases de Azazel
    this.azazelBoss.on('azazel-lock-player', (locked: boolean) => {
      this.isPlayerMovementLocked = locked;
      if (locked && this.player?.body) {
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });

    this.azazelBoss.on('azazel-center-phrase', (phrase: string, durationMs: number) => {
      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.showCenterBossPhrase(phrase, durationMs);
      }
    });

    this.azazelBoss.on('azazel-darkness-active', (isDark: boolean) => {
      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.setHUDVisible(!isDark);
      }
      if (isDark) {
        // Limpa monstros comuns para que no escuro total só se veja Nixy e os ataques de Azazel
        const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
        for (const m of mobs) {
          if (m.active && !(m instanceof AzazelBoss) && !(m instanceof AzazelPhantomClone)) {
            m.takeDamage(99999);
          }
        }
      }
    });

    this.azazelBoss.on('azazel-clone-created', (clone: AzazelPhantomClone) => {
      this.enemiesGroup.add(clone);
    });

    this.azazelBoss.on('azazel-phase3-dimension-start', () => {
      this.startAzazelPhase3Dimension();
    });

    this.azazelBoss.on('boss-defeated', () => {
      if (this.bossSummonAltar) {
        this.bossSummonAltar.complete();
      }
      this.handleAzazelDefeated();
    });
  }

  /**
   * Fase 3 de Azazel (20% HP):
   * Teleporta Nixy para o novo mapa com o piso chao2.jpg, restaura a HUD,
   * spawna monstros em grandes quantidades e faz surgir 3 Cristais de Azazel em posições aleatórias (5s cada).
   */
  public startAzazelPhase3Dimension(): void {
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.setHUDVisible(true);
    }

    this.cameras.main.flash(420, 220, 0, 70);
    this.cameras.main.shake(380, 0.022);

    // 1. Carrega o mapa da Dimensão Corrompida de Azazel (chapter 202 -> chao2.jpg)
    const dimMap = MapStorageManager.getActiveMap(202);
    this.loadCustomMapLayout(dimMap);
    this.setArenaFloorTexture('floor-tile-2');
    this.playRespawnStarEffect();

    // 2. Remove cristais anteriores se houver e gera 3 Cristais em posições aleatórias ao redor
    this.clearAzazelCrystals();
    this.azazelCrystalsCaptured = 0;

    const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const crystalCoords: { x: number; y: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + (i * (Math.PI * 2 / 3)) + Phaser.Math.FloatBetween(-0.32, 0.32);
      const dist = Phaser.Math.Between(290, 480);
      const rawX = this.player.x + Math.cos(angle) * dist;
      const rawY = this.player.y + Math.sin(angle) * dist;
      crystalCoords.push(this.clampToArena(rawX, rawY, 200));
    }

    crystalCoords.forEach((pt) => {
      const crystal = new AzazelCrystal(this, pt.x, pt.y);
      crystal.on('crystal-completed', () => {
        this.handleAzazelCrystalCaptured();
      });
      this.azazelCrystals.push(crystal);
    });

    // 3. Inicia o nascimento intenso de monstros na dimensão de Azazel
    this.isAzazelPhase3HordeActive = true;
    this.spawnAzazelDimensionHordeWave();
    this.spawnAzazelDimensionHordeWave();

    if (uiScene) {
      uiScene.showWaveAlert('DIMENSÃO DE AZAZEL: PURIFIQUE OS 3 CRISTAIS (5s CADA)!', 4500);
    }
  }

  private handleAzazelCrystalCaptured(): void {
    this.azazelCrystalsCaptured++;
    const uiScene = this.scene.get('UIScene') as UIScene;

    if (this.azazelCrystalsCaptured < 3) {
      if (uiScene) {
        uiScene.showWaveAlert(`CRISTAL PURIFICADO (${this.azazelCrystalsCaptured}/3)!`, 2600);
      }
      return;
    }

    // Todos os 3 Cristais foram purificados!
    this.isAzazelPhase3HordeActive = false;
    this.clearAzazelCrystals();

    // A tela treme intensamente e a horda da dimensão é pulverizada
    this.cameras.main.shake(680, 0.028);
    this.cameras.main.flash(380, 255, 0, 68);

    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && !(m instanceof AzazelBoss) && !(m instanceof AzazelPhantomClone)) {
        m.takeDamage(99999);
      }
    }

    if (uiScene) {
      uiScene.showWaveAlert('OS 3 CRISTAIS CAÍRAM! AZAZEL REAPARECE PARA O CONFRONTO FINAL!', 4000);
    }

    // Azazel reaparece com os 20% de vida restantes e todos os golpes da Fase 1
    if (this.azazelBoss && !this.azazelBoss.isDead) {
      const clamped = this.clampToArena(this.player.x, this.player.y - 220, 240);
      this.azazelBoss.resumeFinalShowdown(clamped.x, clamped.y, this.player);
    }
  }

  public clearAzazelCrystals(): void {
    for (const c of this.azazelCrystals) {
      if (c && !c.isDestroyed && c.active) {
        c.destroy();
      }
    }
    this.azazelCrystals = [];
  }

  private handleAzazelDefeated(): void {
    DebugSessionLogger.getInstance().log('BOSS', 'INFO', 'Azazel derrotado!');
    this.isPlayerMovementLocked = false;
    this.isAzazelPhase3HordeActive = false;
    this.clearAzazelCrystals();

    // Restaura o zoom padrão da câmera para 2.0x
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 2.0,
      duration: 1000,
      ease: 'Cubic.easeInOut'
    });

    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.setHUDVisible(true);
    }

    if (this.gameMode === 'sandbox') {
      this.isBossFightActive = false;
      this.clearCombatSpeechBubbles();
      const bx = this.azazelBoss ? this.azazelBoss.x : this.player.x;
      const by = this.azazelBoss ? this.azazelBoss.y : this.player.y;
      this.azazelBoss = undefined;
      SoundManager.getInstance().playBattleMusic(1500);
      this.spawnGemAt(bx - 25, by, 'purple');
      this.spawnGemAt(bx + 25, by, 'purple');
      this.spawnSoulItem(bx, by, Phaser.Math.Between(90, 120));
      this.spawnMapItem(bx, by - 35, 'chest');
      if (uiScene) {
        uiScene.showWaveAlert('AZAZEL DERROTADO! (MODO DE TESTE CONTINUA)', 4000);
      }
      return;
    }

    // Recompensa de almas corrompidas do Capítulo 2 (90 a 120 almas)
    MetaProgressManager.getInstance().collectRunSoul(Phaser.Math.Between(90, 120));

    this.isChapterCompleted = true;
    this.clearCombatSpeechBubbles();
    SoundManager.getInstance().stopMusic(1500);
    this.physics.pause();
    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Dissipa inimigos restantes da arena
    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && m !== this.azazelBoss) {
        m.takeDamage(99999);
      }
    }

    const runStats = {
      kills: this.killCount,
      level: this.player.currentLevel,
      timeSec: Math.floor(this.survivalTimeMs / 1000)
    };

    // Transição cinematográfica para a cena de encerramento do Capítulo 2
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundManager.getInstance().stopMusic();
        this.scene.stop('UIScene');
        this.scene.start('Chapter1EndScene', { runStats, chapter: 2 });
      });
    });
  }

  private handleBossDefeated(): void {
    DebugSessionLogger.getInstance().log('BOSS', 'INFO', 'Succubus derrotada!');

    const outcome = getBossDefeatOutcome(this.gameMode);

    if (outcome === 'continue-run') {
      this.isBossFightActive = false;
      this.isHordeSpawningPaused = false;
      this.clearCombatSpeechBubbles();
      const bx = this.bossInstance ? this.bossInstance.x : this.player.x;
      const by = this.bossInstance ? this.bossInstance.y : this.player.y;
      this.bossInstance = undefined;
      SoundManager.getInstance().playBattleMusic(1500);

      if (this.gameMode === 'sandbox') {
        this.spawnGemAt(bx - 25, by, 'purple');
        this.spawnGemAt(bx + 25, by, 'purple');
        this.spawnSoulItem(bx, by, Phaser.Math.Between(60, 80));
        this.spawnMapItem(bx, by - 35, 'chest');
        const uiScene = this.scene.get('UIScene') as UIScene;
        if (uiScene) {
          uiScene.showWaveAlert('SUCCUBUS DERROTADA! (MODO DE TESTE CONTINUA)', 4000);
        }
        return;
      }

      // Modo Infinito ('endless'): não encerra o capítulo, não zera nível e continua a partida
      this.killCount += 5;
      this.player.gainUltimateCharge(100);

      // Recompensa suprema da Succubus do Infinito: 3 Gemas Roxas, 60-80 Almas, Baú de Upgrade e aviso na tela
      this.spawnGemAt(bx - 30, by, 'purple');
      this.spawnGemAt(bx, by, 'purple');
      this.spawnGemAt(bx + 30, by, 'purple');
      this.spawnSoulItem(bx, by, Phaser.Math.Between(60, 80));
      this.spawnMapItem(bx, by - 40, 'chest');

      this.cameras.main.flash(400, 255, 215, 0);
      this.cameras.main.shake(400, 0.025);

      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.showWaveAlert('CHEFE SUPREMA DERROTADA! A SOBREVIVÊNCIA CONTINUA...', 5000);
      }
      return;
    }

    // Recompensa de almas corrompidas do capítulo (60 a 80 almas)
    MetaProgressManager.getInstance().collectRunSoul(Phaser.Math.Between(60, 80));

    this.isChapterCompleted = true;
    this.clearCombatSpeechBubbles();
    SoundManager.getInstance().stopMusic(1500);
    this.physics.pause();
    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Dissipa inimigos restantes da arena
    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && m !== this.bossInstance) {
        m.takeDamage(9999);
      }
    }

    const runStats = {
      kills: this.killCount,
      level: this.player.currentLevel,
      timeSec: Math.floor(this.survivalTimeMs / 1000)
    };

    // Transição cinematográfica para o desfecho do Capítulo 1
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundManager.getInstance().stopMusic();
        this.scene.stop('UIScene');
        this.scene.start('Chapter1EndScene', { runStats, chapter: 1 });
      });
    });
  }

  private showChapterVictoryModal(): void {
    this.isChapterCompleted = true;
    this.physics.pause();

    const soulsEarned = MetaProgressManager.getInstance().finalizeRunSouls();
    MetaProgressManager.getInstance().recordRun(
      Math.floor(this.survivalTimeMs / 1000),
      this.killCount,
      true,
      this.gameMode
    );

    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.showChapterVictoryModal(
        {
          kills: this.killCount,
          level: this.player.currentLevel,
          timeSec: Math.floor(this.survivalTimeMs / 1000),
          soulsEarned
        },
        () => {
          this.scene.stop('UIScene');
          this.scene.stop('GameScene');
          this.scene.start('MenuScene');
        }
      );
    }
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

  public registerPoisonPuddle(puddle: any): void {
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
  }
}


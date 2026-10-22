import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { ZombieDog } from '../entities/enemies/ZombieDog';
import { SkullSlime } from '../entities/enemies/SkullSlime';
import { BloodBat } from '../entities/enemies/BloodBat';
import { MummyEnemy } from '../entities/enemies/MummyEnemy';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import { AzazelBoss, AzazelPhantomClone } from '../entities/enemies/AzazelBoss';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { SoulBoltProjectile } from '../entities/weapons/SoulBoltProjectile';
import { BaseWeapon } from '../entities/weapons/BaseWeapon';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { CorruptedSoulItem } from '../entities/items/CorruptedSoulItem';
import { MetaProgressManager } from '../systems/MetaProgressManager';
import { MapItem, MapItemType } from '../entities/items/MapItem';
import { EvolutionAltar } from '../entities/items/EvolutionAltar';
import { BossSummonAltar } from '../entities/items/BossSummonAltar';
import { AzazelCrystal } from '../entities/items/AzazelCrystal';
import { UpgradeScene } from './UpgradeScene';
import { UltimateSystem } from '../systems/UltimateSystem';
import { DialogueLine } from '../systems/DialogueSystem';
import { SoundManager } from '../systems/SoundManager';
import { DebugSessionLogger } from '../systems/DebugSessionLogger';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import { PERFORMANCE_LIMITS, getEnemyScaling, ARENA_CONFIG, getChapterConfig, getBossDefeatOutcome, AZAZEL_BOSS_BALANCE } from '../config/balance';
import { UIScene } from './UIScene';
import { GamepadManager } from '../systems/GamepadManager';
import { TestShowroomSystem } from '../systems/TestShowroomSystem';
import { MapEditorSystem } from '../systems/MapEditorSystem';
import { MapStorageManager, ChapterMapConfig } from '../config/mapData';
import { SandboxController, ISandboxContext, HordeEnemyType } from '../systems/SandboxController';
import { CombatBubbleSystem, ICombatBubbleContext, ICombatBubbleTarget } from '../systems/CombatBubbleSystem';
import { ArenaScenerySystem, ISceneryContext } from '../systems/ArenaScenerySystem';

export class GameScene extends Phaser.Scene implements ISandboxContext, ICombatBubbleContext, ISceneryContext {
  public player!: Nixy;
  private floorTile!: Phaser.GameObjects.TileSprite;

  // Controlador do Modo Sandbox / Testes
  public sandboxController!: SandboxController;

  // Sistema de Balões de Fala de Combate (Pacote 3 — Etapa 2)
  public combatBubbleSystem!: CombatBubbleSystem;

  // Sistema de Cenário e Limites da Arena (Pacote 3 — Etapa 3)
  public arenaScenerySystem!: ArenaScenerySystem;

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
  private altarSpawnTimer: number = 0;
  private get ALTAR_SPAWN_INTERVAL(): number {
    return getChapterConfig(this.currentChapter).altarSpawnIntervalMs;
  }
  private spawnTimer: number = 0;
  private mapItemSpawnTimer: number = 0;
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
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
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
    this.altarSpawnTimer = 0;
    this.spawnTimer = 0;
    this.mapItemSpawnTimer = 0;
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
    }

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

    // 4. Mapeamento de Teclado
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.keyLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.keyDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.keyRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this.keyShift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
        let dialogueLines: DialogueLine[] = [];

        if (this.isRevival) {
          // Mecânica de Ressurreição Estilo Hades com Ódio Crescente a cada morte
          const deathCount = Math.max(1, MetaProgressManager.getInstance().getStoryDeathCount());
          dialogueLines = this.getStoryRevivalDialogue(deathCount);

          const rageIntensity = Math.min(0.032, 0.016 + deathCount * 0.002);
          this.cameras.main.flash(350 + Math.min(250, deathCount * 25), 180, 0, 70);
          this.cameras.main.shake(260 + Math.min(200, deathCount * 20), rageIntensity);
        } else if (this.currentChapter === 2) {
          dialogueLines = [
            {
              speaker: 'nixy',
              speakerName: 'Nixy',
              portraitKey: 'chat-nixy',
              text: 'Então esse é o segundo círculo... O ar daqui cheira a enxofre queimado e arrogância de demônio antigo.'
            },
            {
              speaker: 'nixy',
              speakerName: 'Nixy',
              portraitKey: 'chat-nixy',
              text: 'Rosalin já foi pro saco. Quem quer que seja o próximo engravatado no meu caminho... que prepare o caixão!'
            }
          ];
        } else {
          // Chegada inicial logo após chutar a mesa e fugir do escritório
          dialogueLines = [
            {
              speaker: 'nixy',
              speakerName: 'Nixy',
              portraitKey: 'chat-nixy',
              text: 'Argh... As catacumbas do abismo. Não me importa quantos demônios ou carrascos aquele filho da puta do Chefe mande atrás de mim...'
            },
            {
              speaker: 'nixy',
              speakerName: 'Nixy',
              portraitKey: 'chat-nixy',
              text: 'Eu vou sair dessa merda, nem que eu morra tentando! Hora da colheita!'
            }
          ];
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
   * Retorna falas de ressurreição da Nixy com o ódio escalando progressivamente a cada morte no Modo História
   */
  private getStoryRevivalDialogue(deathCount: number): DialogueLine[] {
    if (deathCount <= 1) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'De volta do mundo dos mortos... É claro. Eu já estou morta, seus idiotas!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Vocês não podem me matar duas vezes! Nem que eu tenha que morrer mil vezes, eu vou sair dessa merda!'
        }
      ];
    }

    if (deathCount === 2) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Argh... Minha cabeça... Então é assim que funciona? Eu caio e o purgatório me cospe de volta pro mesmo buraco?!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Ótimo! Porque agora eu tô começando a ficar REALMENTE puta!'
        }
      ];
    }

    if (deathCount === 3) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'De novo essa merda?! Esses desgraçados acham mesmo que vão me vencer pelo cansaço?!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Eu passei mil anos carimbando papel no escuro, seus [CENSURADO]! Teimosia é o meu sobrenome!'
        }
      ];
    }

    if (deathCount === 4) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'CARALHO! Doeu pra cacete dessa vez!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Quem foi o filho da puta que me cercou?! Eu vou arrancar a espinha de cada um de vocês com os dentes!'
        }
      ];
    }

    if (deathCount === 5) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'CINCO VEZES?! Vocês tão de sacanagem comigo?!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Esquece a saída! Agora é pessoal! Eu não vou deixar uma única alma inteira nesse corredor!'
        }
      ];
    }

    if (deathCount === 6) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'EU ODEIO ESSE LUGAR! EU ODEIO ESSES MONSTROS! EU ODEIO A PORRA DO MEU EX-CHEFE!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Saiam da minha frente antes que eu engula vocês vivos, seus lixos do inferno!'
        }
      ];
    }

    if (deathCount === 7) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Meu sangue tá fervendo tanto que até o chão tá derretendo...'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Podem vir em bando, podem vir em mil! Cada vez que eu volto, o meu ódio dobra de tamanho!'
        }
      ];
    }

    if (deathCount === 8) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Hahahaha... Sabe o que é engraçado? Eu nem sinto mais dor. Só vontade de MATAR.'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Vem cá, seus cachorros sarnentos... A titia Nixy trouxe massacre pra todo mundo!'
        }
      ];
    }

    if (deathCount === 9) {
      return [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'NOVE VEZES NESSE INFERNO! Eu juro que quando eu colocar as mãos no pescoço daqueles engravatados...'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'NADA VAI SOBRAR! NEM AS CINZAS!'
        }
      ];
    }

    // 10+ Mortes: Ódio Máximo Absoluto com variações ferozes
    const maxRageVariations: DialogueLine[][] = [
      [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'EU SOU IMORRÍVEL, SEUS [CENSURADO]! O próprio inferno vai pedir arrego antes de eu desistir!'
        }
      ],
      [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'MAIS UMA VEZ! E eu tô com tanto ódio acumulado que vou explodir esse círculo inteiro no soco!'
        }
      ],
      [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Vocês criaram um monstro quando me deram mais quinhentos anos... AGORA AGUENTEM A PORRA DA CONSEQUÊNCIA!'
        }
      ],
      [
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'SANGUE! EU QUERO VER SANGUE! Ninguém sai vivo dessa arena hoje, ouviram?! NINGUÉM!'
        }
      ]
    ];

    return maxRageVariations[(deathCount - 10) % maxRageVariations.length];
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

    // 1. Leitura dos vetores de entrada (Input manual ou Agente Autônomo de Teste)
    let dx = 0;
    let dy = 0;
    let isSprintRequested = false;

    if (AutoPlayTestAgent.getInstance().isEnabled) {
      const aiInput = AutoPlayTestAgent.getInstance().updateAgent(this, delta);
      dx = aiInput.dx;
      dy = aiInput.dy;
      isSprintRequested = aiInput.isSprint;
    } else {
      // 1.1 Teclado (WASD / Setas + Shift / Espaço)
      if (this.keyA?.isDown || this.keyLeft?.isDown) dx -= 1;
      if (this.keyD?.isDown || this.keyRight?.isDown) dx += 1;
      if (this.keyW?.isDown || this.keyUp?.isDown) dy -= 1;
      if (this.keyS?.isDown || this.keyDown?.isDown) dy += 1;
      isSprintRequested = Boolean(this.keyShift?.isDown || this.keySpace?.isDown);

      // 1.2 Gamepad Físico (Xbox, PlayStation, Controles USB)
      const padInput = GamepadManager.getInstance().getGameplayInput(this);
      if (padInput.isActive) {
        if (Math.abs(padInput.dx) > 0.05 || Math.abs(padInput.dy) > 0.05) {
          dx = padInput.dx;
          dy = padInput.dy;
        }
        if (padInput.isSprint) {
          isSprintRequested = true;
        }
        if (padInput.isUltimate && this.player.isUltimateReady && !this.isGameOver) {
          this.triggerUltimate();
        }
        if (padInput.isPause && !this.isGameOver && !this.isChapterCompleted && !this.scene.isActive('UpgradeScene')) {
          const uiScene = this.scene.get('UIScene') as UIScene;
          if (uiScene) uiScene.togglePause(this);
        }
      }

      // 1.3 Controles Touch na Tela (Mobile / Tablet)
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene && uiScene.touchControls && (uiScene.touchControls.isActive || uiScene.touchControls.forceEnabled)) {
        const touchInput = uiScene.touchControls.getInput();
        if (touchInput.hasMovement) {
          dx = touchInput.dx;
          dy = touchInput.dy;
        }
        if (touchInput.isSprint) {
          isSprintRequested = true;
        }
      }
    }

    // Se o jogador estiver travado por transição cinematográfica de Azazel, bloqueia o movimento
    if (this.isPlayerMovementLocked) {
      dx = 0;
      dy = 0;
      isSprintRequested = false;
    }

    // 2. Atualizar lógica e animações da Nixy
    this.player.updateNixy(dx, dy, isSprintRequested, delta);

    // 3. Atualizar tempo de imunidade
    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer -= delta;
    }

    // 4. Atualizar Todas as Armas Ativas
    for (const weapon of this.weapons) {
      if (typeof (weapon as any).updateWeapon === 'function') {
        (weapon as any).updateWeapon(delta, this.player.x, this.player.y, this.enemiesGroup);
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

    // 5. Atualizar Gemas de Alma no Chão (Culling + Atração Magnética e Coleta)
    const activeGems = this.gemsGroup.getChildren() as SoulGem[];
    for (let i = 0; i < activeGems.length; i++) {
      const g = activeGems[i];
      if (g.active) {
        const inView = g.x >= cLeft && g.x <= cRight && g.y >= cTop && g.y <= cBottom;
        g.setVisible(inView);
        if (g.isAttracted || inView) {
          g.updateGem(this.player, delta);
        }
      }
    }

    // 5.1. Atualizar Almas Corrompidas no Chão (Culling + Atração Magnética e Coleta)
    if (this.soulsGroup) {
      const activeSouls = this.soulsGroup.getChildren() as CorruptedSoulItem[];
      for (let i = 0; i < activeSouls.length; i++) {
        const s = activeSouls[i];
        if (s.active) {
          const inView = s.x >= cLeft && s.x <= cRight && s.y >= cTop && s.y <= cBottom;
          s.setVisible(inView);
          if (s.isAttracted || inView) {
            s.updateSoul(this.player, delta);
          }
        }
      }
    }

    // 5.1. Atualizar Itens Especiais de Mapa (Culling + Levitação)
    const activeMapItems = this.mapItemsGroup.getChildren() as MapItem[];
    for (let i = 0; i < activeMapItems.length; i++) {
      const item = activeMapItems[i];
      if (item.active) {
        const inView = item.x >= cLeft && item.x <= cRight && item.y >= cTop && item.y <= cBottom;
        item.setVisible(inView);
        if (inView) {
          item.updateItem(delta);
        }
      }
    }

    // 5.2. Spawner Periódico de Itens de Mapa (a cada ~40s, até no máximo 4 itens simultâneos no mapa)
    if (this.gameMode !== 'sandbox' || this.sandboxAutoSpawn) {
      this.mapItemSpawnTimer += delta;
      if (this.mapItemSpawnTimer >= 40000) {
        this.mapItemSpawnTimer = 0;
        if (this.mapItemsGroup.countActive() < 4) {
          this.spawnRandomMapItem();
        }
      }
    }

    // 5.3. Atualizar Altar de Ascensão e Spawner Periódico
    if (this.altarInstance && this.altarInstance.active && !this.altarInstance.isDestroyed) {
      this.altarInstance.updateAltar(this.player, delta);
    } else {
      this.updateAltarSpawning(delta);
    }

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
          this.spawnZombieDogAt(p.x, p.y, 45, 95, 11);
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
  private addPurificationPoints(points: number): void {
    if (this.gameMode !== 'story' || this.isBossFightActive || this.isChapterCompleted) return;
    this.chapterPurifiedSouls += points;
    if (this.chapterPurifiedSouls >= this.chapterTargetSouls) {
      this.activateBossSummonAltar();
    }
  }

  private getChapterEnemyStatMultiplier(): number {
    if (this.gameMode !== 'story') return 1.0;
    return getChapterConfig(this.currentChapter).enemyStatMultiplier;
  }

  public spawnZombieDogAt(
    x: number,
    y: number,
    hp: number = 35,
    speed: number = 85,
    damage: number = 9,
    isElite: boolean = false,
    eliteScale: number = 1.0,
    customDrop?: GemType
  ): void {
    const clamped = this.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    const chMult = this.getChapterEnemyStatMultiplier();
    hp = Math.round(hp * chMult);
    damage = Math.round(damage * chMult);

    let enemy = this.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof ZombieDog && !(child as any).isSpecialMiniBoss
    ) as ZombieDog | undefined;

    if (!enemy) {
      enemy = new ZombieDog(this, x, y);
      enemy.setDepth(5);
      this.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number, killedEnemy?: BaseEnemy) => {
        this.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        const dog = killedEnemy instanceof ZombieDog ? killedEnemy : undefined;
        const ultBonus = dog?.isElite ? 10 : 2.5;
        this.player.gainUltimateCharge(ultBonus);
        this.addPurificationPoints(dog?.isElite ? 6 : 2);

        let gemType: GemType;
        if (dog?.customDrop) {
          gemType = dog.customDrop;
        } else if (dog?.isElite) {
          // Elites dropam gemas azuis (70%) ou vermelhas (30%)
          gemType = Math.random() < 0.3 ? 'red' : 'blue';
        } else {
          // 90% chance de gema verde (5 XP), 10% chance de gema azul (20 XP)
          gemType = Math.random() < 0.1 ? 'blue' : 'green';
        }
        this.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas: Elites garantem 2 a 3; comuns têm 4% de chance
        if (dog?.isElite) {
          this.spawnSoulItem(ex, ey, Phaser.Math.Between(2, 3));
        } else if (Math.random() < 0.04) {
          this.spawnSoulItem(ex, ey, 1);
        }
      });
    }

    enemy.spawn(x, y, hp, speed, damage, isElite, eliteScale, customDrop);
  }

  public spawnSkullSlimeAt(x: number, y: number): void {
    const clamped = this.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    let enemy = this.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof SkullSlime
    ) as SkullSlime | undefined;

    if (!enemy) {
      enemy = new SkullSlime(this, x, y);
      enemy.setDepth(6);
      this.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number) => {
        this.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.player.gainUltimateCharge(5); // Tanque concede +5% de carga
        this.addPurificationPoints(8);

        // Skull Slime tem chance de gema azul (70%) e vermelha (30%)
        const gemType: GemType = Math.random() < 0.3 ? 'red' : 'blue';
        this.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas (8% de chance de 1 a 2 almas)
        if (Math.random() < 0.08) {
          this.spawnSoulItem(ex, ey, Phaser.Math.Between(1, 2));
        }
      });
    }

    const minutes = this.survivalTimeMs / 60000;
    const chMult = this.getChapterEnemyStatMultiplier();
    const hp = Math.round((160 + (this.gameMode === 'endless' ? minutes * 30 : 0)) * chMult);
    const dmg = Math.round(10 * chMult);
    enemy.spawn(x, y, hp, 46, dmg);
  }

  private spawnBloodBatAt(x: number, y: number): void {
    const clamped = this.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    let enemy = this.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof BloodBat
    ) as BloodBat | undefined;

    if (!enemy) {
      enemy = new BloodBat(this, x, y);
      enemy.setDepth(8);
      this.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number) => {
        this.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.player.gainUltimateCharge(1.5);
        this.addPurificationPoints(1);

        // 95% gema verde, 5% azul
        const gemType: GemType = Math.random() < 0.05 ? 'blue' : 'green';
        this.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas (3% de chance de 1 alma)
        if (Math.random() < 0.03) {
          this.spawnSoulItem(ex, ey, 1);
        }
      });
    }

    const minutes = this.survivalTimeMs / 60000;
    const chMult = this.getChapterEnemyStatMultiplier();
    const hp = Math.round((14 + (this.gameMode === 'endless' ? minutes * 3 : 0)) * chMult);
    const speed = Math.floor(155 + (this.gameMode === 'endless' ? minutes * 5 : 0));
    const dmg = Math.round(5 * chMult);
    enemy.spawn(x, y, hp, speed, dmg);
  }

  /**
   * Spawna um bando coordenado de Blood Bats voando em nuvem do perímetro
   */
  public spawnBloodBatFlock(count: number = 5): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(360, 480);
    const originX = this.player.x + Math.cos(angle) * dist;
    const originY = this.player.y + Math.sin(angle) * dist;

    for (let i = 0; i < count; i++) {
      const offsetX = Phaser.Math.Between(-35, 35);
      const offsetY = Phaser.Math.Between(-35, 35);
      this.spawnBloodBatAt(originX + offsetX, originY + offsetY);
    }
  }

  public spawnMummyAt(
    x: number,
    y: number,
    hp: number = 130,
    speed: number = 58,
    damage: number = 15
  ): void {
    const clamped = this.clampToArena(x, y);
    x = clamped.x;
    y = clamped.y;

    const chMult = this.getChapterEnemyStatMultiplier();
    hp = Math.round(hp * chMult);
    damage = Math.round(damage * chMult);

    let enemy = this.enemiesGroup.getChildren().find(
      (child) => !child.active && child instanceof MummyEnemy
    ) as MummyEnemy | undefined;

    if (!enemy) {
      enemy = new MummyEnemy(this, x, y);
      enemy.setDepth(6);
      this.enemiesGroup.add(enemy);

      enemy.on('enemy-killed', (ex: number, ey: number) => {
        this.killCount++;
        SoundManager.getInstance().playEnemyDeath();
        this.player.gainUltimateCharge(4.5);
        this.addPurificationPoints(4);
        const gemType: GemType = Math.random() < 0.35 ? 'blue' : 'green';
        this.spawnGemAt(ex, ey, gemType);

        // Drop de Almas Corrompidas (25% de chance de 1 a 3 almas)
        if (Math.random() < 0.25) {
          this.spawnSoulItem(ex, ey, Phaser.Math.Between(1, 3));
        }
      });
    }

    enemy.spawn(x, y, hp, speed, damage);
  }

  /**
   * Spawna horda intensa na Dimensão Corrompida de Azazel (Fase 3) enquanto o jogador captura os 3 Cristais
   */
  private spawnAzazelDimensionHordeWave(): void {
    if (this.player.isUltimateActive || !this.isAzazelPhase3HordeActive) return;
    if (this.enemiesGroup.countActive() >= PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES) return;

    const dogCount = Phaser.Math.Between(3, 5);
    for (let i = 0; i < dogCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(300, 440);
      const sx = this.player.x + Math.cos(angle) * dist;
      const sy = this.player.y + Math.sin(angle) * dist;
      this.spawnZombieDogAt(sx, sy, 48, 92, 11);
    }

    if (Math.random() < 0.45) {
      this.spawnBloodBatFlock(Phaser.Math.Between(4, 6));
    }

    if (Math.random() < 0.25) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(320, 420);
      this.spawnMummyAt(this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist, 150, 62, 16);
    }
  }

  public spawnGemAt(x: number, y: number, type: GemType): void {
    let gemXpValue = 5;
    if (type === 'blue') gemXpValue = 20;
    else if (type === 'red' || type === 'orange') gemXpValue = 100;
    else if (type === 'purple') gemXpValue = 250;
    else if (type === 'gold') gemXpValue = 500;

    // Fusão inteligente (Vampire Survivors style) se exceder o limite de gemas no mapa
    const activeGems = (this.gemsGroup.getChildren() as SoulGem[]).filter((g) => g.active);
    if (activeGems.length >= PERFORMANCE_LIMITS.MAX_ACTIVE_GEMS) {
      // Encontra a gema ativa mais próxima do ponto de spawn e funde o XP nela
      let closestGem: SoulGem | undefined;
      let closestDist = Infinity;
      for (const g of activeGems) {
        const d = Math.hypot(g.x - x, g.y - y);
        if (d < closestDist) {
          closestDist = d;
          closestGem = g;
        }
      }
      if (closestGem) {
        closestGem.addBonusXp(gemXpValue);
        return;
      }
    }

    let gem = this.gemsGroup.getChildren().find(
      (child) => !child.active
    ) as SoulGem | undefined;

    if (!gem) {
      gem = new SoulGem(this, x, y);
      this.gemsGroup.add(gem);
    }

    gem.spawn(x, y, type);
  }

  public spawnSoulItem(x: number, y: number, value: number = 1): void {
    const clamped = this.clampToArena(x, y, 60);
    let soul = this.soulsGroup.getChildren().find(
      (child) => !child.active
    ) as CorruptedSoulItem | undefined;

    if (!soul) {
      soul = new CorruptedSoulItem(this, clamped.x, clamped.y);
      this.soulsGroup.add(soul);
    }

    soul.spawn(clamped.x, clamped.y, value);
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
    const clamped = this.clampToArena(x, y, 160);
    x = clamped.x;
    y = clamped.y;
    const types: MapItemType[] = ['chalice', 'magnet', 'chest'];
    const chosenType = type ?? Phaser.Math.RND.pick(types);
    const item = new MapItem(this, x, y, chosenType);
    this.mapItemsGroup.add(item);
    return item;
  }

  public spawnRandomMapItem(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(450, 750);
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;
    this.spawnMapItem(x, y);
  }

  /**
   * Spawner Periódico do Altar de Ascensão Rúnico.
   * Surge a cada ~75 segundos no mapa se a Nixy possuir armas não evoluídas.
   */
  public updateAltarSpawning(delta: number): void {
    if (this.isGameOver || this.isChapterCompleted) return;
    if (this.altarInstance && this.altarInstance.active && !this.altarInstance.isDestroyed) return;

    // Se o jogador não possui armas disponíveis para evoluir, não spawna o altar
    const evolutionsAvailable = UpgradeScene.getAltarEvolutionCards(this.player, this);
    if (evolutionsAvailable.length === 0) return;

    this.altarSpawnTimer += delta;
    if (this.altarSpawnTimer >= this.ALTAR_SPAWN_INTERVAL) {
      this.altarSpawnTimer = 0;
      this.spawnEvolutionAltar();
    }
  }

  /**
   * Instancia um Altar de Ascensão no mapa com círculo de captura e 3 estágios visuais
   */
  public spawnEvolutionAltar(customX?: number, customY?: number): EvolutionAltar | null {
    if (this.altarInstance && this.altarInstance.active && !this.altarInstance.isDestroyed) {
      return this.altarInstance;
    }

    const evolutionsAvailable = UpgradeScene.getAltarEvolutionCards(this.player, this);
    if (evolutionsAvailable.length === 0) {
      DebugSessionLogger.getInstance().log('ALTAR', 'INFO', 'Tentativa de spawnar altar ignorada: todas as armas já evoluídas');
      return null;
    }

    let spawnX = customX;
    let spawnY = customY;

    if (spawnX === undefined || spawnY === undefined) {
      // Posiciona entre 320px e 460px de distância da Nixy em ângulo aleatório
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(320, 460);
      spawnX = this.player.x + Math.cos(angle) * dist;
      spawnY = this.player.y + Math.sin(angle) * dist;
    }

    const clamped = this.clampToArena(spawnX, spawnY, 200);
    spawnX = clamped.x;
    spawnY = clamped.y;

    this.altarInstance = new EvolutionAltar(this, spawnX, spawnY);
    this.altarInstance.on('altar-completed', (altar: EvolutionAltar) => {
      this.handleAltarCompleted(altar);
    });

    DebugSessionLogger.getInstance().log(
      'ALTAR',
      'INFO',
      `Altar de Ascensão rúnico surgiu em (${Math.round(spawnX)}, ${Math.round(spawnY)})`
    );

    return this.altarInstance;
  }

  /**
   * Acionado quando o jogador conclui 100% da carga do Altar de Ascensão
   */
  private handleAltarCompleted(altar: EvolutionAltar): void {
    if (this.isGameOver || this.isChapterCompleted) return;
    if (this.scene.isActive('UpgradeScene')) return;

    DebugSessionLogger.getInstance().log('ALTAR', 'INFO', 'Altar de Ascensão completado 100%! Abrindo seleção suprema...');
    this.cameras.main.flash(300, 255, 230, 0);
    this.physics.pause();
    this.scene.pause();

    this.scene.launch('UpgradeScene', {
      player: this.player,
      gameScene: this,
      isAltar: true,
      onAltarChosen: () => {
        altar.explodeAndDestroy();
        if (this.altarInstance === altar) {
          this.altarInstance = null;
        }
      }
    });
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
    // Não spawna se a Boss estiver em campo ou durante a Ultimate
    if (this.player.isUltimateActive || this.isBossFightActive) return;

    // Limite de Inimigos Vivos para manter 60 FPS
    if (this.enemiesGroup.countActive() >= PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES) return;

    const elapsedSec = Math.floor(this.survivalTimeMs / 1000);
    const scaling = getEnemyScaling(this.survivalTimeMs, this.gameMode === 'endless');
    const purifyRatio = this.gameMode === 'story'
      ? this.chapterPurifiedSouls / this.chapterTargetSouls
      : 0;

    // Determinar Fase Atual da Horda:
    // Fase 1: Somente Cães Zumbis (Até 25% da barra ou 90s)
    // Fase 2: Cães Zumbis + Morcegos de Sangue + Múmias (De 25% a 60% da barra ou 90s-210s)
    // Fase 3: Todos os Inimigos + Skull Slimes (A partir de 60% da barra ou >210s)
    let phase: 1 | 2 | 3 = 1;
    if (this.gameMode === 'story') {
      if (purifyRatio >= 0.60 || elapsedSec >= 210) {
        phase = 3;
      } else if (purifyRatio >= 0.25 || elapsedSec >= 90) {
        phase = 2;
      } else {
        phase = 1;
      }
    } else {
      // Modo Infinito (escalonado pelo tempo de sobrevivência)
      if (elapsedSec >= 135) {
        phase = 3;
      } else if (elapsedSec >= 60) {
        phase = 2;
      } else {
        phase = 1;
      }
    }

    // 1. BLOOD BATS: Surgem a partir da Fase 2, aumentam muito e voam em bandos numerosos
    if (phase >= 2) {
      const flockChance = phase === 3 ? 0.35 : 0.25;
      if (Math.random() < flockChance) {
        let flockSize: number;
        if (phase === 2) {
          flockSize = Phaser.Math.Between(4, 6);
        } else {
          // Na Fase 3 o bando cresce consideravelmente (muitos morcegos frágeis)
          flockSize = this.gameMode === 'endless'
            ? Math.min(12, Math.floor(6 + scaling.minutes * 1.2))
            : Phaser.Math.Between(5, 8);
        }
        this.spawnBloodBatFlock(flockSize);
      }
    }

    // 2. SKULL SLIMES: Surgem a partir da Fase 3, aumento estritamente controlado (tanques kamikaze mortais)
    if (phase === 3) {
      const activeSlimes = (this.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof SkullSlime
      ).length;

      const maxSlimes = this.gameMode === 'endless'
        ? (scaling.minutes >= 5 ? 3 : 2)
        : (purifyRatio >= 0.85 ? 2 : 1);

      const slimeChance = this.gameMode === 'endless' ? 0.25 : 0.20;

      if (activeSlimes < maxSlimes && Math.random() < slimeChance) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(340, 460);
        this.spawnSkullSlimeAt(this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist);
      }
    }

    // 3. MÚMIAS DO ABISMO (Zigue-zague com rastro verde tóxico e knockback)
    if (phase >= 2) {
      const activeMummies = (this.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof MummyEnemy
      ).length;
      const maxMummies = phase === 3 ? 4 : 2;
      const mummyChance = phase === 3 ? 0.30 : 0.20;

      if (activeMummies < maxMummies && Math.random() < mummyChance) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(320, 440);
        const hp = Math.floor(130 * scaling.hpMultiplier);
        const speed = Math.floor(58 * scaling.speedMultiplier);
        const dmg = Math.floor(15 * scaling.damageMultiplier);
        this.spawnMummyAt(this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist, hp, speed, dmg);
      }
    }

    // 4. ZOMBIE DOGS: Presentes em todas as fases com escalonamento de atributos
    let dogCount: number;
    if (phase === 1) {
      dogCount = Phaser.Math.Between(2, 3);
    } else if (phase === 2) {
      dogCount = this.gameMode === 'endless'
        ? Math.min(5, Math.floor(3 + scaling.minutes * 0.7))
        : Phaser.Math.Between(3, 4);
    } else {
      dogCount = this.gameMode === 'endless'
        ? Math.min(6, Math.floor(4 + scaling.minutes * 0.8))
        : Phaser.Math.Between(3, 5);
    }

    for (let i = 0; i < dogCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(340, 480);
      const spawnX = this.player.x + Math.cos(angle) * dist;
      const spawnY = this.player.y + Math.sin(angle) * dist;

      const isElite = this.gameMode === 'endless' && scaling.minutes >= 2 && Math.random() < 0.12;
      if (isElite) {
        const eliteHp = Math.floor(140 * scaling.hpMultiplier);
        const eliteSpeed = Math.floor(90 * scaling.speedMultiplier);
        const eliteDmg = Math.floor(13 * scaling.damageMultiplier);
        this.spawnZombieDogAt(spawnX, spawnY, eliteHp, eliteSpeed, eliteDmg, true, 1.35);
      } else {
        const hp = Math.floor(35 * scaling.hpMultiplier);
        const speed = Math.floor(85 * scaling.speedMultiplier);
        const dmg = Math.floor(9 * scaling.damageMultiplier);
        this.spawnZombieDogAt(spawnX, spawnY, hp, speed, dmg);
      }
    }
  }

  /**
   * Spawna o Mini-Chefe Titã Cerberus no Modo Infinito (3:00)
   */
  public spawnTitanCerberus(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 380;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const titan = new ZombieDog(this, x, y);
    (titan as any).isSpecialMiniBoss = true;
    titan.setDepth(15);
    this.enemiesGroup.add(titan);

    titan.spawn(x, y, 1400, 95, 20, true, 1.85, 'purple');

    titan.on('enemy-killed', (ex: number, ey: number) => {
      this.killCount++;
      this.player.gainUltimateCharge(25);
      this.spawnGemAt(ex, ey, 'purple');
      // Drop garantido de 10 a 15 Almas Corrompidas
      this.spawnSoulItem(ex, ey, Phaser.Math.Between(10, 15));
      // Drop de item especial de auxílio (Cálice de Cura ou Ímã)
      this.spawnMapItem(ex + 25, ey, Math.random() < 0.5 ? 'chalice' : 'magnet');
      this.cameras.main.shake(250, 0.015);
    });

    this.cameras.main.flash(200, 255, 60, 60);
    this.cameras.main.shake(300, 0.015);
  }

  /**
   * Spawna a Mini-Chefe Matriarca Succubus (disponível via Sandbox / Modo de Teste F1)
   */
  public spawnMatriarchSuccubus(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 400;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const matriarch = new SuccubusBoss(this, x, y);
    matriarch.setDepth(21);
    this.enemiesGroup.add(matriarch);

    matriarch.spawn(x, y, 2400, 115, 24, 1.45);
    matriarch.setTint(0xff758f);

    matriarch.on('boss-defeated', () => {
      this.killCount++;
      this.player.gainUltimateCharge(50);
      // Recompensa lendária: 2 Gemas Roxas, 15-20 Almas e Baú do Abismo
      this.spawnGemAt(matriarch.x - 20, matriarch.y, 'purple');
      this.spawnGemAt(matriarch.x + 20, matriarch.y, 'purple');
      this.spawnSoulItem(matriarch.x, matriarch.y, Phaser.Math.Between(15, 20));
      this.spawnMapItem(matriarch.x, matriarch.y - 30, 'chest');
      this.cameras.main.shake(300, 0.02);
    });

    this.cameras.main.flash(220, 255, 0, 128);
    this.cameras.main.shake(300, 0.02);
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

    this.bossInstance.spawn(bossX, bossY, 12000, 135, 40, 1.85);

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
        equippedWeapons: this.weapons.map((w: any) => w.name || 'Arma'),
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
      for (const p of map.props) {
        if (p.type === 'scenery-tocha') {
          this.addSceneryTorch(p.x, p.y);
        } else if (p.type === 'scenery-rocha') {
          this.addSceneryRock(p.x, p.y, 0);
        } else if (p.type === 'scenery-rocha-2') {
          this.addSceneryRock(p.x, p.y, 1);
        } else if (p.type === 'scenery-cristal') {
          this.addSceneryCrystal(p.x, p.y);
        } else if (p.type === 'scenery-ossos') {
          this.addSceneryBones(p.x, p.y);
        } else if (p.type === 'scenery-cogumelos') {
          this.addSceneryMushroom(p.x, p.y);
        } else if (p.type.startsWith('altar-')) {
          if (this.textures.exists(p.type)) {
            const altarImg = this.add.image(p.x, p.y, p.type);
            altarImg.setOrigin(0.5, 0.5);
            altarImg.setDepth(-12);
            altarImg.setScale(p.scale ?? 0.55);
            this.sceneryProps.push(altarImg);
          }
        } else if (this.textures.exists(p.type)) {
          const img = this.add.image(p.x, p.y, p.type);
          img.setOrigin(0.5, 0.5);
          img.setDepth(-10);
          img.setScale(p.scale ?? 1.0);
          this.sceneryProps.push(img);
        }
      }
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
          const types: ('chalice' | 'chest' | 'magnet')[] = ['chalice', 'chest', 'magnet'];
          const chosen = Phaser.Math.RND.pick(types);
          this.spawnMapItem(sp.x, sp.y, chosen);
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

    const text = this.add.text(0, 0, '🗺️ EDITOR [M]', {
      fontFamily: 'monospace',
      fontSize: '13px',
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

  /**
   * Retorna o diálogo de revanche de um Chefe caso o jogador já tenha sido derrotado por ele anteriormente.
   * Arquitetura padrão de Lore para todos os Chefes do jogo!
   */
  private getBossRematchDialogue(bossId: string, deathsToBoss: number): DialogueLine[] {
    if (bossId === 'azazel') {
      if (deathsToBoss === 1) {
        return [
          {
            speaker: 'azazel',
            speakerName: 'Azazel',
            portraitKey: 'chat-azazel',
            text: 'Sua alma teimosa ousa retornar ao meu domínio? Da última vez deixei suas cinzas escaparem... Não cometerei o mesmo erro.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Menos papo de vilão dramático e mais porrada, Azazel! Já decorei seus truques de mágica barata!'
          }
        ];
      }
      return [
        {
          speaker: 'azazel',
          speakerName: 'Azazel',
          portraitKey: 'chat-azazel',
          text: 'Insistência fútil. Quantas vezes precisarei esmagar sua mente na escuridão até você aceitar seu destino?'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Até eu apagar esse seu sorrisinho arrogante no soco! Vem logo!'
        }
      ];
    }

    if (bossId === 'rosalin') {
      if (deathsToBoss === 1) {
        return [
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Ora, ora... Olha quem voltou rastejando das cinzas. A surra que eu te dei ainda não foi suficiente para colocar você no seu devido lugar, querida?'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Guarda o fôlego, Rosalin. Da última vez eu só estava aquecendo... Agora eu vim pra arrancar a sua cabeça!'
          }
        ];
      }

      if (deathsToBoss === 2) {
        return [
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Você de novo?! Hahahaha! Confesso que sua humilhação está se tornando o meu passatempo favorito neste círculo.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Ri bastante enquanto ainda tem dentes na boca, sua [CENSURADO]! Dessa vez você não escapa!'
          }
        ];
      }

      return [
        {
          speaker: 'succubus',
          speakerName: 'Rosalin',
          portraitKey: 'chat-succubus',
          text: 'Quantas vezes mais eu vou precisar pisar na sua cara até você entender que jamais vencerá uma superiora, sua funcionáriazinha patética?!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'CALA A BOCA E LUTA! Eu posso morrer mil vezes, mas eu só preciso te matar UMA!'
        }
      ];
    }

    return [];
  }

  private triggerBossDialogueOnly(): void {
    const deathsToRosalin = this.gameMode === 'story'
      ? MetaProgressManager.getInstance().getDeathsToBoss('rosalin')
      : 0;

    const lines: DialogueLine[] = deathsToRosalin > 0
      ? this.getBossRematchDialogue('rosalin', deathsToRosalin)
      : [
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Ora, ora, ora... Olha só quem resolveu sair da sua mesinha de escritório.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Nixy!'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'O que aconteceu, querida? Perdeu o emprego ou finalmente perdeu o juízo?'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Os dois. E adivinha qual dos dois problemas eu vim resolver primeiro?'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Hahaha! Continua com essa boquinha suja, pelo visto.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Vamos facilitar as coisas, querida. Você já causou problemas demais por aqui. Que tal dar meia-volta, retornar ao trabalho e deixar os adultos resolverem essa bagunça?'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Ow, sua [CENSURADO]! Sai da minha frente antes que eu arranque essas asas de merda e enfie elas no seu [CENSURADO]!'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Nossa! Alguém acordou com o rabinho pegando fogo!'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Sempre soube que você era esquentadinha, mas nunca imaginei que fosse tão desesperada.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Embora... pensando bem, talvez eu devesse ter previsto isso. O chefe sempre teve um talento especial para ignorar as funcionárias problemáticas.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Engraçado. Eu sempre achei que ele tivesse um talento especial para promover as [CENSURADO] que dão pra ele.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'C-COMO É QUE É?!'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Você ouviu, querida. Ou precisa que eu desenhe? Posso até preencher um formulário, se ajudar.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Sua... sua insolente!'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Eu conquistei cada pedaço do poder que tenho! Enquanto você ficava enterrada em papelada, eu estava subindo na hierarquia!'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Subindo na hierarquia ou subindo no colo do chefe? Porque, sinceramente, com essa sua cara de [CENSURADO], fica difícil distinguir.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Sua inveja é tão patética que chega a ser adorável.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Você passou mil anos rastejando pelos corredores deste inferno, achando que alguém se importava com você. E agora está aqui, fazendo birra porque descobriu que é descartável.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'E você passou mil anos lambendo as botas de um demônio que nem deve lembrar seu nome quando está de costas.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'A diferença é que eu sei fazer meu trabalho.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Você só sabe abrir as pernas e bater as asas.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: '...'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Muito bem.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Eu ia deixar você voltar para sua insignificante vidinha de funcionária revoltada.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Mas agora...'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Agora vou arrancar cada pedacinho dessa sua arrogância.'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'Vou me deliciar com seu sangue enquanto uso esses chifres ridículos para abrir um buraco tão fundo em você que nem o próprio inferno vai conseguir encontrar o fundo!'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'HAHAHAHAHAHA!'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Caralho, mulher. Você ensaiou isso na frente do espelho?'
          },
          {
            speaker: 'succubus',
            speakerName: 'Rosalin',
            portraitKey: 'chat-succubus',
            text: 'EU VOU MATAR VOCÊ!'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'ENTÃO CAI DENTRO, SUA DESGRAÇADA!'
          }
        ];

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
    this.bossInstance.spawn(bossX, bossY, 9000, 125, 35, 1.75, isCinematicIntro);

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
      ? this.getBossRematchDialogue('azazel', deathsToAzazel)
      : [
          {
            speaker: 'azazel',
            speakerName: 'Azazel',
            portraitKey: 'chat-azazel',
            text: 'Então é você a funcionária rebelde que esmagou Rosalin... Eu sentia o cheiro da sua insolência desde o primeiro círculo.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Ótimo, já me poupa o trabalho de me apresentar. Você vai sair da frente por bem ou vou ter que te carimbar na parede também?'
          },
          {
            speaker: 'azazel',
            speakerName: 'Azazel',
            portraitKey: 'chat-azazel',
            text: 'Tola. Rosalin brincava com força bruta. Eu governo a escuridão e a mente dos condenados... Aqui dentro, cada passo seu pertence a mim.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Todo chefe que fala bonito demais cai do mesmo jeito. Vem tentar a sorte, seu desgraçado!'
          }
        ];

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


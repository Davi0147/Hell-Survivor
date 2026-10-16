import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { ZombieDog } from '../entities/enemies/ZombieDog';
import { SkullSlime } from '../entities/enemies/SkullSlime';
import { BloodBat } from '../entities/enemies/BloodBat';
import { SuccubusBoss } from '../entities/enemies/SuccubusBoss';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { SoulBoltProjectile } from '../entities/weapons/SoulBoltProjectile';
import { BaseWeapon } from '../entities/weapons/BaseWeapon';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { MapItem, MapItemType } from '../entities/items/MapItem';
import { UltimateSystem } from '../systems/UltimateSystem';
import { DialogueLine } from '../systems/DialogueSystem';
import { SoundManager } from '../systems/SoundManager';
import { enableCensoredTextHighlight } from '../systems/TextHighlight';
import { UIScene } from './UIScene';

export class GameScene extends Phaser.Scene {
  public player!: Nixy;
  private floorTile!: Phaser.GameObjects.TileSprite;

  // Modo de Jogo e Campanha
  public gameMode: 'story' | 'endless' = 'story';
  public chapterPurifiedSouls: number = 0;
  public readonly chapterTargetSouls: number = 900;
  public isBossFightActive: boolean = false;
  public bossInstance?: SuccubusBoss;
  public survivalTimeMs: number = 0;
  public isChapterCompleted: boolean = false;
  public isGameOver: boolean = false;
  public miniBoss3mSpawned: boolean = false;
  public miniBoss6mSpawned: boolean = false;
  public boss10mSpawned: boolean = false;
  public isRevival: boolean = false;
  private bossMinionTimer: number = 0;

  // Sistema de Balões de Fala Dinâmicos em Combate
  private activeCombatBubbles: {
    container: Phaser.GameObjects.Container;
    target: any;
    offsetY: number;
  }[] = [];
  private combatBanterTimers: Phaser.Time.TimerEvent[] = [];

  // Sistema de Combate e Armas
  public weapons: BaseWeapon[] = [];
  public soulBoltWeapon!: SoulBoltWeapon;
  public enemiesGroup!: Phaser.GameObjects.Group;
  public gemsGroup!: Phaser.GameObjects.Group;
  public mapItemsGroup!: Phaser.GameObjects.Group;
  private spawnTimer: number = 0;
  private mapItemSpawnTimer: number = 0;
  public killCount: number = 0;
  private playerInvulnerableTimer: number = 0;

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

  init(data?: { mode?: 'story' | 'endless'; isRevival?: boolean }): void {
    this.gameMode = data?.mode ?? 'story';
    this.isRevival = data?.isRevival ?? false;
    this.chapterPurifiedSouls = 0;
    this.killCount = 0;
    this.isBossFightActive = false;
    this.isChapterCompleted = false;
    this.isGameOver = false;
    this.miniBoss3mSpawned = false;
    this.miniBoss6mSpawned = false;
    this.boss10mSpawned = false;
    this.survivalTimeMs = 0;
    this.bossInstance = undefined;
    this.spawnTimer = 0;
    this.mapItemSpawnTimer = 0;
    this.bossMinionTimer = 0;
    this.clearCombatSpeechBubbles();
  }

  create(): void {
    const { width, height } = this.scale;

    SoundManager.getInstance().setScene(this);
    // Inicia a música de batalha com fade-in suave
    SoundManager.getInstance().playBattleMusic(3000);

    // 1. Chão infinito repetido (TileSprite duplicando a textura Chão1 em proporção adequada)
    const floorScale = 0.10;
    this.floorTile = this.add.tileSprite(width / 2, height / 2, width * 2, height * 2, 'floor-tile');
    this.floorTile.setOrigin(0.5);
    this.floorTile.setScrollFactor(0);
    this.floorTile.setDepth(-100);
    this.floorTile.setTileScale(floorScale, floorScale);
    this.floorTile.setTint(0x423232); // Diminui a cor e saturação das pedras para destacar monstros e Nixy

    // 2. Instanciação da Nixy no centro do mundo (0, 0)
    this.player = new Nixy(this, 0, 0);
    this.player.setDepth(20);

    // 3. Câmera travada no jogador com zoom 2x inteiro e pixels arredondados (pixel-perfect)
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setRoundPixels(true);

    // Sincronizar o chão infinito e balões de combate no POST_UPDATE compensando a física e câmera (sem deslizar nem tremer)
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, () => {
      if (this.floorTile && this.cameras.main) {
        this.floorTile.tilePositionX = Math.round(this.cameras.main.scrollX / floorScale);
        this.floorTile.tilePositionY = Math.round(this.cameras.main.scrollY / floorScale);
      }

      // Rastreamento pixel-perfect dos balões de combate (executa após a física mover os sprites e a câmera atualizar)
      for (let i = this.activeCombatBubbles.length - 1; i >= 0; i--) {
        const bubble = this.activeCombatBubbles[i];
        const target = bubble.target;
        const isAlive = target && target.active && !('isDead' in target && target.isDead) && !('currentHp' in target && target.currentHp <= 0);
        if (isAlive) {
          bubble.container.setPosition(Math.round(target.x), Math.round(target.y + bubble.offsetY));
        } else {
          bubble.container.destroy();
          this.activeCombatBubbles.splice(i, 1);
        }
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
        if (!this.isGameOver && !this.isChapterCompleted) {
          const uiScene = this.scene.get('UIScene') as UIScene;
          if (uiScene) {
            uiScene.togglePause(this);
          }
        }
      });
    }

    // 5. Inicialização de Grupos, Armas e Gemas de Alma
    this.enemiesGroup = this.add.group({
      classType: BaseEnemy,
      maxSize: 300,
      runChildUpdate: false
    });

    this.gemsGroup = this.add.group({
      classType: SoulGem,
      maxSize: 400,
      runChildUpdate: false
    });

    this.mapItemsGroup = this.add.group({
      classType: MapItem,
      runChildUpdate: false
    });

    this.weapons = [];
    this.soulBoltWeapon = new SoulBoltWeapon(this, this.player);
    this.weapons.push(this.soulBoltWeapon);

    // Escutar Level Up da heroína para abrir UpgradeScene
    this.player.on('player-level-up', () => {
      if (this.isGameOver) return;
      this.cameras.main.flash(220, 255, 215, 0);
      this.scene.pause();
      this.scene.launch('UpgradeScene', { player: this.player, gameScene: this });
    });

    // 6. Configuração de Colisão Projétil -> Inimigo
    this.physics.add.overlap(
      this.soulBoltWeapon.projectilesGroup,
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

    // 6.1. Configuração de Coleta de Itens do Mapa (Cálice, Ímã, Baú)
    this.physics.add.overlap(
      this.player,
      this.mapItemsGroup,
      (_playerObj, itemObj) => {
        const item = itemObj as MapItem;
        if (item.active && !this.isGameOver) {
          item.collect(this.player, this);
        }
      }
    );

    // 7. Configuração de Colisão Inimigo -> Nixy (Dano de contato)
    this.physics.add.overlap(
      this.player,
      this.enemiesGroup,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as BaseEnemy;
        if (enemy.active && !enemy.isDead && this.playerInvulnerableTimer <= 0 && !this.isGameOver) {
          SoundManager.getInstance().playPlayerHurt();
          this.player.takeDamage(enemy.damage);
          this.playerInvulnerableTimer = 450; // Tempo de imunidade contra hit consecutivo
          this.cameras.main.shake(120, 0.005);
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
      this.clearCombatSpeechBubbles();
      this.scene.stop('UIScene');
    });

    // Spawns Iniciais de Itens no Mapa (exploração e auxílio inicial)
    const angle1 = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const angle2 = angle1 + Math.PI * 0.75;
    this.spawnMapItem(this.player.x + Math.cos(angle1) * 450, this.player.y + Math.sin(angle1) * 450, 'chalice');
    this.spawnMapItem(this.player.x + Math.cos(angle2) * 520, this.player.y + Math.sin(angle2) * 520, 'chest');

    // Spawns Iniciais de Monstros (apenas Cães Zumbis no início de ambos os modos - Fase 1)
    if (this.gameMode === 'endless') {
      this.spawnZombieDogAt(-220, -100);
      this.spawnZombieDogAt(220, -120);
      this.spawnZombieDogAt(-160, 160);
      this.spawnZombieDogAt(180, 150);
    } else {
      // No Modo História: Inicia com o diálogo adaptado da fuga ou com a fala de ressurreição (estilo Hades)
      this.time.delayedCall(200, () => {
        let dialogueLines: DialogueLine[] = [];

        if (this.isRevival) {
          // Mecânica de Ressurreição Estilo Hades
          const hasSeenRevival = localStorage.getItem('hell_survivor_has_revived') === 'true';

          if (!hasSeenRevival) {
            try {
              localStorage.setItem('hell_survivor_has_revived', 'true');
            } catch {}
            dialogueLines = [
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
          } else {
            dialogueLines = [
              {
                speaker: 'nixy',
                speakerName: 'Nixy',
                portraitKey: 'chat-nixy',
                text: 'De volta das cinzas... Podem mandar quantos quiserem, o inferno não vai me segurar aqui!'
              }
            ];
          }

          this.cameras.main.flash(350, 180, 0, 70);
          this.cameras.main.shake(250, 0.018);
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
          this.spawnZombieDogAt(-220, -100);
          this.spawnZombieDogAt(220, -120);
          this.spawnZombieDogAt(-160, 160);
          this.spawnZombieDogAt(180, 150);
        });
      });
    }
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
    // Se o jogo acabou ou capítulo foi concluído ou diálogo estiver ativo na tela, congela toda a ação do jogo
    if (this.isGameOver || this.isChapterCompleted) return;
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene && uiScene.isDialogueActive()) return;

    // Verificar se Nixy foi derrotada
    if (this.player.currentHp <= 0) {
      this.handlePlayerDeath();
      return;
    }

    this.survivalTimeMs += delta;

    // 1. Leitura dos vetores de entrada (Input)
    let dx = 0;
    let dy = 0;

    if (this.keyA?.isDown || this.keyLeft?.isDown) dx -= 1;
    if (this.keyD?.isDown || this.keyRight?.isDown) dx += 1;
    if (this.keyW?.isDown || this.keyUp?.isDown) dy -= 1;
    if (this.keyS?.isDown || this.keyDown?.isDown) dy += 1;

    const isSprintRequested = Boolean(this.keyShift?.isDown || this.keySpace?.isDown);

    // 2. Atualizar lógica e animações da Nixy
    this.player.updateNixy(dx, dy, isSprintRequested, delta);

    // 3. Atualizar tempo de imunidade
    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer -= delta;
    }

    // 4. Atualizar Todas as Armas Ativas
    for (const weapon of this.weapons) {
      if (weapon instanceof SoulBoltWeapon) {
        weapon.updateWeapon(delta, this.player.x, this.player.y, this.enemiesGroup);
      } else if (weapon instanceof VoidScythesWeapon) {
        weapon.updateWeapon(delta, this.player.x, this.player.y, this.enemiesGroup);
      } else if (weapon instanceof HellfireAuraWeapon) {
        weapon.updateWeapon(delta, this.player.x, this.player.y, this.enemiesGroup);
      }
    }

    // 5. Atualizar Gemas de Alma no Chão (Atração Magnética e Coleta)
    const activeGems = this.gemsGroup.getChildren() as SoulGem[];
    for (let i = 0; i < activeGems.length; i++) {
      const g = activeGems[i];
      if (g.active) {
        g.updateGem(this.player, delta);
      }
    }

    // 5.1. Atualizar Itens Especiais de Mapa (Levitação / Bobbing)
    const activeMapItems = this.mapItemsGroup.getChildren() as MapItem[];
    for (let i = 0; i < activeMapItems.length; i++) {
      const item = activeMapItems[i];
      if (item.active) {
        item.updateItem(delta);
      }
    }

    // 5.2. Spawner Periódico de Itens de Mapa (a cada ~40s, até no máximo 4 itens simultâneos no mapa)
    this.mapItemSpawnTimer += delta;
    if (this.mapItemSpawnTimer >= 40000) {
      this.mapItemSpawnTimer = 0;
      if (this.mapItemsGroup.countActive() < 4) {
        this.spawnRandomMapItem();
      }
    }

    // 6. Atualizar Inimigos Ativos, Skull Slimes, Blood Bats e IA da Boss Succubus
    const enemies = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.active) {
        if (e instanceof SuccubusBoss) {
          e.updateBoss(this.player, delta);
        } else if (e instanceof SkullSlime) {
          e.updateSlime(this.player, delta);
        } else if (e instanceof BloodBat) {
          e.updateBat(this.player.x, this.player.y, delta);
        } else {
          e.updateEnemy(this.player.x, this.player.y, delta);
        }
      }
    }

    // 7. Spawner Escalável Contínuo de Hordas
    if (!this.isBossFightActive) {
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

        // 6:00 (360s): Matriarca Succubus Mini-Boss
        if (!this.miniBoss6mSpawned && elapsedSec >= 360) {
          this.miniBoss6mSpawned = true;
          if (uiScene) {
            uiScene.showWaveAlert('ALERTA: MATRIARCA SUCCUBUS DETECTADA!', 4500);
          }
          this.spawnMatriarchSuccubus();
        }

        // 10:00 (600s): Succubus Imperial Desperta (Chefe Suprema do Modo Infinito)
        if (!this.boss10mSpawned && elapsedSec >= 600) {
          this.boss10mSpawned = true;
          if (uiScene) {
            uiScene.showWaveAlert('ALERTA CRÍTICO: SUCCUBUS IMPERIAL DESPERTA!', 5000);
          }
          this.spawnSuccubusBossEndless();
        }
      }
    } else if (this.bossInstance && this.bossInstance.active && !this.bossInstance.isDead) {
      // Durante o confronto contra a Boss, invoca reforços a cada 8s para manter a arena dinâmica
      this.bossMinionTimer += delta;
      if (this.bossMinionTimer >= 8000) {
        this.bossMinionTimer = 0;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.spawnZombieDogAt(this.player.x + Math.cos(angle) * 360, this.player.y + Math.sin(angle) * 360);
        this.spawnBloodBatFlock(3);
      }
    }
  }

  /**
   * Adiciona pontos ponderados de energia para purificação do Capítulo 1 (Modo História).
   * Cão Zumbi: 2 pts | Alfa Elite: 6 pts | Morcego: 1 pt | Skull Slime: 8 pts
   */
  private addPurificationPoints(points: number): void {
    if (this.gameMode !== 'story' || this.isBossFightActive || this.isChapterCompleted) return;
    this.chapterPurifiedSouls += points;
    if (this.chapterPurifiedSouls >= this.chapterTargetSouls) {
      this.triggerBossEncounter();
    }
  }

  private spawnZombieDogAt(
    x: number,
    y: number,
    hp: number = 35,
    speed: number = 85,
    damage: number = 8,
    isElite: boolean = false,
    eliteScale: number = 1.0,
    customDrop?: GemType
  ): void {
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
      });
    }

    enemy.spawn(x, y, hp, speed, damage, isElite, eliteScale, customDrop);
  }

  private spawnSkullSlimeAt(x: number, y: number): void {
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
      });
    }

    const minutes = this.survivalTimeMs / 60000;
    const hp = Math.floor(160 + (this.gameMode === 'endless' ? minutes * 30 : 0));
    enemy.spawn(x, y, hp, 46, 10);
  }

  private spawnBloodBatAt(x: number, y: number): void {
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
      });
    }

    const minutes = this.survivalTimeMs / 60000;
    const hp = Math.floor(14 + (this.gameMode === 'endless' ? minutes * 3 : 0));
    const speed = Math.floor(155 + (this.gameMode === 'endless' ? minutes * 5 : 0));
    enemy.spawn(x, y, hp, speed, 4);
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

  private spawnGemAt(x: number, y: number, type: GemType): void {
    let gem = this.gemsGroup.getChildren().find(
      (child) => !child.active
    ) as SoulGem | undefined;

    if (!gem) {
      gem = new SoulGem(this, x, y);
      this.gemsGroup.add(gem);
    }

    gem.spawn(x, y, type);
  }

  public spawnMapItem(x: number, y: number, type?: MapItemType): MapItem {
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

  private spawnEnemyRandomPerimeter(): void {
    // Não spawna se a Boss estiver em campo ou durante a Ultimate
    if (this.player.isUltimateActive || this.isBossFightActive) return;

    const minutes = this.survivalTimeMs / 60000;
    const elapsedSec = Math.floor(this.survivalTimeMs / 1000);
    const purifyRatio = this.gameMode === 'story'
      ? this.chapterPurifiedSouls / this.chapterTargetSouls
      : 0;

    // Determinar Fase Atual da Horda:
    // Fase 1: Somente Cães Zumbis (Até 25% da barra ou 90s)
    // Fase 2: Cães Zumbis + Morcegos de Sangue (De 25% a 60% da barra ou 90s-210s)
    // Fase 3: Cães Zumbis + Morcegos de Sangue + Skull Slimes (A partir de 60% da barra ou >210s)
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
            ? Math.min(14, Math.floor(6 + minutes * 1.5))
            : Phaser.Math.Between(6, 9);
        }
        this.spawnBloodBatFlock(flockSize);
      }
    }

    // 2. SKULL SLIMES: Surgem a partir da Fase 3, aumento estritamente controlado (tanques kamikaze mortais)
    if (phase === 3) {
      const activeSlimes = (this.enemiesGroup.getChildren() as BaseEnemy[]).filter(
        (e) => e.active && e instanceof SkullSlime
      ).length;

      // Limite rígido de slimes vivos simultaneamente para evitar superlotação de veneno/root
      const maxSlimes = this.gameMode === 'endless'
        ? (minutes >= 5 ? 3 : 2)
        : (purifyRatio >= 0.85 ? 2 : 1);

      const slimeChance = this.gameMode === 'endless' ? 0.25 : 0.20;

      if (activeSlimes < maxSlimes && Math.random() < slimeChance) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(340, 460);
        this.spawnSkullSlimeAt(this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist);
      }
    }

    // 3. ZOMBIE DOGS: Presentes em todas as fases, aumento mediano constante compondo a linha de frente
    let dogCount: number;
    if (phase === 1) {
      dogCount = Phaser.Math.Between(2, 3);
    } else if (phase === 2) {
      dogCount = this.gameMode === 'endless'
        ? Math.min(5, Math.floor(3 + minutes * 0.8))
        : Phaser.Math.Between(3, 4);
    } else {
      dogCount = this.gameMode === 'endless'
        ? Math.min(7, Math.floor(4 + minutes * 1.0))
        : Phaser.Math.Between(4, 6);
    }

    for (let i = 0; i < dogCount; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(340, 480);
      const spawnX = this.player.x + Math.cos(angle) * dist;
      const spawnY = this.player.y + Math.sin(angle) * dist;

      const isElite = this.gameMode === 'endless' && minutes >= 2 && Math.random() < 0.12;
      if (isElite) {
        const eliteHp = Math.floor(140 + minutes * 40);
        const eliteSpeed = Math.floor(90 + minutes * 4);
        const eliteDmg = Math.floor(12 + minutes * 2);
        this.spawnZombieDogAt(spawnX, spawnY, eliteHp, eliteSpeed, eliteDmg, true, 1.35);
      } else {
        const hp = Math.floor(35 + (this.gameMode === 'endless' ? minutes * 15 : 0));
        const speed = Math.floor(85 + (this.gameMode === 'endless' ? minutes * 3 : 0));
        const dmg = Math.floor(8 + (this.gameMode === 'endless' ? minutes * 1 : 0));
        this.spawnZombieDogAt(spawnX, spawnY, hp, speed, dmg);
      }
    }
  }

  /**
   * Spawna o Mini-Chefe Titã Cerberus no Modo Infinito (3:00)
   */
  private spawnTitanCerberus(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 380;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const titan = new ZombieDog(this, x, y);
    (titan as any).isSpecialMiniBoss = true;
    titan.setDepth(15);
    this.enemiesGroup.add(titan);

    titan.spawn(x, y, 1400, 95, 18, true, 1.85, 'purple');

    titan.on('enemy-killed', (ex: number, ey: number) => {
      this.killCount++;
      this.player.gainUltimateCharge(25);
      this.spawnGemAt(ex, ey, 'purple');
      // Drop de item especial de auxílio (Cálice de Cura ou Ímã)
      this.spawnMapItem(ex + 25, ey, Math.random() < 0.5 ? 'chalice' : 'magnet');
      this.cameras.main.shake(250, 0.015);
    });

    this.cameras.main.flash(200, 255, 60, 60);
    this.cameras.main.shake(300, 0.015);
  }

  /**
   * Spawna a Mini-Chefe Matriarca Succubus no Modo Infinito (6:00)
   */
  private spawnMatriarchSuccubus(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = 400;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const matriarch = new SuccubusBoss(this, x, y);
    matriarch.setDepth(21);
    this.enemiesGroup.add(matriarch);

    matriarch.spawn(x, y, 2400, 115, 22, 1.45);
    matriarch.setTint(0xff758f);

    matriarch.on('boss-defeated', () => {
      this.killCount++;
      this.player.gainUltimateCharge(50);
      // Recompensa lendária: 2 Gemas Roxas e Baú do Abismo
      this.spawnGemAt(matriarch.x - 20, matriarch.y, 'purple');
      this.spawnGemAt(matriarch.x + 20, matriarch.y, 'purple');
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

    this.bossInstance.spawn(bossX, bossY, 12000, 135, 36, 1.85);

    this.cameras.main.flash(300, 255, 0, 85);
    this.cameras.main.shake(400, 0.025);

    this.bossInstance.on('boss-defeated', () => {
      this.isBossFightActive = false;
      this.bossInstance = undefined;
      this.killCount += 5;
      this.player.gainUltimateCharge(100);

      // Recompensa suprema: 3 Gemas Roxas, Baú de Upgrade e celebração de sobrevivência
      this.spawnGemAt(bossX - 30, bossY, 'purple');
      this.spawnGemAt(bossX, bossY, 'purple');
      this.spawnGemAt(bossX + 30, bossY, 'purple');
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
    SoundManager.getInstance().stopMusic(1200);
    SoundManager.getInstance().playGameOver();

    this.physics.pause();
    this.clearCombatSpeechBubbles();
    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Efeito dramático de morte
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.flash(200, 255, 0, 0);
    this.player.setTint(0xff0000);

    this.time.delayedCall(700, () => {
      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.showGameOverModal(
          {
            kills: this.killCount,
            level: this.player.currentLevel,
            timeSec: Math.floor(this.survivalTimeMs / 1000),
            mode: this.gameMode
          },
          () => {
            // Reiniciar o modo atual com mecânica de ressurreição (Hades)
            this.scene.stop('UIScene');
            this.scene.restart({ mode: this.gameMode, isRevival: true });
          },
          () => {
            // Retornar ao Menu Principal
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
          }
        );
      }
    });
  }

  /**
   * Inicia o confronto épico contra a Boss Succubus
   */
  private triggerBossEncounter(): void {
    this.isBossFightActive = true;
    SoundManager.getInstance().playBossMusic(2200);

    // 1. Dissipa todos os inimigos normais da arena
    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && !(m instanceof SuccubusBoss)) {
        m.takeDamage(999);
      }
    }

    this.cameras.main.flash(260, 255, 255, 255);
    this.cameras.main.shake(200, 0.015);

    // 2. Diálogo Pré-Boss (Persona 5 style) com a Succubus
    this.time.delayedCall(300, () => {
      this.playDialogue([
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Ora, ora, ora... Olha só quem resolveu sair da sua mesinha de escritório.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Nixy!'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Hahaha! Continua com essa boquinha suja, pelo visto.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Nossa! Alguém acordou com o rabinho pegando fogo!'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Sempre soube que você era esquentadinha, mas nunca imaginei que fosse tão desesperada.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Sua... sua insolente!'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Sua inveja é tão patética que chega a ser adorável.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: '...'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Muito bem.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Eu ia deixar você voltar para sua insignificante vidinha de funcionária revoltada.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Mas agora...'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Agora vou arrancar cada pedacinho dessa sua arrogância.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'Vou me deliciar com seu sangue enquanto uso esses chifres ridículos para abrir um buraco tão fundo em você que nem o próprio inferno vai conseguir encontrar o fundo!'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus',
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
          speakerName: 'Succubus',
          portraitKey: 'chat-succubus',
          text: 'EU VOU MATAR VOCÊ!'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'ENTÃO CAI DENTRO, SUA DESGRAÇADA!'
        }
      ], () => {
        this.spawnSuccubusBoss();
      });
    });
  }

  private spawnSuccubusBoss(): void {
    const bossX = this.player.x + 220;
    const bossY = this.player.y - 140;

    this.bossInstance = new SuccubusBoss(this, bossX, bossY);
    this.bossInstance.setDepth(22);
    this.enemiesGroup.add(this.bossInstance);
    this.bossInstance.spawn(bossX, bossY);

    this.cameras.main.flash(260, 255, 0, 85);
    this.cameras.main.shake(300, 0.022);

    // Inicia os balões dinâmicos de fala em tempo real durante a batalha
    this.startBossCombatBanter();

    this.bossInstance.on('boss-defeated', () => {
      this.handleBossDefeated();
    });
  }

  private handleBossDefeated(): void {
    this.isChapterCompleted = true;
    this.clearCombatSpeechBubbles();
    SoundManager.getInstance().stopMusic(2500);
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

    this.time.delayedCall(600, () => {
      this.playDialogue([
        {
          speaker: 'succubus',
          speakerName: 'Succubus Imperial',
          portraitKey: 'chat-succubus',
          text: 'Não... isso é impossível... uma mera mortal do plano terreno...'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Descanse no vazio. O primeiro círculo foi purificado. Mas sinto que o verdadeiro pesadelo do inferno está apenas começando...'
        }
      ], () => {
        this.showChapterVictoryModal();
      });
    });
  }

  private showChapterVictoryModal(): void {
    this.isChapterCompleted = true;
    this.physics.pause();

    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene) {
      uiScene.showChapterVictoryModal(
        {
          kills: this.killCount,
          level: this.player.currentLevel,
          timeSec: Math.floor(this.survivalTimeMs / 1000)
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
    UltimateSystem.execute(this, this.player, this.enemiesGroup);
  }

  /**
   * Dispara a sequência de provocações em tempo real entre Nixy e Succubus durante o combate
   */
  private startBossCombatBanter(): void {
    this.clearCombatSpeechBubbles();

    // 1. Nixy: "Só pra deixar claro:" (1.2s após início do combate)
    const t1 = this.time.delayedCall(1200, () => {
      if (!this.player || this.player.currentHp <= 0 || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.player, 'Só pra deixar claro:', 1900, true);
    });
    this.combatBanterTimers.push(t1);

    // 2. Nixy: "se você sobreviver..." (3.3s após início do combate)
    const t2 = this.time.delayedCall(3300, () => {
      if (!this.player || this.player.currentHp <= 0 || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.player, 'se você sobreviver...', 2000, true);
    });
    this.combatBanterTimers.push(t2);

    // 3. Nixy: "eu ainda vou terminar o que comecei com essas asas!" (5.5s após início do combate)
    const t3 = this.time.delayedCall(5500, () => {
      if (!this.player || this.player.currentHp <= 0 || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.player, 'eu ainda vou terminar o que comecei com essas asas!', 3000, true);
    });
    this.combatBanterTimers.push(t3);

    // 4. Succubus: "E se você sobreviver..." (8.8s após início do combate)
    const t4 = this.time.delayedCall(8800, () => {
      if (!this.bossInstance || this.bossInstance.isDead || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.bossInstance, 'E se você sobreviver...', 2200, false);
    });
    this.combatBanterTimers.push(t4);

    // 5. Succubus: "eu arranco sua língua!" (11.2s após início do combate)
    const t5 = this.time.delayedCall(11200, () => {
      if (!this.bossInstance || this.bossInstance.isDead || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.bossInstance, 'eu arranco sua língua!', 2600, false);
    });
    this.combatBanterTimers.push(t5);

    // 6. Nixy: "Olha só!" (14.1s após início do combate)
    const t6 = this.time.delayedCall(14100, () => {
      if (!this.player || this.player.currentHp <= 0 || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.player, 'Olha só!', 1600, true);
    });
    this.combatBanterTimers.push(t6);

    // 7. Nixy: "Finalmente encontramos algo em que concordamos." (15.9s após início do combate)
    const t7 = this.time.delayedCall(15900, () => {
      if (!this.player || this.player.currentHp <= 0 || !this.isBossFightActive || this.isGameOver) return;
      this.showCombatSpeechBubble(this.player, 'Finalmente encontramos algo em que concordamos.', 3000, true);
    });
    this.combatBanterTimers.push(t7);
  }

  /**
   * Exibe um balão de fala estilo quadrinhos sobre a cabeça de Nixy ou Succubus no calor do combate
   */
  private showCombatSpeechBubble(
    target: any,
    text: string,
    durationMs: number,
    isNixy: boolean
  ): void {
    if (!target || !target.active) return;
    if ('isDead' in target && target.isDead) return;
    if ('currentHp' in target && target.currentHp <= 0) return;

    // Remove balão anterior do mesmo alvo, se existir, para não sobrepor
    for (let i = this.activeCombatBubbles.length - 1; i >= 0; i--) {
      if (this.activeCombatBubbles[i].target === target) {
        this.activeCombatBubbles[i].container.destroy();
        this.activeCombatBubbles.splice(i, 1);
      }
    }

    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";
    const offsetY = isNixy ? -38 : -54;

    const container = this.add.container(Math.round(target.x), Math.round(target.y + offsetY));
    container.setDepth(1500);

    const nameText = this.add.text(0, 0, isNixy ? 'NIXY' : 'SUCCUBUS', {
      fontFamily: pixelFont,
      fontSize: '7px',
      fontStyle: 'bold',
      color: isNixy ? '#ffbe0b' : '#ff3388',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    nameText.setResolution(2);

    const bodyText = this.add.text(0, 0, text, {
      fontFamily: pixelFont,
      fontSize: '9px',
      color: isNixy ? '#fff5f8' : '#ffeef8',
      align: 'center',
      stroke: isNixy ? '#180106' : '#14001c',
      strokeThickness: 2.5,
      wordWrap: { width: 145 }
    }).setOrigin(0.5);
    bodyText.setResolution(2);
    enableCensoredTextHighlight(bodyText, '#ffd700');

    const padX = 8;
    const padY = 5;
    const contentW = Math.max(Math.ceil(nameText.width), Math.ceil(bodyText.width));
    const bubbleW = Math.max(56, contentW + padX * 2);
    const bubbleH = Math.ceil(nameText.height + bodyText.height + 4) + padY * 2;
    const halfW = Math.round(bubbleW / 2);
    const pointerH = 5;
    const totalH = bubbleH + pointerH;

    nameText.setPosition(0, Math.round(-totalH + padY + nameText.height / 2));
    bodyText.setPosition(0, Math.round(-totalH + padY + nameText.height + 3 + bodyText.height / 2));

    const bgG = this.add.graphics();
    const bgColor = isNixy ? 0x1f030a : 0x180122;
    const borderColor = isNixy ? 0xd4af37 : 0xff2a85;

    // Sombra suave do balão
    bgG.fillStyle(0x000000, 0.6);
    bgG.fillRoundedRect(-halfW + 2, -totalH + 2, bubbleW, bubbleH, 4);

    // Fundo preenchido
    bgG.fillStyle(bgColor, 0.94);
    bgG.fillRoundedRect(-halfW, -totalH, bubbleW, bubbleH, 4);

    // Triângulo apontador inferior
    bgG.beginPath();
    bgG.moveTo(-4, -pointerH);
    bgG.lineTo(4, -pointerH);
    bgG.lineTo(0, 0);
    bgG.closePath();
    bgG.fill();

    // Borda estilizada
    bgG.lineStyle(1.5, borderColor, 1);
    bgG.strokeRoundedRect(-halfW, -totalH, bubbleW, bubbleH, 4);
    bgG.beginPath();
    bgG.moveTo(-4, -pointerH);
    bgG.lineTo(0, 0);
    bgG.lineTo(4, -pointerH);
    bgG.stroke();

    container.add([bgG, nameText, bodyText]);

    // Animação de entrada suave por alpha sem alteração de escala (evita artefatos de amostragem e borrão)
    container.setScale(1.0);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 120,
      ease: 'Linear'
    });

    this.activeCombatBubbles.push({
      container,
      target,
      offsetY
    });

    // Fade-out antes de desaparecer
    const fadeDelay = Math.max(100, durationMs - 200);
    const fadeTimer = this.time.delayedCall(fadeDelay, () => {
      if (container.active) {
        this.tweens.add({
          targets: container,
          alpha: 0,
          duration: 180,
          onComplete: () => {
            container.destroy();
            const idx = this.activeCombatBubbles.findIndex(b => b.container === container);
            if (idx !== -1) {
              this.activeCombatBubbles.splice(idx, 1);
            }
          }
        });
      }
    });
    this.combatBanterTimers.push(fadeTimer);
  }

  /**
   * Limpa todos os balões de fala e timers de provocação do combate
   */
  public clearCombatSpeechBubbles(): void {
    for (const timer of this.combatBanterTimers) {
      if (timer) timer.remove();
    }
    this.combatBanterTimers = [];

    for (const item of this.activeCombatBubbles) {
      if (item.container) {
        item.container.destroy();
      }
    }
    this.activeCombatBubbles = [];
  }
}

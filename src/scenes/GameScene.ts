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
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { UltimateSystem } from '../systems/UltimateSystem';
import { DialogueLine } from '../systems/DialogueSystem';
import { UIScene } from './UIScene';

export class GameScene extends Phaser.Scene {
  public player!: Nixy;
  private floorTile!: Phaser.GameObjects.TileSprite;

  // Modo de Jogo e Campanha
  public gameMode: 'story' | 'endless' = 'story';
  public chapterPurifiedSouls: number = 0;
  public readonly chapterTargetSouls: number = 50;
  public isBossFightActive: boolean = false;
  public bossInstance?: SuccubusBoss;
  public survivalTimeMs: number = 0;
  public isChapterCompleted: boolean = false;
  public isGameOver: boolean = false;
  public miniBoss3mSpawned: boolean = false;
  public miniBoss6mSpawned: boolean = false;
  public boss10mSpawned: boolean = false;
  private bossMinionTimer: number = 0;

  // Sistema de Combate e Armas
  public weapons: BaseWeapon[] = [];
  public soulBoltWeapon!: SoulBoltWeapon;
  public enemiesGroup!: Phaser.GameObjects.Group;
  public gemsGroup!: Phaser.GameObjects.Group;
  private spawnTimer: number = 0;
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

  init(data?: { mode?: 'story' | 'endless' }): void {
    this.gameMode = data?.mode ?? 'story';
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
    this.bossMinionTimer = 0;
  }

  create(): void {
    const { width, height } = this.scale;

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

    // Sincronizar o chão infinito no POST_UPDATE compensando a escala do ladrilho (sem deslizar)
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
          proj.onHit(enemy);
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
      this.scene.stop('UIScene');
    });

    // Spawns Iniciais de Monstros (no Modo Infinito começam imediatamente)
    if (this.gameMode === 'endless') {
      this.spawnZombieDogAt(-220, -100);
      this.spawnZombieDogAt(220, -120);
      this.spawnSkullSlimeAt(180, 180);
      this.spawnBloodBatFlock(4);
    } else {
      // No Modo História: Inicia com o diálogo de introdução com a física pausada!
      this.time.delayedCall(200, () => {
        this.playDialogue([
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'O ar aqui embaixo é sufocante... As catacumbas do abismo estão infestadas de almas atormentadas.'
          },
          {
            speaker: 'nixy',
            speakerName: 'Nixy',
            portraitKey: 'chat-nixy',
            text: 'Preciso purificar a energia deste lugar antes que o selo da cripta se rompa de vez. Hora da colheita.'
          }
        ], () => {
          // Os primeiros monstros surgem somente APÓS a conclusão do diálogo!
          this.spawnZombieDogAt(-220, -100);
          this.spawnZombieDogAt(220, -120);
          this.spawnSkullSlimeAt(180, 180);
          this.spawnBloodBatFlock(4);
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
            uiScene.showWaveAlert('⚠️ ALERTA: TITÃ CERBERUS DETECTADO! ⚠️', 4500);
          }
          this.spawnTitanCerberus();
        }

        // 6:00 (360s): Matriarca Succubus Mini-Boss
        if (!this.miniBoss6mSpawned && elapsedSec >= 360) {
          this.miniBoss6mSpawned = true;
          if (uiScene) {
            uiScene.showWaveAlert('⚠️ ALERTA: MATRIARCA SUCCUBUS DETECTADA! ⚠️', 4500);
          }
          this.spawnMatriarchSuccubus();
        }

        // 10:00 (600s): Succubus Imperial Desperta (Chefe Suprema do Modo Infinito)
        if (!this.boss10mSpawned && elapsedSec >= 600) {
          this.boss10mSpawned = true;
          if (uiScene) {
            uiScene.showWaveAlert('👑 ALERTA CRÍTICO: SUCCUBUS IMPERIAL DESPERTA! 👑', 5000);
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
        const dog = killedEnemy instanceof ZombieDog ? killedEnemy : undefined;
        const ultBonus = dog?.isElite ? 10 : 2.5;
        this.player.gainUltimateCharge(ultBonus);
        this.chapterPurifiedSouls++;

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

        // Se bater a meta de purificação no Modo História, invoca o confronto de Boss!
        if (
          this.gameMode === 'story' &&
          !this.isBossFightActive &&
          this.chapterPurifiedSouls >= this.chapterTargetSouls
        ) {
          this.triggerBossEncounter();
        }
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
        this.player.gainUltimateCharge(5); // Tanque concede +5% de carga
        this.chapterPurifiedSouls++;

        // Skull Slime tem chance de gema azul (70%) e vermelha (30%)
        const gemType: GemType = Math.random() < 0.3 ? 'red' : 'blue';
        this.spawnGemAt(ex, ey, gemType);

        if (
          this.gameMode === 'story' &&
          !this.isBossFightActive &&
          this.chapterPurifiedSouls >= this.chapterTargetSouls
        ) {
          this.triggerBossEncounter();
        }
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
        this.player.gainUltimateCharge(1.5);
        this.chapterPurifiedSouls++;

        // 95% gema verde, 5% azul
        const gemType: GemType = Math.random() < 0.05 ? 'blue' : 'green';
        this.spawnGemAt(ex, ey, gemType);

        if (
          this.gameMode === 'story' &&
          !this.isBossFightActive &&
          this.chapterPurifiedSouls >= this.chapterTargetSouls
        ) {
          this.triggerBossEncounter();
        }
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

  private spawnEnemyRandomPerimeter(): void {
    // Não spawna se a Boss estiver em campo ou durante a Ultimate
    if (this.player.isUltimateActive || this.isBossFightActive) return;

    const minutes = this.survivalTimeMs / 60000;
    // Quantidade de inimigos por onda escalona com o tempo (de 2 até 12 no Modo Infinito)
    const maxMobs = this.gameMode === 'endless' ? 12 : 6;
    const countToSpawn = Math.min(maxMobs, Math.floor(2 + minutes * 1.5));

    // Chance de 18% por onda de invocar um bando aéreo de Blood Bats!
    if (Math.random() < 0.18) {
      const flockSize = Math.min(8, Math.floor(4 + minutes * 1.2));
      this.spawnBloodBatFlock(flockSize);
    }

    for (let i = 0; i < countToSpawn; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(340, 480);
      const spawnX = this.player.x + Math.cos(angle) * dist;
      const spawnY = this.player.y + Math.sin(angle) * dist;

      const roll = Math.random();

      // 22% chance: Skull Slime (Tanque kamikaze com bote de ácido)
      if (roll < 0.22) {
        this.spawnSkullSlimeAt(spawnX, spawnY);
      }
      // 18% chance: Blood Bat individual
      else if (roll < 0.40) {
        this.spawnBloodBatAt(spawnX, spawnY);
      }
      // 60% chance: Zombie Dog (com chance de Alfa Elite no modo infinito)
      else {
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
      // Recompensa lendária: 2 Gemas Roxas
      this.spawnGemAt(matriarch.x - 20, matriarch.y, 'purple');
      this.spawnGemAt(matriarch.x + 20, matriarch.y, 'purple');
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
    const bossX = this.player.x + 240;
    const bossY = this.player.y - 140;

    this.bossInstance = new SuccubusBoss(this, bossX, bossY);
    this.bossInstance.setDepth(25);
    this.enemiesGroup.add(this.bossInstance);

    this.bossInstance.spawn(bossX, bossY, 4800, 130, 28, 1.75);

    this.cameras.main.flash(300, 255, 0, 85);
    this.cameras.main.shake(400, 0.025);

    this.bossInstance.on('boss-defeated', () => {
      this.isBossFightActive = false;
      this.bossInstance = undefined;
      this.killCount += 5;
      this.player.gainUltimateCharge(100);

      // Recompensa suprema: 3 Gemas Roxas e celebração de sobrevivência
      this.spawnGemAt(bossX - 30, bossY, 'purple');
      this.spawnGemAt(bossX, bossY, 'purple');
      this.spawnGemAt(bossX + 30, bossY, 'purple');

      this.cameras.main.flash(400, 255, 215, 0);
      this.cameras.main.shake(400, 0.025);

      const uiScene = this.scene.get('UIScene') as UIScene;
      if (uiScene) {
        uiScene.showWaveAlert('👑 CHEFE SUPREMA DERROTADA! A SOBREVIVÊNCIA CONTINUA... 👑', 5000);
      }
    });
  }

  /**
   * Trata a derrota de Nixy exibindo a tela de Game Over e computando recordes
   */
  private handlePlayerDeath(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.physics.pause();
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
            // Reiniciar o modo atual
            this.scene.stop('UIScene');
            this.scene.restart({ mode: this.gameMode });
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
   * Inicia o confronto épico contra a Boss Succubus Imperial
   */
  private triggerBossEncounter(): void {
    this.isBossFightActive = true;

    // 1. Dissipa todos os inimigos normais da arena
    const mobs = this.enemiesGroup.getChildren() as BaseEnemy[];
    for (const m of mobs) {
      if (m.active && !(m instanceof SuccubusBoss)) {
        m.takeDamage(999);
      }
    }

    this.cameras.main.flash(260, 255, 255, 255);
    this.cameras.main.shake(200, 0.015);

    // 2. Diálogo Pré-Boss (Persona 5 style)
    this.time.delayedCall(300, () => {
      this.playDialogue([
        {
          speaker: 'succubus',
          speakerName: 'Succubus Imperial',
          portraitKey: 'chat-succubus',
          text: 'Hahaha... Que doce e insolente heroína temos aqui. Você realmente achou que poderia ceifar minhas almas impunemente?'
        },
        {
          speaker: 'nixy',
          speakerName: 'Nixy',
          portraitKey: 'chat-nixy',
          text: 'Uma Succubus Imperial... Então era você quem estava comandando essa matilha pútrida. Prepare-se, demônio.'
        },
        {
          speaker: 'succubus',
          speakerName: 'Succubus Imperial',
          portraitKey: 'chat-succubus',
          text: 'Prepare-se você, mortal! Suas cinzas alimentarão as chamas do abismo eterno!'
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

    this.cameras.main.flash(200, 255, 0, 85);
    this.cameras.main.shake(250, 0.02);

    this.bossInstance.on('boss-defeated', () => {
      this.handleBossDefeated();
    });
  }

  private handleBossDefeated(): void {
    this.isChapterCompleted = true;
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
    UltimateSystem.execute(this, this.player, this.enemiesGroup);
  }
}

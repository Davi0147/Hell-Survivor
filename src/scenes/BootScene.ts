import Phaser from 'phaser';
import { DIRECTIONS_8 } from '../config/balance';
import { SoundManager } from '../systems/SoundManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(): void {
    // Limpar áudios prévios
    this.sound.removeByKey('bgm-battle');
    this.sound.removeByKey('bgm-boss');
    this.sound.removeByKey('bgm-menu');
    this.sound.removeByKey('bgm-intro');
    this.sound.removeByKey('bgm-spooky');
    if (this.textures.exists('menu-background')) this.textures.remove('menu-background');
    // Limpeza profunda de texturas e animações anteriores para permitir hot-reload sob demanda
    for (const dir of DIRECTIONS_8) {
      if (this.textures.exists(`nixy-idle-${dir}`)) this.textures.remove(`nixy-idle-${dir}`);
      if (this.textures.exists(`nixy-hurt-${dir}`)) this.textures.remove(`nixy-hurt-${dir}`);
      if (this.textures.exists(`nixy-sitting-${dir}`)) this.textures.remove(`nixy-sitting-${dir}`);

      if (this.anims.exists(`nixy-idle-${dir}`)) this.anims.remove(`nixy-idle-${dir}`);
      if (this.anims.exists(`nixy-hurt-${dir}`)) this.anims.remove(`nixy-hurt-${dir}`);
      if (this.anims.exists(`nixy-run-${dir}`)) this.anims.remove(`nixy-run-${dir}`);
      if (this.anims.exists(`nixy-sprint-${dir}`)) this.anims.remove(`nixy-sprint-${dir}`);

      for (let i = 0; i < 8; i++) {
        if (this.textures.exists(`nixy-run-${dir}-${i}`)) this.textures.remove(`nixy-run-${dir}-${i}`);
        if (this.textures.exists(`nixy-sprint-${dir}-${i}`)) this.textures.remove(`nixy-sprint-${dir}-${i}`);
      }
    }

    // Limpar texturas do Zombie Dog
    const DOG_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of DOG_DIRS) {
      if (this.anims.exists(`zombie-dog-run-${dir}`)) this.anims.remove(`zombie-dog-run-${dir}`);
      for (let i = 0; i < 8; i++) {
        if (this.textures.exists(`zombie-dog-run-${dir}-${i}`)) this.textures.remove(`zombie-dog-run-${dir}-${i}`);
      }
    }
    for (const dir of DIRECTIONS_8) {
      if (this.textures.exists(`zombie-dog-idle-${dir}`)) this.textures.remove(`zombie-dog-idle-${dir}`);
      if (this.anims.exists(`zombie-dog-idle-${dir}`)) this.anims.remove(`zombie-dog-idle-${dir}`);

      // Limpar texturas e animações da Succubus
      if (this.textures.exists(`succubus-idle-${dir}`)) this.textures.remove(`succubus-idle-${dir}`);
      if (this.anims.exists(`succubus-idle-${dir}`)) this.anims.remove(`succubus-idle-${dir}`);
      if (this.anims.exists(`succubus-fly-${dir}`)) this.anims.remove(`succubus-fly-${dir}`);
      for (let i = 0; i < 5; i++) {
        if (this.textures.exists(`succubus-fly-${dir}-${i}`)) this.textures.remove(`succubus-fly-${dir}-${i}`);
      }

      // Limpar texturas e animações do Skull Slime
      if (this.textures.exists(`skull-slime-idle-${dir}`)) this.textures.remove(`skull-slime-idle-${dir}`);
      if (this.anims.exists(`skull-slime-idle-${dir}`)) this.anims.remove(`skull-slime-idle-${dir}`);

      // Limpar texturas e animações do Blood Bat
      if (this.textures.exists(`blood-bat-idle-${dir}`)) this.textures.remove(`blood-bat-idle-${dir}`);
      if (this.anims.exists(`blood-bat-idle-${dir}`)) this.anims.remove(`blood-bat-idle-${dir}`);
    }

    const CARDINALS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of CARDINALS) {
      if (this.anims.exists(`skull-slime-run-${dir}`)) this.anims.remove(`skull-slime-run-${dir}`);
      for (let i = 0; i < 9; i++) {
        if (this.textures.exists(`skull-slime-run-${dir}-${i}`)) this.textures.remove(`skull-slime-run-${dir}-${i}`);
      }

      if (this.anims.exists(`blood-bat-fly-${dir}`)) this.anims.remove(`blood-bat-fly-${dir}`);
      for (let i = 0; i < 5; i++) {
        if (this.textures.exists(`blood-bat-fly-${dir}-${i}`)) this.textures.remove(`blood-bat-fly-${dir}-${i}`);
      }

      if (this.anims.exists(`mummy-walk-${dir}`)) this.anims.remove(`mummy-walk-${dir}`);
      for (let i = 0; i < 9; i++) {
        if (this.textures.exists(`mummy-walk-${dir}-${i}`)) this.textures.remove(`mummy-walk-${dir}-${i}`);
      }
    }

    for (const dir of DIRECTIONS_8) {
      if (this.anims.exists(`mummy-idle-${dir}`)) this.anims.remove(`mummy-idle-${dir}`);
      if (this.textures.exists(`mummy-idle-${dir}`)) this.textures.remove(`mummy-idle-${dir}`);
    }

    if (this.textures.exists('floor-tile')) this.textures.remove('floor-tile');
    if (this.textures.exists('nixy-portrait-idle')) this.textures.remove('nixy-portrait-idle');
    if (this.textures.exists('nixy-portrait-damage')) this.textures.remove('nixy-portrait-damage');
    if (this.textures.exists('nixy-ult-cutin-1')) this.textures.remove('nixy-ult-cutin-1');
    if (this.textures.exists('nixy-ult-cutin-2')) this.textures.remove('nixy-ult-cutin-2');
    if (this.textures.exists('nixy-ult-cutin-3')) this.textures.remove('nixy-ult-cutin-3');
    if (this.textures.exists('chat-succubus')) this.textures.remove('chat-succubus');
    if (this.textures.exists('chat-nixy')) this.textures.remove('chat-nixy');

    if (this.textures.exists('gem-green')) this.textures.remove('gem-green');
    if (this.textures.exists('gem-blue')) this.textures.remove('gem-blue');
    if (this.textures.exists('gem-red')) this.textures.remove('gem-red');
    if (this.textures.exists('gem-orange')) this.textures.remove('gem-orange');
    if (this.textures.exists('gem-gold')) this.textures.remove('gem-gold');
    if (this.textures.exists('item-chalice')) this.textures.remove('item-chalice');
    if (this.textures.exists('item-magnet')) this.textures.remove('item-magnet');
    if (this.textures.exists('item-chest')) this.textures.remove('item-chest');
    if (this.textures.exists('item-soul')) this.textures.remove('item-soul');
    if (this.textures.exists('void-scythe')) this.textures.remove('void-scythe');
    if (this.textures.exists('blood-dagger')) this.textures.remove('blood-dagger');
    if (this.textures.exists('infernal-meteor')) this.textures.remove('infernal-meteor');
    if (this.textures.exists('card-base')) this.textures.remove('card-base');
    if (this.textures.exists('card-fire')) this.textures.remove('card-fire');
    if (this.textures.exists('card-gold')) this.textures.remove('card-gold');
    if (this.textures.exists('card-green')) this.textures.remove('card-green');
    if (this.textures.exists('card-ice')) this.textures.remove('card-ice');
    if (this.textures.exists('card-inferno')) this.textures.remove('card-inferno');
    if (this.textures.exists('card-mystic')) this.textures.remove('card-mystic');
    if (this.textures.exists('card-obsidian')) this.textures.remove('card-obsidian');
    if (this.textures.exists('altar-1')) this.textures.remove('altar-1');
    if (this.textures.exists('altar-2')) this.textures.remove('altar-2');
    if (this.textures.exists('altar-3')) this.textures.remove('altar-3');
    if (this.textures.exists('altar-invoc-inactive')) this.textures.remove('altar-invoc-inactive');
    if (this.textures.exists('altar-invoc-active-1')) this.textures.remove('altar-invoc-active-1');
    if (this.textures.exists('altar-invoc-active-2')) this.textures.remove('altar-invoc-active-2');
    if (this.textures.exists('soul-shoot')) this.textures.remove('soul-shoot');
    if (this.textures.exists('apocalypse-shoot')) this.textures.remove('apocalypse-shoot');
    if (this.textures.exists('game-title-logo')) this.textures.remove('game-title-logo');
    for (let i = 1; i <= 6; i++) {
      if (this.textures.exists(`intro-${i}`)) this.textures.remove(`intro-${i}`);
    }
    if (this.textures.exists('chat-boss')) this.textures.remove('chat-boss');
    if (this.textures.exists('chat-chefe')) this.textures.remove('chat-chefe');
    for (let i = 1; i <= 5; i++) {
      if (this.textures.exists(`explosion-${i}`)) this.textures.remove(`explosion-${i}`);
    }
    if (this.textures.exists('mummy-poison-gosma')) this.textures.remove('mummy-poison-gosma');
    if (this.textures.exists('ui-kills-icon')) this.textures.remove('ui-kills-icon');
    if (this.textures.exists('ui-menu-arrow')) this.textures.remove('ui-menu-arrow');
    if (this.textures.exists('ult-gauge-frame')) this.textures.remove('ult-gauge-frame');
    if (this.textures.exists('ult-gauge-bg')) this.textures.remove('ult-gauge-bg');
    if (this.textures.exists('ui-status-hud')) this.textures.remove('ui-status-hud');
    if (this.textures.exists('ui-char-name-nixy')) this.textures.remove('ui-char-name-nixy');
    this.sound.removeByKey('bgm-azazel-intro');
    this.sound.removeByKey('bgm-azazel-mid');
    this.sound.removeByKey('bgm-azazel-fight');
    if (this.textures.exists('floor-tile-2')) this.textures.remove('floor-tile-2');
    if (this.textures.exists('azazel-crystal')) this.textures.remove('azazel-crystal');
    if (this.textures.exists('chat-azazel')) this.textures.remove('chat-azazel');
    if (this.textures.exists('azazel-orb')) this.textures.remove('azazel-orb');
    if (this.textures.exists('azazel-lightning-bolt')) this.textures.remove('azazel-lightning-bolt');
    for (const dir of DIRECTIONS_8) {
      if (this.textures.exists(`azazel-idle-${dir}`)) this.textures.remove(`azazel-idle-${dir}`);
      if (this.textures.exists(`azazel-hand-${dir}`)) this.textures.remove(`azazel-hand-${dir}`);
      if (this.anims.exists(`azazel-idle-${dir}`)) this.anims.remove(`azazel-idle-${dir}`);
      if (this.anims.exists(`azazel-hand-${dir}`)) this.anims.remove(`azazel-hand-${dir}`);
      if (this.anims.exists(`azazel-run-${dir}`)) this.anims.remove(`azazel-run-${dir}`);
    }
    for (const dir of ['east', 'north', 'south', 'west'] as const) {
      for (let i = 0; i < 8; i++) {
        if (this.textures.exists(`azazel-run-${dir}-${i}`)) this.textures.remove(`azazel-run-${dir}-${i}`);
      }
    }
    if (this.textures.exists('chat-nixy-damage')) this.textures.remove('chat-nixy-damage');
    if (this.textures.exists('chat-rosalin-defeated')) this.textures.remove('chat-rosalin-defeated');
    if (this.textures.exists('ui-star')) this.textures.remove('ui-star');
  }

  preload(): void {
    const { width, height } = this.scale;
    // Timestamp dinâmico garante que o navegador NUNCA sirva imagens em cache antigo
    const cacheBuster = Date.now();

    // Garante carregamento da fonte Pixelzone na memória do navegador
    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.load("24px 'Pixelzone'").catch(() => {});
    }

    // Barra de carregamento
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x221111, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 35, 'Invocando Hell Survivor...', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ff4422'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xff3311, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    this.load.on('loaderror', (fileObj: any) => {
      console.error(`[BootScene] ERRO ao carregar arquivo: ${fileObj.key} (${fileObj.src})`);
    });

    // 1. Carregar sprites de Idle (8 direções) com timestamp dinâmico
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `nixy-idle-${dir}`,
        `assets/sprites/nixy/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
    }

    // 2. Carregar sprites de Corrida (8 direções x 8 frames)
    for (const dir of DIRECTIONS_8) {
      for (let i = 0; i < 8; i++) {
        this.load.image(
          `nixy-run-${dir}-${i}`,
          `assets/sprites/nixy/Running/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 3. Carregar sprites de Full Sprint (8 direções x 8 frames)
    for (const dir of DIRECTIONS_8) {
      for (let i = 0; i < 8; i++) {
        this.load.image(
          `nixy-sprint-${dir}-${i}`,
          `assets/sprites/nixy/Full_Sprint/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 4. Carregar sprites de Dano (taking_damage) nos 8 ângulos
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `nixy-hurt-${dir}`,
        `assets/sprites/nixy/taking_damage/rotations/${dir}.png?t=${cacheBuster}`
      );
    }

    // 5. Carregar sprites de Sentada
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `nixy-sitting-${dir}`,
        `assets/sprites/nixy/sitting_down/rotations/${dir}.png?t=${cacheBuster}`
      );
    }

    // 6. Carregar textura do chão enviada pelo usuário (Chão1.jpg)
    this.load.image('floor-tile', `assets/textures/chao1.jpg?t=${cacheBuster}`);

    // 7. Carregar sprites do Zombie Dog (Idle nos 8 ângulos)
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `zombie-dog-idle-${dir}`,
        `assets/sprites/enemies/zombie-dog/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
    }

    // 8. Carregar sprites de corrida do Zombie Dog (4 direções cardinais x 8 frames)
    const DOG_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of DOG_DIRS) {
      for (let i = 0; i < 8; i++) {
        this.load.image(
          `zombie-dog-run-${dir}-${i}`,
          `assets/sprites/enemies/zombie-dog/Idle/animations/Running/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 9. Carregar retratos de UI da Nixy (novas versões atualizadas: Idle UI e Damage UI)
    this.load.image('nixy-portrait-idle', `assets/sprites/nixy/UI/Idle UI.png?t=${cacheBuster}`);
    this.load.image('nixy-portrait-damage', `assets/sprites/nixy/UI/Damage UI.png?t=${cacheBuster}`);

    // 9.1. Carregar sprites da Animação Oficial da Suprema / Cut-In da Nixy (300x70px)
    this.load.image('nixy-ult-cutin-1', `assets/sprites/nixy/Ult%20Animation/UltNixy1.png?t=${cacheBuster}`);
    this.load.image('nixy-ult-cutin-2', `assets/sprites/nixy/Ult%20Animation/UltNixy2.png?t=${cacheBuster}`);
    this.load.image('nixy-ult-cutin-3', `assets/sprites/nixy/Ult%20Animation/UltNixy3.png?t=${cacheBuster}`);

    // 10. Carregar sprites da Succubus (Idle nos 8 ângulos)
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `succubus-idle-${dir}`,
        `assets/sprites/enemies/Succubus/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
    }

    // 11. Carregar animações de voo/asas da Succubus (8 direções x 5 frames)
    for (const dir of DIRECTIONS_8) {
      for (let i = 0; i < 5; i++) {
        this.load.image(
          `succubus-fly-${dir}-${i}`,
          `assets/sprites/enemies/Succubus/Idle/animations/The_character_violently_flaps_her_expansive_wings/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 12. Carregar sprites especiais de conversa/diálogo (Chat<Nome>)
    this.load.image('chat-succubus', `assets/sprites/enemies/Succubus/ChatSuccubus.png?t=${cacheBuster}`);
    this.load.image('chat-nixy', `assets/sprites/nixy/ChatNixy.png?t=${cacheBuster}`);

    // 13. Carregar sprites do Skull Slime (Idle nos 8 ângulos e corrida em 4 eixos x 9 frames)
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `skull-slime-idle-${dir}`,
        `assets/sprites/enemies/Skull Slime/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
    }
    const SLIME_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of SLIME_DIRS) {
      for (let i = 0; i < 9; i++) {
        this.load.image(
          `skull-slime-run-${dir}-${i}`,
          `assets/sprites/enemies/Skull Slime/Idle/animations/Running/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 14. Carregar sprites do Blood Bat (Idle nos 8 ângulos e voo em 4 eixos x 5 frames)
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `blood-bat-idle-${dir}`,
        `assets/sprites/enemies/Blood Bat/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
    }
    const BAT_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of BAT_DIRS) {
      for (let i = 0; i < 5; i++) {
        this.load.image(
          `blood-bat-fly-${dir}-${i}`,
          `assets/sprites/enemies/Blood Bat/Idle/animations/The_creature_rapidly_beats_its_wings_to_hover_keep/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 14.1. Carregar sprites da Múmia (Idle nos 8 ângulos e caminhada em 4 eixos x 9 frames)
    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `mummy-idle-${dir}`,
        `assets/sprites/enemies/Mummy/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
    }
    const MUMMY_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of MUMMY_DIRS) {
      for (let i = 0; i < 9; i++) {
        this.load.image(
          `mummy-walk-${dir}-${i}`,
          `assets/sprites/enemies/Mummy/Idle/animations/The_character_lurches_forward_with_a_stiff-legged/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    // 15. Carregar sprites oficiais das Gemas de Alma criadas pelo usuário (40x40px)
    this.load.image('gem-green', `assets/sprites/items/gem-green.png?t=${cacheBuster}`);
    this.load.image('gem-blue', `assets/sprites/items/gem-blue.png?t=${cacheBuster}`);
    this.load.image('gem-red', `assets/sprites/items/gem-red.png?t=${cacheBuster}`);
    this.load.image('gem-orange', `assets/sprites/items/gem-orange.png?t=${cacheBuster}`);
    this.load.image('gem-purple', `assets/sprites/items/gem-purple.png?t=${cacheBuster}`);
    this.load.image('gem-gold', `assets/sprites/items/gem-gold.png?t=${cacheBuster}`);
    this.load.image('item-chalice', `assets/sprites/items/chalice.png?t=${cacheBuster}`);
    this.load.image('item-magnet', `assets/sprites/items/magnet.png?t=${cacheBuster}`);
    this.load.image('item-chest', `assets/sprites/items/chest.png?t=${cacheBuster}`);
    this.load.image('item-soul', `assets/sprites/items/Soul.png?t=${cacheBuster}`);
    this.load.image('ui-kills-icon', `assets/sprites/items/Kills.png?t=${cacheBuster}`);
    this.load.image('ui-menu-arrow', `assets/sprites/items/Seta.png?t=${cacheBuster}`);
    this.load.image('ult-gauge-frame', `assets/sprites/items/UltGauge1.png?t=${cacheBuster}`);
    this.load.image('ult-gauge-bg', `assets/sprites/items/UltGauge2.png?t=${cacheBuster}`);
    this.load.image('ui-status-hud', `assets/sprites/items/StatusHud.png?t=${cacheBuster}`);
    this.load.image('ui-char-name-nixy', `assets/sprites/items/NixyName.png?t=${cacheBuster}`);
    this.load.image('void-scythe', `assets/sprites/items/scythe.png?t=${cacheBuster}`);
    this.load.image('blood-dagger', `assets/sprites/items/Adaga.png?t=${cacheBuster}`);
    this.load.image('infernal-meteor', `assets/sprites/items/Meteoro.png?t=${cacheBuster}`);
    this.load.image('soul-shoot', `assets/sprites/items/Soul%20Shoot.png?t=${cacheBuster}`);
    this.load.image('apocalypse-shoot', `assets/sprites/items/Apocalypse%20Shoot.png?t=${cacheBuster}`);

    // Molduras de Cartas de Bênçãos (120x200px)
    this.load.image('card-base', `assets/sprites/cards/Base%20Card.png?t=${cacheBuster}`);
    this.load.image('card-fire', `assets/sprites/cards/Fire%20Card.png?t=${cacheBuster}`);
    this.load.image('card-gold', `assets/sprites/cards/Gold%20Card.png?t=${cacheBuster}`);
    this.load.image('card-green', `assets/sprites/cards/Green%20Card.png?t=${cacheBuster}`);
    this.load.image('card-ice', `assets/sprites/cards/Ice%20Card.png?t=${cacheBuster}`);
    this.load.image('card-inferno', `assets/sprites/cards/Inferno%20Card.png?t=${cacheBuster}`);
    this.load.image('card-mystic', `assets/sprites/cards/Mystic%20Card.png?t=${cacheBuster}`);
    this.load.image('card-obsidian', `assets/sprites/cards/Obsidian%20Card.png?t=${cacheBuster}`);

    // Sprites do Altar de Ascensão / Evolução (200x200px)
    this.load.image('altar-1', `assets/sprites/items/Altar%201.png?t=${cacheBuster}`);
    this.load.image('altar-2', `assets/sprites/items/Altar%202.png?t=${cacheBuster}`);
    this.load.image('altar-3', `assets/sprites/items/Altar%203.png?t=${cacheBuster}`);

    // Sprites do Altar de Invocação do Chefe (200x200px)
    this.load.image('altar-invoc-inactive', `assets/sprites/items/AltarInvoc.png?t=${cacheBuster}`);
    this.load.image('altar-invoc-active-1', `assets/sprites/items/AltarInvoc%20Ativo1.png?t=${cacheBuster}`);
    this.load.image('altar-invoc-active-2', `assets/sprites/items/AltarInvoc%20Ativo2.png?t=${cacheBuster}`);

    // Sprites de Explosão Animada Oficial (200x200px)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`explosion-${i}`, `assets/sprites/items/Explosion${i}.png?t=${cacheBuster}`);
    }

    // Sprite da Gosma Tóxica da Múmia (40x40px)
    this.load.image('mummy-poison-gosma', `assets/sprites/items/Gosma.png?t=${cacheBuster}`);

    this.load.image('game-title-logo', `assets/sprites/title.png?t=${cacheBuster}`);
    this.load.image('menu-background', `assets/sprites/main_menu_background.jpg?t=${cacheBuster}`);

    // 16. Carregar trilhas sonoras oficiais (BGM)
    this.load.audio('bgm-menu', 'assets/audio/hell-survivor.mp3');
    this.load.audio('bgm-battle', 'assets/audio/eternal-shadow.mp3');
    this.load.audio('bgm-boss', 'assets/audio/orchestral-overture.mp3');
    this.load.audio('bgm-intro', 'assets/audio/halloween.mp3');
    this.load.audio('bgm-spooky', 'assets/audio/spooky-halloween.mp3');

    // 17. Cenas Cinematográficas da Introdução (Intro 1 a 6) e Retrato do Chefe
    for (let i = 1; i <= 6; i++) {
      this.load.image(`intro-${i}`, `assets/scenes/intro/Intro%20${i}.jpg?t=${cacheBuster}`);
    }

    // 18. Cenas do Desfecho do Capítulo 1 (EndChap1 1 a 5)
    for (let i = 1; i <= 5; i++) {
      this.load.image(`endchap1-${i}`, `assets/scenes/chapter1/EndChap1_${i}.jpg?t=${cacheBuster}`);
    }

    // 19. Projétil Ataque de Coração da Succubus (HeartAttack)
    this.load.image('projectile-heart-attack', `assets/sprites/items/HeartAttack.png?t=${cacheBuster}`);

    // 20. Retratos especiais de Visual Novel (Portraits) e Estrela de Classificação (STAR)
    this.load.image('chat-nixy-damage', `assets/sprites/portraits/Nixy_Damage_Chat.png?t=${cacheBuster}`);
    this.load.image('chat-rosalin-defeated', `assets/sprites/portraits/Rosalin_Defeated.png?t=${cacheBuster}`);
    this.load.image('ui-star', `assets/sprites/items/Star.png?t=${cacheBuster}`);

    this.load.image('chat-boss', `assets/sprites/npcs/Boss.png?t=${cacheBuster}`);
    this.load.image('chat-chefe', `assets/sprites/npcs/Boss.png?t=${cacheBuster}`);

    // 21. Elementos Decorativos de Cenário (80x80px)
    this.load.image('scenery-cogumelos', `assets/sprites/items/Cogumelos.png?t=${cacheBuster}`);
    this.load.image('scenery-cristal', `assets/sprites/items/Cristal.png?t=${cacheBuster}`);
    this.load.image('scenery-ossos', `assets/sprites/items/Pilha%20de%20Ossos.png?t=${cacheBuster}`);
    this.load.image('scenery-rocha', `assets/sprites/items/Rocha.png?t=${cacheBuster}`);
    this.load.image('scenery-rocha-2', `assets/sprites/items/Rocha2.png?t=${cacheBuster}`);
    this.load.image('scenery-tocha', `assets/sprites/items/Tocha.png?t=${cacheBuster}`);

    // 22. Animação da Estrela de Respawn (Pentagrama de Invocação - 6 frames)
    for (let i = 1; i <= 6; i++) {
      this.load.image(`respawn-star-${i}`, `assets/sprites/items/Respawn%20Star%20${i}.png?t=${cacheBuster}`);
    }

    // 23. Capítulo 2 e Boss Azazel (Textura chao2, Cristal de Azazel, Sprites e Trilha Sonora Tripla)
    this.load.image('floor-tile-2', `assets/textures/chao2.jpg?t=${cacheBuster}`);
    this.load.image('azazel-crystal', `assets/sprites/items/CristalAzazel.png?t=${cacheBuster}`);
    this.load.image('chat-azazel', `assets/sprites/enemies/Azazel/AzazelChat.png?t=${cacheBuster}`);

    for (const dir of DIRECTIONS_8) {
      this.load.image(
        `azazel-idle-${dir}`,
        `assets/sprites/enemies/Azazel/Idle/rotations/${dir}.png?t=${cacheBuster}`
      );
      this.load.image(
        `azazel-hand-${dir}`,
        `assets/sprites/enemies/Azazel/Rise%20Hand/rotations/${dir}.png?t=${cacheBuster}`
      );
    }

    const AZAZEL_RUN_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of AZAZEL_RUN_DIRS) {
      for (let i = 0; i < 8; i++) {
        this.load.image(
          `azazel-run-${dir}-${i}`,
          `assets/sprites/enemies/Azazel/Idle/animations/Running/${dir}/frame_00${i}.png?t=${cacheBuster}`
        );
      }
    }

    this.load.audio('bgm-azazel-intro', 'assets/audio/azazel/intro.mp3');
    this.load.audio('bgm-azazel-mid', 'assets/audio/azazel/mid.mp3');
    this.load.audio('bgm-azazel-fight', 'assets/audio/azazel/fight.mp3');
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    // 1. Textura do chão: fallback procedural apenas caso a imagem não exista
    if (!this.textures.exists('floor-tile')) {
      this.createFloorTexture();
    }

    // 2. Registrar animações do Zombie Dog
    const DOG_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of DOG_DIRS) {
      const dogFrames = [];
      for (let i = 0; i < 8; i++) {
        dogFrames.push({ key: `zombie-dog-run-${dir}-${i}` });
      }

      this.anims.create({
        key: `zombie-dog-run-${dir}`,
        frames: dogFrames,
        frameRate: 11,
        repeat: -1
      });
    }

    for (const dir of DIRECTIONS_8) {
      this.anims.create({
        key: `zombie-dog-idle-${dir}`,
        frames: [{ key: `zombie-dog-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });

      // Animações de voo/asas e idle da Succubus (8 direções)
      const succubusFrames = [];
      for (let i = 0; i < 5; i++) {
        succubusFrames.push({ key: `succubus-fly-${dir}-${i}` });
      }

      this.anims.create({
        key: `succubus-fly-${dir}`,
        frames: succubusFrames,
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `succubus-idle-${dir}`,
        frames: [{ key: `succubus-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });
    }

    // Registrar animações do Skull Slime (9 frames de corrida e 8 direções de idle)
    const SLIME_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of SLIME_DIRS) {
      const slimeFrames = [];
      for (let i = 0; i < 9; i++) {
        slimeFrames.push({ key: `skull-slime-run-${dir}-${i}` });
      }

      this.anims.create({
        key: `skull-slime-run-${dir}`,
        frames: slimeFrames,
        frameRate: 11,
        repeat: -1
      });
    }

    for (const dir of DIRECTIONS_8) {
      this.anims.create({
        key: `skull-slime-idle-${dir}`,
        frames: [{ key: `skull-slime-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });
    }

    // Registrar animações do Blood Bat (5 frames de voo e 8 direções de idle)
    const BAT_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of BAT_DIRS) {
      const batFrames = [];
      for (let i = 0; i < 5; i++) {
        batFrames.push({ key: `blood-bat-fly-${dir}-${i}` });
      }

      this.anims.create({
        key: `blood-bat-fly-${dir}`,
        frames: batFrames,
        frameRate: 13,
        repeat: -1
      });
    }

    for (const dir of DIRECTIONS_8) {
      this.anims.create({
        key: `blood-bat-idle-${dir}`,
        frames: [{ key: `blood-bat-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });
    }

    // Registrar animações da Múmia (9 frames de caminhada arrastada e 8 direções de idle)
    const MUMMY_CARDINALS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of MUMMY_CARDINALS) {
      const mummyFrames = [];
      for (let i = 0; i < 9; i++) {
        mummyFrames.push({ key: `mummy-walk-${dir}-${i}` });
      }
      this.anims.create({
        key: `mummy-walk-${dir}`,
        frames: mummyFrames,
        frameRate: 9,
        repeat: -1
      });
    }

    for (const dir of DIRECTIONS_8) {
      this.anims.create({
        key: `mummy-idle-${dir}`,
        frames: [{ key: `mummy-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });
    }

    // Registrar animações do Boss Azazel (Idle 8 direções, Rise Hand 8 direções e Running 8 frames mapeados para 8 direções)
    for (const dir of DIRECTIONS_8) {
      this.anims.create({
        key: `azazel-idle-${dir}`,
        frames: [{ key: `azazel-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });

      this.anims.create({
        key: `azazel-hand-${dir}`,
        frames: [{ key: `azazel-hand-${dir}` }],
        frameRate: 1,
        repeat: -1
      });

      const runAxis = (dir === 'north-east' || dir === 'south-east')
        ? 'east'
        : (dir === 'north-west' || dir === 'south-west')
          ? 'west'
          : dir;
      const azazelRunFrames = [];
      for (let i = 0; i < 8; i++) {
        azazelRunFrames.push({ key: `azazel-run-${runAxis}-${i}` });
      }
      this.anims.create({
        key: `azazel-run-${dir}`,
        frames: azazelRunFrames,
        frameRate: 12,
        repeat: -1
      });
    }

    // 1.5. Registrar animação de explosão (Explosion 1 a 5)
    if (this.anims.exists('anim-explosion')) {
      this.anims.remove('anim-explosion');
    }
    this.anims.create({
      key: 'anim-explosion',
      frames: [
        { key: 'explosion-1' },
        { key: 'explosion-2' },
        { key: 'explosion-3' },
        { key: 'explosion-4' },
        { key: 'explosion-5' }
      ],
      frameRate: 15,
      repeat: 0
    });

    // 1.6. Registrar animação da Estrela de Respawn (Pentagrama de Invocação - 6 frames)
    if (this.anims.exists('anim-respawn-star')) {
      this.anims.remove('anim-respawn-star');
    }
    this.anims.create({
      key: 'anim-respawn-star',
      frames: [
        { key: 'respawn-star-1' },
        { key: 'respawn-star-2' },
        { key: 'respawn-star-3' },
        { key: 'respawn-star-4' },
        { key: 'respawn-star-5' },
        { key: 'respawn-star-6' }
      ],
      frameRate: 10,
      repeat: 0
    });

    // 2. Criar texturas procedurais para armas, inimigos e efeitos
    this.createSoulBoltTexture();
    this.createEnemyImpTexture();
    this.createParticleTextures();
    this.createGemTextures();
    this.createScytheTexture();
    this.createDarkOrbTexture();
    this.createBloodDaggerTexture();
    this.createAzazelVfxTextures();

    // 3. Registrar animações da Nixy para as 8 direções
    for (const dir of DIRECTIONS_8) {
      // Animação de corrida normal
      const runFrames = [];
      for (let i = 0; i < 8; i++) {
        runFrames.push({ key: `nixy-run-${dir}-${i}` });
      }

      this.anims.create({
        key: `nixy-run-${dir}`,
        frames: runFrames,
        frameRate: 11,
        repeat: -1
      });

      // Animação de Full Sprint (corrida acelerada)
      const sprintFrames = [];
      for (let i = 0; i < 8; i++) {
        sprintFrames.push({ key: `nixy-sprint-${dir}-${i}` });
      }

      this.anims.create({
        key: `nixy-sprint-${dir}`,
        frames: sprintFrames,
        frameRate: 14,
        repeat: -1
      });

      // Animação de idle (utiliza o frame da pose estática atualizada)
      this.anims.create({
        key: `nixy-idle-${dir}`,
        frames: [{ key: `nixy-idle-${dir}` }],
        frameRate: 1,
        repeat: -1
      });

      // Animação/Pose de reação a dano (taking_damage)
      this.anims.create({
        key: `nixy-hurt-${dir}`,
        frames: [{ key: `nixy-hurt-${dir}` }],
        frameRate: 1,
        repeat: -1
      });
    }

    // Iniciar o Menu Principal de seleção de modo
    this.scene.start('MenuScene');
  }

  private createFloorTexture(): void {
    if (this.textures.exists('floor-tile')) return;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo cinza escuro ardósia/infernal
    ctx.fillStyle = '#141217';
    ctx.fillRect(0, 0, size, size);

    // Grid de lajotas de pedra
    ctx.strokeStyle = '#0a080c';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);

    // Linha divisória interna (estilo tijolos encaixados)
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Detalhes de textura e trincas de magma
    ctx.strokeStyle = '#2d1b22';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, size / 2 - 12, size / 2 - 12);
    ctx.strokeRect(size / 2 + 6, size / 2 + 6, size / 2 - 12, size / 2 - 12);

    // Pequenas brasas discretas
    ctx.fillStyle = '#ff330033';
    ctx.beginPath();
    ctx.arc(32, 32, 2, 0, Math.PI * 2);
    ctx.arc(96, 96, 2, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas('floor-tile', canvas);
  }

  private createSoulBoltTexture(): void {
    if (this.textures.exists('soul-bolt')) return;

    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Brilho externo ciano/espiritual
    const gradient = ctx.createRadialGradient(8, 8, 1, 8, 8, 7);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#00f5d4');
    gradient.addColorStop(0.7, '#0077b6');
    gradient.addColorStop(1, 'rgba(0, 119, 182, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo cintilante
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 7, 2, 2);

    this.textures.addCanvas('soul-bolt', canvas);
  }

  private createEnemyImpTexture(): void {
    if (this.textures.exists('enemy-imp')) return;

    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Chifres escuros
    ctx.fillStyle = '#2b0938';
    ctx.fillRect(8, 4, 4, 8);
    ctx.fillRect(20, 4, 4, 8);
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillRect(22, 2, 4, 4);

    // Cabeça/corpo carmesim infernal
    ctx.fillStyle = '#9b111e';
    ctx.fillRect(8, 10, 16, 14);

    // Asas/ombros escuros
    ctx.fillStyle = '#590d22';
    ctx.fillRect(4, 12, 4, 10);
    ctx.fillRect(24, 12, 4, 10);

    // Olhos flamejantes amarelos/âmbar
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(11, 14, 3, 3);
    ctx.fillRect(18, 14, 3, 3);

    // Presas afiadas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 20, 2, 3);
    ctx.fillRect(17, 20, 2, 3);

    // Pernas/pés
    ctx.fillStyle = '#590d22';
    ctx.fillRect(10, 24, 4, 6);
    ctx.fillRect(18, 24, 4, 6);

    this.textures.addCanvas('enemy-imp', canvas);
  }

  private createParticleTextures(): void {
    if (!this.textures.exists('particle-spark')) {
      const canvas = document.createElement('canvas');
      canvas.width = 6;
      canvas.height = 6;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 0, 2, 6);
        ctx.fillRect(0, 2, 6, 2);
        this.textures.addCanvas('particle-spark', canvas);
      }
    }

    // Halo de Luz Quente e Suave para Tochas de Cenário (180x180px)
    if (!this.textures.exists('torch-light')) {
      const size = 180;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rad = size / 2;
        const grad = ctx.createRadialGradient(rad, rad, 4, rad, rad, rad);
        grad.addColorStop(0, 'rgba(255, 175, 40, 0.85)');
        grad.addColorStop(0.25, 'rgba(255, 110, 20, 0.45)');
        grad.addColorStop(0.60, 'rgba(217, 4, 41, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rad, rad, rad, 0, Math.PI * 2);
        ctx.fill();
        this.textures.addCanvas('torch-light', canvas);
      }
    }

    // Bruma e Fumaça Carmesim Suave para as Bordas do Cenário (64x64px)
    if (!this.textures.exists('particle-smoke')) {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rad = size / 2;
        const grad = ctx.createRadialGradient(rad, rad, 2, rad, rad, rad);
        grad.addColorStop(0, 'rgba(45, 10, 22, 0.65)');
        grad.addColorStop(0.40, 'rgba(30, 6, 16, 0.40)');
        grad.addColorStop(0.75, 'rgba(15, 3, 9, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rad, rad, rad, 0, Math.PI * 2);
        ctx.fill();
        this.textures.addCanvas('particle-smoke', canvas);
      }
    }
  }

  private createGemTextures(): void {
    const gemConfigs = [
      { key: 'gem-green', size: 16, main: '#06d6a0', light: '#a7f3d0', dark: '#023e2c', core: '#ffffff' },
      { key: 'gem-blue',  size: 16, main: '#118ab2', light: '#bee9e8', dark: '#03045e', core: '#ffffff' },
      { key: 'gem-red',   size: 20, main: '#ef233c', light: '#ffb4a2', dark: '#590d22', core: '#ffffff' },
      { key: 'gem-purple', size: 24, main: '#b5179e', light: '#f72585', dark: '#3a0ca3', core: '#ffffff' }
    ];

    for (const g of gemConfigs) {
      if (this.textures.exists(g.key)) continue;

      const canvas = document.createElement('canvas');
      canvas.width = g.size;
      canvas.height = g.size;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const half = g.size / 2;

      // Sombra externa
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.moveTo(half, 2);
      ctx.lineTo(g.size - 1, half);
      ctx.lineTo(half, g.size);
      ctx.lineTo(1, half);
      ctx.closePath();
      ctx.fill();

      // Corpo principal do losango
      ctx.fillStyle = g.main;
      ctx.beginPath();
      ctx.moveTo(half, 1);
      ctx.lineTo(g.size - 2, half);
      ctx.lineTo(half, g.size - 1);
      ctx.lineTo(2, half);
      ctx.closePath();
      ctx.fill();

      // Faceta superior iluminada (brilho cristalino)
      ctx.fillStyle = g.light;
      ctx.beginPath();
      ctx.moveTo(half, 2);
      ctx.lineTo(g.size - 3, half);
      ctx.lineTo(half, half);
      ctx.lineTo(3, half);
      ctx.closePath();
      ctx.fill();

      // Borda escura chanfrada
      ctx.strokeStyle = g.dark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ponto focal cintilante (core)
      ctx.fillStyle = g.core;
      ctx.fillRect(half - 1, half - 3, 2, 2);

      this.textures.addCanvas(g.key, canvas);
    }
  }

  private createScytheTexture(): void {
    if (this.textures.exists('void-scythe')) return;

    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lâmina curva de foice mística
    ctx.save();
    ctx.translate(size / 2, size / 2);

    // Cabo de ouro antigo / ébano
    ctx.strokeStyle = '#2b0914';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(4, -4);
    ctx.stroke();

    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lâmina curva crescente carmesim e roxa
    ctx.fillStyle = '#9b5de5';
    ctx.beginPath();
    ctx.arc(0, -6, 12, Math.PI * 0.8, Math.PI * 1.8, false);
    ctx.quadraticCurveTo(8, -12, 12, -4);
    ctx.quadraticCurveTo(0, -8, -8, 2);
    ctx.closePath();
    ctx.fill();

    // Fio cortante branco e ciano
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rastro de energia
    ctx.fillStyle = '#f72585';
    ctx.beginPath();
    ctx.arc(4, -10, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.textures.addCanvas('void-scythe', canvas);
  }

  private createDarkOrbTexture(): void {
    if (this.textures.exists('dark-orb')) return;

    const size = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createRadialGradient(10, 10, 2, 10, 10, 9);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ff0055');
    gradient.addColorStop(0.7, '#7209b7');
    gradient.addColorStop(1, 'rgba(114, 9, 183, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas('dark-orb', canvas);
  }

  private createBloodDaggerTexture(): void {
    if (this.textures.exists('blood-dagger')) return;

    const w = 24;
    const h = 10;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lâmina pontiaguda apontando para a direita (0 rad)
    // Cabo escuro + pomo dourado
    ctx.fillStyle = '#2b0914';
    ctx.fillRect(1, 3, 5, 4);
    ctx.fillStyle = '#c59b27';
    ctx.fillRect(0, 3, 2, 4);

    // Guarda-mão dourado/rubi
    ctx.fillStyle = '#f3d17a';
    ctx.fillRect(6, 1, 2, 8);

    // Lâmina carmesim afiada
    ctx.fillStyle = '#ef233c';
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(23, 5);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();

    // Fio superior brilhante branco-rosado
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(8, 3);
    ctx.lineTo(22, 5);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();

    this.textures.addCanvas('blood-dagger', canvas);
  }

  private createAzazelVfxTextures(): void {
    // 1. Orbe de Energia de Azazel (azazel-orb - 28x28px)
    if (!this.textures.exists('azazel-orb')) {
      const size = 28;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const cx = size / 2;
        const grad = ctx.createRadialGradient(cx, cx, 2, cx, cx, cx - 1);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, '#ff3366');
        grad.addColorStop(0.65, '#9d0208');
        grad.addColorStop(1, 'rgba(58, 12, 163, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cx, cx - 1, 0, Math.PI * 2);
        ctx.fill();

        // Anel energético interno
        ctx.strokeStyle = '#ff99bb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cx, 6, 0, Math.PI * 2);
        ctx.stroke();

        this.textures.addCanvas('azazel-orb', canvas);
      }
    }

    // 2. Raio Abissal de Azazel (azazel-lightning-bolt - 64x240px)
    if (!this.textures.exists('azazel-lightning-bolt')) {
      const w = 64;
      const h = 240;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Halo externo carmesim/violeta
        ctx.strokeStyle = 'rgba(255, 20, 90, 0.55)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const pts = [
          [32, 4],
          [20, 48],
          [42, 92],
          [18, 140],
          [38, 185],
          [32, 234]
        ];
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();

        // Feixe intermediário rubi intenso
        ctx.strokeStyle = '#ff2a5f';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Núcleo branco incandescente
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        this.textures.addCanvas('azazel-lightning-bolt', canvas);
      }
    }
  }
}



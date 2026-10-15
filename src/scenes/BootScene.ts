import Phaser from 'phaser';
import { DIRECTIONS_8 } from '../config/balance';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(): void {
    // Limpeza profunda de texturas e animações anteriores para permitir hot-reload sob demanda
    for (const dir of DIRECTIONS_8) {
      this.textures.remove(`nixy-idle-${dir}`);
      this.textures.remove(`nixy-hurt-${dir}`);
      this.textures.remove(`nixy-sitting-${dir}`);

      if (this.anims.exists(`nixy-idle-${dir}`)) this.anims.remove(`nixy-idle-${dir}`);
      if (this.anims.exists(`nixy-hurt-${dir}`)) this.anims.remove(`nixy-hurt-${dir}`);
      if (this.anims.exists(`nixy-run-${dir}`)) this.anims.remove(`nixy-run-${dir}`);
      if (this.anims.exists(`nixy-sprint-${dir}`)) this.anims.remove(`nixy-sprint-${dir}`);

      for (let i = 0; i < 8; i++) {
        this.textures.remove(`nixy-run-${dir}-${i}`);
        this.textures.remove(`nixy-sprint-${dir}-${i}`);
      }
    }

    // Limpar texturas do Zombie Dog
    const DOG_DIRS = ['east', 'north', 'south', 'west'] as const;
    for (const dir of DOG_DIRS) {
      if (this.anims.exists(`zombie-dog-run-${dir}`)) this.anims.remove(`zombie-dog-run-${dir}`);
      for (let i = 0; i < 8; i++) {
        this.textures.remove(`zombie-dog-run-${dir}-${i}`);
      }
    }
    for (const dir of DIRECTIONS_8) {
      this.textures.remove(`zombie-dog-idle-${dir}`);
      if (this.anims.exists(`zombie-dog-idle-${dir}`)) this.anims.remove(`zombie-dog-idle-${dir}`);

      // Limpar texturas e animações da Succubus
      this.textures.remove(`succubus-idle-${dir}`);
      if (this.anims.exists(`succubus-idle-${dir}`)) this.anims.remove(`succubus-idle-${dir}`);
      if (this.anims.exists(`succubus-fly-${dir}`)) this.anims.remove(`succubus-fly-${dir}`);
      for (let i = 0; i < 5; i++) {
        this.textures.remove(`succubus-fly-${dir}-${i}`);
      }
    }

    this.textures.remove('floor-tile');
    this.textures.remove('nixy-portrait-idle');
    this.textures.remove('nixy-portrait-damage');
    this.textures.remove('chat-succubus');
    this.textures.remove('chat-nixy');
  }

  preload(): void {
    const { width, height } = this.scale;
    // Timestamp dinâmico garante que o navegador NUNCA sirva imagens em cache antigo
    const cacheBuster = Date.now();

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
  }

  create(): void {
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

    // 2. Criar texturas procedurais para armas, inimigos e efeitos
    this.createSoulBoltTexture();
    this.createEnemyImpTexture();
    this.createParticleTextures();
    this.createGemTextures();
    this.createScytheTexture();
    this.createDarkOrbTexture();

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
}

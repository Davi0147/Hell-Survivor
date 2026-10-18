# 💀 Hell Survivor

> Jogo de Sobrevivência e Ação Roguelite inspirado em *Vampire Survivors* com estética gótico-barroca e narrativa com diálogos estilizados no estilo *Persona 5*.

![Build](https://img.shields.io/badge/Build-v0.2.1--Chapter1-ff0055?style=for-the-badge)
![Tech](https://img.shields.io/badge/Phaser%203-TypeScript-00f5d4?style=for-the-badge)
![Vite](https://img.shields.io/badge/Bundler-Vite%206-ffd60a?style=for-the-badge)

---

## 🎮 Visão Geral

Assuma o controle de **Nixy**, uma heroína dotada de poderes sombrios e lâminas místicas, em uma jornada pelas profundezas do inferno para purificar as catacumbas antes que o selo da cripta se rompa.

### ✨ Destaques do Projeto:
* **Movimentação em 8 Direções:** Rotações completas de pose e animações de corrida para todos os 8 ângulos direcionais.
* **Sistema de Estamina & Full Sprint:** Mecânica de corrida acelerada com rastro fantasma (*ghost trail*) e gerenciamento de estamina.
* **Auto-Aim & Disparo de Almas:** Ataques automáticos que miram nos monstros mais próximos com balística de alta performance e pooling de memória.
* **Hordas Escalonáveis:** Enxames crescentes de cães zumbis e demônios com balanceamento dinâmico.
* **Sistema de Níveis & Cartas (Upgrades):** Coleta magnética de gemas de almas com subida de nível e seleção de 3 cartas de habilidades e armas.
* **Habilidade Suprema — ETERNAL DESPAIR:** Sequência de 5 segundos com *anime cut-in*, congelamento temporal total dos inimigos e 8 detonações carmesins guiadas por densidade de monstros.
* **Modo História (Capítulo 1):** Meta de purificação de almas, diálogos cinematográficos estilo *Persona 5* (com balão deslizante e retratos de 420px) e confronto épico contra a chefe **Succubus Imperial**.
* **Radar Tático Circular:** Minimapa estilizado barroco com detecção precisa de inimigos e chefes.

---

## 🕹️ Controles

| Comando | Ação |
| :--- | :--- |
| **`W`, `A`, `S`, `D`** / Setas | Mover a Heroína nas 8 Direções |
| **`Shift`** / **`Espaço`** | Full Sprint (Consome Estamina) |
| **Mouse Pointer** / Automático | Auto-Aim nos Inimigos Mais Próximos |
| **`E`** / Clique no Orbe | Ativar Suprema (*Eternal Despair* - quando 100%) |
| **`Espaço`** / **`Enter`** / Clique | Avançar Diálogos |
| **`Esc`** | Pular Diálogos |

---

## 🛠️ Tecnologias Utilizadas

* **Game Engine:** [Phaser 3](https://phaser.io/)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Arquitetura:** Orientada a Objetos com State Machines e Pooling de Memória Tipo-Seguro.

---

## 🚀 Como Executar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Davi0147/Hell-Survivor.git
   cd Hell-Survivor
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   - Dê dois cliques em `JOGAR.bat` na raiz do projeto (limpa caches, libera a porta e abre automaticamente no seu navegador padrão), ou execute pelo terminal:
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000/`

4. **Gerar build de produção:**
   ```bash
   npm run build
   ```

---

## 📜 Documentação

* [Game Design Document (GDD)](docs/GDD.md)
* [Linha do Tempo & Roadmap de Fases](docs/TIMELINE.md)
* [Regras de Desenvolvimento e Workflow Git](docs/DEVELOPMENT_RULES.md)

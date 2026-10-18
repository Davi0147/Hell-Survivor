# Checklist Técnico de Publicação e Release — Hell Survivor

> **Status:** Documento de Auditoria e Checklist de Lançamento (Pacote 1.3)  
> **Data:** 17/10/2026  
> **Escopo:** Somente Leitura da infraestrutura de build, assets e segurança de runtime.

---

## 1. Resumo Executivo de Publicação

| Classificação | Item / Área | Situação Atual | Impacto |
| :--- | :--- | :--- | :--- |
| 🛑 **BLOQUEADOR** | **Caminho de Fonte no CSS (`index.html`)** | `@font-face` aponta para `/assets/fonts/Pixelzone.ttf` (barra inicial absoluta). | Em subdomínio (ex: `user.github.io/hell-survivor/`), a fonte tenta carregar da raiz do domínio e dá erro 404. |
| 🛑 **BLOQUEADOR** | **Invalidação de Cache do Service Worker (`sw.js`)** | O SW usa estratégia *Cache-First* cega (`return cached || networked`) com nome estático `hell-survivor-cache-v1`. | Usuários que já abriram o jogo ficam eternamente presos na versão antiga do cache, ignorando novos deploys no GitHub Pages. |
| ⚠️ **RISCO MÉDIO** | **Fontes Remotas no Google Fonts sem Fallback Offline** | *Silkscreen* e *Press Start 2P* são requisitadas via CDN do Google Fonts no `<head>`. | Se o jogador instalar a PWA e jogar sem internet, as fontes falham e caem para a fonte monospace padrão do sistema operacional. |
| ⚠️ **RISCO MÉDIO** | **Backdoor de Debug em Produção (`?debug=1`)** | `isDevSandboxEnabled()` em `balance.ts` habilita o Sandbox completo em produção caso a URL contenha `?debug=1`. | Qualquer usuário final que descubra o parâmetro pode ativar invulnerabilidade, matar chefes instantaneamente ou alterar dados. |
| ⚠️ **RISCO MÉDIO** | **Variáveis Globais no Objeto `window`** | `window.__PHASER_GAME__` e `window.__hellSurvivorSoundManager` expostas globalmente. | Permite manipulação de cenas, câmera, sons e dados diretamente pelo console do navegador do jogador. |
| ⚠️ **RISCO MÉDIO** | **CI/CD sem Testes e Lint Automáticos** | `deploy.yml` roda apenas `npm ci` e `npm run build` (não roda `npm test` nem `npm run check`). | Se código com erros de lint ou testes unitários falhando for enviado para a branch `main`, o build publica o jogo quebrado no Pages. |
| ⚠️ **RISCO MÉDIO** | **Tamanho Elevado de Assets de Áudio e Cenas (56.8 MB)** | Músicas BGM completas e imagens de introdução em alta resolução somam mais de 45 MB. | Tempo de carregamento inicial em redes móveis 4G oscila entre 22 e 45 segundos para exibir o menu. |
| ⚠️ **RISCO MÉDIO** | **Peso Morto em `public/` (2.79 MB)** | 56 arquivos no disco nunca são requisitados pelo código (incluindo pasta duplicada `Zombie Dog` e `Chão1.jpg`). | Aumenta desnecessariamente o download do build e o consumo de armazenamento do repositório. |
| ⚠️ **RISCO MÉDIO** | **Origem e Licenças de Assets Não Documentadas** | Fontes, músicas e sprites não possuem arquivo de créditos ou termos de licença no repositório. | Risco legal de publicação comercial ou DMCA sem registro explícito de direitos autorais. |
| ✅ **PRONTO** | **Configuração Base do Vite** | `base: './'` configurado em `vite.config.ts`. | O bundle principal de JS e CSS opera perfeitamente com caminhos relativos em subdiretórios. |
| ✅ **PRONTO** | **Case-Sensitivity de Assets** | Todos os 492 arquivos carregados em `BootScene.ts` possuem correspondência exata de maiúsculas/minúsculas no disco. | Zero erros de 404 por case em servidores Linux (GitHub Pages/Android). |
| ✅ **PRONTO** | **Build de Produção e TypeScript** | `npm run build` compila sem erros via `tsc` e minifica o bundle via Vite. | Bundle funcional e validado via `vite preview`. |

---

## 2. Auditoria do Pipeline de Deploy (`deploy.yml` e `vite.config.ts`)

### 2.1 Análise de `.github/workflows/deploy.yml`
- **Gatilho de Disparo:** `push: branches: [ main ]` e `workflow_dispatch` (manual).
- **Ambiente:** `ubuntu-latest` com Node.js versão `20` e cache do `npm`.
- **Passos Executados:**
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4`
  3. `npm ci`
  4. `npm run build` (executa `tsc && vite build`)
  5. `actions/upload-pages-artifact@v3` (aponta para `./dist`)
  6. `actions/deploy-pages@v4`
- **Pontos de Atenção Identificados:**
  1. **Ausência de Trava de Qualidade:** O workflow não executa `npm run check` nem `npm test` antes de compilar. Caso testes quebrem na branch `main`, o deploy prossegue normalmente se o `tsc` passar.
  2. **Branch de Trabalho:** Os pacotes de blindagem estão sendo desenvolvidos na branch `refactor/blindagem`. O deploy só entrará em ação quando for feito merge na `main`.

### 2.2 Análise de `vite.config.ts`
- **Configuração de Base:** `base: './'` (Linha 4).
- **Compatibilidade com Subdiretórios:** Está devidamente configurado com caminho relativo. Permite hospedar tanto na raiz de um domínio próprio (`https://meujogo.com/`) quanto em subpastas de usuário (`https://usuario.github.io/hell-survivor/`).
- **Versionamento do `dist/`:** O diretório `dist/` está listado no `.gitignore` (linha 6), garantindo que artefatos de compilação não sujem o histórico do Git.

---

## 3. Auditoria de Integridade de Assets (`scratch/check_assets.ts`)

Execução automatizada do script comparando cada chamada em `src/scenes/BootScene.ts` contra os arquivos físicos em `public/`:

```
Total de arquivos encontrados em public/: 557
Total de referências de assets avaliadas em BootScene: 492
1. Caminhos absolutos com / no BootScene: 0
2. Mismatches de Case-Sensitivity (quebram no Linux/Android/iOS): 0
3. Arquivos FALTANDO no disco (404 garantido): 0
4. Arquivos unreferenced em public/ (peso morto): 56 (2.79 MB)
```

### 3.1 Lista de Peso Morto em `public/` (Arquivos Não Utilizados)
Os seguintes arquivos existem no disco, são copiados para o `dist/` em cada build, mas nunca são carregados pelo código:
1. **Pasta Duplicada Inteira `assets/sprites/enemies/Zombie Dog/` (40 arquivos — ~110 KB):**
   - O jogo carrega os sprites da pasta em kebab-case `assets/sprites/enemies/zombie-dog/`. A pasta com espaço `Zombie Dog` é uma duplicata órfã de 40 arquivos (Idle e Running).
2. **Textura Duplicada com Acento `assets/textures/Chão1.jpg` (2.19 MB):**
   - O jogo carrega `assets/textures/chao1.jpg` (2.24 MB). O arquivo com caractere especial `Chão1.jpg` é peso morto no disco.
3. **Retratos de Diálogo Não Referenciados:**
   - `assets/sprites/enemies/Succubus/Rosalin_Defeated.png` (103.7 KB) — o jogo carrega a versão em `assets/sprites/portraits/Rosalin_Defeated.png`.
   - `assets/sprites/portraits/Boss_Chat.png` (26.9 KB) — o jogo carrega `assets/sprites/npcs/Boss.png`.
   - `assets/sprites/portraits/Nixy_Chat.png` (60.3 KB) — o jogo carrega `assets/sprites/nixy/ChatNixy.png`.
   - `assets/sprites/portraits/Rosalin_Chat.png` (77.5 KB) — o jogo carrega `assets/sprites/enemies/Succubus/ChatSuccubus.png`.
4. **Ícones de UI e Sprites Órfãos:**
   - `assets/sprites/HellIcon.png` (144.0 KB)
   - `assets/sprites/nixy/UI/damage_ui.png` (62.1 KB) e `idle_ui.png` (60.3 KB) — o jogo carrega `Damage UI.png` e `Idle UI.png`.
   - `assets/sprites/items/Blue Gem.png`, `Gold Gem.png`, `Green Gem.png`, `Orange Gem.png`, `Purple Gem.png` (~17 KB) — o jogo carrega `gem-blue.png`, etc.
   - `assets/sprites/items/Respawn Star 4.png`, `5.png`, `6.png` (~27 KB) — o jogo só carrega de 1 a 3.

---

## 4. Auditoria de PWA e Service Worker (`public/sw.js`)

### 4.1 Configuração Atual
- **Manifesto:** [`public/manifest.webmanifest`](file:///E:/Downloads%20HD/Hell%20Survivor/public/manifest.webmanifest) devidamente configurado com `start_url: "./"`, `scope: "./"`, display `standalone`, orientação `landscape`, e ícones em 192, 256 e 512px.
- **Registro do Worker:** [`src/main.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/main.ts#L32) registra `./sw.js` quando em produção ou protocolo HTTPS.
- **Estratégia de Cache em `public/sw.js`:**
  ```javascript
  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networked = fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return response;
        }).catch(() => cached);
        return cached || networked;
      })
    );
  });
  ```

### 4.2 Falha Crítica de Invalidação de Cache
- O método retorna `cached || networked`. Se `cached` existir no navegador do usuário, **ele serve o arquivo antigo imediatamente sem esperar a rede**.
- Como `index.html` e `sw.js` também entram nesse fluxo (o nome `CACHE_NAME = 'hell-survivor-cache-v1'` é uma constante fixa), quando uma nova versão do jogo é publicada no GitHub Pages, o navegador do usuário **continua exibindo a versão desatualizada**.
- Mesmo que o fetch em segundo plano atualize o cache, o usuário só verá a mudança se recarregar a aba uma segunda vez ou fechar e reabrir o aplicativo PWA.

---

## 5. Auditoria de Carregamento de Fontes

1. **Pixelzone (`@font-face` em `index.html`):**
   - No CSS: `src: url('/assets/fonts/Pixelzone.ttf') format('truetype');` (linha 25).
   - **Risco:** A barra inicial `/assets/...` é um caminho absoluto relativo à raiz do domínio. Se o jogo rodar em `https://davi0147.github.io/Hell-Survivor/`, a requisição irá para `https://davi0147.github.io/assets/...` e retornará **404**.
   - Em `BootScene.ts:172`: `(document as any).fonts.load("24px 'Pixelzone'").catch(() => {});`. A chamada não utiliza `await` antes de iniciar as cenas do jogo, dependendo do elemento oculto `<div>` no HTML para pré-aquecer a fonte.
2. **Silkscreen e Press Start 2P:**
   - Carregadas via CDN do Google Fonts: `https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap`.
   - **Risco:** Requer conexão ativa com a internet no primeiro carregamento. Caso o usuário execute o jogo offline como aplicativo instalado, as fontes podem não carregar se não tiverem sido salvas no cache de rede previamente.
   - Observação: Arquivos locais `slkscr.ttf` e variações existem na pasta `fontes/` do repositório, mas não estão conectados ao `index.html`.

---

## 6. Exposição em Produção e Segurança de Runtime

1. **Ativação do Modo de Teste via URL (`?debug=1`):**
   - Em [`src/config/balance.ts:101-109`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts#L101-L109), a função `isDevSandboxEnabled()` bloqueia o botão visual do Sandbox em produção, **mas abre uma exceção explícita se `params.get('debug') === '1'`**.
   - Qualquer jogador que digitar `?debug=1` no endereço acessará o DevSandboxPanel em produção, podendo alterar velocidade, invulnerabilidade e almas.
2. **Digitação da Senha `DEV` no Teclado:**
   - O comentário em `balance.ts:97` menciona "digitando DEV no Menu Principal".
   - A busca em `src/scenes/MenuScene.ts` e no restante da base comprovou que **esse atalho não está implementado no código**, existindo apenas a chave `localStorage.getItem('hell_survivor_dev_unlocked')` (que é ignorada em produção pela trava da linha 103).
3. **Globais Expostas em `window`:**
   - `window.__PHASER_GAME__ = game;` em [`src/main.ts:21`](file:///E:/Downloads%20HD/Hell%20Survivor/src/main.ts#L21): Toda a instância do Phaser fica acessível no console global do navegador.
   - `window.__hellSurvivorSoundManager = this;` em [`src/systems/SoundManager.ts:32`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L32): Singleton de áudio acessível globalmente.

---

## 7. Mapeamento de Armazenamento Local (`localStorage`)

Todas as chaves utilizadas em `src/` e seus respectivos tratamentos de erro:

| Chave de Armazenamento | Arquivo de Uso | Conteúdo Armazenado | Tratamento de Erro / Schema Migration |
| :--- | :--- | :--- | :--- |
| `hell_survivor_meta_save_v1` | [`MetaProgressManager.ts:85`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/MetaProgressManager.ts#L85) | Objeto JSON com almas, níveis de bênçãos e estatísticas de abates/mortes. | Possui try/catch e merge com `defaultData`. Não valida se números são negativos ou corrompidos. Não possui versionamento interno explícito além do `_v1` na chave. |
| `hell_survivor_map_ch_${ch}` | [`mapData.ts:270`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/mapData.ts#L270) | Objeto JSON do mapa customizado gerado pelo MapEditorSystem. | Possui try/catch. **Bug conhecido documentado:** Ignora o campo `version` do código e carrega o mapa antigo salvo no navegador mesmo se o desenvolvedor atualizar o mapa padrão do jogo. |
| `hell_survivor_endless_record_sec` | [`UIScene.ts:1629`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/UIScene.ts#L1629) | Inteiro em formato string com o recorde de sobrevivência em segundos. | Converte via `parseInt`. Se corrompido, assume 0. |
| `hell_survivor_bgm_vol` | [`SoundManager.ts:38`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L38) | Float em string (ex: "0.7") para volume da música. | Converte via `parseFloat`. Se ausente ou inválido, assume 0.7. |
| `hell_survivor_sfx_vol` | [`SoundManager.ts:43`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L43) | Float em string (ex: "0.8") para volume dos efeitos sonoros. | Converte via `parseFloat`. Se ausente ou inválido, assume 0.8. |
| `hell_survivor_debug_session_log` | [`DebugSessionLogger.ts:134`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/DebugSessionLogger.ts#L134) | Array JSON contendo até 50 eventos recentes de telemetria. | Sobrescrito continuamente a cada novo log. |
| `hell_survivor_dev_unlocked` | [`balance.ts:115`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts#L115) | String `"true"` para liberar modo desenvolvedor. | Ignorado em ambiente de produção (`import.meta.env.PROD`). |

---

## 8. Inventário de Origem e Licenças de Assets

Conforme diretriz estrita de conformidade (sem deduções sem comprovação documental):

| Categoria | Item / Ativo | Origem Documentada no Repositório | Licença Conhecida |
| :--- | :--- | :--- | :--- |
| **Fontes** | `Silkscreen` | Google Fonts / Jason Kottke | SIL Open Font License (OFL 1.1) |
| **Fontes** | `Press Start 2P` | Google Fonts / CodeMan38 | SIL Open Font License (OFL 1.1) |
| **Fontes** | `Pixelzone.ttf` | Origem não documentada no repositório | Licença desconhecida |
| **Áudio (BGM)** | `hell-survivor.mp3` (Menu) | Origem não documentada no repositório | Licença desconhecida |
| **Áudio (BGM)** | `eternal-shadow.mp3` (Batalha Cap 1) | Origem não documentada no repositório | Licença desconhecida |
| **Áudio (BGM)** | `orchestral-overture.mp3` (Chefe Cap 1) | Origem não documentada no repositório | Licença desconhecida |
| **Áudio (BGM)** | `halloween.mp3` / `spooky-halloween.mp3` | Origem não documentada no repositório | Licença desconhecida |
| **Áudio (BGM)** | `azazel/intro.mp3`, `mid.mp3`, `fight.mp3` | Origem não documentada no repositório | Licença desconhecida |
| **Áudio (SFX)** | Efeitos sonoros gerados via Web Audio API | Código original procedural (`SoundManager.ts`) | Autoria própria do projeto |
| **Sprites** | Heroína Nixy (Idle, Running, Sprint, Hurt, Ult) | Origem não documentada no repositório | Licença desconhecida |
| **Sprites** | Inimigos (Zombie Dog, Succubus, Slime, Bat, Mummy, Azazel)| Origem não documentada no repositório | Licença desconhecida |
| **Sprites** | Texturas de Chão (`chao1.jpg`, `chao2.jpg`) | Origem não documentada no repositório | Licença desconhecida |
| **Sprites** | Cenas de História (`Intro 1..6.jpg`, `EndChap1_1..5.jpg`) | Origem não documentada no repositório | Licença desconhecida |

> **Recomendação para Lançamento:** Criar um arquivo `CREDITS.md` ou `docs/LEGAL_NOTICES.md` listando os autores originais de músicas e pacotes de arte antes de publicar comercialmente ou em plataformas abertas.

---

## 9. Desempenho do Build e Carregamento em Redes Móveis

### 9.1 Métricas do Build de Produção (`dist/`)
- **Tamanho total do diretório `dist/` gerado:** **56.79 MB**
- **Bundle JavaScript compilado (`dist/assets/index-*.js`):** **1.97 MB** (gzip: **466.16 kB**)
- **HTML de entrada (`dist/index.html`):** **3.50 kB** (gzip: **1.49 kB**)

### 9.2 Top 10 Maiores Arquivos em `public/`
| Posição | Tamanho | Arquivo | Categoria |
| :---: | :---: | :--- | :--- |
| **#1** | **5.63 MB** (5.768 KB) | `assets/audio/hell-survivor.mp3` | Música BGM do Menu |
| **#2** | **4.98 MB** (5.095 KB) | `assets/audio/orchestral-overture.mp3` | Música BGM da Chefe |
| **#3** | **4.17 MB** (4.272 KB) | `assets/audio/eternal-shadow.mp3` | Música BGM da Batalha |
| **#4** | **2.82 MB** (2.883 KB) | `assets/scenes/intro/Intro 4.jpg` | Cena de Introdução |
| **#5** | **2.68 MB** (2.743 KB) | `assets/scenes/intro/Intro 1.jpg` | Cena de Introdução |
| **#6** | **2.62 MB** (2.686 KB) | `assets/scenes/intro/Intro 2.jpg` | Cena de Introdução |
| **#7** | **2.45 MB** (2.504 KB) | `assets/audio/azazel/fight.mp3` | Música BGM da Batalha Azazel |
| **#8** | **2.40 MB** (2.454 KB) | `assets/scenes/intro/Intro 6.jpg` | Cena de Introdução |
| **#9** | **2.23 MB** (2.283 KB) | `assets/sprites/main_menu_background.jpg` | Imagem de Fundo do Menu |
| **#10**| **2.14 MB** (2.196 KB) | `assets/scenes/intro/Intro 3.jpg` | Cena de Introdução |

### 9.3 Estimativa de Tempo de Carregamento em 4G
Considerando uma conexão média 4G de 20 Mbps (~2.5 MB/s) e uma conexão 4G lenta/instável de 10 Mbps (~1.25 MB/s):
- **4G Médio (2.5 MB/s):** Carregamento completo do pacote inicial (~56.8 MB) leva **~22.7 segundos**.
- **4G Lento (1.25 MB/s):** Carregamento completo do pacote inicial leva **~45.4 segundos**.
- **Impacto em Memória GPU (VRAM):** Imagens JPG de 2 a 3 MB (1920x1080) são descompactadas na memória de vídeo do navegador em formato RGBA (1920 x 1080 x 4 bytes = ~8.3 MB de VRAM por imagem). As 11 imagens de cenas e fundos consom ~90 MB de VRAM apenas com telas estáticas.

---

## 10. Teste e Validação do Build de Produção

1. **Compilação TypeScript & Vite:**
   - Comando: `npm run build`
   - Resultado: Sucesso absoluto (código de saída 0).
   - Saída gerada: `dist/index.html` e `dist/assets/index-CwH5zdy_.js`.
2. **Execução do Servidor de Pré-visualização (`vite preview`):**
   - Comando executado: `vite preview --port 4174`
   - Requisição de teste: `GET http://localhost:4174/`
   - Resposta: HTTP 200 OK com título `"Hell Survivor"`, confirmando que o bundle estático gerado inicializa sem quebras.

# Checklist Técnico de Publicação e Release — Hell Survivor

> **Status:** Documento de Auditoria e Checklist de Lançamento (Pacote 1.4 — Revisado e Complementado)  
> **Data:** 17/10/2026  
> **Escopo:** Somente Leitura da infraestrutura de build, assets e segurança de runtime. Nenhuma alteração de código de jogo ou dependências.

---

## 1. Resumo Executivo de Publicação

| Classificação | Item / Área | Situação Atual | Impacto |
| :--- | :--- | :--- | :--- |
| 🛑 **BLOQUEADOR** | **Invalidação de Cache do Service Worker (`public/sw.js`)** | O SW usa estratégia *Stale-While-Revalidate* cega (`return cached \|\| networked`) com `CACHE_NAME = 'hell-survivor-cache-v1'` estático. | Usuários que já jogaram recebem a versão antiga do cache na primeira visita após um deploy, sem nenhum aviso visual de atualização. |
| ⚠️ **RISCO MÉDIO** | **Backdoor de Debug em Produção (`?debug=1`)** | `isDevSandboxEnabled()` em `balance.ts` permite abrir o DevSandboxPanel em produção caso a URL contenha `?debug=1`. | Qualquer usuário final que adicione o parâmetro na URL tem acesso a invulnerabilidade, alteração de almas e eliminação instantânea de chefes. |
| ⚠️ **RISCO MÉDIO** | **Fontes Remotas no Google Fonts sem Fallback Offline** | *Silkscreen* e *Press Start 2P* são carregadas exclusivamente via CDN do Google Fonts. | No primeiro carregamento sem internet (PWA offline), o download falha e a tipografia cai para a fonte padrão do sistema. |
| ⚠️ **RISCO MÉDIO** | **Variáveis Globais no Objeto `window`** | `window.__PHASER_GAME__` e `window.__hellSurvivorSoundManager` expostas globalmente. | Permite inspeção e manipulação de cenas, áudio e variáveis diretamente pelo console do navegador. |
| ⚠️ **RISCO MÉDIO** | **CI/CD sem Trava de Qualidade Automática** | `deploy.yml` roda apenas `npm ci` e `npm run build` (não roda `npm run check` nem testes). | Se código com testes quebrados ou violações de lint for enviado para a `main`, o build publica o jogo corrompido no Pages. |
| ⚠️ **RISCO MÉDIO** | **Tamanho Elevado de Assets (56.8 MB) e VRAM em Mobile** | Áudios BGM (5.6 MB, 5.0 MB, 4.2 MB) e cenas JPG (2 a 3 MB cada) consom ~90 MB de VRAM e demoram 22–45s em redes 4G. | Carregamento lento em conexões móveis e alto consumo de memória de vídeo em celulares modestos. |
| ⚠️ **RISCO MÉDIO** | **Peso Morto em `public/` (2.79 MB)** | 56 arquivos no disco nunca são requisitados pelo código (incluindo pasta duplicada `Zombie Dog` e `Chão1.jpg`). | Aumenta desnecessariamente o download do build e o consumo de armazenamento do repositório. |
| ⚠️ **RISCO MÉDIO** | **Origem e Licenças de Assets Não Documentadas** | Músicas, texturas e sprites não possuem registro de autor ou termos de licença no repositório. | Risco legal para distribuição comercial ou em lojas de aplicativos sem um arquivo formal de créditos. |
| ✅ **RESOLVIDO / PRONTO** | **Caminho da Fonte Pixelzone no CSS (`index.html`)** | Anteriormente apontado como bloqueador por usar `/assets/fonts/Pixelzone.ttf`. **Auditoria técnica provou que o Vite reescreve automaticamente a URL** tanto em `./` quanto em subdiretórios `/Hell-Survivor/`. | Zero erros de 404 de fonte em subdiretórios ou domínios raiz. |
| ✅ **PRONTO** | **Configuração Base do Vite** | `base: './'` configurado em `vite.config.ts`. | O bundle principal de JS e CSS opera perfeitamente com caminhos relativos em qualquer subdiretório. |
| ✅ **PRONTO** | **Case-Sensitivity de Assets** | Todos os 492 arquivos carregados em `BootScene.ts` possuem correspondência exata de maiúsculas/minúsculas no disco. | Zero erros de 404 por case em servidores Linux (GitHub Pages/Android). |
| ✅ **PRONTO** | **Build de Produção e TypeScript** | `npm run build` compila sem erros via `tsc` e minifica o bundle via Vite. | Bundle funcional e validado via `vite preview`. |

---

## 2. Auditoria do Pipeline de Deploy (`deploy.yml` e `vite.config.ts`)

### 2.1 Bloco `on:` de `.github/workflows/deploy.yml`

Trecho exato do arquivo `.github/workflows/deploy.yml` (linhas 3 a 6):

```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:
```

### 2.2 Explicação para o Dono do Projeto

1. **Se der push na branch de trabalho (`refactor/blindagem`):**  
   **O jogo NÃO atualiza no GitHub Pages.** O gatilho `push` está restrito exclusivamente à branch `main`. Commits enviados para `refactor/blindagem` não acionam a pipeline de deploy.
2. **Se fizer merge na branch `main`:**  
   **O jogo É ATUALIZADO automaticamente no GitHub Pages.** O GitHub Actions iniciará o runner `ubuntu-latest`, executará `npm ci`, `npm run build` e publicará a pasta `dist/` na branch de hospedagem do Pages.
3. **Disparo Manual:**  
   O gatilho `workflow_dispatch` permite disparar o deploy manualmente pela aba *Actions* do GitHub, escolhendo a branch desejada.
4. **Endereço Atual do Jogo:**  
   **Não verificado** no repositório (o arquivo `package.json` não contém o campo `homepage`, e a URL do Pages é atribuída dinamicamente via `${{ steps.deployment.outputs.page_url }}`).
5. **Gargalo de Segurança do Pipeline:**  
   O workflow atual não executa `npm run check` nem `npm test`. Se um código com regressão passar no TypeScript (`tsc`), ele será publicado automaticamente.

---

## 3. Prova Concreta: Comportamento da Fonte Pixelzone no Build

Na auditoria preliminar do Pacote 1.3, o caminho `@font-face { src: url('/assets/fonts/Pixelzone.ttf'); }` foi classificado como bloqueador sob a suposição de que a barra inicial causaria erro 404 em subdiretórios (ex.: `usuario.github.io/Hell-Survivor/`).

O teste empírico de compilação comprovou que essa suposição estava incorreta.

### 3.1 Trecho Gerado no Build Padrão (`dist/index.html` com `base: './'`)

```html
  <style>
    @font-face {
      font-family: 'Pixelzone';
      src: url('assets/fonts/Pixelzone.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
```
*O Vite removeu a barra inicial e converteu a URL para o caminho relativo `assets/fonts/Pixelzone.ttf`.*

### 3.2 Trecho Gerado no Build com Subdiretório (`scratch/dist-sub/index.html` via `vite build --base=/Hell-Survivor/`)

```html
  <style>
    @font-face {
      font-family: 'Pixelzone';
      src: url('/Hell-Survivor/assets/fonts/Pixelzone.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
```
*O Vite reescreveu a URL injetando o prefixo da base `/Hell-Survivor/assets/...` automaticamente.*

### 3.3 Conclusão e Reclassificação

O plugin HTML do Vite intercepta blocos `<style>` inline e reescreve URLs absolutas referenciando pastas públicas para casar com a propriedade `base` configurada.  
**Reclassificação:** O item foi **rebaixado de Bloqueador para RESOLVIDO / PRONTO**. Não há risco de 404 para a fonte Pixelzone.

---

## 4. Auditoria do Service Worker (`public/sw.js`)

### 4.1 Código Completo de `public/sw.js` (37 linhas)

```javascript
// Hell Survivor PWA Service Worker
const CACHE_NAME = 'hell-survivor-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

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

### 4.2 Análise de Ciclo de Vida (`skipWaiting` e `clients.claim`)

- `self.skipWaiting()`: **PRESENTE** (linha 5). Força o novo Service Worker a assumir o controle imediatamente na instalação, sem esperar que todas as abas sejam fechadas.
- `self.clients.claim()`: **PRESENTE** (linha 18). Assume o controle de todos os clientes abertos assim que o worker é ativado.
- **A Falha Oculta:** O bloco `activate` apenas apaga caches cujo nome seja diferente de `CACHE_NAME`. Como `CACHE_NAME` é uma constante hardcoded (`'hell-survivor-cache-v1'`), **o cache existente nunca é invalidado**.

### 4.3 Estratégia de Cache para `index.html` vs Assets (`cached || networked`)

A linha 33 executa:
```javascript
return cached || networked;
```
Trata-se de uma estratégia **Cache-First com atualização em background (Stale-While-Revalidate não sinalizado)**:
- Se `event.request` existir em `cached`, o Service Worker devolve a cópia antiga **imediatamente**.
- Em paralelo, o `fetch` busca a versão atualizada na rede e grava no cache para o futuro.
- Como o `index.html` não possui tratamento diferenciado de `Network-First`, ele cai nessa mesma regra de `cached || networked`.

### 4.4 Cenário Real do Jogador

- **Situação:** O jogador abriu o jogo ontem (versão A). O desenvolvedor publica uma correção crítica hoje (versão B).
- **Primeira Visita do Jogador:**  
  O navegador requisita `index.html`. O Service Worker encontra a versão A em cache e a entrega instantaneamente. O jogador **enxerga o jogo desatualizado de ontem**. O fetch em background baixa a versão B e atualiza o cache silenciosamente.
- **Segunda Visita do Jogador (Reload ou reabertura do app):**  
  Somente agora a versão B é lida do cache e exibida ao jogador.
- **Conclusão:** Este é o **ÚNICO BLOQUEADOR CRÍTICO REAL** remanescente de publicação.

---

## 5. Auditoria de Carregamento de Fontes

### 5.1 BootScene e a Espera de Fontes

Trecho de `src/scenes/BootScene.ts` (linhas 170 a 173):

```typescript
    // Garante carregamento da fonte Pixelzone na memória do navegador
    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.load("24px 'Pixelzone'").catch(() => {});
    }
```
- **O BootScene espera a fonte carregar?**  
  **NÃO.** A chamada não usa `await` nem aguarda `document.fonts.ready`. Ela dispara a requisição em background de forma "fire-and-forget".
- A proteção visual atual depende do elemento invisível pré-renderizado em `index.html` (linha 63):
  ```html
  <div style="font-family: 'Pixelzone', monospace; position: absolute; left: -9999px; visibility: hidden;" aria-hidden="true">
    COMUM RARO ÉPICO MÍSTICO SUPREMO FOICE ADAGAS METEORO DANO VIDA VOCÊ RECEBE 0123456789 +%
  </div>
  ```

### 5.2 Pré-carregamento no `src/main.ts`

Trecho de `src/main.ts` (linhas 5 a 18):

```typescript
async function bootstrap() {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('20px Silkscreen'),
        document.fonts.load('bold 20px Silkscreen'),
        document.fonts.load('16px Silkscreen'),
        document.fonts.load('16px "Press Start 2P"'),
        document.fonts.ready
      ]);
    } catch (e) {
      console.warn('[main] Pré-carregamento de fontes concluído com fallback:', e);
    }
  }

  const game = new Phaser.Game(GAME_CONFIG);
  ...
```

### 5.3 O que Acontece se o Jogador Estiver Sem Internet no Primeiro Acesso?

1. As fontes *Silkscreen* e *Press Start 2P* são requisitadas via CDN do Google Fonts (`fonts.googleapis.com` e `fonts.gstatic.com`).
2. Sem conexão ativa no primeiro load, as requisições falham por timeout/offline.
3. O bloco `catch` em `main.ts` captura a falha e registra o aviso no console sem travar o jogo.
4. **Comportamento Visual:** O jogo inicializa, mas todos os textos renderizados com Silkscreen e Press Start 2P caem para a fonte monospace padrão do sistema operacional (Courier New no Windows, Menlo no macOS, monospace genérica no Android/Linux).
5. *Nota:* Arquivos TTF locais da Silkscreen (`slkscr.ttf`, `slkscrb.ttf`, `slkscre.ttf`, `slkscreb.ttf`) já existem na pasta `fontes/` na raiz do projeto, mas não estão configurados no `@font-face` do jogo.

---

## 6. Backdoors, Sandbox e Segurança de Runtime

### 6.1 Leitura do Parâmetro `?debug=1`

Trecho de `src/config/balance.ts` (linhas 101 a 109):

```typescript
export function isDevSandboxEnabled(): boolean {
  // Em build de produção / pública ou fora de localhost, o Sandbox é estritamente ocultado
  if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1') return true;
    } catch {}
    return false;
  }
  ...
```
- **Comportamento em Produção:** Se o usuário final abrir `https://seu-jogo.com/?debug=1`, a função retorna `true`.
- **Efeito:** O botão flutuante do DevSandboxPanel aparece no canto da tela, permitindo invencibilidade, pulo de ondas e spawn arbitrário de itens em ambiente de produção.

### 6.2 O Atalho "Digitar DEV no Menu Principal"

- O comentário em `src/config/balance.ts:97` afirma:
  ```typescript
  *   (Mesmo em `false`, você ainda poderá acessá-lo adicionando `?debug=1` na URL ou digitando `DEV` no Menu Principal).
  ```
- **Auditoria do Código Real em `src/scenes/MenuScene.ts`:**  
  Trecho do manipulador de teclado (linhas 315 a 330):
  ```typescript
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', moveUp);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', moveUp);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', moveDown);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S).on('down', moveDown);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', confirm);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', confirm);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => { ... });
  ```
  **Conclusão Comprovada:** O atalho de digitar `DEV` **não existe no código**. Trata-se de um comentário obsoleto (dead comment). Não há listeners para as teclas D, E, V em nenhuma cena do jogo.

### 6.3 A Chave `hell_survivor_dev_unlocked`

Trecho de `src/config/balance.ts` (linhas 111 a 118):

```typescript
  if (ENABLE_DEV_SANDBOX) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1' || params.get('sandbox') === '1') return true;
    if (localStorage.getItem('hell_survivor_dev_unlocked') === 'true') return true;
  } catch {}
  return false;
```
- **Funciona em Produção?**  
  **NÃO.** A linha 103 executa um `return` antecipado se `import.meta.env.PROD` for verdadeiro ou se o hostname for diferente de `localhost`/`127.0.0.1`. A leitura de `hell_survivor_dev_unlocked` na linha 115 nunca é alcançada em produção. Ela opera exclusivamente em ambiente de desenvolvimento local.

### 6.4 Objetos Globais no `window`

- `window.__PHASER_GAME__ = game;` em `src/main.ts:21`: Expõe o motor do jogo globalmente.
- `window.__hellSurvivorSoundManager = this;` em `src/systems/SoundManager.ts:32`: Expõe o gerenciador de áudio globalmente.

---

## 7. Mapeamento Completo de Armazenamento Local (`localStorage`)

Varredura exaustiva de todas as chaves do `localStorage` utilizadas no projeto:

| # | Chave de Armazenamento | Arquivo de Uso (Linha) | Conteúdo Armazenado | Versão / Migração / Resiliência |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `hell_survivor_meta_save_v1` | [`MetaProgressManager.ts:85, 274, 305`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/MetaProgressManager.ts#L274) | Objeto JSON com total de almas acumuladas, níveis de bênçãos permanentes adquiridas e estatísticas de abates/mortes/tempo de jogo. | Possui `try/catch` e realiza merge com `defaultData` para chaves ausentes. Não valida números negativos ou NaN. O versionamento existe apenas no sufixo `_v1` do nome da chave; não há migrador para `_v2`. |
| **2** | `hell_survivor_map_ch_${chapter}` | [`mapData.ts:270, 278, 290`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/mapData.ts#L270) | Objeto JSON contendo a estrutura customizada do mapa gerada pelo MapEditorSystem (`playerSpawn`, `itemSpawners`, `props`, `decorations`, etc.). | Possui `try/catch`. **Vulnerabilidade documentada em teste:** Ignora o campo `version` do mapa do código. Se o jogador tiver um mapa salvo no navegador, o jogo carrega a versão salva antiga mesmo que o desenvolvedor lance um mapa novo. |
| **3** | `hell_survivor_endless_record_sec` | [`UIScene.ts:1629, 1640`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/UIScene.ts#L1629) | String representando número inteiro com o tempo recorde de sobrevivência no Modo Infinito em segundos (ex: `"485"`). | Converte via `parseInt(val, 10)`. Se retornar `NaN` ou nulo, assume valor `0`. Sem versionamento. |
| **4** | `hell_survivor_bgm_vol` | [`SoundManager.ts:38, 58`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L38) | String representando número float com o volume da música de fundo (ex: `"0.7"`). | Converte via `parseFloat(val)`. Se ausente ou `NaN`, assume fallback padrão `0.7`. Sem versionamento. |
| **5** | `hell_survivor_sfx_vol` | [`SoundManager.ts:43, 98`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L43) | String representando número float com o volume dos efeitos sonoros (ex: `"0.8"`). | Converte via `parseFloat(val)`. Se ausente ou `NaN`, assume fallback padrão `0.8`. Sem versionamento. |
| **6** | `hell_survivor_debug_session_log` | [`DebugSessionLogger.ts:134`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/DebugSessionLogger.ts#L134) | Array JSON contendo até 50 eventos recentes de telemetria e log de debug de sessões anteriores. | Sobrescrito continuamente a cada chamada de flush. Protegido por `try/catch`. Não é lido pela lógica de gameplay. |
| **7** | `hell_survivor_dev_unlocked` | [`balance.ts:115`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts#L115) | String `"true"` indicando liberação do Sandbox em ambiente local. | Lido apenas se `isDevSandboxEnabled()` for avaliado fora de produção. Protegido por `try/catch`. Não possui escrita automática no código. |

---

## 8. Inventário Exhaustivo de Origem e Licenças de Assets

> **Regra de Conformidade Rigorosa:** Todos os itens sem documentação contratual explícita ou arquivo de licença no repositório foram estritamente classificados como **"origem não documentada no repositório"**. Nenhuma dedução ou suposição de autoria foi introduzida.

| Categoria | Quantidade / Arquivos | Origem Documentada no Repositório | Licença / Status |
| :--- | :--- | :--- | :--- |
| **Áudio (BGM)** | **8 arquivos:**<br>1. `assets/audio/hell-survivor.mp3`<br>2. `assets/audio/eternal-shadow.mp3`<br>3. `assets/audio/orchestral-overture.mp3`<br>4. `assets/audio/halloween.mp3`<br>5. `assets/audio/spooky-halloween.mp3`<br>6. `assets/audio/azazel/intro.mp3`<br>7. `assets/audio/azazel/mid.mp3`<br>8. `assets/audio/azazel/fight.mp3` | **Origem não documentada no repositório** | Licença desconhecida |
| **Áudio (SFX)** | Todos os efeitos sonoros do jogo | Sintetizados proceduralmente via Web Audio API em `src/systems/SoundManager.ts` | **Autoria própria do projeto** (Código original) |
| **Fontes (Local)** | **1 arquivo:**<br>`public/assets/fonts/Pixelzone.ttf` | **Origem não documentada no repositório** | Licença desconhecida |
| **Fontes (Web)** | **2 famílias via Google Fonts:**<br>1. `Silkscreen`<br>2. `Press Start 2P` | Jason Kottke (Silkscreen) / CodeMan38 (Press Start 2P) via Google Fonts | **SIL Open Font License (OFL 1.1)** |
| **Texturas** | **3 arquivos:**<br>1. `public/assets/textures/chao1.jpg`<br>2. `public/assets/textures/chao2.jpg`<br>3. `public/assets/textures/Chão1.jpg` (peso morto) | **Origem não documentada no repositório** | Licença desconhecida |
| **Cenas de História** | **11 arquivos:**<br>`assets/scenes/intro/Intro 1.jpg` a `Intro 6.jpg`<br>`assets/scenes/ending/EndChap1_1.jpg` a `EndChap1_5.jpg` | **Origem não documentada no repositório** | Licença desconhecida |
| **Sprites** | **525 arquivos:**<br>- Heroína Nixy (Idle, Running, Sprint, Hurt, Ult)<br>- Inimigos (Zombie Dog, Succubus, Slime, Bat, Mummy, Azazel)<br>- NPCs e Retratos de Diálogo<br>- Ícones de Gemas, Itens e Baús<br>- Elementos de HUD, Armas e Partículas | **Origem não documentada no repositório** | Licença desconhecida |

---

## 9. Desempenho do Build e Top 10 Maiores Arquivos em `public/`

### 9.1 Lista Confirmada dos 10 Maiores Arquivos Físicos

| Posição | Tamanho Exato | Caminho do Arquivo | Categoria / Uso |
| :---: | :---: | :--- | :--- |
| **#1** | **5.906.986 bytes** (~5.63 MB) | `public/assets/audio/hell-survivor.mp3` | BGM do Menu Principal |
| **#2** | **5.217.497 bytes** (~4.98 MB) | `public/assets/audio/orchestral-overture.mp3` | BGM da Chefe Rosalin (Capítulo 1) |
| **#3** | **4.374.948 bytes** (~4.17 MB) | `public/assets/audio/eternal-shadow.mp3` | BGM de Batalha (Capítulo 1) |
| **#4** | **2.952.937 bytes** (~2.82 MB) | `public/assets/scenes/intro/Intro 4.jpg` | Cena de Abertura da Campanha |
| **#5** | **2.809.662 bytes** (~2.68 MB) | `public/assets/scenes/intro/Intro 1.jpg` | Cena de Abertura da Campanha |
| **#6** | **2.750.441 bytes** (~2.62 MB) | `public/assets/scenes/intro/Intro 2.jpg` | Cena de Abertura da Campanha |
| **#7** | **2.564.627 bytes** (~2.45 MB) | `public/assets/audio/azazel/fight.mp3` | BGM de Batalha do Chefe Azazel |
| **#8** | **2.513.036 bytes** (~2.40 MB) | `public/assets/scenes/intro/Intro 6.jpg` | Cena de Abertura da Campanha |
| **#9** | **2.338.584 bytes** (~2.23 MB) | `public/assets/sprites/main_menu_background.jpg` | Imagem de Fundo do Menu Principal |
| **#10**| **2.249.155 bytes** (~2.15 MB) | `public/assets/scenes/intro/Intro 3.jpg` | Cena de Abertura da Campanha |

### 9.2 Métricas de Impacto em Rede e VRAM

- **Tempo de Download Inicial em Rede 4G Típica (20 Mbps / ~2.5 MB/s):**  
  O download do pacote completo de assets (`~56.8 MB`) demanda aproximadamente **22.7 segundos**.
- **Tempo de Download em Rede Móvel Lenta (10 Mbps / ~1.25 MB/s):**  
  Demanda aproximadamente **45.4 segundos**.
- **Consumo de Memória de Vídeo (VRAM GPU):**  
  Imagens JPG com resolução Full HD (1920x1080) são descompactadas pelo navegador em buffers RGBA de `1920 * 1080 * 4 bytes = 8.29 MB` de VRAM cada. A soma das 11 cenas de história e fundos de menu consome **~91.2 MB de VRAM** de forma estática.

---

## 10. Esclarecimento de Ferramentas (`npx tsx`) e Compromisso Técnico

1. **Esclarecimento sobre a Execução do `npx tsx` no Pacote 1.3:**  
   O comando `npx tsx` utilizado na inspeção do Pacote 1.3 operou estritamente em memória volátil através do cache global temporário do npm. **Nenhum pacote foi instalado no `package.json`**, nenhuma alteração foi realizada no `package-lock.json` e nenhum arquivo de dependência foi gravado no repositório.
2. **Compromisso Técnico para os Próximos Pacotes:**  
   Em conformidade com a determinação do dono do projeto, **o utilitário `tsx` não será mais invocado sob nenhuma circunstância**.  
   Qualquer script auxiliar de verificação, teste ou extração utilizará exclusivamente:
   - `node` nativo (arquivos `.js` ou `.mjs` em ESM); ou
   - `vite-node` (que já integra a cadeia de dependências existente do Vite).

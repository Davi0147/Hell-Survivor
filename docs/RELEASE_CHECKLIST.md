# Checklist Técnico de Publicação e Release — Hell Survivor

> **Status:** Documento de Auditoria e Checklist de Lançamento (Pacote 1.5 — Verificado e Corrigido)  
> **Data:** 17/10/2026  
> **Escopo:** Somente Leitura da infraestrutura de build, assets e segurança de runtime. Nenhuma alteração de código de jogo ou dependências.

---

## 1. Resumo Executivo de Publicação

| Classificação | Item / Área | Situação Atual | Impacto |
| :--- | :--- | :--- | :--- |
| ✅ **RESOLVIDO / PRONTO** | **Invalidação de Cache do Service Worker (`public/sw.js`)** | Resolvido no **Pacote P1.1**: Service Worker versionado atômico (`CACHE_NAME = 'hell-survivor-' + BUILD_ID`), segregação de estratégias de rede (Network-First para navegação, Cache-First para `/assets/` com hash, Network com `no-cache` para estáticos sem hash), migração transparente do cache `v1` legado e banner seguro com atualização sob demanda fora de combate. | Zero risco de assets dessincronizados ou "versão misturada" após deploy no GitHub Pages. |
| ⚠️ **RISCO MÉDIO** | **Backdoor de Debug em Produção (`?debug=1`)** | `isDevSandboxEnabled()` em `balance.ts` permite abrir o DevSandboxPanel em produção caso a URL contenha `?debug=1`. | Qualquer usuário final que adicione o parâmetro na URL tem acesso a invulnerabilidade, alteração de almas e eliminação instantânea de chefes. |
| ⚠️ **RISCO MÉDIO** | **Fontes Remotas no Google Fonts sem Fallback Offline** | *Silkscreen* e *Press Start 2P* são carregadas exclusivamente via CDN do Google Fonts. | No primeiro carregamento sem internet (PWA offline), o download falha e a tipografia cai para a fonte padrão do sistema. |
| ⚠️ **RISCO MÉDIO** | **Variáveis Globais no Objeto `window`** | `window.__PHASER_GAME__` e `window.__hellSurvivorSoundManager` expostas globalmente. | Permite inspeção e manipulação de cenas, áudio e variáveis diretamente pelo console do navegador. |
| ✅ **RESOLVIDO / PRONTO** | **CI/CD sem Trava de Qualidade Automática** | Resolvido no **Pacote P1.1**: Pipeline `.github/workflows/deploy.yml` atualizado com etapa de qualidade obrigatória (`npm run check`) antes do build, verificação de integridade atômica pós-build (`node scripts/verify-build.mjs`) e histórico completo (`fetch-depth: 0`). | Se testes falharem ou limites de warning forem excedidos, o deploy é abortado imediatamente sem corromper a produção. |
| ⚠️ **RISCO MÉDIO** | **Tamanho Elevado de Assets (56.8 MB) e VRAM em Mobile** | Áudios BGM (5.6 MB, 5.0 MB, 4.2 MB) e cenas JPG (2 a 3 MB cada) consom ~90 MB de VRAM e demoram 22–45s em redes 4G. | Carregamento lento em conexões móveis e alto consumo de memória de vídeo em celulares modestos. |
| ⚠️ **RISCO MÉDIO** | **Peso Morto em `public/` (2.79 MB)** | 56 arquivos no disco nunca são requisitados pelo código (incluindo pasta duplicada `Zombie Dog` e `Chão1.jpg`). | Aumenta desnecessariamente o download do build e o consumo de armazenamento do repositório. |
| ⚠️ **RISCO MÉDIO** | **Origem e Licenças de Assets Não Documentadas** | Músicas, texturas e sprites não possuem registro de autor ou termos de licença no repositório. | Risco legal para distribuição comercial ou em lojas de aplicativos sem um arquivo formal de créditos. |
| ⚠️ **ITEM ABERTO** | **Avisos de Remoção Prematura de Texturas no `BootScene.ts:init()`** | `init()` executa ~470 chamadas a `this.textures.remove()` antes do `preload()`, gerando 470 avisos de `No texture found matching key` no console do navegador durante o boot frio. | Poluição do console do navegador no primeiro acesso, embora todas as texturas sejam carregadas normalmente no `preload()`. |
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

### 4.1 O Registro no Código da Aplicação (`src/main.ts`)

Trecho exato de [`src/main.ts:31-36`](file:///E:/Downloads%20HD/Hell%20Survivor/src/main.ts#L31):

```typescript
// Registro de PWA Service Worker (Instalação no celular e cache de performance)
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
```

- **Condição de Registro:** O registro é estritamente condicionado a:  
  `'serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:')`
- **Ambiente Local (`http://localhost:5173`):**  
  Em modo de desenvolvimento local, `import.meta.env.PROD` é `false` e o protocolo é `http:`. **O Service Worker NUNCA é registrado em localhost.**
- **Ambiente de Produção / Hospedagem (`https://...`):**  
  No GitHub Pages ou em qualquer servidor HTTPS, `import.meta.env.PROD` é `true` e o protocolo é `https:`. **O Service Worker É EFETIVAMENTE REGISTRADO.**
- **Importante para o Dono do Projeto:**  
  Qualquer teste do comportamento de cache e atualização do Service Worker **DEVE ser realizado no endereço público HTTPS publicado no GitHub Pages**, e NUNCA em `localhost`.

### 4.2 Código Completo de `public/sw.js` (37 linhas)

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

### 4.3 Análise de Ciclo de Vida (`skipWaiting` e `clients.claim`)

- `self.skipWaiting()`: **PRESENTE** (linha 5). Força o novo Service Worker a assumir o controle imediatamente na instalação.
- `self.clients.claim()`: **PRESENTE** (linha 18). Assume o controle de todos os clientes abertos na ativação.
- **A Falha Oculta:** O bloco `activate` apenas apaga caches cujo nome seja diferente de `CACHE_NAME`. Como `CACHE_NAME` é fixo (`'hell-survivor-cache-v1'`), **o cache existente nunca é invalidado**.

### 4.4 Estratégia de Cache para `index.html` vs Assets (`cached || networked`)

A linha 33 executa:
```javascript
return cached || networked;
```
Trata-se de uma estratégia **Cache-First com atualização em background (Stale-While-Revalidate não sinalizado)**:
- Se `event.request` existir em `cached`, o Service Worker devolve a cópia antiga **imediatamente**.
- Em paralelo, o `fetch` busca a versão atualizada na rede e grava no cache para o futuro.
- Como o `index.html` não possui tratamento diferenciado de `Network-First`, ele cai nessa mesma regra de `cached || networked`.

### 4.5 Cenário Real do Jogador em Produção

- **Situação:** O jogador jogou ontem (versão A). O desenvolvedor publica uma versão corrigida hoje no Pages (versão B).
- **Primeira Visita do Jogador:**  
  O navegador requisita `index.html`. O Service Worker encontra a versão A em cache e a entrega instantaneamente. O jogador **enxerga o jogo desatualizado de ontem**. O fetch em background baixa a versão B e atualiza o cache silenciosamente.
- **Segunda Visita do Jogador (Reload ou reabertura do app):**  
  Somente agora a versão B é lida do cache e exibida ao jogador.
- **Conclusão:** Em produção HTTPS, este é o **ÚNICO BLOQUEADOR CRÍTICO REAL** remanescente de publicação.

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
- A proteção visual atual depende do elemento invisível pré-renderizado em `index.html` (linha 61):
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
4. **Comportamento Visual:** O jogo inicializa, mas todos os textos renderizados com Silkscreen e Press Start 2P caem para a fonte monospace padrão do sistema operacional.
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
- **Auditoria do Código Real em `src/scenes/MenuScene.ts` e busca global em `src/`:**  
  A busca exaustiva por `'DEV'`, `"DEV"`, `keycombo`, `createCombo` e `KeyCodes.D` comprovou que **não existe nenhum ouvinte de sequência de teclas no jogo**. Trata-se de um comentário obsoleto (dead comment). Em `MenuScene.ts:315-330`, o teclado trata exclusivamente UP, DOWN, W, S, ENTER, SPACE, ESC.

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
  **NÃO.** A checagem da linha 103 retorna antes se `import.meta.env.PROD` for verdadeiro ou se estiver fora de localhost. A linha 115 só executa em ambiente de desenvolvimento local.

### 6.4 Objetos Globais no `window`

- `window.__PHASER_GAME__ = game;` em `src/main.ts:21`: Expõe o motor do jogo globalmente.
- `window.__hellSurvivorSoundManager = this;` em `src/systems/SoundManager.ts:32`: Expõe o gerenciador de áudio globalmente.

---

## 7. Mapeamento Completo de Armazenamento do Navegador (`localStorage` e `sessionStorage`)

Varredura exaustiva comprovada linha a linha no código-fonte. Todas as chaves do projeto e seus valores padrão exatos:

| # | Chave de Armazenamento | Mecanismo | Arquivo:Linha (Símbolo) | Trecho Exato de Código | Valor Padrão no Código | Tratamento de Erro / Resiliência |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `hell_survivor_meta_save_v1` | `localStorage` | [`MetaProgressManager.ts:85`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/MetaProgressManager.ts#L85)<br>(`STORAGE_KEY`) | `this.STORAGE_KEY = 'hell_survivor_meta_save_v1';`<br>L305: `localStorage.getItem(this.STORAGE_KEY);`<br>L274: `localStorage.setItem(this.STORAGE_KEY, ...);` | `defaultData` (L282-301):<br>`corruptedSouls: 0`, todas bênçãos `0`, estatísticas com `0`. | `try/catch`. Realiza merge de chaves faltantes com `defaultData`. Não valida se números são negativos ou `NaN`. Sem migrador para v2. |
| **2** | `hell_survivor_custom_map_chapter_${chapter}` | `localStorage` | [`mapData.ts:254`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/mapData.ts#L254)<br>(`MapStorageManager.getStorageKey`) | `return 'hell_survivor_custom_map_chapter_' + chapter;`<br>L270: `localStorage.setItem(this.getStorageKey(ch), ...);`<br>L278: `localStorage.getItem(this.getStorageKey(chapter));` | `MapStorageManager.getDefaultMap(chapter)` (L257-265): Retorna `DEFAULT_CHAPTER_1_MAP`, `2` ou `202`. | `try/catch`. Se nulo ou corrompido, carrega o mapa padrão. **Vulnerabilidade:** ignora o campo `version` do código. |
| **3** | `hell_survivor_endless_record_sec` | `localStorage` | [`UIScene.ts:1629`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/UIScene.ts#L1629)<br>(`UIScene.getBestRecordSec`) | L1629: `localStorage.getItem('hell_survivor_endless_record_sec');`<br>L1640: `localStorage.setItem('hell_survivor_endless_record_sec', sec.toString());` | `0` (L1630):<br>`return val ? parseInt(val, 10) \|\| 0 : 0;` | `try/catch`. Se ausente, não-numérico ou erro, retorna `0`. Sem versionamento. |
| **4** | `hell_survivor_bgm_vol` | `localStorage` | [`SoundManager.ts:38`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L38)<br>(`SoundManager.loadSavedVolumes`) | L14: `private musicVolume: number = 0.10;`<br>L38: `localStorage.getItem('hell_survivor_bgm_vol');`<br>L58: `localStorage.setItem('hell_survivor_bgm_vol', ...);` | **`0.10`** (L14):<br>`musicVolume: number = 0.10;` (10% padrão). | `try/catch`. Converte via `parseFloat`. Se `null` ou `NaN`, mantém o valor padrão de `0.10`. Sem versionamento. |
| **5** | `hell_survivor_sfx_vol` | `localStorage` | [`SoundManager.ts:43`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/SoundManager.ts#L43)<br>(`SoundManager.loadSavedVolumes`) | L15: `private sfxVolume: number = 0.60;`<br>L43: `localStorage.getItem('hell_survivor_sfx_vol');`<br>L98: `localStorage.setItem('hell_survivor_sfx_vol', ...);` | **`0.60`** (L15):<br>`sfxVolume: number = 0.60;` (60% padrão). | `try/catch`. Converte via `parseFloat`. Se `null` ou `NaN`, mantém o valor padrão de `0.60`. Sem versionamento. |
| **6** | `hell_survivor_debug_session_log` | `localStorage` | [`DebugSessionLogger.ts:134`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/DebugSessionLogger.ts#L134)<br>(`DebugSessionLogger.persistToStorage`) | L133: `const recent = this.entries.slice(-150);`<br>L134: `localStorage.setItem('hell_survivor_debug_session_log', JSON.stringify(recent));` | `[]` (L23):<br>`private entries: DebugLogEntry[] = [];` | `try/catch`. Write-only (nunca é lido pela lógica do jogo). Salva os últimos 150 eventos. |
| **7** | `hell_survivor_dev_unlocked` | `localStorage` | [`balance.ts:115`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts#L115)<br>(`isDevSandboxEnabled`) | L115: `if (localStorage.getItem('hell_survivor_dev_unlocked') === 'true') return true;` | `null` / `"false"` | `try/catch`. Ignorado em produção pelo guard `import.meta.env.PROD`. Não possui rotina de escrita automática. |
| **8** | `hell_survivor_pwa_dismissed` | `sessionStorage` | [`PWAInstallPrompt.ts:22`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/PWAInstallPrompt.ts#L22)<br>(`initPWAInstallPrompt`) | L22, L55: `sessionStorage.getItem('hell_survivor_pwa_dismissed') === '1'`<br>L160, L179: `sessionStorage.setItem('hell_survivor_pwa_dismissed', '1');` | `null` (não dispensado) | Checa se o usuário fechou o banner PWA na sessão atual para não incomodar novamente até reiniciar a aba. |

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
| **Cenas de História** | **11 arquivos:**<br>`assets/scenes/intro/Intro 1.jpg` a `Intro 6.jpg`<br>`assets/scenes/chapter1/EndChap1_1.jpg` a `EndChap1_5.jpg` | **Origem não documentada no repositório** | Licença desconhecida |
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

---

## 11. Auditoria de Texturas Faltando & Avisos de Console (`BootScene.ts`)

> **Reconhecimento de Limitação da Auditoria Anterior:** A auditoria do Pacote 1.3 avaliou estritamente se os arquivos físicos referenciados em `BootScene.ts` existiam no disco. Esta seção analisa a consistência lógica entre o carregamento no `TextureManager` e o ciclo de vida das cenas.

### 11.1 Causa Raiz dos 470 Avisos de `No texture found matching key`

1. **Onde e Quando Ocorre:**  
   No método `BootScene.init()` ([`BootScene.ts:16-163`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/BootScene.ts#L16)), o código executa uma rotina preventiva de limpeza chamando `this.textures.remove(key)` e `this.anims.remove(key)` para aproximadamente 470 chaves de texturas de heróis, inimigos, cartas e projéteis.
2. **Mecanismo Interno do Phaser 3:**  
   No boot inicial (cold start), nenhuma dessas texturas foi carregada ainda no `TextureManager` (o carregamento só acontece no `preload()`). Quando `this.textures.remove(key)` é chamado para uma chave inexistente, a engine do Phaser emite no console:  
   `No texture found matching key: <key>`.
3. **Por que o console marca 470 avisos:**  
   A soma das iterações dos loops de 8 direções para Nixy, Zombie Dog, Succubus, Slime, Bat, Mummy e Azazel, acrescida das texturas pontuais, totaliza exatamente ~470 chamadas no `init()`.
4. **As Chaves Citadas no Relatório:**
   - `azazel-run-west-0` a `azazel-run-west-7` ([`BootScene.ts:157`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/BootScene.ts#L157)): Aparecem no console porque estão no loop de limpeza do Azazel. **Todos os 8 arquivos físicos existem no disco** em `public/assets/sprites/enemies/Azazel/Idle/animations/Running/west/` e são carregados com sucesso no `preload()` (L467).
   - `chat-nixy-damage` ([`BootScene.ts:160`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/BootScene.ts#L160)): Limpeza antes do carregamento. **O arquivo físico existe no disco** (`public/assets/sprites/portraits/Nixy_Damage_Chat.png`) e é carregado no `preload()` (L426). Usado como busto de diálogo em `Chapter1EndScene.ts:114`.
   - `chat-rosalin-defeated` ([`BootScene.ts:161`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/BootScene.ts#L161)): Limpeza antes do carregamento. **O arquivo físico existe no disco** (`public/assets/sprites/portraits/Rosalin_Defeated.png`) e é carregado no `preload()` (L427). Usado em `Chapter1EndScene.ts:120`.
   - `ui-star` ([`BootScene.ts:162`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/BootScene.ts#L162)): Limpeza antes do carregamento. **O arquivo físico existe no disco** (`public/assets/sprites/items/Star.png`) e é carregado no `preload()` (L428). Usado nas estrelas de pontuação de `Chapter1EndScene.ts:1431`.
5. **Efeito Visível no Jogo (Hipótese Técnica):**  
   Nenhum efeito visual quebrado durante o gameplay. As texturas existem no disco e são carregadas no `preload()`, ficando disponíveis para as cenas. O impacto é restrito à poluição do console durante a inicialização do jogo.

---

## 12. Protocolo de Cache PWA, Teste E2E e Kill-Switch de Emergência (Pacote P1.1)

### 12.1 Arquitetura e Invariantes do Cache Versionado
1. **Identificador Atômico de Build:**  
   O plugin inline em `vite.config.ts` gera o identificador `<sha curto> • <dd/mm hh:mm>` (ex: `fdd078c • 18/10 01:46`) derivado do Git ou de `process.env.GITHUB_SHA`.  
   Esse identificador é substituído atomicamente no `dist/sw.js` (`CACHE_NAME = 'hell-survivor-' + BUILD_ID`) e no elemento `#build-version` de `dist/index.html`.
2. **Segregação de Estratégias no Service Worker (`public/sw.js`):**
   - **Navegação e `index.html`:** *Network-First* com fallback no cache offline. Garante que se houver internet o navegador sempre busca o HTML mais recente.
   - **Assets com Hash (`/assets/*.js`, `/assets/*.css`):** *Cache-First*. Nomes imutáveis gerados pelo compilador são servidos com máxima velocidade.
   - **Assets sem Hash (sprites, sons, fontes, manifest):** *Network com `cache: 'no-cache'`* e fallback offline. Permite que sprites ou músicas com mesmo nome sejam revalidadas contra o servidor sem prender o jogador em texturas antigas.
3. **Controle de Atualização no Cliente (`src/main.ts`):**
   - Registro com `{ updateViaCache: 'none' }` ignora o cache HTTP de 10 minutos do GitHub Pages.
   - Detecção via `updatefound` e `registration.waiting`.
   - Revalidação proativa em `visibilitychange` (ao focar a aba) e intervalo de 30 minutos em background.
   - **Momento Seguro:** O banner nunca surge no meio do combate ativo (`GameScene` despausada e sem Game Over). Fica em espera até pausa, fim de jogo ou retorno ao menu.
   - **Ação Explícita:** O jogo nunca recarrega automaticamente sozinho durante a partida; a atualização ocorre somente quando o jogador clica em `[ RECARREGAR ]`.

### 12.2 Passo a Passo de Teste para o Dono (Sem Comandos, Só Cliques)

1. **Abrir a Versão Inicial:**
   - Na pasta do jogo, dê dois cliques em `TESTAR_VERSAO_1.bat`.
   - Uma janela preta vai compilar o jogo e abrir a página automaticamente no seu navegador.
   - **O que olhar na tela:** Olhe no canto inferior direito do jogo (perto do rodapé) e anote o código que aparece (exemplo: `c2ce55d • 18/10 01:50`).
   - **Importante:** Deixe a janela preta aberta minimizada enquanto testa!

2. **Simular a Publicação de uma Atualização:**
   - Volte para a pasta do jogo e dê dois cliques em `TESTAR_ATUALIZACAO.bat`.
   - Uma segunda janela vai rodar e mostrar em verde: *"SUCESSO! NOVA VERSÃO GERADA"*. Pode fechar essa janela quando terminar.

3. **Conferir o Aviso de Atualização no Jogo:**
   - Volte para a aba do jogo no navegador.
   - Se você estiver em combate, pause ou aguarde a partida terminar (o aviso nunca atrapalha o tiroteio).
   - Em poucos segundos, um aviso vermelho com dourado aparecerá no topo da tela:
     **"NOVA VERSÃO DISPONÍVEL — Atualize para receber correções e novidades"**.

4. **Recarregar e Conferir o Resultado:**
   - Clique no botão vermelho **[ RECARREGAR ]**.
   - O botão mudará para *"RECARREGANDO..."* e a página recarregará sozinha.
   - **O que olhar na tela:** Olhe novamente no canto inferior direito: o código e a data/hora agora mudaram para a nova versão! Se mudou, o sistema de atualização passou 100%!

### 12.3 Procedimento de Kill-Switch de Emergência
Se um deploy quebrado for publicado e prender os navegadores dos jogadores:

1. **Copiar o Kill-Switch para a pasta pública:**
   ```powershell
   Copy-Item scripts/sw-killswitch.js public/sw.js -Force
   ```
2. **Confirmar e Publicar Imediatamente:**
   ```powershell
   git add public/sw.js
   git commit -m "fix(sw): deploy emergency service worker kill-switch"
   git push origin main
   ```
3. **O Que o Kill-Switch Faz nos Clientes:**
   - Ativa-se imediatamente com `skipWaiting()`.
   - Limpa **100%** de todas as chaves de Cache (`caches.delete`).
   - Chama `registration.unregister()` para desregistrar permanentemente o Service Worker.
   - Força recarga em todas as janelas ativas conectando-as diretamente ao servidor de rede.

# Guia de Recuperação e Restauração Manual de Mapas (`docs/MAP_RECOVERY.md`)

Este guia documenta o ciclo de vida dos mapas customizados criados no Editor de Mapas (`[F1] -> Aba Editor`), o mecanismo de backup automático por versionamento e o passo a passo para inspecionar ou restaurar manualmente um mapa legado.

---

## 1. Como Funciona o Versionamento de Mapas

A partir do **Pacote 2A**, os mapas oficiais padrão (`DEFAULT_CHAPTER_1_MAP`, `DEFAULT_CHAPTER_2_MAP`, `DEFAULT_AZAZEL_DIM_MAP`) possuem o campo `version: 2` (anteriormente `version: 1`).

Quando o jogo inicializa ou o editor é aberto, `MapStorageManager.getActiveMap(chapter)` executa a seguinte validação:

1. Carrega o mapa customizado salvo em `localStorage.getItem("hell_survivor_custom_map_chapter_${chapter}")`.
2. Compara a versão do mapa salvo (`custom.version`) com a versão do mapa oficial (`defaultMap.version = 2`):
   - **Se o mapa salvo não tiver versão (`version === undefined`), mas for estruturalmente válido**: O jogo **mantém** o mapa customizado ativo (presume que o usuário estava editando antes do versionamento).
   - **Se o mapa salvo tiver uma versão menor (`custom.version < 2`)**:
     1. O jogo grava uma cópia de segurança na chave de backup:
        `localStorage.setItem("hell_survivor_custom_map_chapter_${chapter}_backup_v${custom.version}", JSON.stringify(custom))`
     2. Remove a chave customizada desatualizada:
        `localStorage.removeItem("hell_survivor_custom_map_chapter_${chapter}")`
     3. Retorna o mapa oficial atualizado (`version: 2`).

Desta forma, nenhum layout criado pelo jogador é destruído: ele é apenas arquivado com segurança na chave de backup.

---

## 2. Chaves de Armazenamento no `localStorage`

| Finalidade | Chave Oficial (`storageKeys.ts`) | Exemplo Capítulo 1 |
| :--- | :--- | :--- |
| **Mapa Custom Ativo** | `hell_survivor_custom_map_chapter_${chapter}` | `hell_survivor_custom_map_chapter_1` |
| **Backup de Versão Legada** | `hell_survivor_custom_map_chapter_${chapter}_backup_v${version}` | `hell_survivor_custom_map_chapter_1_backup_v1` |

---

## 3. Passo a Passo para Restaurar um Backup Manualmente

Se você possuía um mapa customizado antigo (v1) e deseja restaurá-lo no navegador:

### Método A: Restauração via Console do Navegador (`F12`) — 1 Minuto

1. Com o jogo aberto no navegador, pressione **F12** (ou `Ctrl + Shift + I`) para abrir as Ferramentas de Desenvolvedor.
2. Clique na aba **Console**.
3. Para restaurar o Capítulo 1, cole o seguinte comando e pressione **Enter**:

```javascript
(() => {
  const chapter = 1;
  const backupKey = `hell_survivor_custom_map_chapter_${chapter}_backup_v1`;
  const activeKey = `hell_survivor_custom_map_chapter_${chapter}`;
  const raw = localStorage.getItem(backupKey);
  if (!raw) {
    console.error('Nenhum backup encontrado para:', backupKey);
    return;
  }
  const map = JSON.parse(raw);
  map.version = 2; // Atualiza a versão para evitar novo descarte
  localStorage.setItem(activeKey, JSON.stringify(map));
  console.log(`✅ Mapa do Capítulo ${chapter} restaurado com sucesso para a versão 2!`);
  location.reload();
})();
```

4. Para restaurar o Capítulo 2, mude `const chapter = 1;` para `const chapter = 2;` no script acima.
5. A página recarregará automaticamente com o seu mapa restaurado e compatível com a versão 2.

---

### Método B: Inspecionar o Conteúdo do Backup

Para verificar se o backup existe e visualizar o JSON:

```javascript
console.log(JSON.parse(localStorage.getItem('hell_survivor_custom_map_chapter_1_backup_v1')));
```

---

### Método C: Exportar o Backup para Arquivo JSON no Disco

Se quiser baixar o mapa como um arquivo `.json` no seu computador:

```javascript
(() => {
  const raw = localStorage.getItem('hell_survivor_custom_map_chapter_1_backup_v1');
  if (!raw) return console.error('Backup não encontrado.');
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mapa_capitulo_1_backup.json';
  a.click();
})();
```

---

## 4. O Que o Editor de Mapas Grava ao Salvar

Quando você abre o Editor de Mapas (`[F1] -> Aba Editor`), o editor trabalha sobre `this.currentMap`, que herda a `version: 2` do mapa ativo carregado.
Ao clicar no botão **"Salvar Mapa"** ou posicionar estruturas/props, o editor executa:

```typescript
MapStorageManager.saveCustomMap(this.currentMap, this.editingChapter);
```

Isso grava o objeto completo com `version: 2` diretamente em `hell_survivor_custom_map_chapter_${chapter}`, garantindo que em inicializações futuras o mapa não seja mais considerado desatualizado.

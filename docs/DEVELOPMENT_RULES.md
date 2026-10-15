# Regras de Desenvolvimento, Arquitetura & Workflow — Hell Survivor

Este documento oficializa os padrões técnicos e protocolos obrigatórios que regem o desenvolvimento do **Hell Survivor**.

---

## 📌 1. Protocolo Obrigatório de Git e Versionamento (Post-Update Git Push)

A cada atualização, refatoração, correção de bug ou implementação de nova mecânica:

1. **Atualização da Versão Visual:**
   * Atualizar a tag discreta no canto inferior direito do `index.html` (`#build-version`), refletindo a versão/build atual (ex: `Build v0.2.2 - Chapter 1 Polish`).
2. **Checagem de Integridade (Anti-Crash):**
   * Executar a verificação de tipos: `npx tsc --noEmit`.
   * Executar o build de produção: `npm run build`.
   * Nenhuma alteração é comitada se houver erros de compilação ou alertas graves de sintaxe.
3. **Commit & Push Imediato ao GitHub:**
   * Adicionar os arquivos modificados ao Git: `git add .` (respeitando o `.gitignore`).
   * Criar um commit convencional com descrição clara: `git commit -m "tipo: descrição objetiva da mudança"`.
   * Enviar as alterações imediatamente ao repositório remoto: `git push origin main`.
   * Criar tags anotadas para marcos de versão principais (`git tag -a vX.Y.Z -m "..." && git push origin vX.Y.Z`).

---

## 🎮 2. Estabilidade de Estado & Ciclo de Vida (Gameplay Loop)

1. **Defesa contra Execução Residual em Modais (Anti-Background Leak):**
   * Ao transicionar para telas de diálogo, modais de vitória ou menus de seleção de upgrade, o `GameScene` deve ter sua física pausada (`this.physics.pause()`) e o loop de atualização congelado (`if (this.isChapterCompleted || this.isDialogueActive()) return;`).
   * Nenhum inimigo deve se mover, causar dano ou ler comandos de entrada enquanto a heroína estiver interagindo com interfaces de diálogo ou vitória.
2. **Limpeza de Cenas em Encerramentos:**
   * Ao retornar ao Menu Principal ou reiniciar uma partida, todas as cenas ativas (`GameScene`, `UIScene`, `UpgradeScene`) devem ser finalizadas explicitamente (`this.scene.stop()`) antes de instanciar a próxima cena.

---

## 🎨 3. Padrão de Sprites & Resolução de Interface

1. **Preservação de Escala em Troca de Texturas (`setDisplaySize`):**
   * No Phaser 3, ao invocar `image.setTexture(novaChave)`, a engine preserva as propriedades `scaleX` e `scaleY` do objeto anterior.
   * Por essa razão, **sempre** que uma textura for substituída em objetos com dimensões fixas (como o retrato da heroína ou os bustos de diálogo), deve-se invocar `image.setDisplaySize(largura, altura)` imediatamente na linha seguinte.
2. **Padronização dos Sprites de Diálogo (`Chat<Nome>`):**
   * Cada personagem, chefe e NPC possui sua arte dedicada em `assets/sprites/.../Chat<Nome>.png` (resolução base 200x200).
   * O sistema de diálogos renderiza os bustos em **420x420px**, ancorados no rodapé absoluto da tela (`setOrigin(0.5, 1.0)`, `y = height + 8`), eliminando linhas de corte e emoldurando o diálogo sem encobrir textos.
3. **Transições Cinematográficas Condicionais:**
   * As animações de slide e fade dos bustos e o movimento do balão de fala ocorrem **apenas quando o personagem falante muda** (`currentSpeakerSide !== newSide`).
   * Falas consecutivas do mesmo personagem mantêm o busto e o balão estáveis na tela.

---

## 🔊 4. Áudio & Categorização Modular (SoundGroups)

1. Nenhum áudio deve ser adicionado de forma solta; todo efeito sonoro (SFX) e trilha musical (BGM) deve ser vinculado a um `SoundGroup` no `SoundService` (`SFXGroup` ou `MusicGroup`) para permitir controle unificado nos menus de configurações.

# Guia do Dono do Projeto — Hell Survivor (`docs/GUIA_DO_DONO.md`)

> **Para quem é este guia?**  
> Este guia foi feito especialmente para você, dono do jogo! Ele não tem palavras difíceis ou termos de programador. Se algum termo técnico for necessário, ele estará sempre explicado de forma simples entre parênteses.  
> 
> 🌐 **Endereço Oficial do Jogo na Internet:**  
> `[AGUARDANDO O DONO INFORMAR O ENDEREÇO DO GITHUB PAGES]`  
> *(Assim que você me disser o link do jogo online, ele ficará salvo aqui!)*

---

## 1. Como Começar uma Conversa Nova com a Inteligência Artificial (IA)

Quando a conversa com a IA ficar longa ou você abrir uma sessão nova do chat, basta copiar e colar o texto abaixo como sua primeiríssima mensagem:

```text
Leia AGENTS.md, docs/MECHANICS.md, docs/ARCHITECTURE.md e o fim do docs/CHANGELOG.md e me diga em 5 linhas em que pé o projeto está.
```

**Por que fazer isso?**  
Ao ler esses arquivos, a IA se lembrará instantaneamente de todas as regras do jogo, do que já está pronto, de como as coisas funcionam e do que ainda falta fazer, sem esquecer nada e sem inventar coisas da cabeça dela.

---

## 2. Como Pedir uma Coisa Nova no Jogo (Novo Recurso ou Ideia)

Para que a IA entenda perfeitamente o que você quer e não mude coisas que já estão funcionando, use sempre este molde simples em três passos:

* **O que eu quero:** (Descreva a sua ideia. Exemplo: *"Quero uma poção azul que caia no chão e congele os monstros por 3 segundos"*).
* **O que NÃO pode mudar:** (Diga o que deve continuar igual. Exemplo: *"Não pode mudar a velocidade da Nixy, nem mexer nas outras poções de cura"*).
* **Como vou saber que ficou bom:** (O que você vai olhar na tela para aprovar. Exemplo: *"Vou saber que deu certo quando eu passar por cima do frasco azul, os monstros ficarem azuis e parados, e depois voltarem a andar normalmente"*).

---

## 3. Como Relatar um Problema ou Bug

Se você estava jogando e algo deu errado, não se preocupe! Copie e preencha este formulário rápido no chat:

* **O que eu fiz:** (O passo a passo. Exemplo: *"Entrei no Modo História, derrotei a primeira chefe e cliquei no botão ESC enquanto a tela estava escurecendo"*).
* **O que eu esperava:** (Exemplo: *"Esperava pular o diálogo e ir direto para a fase seguinte"*).
* **O que aconteceu de verdade:** (Exemplo: *"A tela ficou preta e não respondeu aos meus cliques de mouse"*).
* **Print ou texto do Console:** (Aperte a tecla `F12` no seu teclado, clique na aba chamada **Console**, tire uma foto ou copie o texto em vermelho que aparecer e cole no chat).

---

## 4. Como Jogar Localmente e Como Publicar o Jogo na Internet

### Como Jogar no seu Computador (Versão de Desenvolvimento Normal)
* Dê dois cliques no arquivo **`JOGAR.bat`** na pasta raiz do jogo. Ele é o atalho para jogar e testar o jogo normal (porta 3000): libera a porta 3000 de instâncias residuais, limpa a memória temporária do Vite, inicia o servidor e abre o jogo no seu navegador padrão (`http://localhost:3000/`) sozinho.
* Para ensaio da versão de produção exatamente como vai para o ar (porta 8080 de preview), use **`TESTAR_VERSAO_1.bat`**.

### Como Publicar o Jogo Oficial na Internet
* **Endereço Oficial do Jogo:** [https://davi0147.github.io/Hell-Survivor/](https://davi0147.github.io/Hell-Survivor/)
* Você não precisa rodar comandos complicados nem mexer no Git:
  1. Basta escrever no chat da IA:  
     **"Publicar o jogo"**
  2. A IA vai conferir todos os testes automáticos, checar se nada está quebrado e parar para pedir a sua confirmação formal.
  3. Somente após você responder **"Confirmado"**, a IA fará o envio para o ar.

---

## 5. Como Voltar Atrás se Algo Der Errado na Versão Online

Se após uma publicação algo quebrar no site ou o jogo travar para os jogadores:

1. **Avisar a IA imediatamente:**  
   Escreva no chat: *"A última versão quebrou [explique o que quebrou]. Revierta para a versão estável anterior"*. A IA desfará as alterações com segurança.
2. **Botão de Emergência (Kill-Switch):**  
   Existe uma trava de emergência pronta no projeto (`scripts/sw-killswitch.js`). Se os navegadores dos seus jogadores ficarem presos numa versão ruim, a IA pode ativar esse recurso. Ele obriga o navegador de todo mundo a limpar o histórico antigo e baixar o jogo limpo direto da internet.

---

## 6. O que Fazer Quando a IA Diz que um Pedido "Não é Viável"

Às vezes a IA pode analisar o código e avisar que o que você pediu trará problemas de lentidão, quebrará partes antigas ou exigirá uma mudança arriscada demais. Quando isso acontecer:

* **Não desista da ideia!** Peça opções:  
  *"Entendi os riscos. Quais são 2 alternativas mais simples e seguras para conseguirmos um resultado parecido?"*
* **Divida em pedaços:**  
  *"Vamos fazer só a parte visual primeiro para eu ver como fica, e depois a gente pensa na parte mecânica?"*

---

## 7. O que Você Precisa Testar e o que a IA Testa

Você e a IA formam uma dupla de trabalho onde cada um faz o que sabe fazer de melhor:

| O que a IA Testa Sozinha (Automático) | O que SÓ VOCÊ pode Testar (No Jogo) |
| :--- | :--- |
| Se o código tem erros de digitação ou sintaxe. | Se o jogo está divertido e gostoso de jogar. |
| Se a matemática dos danos e vidas fecha a conta. | Se a arte, cores e efeitos visuais ficaram bonitos na tela. |
| Se os arquivos do jogo estão nos lugares certos. | Se o volume da música e dos sons está agradável aos ouvidos. |
| Se a gravação de dados *(save)* está guardando almas e moedas. | Se os cliques de mouse e teclas respondem com facilidade. |
| Se o instalador de celular *(PWA)* está configurado. | Se a dificuldade da partida está justa ou frustrante. |

---

## 8. Como Seus Amigos Devem Proceder na Primeira Vez

Antes da nossa correção de cache, os navegadores podiam guardar partes antigas do jogo na memória e misturar versões. Agora que o sistema foi blindado:

* **Na primeira vez que seus amigos entrarem após a atualização:**  
  Peça para eles darem um recarregamento forçado no navegador apertando as teclas:  
  **`Ctrl + F5`** (no computador)  
  *(Ou fecharem a aba e abrirem novamente se estiverem no celular).*
* **Nas próximas vezes (daqui para frente):**  
  Eles nunca mais precisarão fazer isso! O próprio jogo avisará no topo da tela com um botão **[ RECARREGAR ]** sempre que você publicar novidades.

---

## 9. O Guarda Automático de Qualidade (`INSTALAR_GUARDA.bat`)

Para garantir que o código do jogo nunca estrague sem querer, o projeto tem um "guarda de trânsito" automático que vigia todas as alterações antes que elas sejam gravadas no histórico do Git (*commits*).

### Como Ativar o Guarda no seu Computador (1 Clique)
* Dê dois cliques no arquivo **`INSTALAR_GUARDA.bat`** na pasta raiz do jogo.
* Uma janela preta vai abrir por um instante, avisar *"Guarda de qualidade ativado com sucesso!"* e pedir para você apertar qualquer tecla para fechar.
* **Pronto!** Você só precisa fazer isso **uma única vez** no seu computador.

### O Que o Guarda Faz?
Toda vez que você ou a IA tentarem salvar uma alteração no código (`git commit`), o guarda entra em ação sozinho nos bastidores e confere:
1. Se não há erros de digitação ou tipos quebrados no código (*TypeScript*).
2. Se nenhuma regra de organização ou aviso esquecido foi adicionado (*ESLint*).
3. Se todas as cores novas estão organizadas no tema oficial (*theme.ts*).
4. Se todos os testes automáticos continuam funcionando (*Vitest*).

### O Que Significa Quando o Commit é Bloqueado?
Se aparecer uma mensagem em vermelho dizendo que o commit foi bloqueado:
* **Fique tranquilo, nada quebrou!** Pelo contrário: significa que o guarda funcionou com perfeição e impediu que um código defeituoso entrasse no histórico do jogo.
* Se a IA estiver trabalhando, ela mesma vai ler o erro, consertar a falha e salvar de novo.
* Se você estiver usando o terminal e vir o bloqueio, basta pedir para a IA:  
  *"O guarda bloqueou o commit por causa de [cole o erro aqui]. Corrija antes de salvar"*.

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

### Como Jogar no seu Computador (Versão de Desenvolvimento)
* Dê dois cliques no arquivo **`JOGAR.bat`** na pasta raiz do jogo. Ele limpa a memória temporária, inicia o servidor e abre o jogo no seu navegador padrão sozinho.

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

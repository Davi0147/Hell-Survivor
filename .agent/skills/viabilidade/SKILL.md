---
name: viabilidade
description: Produz a Ficha de Avaliação de Viabilidade técnica para novos pedidos, mudanças de mecânica, arquitetura, regras ou balanceamento, sem editar nenhum arquivo.
---

# Avaliação de Viabilidade Técnica (Protocolo Obrigatório)

Quando o usuário fizer uma solicitação para criar ou alterar mecânica, arquitetura, regra, balanceamento ou estilo visual (ou ao invocar `/viabilidade`), execute esta análise rigorosa.

> [!IMPORTANT]
> - NÃO edite nenhum arquivo durante esta avaliação.
> - Discordar com argumentos técnicos e evidências do código é uma obrigação.
> - É estritamente proibido elogiar ou aceitar uma ideia sem análise prévia.
> - Se o pedido parecer prejudicial ou arriscado, aponte os problemas e proponha um caminho melhor. A decisão final é sempre do dono do projeto.

---

## Estrutura Obrigatória da FICHA DE VIABILIDADE

Responda exclusivamente no seguinte formato estruturado e aguarde o "ok" ou decisão do dono antes de iniciar qualquer implementação:

### 1. Objetivo Entendido
- **O que foi entendido (1 frase):** [Resumo claro e direto do objetivo principal]
- **O que NÃO foi entendido / Pontos em aberto:** [Dúvidas de escopo, casos de borda ou detalhes não especificados]

### 2. Viabilidade Técnica com Evidência
- [Análise fundamentada no código real com citação de arquivos, métodos e variáveis verificados por busca/grep, NUNCA baseada em memória]

### 3. Impacto e Riscos
- **Arquivos afetados:** [Lista de arquivos que precisariam ser alterados]
- **Risco de regressão:** [Possíveis efeitos colaterais em outras mecânicas ou fluxos]
- **Performance:** [Impacto frente a `PERFORMANCE_LIMITS`, meta de 60 FPS e mobile]
- **Compatibilidade com Saves:** [Impacto no `localStorage` / `STORAGE_KEYS` e necessidade de migração defensiva]

### 4. Conflitos
- [Verificação de conformidade com `AGENTS.md`, `docs/MECHANICS.md` e `docs/DECISIONS.md`]

### 5. Alternativa(s)
- **Alternativa 1:** [Descrição da alternativa]
- **Quando ela é melhor:** [Cenários em que a alternativa supera a proposta original]

### 6. Recomendação
- **Opção:** `[ FAZER ]` | `[ FAZER ADAPTADO ]` | `[ NÃO FAZER ]`
- **Motivo:** [Justificativa técnica rigorosa da recomendação]

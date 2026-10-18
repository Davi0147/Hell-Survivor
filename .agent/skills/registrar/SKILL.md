---
name: registrar
description: Protocolo de Registro de Memória para registrar regras, contratos, padrões, decisões e tarefas sem alterar nada em src/.
---

# Protocolo de Registro de Memória (Regra 14 do AGENTS.md)

Quando o usuário disser *"lembra"*, *"anota"*, *"sempre faça assim"* ou equivalente, NÃO responda apenas "ok". Execute rigorosamente estes 6 passos:

> [!IMPORTANT]
> Este workflow destina-se EXCLUSIVAMENTE à documentação. NUNCA altere arquivos de código em `src/` durante este processo.

---

## Os 6 Passos Obrigatórios de Registro

1. **Classificar o pedido:**
   - `REGRA` inviolável → Destino: [`AGENTS.md`](../../../AGENTS.md)
   - `CONTRATO` de mecânica → Destino: [`docs/MECHANICS.md`](../../../docs/MECHANICS.md)
   - `PADRÃO` visual / UX → Destino: [`docs/DESIGN_SYSTEM.md`](../../../docs/DESIGN_SYSTEM.md)
   - `DECISÃO` arquitetural / design → Destino: [`docs/DECISIONS.md`](../../../docs/DECISIONS.md)
   - `TAREFA` pendente / backlog → Destino: [`LIVRO_DE_ANOTACOES.md`](../../../LIVRO_DE_ANOTACOES.md)
   - `PREFERÊNCIA` pontual → Não é registrada (válida apenas para a mensagem atual).

2. **Sanar ambiguidade:**
   - Se o tipo não estiver 100% evidente, pergunte ao usuário qual categoria ele deseja antes de editar qualquer documento.

3. **Verificar duplicatas e conflitos:**
   - Pesquise no repositório (`AGENTS.md`, `docs/MECHANICS.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md`).
   - Apresente explicitamente se já existe algo idêntico, similar ou conflitante.

4. **Apresentar minuta exata:**
   - Mostre o **TEXTO EXATO** a ser inserido e o **ARQUIVO DE DESTINO**.
   - Valores numéricos e cores devem morar no código (`src/config/theme.ts`, `src/config/balance.ts`); o documento só aponta para eles.
   - Aguarde o "ok" do dono antes de gravar.

5. **Gravar, exibir diff e registrar no histórico:**
   - Aplique a alteração no documento correspondente.
   - Apresente o `git diff` do documento alterado.
   - Registre a atualização em [`docs/CHANGELOG.md`](../../../docs/CHANGELOG.md).

6. **Fidelidade absoluta de motivo:**
   - O campo "Motivo" aceita apenas o que o dono do projeto disse explicitamente ou o que o código comprova; caso contrário, declare `"não informado"`. Nunca invente justificativas.

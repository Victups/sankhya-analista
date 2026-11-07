---
name: consulta-sql
description: Montar, corrigir ou validar uma consulta SQL (Oracle) no banco do Sankhya, para análise ou para um painel. Use quando pedirem um número, uma lista, um indicador ou uma consulta para colar no Sankhya.
---

# Consulta SQL no Sankhya

1. **Conhecimento primeiro.** `buscar_conhecimento` com a pergunta: se já existe consulta validada em `sql/` para
   algo parecido, parta dela (a biblioteca de consultas verificadas: as da empresa em `sql/` e as gerais do plugin). Leia só os trechos que a busca
   apontar, não as notas inteiras. Se uma nota diz que um campo não é preenchido ou que uma regra é diferente, siga a nota.

2. **Campos e junções.** `descrever_tabela` em cada tabela: use só campos que existem no banco (os da linha "Nao
   existem no banco" dão ORA-00904). Junção pelo `caminho_entre_tabelas`, confirmando o sentido e a cardinalidade
   (cabeçalho x itens x parcelas duplicam valores).

3. **Escrever.** Em `sql/<AREA>/<nome>.sql`, com cabeçalho:
   ```sql
   -- <Título>
   -- Objetivo: <pergunta que a consulta responde>
   -- Tabelas: <TABELAS> (ver conhecimento/<NOTA>.md)
   -- Validado: base <producao|teste> em <mm/aaaa>, <n> linhas
   WITH periodo AS (SELECT DATE '2026-01-01' AS INI, DATE '2026-02-01' AS FIM FROM DUAL)
   SELECT ...
   ```
   - Literais e apelidos sem acento. Período `[INI, FIM)`. Comentário de linha não termina com `;`.
   - Ordem estável (`ORDER BY`) quando a consulta for paginada num painel.

4. **Validar pelo MCP.** Rode com `consultar_sql` antes de entregar: primeiro agregado ou com poucas linhas, filtrando
   período. Confira totais com uma tela do Sankhya quando der. Resultado grande ou planilha pedida: `exportar_sql`
   (grava em `dados/`) e `resumir_dados` sobre o arquivo; script local só para o que ela não faz.

5. **Registrar.** O que o resultado confirmou ou desmentiu vai para a nota da tabela (skill `registrar`). Consulta de
   painel: atualize `conhecimento/COBERTURA.md` (por indicador: sai do banco, sai com ressalva ou não existe).

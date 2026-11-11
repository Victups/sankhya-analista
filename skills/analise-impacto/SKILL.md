---
name: analise-impacto
description: Descobrir o que depende de um campo, tabela adicional (AD_) ou objeto antes de alterá-lo, desativá-lo ou renomeá-lo. Use quando a pessoa perguntar "se eu mudar/apagar esse campo, o que quebra?" ou for mexer no dicionário.
---

# Análise de impacto

Responde "o que usa isso?" antes de uma mudança. Só leitura. Resultado: uma lista do que cita o alvo e o que fazer com cada item.

1. **Alvo.** Tabela e campo exatos (`descrever_tabela`; o campo precisa existir no banco). Use o nome inteiro do campo.
   Nome curto ou comum (`CODPARC`, `CODPROD`) aparece em quase tudo e não ajuda: a análise serve para campo `AD_`,
   tabela adicional ou campo pouco usado. Para campo nativo comum, pergunte o que a pessoa quer mudar.

2. **Dicionário e chaves.** `descrever_tabela` mostra as ligações da tabela. Chaves estrangeiras de outras tabelas
   para ela:
   ```sql
   SELECT C.TABLE_NAME AS TABELA_FILHA, C.CONSTRAINT_NAME
   FROM ALL_CONSTRAINTS C
   WHERE C.OWNER = '<DONO>' AND C.CONSTRAINT_TYPE = 'R'
     AND C.R_CONSTRAINT_NAME IN (SELECT P.CONSTRAINT_NAME FROM ALL_CONSTRAINTS P
                                 WHERE P.OWNER = '<DONO>' AND P.TABLE_NAME = '<TABELA>' AND P.CONSTRAINT_TYPE = 'P')
   ```
   `<DONO>` é o esquema que `verificar_conexao` mostra.

3. **Personalizações guardadas no banco.** Conte primeiro por origem e só liste os nomes de quem tiver ocorrência
   (`max_linhas` baixo). Os textos são campos longos (CLOB): `UPPER(campo) LIKE` funciona; converta chaves e nomes com
   `TO_CHAR` para o `UNION ALL` fechar.
   ```sql
   SELECT 'gadget' AS ORIGEM, TO_CHAR(G.NUGDG) AS CHAVE, TO_CHAR(G.TITULO) AS NOME FROM TSIGDG G WHERE UPPER(G.CONFIG) LIKE '%<TERMO>%'
   UNION ALL SELECT 'dashboard', TO_CHAR(D.NUDSB), TO_CHAR(D.TITULO) FROM TSIDSB D WHERE UPPER(D.LAYOUT) LIKE '%<TERMO>%'
   UNION ALL SELECT 'botao de acao', TO_CHAR(B.IDBTNACAO), TO_CHAR(B.DESCRICAO) FROM TSIBTA B WHERE UPPER(B.CONFIG) LIKE '%<TERMO>%'
   UNION ALL SELECT 'evento programavel', TO_CHAR(E.NUEVENTO), TO_CHAR(E.DESCRICAO) FROM TSIEVP E WHERE UPPER(E.CONFIG) LIKE '%<TERMO>%'
   UNION ALL SELECT 'relatorio', TO_CHAR(R.NURFE), TO_CHAR(R.DESCRICAO) FROM TSIRFE R WHERE UPPER(R.CONFIG) LIKE '%<TERMO>%'
   UNION ALL SELECT 'acao agendada', TO_CHAR(A.NUAAG), TO_CHAR(A.NOME) FROM TSIAAG A
     WHERE UPPER(A.ACAO) LIKE '%<TERMO>%' OR UPPER(A.EXPGATILHO) LIKE '%<TERMO>%' OR UPPER(A.FONTEDADOS) LIKE '%<TERMO>%'
   UNION ALL SELECT 'regra de negocio', TO_CHAR(N.NURNG), TO_CHAR(N.DESCRICAO) FROM TGFRNG N
     WHERE UPPER(N.EXPRESSAO) LIKE '%<TERMO>%' OR UPPER(N.CONFIG) LIKE '%<TERMO>%'
   ```
   - O texto do relatório formatado (`TSIRFE.CONFIG`) pode vir vazio: o `.jrxml` nem sempre fica ali. Nesse caso
     a busca de arquivos do passo 5 é o que vale.
   - Confirme a tabela e o campo no `descrever_tabela` antes: coluna que não existe na sua versão dá `ORA-00904`.

4. **Código no banco.** Procedures, funções, pacotes e triggers (o texto fica em `ALL_SOURCE`, que aceita `LIKE`):
   ```sql
   SELECT S.TYPE AS TIPO, S.NAME AS NOME, COUNT(*) AS LINHAS_COM_O_TERMO
   FROM ALL_SOURCE S WHERE S.OWNER = '<DONO>' AND UPPER(S.TEXT) LIKE '%<TERMO>%'
   GROUP BY S.TYPE, S.NAME ORDER BY 3 DESC
   ```
   Views: o texto delas é `LONG` e não aceita `LIKE`. Veja quais objetos referenciam a **tabela** e depois confira o
   campo nas colunas da view (`ALL_TAB_COLUMNS`):
   ```sql
   SELECT D.TYPE AS TIPO, D.NAME AS NOME FROM ALL_DEPENDENCIES D
   WHERE D.OWNER = '<DONO>' AND D.REFERENCED_OWNER = '<DONO>' AND D.REFERENCED_NAME = '<TABELA>'
     AND D.TYPE IN ('VIEW','PROCEDURE','FUNCTION','PACKAGE BODY','TRIGGER') ORDER BY 1, 2
   ```

5. **Arquivos locais.** Procure o nome do campo (com limite de palavra) em `sql/`, `dashboards/`, `relatorios/` e
   `conhecimento/` da empresa.

6. **Ler antes de afirmar.** Achar o texto não prova que o item usa o campo: pode ser comentário, outro alias ou
   outra tabela com o mesmo nome de campo. Abra o trecho (`SUBSTR` do texto em volta) dos itens que importam e
   separe **usa de verdade** de **só cita**.

7. **Relatório.** Uma tabela: origem, nome, onde achar na tela, usa ou só cita, o que acontece se mudar, o que
   ajustar. Termine com o que a análise **não** cobre, porque ausência de resultado não prova que está livre:
   extensão Java compilada (módulo ou add-on), integração externa, planilha ou relatório fora do Sankhya,
   consulta que cada usuário guardou.

8. **Recomendar.** Desativar antes de apagar, testar na base de teste, ter como desfazer. A mudança em si é feita
   por quem tem acesso à tela, nunca pelo banco. Registrar o que se confirmou na nota da área (skill `registrar`).

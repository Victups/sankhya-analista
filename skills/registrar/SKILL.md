---
name: registrar
description: Registrar no conhecimento da empresa o que uma consulta, um teste ou uma investigação confirmou ou desmentiu sobre o Sankhya e os dados. Use ao fim de uma investigação, depois de analisar um resultado que a pessoa rodou, ou quando ela pedir para anotar algo.
---

# Registrar conhecimento

1. **Onde.** Nota da tabela ou da área em `conhecimento/` (veja o índice em `conhecimento/README.md`). Se não houver
   nota que caiba, crie uma e acrescente uma linha no índice.

2. **Como.** Fato curto, com a origem: mês/ano e a consulta (`sql/...`), o artigo da ajuda ou o teste. Formato:
   "`<TABELA>.<CAMPO>` <o que se viu> (confirmado em <mm/aaaa>, `sql/<AREA>/<arquivo>.sql`)".
   O que só foi visto no dicionário fica marcado "a validar". Se o fato depende da versão do Sankhya (tela, rotina,
   defeito), anote a versão (`verificar_conexao` mostra). Escreva como descrição, nunca como ordem ao agente.

3. **Corrigir em vez de acumular.** Se o fato novo desmente a nota, troque o texto errado (e diga na conversa o que
   mudou). Não deixe duas versões do mesmo fato.

4. **Sem dados pessoais e sem segredo.** Use códigos, nunca nome, CPF ou salário de pessoas; nunca senha ou endereço
   de servidor com credencial.

5. **Painéis.** Indicador novo ou que mudou de situação: atualize `conhecimento/COBERTURA.md`.

6. **Vale para qualquer Sankhya?** Se o fato é do produto (não da empresa), sugira à pessoa rodar a skill
   `propor-conhecimento` mais tarde.

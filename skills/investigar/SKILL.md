---
name: investigar
description: Investigar um problema no Sankhya (erro, valor errado, rotina que não funciona, rejeição de arquivo ou do eSocial) e propor a correção pela tela. Use quando a pessoa relatar um problema ou mandar print de erro.
---

# Investigar um problema no Sankhya

1. **Entender o sintoma.** Repita em uma frase o que está errado, em qual tela, empresa e período. Peça o texto exato
   do erro ou o print se faltar. Print com dado pessoal: trabalhe com códigos e não repita nomes, CPF ou valores de pessoas.

2. **O que já se sabe.** `buscar_conhecimento` com o assunto ou o texto do erro: se alguém da empresa já passou
   por isso, a nota diz a causa. **Regra do sistema:** `buscar_ajuda` com o nome da tela, do campo ou o texto do erro;
   `ler_artigo` nos melhores.
   Se a busca por palavra não achar, troque os termos (nome da tela no menu, sinônimo, código do erro). Se a empresa
   tiver o MCP `sankhya-ajuda` completo (busca por significado e posts da comunidade,
   `sankhya_ajuda_search_knowledge_unified`), use-o também: a comunidade costuma ter casos de erro que a ajuda não cobre.
   Artigo longo vem em partes: leia a seguinte só se a primeira não bastar.

3. **Configuração e dados.** Ache as tabelas (`buscar_dicionario`, `descrever_tabela`; o nome da tela ou da
   entidade também acha a tabela, pelas instâncias) e consulte o banco só para ler (`consultar_sql`), com consultas
   leves. Compare o caso com erro com um caso que funciona.
   - **A pessoa só deu um número?** Descubra o que ele é antes de supor: procure-o, numa consulta agregada, nas chaves
     mais comuns (`TGFCAB.NUNOTA`, `TGFCAB.NUMNOTA`, `TGFFIN.NUFIN`, `TGFPAR.CODPARC`, `TGFPRO.CODPROD`,
     `TFPFUN.CODFUNC`) e confirme com ela qual é.

4. **Causa com evidência.** Só proponha correção depois de ter a evidência (consulta rodada, artigo da ajuda,
   comparação). Diga o que foi descartado e por quê. Se faltar dado, diga qual consulta ou print resolve.

5. **Proposta para quem faz no Sankhya.** Para cada mudança: tela e caminho do menu, campo exato, valor de agora e
   valor novo, como testar (de preferência na base de teste) e como desfazer. Nunca corrija pelo banco.
   - Mudança em arquivo que vai para o Sankhya (relatório formatado, extensão): skill `alterar-relatorio`.
   - Defeito do produto: monte o texto do chamado para o suporte do Sankhya (versão, tela, passos, esperado x obtido,
     o que já foi testado, prints sem dados pessoais).
   - Documento para outra pessoa (contabilidade, DP, financeiro): HTML em `docs/` convertido em PDF, A4 em pé, uma
     coluna, passos numerados, sem ícones nem quadros
     (Edge sem janela: `msedge.exe --headless --print-to-pdf=<arquivo.pdf> --no-pdf-header-footer
     --user-data-dir=<pasta temporaria> <arquivo.html>`; o `msedge.exe` fica em
     `C:\Program Files (x86)\Microsoft\Edge\Application\`).

6. **Registrar.** Skill `registrar`: o que se confirmou, a causa e a correção, na nota da área.

---
name: propor-conhecimento
description: Separar do conhecimento da empresa o que vale para qualquer instalação do Sankhya e escrever uma proposta, sem dados da empresa, para o mantenedor do plugin incluir no conhecimento geral. Use quando a pessoa pedir para contribuir com o plugin ou depois de registrar um fato que é do produto.
---

# Propor conhecimento geral

O conhecimento geral do plugin (`${CLAUDE_PLUGIN_ROOT}/conhecimento-geral/`) vale para todas as empresas. Só entra
nele o que o mantenedor revisar. Esta skill prepara a proposta; ela não altera o plugin.

1. **Escolher.** Leia as notas de `conhecimento/` alteradas desde a última proposta (veja `propostas/`). Fica o que
   é comportamento do produto: significado de tabela e campo, regra de tela, parâmetro, trava ou trigger padrão,
   defeito confirmado, armadilha de SQL. Sai o que é da empresa: TOPs, naturezas, contas, metas, campos AD_ criados por
   ela, decisões internas.

2. **Tirar os dados da empresa.** Nada de nome da empresa, códigos locais (empresa, natureza, conta, centro de
   resultado, TOP, usuário, parceiro, produto, funcionário), valores, nomes de pessoas, IP ou servidor. Se o fato só faz
   sentido com o código, ele é da empresa: deixe de fora. Escreva como descrição do Sankhya, nunca como ordem ao agente.

3. **Conferir o que já existe.** `buscar_conhecimento` com o assunto e compare com o conhecimento geral: o fato é
   novo, confirma um fato geral (soma uma base) ou corrige um (diga qual trecho e por quê)?

4. **Escrever** `propostas/AAAA-MM-DD-<tema>.md`, com a versão do Sankhya da empresa (`verificar_conexao` mostra):
   ```markdown
   # Proposta: <tema>
   Versão do Sankhya: <ex.: 4.36b161>
   Arquivo de destino: conhecimento-geral/<arquivo>.md
   ## Fatos novos
   - <fato> (confirmado em <produção|teste>, <mm/aaaa>; como foi confirmado, sem dados)
   ## Confirma
   - <trecho do conhecimento geral que esta base também confirmou>
   ## Corrige
   - <trecho atual> -> <trecho novo> (motivo)
   ```

5. **Verificar.** Rode `node "${CLAUDE_PLUGIN_ROOT}/hooks/travas.mjs" texto propostas/<arquivo> --empresa "<nome>,<sigla>"`
   com o nome e as siglas da empresa (do `CLAUDE.md`). Corrija cada achado (ou tire o fato) até sair sem achados.

6. **Mostrar e enviar.** Mostre a proposta à pessoa e só envie com o aceite dela: arquivo para o mantenedor ou,
   se ela tiver acesso ao repositório do plugin no GitHub, um pull request só com esse arquivo em `propostas/`.
   O mantenedor revisa, inclui, publica uma versão nova e todas as empresas recebem na atualização do plugin.

---
name: alterar-relatorio
description: Alterar um relatório formatado (.jrxml) ou outro arquivo de relatório que vai para o Sankhya, guardando o original para desfazer. Use quando a correção de um problema ou um pedido exigir mudar um relatório. Botão, evento, ação agendada, regra, procedure ou Java ficam com a skill personalizacao.
---

# Alterar um relatório ou arquivo do Sankhya

1. **Pasta.** `relatorios/<numero>_<nome>/`, onde o número é o código do relatório ou do objeto no Sankhya.
   - `original/`: cópia exata do que está no Sankhya hoje (a pessoa exporta e coloca aqui). Nunca editar.
   - `alterado/`: a versão nova.
   - `LEIA-ME.md`: o que muda e por quê, onde subir no Sankhya (tela e campo), como testar e como desfazer
     (subir de novo o arquivo de `original/`).

2. **Mudar o mínimo.** Copie o original para `alterado/` e edite só o necessário. Mostre a diferença
   (`git diff --no-index original alterado`). SQL de dentro do relatório passa pela skill `consulta-sql`.

3. **Validar.** O SQL alterado roda pelo MCP; o arquivo continua válido (XML bem formado, Java compila se houver como).

4. **Entregar** os passos para a pessoa: onde subir, como testar na base de teste e como desfazer. Registre o que se
   aprendeu (skill `registrar`).

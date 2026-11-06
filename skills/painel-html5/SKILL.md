---
name: painel-html5
description: Criar ou alterar um dashboard ou relatório HTML5 para o Sankhya (componente do Construtor de Componentes de BI, JSP com executeQuery). Use quando pedirem um painel, dashboard, tela de indicadores ou relatório em HTML5 dentro do Sankhya.
---

# Painel HTML5 no Sankhya

1. **Consultas antes.** Cada SQL do painel passa pela skill `consulta-sql` (validado pelo MCP com o mesmo sufixo de
   paginação `OFFSET ... FETCH NEXT`) e cada indicador entra no `conhecimento/COBERTURA.md`.

2. **Partir do modelo.** Copie `${CLAUDE_PLUGIN_ROOT}/templates/html5_base/Base_Componente/` para
   `dashboards/<area>/html5_<nome>/<Nome_Do_Componente>/`. Se a empresa tiver modelo próprio em `dashboards/`, use o dela.
   No `main.jsp`, troque o título, o cabeçalho (`EMPRESA / AREA`), os cards, o rodapé, `SQL_PRINCIPAL`,
   `carregarDados()` e `celula()`. Cor da empresa: troque `--primary` no bloco do guia visual.

3. **Regras que não se quebram:**
   - Topo do `main.jsp` com as 5 diretivas JSP e `<snk:load/>` dentro do `<head>` (sem isso `executeQuery` não existe).
   - Banco só por `executeQuery(sql, params, callback)` via `consultar()` (pagina de 400 em 400). Todo SQL com `ORDER BY`.
   - Valor digitado vai em `params` (`?`), nunca concatenado. Todo dado do banco passa por `esc()` antes do `innerHTML`.
   - Nada de `${...}` no arquivo (o JSP interpreta). JavaScript ES5 (`var`, `function`, `+`).
   - Sem internet: nenhuma biblioteca de CDN; gráficos em HTML/CSS ou SVG desenhado no script.
   - Tela só com número, situação e motivo; a explicação das regras vai no `LEIA-ME` e na conversa, não na tela.
   - Consulta que pode falhar numa base não derruba o resto da tela: trate o erro dela à parte.

4. **Conferir.** Extraia o `<script>` e rode `node --check`; `grep '\${' main.jsp` tem que dar vazio.

5. **Zipar a pasta do componente** (o zip contém `<Nome_Do_Componente>/main.jsp`) com o tar do Windows, que grava
   barras certas: `"$SYSTEMROOT/System32/tar.exe" -a -c -f <Nome>.zip <Nome_Do_Componente>` (no Git Bash o `tar` comum
   gera .tar). Confira que o arquivo começa com `PK`.

6. **Subir no Sankhya** (passo para a pessoa): Construtor de Componentes de BI › componente HTML5 › Upload do Pacote
   HTML (o zip) e, em "Configurar Componente HTML5", Ponto de Entrada = `<Nome_Do_Componente>/main.jsp`. Sem o ponto
   de entrada aparece "O componente HTML5 utilizado não está nos padrões necessários".

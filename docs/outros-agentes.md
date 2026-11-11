# Usar o sankhya-analista fora do Claude Code

Vale para **Cursor, Codex (OpenAI), Gemini CLI, Antigravity (Google) e o agente do Copilot no VS Code**. É o mesmo analista: os dois MCPs, as skills
e o conhecimento. O que muda é o empacotamento, porque esses agentes não têm plugin do Claude Code.

## Instalar

Uma vez por máquina, o plugin numa pasta fixa (o config dos agentes aponta para ela; não mude de lugar depois):

```bash
git clone https://github.com/Victups/sankhya-analista
cd sankhya-analista && npm ci
```

Em cada repositório de empresa, na pasta dele:

```bash
node <pasta-do-plugin>/scripts/instalar.mjs --cliente cursor   # ou codex, gemini, antigravity, vscode
```

`--conexao ACME` para quem atende várias empresas na mesma máquina (lê `ORACLE_ACME_*`), `--pasta <dir>` para
instalar sem entrar na pasta. Rodar de novo atualiza tudo; nada é apagado fora dos blocos do próprio plugin.

Depois: definir as variáveis do banco (README, "Conexão com o banco"; a senha nunca vai para arquivo), reiniciar o
agente, abrir a pasta da empresa e pedir *"use a skill sankhya-comecar"*.

Para atualizar o plugin: `git pull && npm ci` na pasta dele e rodar o instalador de novo em cada empresa.

## O que o instalador escreve na pasta da empresa

| Arquivo | Para quê | Vai para o git? |
|---|---|---|
| config de MCP do cliente (tabela abaixo) | sobe `sankhya-oracle` e `sankhya-ajuda` só nesta pasta; tem o caminho do plugin nesta máquina, nunca senha | não (entra no `.gitignore`); cada pessoa roda o instalador |
| `.agents/skills/sankhya-<nome>/` (no VS Code, `.github/skills/`) | as skills, com o nome prefixado para não colidir com outras | sim, se a equipe quiser |
| `AGENTS.md` | decisões da empresa (do modelo) e, entre marcas, as regras gerais do analista | sim |
| `CLAUDE.md` | só `@AGENTS.md`: Claude Code e os outros leem o mesmo arquivo | sim |
| `.claude/settings.json` | vem do modelo: convida quem usa Claude Code a instalar o plugin ao abrir a pasta | sim |
| `.git/hooks/pre-commit` | barra `dados/`, planilhas, CSV, `Result_*.json` e segredo no commit | não (fica no clone) |

Empresa que já tem só `CLAUDE.md` continua com ele: o `AGENTS.md` criado manda ler o `CLAUDE.md`. Um `pre-commit`
que já exista não é sobrescrito; o instalador diz a linha para acrescentar.

## O que cada cliente lê

Formatos conferidos na documentação oficial de cada um em 11/11/2026.

| Cliente | Config de MCP | Skills | Instruções | Detalhe |
|---|---|---|---|---|
| Cursor | `.cursor/mcp.json` | `.agents/skills/` | `AGENTS.md` | usa `${workspaceFolder}` e `${env:VAR}` |
| Codex | `.codex/config.toml` | `.agents/skills/` | `AGENTS.md` e o `instructions` do MCP | só vale em pasta marcada como confiável; repassa as variáveis por `env_vars` |
| Gemini CLI | `.gemini/settings.json` | `.agents/skills/` | `AGENTS.md`, pelo `context.fileName` que o instalador configura | só vale em pasta confiável; as variáveis ficam declaradas no `env` porque o ambiente herdado pode ter `*PASSWORD*` e `*SECRET*` redigidos (a documentação se contradiz sobre o padrão) |
| Antigravity | `.agents/mcp_config.json` | `.agents/skills/` | `AGENTS.md` | a documentação não fala de interpolação nem do diretório de início: caminho literal, e a senha só pelo ambiente herdado (no Windows o MCP lê também o registro do usuário) |
| VS Code (Copilot) | `.mcp.json` na raiz | `.github/skills/` (não lê `.agents/skills/`) | `AGENTS.md`, sem configuração | variáveis como `${NOME:-}`; não existe `${workspaceFolder}`, então o caminho vai literal; só inicia em workspace confiável; a documentação não cita o `instructions` do MCP nem diz se o plano Free tem MCP. **O `.mcp.json` também é lido pelo Claude Code**: quem usa os dois na mesma pasta fica com dois MCPs de banco; se o arquivo já era versionado, a mudança tem caminho desta máquina e não deve ser commitada |

## O que se perde fora do Claude Code

- **Regras na sessão:** o hook que injeta o `REGRAS.md` vira o `AGENTS.md` mais o `instructions` do MCP. Numa equipe
  mista, quem usa Claude Code recebe as regras duas vezes (hook e `AGENTS.md`), uns 1.000 tokens.
- **Bloqueio de segredo, `sqlplus` e serviços do Sankhya pelo terminal:** não tem equivalente. O agente tem terminal e
  pode ler a senha da variável de ambiente. A defesa que sobra é o MCP (só `SELECT`/`WITH`, transação somente leitura)
  e o **usuário do banco só de leitura, que aqui deixa de ser recomendação e vira requisito** (a skill `comecar`
  entrega a proposta para o DBA). Use a aprovação padrão do agente: não ligue auto-run, modo Turbo, `--yolo` nem
  desligue o sandbox.
- **Cofre de senha das opções do plugin:** só variável de ambiente.
- **Commit de dados:** continua barrado, agora pelo `pre-commit` do git, que vale para qualquer agente e para quem
  commita à mão.

## Verificação

Os arquivos gerados foram validados (JSON e TOML com parser), o MCP gerado sobe e lista as ferramentas num cliente
MCP de teste, e o `pre-commit` foi exercitado num repositório git temporário (`npm run teste`). **Não foi rodado dentro
dos cinco agentes**: nenhum está instalado na máquina de desenvolvimento. A primeira execução em cada um é o teste
final; se algo diferir da documentação, abra uma issue com o agente, a versão e a mensagem.

## Ficam de fora

- **ChatGPT e Gemini no navegador:** só abrem MCP remoto por https, e o banco fica atrás da VPN. Expor o MCP na
  internet seria expor o banco.
- **IA local (Continue, Cline, LM Studio, Goose):** o mesmo MCP serve, mas o instalador ainda não gera o config deles.
  A qualidade depende de o modelo chamar ferramentas direito.

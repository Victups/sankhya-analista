---
name: comecar
description: Começar ou reconectar uma empresa no sankhya-analista. Cria a estrutura do repositório da empresa na pasta atual, testa a conexão com o banco do Sankhya (produção e teste), confere se o usuário só lê e extrai o dicionário. Use na primeira vez numa pasta nova ou quando a conexão mudar.
---

# Começar uma empresa

A pasta atual é o repositório da empresa. Se ela já tem `conhecimento/` e `dicionario/`, é uma reconexão: vá ao passo 3.

1. **Estrutura.** Liste o que já existe na pasta. Copie o modelo sem sobrescrever nada:
   `cp -rn "${CLAUDE_PLUGIN_ROOT}/templates/empresa/." .` (no PowerShell, copie arquivo a arquivo só os que não existem).
   Pergunte o nome da empresa e troque `<EMPRESA>` no `CLAUDE.md`. Crie a pasta `dados/` (fica fora do git).
   Se a pasta não for um repositório git, sugira `git init` e um repositório remoto **privado**; quem cria e commita é a pessoa.

2. **Plugin só nesta pasta, e para a equipe.** Recomende habilitar o plugin no escopo do projeto
   (`claude plugin install sankhya-analista@sankhya-analista --scope project`), assim o MCP do banco só roda aqui.
   Para os colegas receberem o plugin ao abrir o repositório, crie `.claude/settings.json` (vai para o git) com a
   origem do catálogo que aparece em `claude plugin marketplace list --json` (entrada `sankhya-analista`):
   ```json
   {
     "extraKnownMarketplaces": {
       "sankhya-analista": { "source": { "source": "github", "repo": "Victups/sankhya-analista" } }
     },
     "enabledPlugins": { "sankhya-analista@sankhya-analista": true }
   }
   ```
   (catálogo em outro git: `{ "source": "git", "url": "<url>" }`). Cada pessoa preenche a própria conexão; se o
   convite não aparecer ao abrir a pasta, ela instala com o comando acima.

3. **Conexão.** Chame `verificar_conexao` (base `producao`). Se falhar:
   - "Conexao nao configurada": preencher as opções do plugin (`/plugin` › sankhya-analista › configurar, ou
     `claude plugin configure sankhya-analista`) ou as variáveis de ambiente do README do plugin. A senha a pessoa
     digita na tela do Claude Code ou no PowerShell; nunca peça a senha no chat.
   - `NJS-510`/`NJS-503` (tempo esgotado): rede ou VPN desligada.
   - `ORA-01017`: usuário ou senha errados. `ORA-00942` em TDDTAB: falta informar o dono das tabelas (opção `oracle_schema`).

4. **Só leitura?** Se o resultado disser "Pode gravar: SIM", avise uma vez que o agente não grava (o MCP bloqueia), mas
   que o ideal é um usuário só de leitura. Entregue ao DBA a proposta abaixo (você não executa nada disso) e registre a
   decisão da empresa na seção "Banco" do `CLAUDE.md`. Depois disso, não volte a questionar.

   ```sql
   -- Proposta para o DBA. Trocar SANKHYA pelo dono das tabelas e <SENHA> por uma senha forte.
   CREATE USER ANALISTA_LEITURA IDENTIFIED BY "<SENHA>";
   GRANT CREATE SESSION TO ANALISTA_LEITURA;
   BEGIN
     FOR o IN (SELECT OBJECT_NAME FROM ALL_OBJECTS WHERE OWNER = 'SANKHYA' AND OBJECT_TYPE IN ('TABLE', 'VIEW')) LOOP
       EXECUTE IMMEDIATE 'GRANT READ ON SANKHYA."' || o.OBJECT_NAME || '" TO ANALISTA_LEITURA';
     END LOOP;
   END;
   /
   -- Tabela nova criada depois (campo ou tabela adicional) precisa de novo GRANT READ.
   -- Opcional, para investigar personalizacoes (codigo de procedure e trigger), so leitura do catalogo:
   GRANT SELECT_CATALOG_ROLE TO ANALISTA_LEITURA;
   ```
   Com esse usuário, preencher a opção `oracle_schema` com o dono (ex.: SANKHYA).

5. **Base de teste.** Se houver (opção `teste_user`), rode `verificar_conexao` com `base: teste`. Sem base de teste,
   anote no `CLAUDE.md` que experimentos rodam só como consulta leve na produção.

6. **Dicionário.** Rode `extrair_dicionario` (base `producao`). Ele grava `dicionario/` e o `MAPA.md`. Mostre o resumo.

7. **CLAUDE.md.** Preencha a seção "Banco": versão do Oracle, usuário, dono das tabelas, se é só leitura e a decisão,
   base de teste e data da extração.

8. Diga à pessoa o que dá para pedir agora: investigar um problema, montar uma consulta, um painel HTML5, alterar um
   relatório, registrar conhecimento.

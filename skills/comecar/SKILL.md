---
name: comecar
description: Começar ou reconectar uma empresa no sankhya-analista. Monta o repositório da empresa na pasta atual (estrutura, git, repositório privado no GitHub se a pessoa quiser), testa a conexão com o banco do Sankhya (produção e teste), confere se o usuário só lê, extrai o dicionário e faz o primeiro commit se a pessoa autorizar. Use na primeira vez numa pasta nova ou quando a conexão mudar.
---

# Começar uma empresa

A pasta atual é o repositório da empresa. O objetivo é a pessoa dizer "começar" e sair com tudo pronto, perguntando
**só o que não dá para descobrir**: o nome da empresa, e um sim ou não para criar o repositório remoto e para o primeiro
commit. A senha do banco a pessoa digita na tela do agente ou no PowerShell, nunca no chat.

Se a pasta já tem `conhecimento/` e `dicionario/`, é uma reconexão: vá ao passo 4.

1. **Diagnóstico (sem perguntar).** Veja e anote: se a pasta é um repositório git (`git rev-parse --is-inside-work-tree`),
   se tem remoto (`git remote -v`), se tem `.claude/settings.json`, `AGENTS.md`, `CLAUDE.md`, `conhecimento/`, `dicionario/`,
   se o `gh` está instalado e logado (`gh auth status`). Diga em uma frase o que já existe e o que vai fazer.

2. **Estrutura (automático).** Copie o modelo sem sobrescrever nada:
   `cp -rn "${CLAUDE_PLUGIN_ROOT}/templates/empresa/." .` (no PowerShell, copie arquivo a arquivo só os que não existem;
   o modelo inclui arquivos de pasta oculta, como `.claude/settings.json`). Pergunte o nome da empresa (única pergunta
   desta etapa) e troque `<EMPRESA>` no `AGENTS.md` (o `CLAUDE.md` do modelo só aponta para ele; uma empresa que já tem só
   `CLAUDE.md` continua com ele). Crie `dados/` (fica fora do git).
   - Se a pasta não for um repositório git, rode `git init` (é local e não publica nada).
   - **Equipe, no Claude Code.** O `.claude/settings.json` copiado já aponta o catálogo do plugin e o habilita: o colega que
     clonar o repositório recebe o convite ao abrir a pasta. Se o catálogo da pessoa vier de outra origem (veja
     `claude plugin marketplace list --json`, entrada `sankhya-analista`), ajuste `extraKnownMarketplaces` (para um git
     qualquer: `{ "source": "git", "url": "<url>" }`). Recomende o escopo do projeto
     (`claude plugin install sankhya-analista@sankhya-analista --scope project`): o MCP do banco só roda nesta pasta.
   - **Outros agentes (Cursor, Codex, Gemini CLI, Antigravity, VS Code com Copilot).** Não há plugin: o
     `scripts/instalar.mjs` do plugin já escreveu o MCP, as skills (`.agents/skills/`, ou `.github/skills/` no VS Code) e o
     `AGENTS.md` nesta pasta (veja `docs/outros-agentes.md` do plugin).
     Se não rodou, peça à pessoa para rodar e siga.

3. **Repositório remoto privado (uma pergunta).** Se já há remoto, confirme que é privado (`gh repo view --json visibility`,
   quando o `gh` estiver logado) e siga. Se não há:
   - **Com `gh` logado:** pergunte uma vez: "Posso criar o repositório **privado** `<empresa>-sankhya` em
     `<conta ou organização>` no GitHub?" Criar repositório publica algo fora da máquina: só com o sim da pessoa.
     Se sim: `gh repo create <conta>/<empresa>-sankhya --private --source=. --remote=origin` e confira que
     `gh repo view --json visibility` devolve `PRIVATE`; se não for, avise e pare.
   - **Sem `gh`** (ou a pessoa prefere outro lugar, como GitLab): entregue os passos: criar um repositório **privado e
     vazio** no site, copiar a URL e rodar `git remote add origin <url>`. Sem remoto o plugin funciona igual; o remoto só
     serve para compartilhar com a equipe e guardar cópia.
   - O repositório da empresa **nunca** pode ser público: guarda dicionário e conhecimento do banco dela.

4. **Conexão.** Chame `verificar_conexao` (base `producao`). Se falhar:
   - "Conexao nao configurada": preencher as opções do plugin (Claude Code: `/plugin` › sankhya-analista › configurar, ou
     `claude plugin configure sankhya-analista`) ou as variáveis de ambiente do README do plugin (as únicas, nos outros
     agentes). A senha a pessoa digita na tela do Claude Code ou no PowerShell; nunca peça a senha no chat.
   - `NJS-510`/`NJS-503` (tempo esgotado): rede ou VPN desligada.
   - `ORA-01017`: usuário ou senha errados. `ORA-00942` em TDDTAB: falta informar o dono das tabelas (opção `oracle_schema`).
   - Sem acesso direto ao Oracle (Sankhya na nuvem): opções do API Gateway (`api_client_id`, `api_client_secret`, `api_x_token`).

5. **Só leitura?** Se o resultado disser "Pode gravar: SIM", avise uma vez que o agente não grava (o MCP bloqueia), mas
   que o ideal é um usuário só de leitura. Entregue ao DBA a proposta abaixo (você não executa nada disso) e registre a
   decisão da empresa na seção "Banco" do `AGENTS.md`. Depois disso, não volte a questionar.
   Fora do Claude Code o agente tem terminal sem as travas do hook do plugin (leitura de segredo, `sqlplus`): o usuário
   só de leitura deixa de ser recomendação e passa a ser a única defesa dura além do MCP. Diga isso à pessoa e peça o
   usuário de leitura antes de seguir; a decisão de seguir sem ele é dela, e fica registrada.

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

6. **Base de teste.** Se houver (opção `teste_user`), rode `verificar_conexao` com `base: teste`. Sem base de teste,
   anote no `AGENTS.md` que experimentos rodam só como consulta leve na produção.

7. **Dicionário.** Rode `extrair_dicionario` (base `producao`). Ele grava `dicionario/` e o `MAPA.md`. Mostre o resumo.
   Preencha a seção "Banco" do `AGENTS.md` (ou do `CLAUDE.md`, se a empresa só tem esse): versão do Oracle, usuário, dono
   das tabelas, se é só leitura e a decisão, base de teste e data da extração.

8. **Primeiro commit (uma pergunta).** Se a pasta é git, rode `git status --short` e mostre o que entraria. Confirme que
   `dados/` e arquivos `.csv`/`.xls*` **não** aparecem (o `.gitignore` do modelo cuida disso; se aparecerem, pare e
   corrija o `.gitignore` antes). Pergunte: "Faço o primeiro commit com estes arquivos
   (e envio ao repositório remoto, se houver)?" Só com o sim:
   `git add AGENTS.md CLAUDE.md .gitignore .claude conhecimento dicionario` (mais `.agents` ou `.github/skills`, se o
   instalador dos outros agentes criou; caminhos específicos, nunca `git add -A`), `git commit` com mensagem curta como "estrutura inicial do
   analista Sankhya" e, havendo remoto, `git push -u origin HEAD`. Com o não, deixe os comandos prontos para a pessoa.

9. **Resumo final.** Diga o que foi criado, o que ficou pendente (ex.: remoto, conexão de teste, usuário que grava) e o
   que dá para pedir agora: investigar um problema, montar uma consulta, um painel HTML5, alterar um relatório, registrar
   conhecimento. Se alguma etapa foi pulada, diga qual e como retomar (`comecar` pode ser repetida: não sobrescreve nada).

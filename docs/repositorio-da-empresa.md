# Repositório da empresa

Cada empresa tem **um repositório privado** que é a memória do analista: as decisões dela, o dicionário do banco dela e
tudo o que se aprende com o uso. O plugin é igual para todas as empresas; este repositório é o que muda.

## Começar em quatro passos

1. **Pasta.** Crie uma pasta vazia (ou clone um repositório privado vazio) e abra o Claude Code dentro dela.
2. **Plugin.** Instale só para esse projeto:
   ```bash
   claude plugin marketplace add Victups/sankhya-analista      # uma vez por máquina
   claude plugin install sankhya-analista@sankhya-analista --scope project
   ```
3. **Conexão.** O Claude Code pede as opções do banco ao habilitar (endereço, usuário, senha). A senha é digitada na
   tela dele e vai para o cofre de credenciais, nunca para o chat nem para o repositório.
4. **"Começar".** Escreva `começar` no Claude Code. Ao abrir uma pasta onde o plugin foi habilitado e que ainda não é
   de empresa, o próprio agente já oferece isso na primeira resposta. A skill `comecar` faz o resto.

Não precisa criar o repositório remoto antes: a skill propõe criar (veja abaixo). E dá para trabalhar só com a pasta
local; o remoto serve para compartilhar com a equipe e guardar cópia.

## O que a skill `comecar` faz

| Etapa | Como acontece |
|---|---|
| Diagnóstico da pasta (git, remoto, `gh`, arquivos já existentes) | Sozinha |
| Copiar o modelo: `CLAUDE.md`, `.gitignore`, `conhecimento/`, `.claude/settings.json` | Sozinha, **sem sobrescrever** nada que já exista |
| `git init`, se a pasta não for um repositório | Sozinha (é local, não publica) |
| Nome da empresa no `CLAUDE.md` | **Pergunta** (a única pergunta obrigatória) |
| Criar o repositório privado no GitHub (`gh repo create --private`) | **Pergunta** uma vez; só com o sim. Confere que ficou `PRIVATE` |
| Testar a conexão, conferir se o usuário só lê, base de teste | Sozinha; falhas vêm com a causa provável (VPN, senha, dono das tabelas) |
| Extrair o dicionário e o `MAPA.md` | Sozinha |
| Primeiro commit e envio ao remoto | **Pergunta** uma vez, mostrando os arquivos; só com o sim |

Pode ser repetida a qualquer momento (`começar` de novo): ela não sobrescreve e retoma o que faltar.

**O que ela nunca faz:** pedir a senha no chat, escrever no banco, criar repositório público, usar `git add -A`, ou
commitar `dados/`, planilhas e `Result_*.json` (o `.gitignore` do modelo e as travas do plugin barram).

### Sem o `gh` (ou com GitLab, Azure DevOps...)

A skill entrega os passos: criar um repositório **privado e vazio** no site, copiar a URL e rodar
`git remote add origin <url>`. O restante é igual.

## Como fica a pasta

```text
<pasta da empresa>/
├── CLAUDE.md                  decisões e exceções desta empresa (banco, regras, quem executa o quê)
├── .gitignore                 dados/, planilhas, segredos
├── .claude/
│   └── settings.json          habilita o plugin para quem abrir o repositório
├── conhecimento/              notas por área e COBERTURA.md (o que sai do banco e o que não)
├── dicionario/                campos, chaves, ligações e MAPA.md, gerados por extrair_dicionario
├── dados/                     exportações e resultados de consulta (FORA do git)
├── sql/                       consultas validadas, criada quando a primeira é salva
├── dashboards/  relatorios/  docs/    criadas pelas skills quando precisam
```

| Vai para o git | Fica só na máquina |
|---|---|
| `CLAUDE.md`, `conhecimento/`, `dicionario/`, `sql/`, `dashboards/`, `relatorios/`, `docs/`, `.claude/settings.json` | `dados/` (pode ter dado pessoal), planilhas, `.claude/settings.local.json`, senhas e `.env` |

## A equipe

- **Colega novo:** clona o repositório e abre a pasta no Claude Code. O `.claude/settings.json` faz o convite para
  instalar o plugin; ele só preenche a **própria** conexão com o banco (de preferência um usuário de leitura por pessoa).
- **O conhecimento circula pelo git:** o que uma pessoa registra em `conhecimento/` chega aos outros no `git pull`.
- **Várias empresas na mesma máquina:** uma pasta e um repositório por empresa; veja "Várias empresas" na seção
  Configuração do [README](../README.md).

## Se algo falhar

| Sintoma | Causa provável |
|---|---|
| `Conexao nao configurada` | Opções do plugin vazias: `claude plugin configure sankhya-analista` |
| `NJS-510` ou `NJS-503` | Rede ou VPN desligada |
| `ORA-01017` | Usuário ou senha errados |
| `ORA-00942` em `TDDTAB` | Falta o dono das tabelas (opção `oracle_schema`) |
| Convite do plugin não aparece ao abrir a pasta | Rode o `install` do passo 2 uma vez |
| "Pode gravar: SIM" em `verificar_conexao` | O agente não grava (o MCP bloqueia), mas o ideal é um usuário só de leitura; a skill entrega a proposta ao DBA |

## Segurança do repositório

- Tem que ser **privado**: guarda o dicionário e o conhecimento do banco da empresa.
- Nada de dado pessoal no git: ele fica em `dados/`. Antes de publicar uma nota para o conhecimento geral do plugin,
  use `node hooks/travas.mjs texto <arquivo>` (veja a skill `propor-conhecimento`).
- O plugin nunca recebe dado da empresa; o caminho inverso (plugin para a empresa) é só leitura.

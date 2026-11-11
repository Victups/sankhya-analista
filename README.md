# sankhya-analista

Plugin do Claude Code que funciona como um analista desenvolvedor do ERP Sankhya. A pessoa conecta o banco Oracle da
empresa (só leitura), o plugin extrai o dicionário e o grafo de ligações entre as tabelas, consulta a Central de Ajuda
do Sankhya e vai guardando o que aprende num repositório privado da empresa. Investiga problemas, monta consultas SQL,
painéis HTML5 e alterações de relatório, sempre propondo a correção para alguém aplicar pela tela, nunca gravando no banco.

## Como as peças se dividem

- **Plugin (este repositório):** igual para todas as empresas. Comandos (skills), travas (hooks), MCP do Oracle,
  MCP da Central de Ajuda, conhecimento geral do Sankhya e modelos.
- **Repositório da empresa (privado, um por empresa):** `CLAUDE.md` com as decisões dela, `dicionario/` do banco dela,
  `conhecimento/`, `sql/`, `dashboards/`, `relatorios/`, `docs/` e `dados/` (fora do git). Nada dele vem para o plugin.

## Instalar

Precisa de [Claude Code](https://code.claude.com) e Node.js 18 ou mais novo. Acesso ao banco pela rede ou VPN.

```bash
# uma vez por máquina: registrar o catálogo (este repositório)
claude plugin marketplace add Victups/sankhya-analista

# na pasta do repositório da empresa: instalar só para este projeto
claude plugin install sankhya-analista@sankhya-analista --scope project
```

Instalado de um repositório git, o Claude Code instala as dependências do Node sozinho. Se o catálogo for uma pasta
local, rode `npm ci` nessa pasta antes do primeiro uso.

Ao habilitar, o Claude Code pede as opções de conexão (também em `claude plugin configure sankhya-analista`).
Depois, abra o Claude Code na pasta da empresa e peça para começar (skill `sankhya-analista:comecar`).

**Cursor, Codex, Gemini CLI ou Antigravity:** `node scripts/instalar.mjs --cliente cursor` (ou `codex`, `gemini`,
`antigravity`) na pasta da empresa. Veja [docs/outros-agentes.md](docs/outros-agentes.md).

## Conexão com o banco

| Opção do plugin | Variável de ambiente equivalente | Para quê |
|---|---|---|
| `oracle_connect_string` | `ORACLE_CONNECT_STRING` | `host:porta/serviço` da produção |
| `oracle_user` | `ORACLE_USER` | usuário (de preferência só de leitura) |
| `oracle_password` (sigilosa) | `ORACLE_PASSWORD` | senha |
| `oracle_schema` | `ORACLE_SCHEMA` | dono das tabelas, quando o usuário é só de leitura |
| `teste_user` | `ORACLE_TESTE_USER` | usuário da base de teste (vazio: sem teste) |
| `teste_connect_string` | `ORACLE_TESTE_CONNECT_STRING` | vazio: o mesmo da produção |
| `teste_password` (sigilosa) | `ORACLE_TESTE_PASSWORD` | vazio: a mesma da produção |
| `teste_schema` | `ORACLE_TESTE_SCHEMA` | vazio: o próprio usuário de teste |

A opção vazia cai para a variável de ambiente. A senha vai para o cofre de credenciais do Claude Code (no Windows,
o arquivo de credenciais do perfil do usuário), nunca para o repositório. Para definir a variável no Windows sem a
senha aparecer na tela nem no histórico:

```powershell
$s = Read-Host 'Senha do Oracle' -AsSecureString
[Environment]::SetEnvironmentVariable('ORACLE_PASSWORD', [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)), 'User')
Remove-Variable s
```

Opcionais só por variável: `ORACLE_CLIENT_LIB_DIR` (Oracle Instant Client, para banco anterior ao 12.1) e
`ORACLE_CALL_TIMEOUT_MS` (padrão 120000).

**Sem acesso direto ao Oracle (Sankhya na nuvem):** o plugin usa o API Gateway do Sankhya. Preencha as opções
`api_client_id`, `api_client_secret` e `api_x_token` (ou `SANKHYA_CLIENT_ID`, `SANKHYA_CLIENT_SECRET`,
`SANKHYA_X_TOKEN`; `SANKHYA_API_URL` para o sandbox). As consultas vão pelo `DbExplorerSP.executeQuery`, com a
mesma trava de SQL, mas sem transação somente leitura: a única proteção é a trava, e `verificar_conexao` avisa.
Base com Oracle direto configurado usa o Oracle; sem ele, usa a API. Para outras bases ou conexões com nome, o padrão
é o mesmo do Oracle (`SANKHYA_TESTE_CLIENT_ID`, `SANKHYA_ACME_CLIENT_ID`...).

**Outras bases** (treinamento, homologação...): `ORACLE_<BASE>_USER` e, se forem diferentes da produção,
`ORACLE_<BASE>_CONNECT_STRING`, `ORACLE_<BASE>_PASSWORD` e `ORACLE_<BASE>_SCHEMA`. O agente usa `base: treinamento`.

**Várias empresas na mesma máquina:** no `.claude/settings.json` do repositório de cada empresa,
`"env": { "SANKHYA_CONEXAO": "ACME" }`. Nessa pasta o plugin passa a ler `ORACLE_ACME_CONNECT_STRING`,
`ORACLE_ACME_USER`, `ORACLE_ACME_PASSWORD`, `ORACLE_ACME_SCHEMA` e, para outras bases, `ORACLE_ACME_TESTE_USER` etc.
As senhas ficam em variáveis de usuário do Windows, nunca no repositório.

## O que vem no plugin

**MCP `oracle`** (somente leitura; Oracle direto ou API Gateway): `consultar_sql`, `exportar_sql` (resultado grande
para `dados/`, só o resumo volta à conversa), `resumir_dados` (perfil, agrupar, somar e filtrar um arquivo de `dados/`
sem trazer as linhas para a conversa), `verificar_conexao` e `extrair_dicionario`, com
`base: producao | teste`; sem banco, `buscar_dicionario` (entende abreviações do dicionário, sinônimos e nomes de
instância/tela), `descrever_tabela`, `caminho_entre_tabelas` (com `passar_por`) e `buscar_conhecimento` (notas da
empresa, consultas validadas de `sql/` e conhecimento geral, por relevância).

**MCP `ajuda`**: `buscar_ajuda` e `ler_artigo` na Central de Ajuda pública do Sankhya (busca por palavra, direto
na API pública, sem instalar nada). Opcional: o MCP `sankhya-ajuda` completo (Docker, PostgreSQL com pgvector) busca
por significado nos artigos e nos posts da comunidade; quem o tiver registrado no Claude Code, as skills usam também.

**Skills:** `comecar`, `mapear-banco`, `investigar`, `consulta-sql`, `painel-html5`, `alterar-relatorio`,
`personalizacao` (botão de ação, evento programável, ação agendada, regra de negócio, trigger e procedure, módulo Java
e add-on, campo e tela adicional; com referência por tipo tirada da documentação pública do Sankhya), `registrar`,
`propor-conhecimento`.

**Travas (hooks):** no início da sessão, injeta as regras do analista (`conhecimento-geral/REGRAS.md`) quando a pasta
é um repositório de empresa. Antes de cada comando, bloqueia: ler ou expor `.env`, chaves e credenciais; ler cofre de
senhas pelo terminal; acessar o banco por fora do MCP (sqlplus, oracledb...) ou pelos serviços do Sankhya
(`service.sbr`, `DbExplorerSP`, `CRUDServiceProvider`); `git add --force`; e commit de `dados/`, planilhas, CSV e
`Result_*.json`. `node hooks/travas.mjs texto <arquivo>` verifica se um texto tem dado de empresa (CPF, CNPJ, e-mail,
IP, valor, código local, nome da empresa com `--empresa`), segredo ou frase que pareça ordem ao agente.

**Conhecimento geral** (`conhecimento-geral/`): o que vale para qualquer Sankhya, mais uma biblioteca de consultas gerais em `conhecimento-geral/sql/` (vendas e compras, pagar e receber, saldo bancário, estoque, personalizações, admissões). O da empresa prevalece.

**Modelos** (`templates/`): estrutura do repositório da empresa e componente HTML5 base.

## Equipe e várias empresas

- **Mesma empresa:** um repositório privado, cada pessoa com o seu clone e a sua conexão (de preferência um usuário
  de banco só de leitura por pessoa). O conhecimento circula pelo git. O `.claude/settings.json` do repositório
  (criado pela skill `comecar`) aponta o catálogo e habilita o plugin para quem abrir a pasta.
- **Várias empresas:** cada uma com o seu repositório; nada passa de uma para outra. Todas instalam o plugin daqui.
- **Aprendizado geral:** a skill `propor-conhecimento` gera uma proposta sem dados da empresa, verificada pelo
  `travas.mjs texto`, e a pessoa envia (arquivo ou pull request em `propostas/`). O mantenedor revisa, inclui em
  `conhecimento-geral/` com a situação do fato (a validar, confirmado em N bases, versões) e publica. Nada entra no
  conhecimento geral sem revisão humana: memória compartilhada é alvo de envenenamento.

## Segurança

- O MCP só aceita `SELECT`/`WITH`, uma instrução por vez, sem `FOR UPDATE`, sem `WITH FUNCTION`, sem db link e só
  com funções nativas do Oracle (função do banco ou de pacote pode gravar em transação autônoma); roda tudo em
  `SET TRANSACTION READ ONLY` e termina com rollback; limita linhas, tamanho e tempo; erro sem senha nem endereço.
- O padrão é um usuário só de leitura. A skill `comecar` confere os privilégios e, se o usuário puder gravar, avisa e
  registra a decisão da empresa no `CLAUDE.md` dela.
- Dados pessoais ficam em `dados/`, fora do git, e a trava impede que subam por engano.

## Atualizar

`claude plugin marketplace update sankhya-analista` e `claude plugin update sankhya-analista@sankhya-analista`.

## Manter o plugin

- Testes sem banco: `npm run teste` (validação do SQL, dicionário e caminhos, Central de Ajuda, travas).
  Ajuda com a API de verdade: `node mcp/ajuda.mjs --teste-online`.
- Validar os manifestos: `claude plugin validate .`.
- Testar numa pasta de empresa sem instalar: `claude --plugin-dir <pasta-deste-repositorio>`.
- **Propostas de conhecimento** chegam das empresas como `propostas/AAAA-MM-DD-<tema>.md` (skill
  `propor-conhecimento`). Revise se não há dado de empresa, inclua em `conhecimento-geral/`, suba a versão em
  `.claude-plugin/plugin.json` e publique; as empresas recebem na atualização.
- Antes de publicar: `npm run teste` também passa o verificador de texto em `conhecimento-geral/`.
- Desenho e decisões: [docs/desenho.md](docs/desenho.md).

## Referências

Ideias aproveitadas, com código e texto próprios: mascarar segredo em mensagem de erro (lab019/sankhya-mcp, MIT);
bloquear os serviços web do Sankhya e o cofre de senhas pelo terminal (thiagoaataide/sankhya-mcp); achar a tabela
pelo nome da tela/instância e investigar a partir de um número (delt4d/SankhyaMCP). Biblioteca de consultas
verificadas (Snowflake Cortex Analyst, Vanna); caminho de junção calculado pelo grafo; defesas contra envenenamento
de memória compartilhada (proveniência, revisão humana, separação por confiança).

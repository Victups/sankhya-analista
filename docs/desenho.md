# Desenho do sankhya-analista (v0.1, nov/2026)

## Objetivo

Transformar o trabalho feito para uma empresa (consultas, diagnóstico, painéis e conhecimento do Sankhya) numa
ferramenta que qualquer empresa com Sankhya use: conecta o banco, gera o mapa do banco e o agente vai aprendendo,
sem misturar dados de uma empresa com outra.

## Decisões

1. **Claude Code + plugin + repositório por empresa.** O plugin é o analista (igual para todos); o repositório
   privado da empresa é a memória dela. Dados e conhecimento da empresa nunca saem do repositório dela.
2. **Só Node e Claude Code para instalar.** MCPs em Node; dependências instaladas pelo Claude Code ao instalar o
   plugin (`package.json` + `package-lock.json` na raiz). Sem Python e sem Docker.
3. **Um MCP de banco com `base: producao | teste`.** Um processo, uma lista de ferramentas; a base de teste é
   opcional e, vazia, herda endereço e senha da produção (caso de esquema de teste no mesmo banco).
4. **Configuração pelas opções do plugin (`userConfig`), com variável de ambiente como reserva.** Senha marcada como
   sigilosa (cofre do Claude Code). Uma conexão por máquina; várias empresas na mesma máquina ficam para depois.
5. **Usuário só de leitura por padrão.** `verificar_conexao` diz se o usuário pode gravar; se puder, a empresa decide
   e a decisão fica no `CLAUDE.md` dela. As travas do MCP valem nos dois casos.
6. **Grafo sem graphify.** A extração grava `dicionario/` (campos com "existe no banco", FKs, ligações do dicionário
   Sankhya e `MAPA.md` com o que mudou); as ferramentas `buscar_dicionario`, `descrever_tabela` e
   `caminho_entre_tabelas` respondem a partir desses arquivos. Visualização em HTML fica para quando alguém pedir.
7. **Regras centrais injetadas no início da sessão** (`conhecimento-geral/REGRAS.md`, hook SessionStart), só em pasta
   de empresa. O `CLAUDE.md` da empresa guarda apenas as decisões e exceções dela.
8. **MCP da ajuda leve** (API pública do Zendesk da Central de Ajuda). O fork completo, com comunidade e busca
   semântica, segue opcional e separado; as skills usam os dois quando houver.
9. **Busca por palavra bem feita antes de vetor.** O dicionário entende as abreviações do Sankhya (Cód., Nro., Vlr.,
   Dt.), sinônimos (centro de custo / resultado, TOP, cliente / parceiro, nota) e nomes de instância. O conhecimento
   (notas, `sql/` validados e geral) tem busca BM25 própria, sem dependência. Vetor (Oracle 23ai, pgvector) não: o
   banco é 19c, o plugin não grava no banco e embedding externo tiraria dados da empresa da máquina.
10. **Conhecimento compartilhado com defesa contra envenenamento.** Proposta verificada por máquina (dados da empresa,
    segredo, frase de ordem), revisão humana obrigatória, fato com situação e versão, e a regra de que nota e
    proposta são dados, nunca ordens.
11. **Só funções nativas do Oracle na consulta.** Função do esquema ou de pacote pode gravar em transação autônoma,
    que o `READ ONLY` não segura; db link também fica de fora. Validado sem falso positivo em 103 consultas reais.
12. **Oracle direto ou API Gateway.** Sem acesso ao Oracle (nuvem), o mesmo MCP vai pelo `DbExplorerSP.executeQuery`
    com OAuth; a trava de SQL vale igual, mas não há transação somente leitura, e a ferramenta avisa.
13. **Economia de tokens (a parte útil do "code mode").** O dado grande não passa pela conversa: agregação no banco,
    `exportar_sql` para `dados/` e `resumir_dados` sobre o arquivo (perfil, grupos, somas, filtros), sem rodar código
    escrito pelo modelo. Busca no conhecimento em vez de ler notas inteiras, filtro na descrição de tabela grande,
    teto de ~11 mil tokens por consulta e artigo da ajuda em partes. As ferramentas MCP já entram sob demanda.
14. **Outros agentes sem fork.** Cursor, Codex, Gemini CLI e Antigravity usam a mesma fonte: MCP stdio, skills em
    `.agents/skills/` e `AGENTS.md` são padrões que os quatro leem. `scripts/instalar.mjs` escreve o config de MCP de cada
    um (por máquina, no `.gitignore`), copia as skills com o prefixo `sankhya-`, gera o `AGENTS.md` com as regras e instala
    um `pre-commit` do git para dados e segredo. O `AGENTS.md` é o arquivo único de decisões da empresa (o `CLAUDE.md`
    do modelo só o importa). Sem o hook de `PreToolUse`, o usuário do banco só de leitura vira requisito. ChatGPT e Gemini
    no navegador ficam fora (MCP só remoto, banco atrás da VPN). Detalhes e limites em `docs/outros-agentes.md`.

## Peças

| Peça | Arquivo | Responsabilidade |
|---|---|---|
| MCP oracle | `mcp/oracle.mjs` | ler o banco, verificar privilégios e versão, extrair o dicionário, expor dicionário e conhecimento |
| Trava de SQL | `mcp/validar.mjs` | função pura: só SELECT/WITH, só funções nativas, sem db link |
| Dicionário | `mcp/dicionario.mjs` | funções puras: índice, busca (abreviações, sinônimos, instâncias), descrição, caminhos, mapa e diferenças |
| Conhecimento | `mcp/conhecimento.mjs` | busca BM25 em notas da empresa, consultas validadas e conhecimento geral |
| MCP ajuda | `mcp/ajuda.mjs` | buscar e ler artigos da Central de Ajuda |
| Travas | `hooks/travas.mjs` | regras na sessão; bloqueio de segredo, cofre, banco e serviços do Sankhya fora do MCP e commit de dados; verificador de texto |
| Skills | `skills/*/SKILL.md` | procedimentos: comecar, mapear-banco, investigar, consulta-sql, painel-html5, alterar-relatorio, registrar, propor-conhecimento |
| Conhecimento geral | `conhecimento-geral/` | o que vale para qualquer Sankhya |
| Instalador | `scripts/instalar.mjs` | config de MCP por cliente, skills, `AGENTS.md` e `pre-commit` para agentes que não são o Claude Code |
| Modelos | `templates/` | repositório da empresa e componente HTML5 |

## Fluxos

1. **Começar:** instalar o plugin no projeto, configurar a conexão, skill `comecar` (estrutura, `verificar_conexao`,
   decisão sobre escrita, `extrair_dicionario`, `CLAUDE.md`).
2. **Mapear:** `mapear-banco` depois de cada atualização do Sankhya; o `MAPA.md` mostra o que mudou e a skill acha as
   consultas afetadas.
3. **Trabalhar:** regras da sessão + skills; consultas validadas pelo MCP; exportações em `dados/`.
4. **Aprender:** `registrar` grava na nota da empresa; `propor-conhecimento` separa o que é do produto, sem dados, em
   `propostas/`; o mantenedor revisa, publica versão nova e todas as empresas recebem.

## Segurança

- Banco: só `SELECT`/`WITH` validados, transação somente leitura, rollback, limites; consultas da extração e da
  verificação são fixas no código. Comando de esquema (`ALTER SESSION SET CURRENT_SCHEMA`) só do próprio servidor,
  com nome validado.
- Hooks: bloqueiam leitura de segredo, clientes de banco fora do MCP, `git add --force` e commit de `dados/`,
  planilhas, CSV e `Result_*.json`. São rede de proteção para o agente; o `.gitignore` do modelo cobre o resto.
- Senha nunca em arquivo do projeto; dados pessoais não são repetidos nem registrados.

## Testes

- `npm run teste`: validação do SQL (inclusive as consultas fixas da extração), privilégios, opções, dicionário
  (busca, descrição, caminho, mapa e diferenças), conversão HTML da ajuda e travas.
- `node mcp/ajuda.mjs --teste-online`: API real da Central de Ajuda.
- Protocolo: cliente MCP sobe os servidores e chama as ferramentas do dicionário e da ajuda (feito com o dicionário
  real de uma empresa).
- `claude plugin validate`: manifestos.
- Banco de verdade (Oracle 19c, base de teste, nov/2026): `verificar_conexao` identificou o usuário dono das tabelas
  como "pode gravar"; `consultar_sql` leu e barrou um `DELETE`; `extrair_dicionario` gravou 47 mil campos, 7,9 mil
  colunas de FK e 10,9 mil campos de ligação em 18 s, e o `MAPA.md` listou as tabelas e campos que mudaram desde uma
  extração anterior.

## Fora da v0.1

- (feito) Várias empresas na mesma máquina e bases extras: `SANKHYA_CONEXAO` e `ORACLE_<BASE>_*`.
- Consultas gerais validadas dentro do plugin e um arquivo de definição de indicadores (camada semântica), que pode
  nascer do `COBERTURA.md`.
- (feito) Skill `personalizacao` (botões de ação, eventos, ações agendadas, regras, triggers, Java), escrita a partir da documentação
  pública do Sankhya.
- Visualização do grafo em HTML; busca por significado no conhecimento, se a busca por palavra não bastar.
- Ícone e licença, se o plugin for para catálogo público.

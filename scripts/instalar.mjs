// Instala o sankhya-analista numa pasta de empresa para agentes que nao sao o Claude Code (Cursor, Codex, Gemini CLI,
// Antigravity). Escreve o MCP no formato de cada um, copia as skills para .agents/skills/ (os quatro leem essa pasta),
// cria o AGENTS.md com as regras e instala o pre-commit do git contra dados e segredo.
// Uso:   node scripts/instalar.mjs --cliente cursor|codex|gemini|antigravity [--pasta <dir>] [--conexao ACME]
// Teste: node scripts/instalar.mjs --teste
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const barras = p => p.replaceAll('\\', '/');
const MARCAS_MD = ['<!-- sankhya-analista:inicio -->', '<!-- sankhya-analista:fim -->'];
const MARCAS_TOML = ['# sankhya-analista:inicio', '# sankhya-analista:fim'];

// Config de MCP por cliente: o arquivo fica so nesta maquina (caminho absoluto do plugin), por isso vai para o .gitignore.
const CLIENTES = {
  cursor: { arquivo: '.cursor/mcp.json' },
  codex: { arquivo: '.codex/config.toml' },
  gemini: { arquivo: '.gemini/settings.json' },
  antigravity: { arquivo: '.agents/mcp_config.json' },
};
const PROXIMOS = {
  cursor: 'Cursor: abra a pasta e, em Settings > MCP, ligue sankhya-oracle e sankhya-ajuda.',
  codex: 'Codex: marque a pasta como confiavel (.codex/config.toml de projeto so vale em pasta confiavel) e rode "codex mcp list".',
  gemini: 'Gemini CLI: confie na pasta (.gemini/settings.json de projeto so vale em pasta confiavel) e use /mcp para ver os servidores.',
  antigravity: 'Antigravity: abra a pasta como workspace e confira os servidores MCP nas configuracoes. Ferramenta MCP pede aprovacao: nao use o modo Turbo.',
};

// Nomes das variaveis que o MCP le (mcp/oracle.mjs: config e configApi). Com --conexao ACME: ORACLE_ACME_*, SANKHYA_ACME_*.
export function variaveis(conexao) {
  const o = conexao ? `ORACLE_${conexao}` : 'ORACLE';
  const s = conexao ? `SANKHYA_${conexao}` : 'SANKHYA';
  const conexaoBanco = pre => ['CONNECT_STRING', 'USER', 'PASSWORD', 'SCHEMA'].map(x => `${pre}_${x}`);
  const gateway = pre => ['CLIENT_ID', 'CLIENT_SECRET', 'X_TOKEN', 'API_URL'].map(x => `${pre}_${x}`);
  return [...conexaoBanco(o), ...conexaoBanco(`${o}_TESTE`), ...gateway(s), ...gateway(`${s}_TESTE`),
    'ORACLE_CALL_TIMEOUT_MS', 'ORACLE_CLIENT_LIB_DIR'];
}

// Trecho entre marcas: troca o que ja existe (rodar de novo atualiza) ou acrescenta no fim. Nada fora das marcas muda.
export function comBloco(existente, bloco, [abre, fecha]) {
  const base = existente ?? '';
  const texto = `${abre}\n${bloco.trim()}\n${fecha}`;
  const i = base.indexOf(abre);
  const j = base.indexOf(fecha);
  if (i >= 0 && j > i) return base.slice(0, i) + texto + base.slice(j + fecha.length);
  return `${base}${!base ? '' : base.endsWith('\n') ? '\n' : '\n\n'}${texto}\n`;
}

function envOracle(cliente, { pasta, conexao }) {
  // Cursor expande ${workspaceFolder}; os outros nao documentam interpolacao e recebem o caminho.
  const env = { SANKHYA_PROJETO: cliente === 'cursor' ? '${workspaceFolder}' : pasta };
  if (conexao) env.SANKHYA_CONEXAO = conexao;
  // Cursor (${env:X}) e Gemini ($X) repassam as variaveis; no Gemini o que vai declarado aqui escapa da redacao de
  // *PASSWORD*/*SECRET* do ambiente herdado. Antigravity: so o ambiente herdado (e, no Windows, o registro do usuario).
  const ref = { cursor: n => `\${env:${n}}`, gemini: n => `$${n}` }[cliente];
  if (ref) for (const n of variaveis(conexao)) env[n] = ref(n);
  return env;
}

// Devolve { arquivo, texto } do config de MCP; existente = conteudo atual do arquivo (ou null) para mesclar sem apagar nada.
export function mcpDoCliente(cliente, { raiz, pasta, conexao }, existente = null) {
  const { arquivo } = CLIENTES[cliente];
  if (cliente === 'codex') {
    const q = JSON.stringify; // string basica do TOML: mesmas aspas e barras escapadas do JSON
    const bloco = [
      '[mcp_servers.sankhya-oracle]',
      'command = "node"',
      `args = [${q(`${raiz}/mcp/oracle.mjs`)}]`,
      `env_vars = [${variaveis(conexao).map(q).join(', ')}]`,
      'startup_timeout_sec = 30',
      '[mcp_servers.sankhya-oracle.env]',
      `SANKHYA_PROJETO = ${q(pasta)}`,
      ...(conexao ? [`SANKHYA_CONEXAO = ${q(conexao)}`] : []),
      '[mcp_servers.sankhya-ajuda]',
      'command = "node"',
      `args = [${q(`${raiz}/mcp/ajuda.mjs`)}]`,
    ].join('\n');
    return { arquivo, texto: comBloco(existente, bloco, MARCAS_TOML) };
  }
  let dados = {};
  if (existente?.trim()) {
    try {
      dados = JSON.parse(existente);
    } catch {
      throw new Error(`${arquivo} existe mas nao e JSON valido: corrija ou apague o arquivo e rode de novo (nao mexi nele).`);
    }
  }
  const tipo = cliente === 'cursor' ? { type: 'stdio' } : {};
  dados.mcpServers = {
    ...dados.mcpServers,
    'sankhya-oracle': { ...tipo, command: 'node', args: [`${raiz}/mcp/oracle.mjs`], env: envOracle(cliente, { pasta, conexao }) },
    'sankhya-ajuda': { ...tipo, command: 'node', args: [`${raiz}/mcp/ajuda.mjs`] },
  };
  if (cliente === 'gemini') {
    // o Gemini CLI le GEMINI.md; para ele ler tambem o AGENTS.md, a lista de nomes de contexto precisa dos dois
    const atual = [dados.context?.fileName ?? []].flat();
    dados.context = { ...dados.context, fileName: [...new Set([...atual, 'AGENTS.md', 'GEMINI.md'])] };
  }
  return { arquivo, texto: `${JSON.stringify(dados, null, 2)}\n` };
}

// Nas copias: ${CLAUDE_PLUGIN_ROOT} vira o caminho do plugin e o nome ganha o prefixo sankhya- (sem plugin nao ha
// espaco de nomes, e "comecar" ou "registrar" sozinhos colidiriam com skills de outras origens; o Cursor exige nome = pasta).
export function adaptarSkill(texto, raiz, nome) {
  return texto.replaceAll('${CLAUDE_PLUGIN_ROOT}', raiz).replace(/^name:.*$/m, `name: sankhya-${nome}`);
}

function copiarSkills(raiz, pasta) {
  const origem = join(raiz, 'skills');
  const nomes = readdirSync(origem).filter(n => existsSync(join(origem, n, 'SKILL.md')));
  for (const n of nomes) {
    const destino = join(pasta, '.agents', 'skills', `sankhya-${n}`);
    rmSync(destino, { recursive: true, force: true }); // atualizar = trocar a pasta inteira
    cpSync(join(origem, n), destino, { recursive: true });
    const f = join(destino, 'SKILL.md');
    writeFileSync(f, adaptarSkill(readFileSync(f, 'utf8'), barras(raiz), n));
  }
  return nomes;
}

const NOTA_REGRAS = '## Regras gerais do analista\n\n'
  + 'Bloco gerado por `scripts/instalar.mjs` do plugin sankhya-analista: não edite aqui (rode o instalador de novo para '
  + 'atualizar). As decisões desta empresa, acima, prevalecem. Neste agente as skills ficam em `.agents/skills/` com o '
  + 'prefixo `sankhya-` (ex.: `sankhya-comecar`).\n\n';

function escreverAgents(pasta, raiz, claudeSozinho) {
  const f = join(pasta, 'AGENTS.md');
  let base = existsSync(f) ? readFileSync(f, 'utf8') : '';
  if (!base && claudeSozinho) {
    base = '# Sankhya\n\nAs decisões e exceções desta empresa estão no `CLAUDE.md`: leia-o no início de cada sessão. '
      + 'Elas prevalecem sobre as regras gerais abaixo.\n';
  }
  const regras = readFileSync(join(raiz, 'conhecimento-geral', 'REGRAS.md'), 'utf8').replaceAll('${CLAUDE_PLUGIN_ROOT}', barras(raiz));
  writeFileSync(f, comBloco(base, NOTA_REGRAS + regras, MARCAS_MD));
}

function garantirLinhas(arquivo, linhas) {
  const atual = existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : '';
  const tem = new Set(atual.split(/\r?\n/).map(l => l.trim()));
  const faltam = linhas.filter(l => !tem.has(l));
  if (!faltam.length) return [];
  writeFileSync(arquivo, `${atual}${!atual || atual.endsWith('\n') ? '' : '\n'}${atual ? '\n' : ''}# sankhya-analista\n${faltam.join('\n')}\n`);
  return faltam;
}

function instalarPreCommit(pasta, raiz) {
  let hooks;
  try {
    hooks = resolve(pasta, execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { cwd: pasta, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  } catch {
    return 'pasta fora de um repositorio git: pre-commit nao instalado (git init e rode o instalador de novo)';
  }
  const f = join(hooks, 'pre-commit');
  if (existsSync(f) && !readFileSync(f, 'utf8').includes('sankhya-analista')) {
    return `ja existe um pre-commit seu (${f}): nao mexi. Para barrar dados e segredo, acrescente a ele: node "${raiz}/hooks/travas.mjs" commit || exit 1`;
  }
  mkdirSync(hooks, { recursive: true });
  writeFileSync(f, `#!/bin/sh\n# sankhya-analista: barra dados e segredo no commit, seja qual for o agente\n`
    + `command -v node >/dev/null 2>&1 || exit 0\nnode "${raiz}/hooks/travas.mjs" commit || exit 1\n`);
  chmodSync(f, 0o755);
  return 'pre-commit instalado (barra dados/, planilhas, CSV, Result_*.json e segredo)';
}

export function instalar({ cliente, pasta, conexao, raiz = RAIZ }) {
  if (!CLIENTES[cliente]) throw new Error(`Cliente invalido: ${cliente}. Use ${Object.keys(CLIENTES).join(', ')}.`);
  if (conexao && !/^[A-Za-z][A-Za-z0-9_]*$/.test(conexao)) throw new Error(`Nome de conexao invalido: ${conexao}`);
  const ctx = { raiz: barras(resolve(raiz)), pasta: barras(resolve(pasta)), conexao: conexao?.toUpperCase() };
  const relato = [];

  // modelo da empresa: so o que ainda nao existe. Empresa que ja tem so CLAUDE.md fica com ele (AGENTS.md aponta para ele).
  const claudeSozinho = existsSync(join(pasta, 'CLAUDE.md')) && !existsSync(join(pasta, 'AGENTS.md'));
  mkdirSync(pasta, { recursive: true });
  cpSync(join(raiz, 'templates', 'empresa'), pasta, {
    recursive: true, force: false, errorOnExist: false,
    filter: src => !(claudeSozinho && basename(src) === 'AGENTS.md'),
  });
  mkdirSync(join(pasta, 'dados'), { recursive: true });
  escreverAgents(pasta, raiz, claudeSozinho);
  relato.push(`AGENTS.md: regras do analista no fim do arquivo${claudeSozinho ? ' (decisoes da empresa seguem no CLAUDE.md)' : ''}`);

  const mcpFile = join(pasta, ...CLIENTES[cliente].arquivo.split('/'));
  const { texto } = mcpDoCliente(cliente, ctx, existsSync(mcpFile) ? readFileSync(mcpFile, 'utf8') : null);
  mkdirSync(dirname(mcpFile), { recursive: true });
  writeFileSync(mcpFile, texto);
  relato.push(`${CLIENTES[cliente].arquivo}: MCP sankhya-oracle e sankhya-ajuda (so nesta maquina; sem senha)`);

  relato.push(`.agents/skills/: ${copiarSkills(raiz, pasta).length} skills (sankhya-<nome>)`);

  const ignorar = garantirLinhas(join(pasta, '.gitignore'),
    ['dados/', 'Result_*.json', '.env', '.env.*', '!.env.example', CLIENTES[cliente].arquivo]);
  if (ignorar.length) relato.push(`.gitignore: acrescentei ${ignorar.join(', ')}`);

  relato.push(instalarPreCommit(pasta, ctx.raiz));
  if (!existsSync(join(raiz, 'node_modules'))) relato.push(`ATENCAO: rode "npm ci" em ${ctx.raiz} (o MCP precisa das dependencias)`);
  return relato;
}

function uso() {
  console.log('Uso: node scripts/instalar.mjs --cliente cursor|codex|gemini|antigravity [--pasta <dir>] [--conexao ACME]\n'
    + 'Rode na pasta (ou informe --pasta) do repositorio da empresa.');
}

async function testes() {
  const ctx = { raiz: 'C:/plug/sankhya-analista', pasta: 'C:/emp/acme', conexao: undefined };
  const json = (c, ctx2 = ctx, antes = null) => JSON.parse(mcpDoCliente(c, ctx2, antes).texto);

  // Cursor: expande ${workspaceFolder} e ${env:X}; nenhum valor de segredo no arquivo
  const cu = json('cursor').mcpServers;
  assert.equal(cu['sankhya-oracle'].env.SANKHYA_PROJETO, '${workspaceFolder}');
  assert.equal(cu['sankhya-oracle'].env.ORACLE_PASSWORD, '${env:ORACLE_PASSWORD}');
  assert.equal(cu['sankhya-oracle'].args[0], 'C:/plug/sankhya-analista/mcp/oracle.mjs');
  assert.equal(cu['sankhya-ajuda'].env, undefined);
  // Gemini: $VAR declarado no env e AGENTS.md na lista de contexto, sem apagar o que ja havia
  const antes = JSON.stringify({ theme: 'x', context: { fileName: 'CONTEXT.md' }, mcpServers: { outro: { command: 'y' } } });
  const ge = json('gemini', ctx, antes);
  assert.equal(ge.theme, 'x');
  assert.ok(ge.mcpServers.outro && ge.mcpServers['sankhya-oracle']);
  assert.equal(ge.mcpServers['sankhya-oracle'].env.ORACLE_PASSWORD, '$ORACLE_PASSWORD');
  assert.deepEqual(ge.context.fileName, ['CONTEXT.md', 'AGENTS.md', 'GEMINI.md']);
  assert.deepEqual(json('gemini', ctx, JSON.stringify(ge)), ge); // rodar de novo nao muda nada
  // Antigravity: sem interpolacao documentada, caminho literal e nenhuma referencia a variavel
  const ag = JSON.stringify(json('antigravity'));
  assert.ok(ag.includes('"SANKHYA_PROJETO":"C:/emp/acme"') && !ag.includes('${') && !ag.includes('ORACLE_PASSWORD'));
  // Codex: bloco TOML entre marcas, idempotente e sem mexer no resto do arquivo
  const t1 = mcpDoCliente('codex', ctx, 'model = "x"\n').texto;
  assert.ok(t1.startsWith('model = "x"\n'));
  assert.match(t1, /\[mcp_servers\.sankhya-oracle\]\ncommand = "node"\nargs = \["C:\/plug\/sankhya-analista\/mcp\/oracle\.mjs"\]\nenv_vars = \["ORACLE_CONNECT_STRING"/);
  assert.match(t1, /\[mcp_servers\.sankhya-oracle\.env\]\nSANKHYA_PROJETO = "C:\/emp\/acme"/);
  assert.equal(mcpDoCliente('codex', ctx, t1).texto, t1);
  assert.equal(mcpDoCliente('codex', ctx, t1.replace('startup_timeout_sec = 30', 'startup_timeout_sec = 5')).texto, t1);
  // conexao com nome muda os nomes das variaveis e grava SANKHYA_CONEXAO
  const ac = json('cursor', { ...ctx, conexao: 'ACME' }).mcpServers['sankhya-oracle'].env;
  assert.equal(ac.SANKHYA_CONEXAO, 'ACME');
  assert.equal(ac.ORACLE_ACME_PASSWORD, '${env:ORACLE_ACME_PASSWORD}');
  assert.equal(ac.ORACLE_PASSWORD, undefined);
  // arquivo existente invalido nao e sobrescrito
  assert.throws(() => mcpDoCliente('cursor', ctx, '{ quebrado'), /nao e JSON valido/);
  assert.equal(comBloco('a\n', 'x', ['<', '>']), 'a\n\n<\nx\n>\n');
  assert.equal(comBloco(comBloco('a\n', 'x', ['<', '>']), 'y', ['<', '>']), 'a\n\n<\ny\n>\n');

  const git = (pasta, ...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a],
    { cwd: pasta, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const tmp = mkdtempSync(join(tmpdir(), 'snk-instalar-'));
  try {
    // 1) pasta nova, Antigravity: instala tudo, e o MCP gerado sobe de verdade
    const nova = join(tmp, 'nova');
    mkdirSync(nova);
    git(nova, 'init', '-q');
    instalar({ cliente: 'antigravity', pasta: nova });
    const lido = f => readFileSync(join(nova, f), 'utf8');
    const agentsDepois = lido('AGENTS.md');
    assert.match(agentsDepois, /Pessoas e áreas/); // parte da empresa (modelo)
    assert.match(agentsDepois, /Nunca gravar no banco/); // regras gerais
    assert.equal(lido('CLAUDE.md').trim(), '@AGENTS.md');
    assert.match(lido('.gitignore'), /\.agents\/mcp_config\.json/);
    assert.ok(existsSync(join(nova, 'dados')) && existsSync(join(nova, 'conhecimento', 'README.md')));
    for (const n of readdirSync(join(RAIZ, 'skills'))) {
      const s = lido(`.agents/skills/sankhya-${n}/SKILL.md`);
      const cab = s.match(/^---\r?\nname: (.+?)\r?\ndescription: (.+?)\r?\n/);
      assert.ok(cab, `${n}: cabecalho name/description em uma linha cada`);
      assert.equal(cab[1], `sankhya-${n}`);
      assert.ok(cab[2].length <= 1024, `${n}: description longa demais`);
      assert.ok(!s.includes('${CLAUDE_PLUGIN_ROOT}'), `${n}: sobrou \${CLAUDE_PLUGIN_ROOT}`);
    }
    instalar({ cliente: 'antigravity', pasta: nova }); // de novo: nada duplica
    assert.equal(lido('AGENTS.md'), agentsDepois);
    assert.equal(lido('.gitignore').split('\n').filter(l => l === 'dados/').length, 1);

    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
    const gerado = JSON.parse(lido('.agents/mcp_config.json')).mcpServers['sankhya-oracle'];
    const cliente = new Client({ name: 'teste-instalar', version: '1' });
    await cliente.connect(new StdioClientTransport({ command: process.execPath, args: gerado.args, env: { ...process.env, ...gerado.env }, stderr: 'ignore' }));
    assert.ok((await cliente.listTools()).tools.some(t => t.name === 'consultar_sql'));
    await cliente.close();

    // 2) pre-commit: dado e segredo barrados; apagar do indice nao e barrado; commit normal passa
    mkdirSync(join(nova, 'dados'), { recursive: true });
    writeFileSync(join(nova, 'dados', 'x.csv'), 'A\n1\n');
    git(nova, 'add', '-f', 'dados/x.csv');
    assert.throws(() => git(nova, 'commit', '-m', 'x'), /dados ou segredo/);
    git(nova, 'rm', '--cached', '-q', 'dados/x.csv');
    writeFileSync(join(nova, 'a.sql'), 'SELECT 1 FROM DUAL\n');
    git(nova, 'add', 'a.sql');
    git(nova, 'commit', '-q', '-m', 'ok');
    writeFileSync(join(nova, 'dados', 'y.csv'), 'A\n1\n');
    git(nova, 'add', '-f', 'dados/y.csv');
    git(nova, 'commit', '-q', '--no-verify', '-m', 'y');
    git(nova, 'rm', '--cached', '-q', 'dados/y.csv');
    git(nova, 'commit', '-q', '-m', 'tira dados do git'); // so remove: o pre-commit deixa passar

    // 3) empresa que so tem CLAUDE.md (Cursor): CLAUDE.md intacto, AGENTS.md aponta para ele, sem espaco reservado do modelo
    const velha = join(tmp, 'velha');
    mkdirSync(velha);
    writeFileSync(join(velha, 'CLAUDE.md'), '# Acme\n\nDecisao: so leitura.\n');
    writeFileSync(join(velha, '.gitignore'), 'node_modules/\n');
    instalar({ cliente: 'cursor', pasta: velha });
    assert.equal(readFileSync(join(velha, 'CLAUDE.md'), 'utf8'), '# Acme\n\nDecisao: so leitura.\n');
    const ag2 = readFileSync(join(velha, 'AGENTS.md'), 'utf8');
    assert.match(ag2, /estão no `CLAUDE\.md`/);
    assert.ok(!ag2.includes('<EMPRESA>'));
    assert.match(readFileSync(join(velha, '.gitignore'), 'utf8'), /^node_modules\/\n\n# sankhya-analista\n.*dados\/[\s\S]*\.cursor\/mcp\.json/);
    assert.equal(JSON.parse(readFileSync(join(velha, '.cursor', 'mcp.json'), 'utf8')).mcpServers['sankhya-oracle'].type, 'stdio');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log('instalar: todos os testes passaram');
}

const arg = n => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
if (process.argv[1]?.endsWith('instalar.mjs')) {
  if (process.argv.includes('--teste')) await testes();
  else if (!arg('--cliente')) uso();
  else {
    const cliente = arg('--cliente');
    const pasta = resolve(arg('--pasta') ?? process.cwd());
    try {
      for (const l of instalar({ cliente, pasta, conexao: arg('--conexao') })) console.log(`- ${l}`);
    } catch (e) {
      console.error(`ERRO: ${e.message}`);
      process.exit(1);
    }
    const conexao = arg('--conexao')?.toUpperCase();
    console.log(`\nFalta, so nesta maquina:\n- Variaveis de ambiente do banco (senha nunca em arquivo): ${variaveis(conexao).slice(0, 4).join(', ')}`
      + ' (README do plugin: como definir sem a senha aparecer).\n- Reiniciar o agente.\n- ' + PROXIMOS[cliente]
      + '\n- Pedir ao agente: "use a skill sankhya-comecar".\n\nFora do Claude Code nao ha o hook que barra leitura de segredo e sqlplus: use um usuario do banco so de leitura.');
  }
}

// Cliente do API Gateway do Sankhya: OAuth (client credentials + X-Token) e DbExplorerSP.executeQuery.
// Para quem nao tem acesso direto ao Oracle (Sankhya na nuvem). Sem transacao somente leitura: quem protege e o
// validarSql, chamado antes. Teste: node mcp/gateway.mjs --teste (servidor falso local, sem rede)
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

export const URL_PADRAO = 'https://api.sankhya.com.br';
const tokens = new Map(); // url|client_id -> { token, expira }
const espera = ms => new Promise(r => setTimeout(r, ms));

async function obterToken(cfg, renovar = false) {
  const chave = `${cfg.url}|${cfg.clientId}`;
  const atual = tokens.get(chave);
  if (!renovar && atual && Date.now() < atual.expira) return atual.token;
  const r = await chamar(`${cfg.url}/authenticate`, {
    method: 'POST',
    headers: { 'X-Token': cfg.xToken, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cfg.clientId, client_secret: cfg.clientSecret }),
  }, cfg.timeoutMs);
  if (!r.ok) throw new Error(`Gateway recusou a autenticacao (HTTP ${r.status}).`);
  const { access_token: token, expires_in: validade } = await r.json();
  if (!token) throw new Error('Gateway autenticou sem devolver access_token.');
  // renova um minuto antes de vencer
  tokens.set(chave, { token, expira: Date.now() + Math.max(Number(validade) || 300, 120) * 1000 - 60_000 });
  return token;
}

// fetch com nova tentativa em 429 e 5xx (espera crescente) e em erro de rede.
async function chamar(url, opcoes, timeoutMs = 120_000) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const r = await fetch(url, { ...opcoes, signal: AbortSignal.timeout(timeoutMs) });
      if ((r.status === 429 || r.status >= 500) && tentativa < 3) {
        await espera(500 * 2 ** tentativa + Math.random() * 250);
        continue;
      }
      return r;
    } catch (e) {
      if (tentativa >= 3) throw new Error(`Sem resposta do gateway do Sankhya: ${e.message}`);
      await espera(1000);
    }
  }
}

// O DbExplorer devolve texto: "1.234,56" vira numero e "31/12/2026 08:00:00" vira "2026-12-31 08:00:00".
export function converter(v) {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (/^-?\d{1,3}(\.\d{3})*,\d+$|^-?\d+,\d+$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'));
  const d = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}:\d{2}:\d{2}))?$/);
  if (d) return `${d[3]}-${d[2]}-${d[1]}${d[4] && d[4] !== '00:00:00' ? ` ${d[4]}` : ''}`;
  return v;
}

// Executa um SQL (ja validado) e devolve { colunas, linhas } com as linhas em listas.
export async function executarSql(cfg, sql) {
  const url = `${cfg.url}/gateway/v1/mge/service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json`;
  const corpo = JSON.stringify({ serviceName: 'DbExplorerSP.executeQuery', requestBody: { sql } });
  let r;
  for (const renovar of [false, true]) {
    const token = await obterToken(cfg, renovar);
    r = await chamar(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: corpo }, cfg.timeoutMs);
    if (r.status !== 401 && r.status !== 403) break; // token vencido ou revogado: renova uma vez
  }
  if (!r.ok) throw new Error(`Gateway do Sankhya respondeu HTTP ${r.status}.`);
  const dados = await r.json();
  if (String(dados.status) !== '1') throw new Error(`Sankhya recusou a consulta: ${dados.statusMessage ?? 'sem mensagem'}`);
  const corpoResp = dados.responseBody ?? {};
  const colunas = (corpoResp.fieldsMetadata ?? corpoResp.fields ?? []).map(f => String(f?.name ?? f).toUpperCase());
  const linhas = (corpoResp.rows ?? []).map(l => l.map(converter));
  return { colunas, linhas };
}

export async function testes() {
  assert.equal(converter('1.234,56'), 1234.56);
  assert.equal(converter('-10,5'), -10.5);
  assert.equal(converter('31/12/2026 08:00:00'), '2026-12-31 08:00:00');
  assert.equal(converter('05/01/2026 00:00:00'), '2026-01-05');
  assert.equal(converter('TGFCAB'), 'TGFCAB');
  assert.equal(converter(42), 42);

  // gateway falso: o primeiro token "vence" na segunda consulta (401) e o servidor deve renovar
  const pedidos = [];
  let tokensEmitidos = 0;
  const servidor = createServer((req, res) => {
    let corpo = '';
    req.on('data', c => { corpo += c; });
    req.on('end', () => {
      pedidos.push({ url: req.url, auth: req.headers.authorization, xToken: req.headers['x-token'], corpo });
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/authenticate') {
        tokensEmitidos++;
        return res.end(JSON.stringify({ access_token: `tk${tokensEmitidos}`, expires_in: 3600 }));
      }
      const sql = JSON.parse(corpo).requestBody.sql;
      if (req.headers.authorization === 'Bearer tk1' && pedidos.filter(p => p.url !== '/authenticate').length > 1) {
        res.statusCode = 401;
        return res.end('{}');
      }
      if (sql.includes('ERRO')) return res.end(JSON.stringify({ status: '0', statusMessage: 'ORA-00942: tabela ou view nao existe' }));
      return res.end(JSON.stringify({ status: '1', responseBody: { fieldsMetadata: [{ name: 'codemp' }, { name: 'VALOR' }, { name: 'DTNEG' }], rows: [[1, '1.500,25', '02/03/2026 00:00:00']] } }));
    });
  });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const cfg = { url: `http://127.0.0.1:${servidor.address().port}`, clientId: 'id', clientSecret: 'segredo', xToken: 'xt', timeoutMs: 5000 };
  try {
    assert.deepEqual(await executarSql(cfg, 'SELECT 1 FROM DUAL'), { colunas: ['CODEMP', 'VALOR', 'DTNEG'], linhas: [[1, 1500.25, '2026-03-02']] });
    assert.equal(pedidos[0].url, '/authenticate');
    assert.equal(pedidos[0].xToken, 'xt');
    assert.match(pedidos[0].corpo, /grant_type=client_credentials&client_id=id&client_secret=segredo/);
    assert.match(pedidos[1].url, /^\/gateway\/v1\/mge\/service\.sbr\?serviceName=DbExplorerSP\.executeQuery&outputType=json$/);
    await executarSql(cfg, 'SELECT 2 FROM DUAL'); // 401 com tk1 -> renova -> tk2
    assert.equal(tokensEmitidos, 2);
    assert.equal(pedidos.at(-1).auth, 'Bearer tk2');
    await assert.rejects(executarSql(cfg, 'SELECT ERRO FROM DUAL'), /ORA-00942/);
  } finally {
    servidor.close();
  }
  console.log('gateway: todos os testes passaram');
}

if (process.argv[1]?.endsWith('gateway.mjs') && process.argv.includes('--teste')) await testes();

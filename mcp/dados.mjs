// Analise local de arquivos de dados/ (CSV do exportar_sql ou do Sankhya, JSON de resultado): o dado grande fica
// fora da conversa e so o resumo volta (a parte util do "code mode", sem rodar codigo escrito pelo modelo).
// Funcoes puras sobre { colunas, linhas }. Teste: node mcp/dados.mjs --teste
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { converter } from './gateway.mjs';

const MAX_LINHAS_SAIDA = 50;
// coluna com mais valores distintos que isto (nome, documento) nao tem valores mostrados no perfil
const MAX_CATEGORIAS = 20;

function lerCsv(texto) {
  const t = texto.replace(/^﻿/, '').replace(/^sep=.\r?\n/, '');
  const sep = (t.split('\n')[0].match(/;/g) ?? []).length >= (t.split('\n')[0].match(/,/g) ?? []).length ? ';' : ',';
  const linhas = [];
  let linha = [], campo = '', aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const [colunas, ...resto] = linhas.filter(l => l.some(v => v !== ''));
  return { colunas, linhas: resto.map(l => l.map(v => (v === '' ? null : valor(v)))) };
}

// "1234.5" e "1.234,50" viram numero; data brasileira vira ISO; o resto fica texto.
const valor = v => (/^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : converter(v));

export function lerTabela(caminho) {
  const texto = readFileSync(caminho, 'utf8');
  if (!/\.json$/i.test(caminho)) return lerCsv(texto);
  const j = JSON.parse(texto);
  if (Array.isArray(j)) {
    const colunas = [...new Set(j.flatMap(o => Object.keys(o)))];
    return { colunas, linhas: j.map(o => colunas.map(c => o[c] ?? null)) };
  }
  return { colunas: j.colunas, linhas: j.linhas }; // formato do consultar_sql
}

const fmt = v => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : v ?? '');
const tabelaTexto = (cab, linhas) => [cab.join('\t'), ...linhas.map(l => l.map(fmt).join('\t'))].join('\n');

export function perfil({ colunas, linhas }) {
  const saida = [`${linhas.length} linhas, ${colunas.length} colunas`];
  colunas.forEach((c, i) => {
    const vs = linhas.map(l => l[i]).filter(v => v != null);
    const nums = vs.filter(v => typeof v === 'number');
    const distintos = new Set(vs.map(String));
    let desc = `${c}: ${linhas.length - vs.length} vazios, ${distintos.size} distintos`;
    if (nums.length === vs.length && nums.length) {
      const soma = nums.reduce((a, b) => a + b, 0);
      desc += `, numero: min ${fmt(Math.min(...nums))}, max ${fmt(Math.max(...nums))}, soma ${fmt(soma)}`;
    } else if (vs.length && vs.every(v => /^\d{4}-\d{2}-\d{2}/.test(v))) {
      const ord = [...vs].sort();
      desc += `, data: ${ord[0]} a ${ord.at(-1)}`;
    } else if (distintos.size <= MAX_CATEGORIAS) {
      const cont = new Map();
      for (const v of vs) cont.set(String(v), (cont.get(String(v)) ?? 0) + 1);
      desc += `, valores: ${[...cont].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([v, n]) => `${v} (${n})`).join(', ')}`;
    } else desc += ', texto (valores nao mostrados)';
    saida.push(`- ${desc}`);
  });
  return saida.join('\n');
}

// filtro: "COL=valor", "COL!=valor", "COL>=10", "COL<2026-01-01", "COL~parte do texto"
function aplicarFiltro(tab, filtro) {
  const m = filtro.match(/^\s*([\w$#]+)\s*(!=|>=|<=|=|>|<|~)\s*(.*)$/);
  if (!m) throw new Error(`Filtro invalido: ${filtro}. Use COL=valor, COL>=10, COL~texto.`);
  const [, col, op, alvoTxt] = m;
  const i = tab.colunas.findIndex(c => c.toUpperCase() === col.toUpperCase());
  if (i < 0) throw new Error(`Coluna ${col} nao existe. Colunas: ${tab.colunas.join(', ')}`);
  const alvo = valor(alvoTxt);
  const cmp = (a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)));
  const testa = {
    '=': v => String(v) === String(alvo), '!=': v => String(v) !== String(alvo), '~': v => String(v ?? '').toUpperCase().includes(String(alvoTxt).toUpperCase()),
    '>': v => v != null && cmp(v, alvo) > 0, '>=': v => v != null && cmp(v, alvo) >= 0,
    '<': v => v != null && cmp(v, alvo) < 0, '<=': v => v != null && cmp(v, alvo) <= 0,
  }[op];
  return { colunas: tab.colunas, linhas: tab.linhas.filter(l => testa(l[i])) };
}

export function resumir(tab, { agrupar = [], somar = [], filtros = [], ordenar, top = MAX_LINHAS_SAIDA } = {}) {
  let t = tab;
  for (const f of filtros) t = aplicarFiltro(t, f);
  const idx = c => {
    const i = t.colunas.findIndex(x => x.toUpperCase() === c.toUpperCase());
    if (i < 0) throw new Error(`Coluna ${c} nao existe. Colunas: ${t.colunas.join(', ')}`);
    return i;
  };
  if (!agrupar.length && !somar.length) return perfil(t);
  const ig = agrupar.map(idx), is = somar.map(idx);
  const grupos = new Map();
  for (const l of t.linhas) {
    const chave = JSON.stringify(ig.map(i => l[i]));
    const g = grupos.get(chave) ?? { chave: ig.map(i => l[i]), qtd: 0, somas: is.map(() => 0) };
    g.qtd++;
    is.forEach((i, k) => { if (typeof l[i] === 'number') g.somas[k] += l[i]; });
    grupos.set(chave, g);
  }
  const cab = [...agrupar, 'QTD', ...somar.map(s => `SOMA_${s}`)];
  let linhas = [...grupos.values()].map(g => [...g.chave, g.qtd, ...g.somas]);
  const io = ordenar ? cab.findIndex(c => c.toUpperCase() === ordenar.replace(/^-/, '').toUpperCase()) : cab.length - 1;
  if (io >= 0) {
    const desc = !ordenar || ordenar.startsWith('-');
    linhas.sort((a, b) => (typeof a[io] === 'number' && typeof b[io] === 'number' ? a[io] - b[io] : String(a[io]).localeCompare(String(b[io]))) * (desc ? -1 : 1));
  }
  const total = ['TOTAL', ...agrupar.slice(1).map(() => ''), t.linhas.length, ...is.map((_, k) => linhas.reduce((s, l) => s + l[agrupar.length + 1 + k], 0))];
  const n = Math.min(top, MAX_LINHAS_SAIDA);
  const corte = linhas.length > n ? `\n(+${linhas.length - n} grupos; use filtros ou top)` : '';
  return `${t.linhas.length} linhas${filtros.length ? ` apos filtros` : ''}, ${grupos.size} grupos\n${tabelaTexto(cab, [...linhas.slice(0, n), ...(agrupar.length ? [total] : [])])}${corte}`;
}

export function testes() {
  const csv = '﻿CODEMP;MES;NOME;VALOR\r\n1;2026-01-01;"Silva; Ana";1500.5\r\n1;2026-02-01;Souza;200\r\n2;2026-01-01;Lima;"1.000,00"\r\n2;2026-01-01;;\r\n';
  const tab = lerCsv(csv);
  assert.deepEqual(tab.colunas, ['CODEMP', 'MES', 'NOME', 'VALOR']);
  assert.deepEqual(tab.linhas[0], [1, '2026-01-01', 'Silva; Ana', 1500.5]); // ; dentro de aspas
  assert.equal(tab.linhas[2][3], 1000); // numero no formato brasileiro
  const p = perfil(tab);
  assert.match(p, /4 linhas, 4 colunas/);
  assert.match(p, /VALOR: 1 vazios, 3 distintos, numero: min 200, max 1500\.50, soma 2700\.50/);
  assert.match(p, /MES: 0 vazios, 2 distintos, data: 2026-01-01 a 2026-02-01/);
  assert.match(p, /CODEMP: .*numero/);
  const r = resumir(tab, { agrupar: ['CODEMP'], somar: ['VALOR'] });
  assert.match(r, /2 grupos\nCODEMP\tQTD\tSOMA_VALOR\n1\t2\t1700\.50\n2\t2\t1000\nTOTAL\t4\t2700\.50/);
  assert.match(resumir(tab, { filtros: ['MES>=2026-02-01'], agrupar: ['MES'] }), /1 linhas apos filtros/);
  assert.match(resumir(tab, { filtros: ['NOME~sil'], agrupar: ['CODEMP'] }), /1 linhas apos filtros/);
  assert.throws(() => resumir(tab, { agrupar: ['XPTO'] }), /Coluna XPTO nao existe/);
  // nome com muitos valores distintos nao aparece no perfil
  const muitos = { colunas: ['NOME'], linhas: Array.from({ length: 30 }, (_, i) => [`Pessoa ${i}`]) };
  assert.match(perfil(muitos), /texto \(valores nao mostrados\)/);
  console.log('dados: todos os testes passaram');
}

if (process.argv[1]?.endsWith('dados.mjs') && process.argv.includes('--teste')) testes();

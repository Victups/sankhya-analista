// Busca por relevancia (BM25) no conhecimento: notas da empresa (conhecimento/), consultas validadas (sql/) e
// conhecimento geral do plugin. O da empresa pesa mais. Sem dependencias. Teste: node mcp/conhecimento.mjs --teste
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PALAVRAS_VAZIAS, SINONIMOS, termos } from './dicionario.mjs';

const PESO = { empresa: 1.5, sql: 1.3, geral: 1 };
const GENERICOS = new Set(['CONHECIMENTO', 'GERAL', 'SQL', 'MD', 'README']);
// plural simples: CUSTOS -> CUSTO, LANCAMENTOS -> LANCAMENTO, INSTRUCOES -> INSTRUCAO
const radical = p => (p.length > 4 ? p.replace(/OES$/, 'AO').replace(/S$/, '') : p);
const tokens = s => termos(s).filter(p => !PALAVRAS_VAZIAS.has(p)).map(radical);

function arquivos(pasta, ext) {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta).flatMap(f => {
    const p = join(pasta, f);
    return statSync(p).isDirectory() ? arquivos(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

// Nota markdown em trechos: cada item de lista (com as linhas de continuacao) ou paragrafo, com a secao.
export function trechosDeNota(texto) {
  const trechos = [];
  let secao = '', atual = null;
  const fechar = () => { if (atual?.texto.trim()) trechos.push(atual); atual = null; };
  texto.split('\n').forEach((linha, i) => {
    if (/^#{1,6}\s/.test(linha)) { fechar(); secao = linha.replace(/^#+\s*/, ''); return; }
    if (!linha.trim()) { fechar(); return; }
    if (/^\s*([-*]|\d+\.)\s/.test(linha) && !/^\s{2,}/.test(linha)) fechar();
    if (!atual) atual = { linha: i + 1, secao, texto: '' };
    atual.texto += `${linha.trim()} `;
  });
  fechar();
  return trechos;
}

// Arquivo .sql de painel com varias consultas numeradas ("-- 1) TITULO" logo depois de uma linha de tracos): uma
// consulta por trecho, com a linha e o titulo, para a busca achar a certa. Sem numeracao (ou com uma so), o arquivo
// e um trecho so. Comentario numerado solto dentro do codigo nao parte nada: precisa da linha de tracos antes.
const TRACOS = /^--\s*[-=]{10,}\s*$/;
const TITULO = /^--\s*(\d+[.)])\s+(\S.*)$/;
export function consultasDoArquivo(texto) {
  const linhas = texto.split('\n');
  const inicios = [];
  linhas.forEach((l, i) => { if (i > 0 && TITULO.test(l.trim()) && TRACOS.test(linhas[i - 1].trim())) inicios.push(i - 1); });
  if (inicios.length < 2) return [{ linha: 1, secao: '', texto }];
  const trechos = [];
  const cabecalho = linhas.slice(0, inicios[0]).join('\n');
  if (cabecalho.trim()) trechos.push({ linha: 1, secao: '', texto: cabecalho });
  inicios.forEach((ini, k) => {
    const [, numero, titulo] = linhas[ini + 1].trim().match(TITULO);
    trechos.push({ linha: ini + 1, secao: `${numero} ${titulo}`.slice(0, 120), texto: linhas.slice(ini, inicios[k + 1] ?? linhas.length).join('\n') });
  });
  return trechos;
}

export function montarCorpus(projeto, pastaGeral) {
  const corpus = [];
  const add = (origem, arquivo, base, trechos) => trechos.forEach(t => corpus.push({ origem, arquivo: relative(base, arquivo).replaceAll('\\', '/'), ...t }));
  for (const a of arquivos(join(projeto, 'conhecimento'), '.md')) add('empresa', a, projeto, trechosDeNota(readFileSync(a, 'utf8')));
  // cada consulta e um trecho, indexado pelo que descreve a pergunta: comentarios e tabelas (o codigo repetiria
  // SELECT/CASE e diluiria a busca)
  const consultas = texto => consultasDoArquivo(texto).map(t => ({
    ...t,
    indice: [...t.texto.matchAll(/--([^\n]*)/g)].map(m => m[1]).join(' ')
      + ' ' + [...t.texto.matchAll(/\b(?:FROM|JOIN)\s+([A-Z][A-Z0-9_]+)/gi)].map(m => m[1]).join(' '),
  }));
  for (const a of arquivos(join(projeto, 'sql'), '.sql')) add('sql', a, projeto, consultas(readFileSync(a, 'utf8')));
  for (const a of arquivos(pastaGeral, '.md').filter(a => !/REGRAS\.md$/.test(a))) {
    add('geral', a, join(pastaGeral, '..'), trechosDeNota(readFileSync(a, 'utf8')));
  }
  // consultas gerais do plugin (ponto de partida para qualquer empresa)
  for (const a of arquivos(pastaGeral, '.sql')) add('geral', a, join(pastaGeral, '..'), consultas(readFileSync(a, 'utf8')));
  for (const t of corpus) {
    t.tokens = tokens(`${t.secao} ${t.indice ?? t.texto}`);
    // nome da pasta e do arquivo (sql/VENDAS/vendas.sql, conhecimento/ESTOQUE.md) funciona como titulo
    t.titulo = tokens(t.arquivo.replace(/[\\/_.-]/g, ' ')).filter(p => !GENERICOS.has(p));
  }
  return corpus;
}

export function buscarConhecimento(corpus, termo, quantidade = 8) {
  const q = String(termo);
  const comSinonimos = SINONIMOS.reduce((s, [re, troca]) => s.replace(re, troca), termos(q).join(' '));
  const consulta = [...new Set([...tokens(q), ...tokens(comSinonimos)])];
  if (!consulta.length) return 'Informe um termo.';
  const N = corpus.length || 1;
  const media = corpus.reduce((s, t) => s + t.tokens.length, 0) / N;
  const df = Object.fromEntries(consulta.map(p => [p, corpus.filter(t => t.tokens.includes(p)).length]));
  const k1 = 1.2, b = 0.75;
  const pontuados = corpus.map(t => {
    let s = 0;
    for (const p of consulta) {
      const f = t.tokens.filter(x => x === p).length;
      if (!f) continue;
      const idf = Math.log(1 + (N - df[p] + 0.5) / (df[p] + 0.5));
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * t.tokens.length / media));
    }
    // assunto no nome do arquivo vale como titulo: +50% por palavra encontrada
    const noTitulo = consulta.filter(p => t.titulo?.includes(p)).length;
    return [t, s * PESO[t.origem] * (1 + 0.5 * noTitulo)];
  }).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
  if (!pontuados.length) return `Nada no conhecimento para "${termo}". Tente outras palavras; se for novo, investigue e registre.`;
  // a melhor consulta pronta sempre aparece (empresa ou geral), mesmo quando as notas ocupam as primeiras posicoes
  const ehConsulta = ([t]) => t.arquivo.endsWith('.sql');
  const escolhidos = pontuados.slice(0, quantidade);
  const melhorConsulta = pontuados.find(ehConsulta);
  // ...desde que seja do assunto (pelo menos 40% da pontuacao da melhor resposta)
  if (melhorConsulta && !escolhidos.some(ehConsulta) && melhorConsulta[1] >= 0.4 * pontuados[0][1]) {
    escolhidos.splice(Math.max(quantidade - 1, 0), 1, melhorConsulta);
  }
  return formatar(escolhidos);
}

function formatar(pontuados) {
  return pontuados.map(([t]) => {
    // consulta: so o cabecalho (objetivo e regra); o arquivo inteiro se le com Read se for usar
    const texto = t.arquivo.endsWith('.sql') ? t.texto.split('\n').slice(0, 8).join('\n') : t.texto.trim();
    return `[${t.origem}] ${t.arquivo}:${t.linha}${t.secao ? ` (${t.secao})` : ''}\n  ${texto.length > 600 ? `${texto.slice(0, 600)}...` : texto}`;
  }).join('\n');
}

export function testes() {
  const nota = '# Custos\n\n## Trava\n\n- A trava `DIASLIMALTCUSTO` bloqueia\n  inclusive o recalculo de custos.\n- Outra coisa sobre parceiros.\n\nParagrafo solto sobre notas.';
  const ts = trechosDeNota(nota);
  assert.equal(ts.length, 3);
  assert.deepEqual([ts[0].linha, ts[0].secao], [5, 'Trava']);
  assert.match(ts[0].texto, /inclusive o recalculo/); // linha de continuacao fica no mesmo trecho
  const corpus = [
    { origem: 'geral', arquivo: 'conhecimento-geral/custos.md', linha: 5, secao: 'Trava', texto: ts[0].texto },
    { origem: 'empresa', arquivo: 'conhecimento/ESTOQUE.md', linha: 9, secao: 'Custo', texto: 'Recálculo de custos rodado em maio com a trava aumentada.' },
    { origem: 'geral', arquivo: 'conhecimento-geral/comercial.md', linha: 3, secao: '', texto: 'Cliente e fornecedor ficam no cadastro de parceiros (TGFPAR).' },
  ].map(t => ({ ...t, tokens: tokens(`${t.secao} ${t.texto}`) }));
  const r = buscarConhecimento(corpus, 'recálculo dos custos');
  assert.match(r.split('\n')[0], /^\[empresa\] conhecimento\/ESTOQUE\.md:9/); // empresa primeiro (peso maior)
  assert.match(r, /\[geral\] conhecimento-geral\/custos\.md:5 \(Trava\)/); // plural e acento nao atrapalham
  assert.match(buscarConhecimento(corpus, 'fornecedor'), /TGFPAR/);
  assert.match(buscarConhecimento(corpus, 'cadastro de clientes'), /^\[geral\] conhecimento-geral\/comercial\.md/); // sinonimo
  assert.match(buscarConhecimento(corpus, 'xyzw'), /^Nada no conhecimento/);
  // a consulta pronta entra mesmo atras das notas da empresa (peso maior)
  const comConsulta = [...corpus, { origem: 'geral', arquivo: 'conhecimento-geral/sql/custo.sql', linha: 1, secao: '',
    texto: '-- Recalculo de custos: conferir\nSELECT 1 FROM DUAL', tokens: tokens('Recalculo de custos conferir TGFCUS') }];
  const r1 = buscarConhecimento(comConsulta, 'recalculo de custos', 1);
  assert.match(r1, /^\[geral\] conhecimento-geral\/sql\/custo\.sql:1\n {2}-- Recalculo de custos/);
  // arquivo de painel com consultas numeradas: cabecalho + uma consulta por trecho, com linha e titulo
  const tr = '-- ====\n-- PAINEL X\n-- ====\n\n-- ----------\n-- 1) POSICAO POR EMPRESA\n-- ----------\nSELECT 1 FROM TGFEST\n\n'
    + '-- ----------\n-- 2) KITS (aba kits)\n-- ----------\nSELECT 2 FROM TGFPRO';
  const cs = consultasDoArquivo(tr);
  assert.deepEqual(cs.map(c => [c.linha, c.secao]), [[1, ''], [5, '1) POSICAO POR EMPRESA'], [10, '2) KITS (aba kits)']]);
  assert.match(cs[2].texto, /SELECT 2 FROM TGFPRO/);
  assert.doesNotMatch(cs[1].texto, /KITS/);
  assert.equal(consultasDoArquivo('-- soma\nSELECT 1 FROM DUAL').length, 1);
  // comentario numerado dentro do codigo (sem linha de tracos antes) nao parte o arquivo
  assert.equal(consultasDoArquivo('-- 1) isto e um comentario\nSELECT 1 FROM DUAL\n-- 2) outro\nSELECT 2 FROM DUAL').length, 1);
  console.log('conhecimento: todos os testes passaram');
}

if (process.argv[1]?.endsWith('conhecimento.mjs') && process.argv.includes('--teste')) testes();

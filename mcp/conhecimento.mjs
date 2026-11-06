// Busca por relevancia (BM25) no conhecimento: notas da empresa (conhecimento/), consultas validadas (sql/) e
// conhecimento geral do plugin. O da empresa pesa mais. Sem dependencias. Teste: node mcp/conhecimento.mjs --teste
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PALAVRAS_VAZIAS, SINONIMOS, termos } from './dicionario.mjs';

const PESO = { empresa: 1.5, sql: 1.3, geral: 1 };
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

export function montarCorpus(projeto, pastaGeral) {
  const corpus = [];
  const add = (origem, arquivo, base, trechos) => trechos.forEach(t => corpus.push({ origem, arquivo: relative(base, arquivo).replaceAll('\\', '/'), ...t }));
  for (const a of arquivos(join(projeto, 'conhecimento'), '.md')) add('empresa', a, projeto, trechosDeNota(readFileSync(a, 'utf8')));
  // consulta validada inteira e um trecho: o cabecalho diz o objetivo, o SQL diz as tabelas
  for (const a of arquivos(join(projeto, 'sql'), '.sql')) add('sql', a, projeto, [{ linha: 1, secao: '', texto: readFileSync(a, 'utf8') }]);
  for (const a of arquivos(pastaGeral, '.md').filter(a => !/REGRAS\.md$/.test(a))) {
    add('geral', a, join(pastaGeral, '..'), trechosDeNota(readFileSync(a, 'utf8')));
  }
  for (const t of corpus) t.tokens = tokens(`${t.secao} ${t.texto}`);
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
    return [t, s * PESO[t.origem]];
  }).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, quantidade);
  if (!pontuados.length) return `Nada no conhecimento para "${termo}". Tente outras palavras; se for novo, investigue e registre.`;
  return pontuados.map(([t]) => {
    const texto = t.origem === 'sql' ? t.texto.split('\n').slice(0, 8).join('\n') : t.texto.trim();
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
  console.log('conhecimento: todos os testes passaram');
}

if (process.argv[1]?.endsWith('conhecimento.mjs') && process.argv.includes('--teste')) testes();

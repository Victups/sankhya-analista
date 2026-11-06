// Dicionario e grafo do banco da empresa, a partir dos arquivos de <projeto>/dicionario/:
//   campos.json   (TDDTAB + TDDCAM, com EXISTE = campo existe fisicamente no Oracle)
//   fks.json      (chaves estrangeiras fisicas)
//   ligacoes.json (ligacoes do dicionario do Sankhya: TDDLIG + TDDLGC + TDDINS)
// Funcoes puras, sem banco. Teste: node mcp/dicionario.mjs --teste
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ARQUIVOS = { campos: 'campos.json', fks: 'fks.json', ligacoes: 'ligacoes.json', instancias: 'instancias.json' };
// Usuario e empresa ligam tudo a tudo (CODUSU, CODEMP): por padrao nao servem de passagem no caminho.
export const EVITAR_PADRAO = ['TSIUSU', 'TSIEMP', 'TGFEMP'];

const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

export function lerArquivos(pasta) {
  const ler = f => (existsSync(join(pasta, f)) ? JSON.parse(readFileSync(join(pasta, f), 'utf8')) : null);
  const campos = ler(ARQUIVOS.campos);
  if (!campos) return null;
  return { campos, fks: ler(ARQUIVOS.fks) ?? [], ligacoes: ler(ARQUIVOS.ligacoes) ?? [], instancias: ler(ARQUIVOS.instancias) ?? [] };
}

export function montarIndice({ campos, fks = [], ligacoes = [], instancias = [] }) {
  const tabelas = new Map();
  const tabela = nome => {
    if (!tabelas.has(nome)) tabelas.set(nome, { nome, descricao: '', campos: [], instancias: [] });
    return tabelas.get(nome);
  };
  for (const r of campos) {
    const t = tabela(r.TABELA);
    t.descricao ||= r.DESCRICAO_TABELA ?? '';
    t.campos.push(r);
  }
  // instancia (TDDINS) = nome da entidade nas telas e na API ("Movimento Bancario" -> TGFMBC)
  for (const r of instancias) tabela(r.TABELA).instancias.push(r);
  // vizinhos: tabela -> Map(vizinha -> [{tipo, nome, pares: [[campo aqui, campo la]], sentido}])
  const vizinhos = new Map();
  const ligar = (a, b, item) => {
    if (!vizinhos.has(a)) vizinhos.set(a, new Map());
    const m = vizinhos.get(a);
    if (!m.has(b)) m.set(b, []);
    const lista = m.get(b);
    const igual = lista.find(x => x.tipo === item.tipo && x.nome === item.nome && x.sentido === item.sentido);
    if (igual) igual.pares.push(...item.pares);
    else lista.push(item);
  };
  const add = (r, tipo, nome) => {
    const o = r.TAB_ORIG, d = r.TAB_DEST;
    tabela(o); tabela(d);
    if (o === d) return; // auto-referencia (pai/filho) nao ajuda a achar caminho
    ligar(o, d, { tipo, nome, sentido: 'saida', pares: [[r.CAMPO_ORIG, r.CAMPO_DEST]] });
    ligar(d, o, { tipo, nome, sentido: 'entrada', pares: [[r.CAMPO_DEST, r.CAMPO_ORIG]] });
  };
  for (const r of fks) add(r, 'FK', r.CONSTRAINT_NAME);
  // ligacao sem nome: a chave e o par de instancias (TDDLIG), cada uma com seus campos (TDDLGC)
  for (const r of ligacoes) add(r, 'LIG', r.NOMELIGACAO || `${r.INST_ORIG}>${r.INST_DEST}`);
  return { tabelas, vizinhos };
}

const grau = (ind, t) => ind.vizinhos.get(t)?.size ?? 0;

// O dicionario do Sankhya abrevia ("Cod.", "Nro.", "Vlr.", "Dt."): palavra e abreviacao viram o mesmo termo.
const ABREVIACOES = Object.fromEntries(Object.entries({
  COD: 'CODIGO CODIGOS COD', NUM: 'NUMERO NUMEROS NRO NUM', VLR: 'VALOR VALORES VLR VL', DT: 'DATA DATAS DT DTA DH',
  QTD: 'QUANTIDADE QUANTIDADES QTD QTDE QT', PERC: 'PERCENTUAL PERC', DESCR: 'DESCRICAO DESCR', TIPO: 'TIPO TP TIP',
  REF: 'REFERENCIA REF', OBS: 'OBSERVACAO OBSERVACOES OBS', EMP: 'EMPRESA EMP', USU: 'USUARIO USU', NAT: 'NATUREZA NAT',
  CTB: 'CONTABIL CTB', CTA: 'CONTA CTA', MOV: 'MOVIMENTO MOVIMENTACAO MOV', LANC: 'LANCAMENTO LANC', SEQ: 'SEQUENCIA SEQ',
  ALT: 'ALTERACAO ALT', FIN: 'FINANCEIRO FIN', PROD: 'PRODUTO PRODUTOS PROD',
}).flatMap(([canon, formas]) => formas.split(' ').map(f => [f, canon])));
// Nomes que a pessoa usa e o Sankhya chama de outro jeito: a busca tenta as duas formas.
export const SINONIMOS = [
  [/\bCENTROS? (DE )?CUSTOS?\b|\bCR\b/g, 'CENTRO RESULTADO'],
  [/\bTOP\b/g, 'TIPO OPERACAO'],
  [/\b(CLIENTES?|FORNECEDOR(ES)?)\b/g, 'PARCEIRO'],
  [/\bCOLABORADOR(ES)?\b/g, 'FUNCIONARIO'],
  [/\bNOTAS?( FISCA(L|IS))?\b/g, 'ENTRADA SAIDA'], // TGFCAB/TGFITE: "Entrada e Saida de Produto"
];
const CANONICOS = new Set(Object.values(ABREVIACOES));
export const PALAVRAS_VAZIAS = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'O', 'A', 'OS', 'AS', 'EM', 'NO', 'NA', 'POR', 'PARA', 'COM']);
export const termos = s => norm(s).split(/[^A-Z0-9_]+/).filter(Boolean).map(p => ABREVIACOES[p] ?? p);
const canonico = s => ` ${termos(s).join(' ')} `;

export function buscar(ind, termo, limite = 30) {
  const q = norm(termo);
  // cada pedaco da busca vira uma lista de alternativas (frases); sinonimo = a forma da pessoa ou a do Sankhya
  const frase = s => termos(s).filter(p => !PALAVRAS_VAZIAS.has(p));
  const pedacos = [];
  const resto = SINONIMOS.reduce((s, [re, troca]) => s.replace(re, m => { pedacos.push([frase(m), frase(troca)]); return ' '; }), q);
  pedacos.push(...frase(resto).map(p => [[p]]));
  if (!pedacos.length) return 'Informe um termo.';
  // palavra longa casa com pedaco ("parc" acha PARCEIRO); abreviacao curta, com o inicio de um termo (VLR acha
  // VLRDESCTOT); outra palavra curta, so com o termo inteiro (CR nao acha CREDITO)
  const tem = (texto, p) => texto.includes(p.length > 3 ? p : CANONICOS.has(p) ? ` ${p}` : ` ${p} `);
  const atende = (texto, alternativas) => alternativas.some(f => f.every(p => tem(texto, p)));
  const casa = texto => pedacos.every(alt => atende(texto, alt));
  // texto canonico de tabelas e campos, calculado uma vez por indice
  ind.textos ??= new Map([...ind.tabelas.values()].map(t => [t, {
    tabela: canonico(`${t.nome} ${t.descricao} ${t.instancias.map(i => `${i.INSTANCIA} ${i.DESCRICAO}`).join(' ')}`),
    campos: t.campos.map(c => canonico(`${t.nome}.${c.CAMPO} ${c.CAMPO} ${c.DESCRICAO_CAMPO}`)),
  }]));
  // campo: as palavras podem estar no campo ou na tabela dele; quem casa so pelo proprio campo vem primeiro
  const pontos = texto => pedacos.filter(alt => atende(texto, alt)).length;
  const tabelas = [], campos = [];
  for (const t of ind.tabelas.values()) {
    const tx = ind.textos.get(t);
    if (casa(tx.tabela)) tabelas.push(t);
    t.campos.forEach((c, i) => {
      if (casa(tx.campos[i] + tx.tabela)) campos.push([c, pontos(tx.campos[i])]);
    });
  }
  campos.sort((a, b) => b[1] - a[1] || grau(ind, b[0].TABELA) - grau(ind, a[0].TABELA)); // empate: tabelas centrais primeiro
  const exato = q.trim();
  tabelas.sort((a, b) => (b.nome === exato) - (a.nome === exato) || grau(ind, b.nome) - grau(ind, a.nome));
  const linhas = [`Tabelas (${tabelas.length}):`];
  const telas = t => (t.instancias.length ? ` | instancias: ${t.instancias.slice(0, 3).map(i => i.DESCRICAO || i.INSTANCIA).join(', ')}${t.instancias.length > 3 ? '...' : ''}` : '');
  linhas.push(...tabelas.slice(0, limite).map(t => `  ${t.nome} - ${t.descricao} [${t.campos.length} campos, ${grau(ind, t.nome)} ligadas]${telas(t)}`));
  linhas.push(`Campos (${campos.length}):`);
  linhas.push(...campos.slice(0, limite).map(([c]) => `  ${c.TABELA}.${c.CAMPO} - ${c.DESCRICAO_CAMPO ?? ''}${naoExiste(c) ? ' [NAO EXISTE NO BANCO]' : ''}`));
  if (tabelas.length > limite || campos.length > limite) linhas.push(`(mostrando ${limite} de cada; refine o termo)`);
  return linhas.join('\n');
}

const naoExiste = c => c.CALCULADO === 'S' || c.EXISTE === 'N';

function descreverLigacao(t, viz, l) {
  const seta = l.sentido === 'saida' ? '->' : '<-';
  const pares = l.pares.map(([a, b]) => `${t}.${a} = ${viz}.${b}`).join(' AND ');
  return `  ${seta} ${viz} (${l.tipo} ${l.nome}): ${pares}`;
}

// Tabela grande (TGFCAB, TGFPRO: 500+ campos) custa milhares de tokens: sem filtro, mostra os primeiros maxCampos.
export function descrever(ind, nome, { filtro, maxCampos = 60, maxLigacoes = 25 } = {}) {
  const t = ind.tabelas.get(norm(nome).trim());
  if (!t) return `Tabela ${nome} nao esta no dicionario. Use buscar_dicionario.`;
  const palavras = filtro ? termos(filtro).filter(p => !PALAVRAS_VAZIAS.has(p)) : [];
  const casa = c => palavras.every(p => canonico(`${c.CAMPO} ${c.DESCRICAO_CAMPO}`).includes(p));
  const existem = t.campos.filter(c => !naoExiste(c) && casa(c));
  const fora = t.campos.filter(c => naoExiste(c) && casa(c));
  const linhas = [`${t.nome} - ${t.descricao} (${t.campos.length} campos no dicionario${filtro ? `; ${existem.length} com "${filtro}"` : ''})`, 'Campos:'];
  linhas.push(...existem.slice(0, maxCampos).map(c => `  ${c.CAMPO} ${c.TIPO ?? ''}${c.TAMANHO ? `(${c.TAMANHO})` : ''} - ${c.DESCRICAO_CAMPO ?? ''}${c.ADICIONAL === 'S' ? ' [adicional]' : ''}`));
  if (existem.length > maxCampos) linhas.push(`  (+${existem.length - maxCampos} campos; use filtro, ex.: "valor", "data", "parceiro")`);
  if (fora.length) linhas.push(`Nao existem no banco (nao usar em SQL): ${fora.slice(0, 80).map(c => c.CAMPO).join(', ')}${fora.length > 80 ? ', ...' : ''}`);
  if (t.instancias.length) {
    linhas.push(`Instancias (nome nas telas e na API): ${t.instancias.slice(0, 15).map(i => `${i.DESCRICAO} (${i.INSTANCIA})`).join(', ')}${t.instancias.length > 15 ? ', ...' : ''}`);
  }
  const ligs = [...(ind.vizinhos.get(t.nome) ?? [])].flatMap(([viz, ls]) => ls.map(l => [viz, l]));
  ligs.sort((a, b) => (a[1].sentido === 'saida' ? 0 : 1) - (b[1].sentido === 'saida' ? 0 : 1) || a[0].localeCompare(b[0]));
  linhas.push(`Ligacoes (${ligs.length}; FK = chave fisica, LIG = ligacao do dicionario Sankhya):`);
  linhas.push(...ligs.slice(0, maxLigacoes).map(([viz, l]) => descreverLigacao(t.nome, viz, l)));
  if (ligs.length > maxLigacoes) linhas.push(`  (+${ligs.length - maxLigacoes}; para uma tabela especifica use caminho_entre_tabelas)`);
  return linhas.join('\n');
}

// Menores rotas (em saltos) de o ate d, no maximo "alternativas", sem passar pelas proibidas. [] se nao houver.
function rotasEntre(ind, o, d, proibidas, maxSaltos, alternativas) {
  // BFS por camadas guardando todos os pais de cada tabela na menor distancia
  const pais = new Map([[o, []]]);
  let fronteira = [o];
  for (let salto = 0; salto < maxSaltos && fronteira.length && !pais.has(d); salto++) {
    const proxima = new Map();
    for (const t of fronteira) {
      if (t !== o && proibidas.has(t)) continue; // nao passa por aqui
      for (const viz of (ind.vizinhos.get(t) ?? new Map()).keys()) {
        if (pais.has(viz)) continue;
        if (!proxima.has(viz)) proxima.set(viz, []);
        proxima.get(viz).push(t);
      }
    }
    for (const [viz, ps] of proxima) pais.set(viz, ps);
    fronteira = [...proxima.keys()];
  }
  if (!pais.has(d)) return [];
  // monta as rotas de tras para frente, preferindo passar pelas tabelas mais centrais (cadastros)
  const rotas = [];
  const voltar = (t, sufixo) => {
    if (rotas.length >= alternativas) return;
    if (t === o) { rotas.push([o, ...sufixo]); return; }
    for (const p of [...pais.get(t)].sort((a, b) => grau(ind, b) - grau(ind, a))) voltar(p, [t, ...sufixo]);
  };
  voltar(d, []);
  return rotas;
}

// Caminhos de juncao entre duas tabelas, ate 5 alternativas, sem passar pelas de "evitar".
// "passarPor": tabelas obrigatorias, na ordem; o caminho e montado trecho a trecho.
export function caminho(ind, origem, destino, { evitar = EVITAR_PADRAO, maxSaltos = 5, alternativas = 5, passarPor = [] } = {}) {
  const pontos = [origem, ...passarPor, destino].map(t => norm(t).trim());
  for (const t of pontos) if (!ind.tabelas.has(t)) return `Tabela ${t} nao esta no dicionario.`;
  const proibidas = new Set(evitar.map(x => norm(x).trim()));
  let rotas = [[pontos[0]]];
  for (let i = 0; i < pontos.length - 1; i++) {
    const trecho = rotasEntre(ind, pontos[i], pontos[i + 1], proibidas, maxSaltos, alternativas);
    if (!trecho.length) {
      return `Sem caminho de ate ${maxSaltos} saltos entre ${pontos[i]} e ${pontos[i + 1]} sem passar por ${[...proibidas].join(', ') || 'nenhuma'}. `
        + 'Aumente max_saltos, mude "evitar" ou ligue por uma tabela intermediaria conhecida.';
    }
    // combina as rotas ate aqui com as do trecho, variando primeiro o trecho
    rotas = rotas.flatMap(r => trecho.map(t => [...r, ...t.slice(1)])).slice(0, alternativas);
  }
  const linhas = [];
  rotas.forEach((rota, n) => {
    linhas.push(`Caminho ${n + 1}: ${rota.join(' -> ')}`);
    for (let i = 0; i < rota.length - 1; i++) {
      const ls = ind.vizinhos.get(rota[i]).get(rota[i + 1]);
      const fk = ls.find(l => l.tipo === 'FK') ?? ls[0]; // uma ligacao por salto; as outras com descrever_tabela
      linhas.push(descreverLigacao(rota[i], rota[i + 1], fk) + (ls.length > 1 ? ` (+${ls.length - 1})` : ''));
    }
  });
  return linhas.join('\n');
}

// Resumo legivel do banco (dicionario/MAPA.md) e o que mudou desde a extracao anterior.
export function mapa(ind, { quando, banco, anterior } = {}) {
  const tabs = [...ind.tabelas.values()];
  const nCampos = tabs.reduce((s, t) => s + t.campos.length, 0);
  const prefixos = new Map();
  for (const t of tabs) {
    const p = t.nome.startsWith('AD_') ? 'AD_' : t.nome.slice(0, 3);
    prefixos.set(p, (prefixos.get(p) ?? 0) + 1);
  }
  const topo = tabs.filter(t => t.campos.length).sort((a, b) => grau(ind, b.nome) - grau(ind, a.nome)).slice(0, 20);
  const linhas = [
    '# Mapa do banco', '',
    `Extraido em ${quando ?? '?'}${banco ? ` (${banco})` : ''} pela ferramenta extrair_dicionario do plugin sankhya-analista.`,
    'Consultar pelas ferramentas buscar_dicionario, descrever_tabela e caminho_entre_tabelas.', '',
    `- Tabelas: ${tabs.length} (${tabs.filter(t => t.campos.length).length} com campos no dicionario)`,
    `- Campos no dicionario: ${nCampos} (${tabs.reduce((s, t) => s + t.campos.filter(naoExiste).length, 0)} nao existem no banco)`,
    `- Tabelas e campos adicionais (AD_): ${prefixos.get('AD_') ?? 0} tabelas, ${tabs.reduce((s, t) => s + t.campos.filter(c => c.ADICIONAL === 'S').length, 0)} campos`,
    '', '## Modulos (prefixo: tabelas)', '',
    [...prefixos].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p}: ${n}`).join(', '),
    '', '## Tabelas mais ligadas', '',
    ...topo.map(t => `- ${t.nome} - ${t.descricao} (${grau(ind, t.nome)})`),
  ];
  if (anterior) {
    const antes = new Map([...anterior.tabelas.values()].map(t => [t.nome, new Set(t.campos.map(c => c.CAMPO))]));
    const novas = tabs.filter(t => t.campos.length && !antes.has(t.nome)).map(t => t.nome);
    const removidas = [...antes.keys()].filter(n => antes.get(n).size && !ind.tabelas.get(n)?.campos.length);
    const camposNovos = tabs.flatMap(t => (antes.has(t.nome) ? t.campos.filter(c => !antes.get(t.nome).has(c.CAMPO)).map(c => `${t.nome}.${c.CAMPO}`) : []));
    const lista = xs => (xs.length ? `${xs.length}: ${xs.slice(0, 40).join(', ')}${xs.length > 40 ? ', ...' : ''}` : 'nenhuma');
    linhas.push('', '## O que mudou desde a extracao anterior', '',
      `- Tabelas novas ${lista(novas)}`, `- Tabelas que sairam ${lista(removidas)}`, `- Campos novos ${lista(camposNovos)}`);
  }
  return linhas.join('\n') + '\n';
}

export function testes() {
  const campos = [
    { TABELA: 'TGFCAB', DESCRICAO_TABELA: 'Cabeçalho da Nota', CAMPO: 'NUNOTA', DESCRICAO_CAMPO: 'Nro. Único', TIPO: 'I', CALCULADO: 'N', EXISTE: 'S' },
    { TABELA: 'TGFCAB', DESCRICAO_TABELA: 'Cabeçalho da Nota', CAMPO: 'CODPARC', DESCRICAO_CAMPO: 'Parceiro', TIPO: 'I', CALCULADO: 'N', EXISTE: 'S' },
    { TABELA: 'TGFCAB', DESCRICAO_TABELA: 'Cabeçalho da Nota', CAMPO: 'VLRCALC', DESCRICAO_CAMPO: 'Calculado', TIPO: 'F', CALCULADO: 'S', EXISTE: 'N' },
    { TABELA: 'TGFITE', DESCRICAO_TABELA: 'Itens da Nota', CAMPO: 'NUNOTA', DESCRICAO_CAMPO: 'Nro. Único', TIPO: 'I', CALCULADO: 'N', EXISTE: 'S' },
    { TABELA: 'TGFPAR', DESCRICAO_TABELA: 'Parceiros', CAMPO: 'CODPARC', DESCRICAO_CAMPO: 'Código do parceiro', TIPO: 'I', CALCULADO: 'N', EXISTE: 'S' },
    { TABELA: 'TCBLAN', DESCRICAO_TABELA: 'Lançamentos contábeis', CAMPO: 'CODPARC', DESCRICAO_CAMPO: 'Parceiro', TIPO: 'I', CALCULADO: 'N', EXISTE: 'S' },
  ];
  const fks = [
    { TAB_ORIG: 'TGFITE', CAMPO_ORIG: 'NUNOTA', TAB_DEST: 'TGFCAB', CAMPO_DEST: 'NUNOTA', CONSTRAINT_NAME: 'FK_ITE_CAB' },
    { TAB_ORIG: 'TGFCAB', CAMPO_ORIG: 'CODPARC', TAB_DEST: 'TGFPAR', CAMPO_DEST: 'CODPARC', CONSTRAINT_NAME: 'FK_CAB_PAR' },
    { TAB_ORIG: 'TGFCAB', CAMPO_ORIG: 'NUNOTAPAI', TAB_DEST: 'TGFCAB', CAMPO_DEST: 'NUNOTA', CONSTRAINT_NAME: 'FK_AUTO' },
  ];
  const ligacoes = [{ TAB_ORIG: 'TCBLAN', CAMPO_ORIG: 'CODPARC', TAB_DEST: 'TGFPAR', CAMPO_DEST: 'CODPARC', NOMELIGACAO: 'LIG1' }];
  const instancias = [{ TABELA: 'TGFCAB', INSTANCIA: 'CabecalhoNota', DESCRICAO: 'Cabeçalho da Nota' },
    { TABELA: 'TGFPAR', INSTANCIA: 'Parceiro', DESCRICAO: 'Cadastro de Parceiros' }];
  const ind = montarIndice({ campos, fks, ligacoes, instancias });
  assert.match(buscar(ind, 'cadastro de parceiros'), /TGFPAR - Parceiros .*instancias: Cadastro de Parceiros/); // achou pela instancia
  assert.match(descrever(ind, 'TGFPAR'), /Instancias \(nome nas telas e na API\): Cadastro de Parceiros \(Parceiro\)/);

  assert.equal(grau(ind, 'TGFCAB'), 2); // auto-referencia ignorada
  const b = buscar(ind, 'parceiro tgfcab');
  assert.match(b, /TGFCAB\.CODPARC - Parceiro/);
  assert.match(buscar(ind, 'cabecalho'), /TGFCAB - Cabeçalho da Nota/); // busca sem acento casa com acento
  assert.match(buscar(ind, 'numero unico'), /TGFCAB\.NUNOTA - Nro\. Único/); // abreviacao do dicionario
  assert.match(buscar(ind, 'codigo do parceiro'), /TGFPAR\.CODPARC/); // "do" ignorado, "codigo" acha "Código"
  assert.match(buscar(ind, 'cliente nota'), /TGFCAB\.CODPARC - Parceiro/); // sinonimo + palavra da tabela
  assert.match(buscar(ind, 'lancamentos parceiro'), /Campos \(1\):\n {2}TCBLAN\.CODPARC/);
  assert.doesNotMatch(buscar(ind, 'cr'), /TCBLAN/); // palavra curta nao casa com pedaco de outra
  assert.match(buscar(ind, 'valor calculado'), /TGFCAB\.VLRCALC/); // VLR casa com o inicio do nome do campo
  assert.match(buscar(ind, 'nro unico itens nota'), /TGFITE\.NUNOTA/); // nota -> "Itens da Nota" ou "Entrada e Saida"
  const d = descrever(ind, 'tgfcab');
  assert.match(d, /Nao existem no banco \(nao usar em SQL\): VLRCALC/);
  assert.doesNotMatch(d, /^ {2}VLRCALC/m);
  assert.match(d, /-> TGFPAR \(FK FK_CAB_PAR\): TGFCAB\.CODPARC = TGFPAR\.CODPARC/);
  assert.match(d, /<- TGFITE \(FK FK_ITE_CAB\): TGFCAB\.NUNOTA = TGFITE\.NUNOTA/);
  const c = caminho(ind, 'TGFITE', 'TCBLAN');
  assert.match(c, /Caminho 1: TGFITE -> TGFCAB -> TGFPAR -> TCBLAN/);
  assert.match(c, /TGFPAR\.CODPARC = TCBLAN\.CODPARC/);
  assert.match(caminho(ind, 'TGFITE', 'TCBLAN', { evitar: ['TGFPAR'] }), /Sem caminho/);
  // passar por: o caminho direto TGFITE -> TGFCAB e trocado pela volta obrigatoria por TGFPAR
  assert.match(caminho(ind, 'TGFITE', 'TGFCAB'), /Caminho 1: TGFITE -> TGFCAB\n/);
  assert.match(caminho(ind, 'TCBLAN', 'TGFITE', { passarPor: ['tgfpar', 'TGFCAB'] }), /Caminho 1: TCBLAN -> TGFPAR -> TGFCAB -> TGFITE\n/);
  assert.match(caminho(ind, 'TGFITE', 'TCBLAN', { passarPor: ['XPTO'] }), /XPTO nao esta no dicionario/);
  assert.match(caminho(ind, 'TGFITE', 'TCBLAN', { passarPor: ['TGFPAR'], evitar: ['TGFCAB'] }), /Sem caminho .* TGFITE e TGFPAR/);
  assert.match(descrever(ind, 'XPTO'), /nao esta no dicionario/);
  const f = descrever(ind, 'TGFCAB', { filtro: 'parceiro' });
  assert.match(f, /1 com "parceiro"/);
  assert.doesNotMatch(f, /NUNOTA I/);
  assert.match(descrever(ind, 'TGFCAB', { maxCampos: 1 }), /\(\+1 campos; use filtro/);

  const antes = montarIndice({ campos: campos.filter(x => x.CAMPO !== 'CODPARC'), fks: [], ligacoes: [] });
  const m = mapa(ind, { quando: '2026-11-06', anterior: antes });
  assert.match(m, /Tabelas novas 2: TGFPAR, TCBLAN/);
  assert.match(m, /Campos novos 1: TGFCAB\.CODPARC/);
  console.log('dicionario: todos os testes passaram');
}

if (process.argv[1]?.endsWith('dicionario.mjs') && process.argv.includes('--teste')) testes();

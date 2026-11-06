// MCP da Central de Ajuda do Sankhya (ajuda.sankhya.com.br, API publica do Zendesk, sem login).
// Ferramentas: buscar_ajuda (artigos por palavra-chave) e ler_artigo (texto completo).
// Teste: node mcp/ajuda.mjs --teste (sem rede) | --teste-online (consulta a API)
import assert from 'node:assert/strict';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE = 'https://ajuda.sankhya.com.br/api/v2/help_center';
const MAX_CARACTERES = 15_000;

async function obter(caminho) {
  const r = await fetch(`${BASE}${caminho}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'sankhya-analista' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`Central de Ajuda respondeu ${r.status} em ${caminho}`);
  return r.json();
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

export function htmlParaTexto(html) {
  return String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, ' [imagem: $1] ')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(td|th)>/gi, ' | ')
    .replace(/<(br|\/p|\/div|\/tr|\/h\d|\/ul|\/ol|\/table)[^>]*>/gi, '\n')
    .replace(/<h(\d)[^>]*>/gi, (_, n) => `\n${'#'.repeat(Number(n))} `)
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTIDADES[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function buscarAjuda(termo, quantidade = 8) {
  const q = new URLSearchParams({ query: termo, locale: 'pt-br', per_page: String(quantidade) });
  const r = await obter(`/articles/search.json?${q}`);
  if (!r.results?.length) return `Nenhum artigo para "${termo}". Tente outras palavras (nome da tela, do campo ou da mensagem de erro).`;
  return [`${r.count} artigos para "${termo}" (mostrando ${r.results.length}):`, ...r.results.map(a =>
    `- [${a.id}] ${a.title}${a.outdated ? ' (desatualizado)' : ''} - atualizado ${String(a.updated_at).slice(0, 10)}\n  ${htmlParaTexto(a.snippet)}`)]
    .join('\n');
}

// Artigo longo vem em partes (~4 mil tokens cada): o agente le a seguinte so se precisar.
export function parteDoTexto(corpo, parte = 1) {
  const total = Math.max(1, Math.ceil(corpo.length / MAX_CARACTERES));
  const n = Math.min(Math.max(1, parte), total);
  const trecho = corpo.slice((n - 1) * MAX_CARACTERES, n * MAX_CARACTERES);
  return total === 1 ? trecho : `[parte ${n} de ${total}]\n${trecho}${n < total ? `\n[continua: ler_artigo com parte ${n + 1}]` : ''}`;
}

async function lerArtigo(id, parte) {
  const { article: a } = await obter(`/pt-br/articles/${encodeURIComponent(id)}.json`);
  return [`# ${a.title}`, `${a.html_url} (atualizado ${String(a.updated_at).slice(0, 10)}${a.outdated ? ', desatualizado' : ''})`, '',
    parteDoTexto(htmlParaTexto(a.body), parte)].join('\n');
}

const ferramenta = fn => async args => {
  try {
    return { content: [{ type: 'text', text: await fn(args) }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `ERRO: ${e.message}` }], isError: true };
  }
};

async function iniciar() {
  const server = new McpServer({ name: 'sankhya-ajuda', version: '0.1.0' });
  server.registerTool('buscar_ajuda', {
    description: 'Busca artigos na Central de Ajuda publica do Sankhya (documentacao de telas, processos, solucao de problemas) '
      + 'por palavra-chave. Devolve id, titulo e trecho; leia o artigo com ler_artigo.',
    inputSchema: {
      termo: z.string().describe('Palavras-chave, ex.: "recalculo de custos" ou o texto da mensagem de erro'),
      quantidade: z.number().int().min(1).max(25).optional().describe('Padrao 8'),
    },
  }, ferramenta(({ termo, quantidade }) => buscarAjuda(termo, quantidade)));
  server.registerTool('ler_artigo', {
    description: 'Le o texto de um artigo da Central de Ajuda do Sankhya pelo id (de buscar_ajuda). Artigo longo vem em partes.',
    inputSchema: {
      id: z.union([z.string(), z.number()]).describe('Id do artigo'),
      parte: z.number().int().min(1).optional().describe('Parte do artigo longo (padrao 1)'),
    },
  }, ferramenta(({ id, parte }) => lerArtigo(id, parte)));
  await server.connect(new StdioServerTransport());
  console.error('sankhya-ajuda: pronto');
}

async function testes(online) {
  assert.equal(htmlParaTexto('<p>Tela <strong>Custos</strong> &amp; tarifas</p><ul><li>um</li><li>dois</li></ul>'),
    'Tela Custos & tarifas\n\n- um\n- dois');
  assert.equal(htmlParaTexto('<h2>Passo</h2><table><tr><td>A</td><td>B</td></tr></table>'), '## Passo\nA | B |');
  assert.equal(htmlParaTexto('a <em>b</em>&nbsp;c'), 'a b c');
  assert.equal(parteDoTexto('curto'), 'curto');
  const longo = 'x'.repeat(MAX_CARACTERES * 2 + 10);
  assert.match(parteDoTexto(longo), /^\[parte 1 de 3\][\s\S]*\[continua: ler_artigo com parte 2\]$/);
  assert.match(parteDoTexto(longo, 3), /^\[parte 3 de 3\]\nx{10}$/);
  if (online) {
    const r = await buscarAjuda('recalculo de custos', 2);
    assert.match(r, /^\d+ artigos/);
    const id = r.match(/\[(\d+)\]/)[1];
    assert.match(await lerArtigo(id), /^# /);
    console.log('ajuda: API online respondeu');
  }
  console.log('ajuda: todos os testes passaram');
}

if (process.argv.includes('--teste') || process.argv.includes('--teste-online')) await testes(process.argv.includes('--teste-online'));
else await iniciar();

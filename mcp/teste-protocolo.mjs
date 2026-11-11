// Teste de protocolo: sobe os servidores MCP como o Claude Code sobe (stdio) e chama ferramentas que nao precisam
// de banco nem de internet. Pega quebra de dependencia (SDK do MCP, zod) que os testes de funcao nao veem.
// Uso: node mcp/teste-protocolo.mjs
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const projeto = mkdtempSync(join(tmpdir(), 'snk-protocolo-'));
mkdirSync(join(projeto, 'dados'));
writeFileSync(join(projeto, 'dados', 'x.csv'), 'A;B\r\n1;2\r\n3;4\r\n');

async function conectar(servidor) {
  const cliente = new Client({ name: 'teste-protocolo', version: '1' });
  await cliente.connect(new StdioClientTransport({
    command: process.execPath,
    args: [join(raiz, 'mcp', `${servidor}.mjs`)],
    env: { ...process.env, SANKHYA_PROJETO: projeto },
    stderr: 'ignore',
  }));
  return cliente;
}
const texto = r => r.content[0].text;

try {
  const oracle = await conectar('oracle');
  assert.deepEqual((await oracle.listTools()).tools.map(t => t.name).sort(), ['buscar_conhecimento', 'buscar_dicionario',
    'caminho_entre_tabelas', 'consultar_sql', 'descrever_tabela', 'exportar_sql', 'extrair_dicionario', 'resumir_dados',
    'verificar_conexao']);
  const instrucoes = oracle.getInstructions();
  assert.match(instrucoes, /SOMENTE LEITURA/);
  assert.ok(instrucoes.length <= 512, 'o Codex so garante os 512 primeiros caracteres das instrucoes do servidor');
  assert.match(texto(await oracle.callTool({ name: 'resumir_dados', arguments: { arquivo: 'x.csv', somar: ['B'] } })), /SOMA_B\n2\t6/);
  assert.match(texto(await oracle.callTool({ name: 'buscar_conhecimento', arguments: { termo: 'campo calculado' } })), /\[geral\]/);
  // consulta geral do plugin aparece na busca, so com o cabecalho
  const consulta = texto(await oracle.callTool({ name: 'buscar_conhecimento', arguments: { termo: 'saldo bancario de hoje', quantidade: 3 } }));
  assert.match(consulta, /\[geral\] conhecimento-geral\/sql\/saldo_bancario_hoje\.sql:1/);
  assert.doesNotMatch(consulta, /GROUP BY m\.CODCTABCOINT/);
  const bloqueado = await oracle.callTool({ name: 'consultar_sql', arguments: { sql: 'DELETE FROM TGFCAB' } });
  assert.ok(bloqueado.isError && /So e permitido SELECT/.test(texto(bloqueado))); // a trava responde antes de abrir o banco
  const semDicionario = await oracle.callTool({ name: 'descrever_tabela', arguments: { tabela: 'TGFCAB', filtro: 'valor' } });
  assert.match(texto(semDicionario), /Dicionario nao encontrado/);
  // parametro fora do esquema e recusado pela validacao (zod) antes de chegar ao codigo
  const invalido = await oracle.callTool({ name: 'consultar_sql', arguments: { sql: 'SELECT 1 FROM DUAL', base: 'X; DROP' } }).catch(e => ({ isError: true, content: [{ text: e.message }] }));
  assert.ok(invalido.isError);
  await oracle.close();

  const ajuda = await conectar('ajuda');
  assert.deepEqual((await ajuda.listTools()).tools.map(t => t.name).sort(), ['buscar_ajuda', 'ler_artigo']);
  await ajuda.close();
  console.log('protocolo MCP: servidores sobem, ferramentas listadas e chamadas sem banco funcionam');
} finally {
  rmSync(projeto, { recursive: true, force: true });
}

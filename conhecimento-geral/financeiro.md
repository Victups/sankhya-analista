# Financeiro

## Títulos (TGFFIN)

- `RECDESP`: -1 a pagar, 1 a receber, 0 sem efeito (nem pagar nem receber) (confirmado em produção, out/2026).
- `ORIGEM`: E nota, F lançado no financeiro, P outros (confirmado em produção, out/2026; a validar o P).
- `PROVISAO = 'S'` é previsão. Nota de compra ainda não confirmada (`STATUSNOTA` P ou A) e pedido de compra já têm
  título com `PROVISAO = 'S'` (confirmado em produção, out/2026).
- Provisão vencida não some sozinha: tirar de "vencidos" ou mostrar à parte (confirmado em produção, out/2026).
- Título pode ser baixado e continuar com `PROVISAO = 'S'`. Para realizado, decidir se entra provisão paga (visto
  numa base, out/2026).
- Pedido e nota podem ter financeiro com o mesmo valor (provisão do pedido e título da nota): contar uma vez
  (confirmado em produção, nov/2026).
- Uma nota gera vários títulos (parcelas). Processo = `NUNOTA` ou, sem nota, `NUFIN` (confirmado em produção,
  out/2026).
- Baixa: `DHBAIXA` e `VLRBAIXA`. No contas a receber a baixa pode passar do título por juros. `VLRJURO`, `VLRMULTA`
  e `VLRDESC` ficam à parte (confirmado em produção, out/2026).
- Título baixado aponta o movimento bancário em `TGFFIN.NUBCO` (confirmado em produção, out/2026).
- Prazo concedido = `DTVENC - DTNEG`; prazo real = `DHBAIXA - DTNEG` (prática, out/2026).
- Tipo de título (boleto, transferência, PIX, tributos...): `TGFTIT` (confirmado em produção, out/2026).
- O financeiro pode corrigir natureza e CR no título, e o cabeçalho da nota fica com os originais. Classificar pelo
  título (confirmado em produção, out/2026).
- Histórico: `TGFFIN.HISTORICO`. Numa nota com vários títulos, só o primeiro costuma ter texto (visto numa base,
  nov/2026).
- `TGFFIN.CODVEICULO` vem da nota (combustível, serviço, uso) e dá custo por veículo junto com a natureza
  (confirmado em produção, out/2026).
- Adiantamento: a rotina gerou dois títulos na mesma natureza, o pagamento (despesa) e a compensação (receita). Somar
  sem sinal dobra o valor (visto numa base, out/2026; a validar se é o padrão).
- Perfil de parceiro: `TGFPPA` → `TGFTPP` (a validar: só visto no dicionário).

## Rateio e naturezas

- `TGFRAT`: rateio por natureza e CR, da nota (`ORIGEM = 'E'`) ou do título (`ORIGEM = 'F'`). Ver a armadilha de
  ligação em `sql-e-banco.md` (confirmado em produção, out/2026).
- `TGFNAT`: árvore por `CODNATPAI`. O tipo `TIPNAT` (R/D) pode estar quase todo vazio; nesse caso o tipo sai da
  árvore (visto numa base, out/2026).
- Natureza → conta contábil: `TGFNAT.CODCTACTB`. Exceções por empresa em `TGFENA`, por CR em `TGFNCC` e por projeto
  em `TGFNPC` (a validar: só visto no dicionário).
- Grupos de natureza (`TGFGNT`) podem misturar receita e despesa: somar cada natureza com o seu sinal (visto numa
  base, nov/2026).

## Bancos

- `TGFSBC`: uma linha por conta e mês com movimento. `SALDOREAL` = saldo no 1º dia do mês da `REFERENCIA`. O do mês
  seguinte = este + movimento da `TGFMBC` no mês (confirmado com extrato em produção, out/2026).
- Saldo de hoje = `SALDOREAL` da última referência até o mês atual + movimento desde ela (confirmado com extrato em
  produção, out/2026).
- `SALDOBCO` é só o conciliado: sem conciliação em dia, fica parado (confirmado em produção, out/2026).
- `TGFMBC` não tem empresa: ela vem da conta (`CODCTABCOINT` → `TSICTA.CODEMP`). `RECDESP` 1 entrada, -1 saída
  (confirmado em produção, out/2026).
- `TGFMBC.ORIGMOV`: F baixa de título, T transferência, A aplicação, R resgate. T, A e R aparecem dos dois lados
  (confirmado em produção, out/2026).
- `TSICTA.CLASSE`: C conta corrente, A aplicação, O outras (confirmado em produção, out/2026); X e Z caixa (a validar).
- `TSICTA.CODAGE` guarda a agência com o dígito no último caractere (confirmado em produção, out/2026).
- `TSICTA.SEQREM`: contador de arquivos de remessa da conta. `TSICTA.IDCLIENTE`: código do cliente no banco (convênio)
  (confirmado em produção, out/2026).

## Empréstimos

- Módulo de empréstimos e financiamentos: `TCBEMPFIN` e `TGFMFO`. Sem ele, o empréstimo só aparece nos títulos por
  natureza, sem taxa nem saldo para quitação (a validar).

## Tela Movimentação Financeira

- Os filtros salvos da barra ficam em `TSICFG` (`CHAVE` =
  'FilterBarState:br.com.sankhya.fin.cad.movimentacaoFinanceira', por `CODUSU`), em JSON só com o código
  (`{"id":...,"check":false}`). A descrição é buscada ao abrir (confirmado em produção, nov/2026).
- Defeito: o filtro de natureza mostra "undefined" no lugar da descrição. Limpar e selecionar de novo não resolve.
  Não editar a `TSICFG` à mão (chamado aberto na Sankhya, nov/2026).

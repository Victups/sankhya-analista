# Custos e estoque

## Custo (TGFCUS)

- `TGFCUS` guarda o histórico de custo por empresa e produto. O custo vigente numa data é a linha mais recente com
  `DTATUAL` até essa data (confirmado em produção, out/2026).
- Há `DTATUAL` em 01/01/1900 (implantação) e em datas futuras: sempre limitar `DTATUAL <= data` (confirmado em
  produção, out/2026).
- Tipos de custo na mesma linha: `CUSSEMICM` custo médio sem ICMS, `CUSREP` reposição (preço da última compra),
  `CUSGER` gerencial (para formação de preço). Os três podem diferir várias vezes entre si (ajuda do Sankhya:
  "Cálculo de Custos sem Fórmula de Precificação" e "Apuração de Custos no ERP Sankhya"; confirmado em produção,
  out/2026).
- O estoque é valorado pelo custo médio (média ponderada móvel). A saída é custeada por quantidade × custo médio
  vigente na data (ajuda do Sankhya, "Apuração de Custos no ERP Sankhya").
- Custo com ou sem ICMS depende do regime tributário da empresa: confirmar o regime antes de escolher a coluna (ajuda
  do Sankhya).
- A ajuda manda não registrar saída antes da entrada da compra. Estoque negativo distorce o custo médio e gera item
  com custo acima do preço de venda (ajuda do Sankhya; confirmado em produção, out/2026).
- Margem bruta: usar o `CUSSEMICM` vigente na data da nota. `TGFITE.CUSTO` pode vir vazio ou absurdo, sobretudo em
  serviço (visto numa base, out/2026).
- `TGFCUSITE`: custo por item de nota. `ENTRADASEMICMS`, `CUSGER` e `CUSMEDSEMICM` são por unidade: somar não dá o
  custo do mês. Na nota de produção também traz as matérias-primas (confirmado em produção, nov/2026).
- `TGFFOR`: fórmulas de custo de entrada (preço, frete, ST, IPI). Não somam custo indireto de produção (visto numa
  base, nov/2026).
- O Sankhya não guarda histórico do valor do estoque, só a posição atual. Para ver a evolução, gravar uma foto por
  mês (confirmado em produção, out/2026).

## Trava de custo antigo e recálculo

- Preferência `DIASLIMALTCUSTO` (`TSIPAR`): quantos dias para trás o custo pode ser alterado (confirmado em produção
  e em base de teste, nov/2026).
- O trigger `TRG_DLT_UPD_TGFCUS` bloqueia UPDATE e DELETE em `TGFCUS` com `DTATUAL` antes do limite, exceto quando
  a rotina do Sankhya está atualizando (`Stp_Get_Atualizando`). Inclusão passa (confirmado em base de teste,
  nov/2026).
- O Recálculo de Custos também é barrado por essa trava (ORA-20101, nada gravado). Para recalcular mês mais antigo
  que o limite: subir o parâmetro antes e voltar depois (confirmado em base de teste, nov/2026).
- `TRG_INC_UPT_DLT_TGFCUS_FEC_CTB` bloqueia custo em mês fechado pela contabilidade, quando o fechamento está em uso
  (visto no banco, nov/2026). Ver `contabil.md`.
- Recálculo de Custos (Comercial › Avançado) sozinho só exclui e refaz os custos de entrada: não absorve custo
  indireto (ajuda do Sankhya, artigos 360044611094 e 360045118873).
- Depois do recálculo, o custo da produção ficou com 2 casas decimais, e o `CUSSEMICM` do acabado sobe aos poucos,
  porque é média com o estoque (confirmado em base de teste, nov/2026).

## Saldo (TGFEST)

- Uma linha por `CODEMP`, `CODLOCAL`, `CODPROD`, `CONTROLE` e `TIPO`: somar para ter o saldo por empresa e produto.
  `TIPO` P = próprio, T = de terceiros (confirmado em produção, out/2026).
- Disponível = `ESTOQUE - NVL(RESERVADO, 0)` (confirmado em produção, out/2026).
- `TGFEST` é posição atual: o saldo muda entre duas execuções e não há histórico (confirmado em produção, out/2026).
- O sistema aceita saldo negativo. Mostrar positivo e negativo separados; um produto pode somar 0 entre locais (+x num,
  −x noutro) (confirmado em produção, out/2026).
- `TGFEST.ESTMIN` pode vir 0 em vez de nulo: usar `NVL(NULLIF(SUM(ESTMIN), 0), TGFPRO.ESTMIN)` (visto numa base,
  out/2026).
- Estoque mínimo e máximo por empresa: `TGFEMM`. No produto: `ESTMIN`, `ESTMAXQTD`, `ESTSEGQTD`/`ESTSEGDIAS`
  (segurança), `LEADTIME`, `CODPARCFORN` (fornecedor preferencial) (a validar: só visto no dicionário).
- Contagem de estoque: `TGFCTE` (data, empresa, produto, `QTDEST`). Uma base tinha linhas de "foto" mensal sem nota
  de inventário: conferir se há nota de inventário no mesmo mês antes de chamar de contagem (visto numa base,
  out/2026).

## O que baixa estoque

- `TGFTOP.ATUALEST`: B baixa, E entrada, R reserva, N não mexe (confirmado em produção, out/2026).
- `TGFITE.ATUALESTOQUE`: -1 baixa, 1 entra, 0 não mexe (confirmado em produção, out/2026).
- Pedido de venda com TOP `ATUALEST = 'B'` baixa estoque; com `R` só reserva (confirmado em produção, out/2026).
- Nota de produção (`TIPMOV = 'F'`): a TOP é E (entrada do acabado), mas o item de matéria-prima tem
  `ATUALESTOQUE = -1` (confirmado em produção, out/2026).
- Nota de inventário e de ajuste também tem `ATUALESTOQUE = -1`: separar pela TOP (confirmado em produção, out/2026).
- Serviço (`USOPROD = 'S'`) pode estar em TOP que baixa estoque, com custo sem sentido: tirar do consumo (visto numa
  base, out/2026).
- Regra de consumo que funcionou: item com `ATUALESTOQUE < 0` em `TIPMOV` V, Q, F ou P, TOP que não é reserva, sem
  inventário ou ajuste e sem serviço (validada em produção, out/2026).
- TOP com `ATUALEST = 'N'` (ex.: entrada de serviço de industrialização) não leva o valor ao custo de nenhum material
  (visto numa base, nov/2026).

## Produto, composição e unidades

- `TGFPRO.USOPROD`: R revenda, C consumo, I imobilizado, S serviço, M matéria-prima, 3 tarifa CIP (confirmado em
  produção, nov/2026); 2 produto intermediário (a validar).
- `TGFICP`: composição do produto; `VARIACAO` = receitas alternativas do mesmo produto (confirmado em produção,
  out/2026).
- Kit: `TGFPRO.CODCONFKIT`, com a configuração em `TSIKIT` (a validar: só visto no dicionário).
- `TGFVOA`: unidades alternativas. `DIVIDEMULTIPLICA` D divide e M multiplica a `QUANTIDADE` (confirmado em produção,
  out/2026).

## Custeio por absorção (CIP)

- Rotina nativa em quatro passos (ajuda do Sankhya, artigos 360044611094, 360045118873, 360044224293 e
  360044611074):
  1. Tarifas CIP (Produção › Cadastros): produto com `USOPROD = '3'`.
  2. Filtro para cálculo CIP: "Financeiros" (abas Natureza, CR e Filtro) ou "Lanç. Contábeis" (abas Contas
     Contábeis, CR, Projetos, Tarifas e "Perc. do valor a ser usado no custo").
  3. Apropriação de Custos Indiretos de Produção (CIP) (Produção › Rotinas), que grava em `TGFCUSTAR`.
  4. Recálculo de Custos (Comercial › Avançado), que leva o custo às produções do período.
- A tarifa entra no produto pelo Processo Produtivo › aba Produtos (PA) › sub-aba Tarifas CIP. O campo "Índice" é a
  quantidade por unidade e é o critério de rateio. A nota de produção recebe a tarifa como consumo, com valor 0
  (ajuda, artigo 360044611074; confirmado em produção, nov/2026).
- A tarifa no processo fica em `TPRTCA` (por atividade, `IDEFX`) e `TPRTPP` (por PA), as duas por versão do processo
  (`IDPROC`). Ela não aparece em `TPRLMP` nem em `TGFICP` (confirmado em produção, nov/2026).
- Tarifa incluída no processo só vale para OP lançada depois da nova versão (a validar).
- Ligação da tarifa com o filtro, no produto: `TGFPRO.CODFILTRO` (Financeiro), `CODFILTROCTA` (Lanç. Contábeis) e
  `CODFILTROREQ` (Requisições). Uma tarifa só aceita um tipo: financeiro e contábil juntos dá COM_E00036 (confirmado
  em base de teste, nov/2026).
- Cada tarifa tem um filtro de lançamento contábil, e o "Perc. do valor" é do filtro. O Sankhya não calcula esse
  percentual: ele é digitado (confirmado em base de teste, nov/2026).
- O mesmo CR em dois filtros exige a preferência `PERMITCRFILTCIP`. Sem a chave na `TSIPAR`, ela está desligada
  (a validar).
- A aba Filtro (Expressão) grava em `TSIFOR.FORMULAWEB` uma condição SQL a mais sobre os lançamentos (ex.:
  `ViewFinanceiro.PROVISAO = 'N'` no filtro financeiro). Deixar vazia quando contas, CR e empresa já estão nas abas
  (confirmado em base de teste, nov/2026).
- A conta de crédito da tarifa (aba Impostos) é `TGFPRO.CODCTACTB` e é creditada na contabilização da nota de
  produção (ajuda, artigo 360044608194; confirmado em base de teste, nov/2026).
- Filtro de Lanç. Contábeis: a "Referência" só aceita o dia 1º e inclui o mês final. Para um mês só, início = fim
  (ex.: 01/05 a 01/05) (confirmado em base de teste, nov/2026).
- Bug em aberto: com filtro de Lanç. Contábeis, o saldo devedor das contas de custo sai negativo, e o "Atualizar
  Custos" grava custo negativo na tarifa. Com Tip. Lançamento "Débito" continua negativo, e não há parâmetro de sinal.
  Contorno: corrigir o custo à mão na tela Atualização de Custos (Comercial › Rotinas) (versão 4.36b161, chamado
  aberto na Sankhya, nov/2026).
- Filtro de Financeiros: o custo sai positivo. Os títulos são lidos pela data de negociação (`DTNEG`), não pelo
  vencimento nem pela baixa. O "Período p/ filtrar financeiros" aceita data real, não só o dia 1º (confirmado em base
  de teste, nov/2026).
- O "Atualizar Custos" grava o custo previsto da tarifa em `TGFCUS` (7 tipos de custo), com data no 1º dia do mês
  (confirmado em base de teste, nov/2026).
- A apropriação divide o gasto do filtro pelas quantidades da tarifa consumidas no mês. O que pesa no produto é a
  proporção do índice entre os produtos, não o valor da hora apontada (confirmado em base de teste, nov/2026).
- O "Tipo" da conta contábil (`TCBPLA.RECDESP`, Receita/Despesa) não muda o sinal do CIP: só serve ao Planejamento
  Orçamentário Contábil (ajuda e tela, nov/2026).
- Ordem mensal pela ajuda: contabilizar o mês, apropriar o CIP, recalcular, contabilizar produção e vendas, fechar
  (ajuda do Sankhya, artigos 360044608194, 35855713859863 e 360046324753).
- O agendamento da contabilização precisa de "Usar custo". Contabilizar pela conta do produto não combina com rateio
  por CR na mesma TOP (ajuda do Sankhya, nov/2026).
- O filtro de Lanç. Contábeis soma só o lançamento com a conta e o CR do filtro. Para a folha entrar no CIP por setor,
  ela precisa ser contabilizada com CR (ajuda; confirmado em base de teste, nov/2026). Ver `folha-e-esocial.md`.

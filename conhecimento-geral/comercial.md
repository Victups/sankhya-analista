# Comercial: vendas, compras, faturamento, contratos e logística

## Tipo de movimento e TOP

- `TGFCAB.TIPMOV`: V venda, D devolução de venda, C compra, E devolução de compra, O pedido de compra, P pedido de
  venda, F produção (confirmado em produção, out/2026).
- `TGFCAB.STATUSNOTA`: L liberada (confirmada), A em aberto, P pendente (confirmado em produção, out/2026).
- `TIPMOV` não basta: V e C também são usados para inventário, ajuste, implantação de saldo, transferência, remessa,
  comodato, demonstração e NF de transporte. Classificar pela TOP (confirmado em produção, out/2026).
- Venda de fato = TOP com financeiro (`TGFTOP.ATUALFIN <> 0`) e sem bonificação
  (`NVL(TGFTOP.BONIFICACAO, 'N') <> 'S'`) (regra validada em produção, out/2026).
- `TGFTOP.ATUALULTIMACOMP` (atualiza última compra) não separa compra de transferência (visto numa base, out/2026).
- Restrições da TOP em `TGFREP` (`TIPREST` B local, E empresa, A parceiro...). A lista é dos valores permitidos; fora
  dela dá CORE_E02935 "Local 'X' não pode ser usado com a TOP Y" (ajuda do Sankhya, artigo 360043178914).

## Valores da nota

- Valor do item: `VLRTOT - NVL(VLRDESC, 0)`. Quantidade `QTDNEG`, entregue `QTDENTREGUE`. O item tem `VLRICMS`,
  `VLRIPI` e `VLRSUBST` (confirmado em produção, out/2026).
- Devolução vem com `VLRNOTA` e impostos positivos: aplicar `DECODE(TIPMOV, 'D', -1, 1)` (confirmado em produção,
  out/2026).
- Com retenção, `VLRNOTA` vem líquido (itens − retenções), em compra de serviço e em venda NFS-e. A retenção às vezes
  vira título próprio, às vezes não. Bruto = maior entre `VLRNOTA` e a soma de `VLRTOT - VLRDESC` dos itens (com IPI,
  frete ou ST a nota é maior que os itens) (confirmado em produção, out/2026).
- Impostos por item: `TGFDIN`, com `SEQUENCIA` = `TGFITE.SEQUENCIA`. A soma por item fecha com a nota (confirmado em
  produção, out/2026).
- `TGFDIN.CODIMP`: 1 ICMS, 2 ICMS ST, 3 IPI, 4 ISS, 6 PIS, 7 COFINS. O DIFAL fica em `TGFDIN.VLRDIFALDEST`, na linha
  do ICMS (conferido pelas alíquotas em produção, out/2026; a validar em cada base).
- `TGFIMC` é o cadastro de retenções: os nomes dela não valem para os códigos 1 a 7 da `TGFDIN`. Retenção não é
  imposto sobre faturamento (confirmado em produção, out/2026).
- PIS e COFINS da venda podem vir vazios no cabeçalho (`VLRPIS`, `VLRCOFINS`): usar a `TGFDIN` (visto numa base,
  out/2026).
- `TGFCAB.DTENTSAI` é a data de entrada na compra. Na nota de saída ela veio igual à emissão: não é data de entrega
  no cliente (visto numa base, out/2026).

## Cancelamento

- Nota cancelada sai da `TGFCAB`/`TGFITE` e vai para `TGFCAN` (`DTCANC`, `MOTCANCEL`) e `TGFCAB_EXC`/`TGFITE_EXC`
  (TOP e itens) (confirmado em produção, out/2026).
- `TGFCAN` também guarda pedidos e notas de compra excluídos: filtrar `TIPMOV` e TOP pela `TGFCAB_EXC`. A
  `TGFCAB_EXC` tem exclusões que não são cancelamento (confirmado em produção, out/2026).
- `NUNOTASUB` (nota substituta) pode vir sempre vazio: cancelamento seguido de reemissão conta nos dois lados (visto
  numa base, out/2026).

## Pedidos e compras

- `TGFVAR` liga pedido e nota item a item (`NUNOTAORIG`, `SEQUENCIAORIG` → `NUNOTA`, `SEQUENCIA`, `QTDATENDIDA`).
  Serve para ciclo, prazo de entrega e pedido de origem (confirmado em produção, out/2026).
- Pedido de compra pendente: `TIPMOV = 'O'` e `PENDENTE = 'S'` no cabeçalho e no item. Pendente =
  `QTDNEG - NVL(QTDENTREGUE, 0)` (confirmado em produção, out/2026).
- Previsão de entrega: `TGFCAB.DTPREVENT`. A do item (`TGFITE.DTINICIO`) pode vir vazia (visto numa base, out/2026).
- Comprador: `CODUSUCOMPRADOR` → `TSIUSU`. Pode vir sempre com o usuário padrão (SUP); nesse caso usar quem incluiu o
  pedido (`TGFCAB.CODUSU`) (visto numa base, out/2026).
- No cabeçalho: contrato `NUMCONTRATO`, cotação `NUMCOTACAO`, planejamento de compras `NUPCA`, frete `VLRFRETE`,
  `VLRFRETETOTAL`, `TIPFRETE` (a validar: só visto no dicionário).

## Cotação

- `TGFCOT`: cabeçalho (`NUMCOTACAO`, `CODEMP`, `DHINIC`, `DHFINAL`, `CODUSUREQ`, `SITUACAO`, `NUNOTAORIG`,
  `CODPROJ`) (a validar: só visto no dicionário).
- `TGFITC`: uma linha por produto e fornecedor (`PRECO`, `QTDCOTADA`, `MELHOR` S/N/I, `SITUACAO` A aprovado, R, P,
  `PRAZOENTREGA`, `FRETE`, `VLRDESC`). Linhas com `CABECALHO = 'S'` não têm preço (confirmado em produção, out/2026).
- O pedido gerado pela cotação fica em `TGFITC.NUNOTACPA`, não em `TGFCAB.NUMCOTACAO` (confirmado em produção,
  out/2026).

## Importação de XML

- `TGFIXN`: arquivos importados (`NUARQUIVO`, `NUNOTA` gerada). `STATUS` 0 pendente, 1 cancelado, 2 importado,
  3 inválido, 4 com divergência, 5 confirmado (confirmado em produção, out/2026).
- Local de estoque na importação: a TOP tem "Local padrão para importar XML" (`TGFTOP.CODLOCALIMPXML`). Sem ele, a
  sugestão segue a ordem: local do produto por empresa; "Local Padrão" das Preferências da Empresa (`TGFEMP.LOCALPAD`,
  Comercial › Preferências › Empresa, aba Estoque/Preço); último local digitado, local do parceiro remetente (se a TOP
  marcar) e o local da aba Geral do produto (`TGFPRO.CODLOCALPADRAO`) (ajuda do Sankhya, artigo 360045111993).
- Na compra, o local padrão do parceiro vem antes do da empresa (ajuda do Sankhya, artigo 360045111993).
- Local sugerido fora da restrição da TOP gerou a nota só com o cabeçalho, sem itens (visto em produção, out/2026;
  a validar a causa).

## Parceiros e empresas

- Cidade e UF: `TGFPAR.CODCID` → `TSICID`; `TSICID.UF` → `TSIUFS.CODUF` (sigla em `TSIUFS.UF`) (confirmado em
  produção, out/2026).
- `TGFPAR.CGC_CPF` = CNPJ ou CPF. O parceiro é empresa do grupo quando `TSIEMP.CODPARC = TGFPAR.CODPARC` ou
  `TSIEMP.CGC = TGFPAR.CGC_CPF` (confirmado em produção, out/2026).
- Regime da empresa: `TSIEMP.SIMPLES`, `CODREGTRIB` (3 = regime normal) e `CLASSTRIB` (visto numa base, nov/2026;
  a validar os códigos). Lucro real ou presumido não fica aí: perguntar à contabilidade.

## Projetos e contratos

- Projeto: `TCSPRJ`, árvore por `CODPROJPAI`; usar `ANALITICO = 'S'`. `CODPROJ = 0` = sem projeto. Vai na nota em
  `TGFCAB.CODPROJ` (confirmado em produção, out/2026).
- Projetos de serviço (etapas, equipe, linha de base): `TCSFAP`, `TCSFET`, `TCSFEQ`, `TCSEQP`, `TCSLBP`. RDO e
  apontamento de obra: `TAPMAP`, `TAPIAP`, `TAPEQJ`, `TAPEAP`, `TAPPAA`, `TAPVPJ` (a validar: só visto no dicionário).
- Contrato: `TCSCON` (`NUMCONTRATO`, `CODEMP`, `CODPARC`, `CODPROJ`, `DTCONTRATO`, `DTTERMINO`, `ATIVO`,
  `NUMCONTRATOORIGEM` = aditivo de, `TEMMED` = tem medição). Produtos e serviços do contrato em `TCSPSC`
  (`QTDEPREVISTA`, `VLRUNIT`). Medição padrão em `TCSMED`. Notas do contrato: `TGFCAB.NUMCONTRATO` e
  `TGFITE.NUMCONTRATO` (confirmado em produção, out/2026).
- Anexos (GED): `TSIANX`, por instância de tela (confirmado em produção, out/2026).
- Metas de venda: `TGFMET` e `TGMMET` (a validar: só visto no dicionário).

## Logística e frota

- MDF-e: `TGFMDFE` ← `TGFVIAG` (viagem; `CODVEIPRIN` → `TGFVEI`) ← `TGFNMDFE` (notas) ← `TGFEMDF` (eventos 110112
  encerramento, 110111 cancelamento) (confirmado em produção, out/2026).
- `STATUSMDFE` é texto: '0' não enviado, '3' autorizado, '4' rejeitado, '5' cancelado, '6' encerrado, '8' outro
  (visto numa base, out/2026; a validar).
- MDF-e autorizado e não encerrado há muito tempo é pendência, não viagem. O encerramento não é data de entrega
  (visto numa base, out/2026).
- Destino do MDF-e: `UFFINAL` → `TSIUFS`; `MUNFINAL` pode vir vazio (visto numa base, out/2026).
- Tabelas de entrega: ordem de carga `TGFORD`, planejamento `TGFPLAN`/`TGFPLAC`, apontamento `TGFAEC`, coleta e
  entrega por nota `TGFNCE`, romaneio `TGFROM`/`TGWROM`, ocorrências `TGFOCC`/`TGFMOP`, previsão de entrega `TGFDTP`
  (a validar: só visto no dicionário).
- Frota: `TGFVEI` (`CATEGORIA`, `TIPVEI`, `ESPVEI`, `MARCAMODELO`); controle de veículos `TGFCVE`; plano de
  manutenção `TGFEPP`; motoristas `TGFMOT`; rateio por veículo `TGFRAV` (a validar: só visto no dicionário).
- Km: `TGFCAB.KMVEICULO`, digitado na nota (ex.: combustível). Leitura com dígito a mais é comum: somar só avanços
  plausíveis entre leituras seguidas (visto numa base, out/2026).

## Comércio exterior (TCE*)

- `TCECAB` (processo, `NUIMP`): pedido de embarque `NUNOTAPEDIMP`, exportador `CODPARCEXP`, moeda `CODMOEDAPROD` →
  `TSIMOE`, taxa da DI `VLRMOEDAPROD`, `NUMDI`, `DTREGDI`, `DTDESEMBARACO`, nota de nacionalização `NUNOTANACIO`
  (confirmado em produção, out/2026).
- `TCEITE`: FOB em moeda (`VLRTOTALEMMOEDA`) e em R$ (`VLRTOTAL`), tributos por item (II, IPI, PIS, COFINS, ICMS,
  Siscomex, AFRMM), que batem com a `TCEDESP` (confirmado em produção, out/2026).
- `TCEDESP`: custos do processo, com linhas-modelo zeradas quando não há valor. `DTNEG` = data do pedido (confirmado
  em produção, out/2026).
- Containers: `TCECONT` (a validar: só visto no dicionário).

# Contabilidade (TCB*)

## Plano de contas

- `TCBEMP.CODEMPPLACTA`: empresa dona do plano de contas. Várias empresas podem usar o mesmo plano (confirmado em
  produção, out/2026).
- `TCBPLA`: a chave é só `CODCTACTB` (conta reduzida, única entre todos os planos). `TCBPLA.CODEMP` = dono do plano.
  `CTACTB` = código com máscara (ex.: `1.1.1.01.00001`). `CODCTACTBPAI` sempre preenchido (confirmado em produção,
  out/2026).
- Conta analítica: `ANALITICA = 'S'`. Não deduzir pelo `GRAU` nem pelo número de segmentos: há analíticas em graus
  intermediários, e o `GRAU` nem sempre acompanha o código (visto numa base, out/2026).
- A mesma `CTACTB` pode ter outro nome em outro plano: comparar empresas pelo código e mostrar a descrição de cada
  plano (visto numa base, out/2026).
- Conta de apuração ("resultado do exercício") tem débito igual a crédito no ano: não somar como resultado (visto
  numa base, out/2026).
- `TCBEMP.UTILCENCUS = 'S'`: a empresa usa CR na contabilidade (a validar).

## Lançamentos e saldos

- `TCBLAN`: chave `CODEMP, REFERENCIA, NUMLOTE, NUMLANC, TIPLANC, SEQUENCIA`. `TIPLANC` D = débito, R = crédito.
  `REFERENCIA` = 1º dia do mês. `DTMOV` sempre dentro do mês, sem hora (confirmado em produção, out/2026).
- `TCBSAL`: chave `CODEMP, CODCTACTB, CODCENCUS, CODPROJ, REFERENCIA`. Uma linha por conta analítica, CR, projeto e
  mês, inclusive zerada. Saldo final = `SALDOINICMES + DEBMES - CREDMES` (devedor positivo), igual ao
  `SALDOINICMES` do mês seguinte (confirmado em produção, out/2026).
- `TCBSAL` só vai até o último mês contabilizado de cada empresa. Saldo recente = último mês gravado + movimento da
  `TCBLAN` depois dele (confirmado em produção, out/2026).
- `TCBSAL` pode perder linhas sem acusar erro: um lote sumiu do saldo a partir do mês seguinte. Correção: Recomposição
  de Saldos (Contabilidade › Preferências › Empresa). Em relatório, calcular pelo movimento: `SALDOINICMES` do
  primeiro mês + D − C da `TCBLAN` (confirmado em produção, out/2026).
- `TCBSALEMP`: saldo por empresa destino (nativo). Pode estar vazia. O erro "ORA-20101: Não existe saldo, na tabela de
  saldos por empresa" se resolve pela recomposição em Contabilidade › Preferências › Empresa (ajuda do Sankhya).
- Histórico padrão: `TCBHIS.HISTORICO` por `CODHISTCTB` (confirmado em produção, out/2026).
- `TCBLOT.SITUACAO`: A aberto, F fechado. `TCBLOT.COMENTARIOS` mostra a origem do lote (ex.: folha, lote importado)
  (confirmado em produção, nov/2026).
- Zeramento de fim de exercício: lançamentos com o histórico "ZERAMENTO DE CONTAS" (`CODHISTCTB` 5 na base vista, a
  validar). DRE de período que pega o zeramento sai da `TCBLAN` sem esse histórico, não da `TCBSAL` (confirmado em
  produção, out/2026).
- Meta contábil: `TCBMET` (a validar: só visto no dicionário).

## Origem do lançamento

- `TCBINT` liga cada linha da `TCBLAN` à origem: `ORIGEM` E nota (`NUNICO` = `TGFCAB.NUNOTA`), B baixa e F título
  (`NUNICO` = `TGFFIN.NUFIN`), M movimento bancário (`NUNICO` = `TGFMBC.NUBCO`). Linha sem origem = lançamento manual
  (confirmado em produção, out/2026).
- O parceiro do lançamento vem da origem (`TGFCAB` ou `TGFFIN`). Movimento bancário (M) não tem parceiro (confirmado
  em produção, out/2026).
- Livro fiscal: `TGFLIV` (`ORIGEM` E = nota; mês do livro = `DHMOV`). Cruza com a contabilidade por
  `TCBINT (NUNICO, ORIGEM)`; há índices em `TGFLIV (DHMOV, CODEMP)` e `TCBINT (NUNICO, ORIGEM)` (confirmado em
  produção, out/2026).

## Regras de contabilização

- Regras por TOP em `TGFCTB` (tela Contabilização › Arquivos › TOP Contabilização). TOP sem regra não é contabilizada
  (confirmado em produção e em base de teste, nov/2026).
- Conta variável `PROD` = conta do produto (`TGFPRO.CODCTACTB`; há também `CODCTACTB2` a `CODCTACTB4`). O custo da
  saída costuma vir de `TGFCUSITE.CUSMEDSEMICM` (visto numa base, nov/2026).
- A ajuda manda definir as regras de contabilização com o contador (ajuda do Sankhya, nov/2026).
- Integração da folha: ver `folha-e-esocial.md`.

## Agendamentos de contabilização

- `TGFTAG` com `TIPOAGE = 'CTZ'`. `NUAGENDAMENTO` = `NUAGENDCTZ` das tabelas de histórico. O mesmo número existe em
  outros tipos (ex.: `LIV`, livro fiscal): sempre filtrar `TIPOAGE`. `TIPOEXEC` M manual, A automático (confirmado em
  produção, out/2026).
- `TCBHCT`: uma linha por execução. `ERROEXEC` (CLOB) guarda o erro e também o sucesso ("Contabilização concluída com
  sucesso!"). `QTDLANC*` vem zerado (confirmado em produção, out/2026).
- `TCBHLT`: execução → lotes gerados (`CODEMP, REFERENCIA, NUMLOTE`, chave da `TCBLOT`) (confirmado em produção,
  out/2026).
- `TCBERR`: pendências, uma linha por fórmula (o documento se repete). `ORIGEM` E nota, B baixa. A maioria é "fórmula
  igual a zero", que é só aviso (confirmado em produção, out/2026).
- Pendências comuns: parceiro, natureza ou conta bancária sem conta contábil, e "data fora do mês de referência".
  Filtro do agendamento com período mal informado dá "Favor informar Período dia a dia" (visto numa base, out/2026).

## Fechamento

- Tela Configuração Fechamento Contábil/Fiscal: 4 bloqueios (estoque/custo, financeiro, contábil, fiscal), periodicidade
  (dia fixo, último dia, quinzenal, 48h) e liberação por exceção. Depende da preferência `UTILZFECHACTB` (ajuda do
  Sankhya; visto no banco, out/2026).
- Triggers do fechamento: `TRG_INC_UPT_DLT_TGFCAB_FEC_CTB`, `TRG_INC_UPT_DLT_TGFFIN_FEC_CTB`,
  `TRG_INC_UPT_DLT_TGFCUS_FEC_CTB` e `SNK_BLOQUEIO_FECHAMENTO` (visto no banco, out/2026).

## Demonstrativos

- `TCBDMT` (hierarquia, por empresa e tipo `CODTDM`) + `TCBCDM` (contas de cada linha). Ordem em `NUORDEM`;
  `INDGRPDRE` R/D. Tipos vistos: 1 balanço, 2 DRE, 4 DFC (a validar os códigos). Conferir se a estrutura está completa
  antes de usar como DRE (visto numa base, out/2026).

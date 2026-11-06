# SQL e banco (Oracle do Sankhya)

Armadilhas de consulta que valem para qualquer base. Assuntos de área estão nos outros arquivos.

## Dicionário x banco

- Campo com `CALCULADO = 'S'` no dicionário de campos (`TDDCAM`) é virtual: só existe na tela e dá ORA-00904 no SQL.
  Usar só campo com `CALCULADO = 'N'` (confirmado em produção, out/2026).
- Calculados que costumam enganar: `TPRWCP.CAPACIDADEHORA`, `TPRIPROC.CODPRODPA`, `TPRIPROC.SALDOOP`,
  `TPRIPA.SALDOOP` (confirmados com ORA-00904 em produção, out/2026); `TCSCON.VALOR`, `TCSCON.VLRTOTAL`,
  `TCSCON.TOTNEG`, `TGFITC.MELHORPRECO`, `TGFITC.MELHORFORNEC`, `TGFITC.ULTVLRUNITCOMP` (a validar: só visto no
  dicionário).
- Total de cabeçalho marcado como calculado não existe no banco: somar os itens (confirmado em produção, out/2026).
- Campo ou view que está no dicionário nem sempre existe no banco. Ex.: a view `VGFLEADTIMECOMPRA` deu ORA-00942.
  Rodar a consulta antes de entregar (confirmado em produção, out/2026).
- As opções do campo (`TDDOPC`) não listam todo valor gravado. Ex.: `TGFPRO.USOPROD = '3'` (tarifa CIP) existe nos
  dados e não está nas opções. Conferir com `SELECT DISTINCT` antes de dizer que um valor não existe (confirmado em
  produção, nov/2026).
- O dono das tabelas do Sankhya costuma ser o usuário `SANKHYA` (a validar em cada instalação).

## Texto, acento e cliente SQL

- Literais e apelidos sem acento. Num cliente SQL usado com o Sankhya, o acento fez o cliente cortar o fim da
  consulta (ORA-00936 ou ORA-00923), porque a seleção é contada em bytes (visto num cliente, out/2026).
- Para casar texto acentuado, trocar a letra por `.` numa regex. Ex.: `REGEXP_LIKE(DESCR, 'N.O PARTICIP')`
  (confirmado em produção, out/2026).
- Executar a instrução no cursor (Ctrl+Enter) em vez de selecionar o texto à mão (visto num cliente, out/2026).
- Não terminar linha de comentário com `;`: alguns clientes entendem como fim da instrução (visto num cliente,
  out/2026).
- Descrições de cadastro (grupo de produto, parceiro, projeto) costumam ter acento: filtrar por código ou por regex
  com `.` (visto numa base, out/2026).
- O mesmo nome pode estar gravado com caixa diferente (ex.: cidade em `TSICID.NOMECID`): usar `UPPER` no SELECT e no
  GROUP BY (visto numa base, out/2026).

## Datas e períodos

- Período como intervalo `[INI, FIM)`: `DATA >= DATE 'AAAA-MM-DD' AND DATA < DATE 'AAAA-MM-DD'`, de preferência num
  CTE `periodo` (prática validada em produção, out/2026).
- Há colunas de data com hora em parte das linhas (ex.: `TGFMBC.DTLANC`): filtrar com `< fim + 1`, nunca com
  `<= fim` (confirmado em produção, out/2026).
- Há datas no futuro e datas de implantação: `TGFCAB.DTNEG` no ano seguinte, `TGFCUS.DTATUAL` em 01/01/1900 e em
  anos futuros, `TGFSBC` com linha de mês futuro quando há lançamento futuro. Sempre filtrar o período (confirmado em
  produção, out/2026).
- Feriados em `TSIFER`: os recorrentes têm `RECORRENTE = 'S'` e data no ano 1900 (casar por dia e mês); os móveis
  vêm por data; os estaduais por `CODUF`; os nacionais com `CODUF = 0` (confirmado em produção, out/2026).

## Ligações que enganam

- `TGFTOP` tem versões: ligar por `CODTIPOPER` e `TGFTOP.DHALTER = TGFCAB.DHTIPOPER` (confirmado em produção,
  out/2026).
- Juntar `TGFFIN` com `TGFITE` multiplica o valor pelo número de parcelas: somar por nota antes de juntar
  (confirmado em produção, nov/2026).
- Rateio (`TGFRAT`): usar a natureza, o CR e a parte do valor da linha de rateio. Com os campos do título, cada linha
  de rateio repete o título inteiro (confirmado em produção, out/2026).

## Desempenho

- `EXISTS` com `OR` avaliado linha a linha (ex.: parceiro do grupo por código ou por CNPJ) passou de 5 minutos. Uma
  CTE com a lista resolveu (confirmado em produção, out/2026).
- Regex sobre CLOB grande (ex.: `TSIGDG.CONFIG`) é lenta: filtrar antes com `INSTR(UPPER(col), nome)` e aplicar a
  regex só no que passou. Um `ROWNUM` na subconsulta impede o Oracle de juntar as duas etapas (confirmado em
  produção, out/2026).
- `USER_TAB_COLUMNS` já traz `NUM_NULLS`. Ler `USER_TAB_COL_STATISTICS` à parte custou cerca de 7 s (confirmado em
  produção, out/2026).
- Colunas CLOB (ex.: `TFPS1010.DATACHANGE`, `TCBHCT.ERROEXEC`) pesam: não selecionar sem necessidade (prática,
  out/2026).
- BLOB com texto (ex.: arquivo de relatório formatado) se lê com `TO_CLOB(coluna, 873, 'text/xml')` (873 = UTF-8)
  (confirmado em produção, out/2026).

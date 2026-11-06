-- Vendas e compras liquidas por empresa e mes (consulta geral do plugin; vale para qualquer Sankhya)
-- Regra do produto: venda = nota TIPMOV 'V' (devolucao de venda 'D', valor negativo); compra = 'C' (devolucao 'E').
-- So nota confirmada (STATUSNOTA 'L') cuja versao da TOP gera financeiro (ATUALFIN <> 0) e nao e bonificacao:
-- TIPMOV 'V' tambem traz remessa, ajuste e transporte sem financeiro. A TOP tem versoes: ligar por
-- CODTIPOPER + DHTIPOPER = DHALTER. Valor = soma dos itens (VLRTOT - VLRDESC); o VLRNOTA pode incluir impostos e
-- retencoes fora da mercadoria.
-- Ajustar na empresa: TOPs proprias que nao sao venda/compra de verdade (anotar em conhecimento/) e a data
-- (DTNEG = negociacao; DTFATUR ou DTENTSAI se a empresa fecha pelo faturamento ou pela entrada).
-- Validada numa base 4.36 (nov/2026). Rode na sua base (consultar_sql, base teste) antes de usar.
WITH periodo AS (SELECT DATE '2026-01-01' AS INI, DATE '2027-01-01' AS FIM FROM DUAL)
SELECT c.CODEMP,
       TRUNC(c.DTNEG, 'MM') AS MES,
       CASE WHEN c.TIPMOV IN ('V', 'D') THEN 'VENDA' ELSE 'COMPRA' END AS MOVIMENTO,
       COUNT(DISTINCT c.NUNOTA) AS NOTAS,
       ROUND(SUM(CASE WHEN c.TIPMOV IN ('D', 'E') THEN -1 ELSE 1 END * (i.VLRTOT - NVL(i.VLRDESC, 0))), 2) AS VALOR_LIQUIDO
  FROM TGFCAB c
  JOIN TGFTOP t ON t.CODTIPOPER = c.CODTIPOPER AND t.DHALTER = c.DHTIPOPER
  JOIN TGFITE i ON i.NUNOTA = c.NUNOTA
 CROSS JOIN periodo p
 WHERE c.TIPMOV IN ('V', 'D', 'C', 'E')
   AND c.STATUSNOTA = 'L'
   AND t.ATUALFIN <> 0
   AND NVL(t.BONIFICACAO, 'N') = 'N'
   AND c.DTNEG >= p.INI AND c.DTNEG < p.FIM
 GROUP BY c.CODEMP, TRUNC(c.DTNEG, 'MM'), CASE WHEN c.TIPMOV IN ('V', 'D') THEN 'VENDA' ELSE 'COMPRA' END
 ORDER BY 2, 1, 3

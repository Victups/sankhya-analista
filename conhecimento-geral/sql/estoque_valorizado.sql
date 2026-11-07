-- Estoque proprio valorizado pelo custo medio vigente, por empresa (consulta geral do plugin)
-- Regra do produto: saldo = TGFEST com TIPO 'P' (proprio), somado por empresa e produto. Custo = linha mais
-- recente da TGFCUS por empresa e produto com DTATUAL ate hoje (ha DTATUAL em 01/01/1900 e no futuro);
-- CUSSEMICM = custo medio sem ICMS, base do valor do estoque. Saldo negativo existe (saida antes da entrada):
-- fica contado a parte e fora do valor.
-- Ajustar na empresa: locais que nao sao estoque de verdade (terceiros, consignado) e produtos de servico.
-- Validada numa base 4.36 (nov/2026). Rode na sua base (consultar_sql, base teste) antes de usar.
WITH custo AS (
  SELECT u.CODEMP, u.CODPROD, u.CUSSEMICM,
         ROW_NUMBER() OVER (PARTITION BY u.CODEMP, u.CODPROD ORDER BY u.DTATUAL DESC) AS N
    FROM TGFCUS u
   WHERE u.DTATUAL <= SYSDATE
),
saldo AS (
  SELECT e.CODEMP, e.CODPROD, SUM(e.ESTOQUE) AS QTD
    FROM TGFEST e
   WHERE e.TIPO = 'P'
   GROUP BY e.CODEMP, e.CODPROD
)
SELECT s.CODEMP,
       SUM(CASE WHEN s.QTD > 0 THEN 1 ELSE 0 END) AS PRODUTOS_COM_SALDO,
       SUM(CASE WHEN s.QTD < 0 THEN 1 ELSE 0 END) AS PRODUTOS_NEGATIVOS,
       SUM(CASE WHEN s.QTD > 0 AND c.CUSSEMICM IS NULL THEN 1 ELSE 0 END) AS SEM_CUSTO,
       ROUND(SUM(CASE WHEN s.QTD > 0 THEN s.QTD * NVL(c.CUSSEMICM, 0) END), 2) AS VALOR_ESTOQUE
  FROM saldo s
  LEFT JOIN custo c ON c.CODEMP = s.CODEMP AND c.CODPROD = s.CODPROD AND c.N = 1
 WHERE s.QTD <> 0
 GROUP BY s.CODEMP
 ORDER BY s.CODEMP

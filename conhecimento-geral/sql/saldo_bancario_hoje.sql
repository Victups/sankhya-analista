-- Saldo de hoje por conta bancaria (consulta geral do plugin)
-- Regra do produto: TGFSBC tem uma linha por conta e mes com movimento; SALDOREAL = saldo no 1o dia do mes da
-- REFERENCIA. Saldo de hoje = SALDOREAL da ultima referencia ate o mes atual + movimento da TGFMBC desde ela
-- (RECDESP 1 entrada, -1 saida). SALDOBCO e so o conciliado: sem conciliacao em dia, fica parado.
-- A TGFMBC nao tem empresa: ela vem da conta (TSICTA.CODEMP).
-- Ajustar na empresa: conferir com o extrato de uma conta antes de usar em painel.
-- Campos conferidos no dicionario de uma base 4.36 (nov/2026). Rode na sua base (consultar_sql, base teste) antes de usar.
WITH ultima AS (
  SELECT s.CODCTABCOINT, s.REFERENCIA, s.SALDOREAL,
         ROW_NUMBER() OVER (PARTITION BY s.CODCTABCOINT ORDER BY s.REFERENCIA DESC) AS N
    FROM TGFSBC s
   WHERE s.REFERENCIA <= TRUNC(SYSDATE, 'MM')
),
movimento AS (
  SELECT m.CODCTABCOINT, SUM(m.VLRLANC * m.RECDESP) AS VALOR
    FROM TGFMBC m
    JOIN ultima u ON u.CODCTABCOINT = m.CODCTABCOINT AND u.N = 1
   WHERE m.DTLANC >= u.REFERENCIA AND m.DTLANC < TRUNC(SYSDATE) + 1
   GROUP BY m.CODCTABCOINT
)
SELECT c.CODEMP, u.CODCTABCOINT, c.DESCRICAO, u.REFERENCIA,
       ROUND(u.SALDOREAL, 2) AS SALDO_INICIO_MES,
       ROUND(NVL(mv.VALOR, 0), 2) AS MOVIMENTO_DESDE,
       ROUND(u.SALDOREAL + NVL(mv.VALOR, 0), 2) AS SALDO_HOJE
  FROM ultima u
  JOIN TSICTA c ON c.CODCTABCOINT = u.CODCTABCOINT
  LEFT JOIN movimento mv ON mv.CODCTABCOINT = u.CODCTABCOINT
 WHERE u.N = 1
 ORDER BY c.CODEMP, u.CODCTABCOINT

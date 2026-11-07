-- Titulos a pagar e a receber em aberto, por situacao e faixa de atraso (consulta geral do plugin)
-- Regra do produto: titulo = TGFFIN; RECDESP -1 pagar, 1 receber, 0 sem efeito (fica de fora). Em aberto = sem
-- DHBAIXA. PROVISAO = 'S' e previsao (pedido, nota nao confirmada): mostrar a parte, porque provisao vencida nao
-- some sozinha. Valor do titulo = VLRDESDOB.
-- Ajustar na empresa: naturezas que nao sao divida de verdade (transferencias, adiantamentos) e as empresas do grupo.
-- Validada numa base 4.36 (nov/2026). Rode na sua base (consultar_sql, base teste) antes de usar.
SELECT CASE f.RECDESP WHEN -1 THEN 'PAGAR' ELSE 'RECEBER' END AS TIPO,
       f.PROVISAO,
       CASE WHEN f.DTVENC >= TRUNC(SYSDATE) THEN '1 A VENCER'
            WHEN f.DTVENC >= TRUNC(SYSDATE) - 30 THEN '2 VENCIDO ATE 30 DIAS'
            WHEN f.DTVENC >= TRUNC(SYSDATE) - 90 THEN '3 VENCIDO DE 31 A 90 DIAS'
            ELSE '4 VENCIDO HA MAIS DE 90 DIAS' END AS SITUACAO,
       COUNT(*) AS TITULOS,
       ROUND(SUM(f.VLRDESDOB), 2) AS VALOR
  FROM TGFFIN f
 WHERE f.DHBAIXA IS NULL
   AND f.RECDESP IN (-1, 1)
 GROUP BY CASE f.RECDESP WHEN -1 THEN 'PAGAR' ELSE 'RECEBER' END, f.PROVISAO,
          CASE WHEN f.DTVENC >= TRUNC(SYSDATE) THEN '1 A VENCER'
               WHEN f.DTVENC >= TRUNC(SYSDATE) - 30 THEN '2 VENCIDO ATE 30 DIAS'
               WHEN f.DTVENC >= TRUNC(SYSDATE) - 90 THEN '3 VENCIDO DE 31 A 90 DIAS'
               ELSE '4 VENCIDO HA MAIS DE 90 DIAS' END
 ORDER BY 1, 2, 3

-- Admissoes e desligamentos por empresa e mes, so agregados (consulta geral do plugin)
-- Regra do produto: funcionario = TFPFUN (um registro por empresa e matricula). DTADM = admissao; DTDEM =
-- desligamento. Transferencia entre empresas gera desligamento numa e admissao na outra: SITUACAO 8 (a validar na
-- sua base: vista como transferencia numa base) fica separada para nao inflar o turnover.
-- Sem nome, CPF nem salario: so contagens.
-- Validada numa base 4.36 (nov/2026). Rode na sua base (consultar_sql, base teste) antes de usar.
WITH periodo AS (SELECT DATE '2026-01-01' AS INI, DATE '2027-01-01' AS FIM FROM DUAL),
eventos AS (
  SELECT f.CODEMP, TRUNC(f.DTADM, 'MM') AS MES, 'ADMISSAO' AS EVENTO
    FROM TFPFUN f CROSS JOIN periodo p
   WHERE f.DTADM >= p.INI AND f.DTADM < p.FIM
  UNION ALL
  SELECT f.CODEMP, TRUNC(f.DTDEM, 'MM'),
         CASE WHEN f.SITUACAO = '8' THEN 'TRANSFERENCIA' ELSE 'DESLIGAMENTO' END
    FROM TFPFUN f CROSS JOIN periodo p
   WHERE f.DTDEM >= p.INI AND f.DTDEM < p.FIM
)
SELECT CODEMP, MES, EVENTO, COUNT(*) AS QTD
  FROM eventos
 GROUP BY CODEMP, MES, EVENTO
 ORDER BY MES, CODEMP, EVENTO

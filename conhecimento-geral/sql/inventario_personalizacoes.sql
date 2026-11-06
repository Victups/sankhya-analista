-- Quanto a base tem de personalizacao e o que esta quebrado (consulta geral do plugin; detalhes na skill
-- personalizacao, referencia.md)
-- Regra do produto: botao TSIBTA, evento TSIEVP, acao agendada TSIAAG, regra de negocio TGFRNG, modulo Java TSIMOD,
-- tabela e campo adicional TDDTAB/TDDCAM (ADICIONAL = 'S'). Objeto invalido e trigger desabilitada vem do Oracle:
-- com usuario so de leitura, trocar USER_OBJECTS/USER_TRIGGERS por ALL_* com OWNER = dono das tabelas.
-- Use antes e depois de atualizar o Sankhya: o que ficou invalido ou desligado precisa de teste.
-- Campos conferidos no dicionario de uma base 4.36 (nov/2026). Rode na sua base (consultar_sql, base teste) antes de usar.
SELECT 'BOTAO DE ACAO' AS TIPO, COUNT(*) AS QTD FROM TSIBTA
UNION ALL SELECT 'EVENTO PROGRAMAVEL ATIVO', COUNT(*) FROM TSIEVP WHERE ATIVO = 'S'
UNION ALL SELECT 'ACAO AGENDADA ATIVA', COUNT(*) FROM TSIAAG WHERE ATIVO = 'S'
UNION ALL SELECT 'REGRA DE NEGOCIO ATIVA', COUNT(*) FROM TGFRNG WHERE ATIVO = 'S'
UNION ALL SELECT 'MODULO JAVA', COUNT(*) FROM TSIMOD
UNION ALL SELECT 'TABELA ADICIONAL', COUNT(*) FROM TDDTAB WHERE ADICIONAL = 'S'
UNION ALL SELECT 'CAMPO ADICIONAL', COUNT(*) FROM TDDCAM WHERE ADICIONAL = 'S'
UNION ALL SELECT 'OBJETO INVALIDO NO BANCO', COUNT(*) FROM USER_OBJECTS WHERE STATUS = 'INVALID'
UNION ALL SELECT 'TRIGGER DESABILITADA', COUNT(*) FROM USER_TRIGGERS WHERE STATUS = 'DISABLED'

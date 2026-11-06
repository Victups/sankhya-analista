// Trava de leitura do MCP oracle: so SELECT/WITH, sem funcao do banco, sem db link. Funcao pura, sem banco.

// Funcoes nativas do Oracle liberadas. Funcao do esquema ou de pacote pode gravar em transacao autonoma
// (o SET TRANSACTION READ ONLY nao alcanca): fica bloqueada.
const FUNCOES = new Set(`ABS ACOS ADD_MONTHS ASCII ASCIISTR ASIN ATAN ATAN2 AVG BITAND CARDINALITY CAST CEIL CHR COALESCE
  COLLECT CONCAT CORR COS COUNT COVAR_POP COVAR_SAMP CUBE CUME_DIST DECODE DENSE_RANK DUMP EXP EXTRACT EXTRACTVALUE
  FIRST_VALUE FLOOR FROM_TZ GREATEST GROUPING GROUPING_ID HEXTORAW INITCAP INSTR JSON_ARRAY JSON_ARRAYAGG JSON_OBJECT
  JSON_OBJECTAGG JSON_QUERY JSON_TABLE JSON_VALUE LAG LAST_DAY LAST_VALUE LEAD LEAST LENGTH LISTAGG LN LNNVL LOG LOWER LPAD
  LTRIM MAX MEDIAN MIN MOD MONTHS_BETWEEN NANVL NEW_TIME NEXT_DAY NLSSORT NLS_LOWER NLS_UPPER NTH_VALUE NTILE NULLIF
  NUMTODSINTERVAL NUMTOYMINTERVAL NVL NVL2 ORA_HASH PERCENT_RANK PERCENTILE_CONT PERCENTILE_DISC POWER RANK RATIO_TO_REPORT
  RAWTOHEX REGEXP_COUNT REGEXP_INSTR REGEXP_LIKE REGEXP_REPLACE REGEXP_SUBSTR REMAINDER REPLACE ROLLUP ROUND ROW_NUMBER RPAD
  RTRIM SIGN SIN SOUNDEX SQRT STANDARD_HASH STDDEV STDDEV_POP STDDEV_SAMP SUBSTR SUM SYS_CONTEXT SYS_EXTRACT_UTC TAN
  TO_BINARY_DOUBLE TO_CHAR TO_CLOB TO_DATE TO_DSINTERVAL TO_NCHAR TO_NUMBER TO_TIMESTAMP TO_TIMESTAMP_TZ TO_YMINTERVAL
  TRANSLATE TRIM TRUNC TZ_OFFSET UNISTR UPPER VAR_POP VAR_SAMP VARIANCE VSIZE WIDTH_BUCKET XMLAGG XMLCAST XMLELEMENT
  XMLFOREST XMLQUERY XMLSERIALIZE`.split(/\s+/));
// Palavras do SQL que vem antes de "(" e tipos de dado do CAST.
const PALAVRAS_SQL = new Set(`ALL AND ANY AS BETWEEN BY CASE DISTINCT ELSE ESCAPE EXISTS FOR FROM GROUP HAVING IN INTERSECT IS
  JOIN KEEP LATERAL LIKE MINUS NOT ON OR ORDER OVER PARTITION PIVOT PRIOR SELECT SETS SOME THEN UNION UNPIVOT USING VALUES WHEN
  WHERE WITH WITHIN CHAR DAY DECIMAL FLOAT INT INTEGER INTERVAL MONTH NCHAR NUMBER NVARCHAR2 RAW SECOND TIMESTAMP VARCHAR
  VARCHAR2 YEAR`.split(/\s+/));

// Devolve o SQL pronto para executar (sem ";" final) ou lanca erro se nao for leitura.
export function validarSql(sql) {
  const texto = String(sql ?? '').trim().replace(/;\s*$/, '').trim();
  const semComentarios = texto.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ').trim();
  if (!semComentarios) throw new Error('Consulta vazia.');
  const codigo = semComentarios.replace(/'[^']*'/g, "''"); // sem o conteudo dos literais
  if (codigo.includes(';')) throw new Error('Envie uma instrucao por vez (sem ";" no meio).');
  if (!/^(SELECT|WITH)\b/i.test(codigo)) throw new Error('So e permitido SELECT ou WITH.');
  if (/\bFOR\s+UPDATE\b/i.test(codigo)) throw new Error('FOR UPDATE nao e permitido.');
  const proibida = codigo
    .match(/\b(INSERT|UPDATE|DELETE|MERGE|UPSERT|CREATE|ALTER|DROP|TRUNCATE|RENAME|GRANT|REVOKE|COMMIT|ROLLBACK|SAVEPOINT|LOCK|EXECUTE|EXEC|CALL|BEGIN|DECLARE|PURGE|FLASHBACK|ANALYZE|AUDIT|COMMENT)\b/i);
  if (proibida) throw new Error(`Palavra nao permitida: ${proibida[1].toUpperCase()}. So consulta (SELECT).`);
  if (/^WITH\b[\s\S]*\b(FUNCTION|PROCEDURE)\b/i.test(codigo)) {
    throw new Error('WITH FUNCTION/PROCEDURE nao e permitido.');
  }
  if (codigo.includes('@')) throw new Error('Db link (@) nao e permitido.');
  // pacote.funcao(...) pode gravar em transacao autonoma: bloqueado (o "(+)" de outer join passa)
  if (/\b[A-Z_][\w$#]*\s*\.\s*[A-Z_][\w$#]*\s*\((?!\s*\+\s*\))/i.test(codigo) || /"\s*\(/.test(codigo)) {
    throw new Error('Chamada de funcao de pacote nao e permitida (pode ter efeito colateral).');
  }
  for (const [, nome] of codigo.matchAll(/(?<![\w$#."])([A-Z_][\w$#]*)\s*\((?!\s*\+\s*\))/gi)) {
    const n = nome.toUpperCase();
    if (!FUNCOES.has(n) && !PALAVRAS_SQL.has(n)) {
      throw new Error(`Funcao ${n} nao e permitida: so funcoes nativas do Oracle (funcao do banco pode gravar). `
        + 'Se for nome de CTE com lista de colunas, use apelidos dentro do SELECT.');
    }
  }
  return texto;
}

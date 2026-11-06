# Produção

Custeio da produção (tarifas CIP, apropriação, recálculo) está em `custos-e-estoque.md`.

- O produto da OP vem de `TPRIPA`. `TPRIPROC.CODPRODPA` e `SALDOOP` são calculados e não existem no banco
  (confirmado em produção, out/2026).
- A capacidade do centro de trabalho (`TPRWCP.CAPACIDADEHORA`) é calculada: não dá para ler por SQL (confirmado em
  produção, out/2026).
- Lista de materiais do processo: `TPRLMP` (`CODPRODPA`, `CODPRODMP`), ligada pela atividade (`IDEFX`) e pela versão
  do processo (`IDPROC`) (confirmado em produção, nov/2026).
- Cada alteração do processo produtivo gera uma versão nova (`IDPROC`). Conferir qual é a vigente antes de comparar
  lista de materiais ou tarifas (confirmado em produção, nov/2026).
- O processo tem a marca de produção por terceiros (`USATERCEIRO`) (visto numa base, nov/2026).
- A nota de produção (`TIPMOV = 'F'`) dá entrada no acabado, baixa as matérias-primas e recebe as tarifas CIP como
  consumo, com valor 0 (confirmado em produção, nov/2026).
- A nota de produção só é contabilizada se a TOP tiver regra em `TGFCTB` (confirmado em produção, nov/2026).
- Produto intermediário: o acabado consome o intermediário pela lista de materiais, e o intermediário tem OP própria
  (visto numa base, nov/2026).
- Recursos de mão de obra do centro de trabalho: `TPRCRE` (categorias), `TPRRXW` (recursos por centro) e `TPRARW`
  (apontamento de recursos) (a validar: só visto no dicionário).
- OEE: `TPROEE` (a validar: só visto no dicionário).
- OP aberta e apontada no mesmo momento não mede tempo de produção nem carteira a produzir: conferir as datas antes de
  usar tempo médio ou "a produzir" (visto numa base, out/2026).

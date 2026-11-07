# Governança: dicionário, personalizações, logs e atualização

## Dicionário e personalizações

- Dicionário: `TDDTAB` (tabelas), `TDDCAM` (campos, com `CALCULADO`), `TDDOPC` (opções de campo), `TDDINS`
  (instâncias, ou seja, telas) (a validar: só visto no dicionário).
- Tabela adicional (`AD_`) costuma aparecer também como tela em `TDDINS` (visto numa base, out/2026).
- O campo "Ativo" existe em `TDDINS`, `TSIEVP` (eventos programáveis), `TSIAAG` (ações agendadas) e `TSIGDG`
  (dashboards). `TSIRFE` (relatórios) e `TSIBTA` (botões) não têm (confirmado em produção, out/2026).
- Relatório formatado: `TSIRFE.CONFIG` vem vazio. O arquivo fica em `TSIRFA.ARQUIVOBIN` (BLOB), não em `ARQUIVO`
  (confirmado em produção, out/2026).
- Botão: `TSIBTA.CONFIG` guarda a chamada (`dbCall name="..."` para procedure, `javaCall className="..."` para
  rotina Java) (confirmado em produção, out/2026).
- O uso de dashboard e de relatório não é registrado. `TSILRE` é log de alteração de relatório; `TSILAC` e `TSIRLG`
  são log de acesso. Só dá para medir a última alteração (`DHALTER`) (confirmado em produção, out/2026).
- Sinais firmes de "sem uso": Ativo = N; trigger desligada; inválido antigo que nada chama; botão ou relatório de tela
  desativada; tabela `AD_` vazia (`NUM_ROWS = 0` sem `INSERTS` em `USER_TAB_MODIFICATIONS`); campo `AD_` sempre
  vazio (`USER_TAB_COLUMNS.NUM_NULLS = USER_TABLES.NUM_ROWS`). Dashboard antigo e procedure sem chamador visível
  podem estar em uso (prática, out/2026).
- Origem de uma mensagem de bloqueio: as do núcleo do Sankhya trazem `[CORE_Exxxxx]` (ex.: `CORE_E04176` estoque
  insuficiente, `CORE_E02496` jrxml inválido) (Central de Ajuda, jul/2026). Texto sem código pode ser regra de negócio,
  evento programável, trigger/procedure ou extensão Java: o código ausente não prova que é personalização.
- Regras de negócio (Configurações › Avançado): `TGFRNG` (regra: `ATIVO`, `TIPOEXPRESSAO`, `ONDE`, `QUANDO`, `EVENTO`,
  `EXPRESSAO` = nome da procedure) e `TGFTRN` (regra por TOP, `SEQEXEC` = ordem). Só procedure está implementada;
  script não. Regra sem evento de liberação cancela a operação; com evento, gera pedido de liberação
  (Central de Ajuda "Regras de Negócio", jul/2026; tabelas e campos confirmados no dicionário, nov/2026).
- Trigger existente numa tabela não indica personalização: as tabelas centrais têm dezenas de triggers do próprio
  Sankhya, e a mensagem "estoque insuficiente" existe em procedure e trigger nativas (visto numa base, nov/2026).
  Achar o texto da mensagem no código (`ALL_SOURCE`, que aceita `LIKE`) diz de que objeto ela vem, não que ele é
  personalização. `ALL_OBJECTS.CREATED` só ajuda em base que não foi recriada por cópia (numa base recriada, todos os
  objetos têm a mesma data). A mensagem de um evento Java fica no código compilado e não aparece no banco.
- Ordem de execução entre trigger Oracle, regra de negócio e evento Java: sem fonte (a validar).
- Busca por texto em personalizações: `TSIGDG.CONFIG` (gadget, XML), `TSIDSB.LAYOUT`, `TSIBTA.CONFIG`, `TSIEVP.CONFIG`,
  `TGFRNG.CONFIG`, `TSIAAG` (`ACAO`, `EXPGATILHO`, `FONTEDADOS`) são texto e aceitam `UPPER(...) LIKE`; o texto de
  view (`ALL_VIEWS.TEXT`) é `LONG` e não aceita: use `ALL_DEPENDENCIES` (visto numa base, nov/2026).

## Objetos do Oracle

- `USER_OBJECTS.LAST_DDL_TIME` muda com qualquer DDL: `CREATE OR REPLACE`, recompilação e GRANT/REVOKE. Não prova que
  o código mudou. `TIMESTAMP` muda quando o objeto é compilado. A causa de um inválido está em `USER_ERRORS`
  (confirmado em produção, out/2026).
- Procedure inválida recompilada de hora em hora, sem job no banco, indica o Sankhya (Java) tentando executá-la.
  "Sem chamador no banco" não quer dizer "sem uso" (visto em produção, out/2026).
- Objeto inválido pode ser chamado por dashboard: procurar o nome no SQL de `TSIGDG.CONFIG` (confirmado em produção,
  out/2026).
- Personalização quebrada por atualização não aparece por data: a procedure invalidada mantém a data de alteração.
  Comparar a base de teste já atualizada com a produção ainda na versão antiga (prática, nov/2026).
- O próprio Sankhya cria objetos ao atualizar (ex.: tabelas `TTK*`, views, triggers `TRG_TFP*_LOGALT`). "Criado
  depois do refresh" não prova que é personalização (visto em produção, out/2026).
- Atualização mexe em objetos do banco (recompila triggers), não só acrescenta (visto em produção, out/2026).

## Sessões e usuários

- `TSIRLG`: uma linha por sessão; `LOGOUT` nulo = sessão aberta (confirmado em produção, out/2026). `EVENTO` tem L,
  F, B e D (a validar o significado).
- `TSIUSU` não marca consultor: identificar pelo e-mail (domínio externo ou vazio) e confirmar com a TI (visto numa
  base, out/2026).
- `V$SESSION` pode ser legível pelo usuário do Sankhya. O servidor de aplicação aparece como "JDBC Thin Client";
  outra máquina é conexão direta (visto numa base, out/2026).
- A data do refresh de uma base de teste é o `USER_USERS.CREATED` do esquema de teste (visto numa base, out/2026).

## Base de teste

- Base de teste copiada da produção não fica isolada: NF-e (`TGFEMP.NFE` = 1), NFS-e, Reinf (`AMBIENTEREINF` = 1) e
  eSocial (`TFPEMP.TPAMBESOCIAL` = 'P') continuam em produção (confirmado em base de teste, out/2026).
- A única trava nativa é o tipo da base (Administração do Servidor › Registro de Base de Dados › Tipo). Com Tipo =
  Teste, a emissão de NF-e/NFC-e em produção é bloqueada (CORE_E05561; ajuda do Sankhya, artigo 360052449293). Esse
  tipo não fica na `TSIPAR`: conferir na tela.
- O refresh do teste troca a `TSIPAR` e o log de preferências pelos da produção, e o histórico do teste se perde
  (visto numa base, out/2026).

## Versão e atualização

- Versão do sistema: `TSIPAR` chave `VERSAOSKWBIN` (texto "Versão sistema: ...") ou `ULTIMASKWVER` (só o número).
  Versão dos módulos: só na tela de versões; `VERSAOMODULOBIN` pode estar desatualizado. Console do eSocial:
  `VERSESOCIALBIN` (confirmado em produção, out/2026).
- Histórico de versões: log da `ULTIMASKWVER` na `TSIPARLGT` (usuário vazio = atualização). Volta de versão aparece
  como número menor (confirmado em produção, out/2026).
- Atualização de módulo pelo WPM não aparece no log de preferências (confirmado em produção, out/2026).
- A troca de versão mexeu só em chaves de controle: `OWNMIGRHASH`, `VERSAOSKWDD` e `VERSAOSKWBIN` (apagadas e
  recriadas), `ULTIMASKWVER`, `SANWCOREVER`, `HASHPKGURLS`, `HASHVERSISMOD1`, `HASHAMBIENTE` (visto numa atualização,
  out/2026).
- WPM: atualizar sem usuários conectados, senão dá ORA-00054. O log fica na aba Configurações (ajuda do Sankhya,
  artigos 21238784689943 e 360044616533).
- Boas práticas do Pessoal+: atualizar fora do expediente, com ponto de restauração, e validar os processos depois
  (ajuda do Sankhya, artigo 43674370783383).
- Restaurar a produção no teste sem igualar a versão dos binários dá "Divergência entre dicionário de dados e arquivos
  binários" (ajuda do Sankhya, artigo 4410489682455).
- A ajuda não traz roteiro de homologação nem de rollback de atualização (busca na ajuda, out/2026).

## Preferências (TSIPAR) e log

- `TSIPARLGT` é o log das preferências. Guarda só UPDATE e DELETE: `DHACAO`, `USUARIOSIS` (vazio = processo do
  sistema), `CHAVE` no formato `PK [CHAVE=X][CODUSU=n]`, `CAMPO`, `VELHO` e `NOVO`. Inclusão não fica no log
  (confirmado em produção, out/2026).
- Quem grava o log é o trigger nativo `TRG_TSIPAR_LOG` (BEFORE UPDATE OR DELETE na `TSIPAR`) (confirmado em produção,
  out/2026).
- Chaves que mudam sozinhas (ruído): `tSEBRA97#P@`, `CONFIGURACAOMDE`, `ULTCARENV`, `AGSTATDT-4`, `HASHPKGURLS`.
  Internas: `MAXKEY_*`, `DHSERVACESSO`, `DESCSERVACESSO`. Por usuário: `SHOWACCOUNT`, `WORKWALLPAPER` (visto em
  produção, out/2026).
- Preferências citadas nesta pasta: `DIASLIMALTCUSTO`, `PERMITCRFILTCIP`, `UTILZFECHACTB`, `FPRELATHOLERITE`,
  `FPRELATS5011`, `FPRELATS5012`, `VERSESOCIALBIN`, `VERSAOSKWBIN`, `ULTIMASKWVER`.

## O que mudou desde uma data

- Colunas de alteração: `TGFTOP.DHALTER`, `TFPEVE.DTALTER`, `TFPEBA.DTALTER`, `TFPFAI.DTALTER`, `TGFNAT.DHALTER`
  (TIMESTAMP), `TSIEMP.DHALTER` e `TFPEMP.DHALTER`. Só `TGFTOP`, `TFPEVE`, `TSIEMP` e `TFPEMP` têm `CODUSU`. As
  Preferências da Empresa (`TGFEMP`) não têm data de alteração (confirmado em produção, out/2026).
- Nem toda tela atualiza a data ao salvar: `TFPFIS.DTALTER` não muda, e `TFPEVE.DTALTER` não muda para alguns
  campos (confirmado em produção, out/2026).

## Dashboards (gadgets)

- `TSIGDG.CONFIG` é XML: `<prompt-parameters>` + `<level>` com `<grid>`/`<chart>` e
  `<expression type="sql" data-source="MGEDS">`. Parâmetro no SQL: `:NOME` (confirmado em produção, out/2026).
- Período com `metadata="datePeriod"` vira `:PERIODO.INI` e `:PERIODO.FIN`; empresa `metadata="entity:Empresa@CODEMP"`;
  CR `entity:CentroResultado@CODCENCUS`; `metadata="boolean"` devolve 'S'/'N' (confirmado em produção, out/2026).
- Os parâmetros do prompt valem em todos os níveis. Drill-down: `<on-click navigate-to>` com `<param>` e, no nível de
  destino, `<args>` (integer, text, date) (confirmado em produção, out/2026).
- Abrir a nota a partir do dashboard: `<on-click-launcher resource-id="br.com.sankhya.com.mov.CentralNotas">` com
  `<NUNOTA>$NUNOTA</NUNOTA>` (confirmado em produção, out/2026).
- A página de dashboard HTML5 é servida em ISO-8859-1: caractere fora do Latin-1 (ex.: "→") vira "?". Usar "»" ou
  "·" (visto em produção, out/2026).
- Consulta com colchetes (`LIKE '%[...]%'`) devolveu no gadget uma linha sem colunas e funcionou direto no Oracle.
  Trocar por `INSTR` e `CHR(93)` (suspeita, a validar).

## Telas

- Link direto para uma tela: `.../mge/system.jsp#app/` + o identificador do recurso em base64 (confirmado em
  produção, out/2026).
- Recursos vistos: `br.com.sankhya.com.mov.CentralNotas` (Central de Notas),
  `br.com.sankhya.fin.cad.movimentacaoFinanceira` (Movimentação Financeira),
  `br.com.sankhya.rh.configuracao.arquivo.de.remessa` (remessa da folha) e
  `br.com.sankhya.configuracao.arquivo.remessa` (remessa do Financeiro) (confirmado em produção, out/2026).
- `TSICFG` guarda configuração de tela por usuário (ex.: estado dos filtros) (confirmado em produção, nov/2026).

# Referência de personalizações do Sankhya

Escrita a partir da documentação pública do Sankhya e conferida no dicionário de dados de uma base 4.36
(nov/2026). "ajuda N" = `https://ajuda.sankhya.com.br/hc/pt-br/articles/N`; "portal X" =
`https://developer.sankhya.com.br/docs/X`. Os SELECTs são só de leitura; troque `<...>` pelo valor. Os códigos
(TIPO, TIPOACAO etc.) vêm da `TDDOPC` dessa base.

Com usuário de banco só de leitura, `ALL_SOURCE` e `ALL_TRIGGERS` podem vir vazios: o DBA dá `SELECT_CATALOG_ROLE`
e as consultas usam `DBA_SOURCE` e `DBA_TRIGGERS` no lugar.

## Vale para todos os tipos

- **Autorização de Customizações** (Configurações › Avançado; a partir da 4.21/4.23): se ligada no servidor, nenhuma
  customização roda sem liberação por código enviado por e-mail, nem a do SUP. Qualquer alteração revoga a liberação, e
  ela não fica no banco: a base de teste restaurada pede liberação de novo. Erro: `[CORE_E07833] ... exige autorização
  pelo administrador do sistema` (ajuda 21517622604567, 24390545630871, 36069299048471).
- **Peso das customizações:** Configurações › Relatórios › Sumarização de Customizações (4.35+), parâmetros
  `TELEMTLIMITE` e `PTELEMTLIMITE` (ajuda 35626348720023). Tabela `TSITCM` (TIPO, DESCRICAO, ENTIDADE, PROCESSO,
  QTDCOLETA, QTDERROS, TEMPOMEDIO, TEMPOTOTAL, DHEXECUCAO); a ligação com a tela é dedução pelos campos.
  ```sql
  SELECT TIPO, DESCRICAO, ENTIDADE, PROCESSO, QTDCOLETA, QTDERROS, TEMPOMEDIO, TEMPOTOTAL, DHEXECUCAO
    FROM TSITCM WHERE DHEXECUCAO >= DATE '<AAAA-MM-DD>' ORDER BY TEMPOTOTAL DESC FETCH FIRST 30 ROWS ONLY
  ```
- **Levar para outro ambiente:** Construtor de Telas › Exportar/Importar Metadados (leva tabela, adicionais, ações
  e os .jar). Na reimportação, ação JavaScript não é atualizada: excluir antes. Menu do Sistema › Exportar/Importar
  módulo leva também triggers de tabelas AD_ (ajuda 360044597974, 360045112053).
- **Suporte:** personalização é de quem criou (empresa ou parceiro), não do Service Desk (ajuda 4408645708823).
- **Tela personalizada:** "menu.adicional" no ID da tela (Configurar Tela) (ajuda 4408645708823).

## Botão de ação (aba "Ações")

- **Quando:** a pessoa dispara sobre os registros selecionados (menu Ações da tela). Validação ou gatilho automático
  vai para evento ou regra de negócio (ajuda 360045111093; portal 05_action_button).
- **Onde se cria:** Dicionário de Dados › tabela › aba Ações (tabela nativa) ou Construtor de Telas › Ações (tabela
  adicional). Campos: descrição, tipo, rotina ou módulo + classe, "Depois de executar, recarregar", "Controle de
  transação manual", parâmetros, "Controla Acesso", "Filtro de Telas" (ajuda 360044597294, 360045110493).
- **Tabela:** `TSIBTA` (IDBTNACAO, DESCRICAO, TIPO, NOMEINSTANCIA, RESOURCEID, CONFIG, CODMODULO, ORDEM,
  CONTROLAACESSO, TECLAATALHO). TIPO: `SP` procedure, `RJ` Java, `SC` JavaScript, `LC` lançador. Liga à tela por
  `TDDINS.NOMEINSTANCIA` e ao módulo por `TSIMOD.CODMODULO`.
- **CONFIG** (CLOB, XML `<actionConfig>`; formato visto numa base, não documentado):
  - procedure: `<dbCall name="<PROCEDURE>" refreshType="ALL" txManual="false" rootEntity="<INSTANCIA>"/>`
  - Java: `<javaCall codModulo="<n>" className="<pacote.Classe>" entityName="<INSTANCIA>" refreshType="SEL" txManual="false"/>`
  - JavaScript: `<runScript entityName="<INSTANCIA>" refreshType="SEL" txManual="false"><![CDATA[ ...script... ]]></runScript>`
  - lançador: `<laucher resourceID="<id.da.tela>"/>` (grafado assim) com `<params><param localField="X" targetField="Y"/></params>`
  - parâmetros digitados ficam em `<params>`.
  ```sql
  SELECT B.IDBTNACAO, B.DESCRICAO, B.TIPO, B.NOMEINSTANCIA, I.NOMETAB, B.CODMODULO, B.CONTROLAACESSO, B.ORDEM
    FROM TSIBTA B LEFT JOIN TDDINS I ON I.NOMEINSTANCIA = B.NOMEINSTANCIA
   WHERE I.NOMETAB = '<TABELA>' ORDER BY B.NOMEINSTANCIA, B.ORDEM
  -- quem chama uma procedure ou classe (ajuda 33884091184279)
  SELECT IDBTNACAO, DESCRICAO, NOMEINSTANCIA FROM TSIBTA WHERE CONFIG LIKE '%<NOME>%'
  SELECT IDBTNACAO, CONFIG FROM TSIBTA WHERE IDBTNACAO = <ID>
  ```
- **Procedure** (ajuda 360045111093): `(P_CODUSU NUMBER, P_IDSESSAO VARCHAR2, P_QTDLINHAS NUMBER, P_MENSAGEM OUT
  VARCHAR2)`; o texto de `P_MENSAGEM` aparece no fim. Parâmetros digitados: `ACT_TXT_PARAM`, `ACT_INT_PARAM`,
  `ACT_DEC_PARAM`, `ACT_DTA_PARAM` `(P_IDSESSAO, 'NOME')`. Linhas selecionadas: `ACT_TXT_FIELD`, `ACT_INT_FIELD`,
  `ACT_DEC_FIELD`, `ACT_DTA_FIELD` `(P_IDSESSAO, I, 'CAMPO')`, I de 1 a `P_QTDLINHAS`. Pergunta: `ACT_ESCOLHER_SIMNAO
  (titulo, texto, P_IDSESSAO, sequencia)` devolve 'S'/'N'; `ACT_CONFIRMAR` com os mesmos argumentos. Em tela detalhe,
  a PK do mestre vem como parâmetro `MASTER_<CAMPO>`. Os exemplos desse artigo têm erros de digitação: não copiar.
- **JavaScript** (roda no servidor; sem `alert` nem `window`): `linhas` (registros), `linhaPai`, `mensagem`;
  `getParam`, `novaLinha`, `confirmar`, `confirmarSimNao`, `mostraErro`, `email`, `getQuery` (`nativeSelect` com
  `{PARAM}` + `setParam`, `next`, `getString`... `close`), `newJava`; registro com `getCampo`, `setCampo`, `save`,
  `remove` (ajuda 360045111093, 360045110493).
- **Java:** `br.com.sankhya.extensions.actionbutton.AcaoRotinaJava.doAction(ContextoAcao)`; `ContextoAcao` com
  `getLinhas()`, `getParam()`, `getQuery()`, `novaLinha("TABELA")`, `confirmar`, `mostraErro`,
  `setMensagemRetorno`. Biblioteca pelo botão "Baixar biblioteca de extensões" (tipo Rotina Java). Transação manual
  com `JapeSession` (ajuda 360045111093, 360045110493). Add-on Studio: a mesma interface com `@ActionButton`
  (portal 05_action_button).
- **Publicar:** procedure: salvar e "Criar template da rotina", o DBA cria no banco; Java: módulo Java + classe;
  acesso: "Controla Acesso" + "Filtro de Telas" e liberar em Acessos; ação ou campo que não aparece: "Reiniciar esta
  unidade de dados" (ajuda 360044597294). **Desfazer:** excluir a ação ou tirar o acesso; procedure: recriar a versão
  de `original/`.
- **Cuidados:** botão na TGFITE que não aparece nas Centrais HTML5: liberar acesso nas duas telas (ajuda 15141890648087).
  Procedure apagada com botão apontando dá `ORA-31603` ao exportar processo do Flow (ajuda 33884091184279). Procedure
  calcula a PK sozinha; Java e JavaScript usam a numeração automática. Rotina longa: "ARJUNA ... transaction is not
  active", ajustar o timeout na Administração do Servidor (ajuda 9784502433815).

## Evento programável (aba "Eventos")

- **Quando:** reage sozinho ao incluir, alterar ou excluir registros de uma instância (nativa ou adicional); roda
  depois das validações nativas (ajuda 360045107833, 360044597294).
- **Onde:** Dicionário de Dados ou Construtor de Telas › aba Eventos ("Salvar ordem" define a ordem). Ligar e
  desligar na Administração do Servidor › Eventos Programáveis é **temporário**: volta ao reiniciar o servidor.
  Filtro de telas aceita `!id.da.tela` para excluir (ajuda 360045107833).
- **Tabela:** `TSIEVP` (NUEVENTO, DESCRICAO, NOMEINSTANCIA, RESOURCEID, TIPO, ATIVO, CONFIG, ORDEM). TIPO: `SP`
  procedure, `RJ` Java. CONFIG: `<eventConfig><dbCall name="<PROCEDURE>"/></eventConfig>` ou
  `<eventConfig><javaCall codModulo="<n>" className="<pacote.Classe>"/></eventConfig>` (visto numa base).
  ```sql
  SELECT E.NUEVENTO, E.DESCRICAO, E.NOMEINSTANCIA, I.NOMETAB, E.TIPO, E.ATIVO, E.ORDEM, E.RESOURCEID
    FROM TSIEVP E LEFT JOIN TDDINS I ON I.NOMEINSTANCIA = E.NOMEINSTANCIA
   WHERE I.NOMETAB = '<TABELA>' ORDER BY E.ORDEM
  SELECT NUEVENTO, DESCRICAO, NOMEINSTANCIA FROM TSIEVP WHERE CONFIG LIKE '%<NOME>%'
  ```
- **Procedure** (modelo que o Sankhya gera, conferido numa base 4.36): `(P_TIPOEVENTO INT, P_IDSESSAO VARCHAR2,
  P_CODUSU INT)`. `P_TIPOEVENTO`: 0 antes de incluir, 1 depois de incluir, 2 antes de excluir, 3 depois de excluir,
  4 antes de alterar, 5 depois de alterar, 10 antes do commit. Ler campo: `EVP_GET_CAMPO_DTA`, `EVP_GET_CAMPO_INT`,
  `EVP_GET_CAMPO_DEC`, `EVP_GET_CAMPO_TEXTO (P_IDSESSAO, 'CAMPO')`; mudar: `EVP_SET_CAMPO_DTA/INT/DEC/TEXTO
  (P_IDSESSAO, 'CAMPO', VALOR)`. Antes de alterar, antes de incluir e depois de excluir trazem todos os campos; os
  outros, só a PK. CLOB chega como VARCHAR(4000).
- **Java:** `br.com.sankhya.extensions.eventoprogramavel.EventoProgramavelJava` com `beforeInsert`, `afterInsert`,
  `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete(PersistenceEvent)` e `beforeCommit(TransactionContext)`;
  `event.getVo()`, `getOldVo()`, `getModifingFields().isModifing("CAMPO")` (ajuda 4410963788951, 4405298024599).
  SQL com `NativeSql` e `setNamedParameter`; prefira `event.getJdbcWrapper()` e não feche a conexão (portal
  07_listeners). Add-on Studio: `@Listener` estendendo `PersistenceEventAdapter`. Atenção: o artigo 4410963788951 troca
  a descrição de before e after; vale o nome do método.
- **Cuidados:** integração externa nunca síncrona dentro do evento (portal 07_listeners). Para achar o registro que
  falha num lote: parâmetro `BATSIZEEVTPROG = 0` (ajuda 360045107833). Eventos do Flow são outra coisa (`TWFEVE`).

## Ação agendada

- **Quando:** rotina periódica (procedure ou Java) por intervalo ou CRON (ajuda 360045110653).
- **Onde:** tela Ações Agendadas (Configurações); acompanhamento em Controle de Jobs (ajuda 360044594634).
- **Tabela:** `TSIAAG` (NUAAG, ATIVO, NOME, DESCRICAO, TIPOACAO, CODMODULO, ACAO, CODUSULOGIN, FONTEDADOS, AUTOTRAN,
  TIPOGATILHO, EXPGATILHO). TIPOACAO: `P` procedure, `J` Java; `ACAO` = nome da procedure ou classe. TIPOGATILHO: `C`
  CRON, `I` intervalo. Estatísticas e erros dos jobs parecem estar em `TSIEJO` (dedução pelos campos).
  ```sql
  SELECT A.NUAAG, A.ATIVO, A.NOME, A.TIPOACAO, A.ACAO, A.CODMODULO, A.CODUSULOGIN, A.TIPOGATILHO, A.EXPGATILHO
    FROM TSIAAG A ORDER BY A.ATIVO DESC, A.NOME
  SELECT ID, DESCRICAO, ATIVO, STATUSEXEC, DHEXEC, DHPROXEXEC, QTDEXECS, QTDFALHAS, MSGERRO
    FROM TSIEJO WHERE QTDFALHAS > 0 ORDER BY DHEXEC DESC
  ```
- **Java:** `org.cuckoo.core.ScheduledAction.onTime(ScheduledActionContext)` (ajuda 360045110653); Add-on Studio:
  `@Job` com `IJob.onSchedule()` (nome terminado em "SP", frequência com "&") (portal jobs-agendados-com-job).
  Assinatura da procedure: não documentada; parta do modelo que a tela gera.
- **Cuidados:** CRON com hora e minuto fixos precisa de segundo fixo (`0`), senão roda 60 vezes no minuto (ajuda
  31592968028055). Roda com as permissões do "Usuário Logado". Na base de teste os jobs podem estar desligados de
  propósito (`-Dsankhyaw.schedule.disable=true`, `-Dsankhyaw.only.jobs`, parâmetro `SERVERHOSTSCHED`) para não mandar
  e-mail nem integração de verdade (ajuda 31592968028055, 35857279731607).

## Regra de negócio (notas das Centrais)

- **Quando:** barrar ou pedir liberação em notas de compra, venda e movimentação interna. Falha com "Evento de
  Liberação" gera liberação (`TSILIB`); sem evento, cancela a gravação (ajuda 360044598014).
- **Onde:** Configurações › Avançado › Regras de Negócio; aba Tipo Operação liga às TOPs com ordem de execução.
  Eventos de liberação próprios a partir de 1000. Para liberação por alçada: parâmetro `USALIBLIM` e "Limites para
  Liberação" no usuário. A ajuda recomenda acompanhamento de consultor.
- **Tabelas:** `TGFRNG` (NURNG, DESCRICAO, ATIVO, TIPOEXPRESSAO, ONDE, QUANDO, EVENTO, CODUSULIB, EXPRESSAO = nome da
  procedure, INIBELIB), `TGFTRN` (NURNG, CODTIPOPER, SEQEXEC), `TGFLIBEVE` (eventos), `TSILIB.NURNG`. TIPOEXPRESSAO:
  `STP` (o que funciona), `JAVA`, `SCRIPT`. ONDE: `PORTAIS`, `FINANC`, `VENDASSIS`. QUANDO: `CONFIRM`, `SAVECAB`,
  `SAVEITE`.
  ```sql
  SELECT R.NURNG, R.DESCRICAO, R.ATIVO, R.ONDE, R.QUANDO, R.EVENTO, R.EXPRESSAO, T.CODTIPOPER, T.SEQEXEC
    FROM TGFRNG R LEFT JOIN TGFTRN T ON T.NURNG = R.NURNG ORDER BY T.CODTIPOPER, T.SEQEXEC
  ```
- **Procedure:** cabeçalho `(P_NUNOTA NUMBER, P_SUCESSO OUT VARCHAR, P_MENSAGEM OUT VARCHAR2, P_CODUSULIB OUT
  NUMBER)`; item: a mesma com `P_SEQUENCIA NUMBER` depois de `P_NUNOTA`. `P_SUCESSO` 'S'/'N'; `P_CODUSULIB` 0 = quem
  tem alçada (ajuda 360044598014). Add-on Studio: `@BusinessRule` (`Regra`, `ContextoRegra`) para saída e
  movimentação interna; nota de entrada com `@Callback` (portal 06_business_rules, 08_callback).
- **Erros:** `CORE_E01364` (vínculo da procedure), `CORE_E01365` (liberador sem alçada para o evento), `CORE_E00839`
  (barrado por regra da empresa) (ajuda 6439609594775, 9173941578007, 360044616153). Duas regras com o mesmo evento
  geram uma liberação só.

## Trigger e procedure da empresa no banco

- O Gerenciador de Objetos (Configurações › Avançado, parâmetro `ATIVGEREOBJ`) só consulta; criar regra por ele foi
  descontinuado. Trigger nova é com o DBA, direto no banco (ajuda 30124070770839, 4404768181271). Ele gerava um pacote
  `PKG_DSP_<TABELA>` e duas triggers por tabela.
- **Não há regra de nome** que separe trigger nativa de personalizada (as nativas também são `TRG_...`). Compare com
  uma base limpa ou pela data de criação, sabendo que atualização do Sankhya recompila e cria objetos.
  ```sql
  SELECT TRIGGER_NAME, TABLE_NAME, TRIGGERING_EVENT, STATUS FROM ALL_TRIGGERS
   WHERE OWNER = '<DONO>' AND TABLE_NAME = '<TABELA>' ORDER BY TRIGGER_NAME
  SELECT TRIGGER_NAME, TABLE_NAME, STATUS FROM ALL_TRIGGERS WHERE OWNER = '<DONO>' AND STATUS = 'DISABLED'
  SELECT OBJECT_NAME, OBJECT_TYPE, STATUS, CREATED, LAST_DDL_TIME FROM ALL_OBJECTS
   WHERE OWNER = '<DONO>' AND STATUS = 'INVALID' ORDER BY LAST_DDL_TIME DESC
  SELECT LINE, TEXT FROM ALL_SOURCE WHERE OWNER = '<DONO>' AND NAME = '<NOME>' ORDER BY TYPE, LINE
  -- quem chama uma procedure pelo Sankhya
  SELECT 'AGENDADA' AS ORIGEM, NOME AS DESCRICAO FROM TSIAAG WHERE UPPER(ACAO) = '<NOME>'
  UNION ALL SELECT 'REGRA', DESCRICAO FROM TGFRNG WHERE UPPER(EXPRESSAO) = '<NOME>'
  UNION ALL SELECT 'BOTAO', DESCRICAO FROM TSIBTA WHERE CONFIG LIKE '%<NOME>%'
  UNION ALL SELECT 'EVENTO', DESCRICAO FROM TSIEVP WHERE CONFIG LIKE '%<NOME>%'
  ```
- **Cuidados:** atualização ou manutenção pode deixar trigger desligada (ajuda 26556536785303). `ORA-04088` em
  `TRG_INC_TGFITE_AFTER`: linhas presas nas tabelas de controle (`TGFITE_INC`, `TGFITE_UPD`, `TGFITE_DLT`,
  `TGFCAB_UPT`, `TGFCAB_DLT`, que devem ficar vazias) ou trigger desligada (ajuda 17442184008983). Desfazer = o DBA
  recria a versão de `original/` (guardada antes pelo `ALL_SOURCE`).

## Módulo Java, extensões e add-ons

- **Módulo Java** (Configurações › Avançado): identificador único em domínio reverso; um ou mais .jar. O .jar fica
  no banco: `TSIMOD` (CODMODULO, RESOURCEID, DESCRMODULO) e `TSIJAR` (CODMODULO, CODJAR, DESCRICAO, ARQUIVO BLOB).
  Usado por `TSIBTA.CODMODULO`, `TSIAAG.CODMODULO` e pelo `codModulo` do CONFIG dos eventos (ajuda 360045111093).
  ```sql
  SELECT M.CODMODULO, M.RESOURCEID, M.DESCRMODULO, J.CODJAR, J.DESCRICAO AS JAR
    FROM TSIMOD M LEFT JOIN TSIJAR J ON J.CODMODULO = M.CODMODULO ORDER BY M.CODMODULO, J.CODJAR
  ```
- **Bibliotecas:** "Sankhya-W-extensions.jar", "jape" e "mge-modelcore" (ajuda 360045110493, 4410963788951). Serviço da
  plataforma: `PlatformServiceFactory.getInstance().lookupService("@core:...")` (ex.: `@core:report.service` para
  imprimir relatório formatado de um botão, ajuda 360044597714).
- **Add-ons** (Add-on Studio, Gradle): `@ActionButton`, `@Listener`, `@BusinessRule`, `@Callback`, `@Job`; deploy
  local com `./gradlew clean deployAddon` (WildFly com depuração na porta 8787); instalação pelo Sankhya Place e
  Minhas Soluções (4.31+), com Desinstalar. Requisitos citados: Java 1.8, WildFly 23, plataforma 4.28+ (portal
  add-on-studio, 04_deploy_testes_locais, faq; ajuda 36069299048471). Tabela em add-on com prefixo próprio, nunca
  `AD_` (portal guia-de-boas-praticas). Add-on posto direto na pasta do servidor não desinstala pela tela.
- **Cuidados:** atualização pelo WPM pode "sumir" com add-ons se o ambiente não for reconfigurado (ajuda
  35205277329175). Base de teste sem os add-ons da produção dá erro de metadados: instalar ou "Reiniciar DD" (ajuda
  360052576654).

## Campo e tela adicional (AD_)

- **Campo adicional:** Dicionário de Dados › tabela › Campos. O sistema cria a coluna, salvo campo calculado.
  **Tela adicional:** Construtor de Telas, cria a tabela `AD_<NOME>`; depois Menu do Sistema (lançador "Tela
  adicional") e Acessos (ajuda 360044597294, 360045111773, 360045112053).
- **Tabelas:** `TDDTAB.ADICIONAL`, `TDDCAM.ADICIONAL`, `TDDCAM.EXPRESSAO` (expressão em Java/BeanShell com
  `$col_CAMPO`, `$sql`, `$usuario_logado`; SQL começa com `#type.sql#` e devolve uma linha), `TDDOPC` (opções),
  `TDDINS` (instâncias; tela adicional tem `menu.adicional` no RESOURCEID), `TDDLIG.ADICIONAL`.
  ```sql
  SELECT NOMETAB, DESCRTAB FROM TDDTAB WHERE ADICIONAL = 'S' ORDER BY NOMETAB
  SELECT NOMETAB, NOMECAMPO, DESCRCAMPO, TIPCAMPO, CALCULADO, TAMANHO FROM TDDCAM WHERE ADICIONAL = 'S' ORDER BY NOMETAB, ORDEM
  ```
- **Tipos criados:** inteiro NUMBER(10), decimal FLOAT, hora NUMBER(5), texto VARCHAR(100) (lista de opções 10;
  caixa de texto VARCHAR2(4000)), data DATE; nome com até 32 caracteres (ajuda 360044597294).
- **Publicar:** salvar e "Reiniciar esta unidade de dados"; "Checar integridade de campos adicionais" confere se o
  campo existe no banco. **Desfazer:** tabela adicional com registros não pode ser removida (`CORE_E03108`);
  "Transformar Tabela em View" apaga os dados (ajuda 14227604006295, 360045111773).
- **Erros:** `CORE_E01914` campo já existe no banco; `CORE_E01922` não pode "Permitir pesquisa" em campo adicional;
  `CORE_E01905` campo calculado só com expressão SQL; `CORE_E03116` valores de opções repetidos; `CORE_E04289`
  metadados não inicializados (reiniciar unidade de dados, descartar cache, conferir versão e add-ons);
  `ORA-02292 ... AD_FK_...` ao cancelar nota: há registro filho em tabela adicional (ajuda 14330605576727,
  9929505022359, 9189954854551, 10211475456663, 6270872588823, 16582333159959). Aumentar campo nativo é DDL: DBA ou
  Sankhya.

## Relatório e BI ligados a personalização

- Imprimir relatório formatado por botão: Java ou JavaScript com `@core:report.service` (ajuda 360044597714), ou
  ligar o relatório à tela em Relatórios Formatados (Tela/Instância) (ajuda 360044463273). Relatório: skill
  `alterar-relatorio`.
- Componente de BI do tipo Tabela ligado a uma entidade mostra os botões dela (ajuda 360044605354). Gadget por evento
  de liberação: `TSIGEL` (NUGDG, EVENTO).

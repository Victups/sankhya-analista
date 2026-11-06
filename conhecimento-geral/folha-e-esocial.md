# Folha (Pessoal+) e eSocial

Dados pessoais (nome, CPF, salário): não repetir. Cruzar por CPF sem exibir.

## Funcionários

- Ativo na data: `DTADM <= fim` e (`DTDEM` nula ou `> fim`) (confirmado em produção, out/2026).
- Caminhos: `TFPFUN.CODDEP` → `TFPDEP`; `TFPFUN.CODNIVEL` → `TGPNIV` (grau salarial: trainee, júnior, pleno...);
  `TFPFOL.(CODEMP, CODFUNC)` → `TFPFUN`; `TFPFOL.CODEVENTO` → `TFPEVE` (confirmado em produção, out/2026).
- Departamento e nível do `TFPFUN` são os atuais, não os da data da folha. O histórico de lotação fica em `TFPLFU`,
  que pode estar vazia (confirmado em produção, out/2026).
- `TFPFUN.SITUACAO`: 1 ativo, 0 desligado, 8 transferido (confirmado em produção, out/2026).
- Transferência entre empresas: o registro novo tem `PRIMEMPREGO = 'A'`, a admissão original em `DTADM` e a chegada
  em `DTTRANSFERENCIA`. O antigo sai com motivo eSocial 11, `SITUACAO` 8 e `DTTRANSFDEST`. Não contar como admissão
  nem desligamento (confirmado em produção, out/2026).
- Motivo do desligamento: `TFPFUN.MOTDESLIGESOCIAL` (tabela `TFPMTD`, códigos do eSocial: 01 justa causa, 02 sem
  justa causa, 03 antecipada pelo empregador, 04 antecipada pelo empregado, 06 término de contrato, 07 pedido de
  demissão, 11 transferência). `CODTPR` → `TFPTPR` é o equivalente interno (confirmado em produção, out/2026).
- O CR do funcionário vem do departamento: `TFPFUN.CODDEP` → `TFPDEP.CODCENCUS`. Rateio próprio do funcionário em
  `TFPRTF` (confirmado em produção, nov/2026).
- Faltas em `TFPFAL` (com `HORAS`). Ocorrências em `TFPOCO`, com o tipo em `TFPHIS` (`ABSENTEISMO`, `FALTA`,
  `AFASTAMENTO`). Ponto em `TFPPON` (confirmado em produção, out/2026).
- Dependentes: `TFPDPD` (`DEPENDIRF`, `SALFAM`, `CPF`, `DTALTESOCIAL`). Deficiência: `TFPFUN.DEFICIENTEFISICO`,
  `TIPDEFICIENCIA` e `TFPFDEF` (confirmado em produção, out/2026).
- Recrutamento e quadro: `TRSREQ` (requisição de pessoal), `TRSVNE` (vagas por estrutura), `TRSSEL`, `TRSCAN`,
  `TRSANU`, `TFCBCO`, `TFPREQADM` (a validar: só visto no dicionário).

## Eventos e bases

- `TFPEVE.CODNATRUBRICA` = natureza da rubrica no eSocial (ex.: 1000 salário, 1003/1004 horas extras, 9908 FGTS)
  (confirmado em produção, out/2026).
- `TFPEVE.TIPEVENTO`: 0 base, 1 provento (a validar os demais). `BASELIQUIDO` = entra no líquido. `IMPHOLLERIT` =
  "Imprime em" (confirmado em produção, out/2026).
- FGTS é evento demonstrativo: tipo Neutro, fora do líquido. Pode sair na coluna de proventos do holerite sem somar no
  total (ajuda do Sankhya, "Cadastro de Eventos (Rubricas)"; confirmado em produção, out/2026).
- Evento com `IMPHOLLERIT = 'N'` não sai no Resumo da Folha: aparece só no "Valor FGTS" do rodapé e no Total Guia
  (confirmado em produção, out/2026).
- Composição das bases: `TFPEBA` (`CODEVENTOACUM` = base, `CODEVENTOCOMP` = evento que compõe). Na tela Eventos é a
  aba "Bases de Cálculo", um card por base (confirmado em produção, out/2026).
- Evento criado pela empresa precisa entrar nas mesmas bases que o nativo equivalente. Evento de remuneração fora da
  base de FGTS do mês da rescisão deixou o FGTS rescisório a menor. O eSocial não é afetado, porque usa as incidências
  (confirmado em produção, out/2026).
- Evento mensal incluído na base do FGTS 13º soma duas vezes no Total Guia (base FGTS e base FGTS 13º): o "Valor
  FGTS" do holerite e o Total Guia ficam 8% acima. O eSocial não é afetado (`CODINCFGTS`) (confirmado em produção,
  out/2026).
- `TFPEVE.FGTSDECTERCEIRO`: a tela não altera esse campo nem o `DTALTER`. O que a tela mostra é a composição da
  `TFPEBA` (visto em produção, out/2026; a validar se o cálculo usa só a `TFPEBA`).
- Histórico do cadastro de eventos: `TFPEVEHIST` (`CODHIST`, `DTALTER`, `CODUSU`) (confirmado em produção, out/2026).
- Códigos nativos vistos (a validar em cada base): 450 FGTS Normal; 534 FGTS 13º Salário; 394 FGTS / FGTS 13º SEFIP
  (= 450 + 534, só nos meses com 13º); 122 Base INSS; 250 base FGTS; 347 base FGTS 13º; 124, 177, 183 e 482 bases do
  FGTS da rescisão (177 = mês anterior, 482 = mês da rescisão); 373 base FGTS indenizações.
- Encargos patronais não ficam na `TFPFOL`, só os do segurado. O INSS patronal entra na contabilização por fórmula
  contábil no evento de base INSS (`TFPCTB.FORMULAID`) (confirmado em produção, out/2026 e nov/2026).
- Provisões de férias e 13º: `TFPSAL` (a validar).

## Cabeçalho da folha (TFPBAS)

- Uma linha por `REFERENCIA`, `CODEMP`, `CODFUNC` e `TIPFOLHA`, com `SALBRUTO` e `SALLIQ`. `TIPFOLHA` vistos: N
  normal, D 1ª parcela do 13º, R rescisão (confirmado em produção, out/2026).
- `VALIDADO = 'S'` = folha marcada como conferida no Gerenciador de Folhas. Ela não deixa excluir: antes, "Marcar como
  NÃO CONFERIDAS" (ajuda do Sankhya, artigo 40106318532247).
- Integração: `NUFIN`, `NUFINIRRF` e `NUFINFGTS` (financeiro) e `NUMLOTECTB` (contábil) (confirmado em produção,
  out/2026).
- O título do FGTS mensal sai em Opções SEFIP › Financeiro SEFIP e fica em `TFPBAS.NUFINFGTS` (confirmado em
  produção, nov/2026).

## Resumo da Folha e guias

- O Total Guia é calculado sobre as bases. A soma dos eventos pode ficar centavos abaixo por truncamento por
  funcionário (ajuda do Sankhya; confirmado em produção, out/2026).
- A folha trunca os encargos, não arredonda (confirmado em produção, out/2026).
- Total Guia: "Remuneração s/13 Sal" = base FGTS sem rescisão; "Remun. s/13 Rescisão" = base dos desligados;
  "Remuneração c/13 Sal" = base FGTS 13º (confirmado em produção, out/2026).
- O Resumo imprime um quadro por funcionário e tipo de folha (1ª parcela do 13º, férias) e não soma o total da pessoa
  (confirmado em produção, out/2026).
- O "Total Geral Guia" fica na última página do Resumo da Folha (Gerenciador de Folhas › Resumo da Folha): RAT
  ajustado + Campo 9 Outros = Campo 11 (confirmado em produção, out/2026).
- Demissão sem justa causa: o FGTS do mês anterior ainda não recolhido vai para a guia rescisória ("mês anterior"),
  não para a mensal. O Mapa emitido depois da demissão tira o trabalhador do Total Guia e do Demonstrativo Coletivo de
  FGTS (Opções SEFIP). Pedido de demissão e justa causa não têm esse efeito (Lei 8.036, art. 18; CLT, art. 477 § 6º;
  confirmado em produção, nov/2026).
- FGTS Digital: desligamento entre os dias 1 e 9 antecipa o vencimento do mês anterior para D+10, e a guia rescisória
  substitui a mensal para esse trabalhador (FGTS Digital, nov/2026).
- FGTS Digital, FAQ do MTE: a Guia Rápida não gera outra guia para competência que já tem guia, só reimprime (03.10);
  débito que surge depois entra pela Emissão de Guia Parametrizada (03.07 a 03.09); guia emitida não se cancela,
  basta emitir outra (03.21); o devido por trabalhador está em Consulta FGTS por Vínculo (05.01) (FAQ do MTE,
  out/2026).

## Registro fiscal (INSS)

- `TFPFIS` (tela Cadastro do Registro Fiscal): `ATIVINSS` = FPAS, `CODGRPS` = código de terceiros, `TAXAGRPS` = taxa
  de terceiros (%), `TAXASEG` = RAT (%), `FATORFAP` = FAP (4 casas), `RAT15`/`RAT20`/`RAT25` = adicional da
  aposentadoria especial (campos "15/20/25 Anos": 12/9/6), `OPTSIMPLES` 1 não optante, 2 optante (ajuda do Sankhya,
  artigo 39396794844311; confirmado em produção, out/2026).
- RAT ou FAP em branco: a folha calcula RAT ajustado 0, e a guia fica abaixo da DCTFWeb (confirmado em produção,
  out/2026).
- A folha usa o histórico do registro fiscal da referência (`TFPHFI`, aba "Histórico Registro Fiscal", uma linha por
  `REFERENCIA`), não o cadastro atual. Corrigir só o cadastro não muda a referência já gravada (confirmado em
  produção, out/2026).
- `TFPFIS.DTALTER` não muda ao salvar pela tela (confirmado em produção, out/2026).
- O S-1020 sai do registro fiscal: FPAS que não existe na tabela da Receita não é aceito (confirmado em produção,
  out/2026).
- O Resumo da Folha calcula o "RAT Agentes Nocivos" pelos campos 15/20/25 Anos. Para a classificação tributária 01
  (Simples Nacional), o eSocial não gera patronal, RAT nem esse adicional, e a guia da folha passa da DCTFWeb
  (confirmado em produção, nov/2026).
- A DCTFWeb não aceita alterar débito que vem do eSocial (confirmado, nov/2026).

## Retornos e tabelas do eSocial

- Uma tabela por evento: `TFPS<evento>` (`TFPS1000`, `TFPS1010`, `TFPS1200`, `TFPS1210`, `TFPS2200`, `TFPS2205`,
  `TFPS2299`...). `NRORECIBO` preenchido = aceito; `STATUS` E = erro (confirmado em produção, out/2026; a validar os
  demais status).
- `TFPS1010`: uma linha por rubrica a cada geração (`CODEMP`, `DTREF`, `SEQUENCIA`, `TPAMB`), com `CODRUBR`,
  `NATRUBR`, `TPRUBR` (1 vencimento, 2 desconto, 3 informativa, 4 informativa dedutora), incidências `CODINCCP`,
  `CODINCIRRF`, `CODINCFGTS`, `CODINCSIND` e `CODEVENTO`. Filhas `_CP`, `_IRRF`, `_FGTS`, `_SIND`, `_PISPASEP` com os
  processos de suspensão (a validar: só visto no dicionário).
- Acompanhamento: `TFPCAB` (contadores por empresa) e as views `VRI_ACOMPANHAMENTO_TRANSMISSAO` e
  `VRI_ACOMP_TRANSMISSAO_ERRO` (mensagem de erro por evento). Configuração do eSocial por empresa: `TFPEMP`
  (a validar: só visto no dicionário).
- S-5011 (INSS): não existe `TFPS5011*`. O retorno fica em `TFPICEC` (infoCREstab) e `TFPICRC` (infoCRContrib), com
  `TPCR` (código de receita sem hífen) e `VRCR`. Lotação, FPAS e terceiros em `TFPILCC`; RAT e FAP em `TFPIECC`;
  classificação tributária em `TFPICSC.CLASSTRIB` (confirmado em produção, out/2026).
- O `VRCR` do S-5011 é bruto: salário-maternidade e salário-família (`TFPBRC.VRSALMAT`, `VRSALFAM`) não são
  abatidos. A DCTFWeb abate na competência (confirmado em produção, out/2026).
- O relatório S-5011 nativo da Central do eSocial (não está em `TSIRFE`) não tem linha para todo código de receita
  (ex.: 1209 Fundo Aeroviário), e o total fica abaixo da DCTFWeb. A preferência `FPRELATS5011` (0 = padrão) aceita
  relatório formatado próprio (confirmado em produção, out/2026).
- Códigos de receita: 1082 segurados, 1138-01 patronal dos empregados, 1138-04 patronal do contribuinte individual,
  1141 adicional da aposentadoria especial, 1646 RAT ajustado, 1170 salário-educação, 1176 INCRA, 1181 SENAI, 1184
  SESI, 1191 SENAC, 1196 SESC, 1200 SEBRAE, 1209 Fundo Aeroviário (conferidos pelas alíquotas, out/2026).
- S-5012 (IRRF) é por mês de pagamento: o IRRF de uma folha paga no mês seguinte vai no S-5012 do mês seguinte.
  Retorno em `TFPS5012` (`INDEXISTINFO` 2 = sem IRRF) e `TFPS5012_INFOCRMEN` (`CRMEN`, `VRCRMEN`) (confirmado em
  produção, out/2026).
- O relatório antigo do IRRF (`FPRELATS5012` = 0, Relatório Consolidado de Conferência) dá "Nenhuma página a
  apresentar" com o S-5012 atual, e as tabelas do layout antigo (`TFPIRCC`, `TFPICR`) ficam vazias. Usar o painel
  "Conferência de Tributos" (Pessoal+ › Consultas, ou botão na Central do eSocial; artigo 37497561502231, versão
  mínima 5.77.0) (confirmado em produção, out/2026).
- S-5003 (FGTS): `TFPS5003` › `_IDEESTAB` › `_INFOTRABFGTS` › `_BASEPERAPUR` (`TPVALOR` 11 mensal, 12 13º; `REMFGTS`
  base, `DPSFGTS` depósito). A 1ª parcela do 13º e o 13º da rescisão vão no `TPVALOR` 12 do mês do pagamento
  (confirmado em produção, out/2026).
- `TFPS5003_RUBRICA.DHINC` é a data de gravação no Sankhya, não a de processamento no eSocial (confirmado em produção,
  out/2026).
- Tela "S-5003 - Conferência de Informações do FGTS por Trabalhador" (Pessoal+ › Consultas, ou "Dashboard de
  Conferência" na Central; artigo 36626761293591, versão mínima 5.66.0): blocos mensal, 13º, rescisório e outros, com
  sistema, eSocial e diferença. S-5001, S-5002 e S-5003 saíram da Central do eSocial (artigo 39378400480151).
- A matrícula do eSocial não é o `CODFUNC` (`TFPS1200_DMDEV_RPA.MATRICULA`, `TFPS5003_INFOTRABFGTS.MATRICULA`).
  Cruzar pelo CPF (`TFPFUN.CPF` = `TFPS5003.CPFTRAB`), sem exibir (confirmado em produção, out/2026).
- No S-1200 o FGTS vai como rubrica informativa (`TPRUBR` 3, natureza da rubrica do eSocial: 9908) (confirmado em produção, out/2026).
- S-1210 erro 1861 "CPF do dependente inválido": o dependente não está no RET do trabalhador (falta S-2200/S-2205 com
  ele; ver `TFPS2205_DEPENDENTE`). Tabelas `TFPS1210` e `TFPS1210_DEDDEPEN`; retorno em `TFPS5002_IDEDEP` e
  `_DEDDEPEN`. O mesmo dependente não pode ser deduzido por dois responsáveis (confirmado em produção, out/2026).
- S-2299 com erros 1537 (dtAvPrv antes da admissão) e 584 (dtProjFimAPI antes do desligamento) vem de data do aviso
  digitada errada. O evento guarda a `DTPROJFIMAPI` já calculada: corrigir o cadastro não basta; recalcular a
  rescisão e gerar o evento de novo (confirmado em produção, nov/2026).
- `infoCota` no S-2200/S-2205: a NT S-1.3 nº 07/2026 tirou o campo a partir de 26/10/2026. O console 3.59.1 ainda
  mandava `TFPFUN.INFOCOTA`, e o eSocial recusava. Resolvido atualizando o console do eSocial para 3.64.1
  (`TSIPAR.VERSESOCIALBIN`). Views `VGF_EVENTO_S2200` e `VGF_EVENTO_S2205` (confirmado em produção, out/2026).

## Tabelas de faixas

- `TFPFAI`: `CODTAB`, `REFERENCIA` (uma cópia por mês), `LIMFAIXA`, `VALOR1` a `VALOR11` (confirmado em produção,
  out/2026).
- `TFPFAIP` liga a identificação padrão (INSS, IRRF, SALARIOFAMILIA, SALARIOMINIMO, IRRFPLR) ao `CODTAB`. Com ela,
  o Pessoal+ (5.72.2 ou mais) atualiza essas tabelas sozinho. Tabela sem identificação não é atualizada (ajuda do
  Sankhya, artigo 37696119134999; confirmado em produção, out/2026).

## Holerite e relatórios próprios

- O layout do holerite vem da preferência `FPRELATHOLERITE`: relatório formatado próprio ou o padrão hollerit_*.jrxml
  (confirmado em produção, out/2026).
- Os relatórios das preferências `FPRELATS50xx` não recebem os parâmetros do holerite (`PCODEMP`, `PREFERENCIA`). A
  Central do eSocial manda `CODEMP` (BigDecimal), `REFERENCIA_INICIO` e `REFERENCIA_FIM` (Timestamp, dia 1),
  `ULTIMO_DIA_REFERENCIA_FIM`, `TIPFOLHA` ('N'), `ESTABELECIMENTOS` (lista), `ESTABELECIMENTOS_STR[_AND|_ESTAB]`
  (trecho SQL `AND (CODEMP IN (...))`), `LOTACOES*`, `FUNCIONARIOS*` e `ORDENACAO` (confirmado em produção,
  out/2026).
- Para descobrir os parâmetros que uma tela manda: pôr na preferência um jrxml de diagnóstico que lista os parâmetros
  recebidos e gerar pela tela (prática validada, out/2026).

## Contabilização da folha

- A folha é contabilizada pelo Pessoal+, não pela natureza do título: tela Grupo de Contabilização (Pessoal+ ›
  Cadastros › Informações Contábeis); o funcionário entra no grupo em Configuração Funcionários › aba Contrato ›
  "Grupo de contabilização" (ajuda do Sankhya, artigo 13756876583575).
- `TFPCTB`: evento → conta, por registro fiscal e grupo de contabilização. `FORMULAID` = fórmula contábil. Um evento
  pode ter duas linhas com `TIPCONTABIL` diferente (F e N), como nas férias (confirmado em produção, nov/2026; a
  validar o significado de F e N).
- `TFPEVE.INTEGRACTB = 'N'` tira o evento da integração contábil (confirmado em produção, nov/2026).
- Configuração de Integração Contábil (Pessoal+ › Cadastros; ajuda, artigo 10137196517783). Para lançar com CR, integrar
  pelo Gerenciador de Folhas com "Contabilizar por: Centro de Resultado" (ajuda, artigo 7080867168151).

## Remessa bancária da folha

- Duas telas de layout: Pessoal+ › EDI Bancários › Configuração de Arquivo de Remessa grava em `TSIREM`/`TSIIRE` com
  `MODULO = 'F'`, conteúdo em texto (recurso `br.com.sankhya.rh.configuracao.arquivo.de.remessa`). A do Financeiro
  grava `MODULO = 'B'`, com o conteúdo criptografado (recurso `br.com.sankhya.configuracao.arquivo.remessa`). Na
  árvore do Financeiro o código aparece com pontos (confirmado em produção, out/2026).
- `TSIIRE`: campos do layout. Posição = soma dos `TAMANHO` anteriores, por `SEQUENCIA` (confirmado em produção,
  out/2026).
- Fontes do layout da folha: `Dados_Gerais_Folha.CONVENIO`, `Dados_Detalhe_Folha.AGENCIA_FUNCIONARIO` e
  `Dados_Detalhe_Folha.DIGITO_AGENCIA_FUNC`, `DATAATUAL`, `HORAATUAL`. O `+` da expressão junta texto, não soma
  (confirmado em produção, out/2026).
- O Sankhya trata o último caractere de `TFPFUN.CODAGE` como dígito (`AGENCIA_FUNCIONARIO` = sem o último,
  `DIGITO_AGENCIA_FUNC` = o último), como em `TSICTA.CODAGE`. Agência cadastrada sem dígito sai quebrada no arquivo
  (confirmado em produção, out/2026).
- Número sequencial do arquivo: a variável `NROREMESSA` funciona (soma 1 a cada geração e fica igual ao
  `TSICTA.SEQREM`). `Dados_Gerais_Folha.NUMERO_REMESSA` vem vazio na geração (confirmado em produção, out/2026).
- Layout de remessa feito para um banco grava o código desse banco fixo (header e Segmento A). Gerar por ele a folha
  de uma conta de outro banco sai errado, e o banco recusa. Escolher o layout pelo banco da conta (visto numa base,
  nov/2026).
- Bradesco Multipag (manual v7, fev/2024): dígito da agência do favorecido (Segmento A pos. 29, G009) não é
  obrigatório; dígito da conta (pos. 42) é. Pos. 16-17 (G061) `09` = inclusão bloqueada (só sai depois da aprovação do
  usuário máster no banco), `00` = liberada. Arquivo duplicado é reconhecido pela data e hora de gravação (ocorrência
  `AA`). Convênio em teste devolve a ocorrência `5T`; o arquivo é o mesmo em teste e em produção (resposta do banco,
  out/2026).
- DV da agência Bradesco: pesos 5, 4, 3, 2; DV = 11 − (soma mod 11); resto 1 vira `P` (conferido, out/2026).

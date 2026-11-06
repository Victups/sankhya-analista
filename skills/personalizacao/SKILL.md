---
name: personalizacao
description: Criar, alterar, investigar ou desligar uma personalização do Sankhya - botão de ação (procedure, Java, JavaScript, lançador), evento programável, ação agendada, regra de negócio, trigger ou procedure da empresa, módulo Java, add-on, campo ou tela adicional. Use quando pedirem um botão, uma ação automática ao salvar, uma rotina agendada, uma validação que exija liberação, um campo ou tela nova, ou quando uma personalização der erro ou deixar o sistema lento.
---

# Personalização no Sankhya

Referência por tipo (onde fica, como ler, contrato do código, como publicar e desfazer, erros conhecidos):
`${CLAUDE_PLUGIN_ROOT}/skills/personalizacao/referencia.md`. Leia só a seção do tipo (Grep pelo título `## ` e Read
com offset) antes de escrever código.

**Limite:** você não cria, compila nem altera nada no banco (procedure, trigger, tabela, campo) e não cadastra nada
no Sankhya. Você lê o que existe, escreve o código e o passo a passo, e quem publica é a TI (tela do Sankhya) ou o
DBA (objeto no banco), primeiro na base de teste.

1. **Entender o pedido** em uma frase: quem dispara (usuário, gravação de um registro, horário), em qual tela ou
   tabela, o que deve acontecer e o que não pode acontecer. Procure antes em `buscar_conhecimento` e na Central de
   Ajuda: às vezes um parâmetro ou uma configuração nativa resolve sem personalizar.

2. **Escolher o tipo** (detalhes na referência):
   - a pessoa clica sobre registros escolhidos: **botão de ação** (procedure, Java, JavaScript ou lançador);
   - acontece sozinho ao incluir, alterar ou excluir um registro: **evento programável**;
   - nota de compra, venda ou movimentação interna que deve barrar ou pedir liberação: **regra de negócio**;
   - roda de tempos em tempos: **ação agendada**;
   - dado novo: **campo adicional** ou **tela adicional** (tabela AD_);
   - trigger direto no banco: só quando os anteriores não servem, com o DBA (o Gerenciador de Objetos não cria mais).
   Prefira procedure para regra simples sobre dados; Java para lógica grande, uso do framework (JAPE) ou arquivos.

3. **Ver o que já existe** (só leitura, pelos SELECTs da referência): personalizações da mesma tabela ou tela,
   procedure ou classe com o mesmo papel, eventos na mesma instância (ordem de execução), triggers da tabela. Leia o
   código atual (`USER_SOURCE` para procedure e trigger; `CONFIG` do botão ou do evento) e guarde em `original/`.

4. **Escrever** em `personalizacoes/<tipo>_<nome>/`:
   - `original/`: o que existe hoje, exatamente (para desfazer); vazio se for novo.
   - `alterado/`: o código novo (`.sql` da procedure, `.java`, `.js`) e a configuração da tela (campos e valores).
   - `LEIA-ME.md`: o que faz e por quê; tela e campos para cadastrar; ordem de publicação (banco, depois tela);
     como testar na base de teste; como desfazer; quem publica.
   Regras do código:
   - parte do modelo que o próprio Sankhya gera ("Criar template da rotina") e segue o contrato da referência;
   - valor que vem da pessoa ou da tela vai como parâmetro (`setNamedParameter`, `setParam`, variável PL/SQL),
     nunca concatenado no SQL; nada de SQL dinâmico montado com texto de fora;
   - sem `COMMIT` próprio quando a transação é automática; mensagem de erro clara para o usuário;
   - nada de chamada síncrona a sistema externo dentro de evento ou regra (deixa a gravação lenta ou presa);
   - nome com prefixo da empresa, sem colidir com objeto nativo (`TRG_`, `STP_` também são usados pelo Sankhya).
   Valide os SELECTs que o código usa pela skill `consulta-sql`.

5. **Testar e publicar** (passo para a pessoa): base de teste primeiro. Lembre que lá a Autorização de
   Customizações pede liberação de novo e as ações agendadas podem estar desligadas de propósito. Depois de publicar:
   "Reiniciar esta unidade de dados" quando a referência pedir; conferir o resultado com uma consulta; na produção,
   exportar os metadados da tela antes de mudar.

6. **Erro ou lentidão numa personalização:** ache-a pela mensagem (código `CORE_E...`, nome de procedure ou classe)
   com os SELECTs da referência; veja a telemetria de customizações; confira se a atualização do Sankhya invalidou o
   objeto (`USER_OBJECTS`, `USER_ERRORS`) ou desligou trigger. Proponha a correção como no passo 4.

7. **Registrar** (skill `registrar`): na nota da área, o que a personalização faz, onde está (tabela, código,
   procedure ou classe) e a decisão. O inventário de personalizações da empresa é conhecimento dela.

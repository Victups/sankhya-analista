# Política de segurança

O `sankhya-analista` conecta o Claude Code a um banco Oracle de produção e guarda conhecimento de empresas. Por isso
levamos a segurança a sério: o plugin foi desenhado para que o pior caso seja uma consulta lenta, nunca uma escrita.

## Versões com correção

Só a versão mais recente (a tag mais nova) recebe correção de segurança.

## Como reportar uma vulnerabilidade

**Reporte em privado.** Não abra issue pública com detalhes de uma falha.

1. Abra a aba **Security** deste repositório e escolha **Report a vulnerability**
   ([atalho](https://github.com/Victups/sankhya-analista/security/advisories/new)).
2. Descreva o que acontece, como reproduzir (de preferência com a consulta ou o comando exato) e o efeito esperado
   versus o obtido. **Não inclua senhas, tokens nem dados de empresa** no relato: troque por valores fictícios.

O projeto é mantido por uma pessoa, no melhor esforço. A meta é responder em até 7 dias corridos e, confirmada a falha,
publicar a correção e dar o crédito a quem reportou (se a pessoa quiser).

## O que conta como vulnerabilidade

- **Escrever ou alterar o banco** por `consultar_sql`, `validar_sql` ou `exportar_sql`, ou seja, contornar a trava de
  SQL (só `SELECT`/`WITH`, sem `FOR UPDATE`, sem `WITH FUNCTION`, sem db link, só funções nativas do Oracle) ou a
  transação somente leitura.
- **Contornar as travas** que barram ler ou expor `.env`, chaves e credenciais, usar o banco por fora do MCP ou
  commitar `dados/`, planilhas e `Result_*.json`.
- **Vazar** senha, token ou endereço do banco em mensagem de erro, log ou arquivo gravado.
- **Ler ou gravar fora da pasta do projeto** pelas ferramentas que mexem em arquivo (`exportar_sql`, `resumir_dados`,
  `extrair_dicionario`).
- **Injeção por conteúdo**: texto de uma nota, proposta de conhecimento ou artigo da Central de Ajuda que faça o agente
  executar uma ação que a pessoa não pediu.
- Dependência com falha conhecida **e explorável** neste plugin.

## O que não conta

- Falhas do Sankhya, do Oracle ou do Claude Code: reporte aos respectivos fabricantes.
- Dano causado por quem aplica, no Sankhya ou no banco, uma proposta do agente sem revisar. O plugin nunca grava no
  banco, mas a pessoa que aplica a proposta, sim.
- Conhecimento do Sankhya incorreto em `conhecimento-geral/`: abra uma issue do tipo **Conhecimento**.

## Uso seguro

- Use um **usuário de banco só de leitura** (a skill `comecar` entrega a proposta para o DBA) e, se houver, a base de teste.
- Senhas só nas opções do plugin (cofre de credenciais do Claude Code) ou em variáveis de ambiente. Nunca no repositório.
- O repositório da empresa é **privado**. Exportações e planilhas ficam em `dados/`, fora do git.
- No modo **API Gateway** não existe transação somente leitura: a única proteção é a trava de SQL.
- Revise o que o agente propõe antes de aplicar.

O plugin é distribuído sob a licença [MIT](LICENSE), sem garantia de qualquer tipo.

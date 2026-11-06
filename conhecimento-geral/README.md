# Conhecimento geral do Sankhya

Vale para qualquer Sankhya. O conhecimento da empresa (conhecimento/ do repositório dela) prevalece sobre este.

Cada fato traz a origem entre parênteses. "A validar" = visto só no dicionário, numa base só ou sem confirmação na
ajuda. "Visto numa base" = comportamento observado em uma instalação: conferir na sua antes de usar.

## Situação de cada fato (para quem mantém)

- **a validar**: só no dicionário ou numa conversa, sem dado real.
- **visto numa base** / **confirmado em produção ou teste (mm/aaaa)**: uma empresa confirmou com dado real.
- **confirmado em N bases, versões X a Y**: outras empresas confirmaram (cada proposta que confirma soma uma base).
- Fato que deixou de valer (mudou de versão, era personalização): corrigir o texto e dizer a partir de que versão
  mudou; o histórico fica no git do plugin.
- Antes de publicar: `node hooks/travas.mjs texto conhecimento-geral` sem achados.

- [sql-e-banco.md](sql-e-banco.md): armadilhas de SQL no Oracle do Sankhya (campo calculado, acento, datas, ligações, desempenho).
- [custos-e-estoque.md](custos-e-estoque.md): TGFCUS, trava de custo, saldo, o que baixa estoque, composição e custeio CIP.
- [producao.md](producao.md): OP, processo produtivo, lista de materiais e nota de produção.
- [financeiro.md](financeiro.md): títulos, provisões, rateio, naturezas, saldos bancários e tela Movimentação Financeira.
- [contabil.md](contabil.md): plano de contas, lançamentos e saldos, origem, regras e agendamentos de contabilização, fechamento.
- [folha-e-esocial.md](folha-e-esocial.md): Pessoal+, eventos e bases, guias, registro fiscal, retornos do eSocial, remessa da folha.
- [comercial.md](comercial.md): TOP e tipo de movimento, valores e impostos da nota, cancelamento, compras, cotação, XML, contratos, logística, importação.
- [governanca.md](governanca.md): dicionário, personalizações, objetos do Oracle, base de teste, versão e atualização, log de preferências, dashboards.
- [sql/](sql/): consultas gerais, ponto de partida para qualquer empresa (vendas e compras por mês, pagar e receber em aberto, saldo bancário de hoje, estoque valorizado, inventário de personalizações, admissões e desligamentos). Cada uma diz a regra do produto e o que ajustar; rode na base de teste antes de usar.

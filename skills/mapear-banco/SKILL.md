---
name: mapear-banco
description: Extrair de novo o dicionário e o grafo do banco do Sankhya (tabelas, campos, FKs e ligações) e ver o que mudou. Use depois de cada atualização de versão do Sankhya, quando criarem tabelas ou campos adicionais, ou quando o dicionário/ estiver faltando ou velho.
---

# Mapear o banco

1. Rode `extrair_dicionario` (base `producao`; use `teste` só se a pessoa pedir). A ferramenta grava
   `dicionario/campos.json`, `fks.json`, `ligacoes.json` e `MAPA.md`, e devolve o que mudou desde a extração anterior.
2. Se mudou alguma coisa, procure as tabelas e os campos que **saíram** em `sql/`, `dashboards/` e `relatorios/`
   (Grep). Consulta que usa campo que saiu vai quebrar: liste os arquivos afetados para a pessoa.
3. Campos e tabelas **novos** que tocam áreas com nota em `conhecimento/`: cite-os na resposta; registre na nota só o
   que for confirmado com dado real.
4. Anote em `conhecimento/README.md` uma linha: "Dicionário extraído em <data> (<versão do Sankhya, se souber>):
   <n> tabelas novas, <n> campos novos, <n> que saíram".
5. Os arquivos de `dicionario/` vão para o git (não têm dado pessoal). Não edite à mão.

Para consultar o dicionário no dia a dia: `buscar_dicionario`, `descrever_tabela` e `caminho_entre_tabelas`.

# Fluxo de branches

```
feat/*, fix/*, docs/*  ->  develop  ->  main
        (squash)       (merge commit)
```

- **Branch de trabalho para `develop`: squash** ("Squash and merge"). Um commit limpo por mudança, e a branch é
  apagada depois, então nada depende dela.
- **`develop` para `main`: merge commit** ("Create a merge commit"). Assim o `develop` continua sendo ancestral da
  `main` e **não há nada para realinhar** depois de cada versão.

- **main:** o que as empresas instalam. Só recebe pull request de `develop`, com `resultado` verde. Cada merge na
  `main` é uma versão publicável: suba a versão em `.claude-plugin/plugin.json` (no `develop`, antes do pull request)
  e crie a tag na `main`.
- **develop:** integração. Recebe pull request das branches de trabalho, com `resultado` verde, em squash. Sem push
  direto. O Dependabot abre os pull requests aqui.
- **Branch de trabalho:** nasce de `develop`, uma por assunto (`feat/`, `fix/`, `docs/`, `ci/`), apagada depois do merge.

## Publicar uma versão

1. Pull request das mudanças para o `develop` (squash) e, na última, a versão nova em `plugin.json`.
2. Pull request de `develop` para `main`, com `resultado` verde, merge commit.
3. Tag da versão na `main`: `git fetch origin` e `git tag v0.3.0 origin/main` e `git push origin v0.3.0`.

Não existe passo de realinhar o `develop`. A `main` fica com um commit de junção a mais; o `develop` não precisa recebê-lo,
porque ele não traz conteúdo novo.

> **Por que squash numa ponta e merge commit na outra?** O squash é ótimo para uma branch que será apagada. Mas numa
> branch que continua viva e é promovida (o `develop` indo para a `main`), ele cria na `main` um commit com outro
> hash: o `develop` deixa de ser ancestral da `main`, o pull request seguinte lista de novo os commits antigos e é
> preciso um merge de realinhamento a cada versão. O merge commit só nessa promoção mantém as duas ligadas.

## Regras no GitHub

Ficam em Settings, Rules, Rulesets (a do `develop` também em arquivo, para repetir em outro repositório):

| Branch | Regra | Onde |
|---|---|---|
| `main` | sem apagar nem reescrever, pull request, `resultado` verde. **Sem** "Require linear history" e **sem** "Require branches to be up to date". Método de merge permitido: **só Merge** | "Main Protect" |
| `develop` | sem apagar nem reescrever, pull request, `resultado` verde (não precisa estar atualizado). Método de merge permitido: **só Squash** | `.github/rulesets/develop.json` |

Travar o método na regra faz o botão do pull request oferecer só o certo para aquela branch: não dá para fazer
squash na `main` nem merge commit no `develop` por engano. Em "Main Protect", dentro de "Require a pull request before
merging", desmarque "Squash" e "Rebase" em **Allowed merge methods** e deixe só "Merge".

Os dois itens desligados na `main` são o que permite o merge commit sem atrito: o histórico linear barra o commit de
junção, e "estar atualizado" exigiria atualizar o `develop` com a `main` a cada release.

Aplicar a regra do `develop` (precisa de conta com permissão de administrador no repositório):

```
gh api -X POST repos/Victups/sankhya-analista/rulesets --input .github/rulesets/develop.json
```

`resultado` é o job de `.github/workflows/testes.yml` que passa só se todos os testes da matriz passarem. Para o botão
"Create a merge commit" aparecer, Settings, General, Pull Requests, **Allow merge commits** precisa estar marcado.

## Se o `develop` ficar para trás da `main`

Acontece depois de um squash feito por engano. O conteúdo continua igual; só o histórico diverge. Para juntar sem
force push, abra um pull request de `main` para `develop` e faça o merge com **merge commit**.

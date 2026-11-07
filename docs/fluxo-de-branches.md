# Fluxo de branches

```
feat/*, fix/*, docs/*  ->  develop  ->  main
        (squash)         (squash)
```

- **main:** o que as empresas instalam. Só recebe pull request de `develop`, com `resultado` verde, em **squash**
  (a regra exige histórico linear). Cada squash na `main` é uma versão publicável: suba a versão em
  `.claude-plugin/plugin.json` e crie a tag nela.
- **develop:** integração. Recebe pull request das branches de trabalho, com `resultado` verde, em **squash**.
  Sem push direto. O Dependabot abre os pull requests aqui.
- **Branch de trabalho:** nasce de `develop`, uma por assunto (`feat/`, `fix/`, `docs/`, `ci/`), apagada depois do merge.

## Publicar uma versão

1. Pull request de `develop` para `main`, squash, depois do `resultado` verde.
2. Alinhar o `develop` com a `main`: o squash cria na `main` um commit com outro hash, e sem este passo o próximo
   pull request volta a listar commits antigos. Pelo GitHub, abra um pull request de `main` para `develop` e faça
   o merge com **merge commit** (o conteúdo é igual, só o histórico se junta). Nunca force o push.
3. Tag da versão na `main`: `git tag v0.3.0 origin/main` e `git push origin v0.3.0`.

## Regras no GitHub

Ficam em arquivo para repetir em outro repositório:

| Branch | Regra | Onde |
|---|---|---|
| `main` | sem apagar nem reescrever, histórico linear, pull request, `resultado` atualizado com a `main` | Settings, Rules (já existe: "Main Protect") |
| `develop` | sem apagar nem reescrever, pull request, `resultado` (não precisa estar atualizado) | `.github/rulesets/develop.json` |

Aplicar a regra do `develop` (precisa de conta com permissão de administrador no repositório):

```
gh api -X POST repos/Victups/sankhya-analista/rulesets --input .github/rulesets/develop.json
```

`resultado` é o job de `.github/workflows/testes.yml` que passa só se todos os testes da matriz passarem.

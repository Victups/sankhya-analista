---
name: investigar-trava
description: Descobrir de onde vem uma mensagem de bloqueio ou erro que impede uma operação (nativa do Sankhya, regra de negócio, trigger ou procedure do banco, evento Java). Use quando a pessoa colar um texto de erro como "Operação não permitida..." ou perguntar quem está travando uma tela.
---

# Investigar uma trava

Responde "quem está travando isto?". Só leitura. A skill `investigar` cuida do problema como um todo; esta separa a origem da mensagem.

1. **Texto exato.** Peça a mensagem inteira, com o código se houver, e a tela, a TOP e a empresa. Separe as partes que
   mudam (número de nota, produto, valor) das partes fixas: só a parte fixa serve de busca.

2. **Classificar pelo texto.**
   - **`[CORE_E…]` no começo** (ex.: `[CORE_E04176]`): mensagem do núcleo do Sankhya. `buscar_ajuda` com o código ou com
     a parte fixa: a ajuda oficial traz a causa e a solução (visto na Central de Ajuda, jul/2026).
   - **`ORA-` no começo:** veio do banco: trigger, procedure ou restrição. `ORA-20000` a `ORA-20999` são erros
     definidos por quem programou (`RAISE_APPLICATION_ERROR`), mas triggers nativas do Sankhya também os usam.
   - **Sem código:** pode ser regra de negócio, evento programável, código Java de extensão ou mensagem nativa
     antiga. Siga os passos 3 a 5. Código ausente não prova que é personalização.

3. **Regras de negócio** (Configurações › Avançado › Regras de Negócio): a regra aponta uma procedure, e a mensagem que
   aparece é a que a procedure devolve. As regras de uma TOP rodam na ordem de `TGFTRN.SEQEXEC` (ajuda oficial).
   ```sql
   SELECT X.SEQEXEC, R.NURNG, R.DESCRICAO, R.ATIVO, R.ONDE, R.QUANDO, R.EVENTO, R.EXPRESSAO AS PROCEDURE_DA_REGRA
   FROM TGFTRN X JOIN TGFRNG R ON R.NURNG = X.NURNG
   WHERE X.CODTIPOPER = <TOP> ORDER BY X.SEQEXEC
   ```
   Regra sem evento de liberação cancela a operação e mostra a mensagem. Com evento, vira pedido de liberação.

4. **Texto da mensagem dentro do código do banco.** Use um trecho fixo, **sem acento** (troque a letra acentuada por `_`)
   e em maiúsculas:
   ```sql
   SELECT S.TYPE AS TIPO, S.NAME AS NOME, S.LINE AS LINHA, TRIM(S.TEXT) AS TRECHO,
          O.CREATED AS CRIADO_EM, O.LAST_DDL_TIME AS ALTERADO_EM
   FROM ALL_SOURCE S
   JOIN ALL_OBJECTS O ON O.OWNER = S.OWNER AND O.OBJECT_NAME = S.NAME AND O.OBJECT_TYPE = S.TYPE
   WHERE S.OWNER = '<DONO>' AND UPPER(S.TEXT) LIKE '%<TRECHO FIXO SEM ACENTO>%'
   ```
   Achou: a trava vem daquele objeto (procedure, função, pacote ou trigger). Leia as linhas em volta
   (`WHERE S.NAME = ... AND S.LINE BETWEEN ... AND ...`) para ver a condição que dispara. Em trigger, veja também a
   tabela e o momento: `ALL_TRIGGERS` (`TABLE_NAME`, `TRIGGER_TYPE`, `TRIGGERING_EVENT`, `STATUS`).
   **O objeto pode ser do próprio Sankhya.** A mensagem "estoque insuficiente", por exemplo, existe em procedure e
   trigger nativas (visto numa base, nov/2026), e as tabelas centrais têm dezenas de triggers nativas: existir trigger
   ou achar o texto não prova que é personalização. Pistas, nenhuma conclusiva sozinha: nome fora do padrão do
   Sankhya ou com sigla da empresa; `CRIADO_EM` e `ALTERADO_EM` posteriores à instalação ou à última atualização (numa
   base recriada por cópia todos os objetos têm a mesma data, e a pista some); a mesma procedure existir numa base de
   outra empresa. Confirme com quem mantém o banco antes de chamar de personalização.

5. **Eventos programáveis e botões.** A tela fica numa instância (`descrever_tabela` mostra o nome). Eventos ativos
   dessa instância:
   ```sql
   SELECT E.NUEVENTO, E.DESCRICAO, E.TIPO, E.ATIVO, SUBSTR(TO_CHAR(E.CONFIG), 1, 300) AS CONFIG
   FROM TSIEVP E WHERE E.NOMEINSTANCIA = '<INSTANCIA>' AND E.ATIVO = 'S'
   ```
   O `CONFIG` mostra a classe Java ou a procedure chamada; a mensagem em si fica dentro do código compilado e **não** dá para
   buscar pelo banco. Se não achou o texto em lugar nenhum, sem código `CORE_` e há evento ativo na instância, a hipótese
   é o evento Java: diga que é hipótese e quem pode confirmar (quem mantém a extensão).

6. **Ordem de execução.** Só afirme o que tem fonte:
   - Regras de negócio da mesma TOP: por `SEQEXEC` (ajuda oficial).
   - Triggers do mesmo tipo e momento na mesma tabela: sem a cláusula `FOLLOWS`, a ordem do Oracle não é garantida.
   - Entre trigger Oracle, regra de negócio e evento Java: **não há fonte**. Diga "a validar" e, para isolar um
     conflito, proponha testar na base de teste com uma peça desativada de cada vez.

7. **Resposta.** Origem (nativa, regra N, procedure/trigger X, evento Y, hipótese de Java), a evidência (consulta,
   artigo da ajuda), a condição que dispara a trava e as opções: ajustar o dado, pedir liberação, ou alterar a
   regra pela tela por quem tem acesso. Nunca desative trigger nem regra pelo banco. Registre o que se confirmou
   (skill `registrar`).

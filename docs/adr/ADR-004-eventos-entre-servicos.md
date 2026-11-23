# ADR-004 — Comunicação por eventos entre Acompanhamento e Gamificação

- **Status:** Aceita e implementada (revisada durante a implementação)
- **Data:** 03/11/2026 — Jira GDL-24; implementação GDL-70, GDL-71, GDL-72, GDL-76, GDL-77, GDL-79

## Contexto
Antes, quatro controllers do Express chamavam `verificarConquistas()` de forma síncrona e devolviam `novasConquistas` na resposta. Com a Gamificação no NestJS, o serviço precisava das estatísticas do leitor sem consultar o banco do Express e sem chamada HTTP entre os serviços.

## Decisão
O Backend Principal publica eventos no Redis Pub/Sub depois que a escrita foi gravada; o Conquistas Service consome.

### `estatisticas.atualizadas`
- **Quando:** resposta 2xx de qualquer escrita (`POST/PUT/PATCH/DELETE`) em `/api/livros`, `/api/leituras`, `/api/anotacoes`, `/api/sessoes`, `/api/metas` (middleware `publicarEstatisticasAposEscrita`, no evento `finish` da resposta).
- **Formato** (transporte Redis do NestJS):
```json
{ "pattern": "estatisticas.atualizadas",
  "data": { "usuarioId": 1, "geradoEm": "2026-11-20T18:55:12.669Z",
            "estatisticas": { "livrosLidos": 3, "livrosCadastrados": 3, "paginasLidas": 975,
                              "totalSessoes": 4, "totalAnotacoes": 2, "totalAvaliacoes": 1,
                              "possuiMeta": true, "livrosLidosPorGenero": { "3": 2 } } } }
```
- **Consumidor:** valida o formato (evento inválido é registrado e ignorado), grava `estatisticas_leitor` só se `geradoEm` for mais novo que o gravado, concede as conquistas atingidas uma única vez e invalida o cache do catálogo do leitor.

### `usuario.permissao_alterada`
- **Quando:** admin promove ou rebaixa um usuário.
- **Payload:** `usuarioId`, `tipo_usuario`, `alteradoEm`.
- **Consumidor:** grava `auth:revogado:<id>` com TTL de 5 h (duração do token); o guard recusa (401) tokens emitidos até esse momento. Com o Redis fora, rotas de admin respondem 503.

## Revisão em relação à proposta original
A proposta de 03/11 previa quatro eventos (`leitura.atualizada`, `sessao.registrada`, `meta.salva`, `anotacao.criada`) e um `idEvento`. Na implementação, a equipe escolheu **um evento único com snapshot cumulativo**, porque:
- o consumidor precisa do total, não da mudança — um snapshot torna o reprocessamento idempotente;
- a ordem é resolvida por `geradoEm` (evento atrasado é descartado);
- duplicidade é resolvida pela PK `(id_usuario, id_conquista)`.
A correlação nos logs é feita por `usuario=<id>` e horário, em vez de `idEvento`.

## Garantias e compensações
| Problema do Pub/Sub | Tratamento |
|---|---|
| Consumidor fora do ar (ninguém assina) | `PUBLISH` retorna 0 → Express grava o snapshot em `eventos:pendentes:estatisticas.atualizadas` (um campo por leitor). O NestJS processa o hash ao subir e a cada 30 s, apagando com compare-and-delete (GDL-76) |
| Redis fora do ar | Publicação falha, é registrada no log e não quebra a requisição; o próximo evento do leitor traz o snapshot completo |
| Evento duplicado | PK composta: conquista não é concedida duas vezes |
| Evento fora de ordem | Upsert condicional por `gerado_em` |

## Como o app descobre conquistas novas
`novasConquistas` saiu das respostas do Express (GDL-75). O app chama `GET /api/conquistas/novas` 0,8 s e 2,5 s depois de uma escrita; a rota devolve as concessões com `visualizada = 0` e as marca como vistas na mesma transação (`SELECT … FOR UPDATE`), então duas chamadas ao mesmo tempo não repetem o aviso (GDL-72).

## Testes
`eventos.test.ts` e `usuarioEventos.test.ts` (Express); `estatisticas-*.spec.ts`, `servidor-redis-eventos.spec.ts`, `eventos.banco-spec.ts`, `novas.banco-spec.ts` e `fluxo-eventos.e2e-spec.ts` (NestJS, este último com Redis e MySQL reais no CI — GDL-77).
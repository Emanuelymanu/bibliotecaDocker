# Estratégias de resiliência

## Implementado
| Estratégia | Onde | Issue |
|---|---|---|
| Fallback do cache para o banco | Catálogo de conquistas (Nest) e dashboard (Express) | GDL-10, GDL-12 |
| Timeout de 300 ms nas operações de cache | `CacheCatalogoService` | GDL-10 |
| Publicação que não quebra a requisição | `publicadorEventos.ts`: `disableOfflineQueue`, timeout de conexão 2 s, falha só vai para o log | GDL-70 |
| Reconexão com backoff | Clientes Redis (até 5 s entre tentativas); Nest reassina sozinho quando o Redis volta | GDL-70, GDL-71 |
| Fila de pendentes quando o consumidor está fora | Hash `eventos:pendentes:*`, processado ao subir e a cada 30 s | GDL-76 |
| Idempotência e ordem | Snapshot cumulativo, upsert por `gerado_em`, PK composta | GDL-71 |
| Isolamento de falha | Nginx responde 503 JSON só para `/api/conquistas`; Express segue | GDL-73, GDL-76 |
| Fail-closed em admin | Rotas de admin do Nest respondem 503 se não der para checar revogação | GDL-79 |
| Reinício de containers | `restart: always`; healthchecks no MySQL, Redis e conquistas-service | GDL-74 |

## Não implementado / pendente
- Timeout e retry explícitos no `axios.get` do Google Books.
- Circuit breaker.
- Backup/restore automatizado do MySQL.
- Rate limiting no login.

## Diretriz
Timeout em integrações externas; retries limitados com backoff só para operações idempotentes; circuit breaker quando a integração justificar. Se perder evento passar a ser inaceitável, trocar Pub/Sub por Redis Streams ou outbox.
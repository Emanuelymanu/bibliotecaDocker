# Observabilidade

## Implementado (GDL-34)
- **Logger estruturado (pino)** no Express (`src/logger.ts`) e no NestJS (`nestjs-pino`).
- **Uma linha por requisição:** método, rota, status, duração, `reqId` e usuário. Nível pelo status: 2xx/3xx INFO, 4xx WARN, 5xx ERROR. `/health` não é registrado.
- **`X-Request-Id`** em toda resposta; erros saem com a rota, o usuário, a pilha e o mesmo `reqId`.
- **Eventos:** publicação, recebimento, evento ignorado, evento atrasado descartado, pendentes guardados/processados, queda e volta do Redis (logado uma vez).
- **Cache:** HIT/MISS/invalidação da dashboard (Express) e do catálogo (NestJS).
- **Segurança:** recusa de token revogado e 503 de admin com Redis fora.
- **Erros (GDL-35):** 4xx saem como WARN com a mensagem e a rota; 5xx como ERROR com a pilha; o cliente recebe `{ erro, statusCode }` com o mesmo `X-Request-Id`. Controllers antigos com `try/catch` próprio registram com `logErro` (mesma pilha e `reqId`).
- **Google Books (GDL-32):** tentativas que falharam, abertura e fechamento do circuito.
- Token e senha nunca vão para o log (`redact`). SQL do Sequelize só com `LOG_NIVEL=debug`.
- Nginx registra `$request_time` e `$upstream_response_time`.

| Variável | Valores | Padrão |
|---|---|---|
| `LOG_NIVEL` | `debug`, `info`, `warn`, `error` | `info` (testes: `silent`) |
| `LOG_FORMATO` | `texto` (legível) ou `json` (uma linha JSON por evento) | `texto` |

## Onde ver
```
docker compose logs -f backend conquistas-service
docker compose logs backend conquistas-service | Select-String "<reqId>"
```

## Métricas a coletar (plano)
- Latência p50/p95/p99 por rota (a partir da linha de requisição).
- Taxa 4xx/5xx por rota.
- Proporção HIT/MISS do cache.
- Eventos publicados × recebidos; pendentes guardados.
- Reinícios e healthchecks dos containers.

Prometheus/Grafana não estão implementados; com `LOG_FORMATO=json` os logs podem ser enviados a uma ferramenta de agregação
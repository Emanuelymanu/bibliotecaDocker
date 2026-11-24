# SLI e SLO

## SLIs e fonte de dados
| SLI | Fonte | Como calcular |
|---|---|---|
| Latência HTTP | Linha de requisição do pino (duração) e Nginx (`$request_time`) | p50/p95/p99 por rota |
| Taxa de erro HTTP | Nível ERROR das linhas de requisição | respostas 5xx / total |
| Disponibilidade | Healthchecks do Compose (MySQL, Redis, conquistas-service) | verificações saudáveis / total |
| Cache HIT | Cabeçalho `X-Cache` e logs de cache | HIT / (HIT + MISS) |
| Entrega de eventos | Logs `publicado ... (N assinante(s))` × `recebido` | recebidos / publicados |
| Atraso da conquista | Horário da escrita × `recebido` no serviço | p95 do atraso |

## SLOs propostos (ainda não medidos)
- p95 menor que 500 ms nos endpoints críticos (login, listar livros, catálogo) sob a carga da apresentação.
- Taxa de 5xx menor que 1%.
- 99% dos eventos de estatísticas consumidos em até 5 s.
- Conquista aparece no app em até 3 s depois da escrita (o app consulta em 0,8 s e 2,5 s).

Antes de declarar cumprimento, registrar ambiente, período, carga, número de requisições, resultado e evidência. Com `LOG_FORMATO=json`, o cálculo pode ser feito direto dos logs.
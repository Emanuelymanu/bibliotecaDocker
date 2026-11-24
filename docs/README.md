# Estante Digital — Documentação do Projeto

> Documentação organizada pela rubrica da disciplina. Atualizada em 23/11/2026 (Sprint 7).

## Índice

- [Arquitetura](arquitetura/README.md)
- [ADRs](adr/README.md)
- [API OpenAPI](api/README.md)
- [Operação e qualidade](operacao/README.md)
- [CI/CD e deploy](devops/README.md)
- [Gestão e Cynefin](gestao/README.md)
- [Diagramas](diagramas/README.md)

## Estado do sistema
| Componente | Estado |
|---|---|
| Backend Principal | Express 5, TypeScript, Sequelize, MySQL; catálogo, leituras, sessões, metas, anotações, lista de desejos, perfil, autenticação e administração; publica eventos no Redis; Google Books com timeout, retry e circuit breaker |
| Conquistas Service | NestJS, TypeORM; rotas do leitor (`/api/conquistas`, `/catalogo`, `/novas`) e do admin, DTOs, regras estruturadas, JWT com revogação, cache, consumo de eventos, migrações |
| Nginx | Único ponto de entrada (HTTPS); `/api/conquistas` → NestJS, demais `/api/` → Express, `/` → frontend; 503 JSON se o NestJS cair |
| MySQL | MySQL 8, schemas `projeto5p` e `gamificacao`, usuário separado para a gamificação |
| Redis | Cache (catálogo de conquistas), Pub/Sub (`estatisticas.atualizadas`, `usuario.permissao_alterada`), eventos pendentes, revogação de tokens |
| Docker Compose | MySQL, Redis, backend, conquistas-service, frontend e Nginx, com healthchecks |
| CI/CD | GitHub Actions: build e testes dos três projetos (NestJS com MySQL e Redis reais), build das imagens, publicação no GHCR por tag |
| Logs e erros | pino nos dois serviços, uma linha por requisição, `X-Request-Id`; tratamento central de erros no Express (GDL-35) e filtro global no NestJS, com resposta `{ erro, statusCode }` |
| Jira | Projeto GDL, 6 sprints registradas (Sprint 2 a Sprint 7; o MVP foi feito antes do Jira), histórias com critérios de aceite |
| Releases | v1.0.0, v1.1.0, v1.2.0; v1.3.0 ao fim da Sprint 7 |

## Convenção de status
- **Atendido / Implementado:** código ou configuração sustenta a afirmação, com evidência indicada.
- **Parcial:** existe parte funcional, mas falta algo para o requisito completo.
- **Proposto:** decisão ou meta sem implementação ou medição.


# Matriz de atendimento à rubrica

Checklist da entrega, na mesma ordem e com os mesmos pesos da rubrica (9,0 pontos). Situação em 23/11/2026, conferida no código da `dev`, no GitHub Actions e no Jira.

## 1. Arquitetura de Software — 3,0

| Critério (peso) | O que a rubrica pede | Evidência | Estado |
|---|---|---|---|
| Documentação Arquitetural (0,5) | C4 Contexto e Containers; ADRs; Quality Scenarios | [C4 Contexto](diagramas/c4-contexto.png), [C4 Containers](diagramas/c4-containers.png), [ADR-001 a 005](adr/README.md), [Quality Scenarios](arquitetura/quality-scenarios.md) | Atendido |
| Estilos Arquiteturais e DDD (1,0) | Context Map; Bounded Contexts; Entities, VOs e Aggregates de pelo menos 1 contexto | [Context Map](arquitetura/context-map.md), [Bounded Contexts](arquitetura/bounded-contexts.md), [Modelo de domínio da Gamificação](arquitetura/modelo-dominio-gamificacao.md) | Atendido |
| Integração, APIs e Dados (0,5) | OpenAPI dos principais endpoints; ADR do banco | [openapi.yaml](api/openapi.yaml) (válido no Redocly), [ADR-002](adr/ADR-002-mysql-8-e-schemas.md) | Atendido |
| Atributos de Qualidade (0,5) | SLOs/SLIs; estratégias de resiliência; plano de observabilidade | [SLI/SLO](operacao/slis-slos.md), [Resiliência](operacao/resiliencia.md), [Observabilidade](operacao/observabilidade.md) | Atendido (SLOs propostos, ainda sem medição) |
| Entrega Contínua (0,5) | Pipeline CI/CD (build, test, deploy); estratégia de deploy; runbook | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) e [CI/CD](devops/ci-cd.md), [Deploy e rollback](devops/deploy.md), [Runbook](operacao/runbook.md) | Atendido |

## 2. Back-end Avançado — 3,0

| Critério (peso) | O que a rubrica pede | Evidência | Estado |
|---|---|---|---|
| Cache Distribuído com Redis (1,0) | Cache-aside em consultas frequentes; TTL; invalidação em updates | Catálogo de conquistas (`CacheCatalogoService`, GDL-10/11) e dashboard (`cacheDashboard.ts`, GDL-12); [ADR-003](adr/ADR-003-redis-cache-e-mensageria.md) | Atendido (dashboard em revisão) |
| Mensageria e Eventos (0,5) | Redis Pub/Sub para publicar e consumir; logs que comprovam | Express publica, NestJS consome (GDL-70/71/79); pendentes (GDL-76); teste e2e no CI (GDL-77); [Mensageria](operacao/mensageria.md), [ADR-004](adr/ADR-004-eventos-entre-servicos.md) | Atendido |
| Docker Compose e Nginx (1,0) | Orquestração correta; Nginx como proxy reverso | `docker-compose.yaml` (6 serviços, healthchecks, rede interna, só o Nginx exposto); Nginx com HTTPS e roteamento `/api/conquistas` → NestJS, demais → Express, 503 JSON (GDL-73, GDL-74) | Atendido |
| Boas Práticas e Observabilidade (0,5) | Organização (módulos, DTOs, services, controllers); logs claros; tratamento de erros | NestJS modular com DTOs e filtro global de exceções; logger pino com `X-Request-Id` nos dois serviços (GDL-34); middleware central de erros no Express (GDL-35) | Parcial até o merge do GDL-35; Express ainda sem DTOs (GDL-36) |

## 3. Tech Forge — 3,0

| Critério (peso) | O que a rubrica pede | Evidência | Estado |
|---|---|---|---|
| Gestão via Jira (1,0) | Issues (stories, tasks, bugs), atribuições, status | Projeto GDL: 8 épicos, histórias, tarefas e 9 bugs, com responsável e status; fluxo A fazer → Fazendo → Em revisão → Feito; [Backlog e Sprints](gestao/product-backlog.md) | Atendido |
| Cynefin e abordagem (1,0) | Classificar o projeto e justificar a abordagem | [Análise Cynefin](gestao/analise-cynefin.md): domínio Complexo → Scrum (adaptativo) | Atendido |
| Ciclo de vida / Scrum (1,0) | Backlog priorizado com User Stories e critérios de aceite; versões parciais | [Backlog e Sprints](gestao/product-backlog.md), [Histórias](gestao/historias-e-criterios.md), [Versionamento](gestao/versionamento.md) (v1.0.0, v1.1.0, v1.2.0) | Atendido |

## Pendências antes da apresentação
1. Merge do GDL-12 (cache da dashboard) e do GDL-35 (tratamento central de erros).
2. Release 1.3.0 (CHANGELOG + tag), fechando a Sprint 7.
3. GDL-42: ensaiar a demonstração.

## Roteiro de evidências para a apresentação
- Diagramas C4, Context Map e modelo de domínio.
- `docker compose ps` (todos saudáveis) e acesso por `https://estantedigital.local`.
- Cache: duas chamadas ao catálogo/dashboard mostrando `X-Cache: MISS` e depois `HIT`; uma escrita e de novo `MISS`.
- Pub/Sub: `docker compose logs -f backend conquistas-service` enquanto registra uma sessão no app (publicado → recebido → desbloqueou → celebração no app).
- Resiliência: parar o `conquistas-service`, mostrar o app funcionando e o 503 em `/api/conquistas`; religar e ver os pendentes processados.
- GitHub Actions: PR verde e job `deploy` da `v1.2.0`.
- Jira: board da sprint, backlog, uma história com critérios de aceite, relatório de sprints.
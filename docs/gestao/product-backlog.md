# Product Backlog e Sprints

Fonte: Jira, projeto **GDL** (board 34), consultado em 23/11/2026. Responsáveis: Emanuely Bueno (desenvolvimento) e João Vitor Quinto (documentação de arquitetura e gestão).

## Épicos
| Épico | Tema |
|---|---|
| GDL-6 | MVP — funcionalidades já entregues (GDL-43 a GDL-50) |
| GDL-1 | Cache e Mensageria com Redis |
| GDL-2 | Infraestrutura e Entrega Contínua |
| GDL-3 | Documentação de Arquitetura |
| GDL-4 | Qualidade de Código e Observabilidade |
| GDL-5 | Gestão do Projeto |
| GDL-7 | Conquistas com critério estruturado |
| GDL-8 | Microsserviço de Gamificação |

## Sprints

| Sprint | Período | Objetivo | Issues concluídas |
|---|---|---|---|
| Sprint 2 | 13/10 – 19/10 | Corrigir segurança e repositório | GDL-13, 14, 15, 38 (bugs) |
| Sprint 3 — Cache com Redis | 19/10 – 27/10 | Redis no Compose; base do serviço NestJS; correções de conquistas | GDL-9, 52, 53, 55, 62, 64, 65, 78 |
| Sprint 4 — Nest e Cache | 27/10 – 02/11 | Conquistas servidas pelo NestJS (banco próprio, JWT e módulo) com cache-aside e invalidação | GDL-10, 11, 66, 67, 68, 19, 20, 21–25 |
| Sprint 5 — Eventos | 03/11 – 09/11 | Monólito publica eventos e o serviço consome; serviço no Compose e no Nginx; revogação de admin; CI/CD; modelo de domínio e OpenAPI | GDL-16, 17, 18, 27–30, 39, 40, 41, 57, 58, 60, 70, 71, 73, 74, 79 |
| Sprint 6 — Migração | 09/11 – 20/11 | Código antigo removido; sistema resiliente com o serviço fora; teste do fluxo; qualidade, SLO, observabilidade | GDL-26, 31, 32, 33, 51, 54, 69, 72, 75, 76, 77 |
| Sprint 7 — Finalização | 20/11 – 23/11 | Logger, tratamento central de erros, cache da dashboard, apresentação | GDL-34 (feito), GDL-12 e GDL-35 (em andamento), GDL-42 |

Na Sprint 6 o time não fechou GDL-34, GDL-35, GDL-12 e GDL-42; eles foram levados para a Sprint 7 (replanejamento registrado no Jira).

## Backlog restante (priorizado)
| Prioridade | Issue | Tipo | Item | Status |
|---|---|---|---|---|
| 1 | GDL-35 | Tarefa | Middleware central de tratamento de erros | Fazendo |
| 2 | GDL-12 | História | Cache da dashboard do usuário | Fazendo (branch enviada, aguardando PR) |
| 3 | GDL-42 | Tarefa | Preparar apresentação final | A fazer |
| 4 | GDL-36 | Tarefa | Criar DTOs para livros e leituras | Fora das sprints |
| 5 | GDL-37 | Tarefa | Mover regras de negócio para services | Fora das sprints |
| — | GDL-61 | Tarefa | ConquistaService no Express | Cancelado (substituído pela extração para o NestJS) |

## Bugs registrados e corrigidos
GDL-13 (porta MySQL exposta), GDL-14 (backend fora do Nginx), GDL-15 (`.env` versionado), GDL-38 (testes ignorados), GDL-51 (acento), GDL-52 (chave duplicada), GDL-53 (falha nas conquistas derrubava o progresso), GDL-54 (palavras parecidas), GDL-78 (`package.json` ignorado).
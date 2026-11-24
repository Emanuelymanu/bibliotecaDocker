# Product Backlog e Sprints

Fonte: Jira, projeto **GDL** (board 34), consultado em 23/11/2026. Product Owner e Scrum Master: Emanuely Bueno; time de desenvolvimento: Emanuely Bueno e João Vitor Quinto (ver [Papéis da equipe](#papéis-da-equipe)).

## Papéis da equipe

Jira GDL-40. A equipe tem duas pessoas, então os papéis do Scrum foram acumulados — o que é comum em times pequenos. A divisão abaixo é a que aconteceu na prática.

| Papel | Quem | Responsabilidades |
|---|---|---|
| **Product Owner** | Emanuely Bueno | Criar e manter o Product Backlog no Jira (épicos, histórias, tarefas, bugs); escrever critérios de aceite; priorizar o que entra em cada sprint; aceitar as entregas (mover para Feito após o merge) |
| **Scrum Master** | Emanuely Bueno | Criar e fechar as sprints com objetivo definido; manter o fluxo do board (A fazer → Fazendo → Em Revisão → Feito); replanejar quando a sprint não fechou (Sprint 6 → Sprint 7); cuidar do processo de branch, PR e release |
| **Time de desenvolvimento** | Emanuely Bueno e João Vitor Quinto | Emanuely: backend Express, serviço NestJS, eventos Redis, cache, Docker/Nginx, CI/CD, web e mobile. João: documentação de arquitetura (C4, ADRs, DDD, OpenAPI, cenários de qualidade, SLO, observabilidade), estratégia de deploy, runbook e revisão dos PRs |

### Como os papéis aparecem no processo
- **Planejamento:** a PO escolhe os itens do backlog e o objetivo da sprint no Jira.
- **Execução:** cada item vira uma branch `feature/GDL-XX-...`; o card vai para Fazendo.
- **Revisão:** PR para `dev`, CI verde e revisão do outro integrante; o card vai para Em Revisão.
- **Aceite:** depois do merge, a PO move o card para Feito.
- **Entrega:** ao fim do ciclo, release versionada (`release/x.y.z` → `main` → tag).

### Limites assumidos
Com a mesma pessoa como PO, Scrum Master e desenvolvedora, há menos separação entre "quem pede" e "quem faz". A equipe compensou isso com critérios de aceite escritos antes do desenvolvimento nas histórias novas e com a revisão de código feita pelo outro integrante.

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
| Sprint 7 — Finalização | 20/11 – 23/11 | Logger, tratamento central de erros, apresentação | GDL-34, GDL-12, GDL-35, GDL-80, GDL-32 (implementação) e GDL-42 |

Na Sprint 6 o time não fechou GDL-34, GDL-35, GDL-12 e GDL-42; eles foram levados para a Sprint 7 (replanejamento registrado no Jira). Na revisão final, o time encontrou o GDL-32 (Sprint 6) marcado como Feito sem código e implementou a resiliência na Sprint 7 (PR #51) — exemplo de inspeção e adaptação.

## Concluído na Sprint 7
GDL-34 (logger, PR #47), GDL-35 (tratamento de erros, PR #50), GDL-80 (documentação, PR #49), GDL-12 (PR #48), GDL-32 (resiliência do Google Books, PR #51) e GDL-42 (apresentação final).

## Cancelado
GDL-61 (ConquistaService no Express): fechado como Feito com o título "[Cancelado]", porque foi substituído pela extração da Gamificação para o NestJS.

## Backlog restante (priorizado)
Dívida técnica conhecida, fora das sprints:

| Prioridade | Issue | Tipo | Item | Status |
|---|---|---|---|---|
| 1 | GDL-36 | Tarefa | Criar DTOs para livros e leituras | Fora das sprints |
| 2 | GDL-37 | Tarefa | Mover regras de negócio para services | Fora das sprints |

## Fora das sprints
- GDL-43 a GDL-50: histórias do MVP (épico GDL-6), entregues antes do Jira; registradas com critérios de aceite para compor o backlog.
- GDL-59 (Conceder conquista manualmente) e GDL-63 (data da conquista no fuso de São Paulo): concluídas junto com o épico GDL-7, sem sprint associada.

## Bugs registrados e corrigidos
GDL-13 (porta MySQL exposta), GDL-14 (backend fora do Nginx), GDL-15 (`.env` versionado), GDL-38 (testes ignorados), GDL-51 (acento), GDL-52 (chave duplicada), GDL-53 (falha nas conquistas derrubava o progresso), GDL-54 (palavras parecidas), GDL-78 (`package.json` ignorado).
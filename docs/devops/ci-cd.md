# CI/CD

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — Jira GDL-16.

## Quando roda
- Pull request para `dev` ou `main`: o resultado do CI aparece no PR (ex.: no #50 o CI acusou 2 testes falhando e a correção entrou antes do merge). A revisão de código foi feita pelo outro integrante, na maior parte fora do GitHub (conversa e testes locais); o GitHub registra revisão só no PR #47 (pedido de mudanças, corrigido antes do merge). Registrar a aprovação pelo botão **Review** fica como melhoria do processo.
- Push em `dev` ou `main`.
- Tag `v*` (ex.: `v1.2.0`) — além dos testes, publica as imagens.
- Manualmente (`workflow_dispatch`).

## Jobs

| Job | O que faz |
|---|---|
| `backend` | `npm ci`, build TypeScript e todos os testes Jest do Express |
| `conquistas-service` | Sobe **MySQL 8 e Redis 7 reais** como serviços, cria o schema `gamificacao` com `banco/init/01-gamificacao.sh`, build, testes unitários, e2e (`fluxo-eventos.e2e-spec.ts`: Redis → conquistas → `/novas`) e integração com banco |
| `frontend` | Build do React com Vite |
| `imagens` | Depende dos três anteriores: valida `docker-compose.yaml` e faz `docker compose build` |
| `deploy` | Só em tag `v*`: publica `estante-backend`, `estante-conquistas-service` e `estante-frontend` no GitHub Container Registry com a tag da versão e `latest` |

```
PR / push ──► backend ──┐
          ├► conquistas-service (MySQL + Redis) ─┼─► imagens ──► deploy (só tag v*)
          └► frontend ──┘
```

## Evidência
- Execuções na aba **Actions** do repositório em cada PR (ex.: PRs #44 a #47).
- Tags `v1.0.0`, `v1.1.0` e `v1.2.0`; a `v1.2.0` foi a primeira com o job `deploy` (verde), e as imagens estão em **Packages** do GitHub.
- Para a apresentação: print da aba Actions com um PR verde e do job `deploy` da `v1.2.0`.

## Outras verificações
- Commitlint + Husky validam a mensagem de commit (`type(scope): mensagem`).
- Gitflow: tudo entra em `dev` por PR; `main` só recebe release.
- Para o GitHub **impedir** o merge com CI vermelho, ative em *Settings → Branches* a regra da `dev` com "Require status checks to pass" e "Require a pull request before merging".
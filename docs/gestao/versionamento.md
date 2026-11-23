# Versionamento e releases

O `CHANGELOG.md` segue Keep a Changelog e Versionamento Semântico. Cada versão tem tag e Release no GitHub (GDL-41), e a tag dispara a publicação das imagens (ver [CI/CD](../devops/ci-cd.md)).

| Versão | Data | Conteúdo principal |
|---|---|---|
| **1.0.0** | 19/10/2026 | Primeira versão estável: o MVP (histórias GDL-43 a GDL-50) |
| **1.1.0** | 27/10/2026 | Serviço NestJS iniciado, schema `gamificacao`, critérios estruturados, Redis no Compose, testes e correções |
| **1.2.0** | 09/11/2026 | JWT e módulo de conquistas no NestJS, cache do catálogo, Compose e Nginx com o serviço, CI/CD, eventos Redis Pub/Sub, revogação de admin, app com conquistas estruturadas |
| **1.3.0** (próxima) | fim da Sprint 7 | `nome_genero`, remoção das conquistas do Express, `/api/conquistas/novas`, resiliência com o serviço fora, teste do fluxo de eventos, logger estruturado, cache da dashboard, tratamento central de erros |

## Fluxo
`feature/GDL-XX-...` → PR para `dev` → `release/x.y.z` (CHANGELOG) → PR para `main` → tag `vx.y.z`.

## Regra SemVer
- MAJOR: mudança incompatível de contrato.
- MINOR: funcionalidade compatível nova.
- PATCH: correção compatível.

Observação: a 1.3.0 remove `novasConquistas` das respostas do Express. Como o único cliente (o app) foi atualizado na mesma versão, a equipe tratou como MINOR.
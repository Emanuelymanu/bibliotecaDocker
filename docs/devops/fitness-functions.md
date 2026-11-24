# Architectural Fitness Functions

Verificações repetíveis que impedem regressões arquiteturais. Todas as marcadas como "no CI" rodam em cada PR.

| Regra | Verificação | Estado |
|---|---|---|
| Os serviços compilam | `npm run build` (Express, Nest, front) | No CI |
| Regras de conquistas corretas | `conquistas.regras.spec.ts`, `montar-criterio.spec.ts` | No CI |
| Cache-aside (HIT/MISS/fallback/invalidação) | `cache-catalogo.service.spec.ts`, `cacheDashboard.test.ts` | No CI |
| Contrato do evento entre serviços | `estatisticas-atualizadas.spec.ts` (consumidor) e `estatisticasLeitor.test.ts` (publicador, "no formato do conquistas-service") | No CI |
| Fluxo ponta a ponta por eventos | `fluxo-eventos.e2e-spec.ts` com Redis e MySQL reais | No CI |
| Idempotência e ordem dos eventos | `eventos.banco-spec.ts` | No CI |
| Revogação de token | `jwt-auth.guard.spec.ts`, `auth.e2e-spec.ts` | No CI |
| Resiliência do Google Books (timeout, retry, circuit breaker, fallback) | `googleBooksService.test.ts` | No CI |
| Tratamento central de erros (formato, 4xx/5xx, sem vazar detalhe interno) | `tratarErros.test.ts` | No CI |
| Compose válido e imagens constroem | `docker compose config` + `docker compose build` | No CI |
| Mensagem de commit no padrão | commitlint (Husky) | Local |
| Contrato OpenAPI válido | `npx @redocly/cli lint docs/api/openapi.yaml` | Manual |
| Segredos fora do Git | `.env` no `.gitignore`; `.env.example` sem credenciais | Manual (GDL-15) |
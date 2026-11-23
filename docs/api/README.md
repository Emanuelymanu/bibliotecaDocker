# Contrato OpenAPI

`openapi.yaml` (versão 1.3.0) descreve os endpoints públicos do sistema atrás do Nginx — Jira GDL-30.

## Roteamento
- `/api/conquistas` e subrotas: NestJS (`conquistas-service:3001`). Fora do ar → 503 JSON do Nginx.
- Demais `/api/` e `/upload`: Express (`backend:3000`).
- `/health`: respondido pelo próprio Nginx (só indica que o proxy está no ar).

Servidor local: `https://estantedigital.local`.

## O que mudou na 1.3.0
- Removido `novasConquistas` das respostas de leituras, sessões, anotações e metas (GDL-75).
- Nova rota `GET /api/conquistas/novas` (GDL-72).
- Conquista com `tipo`, `valor_alvo`, `id_genero` e `nome_genero` (GDL-68, GDL-69); catálogo com `progresso` e `total`.
- Cabeçalho `X-Cache` no catálogo e na dashboard (GDL-10, GDL-12); `X-Request-Id` em todas as respostas (GDL-34).
- Resposta 503 nas rotas de conquistas; promover/rebaixar documentam a revogação do token (GDL-79).
- Formato único de erro `{ erro, statusCode, detalhes? }` (GDL-35); busca no Google com 503/429 amigáveis (GDL-32).
- Rotas que faltavam: `GET /api/livros`, `POST /api/livros/cadastrar-com-google`, `/api/auth/perfil`.

## Validar
Na raiz do repositório:

```bash
npx @redocly/cli lint docs/api/openapi.yaml
```

Resultado em 23/11/2026: **válido**; os avisos são de `operationId` ausente e de respostas sem 4xx declarado, sem erros.

## Segurança
Rotas públicas não exigem bearer token; as demais exigem `Authorization: Bearer <token>`; rotas de administração exigem perfil admin. Conferir os decorators do NestJS e os middlewares do Express ao alterar rotas.
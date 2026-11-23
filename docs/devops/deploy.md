# Estratégia de deploy e rollback

Jira GDL-17. Estratégia escolhida: **deploy simples por versão com rollback para a tag anterior** (sem blue/green — o projeto roda em um único host com Docker Compose).

## Fluxo de release
1. Funcionalidades entram em `dev` por PR (CI verde + revisão).
2. No fim da sprint, branch `release/x.y.z`: atualizar `CHANGELOG.md` e versão.
3. PR da release para `main`; depois do merge, criar a tag `vx.y.z` e a Release no GitHub.
4. A tag dispara o job `deploy`, que publica as imagens versionadas no GHCR.
5. No servidor: `git checkout vx.y.z` e `docker compose up -d --build` (ou usar as imagens `:vx.y.z`).
6. Verificar: `docker compose ps` (todos `healthy`/`running`), `https://estantedigital.local/health`, login, uma rota do Express e `/api/conquistas/catalogo`.

## Rollback
1. Identificar a última versão estável (tag anterior, ex.: `v1.1.0`).
2. `git checkout v1.1.0` e `docker compose up -d --build` (ou trocar para as imagens `:v1.1.0`).
3. **Banco:** as migrações do conquistas-service só adicionam colunas com valor padrão, então a versão anterior continua funcionando com o schema novo. Só reverter migração (`npm run migration:revert`) com backup.
4. Registrar incidente e abrir bug no Jira.

## Limites
- Há alguns segundos de indisponibilidade durante `docker compose up` (sem blue/green).
- Não existe backup automatizado; antes de uma release com migração destrutiva, fazer `mysqldump` manual.
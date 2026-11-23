# ADR-002 — MySQL 8 e separação lógica por schema

- **Status:** Aceita e implementada
- **Data:** 29/10/2026 — Jira GDL-22

## Contexto
O sistema precisa de integridade referencial, unicidade, transações, consultas relacionais e suporte a caracteres Unicode. A Gamificação foi extraída para um contexto com persistência separada.

## Decisão
Adotar MySQL 8 em container Docker, com dois schemas no mesmo servidor: `projeto5p` para o backend principal e `gamificacao` para o serviço NestJS. O script `banco/init/01-gamificacao.sh` cria schema e usuário dedicado.

## Alternativas
- Banco relacional atende aos relacionamentos e transações.
- Redis não substitui persistência principal; atende cache e mensageria (ADR-003).

## Consequências
- Isolamento lógico por schema/credencial, não isolamento físico.
- Falha/indisponibilidade da instância MySQL afeta os dois serviços.
- Backend principal usa Sequelize; NestJS usa TypeORM e migrações versionadas.
- O backend principal usa `sequelize.sync()` na inicialização, controlado por `DB_SYNC` e `DB_SYNC_ALTER`; isso não equivale a um processo de migração único e uniforme.
- `id_usuario` e `id_genero` no schema `gamificacao` não possuem FK para o schema principal; por isso a conquista guarda também `nome_genero` (GDL-69) e as estatísticas chegam por evento, não por consulta ao outro schema.
- Volume `dados_mysql` oferece persistência, não backup. Rotina automatizada de backup não foi encontrada.
- Alguns scripts dependem de recursos do MySQL 8, como `REGEXP_SUBSTR`.

## Referências
`docker-compose.yaml`, `banco/init/01-gamificacao.sh`, migrações TypeORM em `conquistas-service/src/banco/migrations/`.
# conquistas-service

Microsserviço de **Gamificação** (conquistas) do Gerenciamento de Leituras, feito em **NestJS**.

Faz parte da extração do contexto Gamificação do backend principal (Express).
Ver o ADR-001 na documentação de arquitetura.

## Rodar localmente

Precisa do MySQL e do Redis do projeto ligados, com as portas liberadas só para a sua máquina.
O `docker-compose.yaml` não publica essas portas; crie (ou complete) o `docker-compose.override.yml`
na raiz do repositório, que está no `.gitignore` e é lido automaticamente pelo `docker compose`:

```yaml
services:
  banco:
    ports:
      - "127.0.0.1:3306:3306"
  redis:
    ports:
      - "127.0.0.1:6379:6379"
```

Depois, na raiz do repositório: `docker compose up -d banco redis`.
Sem a porta do Redis o serviço funciona, mas sem cache (`X-Cache: SEM_CACHE`).

```bash
npm install
cp .env.example .env      # preencha DB_PASSWORD
npm run migration:run     # cria/atualiza as tabelas do banco gamificacao
npm run start:dev
```

O serviço sobe em `http://localhost:3001`.

| Rota | Descrição |
|---|---|
| `GET /health` | Health check (usado pelo Docker) |
| `/api/...` | Rotas de negócio (o Nginx encaminha `/api/conquistas` para cá) |

## Rotas (GDL-68)

Mesmos caminhos e respostas do backend principal, para o app não precisar mudar.
Todas exigem `Authorization: Bearer <token>`; as de `/admin` exigem perfil admin.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/conquistas` | Conquistas que o leitor já desbloqueou |
| GET | `/api/conquistas/catalogo` | Catálogo com status e progresso do leitor |
| GET | `/api/conquistas/admin/todas` | Todas as conquistas (admin) |
| GET | `/api/conquistas/admin/tipos` | Tipos de critério com exemplo de texto (admin) |
| POST | `/api/conquistas/admin` | Cria conquista (admin) |
| PUT | `/api/conquistas/admin/:id` | Edita só os campos enviados (admin) |
| DELETE | `/api/conquistas/admin/:id` | Apaga a conquista e os desbloqueios dela (admin) |
| POST | `/api/conquistas/admin/:id/conceder` | Concede manualmente `{ id_usuario }` (admin) |

- **Critério:** sem `tipo`, a conquista é `MANUAL` e usa o texto de `criterio` (compatível com o app atual).
  Com tipo automático (`LIVROS_LIDOS`, `PAGINAS_LIDAS`...), o texto é gerado a partir de `tipo` + `valor_alvo`.
- **Progresso:** vem da tabela `estatisticas_leitor`, preenchida pelo evento do Pub/Sub (ver [Eventos](#eventos-gdl-71)).
  Enquanto não chegar nenhum evento para o leitor, `progresso` é `null`.
- **Concessão automática:** ao abrir o catálogo, o leitor ganha o que já atingiu. Pedidos simultâneos
  não geram erro (INSERT IGNORE; era o bug do GDL-52).

## Cache do catálogo (GDL-10 e GDL-11)

O `GET /api/conquistas/catalogo` usa **cache-aside no Redis**, com o `CacheModule` oficial do NestJS.

| Situação | O que acontece | Cabeçalho `X-Cache` |
|---|---|---|
| Primeira consulta do leitor | Busca no banco e grava no Redis por `CACHE_TTL_SEGUNDOS` (padrão 300s) | `MISS` |
| Consultas seguintes | Responde direto do Redis | `HIT` |
| Redis fora do ar | Responde direto do banco; o log avisa uma vez quando cai e uma vez quando volta | `SEM_CACHE` |

Chave: `conquistas:catalogo:v<versao>:<id_usuario>`.

**Invalidação (GDL-11)**
- Admin cria, edita ou apaga uma conquista: troca a `versao`, e o catálogo de **todos** os leitores volta a ser consultado no banco.
- Admin concede uma conquista, ou o leitor ganha uma automaticamente: apaga só a chave **daquele** leitor.
- Cada invalidação aparece no log (`cache invalidado ...`).

Para ver funcionando:
```bash
curl -i -H "Authorization: Bearer <token>" http://localhost:3001/api/conquistas/catalogo   # X-Cache: MISS
curl -i -H "Authorization: Bearer <token>" http://localhost:3001/api/conquistas/catalogo   # X-Cache: HIT
docker compose exec redis redis-cli --scan --pattern 'conquistas:catalogo:*'
```

## Eventos (GDL-71)

Além do HTTP, o serviço é um **microsserviço Redis** (`@nestjs/microservices`, aplicação híbrida).
Ele assina o canal `estatisticas.atualizadas`, que o backend principal publica depois de cada
escrita do leitor (GDL-70).

Mensagem (formato do transporte Redis do Nest):

```json
{ "pattern": "estatisticas.atualizadas",
  "data": { "usuarioId": 1, "geradoEm": "2026-11-04T14:51:41.114Z",
            "estatisticas": { "livrosLidos": 2, "livrosCadastrados": 2, "paginasLidas": 675,
                              "totalSessoes": 1, "totalAnotacoes": 1, "totalAvaliacoes": 1,
                              "possuiMeta": true, "livrosLidosPorGenero": { "3": 2 } } } }
```

O que acontece a cada evento (`src/conquistas/eventos/`):

1. **Valida** o `data`. Fora do formato: aviso no log e o evento é ignorado.
2. **Grava** os números em `estatisticas_leitor` (base do progresso no catálogo).
   Se chegar um evento **mais antigo** que o já gravado (coluna `gerado_em`), ele é descartado.
3. **Concede** as conquistas automáticas atingidas, cada uma **uma vez só** (o mesmo evento
   entregue duas vezes não duplica nada).
4. **Invalida o cache** do catálogo daquele leitor (GDL-11).

Logs:

```
[EventoEstatisticas] recebido estatisticas.atualizadas usuario=1 geradoEm=... lidos=2 cadastrados=2 paginas=675 ...
[ConquistasService] usuario=1 desbloqueou: #24 500 páginas, #25 Fã de fantasia
[CacheCatalogoService] cache invalidado conquistas:catalogo:v...:1 (ganhou conquista automática)
```

**Redis fora do ar:** o HTTP continua funcionando. O log avisa uma vez quando o Redis cai e uma vez
quando volta, e a assinatura é refeita sozinha. Isso vale também se o serviço subir **antes** do Redis
(`src/eventos/servidor-redis-eventos.ts`). Eventos publicados enquanto o Redis estava fora se perdem
(o Pub/Sub não guarda mensagens); o próximo evento do leitor traz os números completos de novo.

Para ver funcionando:

```bash
docker compose logs -f conquistas-service | grep -E "EventoEstatisticas|desbloqueou"
docker compose exec redis redis-cli PUBSUB NUMSUB estatisticas.atualizadas   # 1 = o serviço está assinando
```

## Autenticação (GDL-67)

O serviço aceita o **mesmo token JWT** do login do backend principal (mesma `JWT_SECRET`).
O guard é **global**: toda rota exige `Authorization: Bearer <token>`, menos as marcadas com `@Publica()`.

| Decorator | Uso |
|---|---|
| `@Publica()` | Libera a rota sem token (ex.: `/health`) |
| `@ApenasAdmin()` | Só `tipo_usuario: "admin"`; usuário comum recebe 403 |
| `@UsuarioAtual()` | Injeta o usuário logado no método (`@UsuarioAtual('id')` para só o id) |

Erros no mesmo formato e com as mesmas mensagens do backend principal:
`Token de autenticação ausente`, `Token mal formatado`, `Token inválido ou expirado` (401)
e `Acesso restrito a administradores` (403).

## Banco de dados (GDL-66)

O serviço tem **banco próprio**, `gamificacao`, acessado com um usuário MySQL que
só enxerga esse banco. Ele não lê nem escreve no `projeto5p` do backend principal.

| O quê | Onde |
|---|---|
| Criação do banco e do usuário | `banco/init/01-gamificacao.sh` (raiz do repositório) |
| Tabelas | migrações do TypeORM em `src/banco/migrations/` |
| Entities | `Conquista`, `ConquistaDoUsuario` e `EstatisticasLeitorEntity` em `src/conquistas/entities/` |
| Cópia dos dados antigos | `banco/scripts/GDL-66_copiar_conquistas_para_gamificacao.sql` (roda como root, uma vez) |

- `synchronize` está desligado: o banco só muda por migração versionada.
- Ao subir, o serviço aplica as migrações pendentes sozinho.
- `id_usuario` e `id_genero` são só números, sem chave estrangeira para o banco principal.

```bash
npm run migration:show    # o que já foi aplicado
npm run migration:run     # aplica as pendentes
npm run migration:revert  # desfaz a última
```

## Testes

```bash
npm test            # unitários
npm run test:cov    # unitários com cobertura
npm run test:e2e    # ponta a ponta (sobe o app em memória, sem banco)
npm run test:banco  # integração com o MySQL e o Redis de verdade (precisa dos dois ligados e do .env)
```

O `test:banco` acessa `localhost:3306` e `localhost:6379`, então as portas precisam estar publicadas
como em [Rodar localmente](#rodar-localmente). Se os testes de cache falharem com
`Expected: "MISS"` / `Received: "SEM_CACHE"`, o Redis não está acessível pela sua máquina:
confira com `docker ps` se a coluna de portas do `redis` mostra `127.0.0.1:6379->6379/tcp`.

## Docker (GDL-74)

O serviço faz parte do `docker-compose.yaml` da raiz, como `conquistas-service`. Ele sobe junto
com o resto e só começa depois que o `banco` e o `redis` estão saudáveis:

```bash
docker compose up -d --build                       # tudo
docker compose up -d --build conquistas-service    # só ele (sobe banco e redis se precisar)
docker compose logs -f conquistas-service
docker compose ps                                  # a coluna STATUS mostra (healthy)
```

As variáveis vêm do `.env` da raiz, **não** do `conquistas-service/.env` (esse é só para rodar fora do Docker):

| Variável no container | Vem de |
|---|---|
| `DB_USER` / `DB_PASSWORD` | `GAMIFICACAO_DB_USER` / `GAMIFICACAO_DB_PASSWORD` (obrigatória: sem ela o `docker compose` para com erro) |
| `JWT_SECRET` | `JWT_SECRET`, a mesma do backend, para os tokens valerem nos dois |
| `CACHE_TTL_SEGUNDOS` | `CACHE_TTL_SEGUNDOS` (opcional, padrão 300) |
| `DB_HOST`, `DB_NAME`, `REDIS_URL`, `NODE_ENV`, `PORT` | fixas no compose (`banco`, `gamificacao`, `redis://redis:6379`, `production`, `3001`) |

A porta 3001 fica só na rede interna (`expose`). Quem recebe as requisições de fora é o Nginx (GDL-73).
Para chamar o serviço direto da sua máquina, publique a porta no `docker-compose.override.yml`.

**Volume do MySQL criado antes do GDL-66:** o `banco/init/01-gamificacao.sh` só roda quando o volume
é novo. Se o serviço ficar reiniciando com `Access denied for user 'gamificacao'`, crie o banco e o
usuário rodando o script uma vez:

```bash
docker compose exec banco sh /docker-entrypoint-initdb.d/01-gamificacao.sh
```

## Estrutura

```
src/
├── main.ts                    # inicialização
├── configurar-app.ts          # prefixo /api, validação de DTOs, filtro de erros
├── app.module.ts              # módulo raiz
├── config/                    # validação das variáveis de ambiente
├── banco/                     # TypeORM: conexão, data-source da CLI e migrações
├── cache/                     # CacheModule do Nest com Redis (GDL-10)
├── conquistas/                # contexto Gamificação: controllers, services, DTOs, entities e regras
│   └── eventos/               # handler do evento estatisticas.atualizadas (GDL-71)
├── eventos/                   # conexão com o Redis como microsserviço (GDL-71)
├── common/
│   ├── filters/               # respostas de erro no formato { erro }
│   └── middleware/            # log de cada requisição (método, rota, status, tempo)
└── health/                    # GET /health
```

## Padrões

- Erros sempre no formato `{ "erro": "mensagem" }`, igual ao backend principal.
- DTOs validados com `class-validator`; campos desconhecidos são rejeitados.
- Variáveis de ambiente validadas na inicialização: se algo estiver errado, o serviço não sobe.
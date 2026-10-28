# conquistas-service

Microsserviço de **Gamificação** (conquistas) do Gerenciamento de Leituras, feito em **NestJS**.

Faz parte da extração do contexto Gamificação do backend principal (Express).
Ver o ADR-001 na documentação de arquitetura.

## Rodar localmente

Precisa do MySQL do projeto ligado com a porta liberada só para a sua máquina
(`docker compose -f docker-compose.yaml -f docker-compose.dev.yml up -d banco`).

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
| Entities | `Conquista` e `ConquistaDoUsuario` em `src/conquistas/entities/` |
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
npm run test:banco  # integração com o MySQL de verdade (precisa do banco ligado e do .env)
```

## Docker

```bash
docker build -t conquistas-service .
docker run --rm -p 3001:3001 conquistas-service
```

## Estrutura

```
src/
├── main.ts                    # inicialização
├── configurar-app.ts          # prefixo /api, validação de DTOs, filtro de erros
├── app.module.ts              # módulo raiz
├── config/                    # validação das variáveis de ambiente
├── banco/                     # TypeORM: conexão, data-source da CLI e migrações
├── conquistas/                # tipos e entities do contexto Gamificação
├── common/
│   ├── filters/               # respostas de erro no formato { erro }
│   └── middleware/            # log de cada requisição (método, rota, status, tempo)
└── health/                    # GET /health
```

## Padrões

- Erros sempre no formato `{ "erro": "mensagem" }`, igual ao backend principal.
- DTOs validados com `class-validator`; campos desconhecidos são rejeitados.
- Variáveis de ambiente validadas na inicialização: se algo estiver errado, o serviço não sobe.
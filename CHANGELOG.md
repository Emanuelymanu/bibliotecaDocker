# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.3.0] - 2026-11-24

### Adicionado
- **conquistas-service**: conquista por gênero guarda também o nome do gênero (`nome_genero`),
  já que o schema `gamificacao` não tem FK para o banco principal (GDL-69).
- **conquistas-service**: `GET /api/conquistas/novas` devolve as conquistas que o leitor ainda
  não viu e as marca como vistas na mesma transação; o app consulta logo depois das escritas e
  mostra a celebração (GDL-72).
- **Eventos**: quando o `conquistas-service` está fora do ar, o backend guarda o último snapshot
  de cada leitor no Redis (`eventos:pendentes:estatisticas.atualizadas`) e o serviço processa
  esses eventos ao subir e a cada 30 s (GDL-76).
- **Testes**: teste e2e do fluxo completo Redis → conquistas → `/novas`, rodando no CI com
  MySQL e Redis reais (GDL-77).
- **Logs**: logger estruturado (pino) no backend e no `conquistas-service`, com uma linha por
  requisição, cabeçalho `X-Request-Id` e níveis configuráveis por `LOG_NIVEL` e `LOG_FORMATO`
  (GDL-34).
- **Backend**: middleware central de tratamento de erros com resposta padronizada
  `{ erro, statusCode }`, 404 em JSON para rotas `/api` inexistentes e 500 genérico sem expor
  detalhes internos (GDL-35).
- **Backend**: integração com o Google Books com timeout, nova tentativa em falha temporária e
  circuit breaker; quando o Google não responde, a busca devolve uma mensagem amigável e as
  listagens mostram só os livros locais (GDL-32).
- **Documentação** em `docs/`: C4, Context Map, Bounded Contexts, modelo de domínio, ADRs com
  alternativas, OpenAPI 1.3.0, cenários de qualidade, SLI/SLO, observabilidade, resiliência,
  runbook, CI/CD, deploy e gestão do projeto (GDL-80).

### Alterado
- **App e site**: as mensagens de erro passam a ser lidas do campo `erro` da resposta (GDL-35).

### Removido
- **Backend**: todo o código de conquistas do monólito (controllers, rotas, modelos e regras);
  o `conquistas-service` passa a ser o único responsável (GDL-75).
- **Backend**: o campo `novasConquistas` das respostas de leituras, sessões, anotações e metas;
  o app usa `GET /api/conquistas/novas` (GDL-72, GDL-75).

## [1.2.0] - 2026-11-09

### Adicionado
- **conquistas-service**: guard JWT global que aceita o mesmo token do login do backend,
  com os decorators `@Publica()`, `@ApenasAdmin()` e `@UsuarioAtual()` (GDL-67).
- **conquistas-service**: módulo de conquistas com as rotas do leitor (`/api/conquistas`,
  `/api/conquistas/catalogo`) e do admin (cadastro, edição, exclusão, tipos e concessão
  manual); o critério passa a ser só tipo e quantidade (GDL-68).
- **conquistas-service**: cache-aside do catálogo no Redis, com TTL e invalidação por leitor
  quando ele ganha uma conquista ou quando o admin altera o catálogo (GDL-10, GDL-11).
- **docker-compose**: `conquistas-service` na rede interna, sem porta exposta, aguardando banco
  e Redis saudáveis e com healthcheck em `GET /health` (GDL-74).
- **Nginx**: `/api/conquistas` passa a ser atendido pelo `conquistas-service`; as demais rotas
  `/api` continuam no backend, com a mesma URL base para o app e o site (GDL-73).
- **CI/CD** no GitHub Actions: build e testes do backend, do `conquistas-service` (unitários,
  e2e e integração com MySQL e Redis) e do frontend, build das imagens Docker e publicação das
  imagens no GitHub Container Registry a cada tag de versão (GDL-16).
- **Backend**: publica o evento `estatisticas.atualizadas` no Redis Pub/Sub depois de cada
  escrita do leitor em livros, leituras, sessões, metas e anotações; falha ao publicar é
  registrada no log e não quebra a requisição (GDL-70).
- **conquistas-service**: consome `estatisticas.atualizadas`, grava as estatísticas do leitor,
  concede as conquistas atingidas uma única vez e invalida o cache do catálogo; eventos
  atrasados são descartados e o serviço reassina sozinho quando o Redis volta (GDL-71).
- **Revogação de admin**: ao promover ou rebaixar um usuário, o backend publica
  `usuario.permissao_alterada` e o `conquistas-service` recusa na hora (401) os tokens emitidos
  antes da mudança; com o Redis fora, rotas de admin respondem 503 (GDL-79).
- **App**: formulário de conquista com tipo e quantidade, conquista por gênero escolhido de uma
  lista e barra de progresso nas conquistas bloqueadas (GDL-57, GDL-58, GDL-60).

### Alterado
- **App**: atualizado para o Expo SDK 58 (React Native 0.88 e React 19.3).

## [1.1.0] - 2026-10-27

### Adicionado
- **conquistas-service**: novo serviço NestJS dedicado à gamificação (GDL-65).
- **conquistas-service**: banco próprio `gamificacao` com TypeORM, migration inicial
  das tabelas de conquistas e script `banco/init/01-gamificacao.sh` que cria o banco
  e o usuário na primeira subida do MySQL (GDL-66).
- Script SQL para copiar as conquistas existentes para o banco `gamificacao` (GDL-66).
- Migração das conquistas para critério estruturado, com script de prévia (GDL-55).
- Redis no `docker-compose`, com limite de memória e healthcheck; o backend passa a
  aguardar banco e Redis saudáveis antes de subir (GDL-9).
- Testes unitários das regras de conquistas (GDL-64).
- Variáveis `GAMIFICACAO_DB_USER` e `GAMIFICACAO_DB_PASSWORD` no `.env.example`.
- Porta do MySQL publicada somente em `127.0.0.1:3306`, para acesso local em
  desenvolvimento.

### Corrigido
- Erro 500 por chave duplicada ao conceder conquistas; falhas na verificação de
  conquistas não interrompem mais a operação principal (GDL-52, GDL-53).
- Erro 500 ao iniciar leitura de um livro vindo do Google Books com autor
  (`livro.addAutor is not a function`).
- `package.json` e `package-lock.json` do backend passam a ser versionados (GDL-78).
- Organização de pastas do projeto.

### Removido
- `AdminConquistaController` duplicado e sem uso (GDL-62).

## [1.0.0] - 2026-10-19

- Primeira versão estável.

[1.3.0]: https://github.com/Emanuelymanu/bibliotecaDocker/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Emanuelymanu/bibliotecaDocker/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Emanuelymanu/bibliotecaDocker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Emanuelymanu/bibliotecaDocker/releases/tag/v1.0.0
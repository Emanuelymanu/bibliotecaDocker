# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

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

[1.2.0]: https://github.com/Emanuelymanu/bibliotecaDocker/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Emanuelymanu/bibliotecaDocker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Emanuelymanu/bibliotecaDocker/releases/tag/v1.0.0
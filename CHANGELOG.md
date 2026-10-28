# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

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

[1.1.0]: https://github.com/Emanuelymanu/bibliotecaDocker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Emanuelymanu/bibliotecaDocker/releases/tag/v1.0.0

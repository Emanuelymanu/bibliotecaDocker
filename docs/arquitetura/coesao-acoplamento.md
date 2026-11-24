# Coesão, acoplamento e separação de responsabilidades

Esta análise aplica as aulas ao código atual. Não afirma que o sistema implemente Clean Architecture ou Hexagonal.

## Evidências positivas
- NestJS separa módulos, controllers, services, DTOs, entities, cache, auth, eventos e banco.
- Regras de critério são funções puras com testes.
- `CacheCatalogoService` (Nest) encapsula o acesso ao cache.
- **Baixo acoplamento entre serviços:** Express e NestJS não se chamam por HTTP; falam só pelo contrato do evento. Um pode ficar fora do ar sem derrubar o outro.
- A publicação de eventos fica em um middleware pós-escrita, sem alterar cada controller.
- `googleBooksService.ts` centraliza a chamada à API externa.

## Acoplamentos identificados
- Controllers Express consultam/alteram modelos Sequelize diretamente (ex.: sessões, metas e anotações) — GDL-37.
- Faltam DTOs nas rotas de livros e leituras do Express — GDL-36.
- `ListarLivrosController` depende de `leituras` para filtrar e compor dados do catálogo.
- O mapeamento Google Books usa `volumeInfo`; normalizar URL de imagem não equivale a Adapter completo.

## Recomendações proporcionais (KISS/YAGNI)
1. Extrair regras de negócio dos controllers Express para services testáveis.
2. Criar interfaces/repositories apenas quando reduzirem dependência concreta ou melhorarem testes.
3. Manter DTOs nas fronteiras HTTP.
4. Considerar Adapter para Google Books se o formato externo se espalhar pelo domínio.

## Padrões aplicados
- MVC/Controllers + ORM no Express.
- Módulos, providers e injeção de dependência no NestJS.
- Cache-aside (catálogo de conquistas).
- Publish/Subscribe com Redis e snapshot cumulativo como evento.
- Strangler fig: a Gamificação saiu do monólito em etapas, até a remoção do código antigo (GDL-75).
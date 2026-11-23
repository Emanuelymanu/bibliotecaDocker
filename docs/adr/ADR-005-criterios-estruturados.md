# ADR-005 — Critérios estruturados de conquistas

- **Status:** Aceita e implementada
- **Data:** 03/11/2026 — Jira GDL-25

## Contexto
O fluxo antigo do Express interpretava nome, critério e descrição como texto livre, procurando palavras-chave e o primeiro número. Isso gerou os bugs GDL-51 (acentos), GDL-54 (palavras parecidas) e confundia metas, quantidades e tipos.

## Decisão
Representar o critério com `tipo`, `valor_alvo` e `id_genero` opcional (com `nome_genero` para exibição — GDL-69), avaliado por funções específicas. O texto `criterio` é só para exibição.

## Tipos
MANUAL, LIVROS_LIDOS, LIVROS_CADASTRADOS, PAGINAS_LIDAS, SESSOES, ANOTACOES, AVALIACOES, GENEROS_DISTINTOS, LIVROS_GENERO e POSSUI_META.

## Implementação (NestJS)
- `conquistas.tipos.ts`: tipos e contrato de estatísticas.
- `conquistas.regras.ts`: validação, progresso, avaliação e geração de texto (GDL-64).
- `montar-criterio.ts`: montagem do critério nas operações administrativas.
- DTOs validam payloads; o app tem formulário com tipo e quantidade e escolha de gênero em lista (GDL-57, GDL-58).
- Migrações TypeORM criam as tabelas do serviço e as colunas `gerado_em`, `nome_genero` e `visualizada` (GDL-66, GDL-71, GDL-69, GDL-72).

O fluxo por texto do Express foi removido (GDL-75): existe uma única implementação das regras.

## Riscos
- As conquistas antigas foram convertidas para o formato estruturado (GDL-55) e copiadas para o schema `gamificacao` (`banco/scripts/GDL-66_copiar_conquistas_para_gamificacao.sql`); se algum texto antigo era ambíguo, o admin precisa revisar o tipo e a quantidade pelo formulário.
- Novo tipo de critério exige código novo em `conquistas.regras.ts` (é intencional: cada regra é testada).
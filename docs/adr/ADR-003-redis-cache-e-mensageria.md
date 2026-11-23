# ADR-003 — Redis para cache e mensageria

- **Status:** Aceita e implementada (cache e Pub/Sub)
- **Data:** 03/11/2026 — Jira GDL-23

## Contexto
O catálogo de conquistas e a dashboard recebem consultas repetidas. A separação da Gamificação exige comunicar mudanças de leitura ao novo serviço sem chamada síncrona entre eles.

## Decisão
Usar um único Redis 7 para **cache-aside com TTL** e para **mensageria Pub/Sub**. Redis não é fonte da verdade: tudo no cache pode ser reconstruído do MySQL.

## Cache
| | Catálogo de conquistas (NestJS) | Dashboard (Express) |
|---|---|---|
| Issue | GDL-10, GDL-11 | GDL-12 |
| Chave | por usuário + versão do catálogo | `dashboard:usuario:<id>` |
| TTL | `CACHE_TTL_SEGUNDOS` (padrão 300 s) | `CACHE_DASHBOARD_TTL` (padrão 300 s) |
| Invalidação | admin altera o catálogo → todos; leitor ganha conquista ou estatísticas mudam → só ele | qualquer escrita 2xx do leitor em livros, leituras, anotações, sessões e metas |
| Redis fora | consulta o banco, `X-Cache: SEM_CACHE`; operações limitadas a 300 ms | consulta o banco, `X-Cache: MISS`; log avisa uma vez |
| Testes | `cache-catalogo.service.spec.ts` | `cacheDashboard.test.ts` |

Compose limita o Redis a 128 MB com `allkeys-lru`; sem volume persistente nem senha, só na rede interna.

## Mensageria
Implementada conforme o [ADR-004](ADR-004-eventos-entre-servicos.md): canais `estatisticas.atualizadas` e `usuario.permissao_alterada`, publicados pelo Express (`redis`) e consumidos pelo NestJS (`@nestjs/microservices`, transporte Redis em app híbrido).

## Consequências
- Cache pode ficar desatualizado até o TTL para dados que outra pessoa altera (ex.: totais gerais da dashboard).
- Pub/Sub entrega no máximo uma vez e não guarda mensagem para quem está desconectado; o ADR-004 descreve como isso foi compensado.
- Um único Redis é ponto único de falha para cache e mensageria; os dois serviços continuam respondendo sem ele (sem cache e sem eventos).
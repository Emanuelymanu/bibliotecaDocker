# ADR-003 — Redis para cache e mensageria

- **Status:** Aceita e implementada (cache e Pub/Sub)
- **Data:** 03/11/2026 — Jira GDL-23

## Contexto
O catálogo de conquistas recebe consultas repetidas. A separação da Gamificação exige comunicar mudanças de leitura ao novo serviço sem chamada síncrona entre eles.

## Decisão
Usar um único Redis 7 para **cache-aside com TTL** e para **mensageria Pub/Sub**. Redis não é fonte da verdade: tudo no cache pode ser reconstruído do MySQL.

## Cache
| | Catálogo de conquistas (NestJS) |
|---|---|
| Issue | GDL-10, GDL-11 |
| Chave | por usuário + versão do catálogo |
| TTL | `CACHE_TTL_SEGUNDOS` (padrão 300 s) |
| Invalidação | admin altera o catálogo → todos; leitor ganha conquista ou estatísticas mudam → só ele |
| Redis fora | consulta o banco, `X-Cache: SEM_CACHE`; operações limitadas a 300 ms |
| Testes | `cache-catalogo.service.spec.ts` |

Compose limita o Redis a 128 MB com `allkeys-lru`; sem volume persistente nem senha, só na rede interna.

## Mensageria
Implementada conforme o [ADR-004](ADR-004-eventos-entre-servicos.md): canais `estatisticas.atualizadas` e `usuario.permissao_alterada`, publicados pelo Express (`redis`) e consumidos pelo NestJS (`@nestjs/microservices`, transporte Redis em app híbrido).

## Consequências
- O cache pode ficar desatualizado por até um TTL.
- Pub/Sub entrega no máximo uma vez e não guarda mensagem para quem está desconectado; o ADR-004 descreve como isso foi compensado.
- Um único Redis é ponto único de falha para cache e mensageria; os dois serviços continuam respondendo sem ele (sem cache e sem eventos).
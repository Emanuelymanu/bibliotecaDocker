# Redis Pub/Sub — como funciona e como demonstrar

Decisão e contrato: [ADR-004](../adr/ADR-004-eventos-entre-servicos.md). Issues: GDL-70, GDL-71, GDL-72, GDL-76, GDL-77, GDL-79.

## Canais

| Canal | Publicador | Consumidor | Efeito |
|---|---|---|---|
| `estatisticas.atualizadas` | Express, após escrita 2xx em livros, leituras, anotações, sessões, metas | Conquistas Service | Grava estatísticas, concede conquistas, invalida cache do catálogo |
| `usuario.permissao_alterada` | Express, ao promover/rebaixar | Conquistas Service | Revoga tokens antigos do usuário |

Chaves auxiliares no Redis:
- `eventos:pendentes:estatisticas.atualizadas` — hash com o último snapshot de cada leitor quando ninguém assinava (GDL-76).
- `auth:revogado:<id>` — momento da mudança de permissão, TTL 5 h (GDL-79).

## Logs que comprovam o fluxo
```
[backend:eventos] publicado estatisticas.atualizadas usuario=1 (1 assinante(s))
[conquistas:EventoEstatisticas] recebido estatisticas.atualizadas usuario=1 geradoEm=... lidos=3 paginas=975 ...
[conquistas:ConquistasService] usuario=1 desbloqueou: #4 Primeiro livro
```
Com o Conquistas Service parado:
```
[backend:eventos] ninguém recebeu estatisticas.atualizadas usuario=1: guardado para o conquistas-service processar quando voltar
```

## Roteiro de demonstração
1. `docker compose logs -f backend conquistas-service`
2. No app, iniciar uma leitura ou registrar uma sessão → ver `publicado` no backend e `recebido` no serviço; a celebração aparece no app.
3. `docker compose stop conquistas-service` → registrar outra sessão → ver `guardado para o conquistas-service processar`; `docker compose exec redis redis-cli HGETALL eventos:pendentes:estatisticas.atualizadas` mostra o snapshot.
4. `docker compose start conquistas-service` → o log mostra `processando 1 evento(s) guardado(s) enquanto o serviço estava fora do ar`.
5. Ver tudo também no teste `conquistas-service/test/fluxo-eventos.e2e-spec.ts`, que roda no CI com Redis e MySQL reais.

## Limitações conhecidas
- Pub/Sub entrega no máximo uma vez. Se o Redis cair entre a escrita e a publicação, o snapshot daquela escrita se perde; o próximo evento do leitor traz os números completos.
- Não há `idEvento`; a correlação é por `usuario=<id>` e horário.
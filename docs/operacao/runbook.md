# Runbook de incidentes

## API indisponível
1. Verificar `docker compose ps`.
2. Consultar `docker compose logs --tail=200 backend conquistas-service nginx`; use o `X-Request-Id` da resposta para achar todas as linhas da requisição.
3. Verificar `https://estantedigital.local/health` e a rota afetada.
4. Se NestJS estiver indisponível, confirmar resposta 503 e se rotas Express continuam respondendo.
5. Não remover volumes durante diagnóstico.

## MySQL indisponível
1. `docker compose logs --tail=200 banco`.
2. Verificar espaço em disco e status do container.
3. Confirmar variáveis no `.env` local sem compartilhá-las.
4. Não executar `docker compose down -v`: remove volume persistente.
5. Restaurar somente de backup válido e com procedimento testado.

## Redis indisponível
1. `docker compose logs --tail=200 redis`.
2. Verificar `docker compose exec redis redis-cli ping`.
3. Esperado: catálogo responde com `X-Cache: SEM_CACHE`, dashboard com `X-Cache: MISS`; eventos não são publicados (log `falha ao publicar`); rotas de admin do serviço de conquistas respondem 503.
4. Depois que o Redis voltar, os logs mostram `Redis disponível de novo` nos dois serviços. Conquistas atrasadas aparecem na próxima escrita do leitor.
5. Registrar bug se algum fallback não ocorrer.

## Conquistas Service indisponível
1. Verificar logs e `docker compose ps`.
2. Verificar MySQL `gamificacao` e Redis.
3. Confirmar resposta JSON 503 do Nginx em `/api/conquistas`; o resto do app deve continuar funcionando.
4. Eventos ficam em `eventos:pendentes:estatisticas.atualizadas` (`redis-cli HLEN ...`). Ao religar o serviço (`docker compose up -d conquistas-service`), o log mostra os pendentes processados.
5. Não há código de conquistas no Express para onde redirecionar.

## Nginx reiniciando em loop
1. `docker compose logs --tail=50 nginx` — normalmente arquivo de configuração ausente ou com erro.
2. `docker compose up -d --force-recreate nginx` depois de corrigir.

## Encerramento
Registrar horário, impacto, causa, ações, evidências, duração e issue Jira.

**Limitação:** não foi encontrada rotina automatizada de backup nem restore testado. Definir responsável, frequência, retenção, RPO/RTO e testar restauração.
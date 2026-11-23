# ADR-001 — Backend Express com extração da Gamificação para NestJS

- **Status:** Aceita e implementada (extração concluída em 20/11/2026)
- **Data da decisão:** 29/10/2026 — Jira GDL-21

## Contexto
O backend principal concentrava identidade, catálogo, acompanhamento de leitura e gamificação. A regra de conquistas por texto livre gerava bugs (GDL-51, GDL-52, GDL-53, GDL-54) e misturava responsabilidades. A extração precisava manter o app funcionando durante a migração.

## Decisão
Manter o Backend Principal em Express e extrair o contexto Gamificação para um serviço NestJS independente, com schema `gamificacao`. Migrar em etapas (*strangler fig*): primeiro o serviço novo, depois o roteamento no Nginx, depois a comunicação por eventos e, por último, a remoção do código antigo.

## Como foi executada

| Etapa | Issues |
|---|---|
| Projeto NestJS, banco próprio, JWT | GDL-65, GDL-66, GDL-67 |
| Regras e CRUD de conquistas no serviço; cache | GDL-68, GDL-10, GDL-11 |
| Serviço no Compose e rota `/api/conquistas` no Nginx | GDL-74, GDL-73 |
| Eventos Express → Nest (ADR-004) | GDL-70, GDL-71, GDL-79 |
| App descobre conquistas novas sem resposta síncrona | GDL-72 |
| Resiliência com o serviço fora do ar | GDL-76 |
| Teste de integração do fluxo | GDL-77 |
| Remoção do código de conquistas do Express | GDL-75 |

## Consequências
**Positivas:** fronteira clara de código, banco e implantação; uma única implementação das regras; um serviço pode cair sem derrubar o outro; Express e NestJS não se chamam por HTTP.

**Custos/riscos:** operar dois serviços; JWT secret compartilhada; consistência eventual (a conquista aparece alguns instantes depois da escrita); referências entre schemas sem FK.
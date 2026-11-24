# Histórias de usuário e critérios de aceite

As histórias ficam no Jira no formato **Como** [persona], **quero** [capacidade], **para** [benefício], com critérios de aceite verificáveis. Exemplos reais:

## GDL-10 — Cache do catálogo de conquistas (Sprint 4)
**Como** leitor, **quero** que o catálogo de conquistas carregue rápido **para** acompanhar meu progresso sem espera.
- Primeira consulta busca no banco `gamificacao` e grava no Redis (log `cache miss`).
- Consultas seguintes vêm do Redis (log `cache hit`).
- Chave por usuário, expira em 5 minutos (TTL).
- Se o Redis estiver fora do ar, o catálogo continua respondendo direto do banco.

## GDL-70 — Publicar evento de estatística do leitor (Sprint 5)
**Como** sistema, **quero** que o monólito publique um evento quando as estatísticas do leitor mudam, **para** o serviço de conquistas reagir.
- Ao salvar progresso, sessão, meta ou anotação, o Express publica `estatisticas.atualizadas` no Redis.
- Mensagem contém `usuarioId` e as estatísticas do leitor, no formato do transporte Redis do NestJS.
- Log registra cada publicação; falha ao publicar é registrada e não quebra a requisição.

## GDL-71 — Consumir evento e conceder conquistas (Sprint 5)
**Como** leitor, **quero** receber minhas conquistas automaticamente quando atingir os critérios, **para** ser reconhecido pelo meu progresso sem depender de um administrador.
- Serviço assina `estatisticas.atualizadas`, avalia as regras e grava as conquistas novas uma única vez.
- Guarda as últimas estatísticas do leitor para calcular o progresso no catálogo e invalida o cache dele.
- Logs mostram a mensagem recebida e as conquistas concedidas.

## GDL-72 — Notificar conquistas novas no app (Sprint 6)
**Como** leitor, **quero** ser avisado das conquistas que ganhei, mesmo que sejam concedidas alguns segundos depois da ação, **para** saber na hora que desbloqueei algo novo.
- Coluna `visualizada` em `usuario_conquistas`.
- `GET /api/conquistas/novas` retorna as não vistas e as marca como vistas.
- O app consulta depois das ações e mostra o alerta.

## GDL-76 — Sistema funciona com o serviço de conquistas fora do ar (Sprint 6)
**Como** leitor, **quero** continuar usando a biblioteca mesmo se o serviço de conquistas cair, **para** não perder o registro das minhas leituras.
- Com o serviço parado, salvar progresso funciona normalmente.
- Falha ao publicar é registrada sem quebrar a requisição.
- Ao voltar, as conquistas pendentes são processadas.

## GDL-79 — Revogar acesso de admin rebaixado via evento (Sprint 5)
**Como** administrador, **quero** que um usuário rebaixado perca o acesso de admin no serviço de conquistas na hora, **para** que ele não continue administrando até o token expirar (até 5 h).
- Promover/rebaixar publica `usuario.permissao_alterada` com `{ usuarioId, tipo_usuario, alteradoEm }`.
- O serviço grava `auth:revogado:<id>` com TTL de 5 h e recusa com 401 tokens emitidos antes da mudança.
- Redis fora: rotas de leitor seguem; rotas de admin respondem 503.

## GDL-12 — Cache da dashboard do usuário (Sprint 7)
**Como** leitor, **quero** que meu dashboard abra rapidamente **para** acompanhar meu progresso.
- Dashboard usa cache-aside com chave por usuário.
- TTL definido.
- Cache invalidado ao iniciar uma nova leitura.
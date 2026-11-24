# Análise do contexto com Cynefin e escolha da abordagem

Jira GDL-39 (Sprint 5).

## Projeto
Estante Digital é um sistema de gerenciamento de leituras com web, mobile, duas APIs (Express e NestJS), MySQL, Redis e Nginx.

## Classificação: domínio **Complexo**
A relação entre causa e efeito só ficou clara depois de experimentar. A equipe evoluiu um MVP existente, aprendeu NestJS, Redis e Docker durante o projeto e precisou mudar decisões com base no que os experimentos mostraram.

Exemplos do próprio projeto (sondar → perceber → responder):
- **Eventos entre serviços:** o ADR-004 propôs quatro eventos com `idEvento`; ao implementar (GDL-70/71), a equipe percebeu que um único evento com o snapshot completo resolvia duplicidade e ordem de forma mais simples, e revisou a decisão.
- **Aviso de conquistas no app:** ao tirar `novasConquistas` da resposta síncrona, surgiu a necessidade de uma rota nova e da coluna `visualizada` (GDL-72) — necessidade que não estava no plano inicial.
- **Serviço fora do ar:** o teste com o serviço parado mostrou que eventos se perdiam; a resposta foi o hash de pendentes (GDL-76).
- **Sprint 6 não fechada:** o escopo foi replanejado numa Sprint 7 curta.

Há partes em outros domínios, mas elas não representam o projeto inteiro:

| Domínio | Exemplo | Tratamento |
|---|---|---|
| Claro | Padrão de commits, Gitflow, configuração local | Aplicar a boa prática conhecida |
| Complicado | Separação de schemas, desenho do cache, configuração do Nginx | Analisar alternativas e registrar ADR |
| Complexo | Extração da Gamificação, eventos, critérios estruturados | Experimentar em passos pequenos, testar e ajustar |
| Caótico | `.env` com credenciais versionado, porta do MySQL exposta (GDL-15, GDL-13) | Agir primeiro (conter), depois corrigir e prevenir |

## Abordagem: **adaptativa (Scrum)** com restrições preditivas
- Sprints curtas (cerca de uma semana) com objetivo de sprint no Jira, backlog priorizado e replanejamento quando a sprint não fecha.
- Fluxo A fazer → Fazendo → Em revisão → Feito; toda mudança passa por PR com CI.
- Incremento entregue por release versionada (1.0.0, 1.1.0, 1.2.0).
- Restrições fixas da disciplina (prazo final e rubrica) funcionam como marcos preditivos; o escopo dentro delas é adaptado a cada sprint.

A escolha é coerente com o domínio Complexo: o plano de eventos e de migração mudou durante a execução, e o processo absorveu essas mudanças sem perder o prazo.
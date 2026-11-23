# Quality Scenarios

Os cenários diferenciam comportamento implementado (com evidência) de metas propostas.

| ID | Atributo | Estímulo → resposta esperada | Evidência / situação |
|---|---|---|---|
| QS-01 | Desempenho | Requisição HTTP responde dentro do orçamento | Log por requisição com duração (pino) e Nginx com `$request_time`; sem série de medições sob carga |
| QS-02 | Desempenho | Consultas repetidas ao catálogo de conquistas e à dashboard usam cache | **Implementado:** cache-aside com TTL e `X-Cache: HIT/MISS` (catálogo: GDL-10/11; dashboard: GDL-12) |
| QS-03 | Disponibilidade | Conquistas Service fora do ar | **Implementado:** Nginx responde 503 JSON só para `/api/conquistas`; Express continua; eventos ficam no hash de pendentes e são processados quando o serviço volta (GDL-76) |
| QS-04 | Resiliência | Redis indisponível | **Implementado:** catálogo e dashboard vão ao banco; publicação falha sem quebrar a requisição; Nest reassina sozinho; log avisa queda e volta uma vez |
| QS-05 | Consistência | Evento repetido ou fora de ordem | **Implementado:** upsert condicional por `gerado_em` e PK composta na concessão; testes em `eventos.banco-spec.ts` |
| QS-06 | Segurança | Admin rebaixado tenta usar token antigo | **Implementado:** evento `usuario.permissao_alterada` → 401; com Redis fora, rotas de admin respondem 503 (GDL-79) |
| QS-07 | Recuperação | Container cai | `restart: always`; healthcheck no MySQL, Redis e conquistas-service (`/health`) |
| QS-08 | Recuperabilidade | Perda de dados | Backup automatizado não implementado; volume MySQL não é backup |
| QS-09 | Integração externa | Google Books lento/indisponível → busca responde em até ~9 s no pior caso e depois em milissegundos | **Implementado (GDL-32):** timeout de 4 s, 1 nova tentativa, circuit breaker (3 falhas → 30 s) e fallback: 503 amigável na busca, só livros locais nas listagens; testes em `googleBooksService.test.ts` |
| QS-10 | Segurança | Tentativas repetidas de login | Rate limiting não implementado — pendente |
| QS-11 | Transporte | Tráfego HTTPS | TLS 1.2/1.3 no Nginx; porta 80 também aceita HTTP, sem redirect global |
| QS-12 | Manutenibilidade | Critério novo de conquista | Regras tipadas e puras, com testes; uma única implementação (NestJS) |
| QS-13 | Qualidade de dados externos | Google Books não informa páginas ou gênero | Livro gravado com 0 páginas / sem gênero: o leitor pode deixar de ganhar conquista de páginas ou gênero, mas nunca ganha uma indevida. Ao editar o livro, o evento recalcula as estatísticas e a conquista é concedida de forma retroativa |
| QS-14 | Tratamento de erros | Erro inesperado no backend | **Implementado para erros lançados (GDL-35); controllers antigos com `try/catch` próprio também respondem 500 genérico:** resposta 500 genérica `{ erro, statusCode }` sem detalhes internos; pilha e `reqId` no log; 4xx com mensagem clara e log de aviso |

## Metas propostas
p95 menor que 500 ms em endpoints críticos e taxa de 5xx menor que 1% (ver [SLI/SLO](../operacao/slis-slos.md)). Não declarar metas atingidas sem medição com ambiente, carga, data e resultado.
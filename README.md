# Biblioteca Docker - Guia Rapido de Setup
CI/CD
Este README centraliza o passo a passo para rodar o projeto em ambiente de desenvolvimento com Docker.

## 1) Pre-requisitos

- Docker Desktop instalado e em execucao
- Git instalado
- mkcert instalado (para HTTPS local)

## 2) Configurar variaveis de ambiente

Na raiz do projeto, copie os arquivos de exemplo para os arquivos locais:

### Windows (PowerShell)

```powershell
Copy-Item .env.example .env
Copy-Item Frontend-Projeto/ProjetoFrontend/.env.local.example Frontend-Projeto/ProjetoFrontend/.env.local
```

### Linux/macOS (bash)

```bash
cp .env.example .env
cp Frontend-Projeto/ProjetoFrontend/.env.local.example Frontend-Projeto/ProjetoFrontend/.env.local
```

Ajuste os valores do arquivo `.env` se necessario (senha do banco, JWT e chave Google Books).

## 3) Configurar host local e certificados HTTPS

O projeto usa o host local `estantedigital.local`.

1. Adicione no arquivo hosts do sistema:

```txt
127.0.0.1 estantedigital.local
```

2. Gere/instale certificados locais conforme instrucoes em:

- certs/README.md

## 4) Subir ambiente de desenvolvimento

Na raiz do repositorio:

```bash
docker compose up -d --build
```

## 5) Acessar aplicacao

- App (via Nginx + HTTPS): https://estantedigital.local
- Health check Nginx: https://estantedigital.local/healthz

## 6) Parar ambiente

```bash
docker compose down
```

Para parar e remover volumes (cuidado: apaga dados do MySQL):

```bash
docker compose down -v
```

## 7) Comandos uteis

Ver logs gerais:

```bash
docker compose logs -f
```

Ver logs de um servico:

```bash
docker compose logs -f backend
docker compose logs -f conquistas-service
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f banco
```

Rebuild de um servico especifico:

```bash
docker compose up -d --build backend
```

## 8) Troubleshooting rapido

### Certificado invalido no navegador

- Rode `mkcert -install`
- Confira se os arquivos em `certs/` existem:
  - `estantedigital.local.pem`
  - `estantedigital.local-key.pem`
  - `rootCA.pem`

### Porta 80/443 ocupada

- Pare servicos que usem essas portas
- Ou altere o mapeamento de portas no `docker-compose.yaml`

### Backend nao conecta no MySQL

- Verifique valores em `.env` (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`)
- Aguarde o healthcheck do banco ficar OK
- Consulte logs: `docker compose logs -f banco` e `docker compose logs -f backend`

### Frontend nao chama API

- Verifique `Frontend-Projeto/ProjetoFrontend/.env.local`
- Valores esperados:
  - `VITE_API_URL=/api`
  - `VITE_UPLOADS_URL=/upload/capa`

## 9) Estrutura de rede e exposicao

- Somente o Nginx expoe portas para fora (`80` e `443`)
- Backend, conquistas-service, frontend, banco e Redis ficam isolados na rede Docker interna

Roteamento do Nginx (`nginx/nginx.conf`):

| Caminho | Vai para |
|---|---|
| `/api/conquistas` e `/api/conquistas/*` | `conquistas-service:3001` (NestJS, GDL-73) |
| `/api/*` (o resto) e `/upload/capa/*` | `backend:3000` (Express) |
| `/` | `frontend:5173` |

Se o `conquistas-service` estiver fora do ar, só as rotas de conquistas respondem
`503` com `{"erro": "Serviço de conquistas indisponível..."}`; o resto do sistema continua normal,
e o Nginx volta a encaminhar sozinho quando o serviço subir de novo.

Isso atende a organizacao de ambiente de desenvolvimento com `.env`, comandos simples e execucao flexivel.
## 10) Eventos entre servicos (Redis Pub/Sub)

O backend (Express) avisa o `conquistas-service` pelo Redis quando os números de um leitor mudam
e quando a permissão de um usuário muda.

| Evento | Quem publica | Quando |
|---|---|---|
| `estatisticas.atualizadas` | backend (GDL-70) | depois de qualquer escrita bem-sucedida em `/api/livros`, `/api/leituras`, `/api/sessoes`, `/api/metas` e `/api/anotacoes` |
| `usuario.permissao_alterada` | backend (GDL-79) | quando um admin promove ou rebaixa um usuário; o `conquistas-service` passa a recusar os tokens antigos dessa pessoa |

A mensagem segue o formato do transporte Redis do NestJS:

```json
{
  "pattern": "estatisticas.atualizadas",
  "data": {
    "usuarioId": 1,
    "estatisticas": {
      "livrosLidos": 1, "livrosCadastrados": 1, "paginasLidas": 310,
      "totalSessoes": 1, "totalAnotacoes": 1, "totalAvaliacoes": 1,
      "possuiMeta": true, "livrosLidosPorGenero": { "3": 1 }
    },
    "geradoEm": "2026-11-04T00:34:02.515Z"
  }
}
```

- `estatisticas.atualizadas` é publicado **depois** que a resposta é enviada: não deixa a requisição mais lenta.
- `usuario.permissao_alterada` é publicado **antes** da resposta: quando o admin vê "rebaixado", o token antigo já não vale mais.
  Detalhes em [conquistas-service/README.md](conquistas-service/README.md#revogação-quando-a-permissão-muda-gdl-79).
- Com o Redis fora do ar, a requisição funciona normalmente; o log registra a falha e avisa quando o Redis volta.

Para ver os eventos chegando:

```bash
docker compose exec redis redis-cli SUBSCRIBE estatisticas.atualizadas usuario.permissao_alterada
docker compose logs -f backend | grep "\[eventos\]"
```
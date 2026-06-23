# Biblioteca Docker - Guia Rapido de Setup

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
- Backend, frontend e banco ficam isolados na rede Docker interna

Isso atende a organizacao de ambiente de desenvolvimento com `.env`, comandos simples e execucao flexivel.

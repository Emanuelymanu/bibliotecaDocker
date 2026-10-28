GAMIFICACAO_DB_USER="${GAMIFICACAO_DB_USER:-gamificacao}"

if [ -z "$GAMIFICACAO_DB_PASSWORD" ]; then
  echo "[gamificacao] ERRO: GAMIFICACAO_DB_PASSWORD não definida no .env. Nada foi criado." >&2
else
  echo "[gamificacao] criando database 'gamificacao' e usuário '$GAMIFICACAO_DB_USER'..."

  MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS gamificacao
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${GAMIFICACAO_DB_USER}'@'%' IDENTIFIED BY '${GAMIFICACAO_DB_PASSWORD}';
ALTER USER '${GAMIFICACAO_DB_USER}'@'%' IDENTIFIED BY '${GAMIFICACAO_DB_PASSWORD}';

-- Somente o banco gamificacao. Nenhum privilégio no projeto5p.
GRANT ALL PRIVILEGES ON gamificacao.* TO '${GAMIFICACAO_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

  if [ $? -eq 0 ]; then
    echo "[gamificacao] pronto."
  else
    echo "[gamificacao] ERRO ao criar o banco/usuário (veja a mensagem acima)." >&2
  fi
fi
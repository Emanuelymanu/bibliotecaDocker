import app from "./app";
import { sequelize } from "./models-auto";
import { initModels } from "./models-auto/init-models";
import { logger } from "./logger";
import { iniciarCacheDashboard } from "./cache/cacheDashboard";

initModels(sequelize);
iniciarCacheDashboard();

const port = 3000;
const shouldSyncSchema = process.env.DB_SYNC !== "false";
const shouldAlterSchema = process.env.DB_SYNC_ALTER === "true";

async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');

    if (shouldSyncSchema) {
      try {
        await sequelize.sync({ alter: shouldAlterSchema });
        logger.info('Tabelas sincronizadas com sucesso.');
      } catch (syncError) {
        logger.error({ err: syncError }, 'Falha ao sincronizar tabelas. Iniciando API sem alteração automática de schema');
      }
    }

    app.listen(port, () => {
      logger.info(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Não foi possível conectar ao banco de dados');
  }
}

startServer();
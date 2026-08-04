import app from "./app";
import { sequelize } from "./models-auto";
import { initModels } from "./models-auto/init-models";

initModels(sequelize);

const port = 3000;
const shouldSyncSchema = process.env.DB_SYNC !== "false";
const shouldAlterSchema = process.env.DB_SYNC_ALTER === "true";

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    if (shouldSyncSchema) {
      try {
        await sequelize.sync({ alter: shouldAlterSchema });
        console.log('Tabelas sincronizadas com sucesso.');
      } catch (syncError) {
        console.error('Falha ao sincronizar tabelas. Iniciando API sem alteração automática de schema:', syncError);
      }
    }

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  }
}

startServer();


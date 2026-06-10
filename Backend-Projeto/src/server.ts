import app from "./app";
import { sequelize } from "./models-auto";
import { initModels } from "./models-auto/init-models";

initModels(sequelize);

const port = 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');

    await sequelize.sync({ alter: true });
    console.log('Tabelas sincronizadas com sucesso.');

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  }
}

startServer();


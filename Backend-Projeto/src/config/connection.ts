import { Sequelize } from "sequelize";
import config from "./config";
import { logDe } from "../logger";

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

export const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: false,
        dialectOptions: dbConfig.dialectOptions || {}
    }
)

sequelize.authenticate()
    .then(() => logDe('banco').debug('Conexão com o banco de dados estabelecida (sequelize)'))
    .catch((err) => logDe('banco').error({ err }, 'Não foi possível conectar ao banco de dados'));

export async function initializeDatabase() {
    await sequelize.sync({ alter: true });
}
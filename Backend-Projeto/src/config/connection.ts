import { Sequelize } from "sequelize";
import config from "./config";

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
    .then(() => console.log('Database connection established successfully.'))
    .catch((err) => console.error('Unable to connect to the database:', err));

export async function initializeDatabase() {
    await sequelize.sync({ alter: true });
}
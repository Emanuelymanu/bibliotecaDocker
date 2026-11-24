import { Sequelize } from 'sequelize';
import { logDe } from '../logger';
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];


const logSql = logDe('sql');
const opcoes = { ...config, logging: (sql: string) => logSql.debug(sql) };

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable]!, opcoes)
  : new Sequelize(config.database, config.username, config.password, opcoes);

export { sequelize };
export default sequelize;
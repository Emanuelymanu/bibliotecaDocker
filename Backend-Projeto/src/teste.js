const { Sequelize } = require('sequelize');
const config = require('./config/config.js'); 

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco realizada com sucesso!');
  })
  .catch((err) => {
    console.error('Erro ao conectar com o banco:', err);
  });
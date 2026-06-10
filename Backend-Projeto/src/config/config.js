const baseConfig = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'projeto5p',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
  },
};

module.exports = {
  development: {
    ...baseConfig,
  },
  test: {
    ...baseConfig,
    database: process.env.DB_NAME_TEST || 'projeto5p_test',
  },
  production: {
    ...baseConfig,
  },
};

import { sequelize } from '../config/connection';
import { initModels } from '../models-auto/init-models';

let models: any;

beforeAll(async () => {
  try {
    
    await sequelize.authenticate();
    console.log('Conectado ao banco de teste');
    
    
    models = initModels(sequelize);
    console.log('Modelos inicializados:', Object.keys(models));
    
 
    await sequelize.sync({ force: true });
    console.log('Banco sincronizado');
    
  } catch (error) {
    console.error('Erro no setup:', error);
    throw error;
  }
});

afterAll(async () => {
  await sequelize.close();
  console.log('✅ Conexão fechada');
});

export { models };
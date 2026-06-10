import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { sequelize } from './models-auto';
import './models-auto/livros';
import authRoutes from './routes/authRoutes';
import livrosRoutes from './routes/livrosRoutes';
import leiturasRoutes from './routes/leiturasRoutes';
import anotacoesRoutes from './routes/anotacoesRoutes';
import tagsRoutes from './routes/tagsRoutes';
import perfilRoutes from './routes/perfilRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { Sequelize } from 'sequelize';

const app = express();

const allowedOrigins = [
  'http://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://estantedigital.local',
  'https://estantedigital.local'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }

    return callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/upload/capa', express.static(path.join(__dirname, '../upload/capa'))); // Corrigido caminho físico para servir imagens de capas
app.use('/api/livros', livrosRoutes);
app.use('/api/leituras', leiturasRoutes);
app.use('/api/anotacoes', anotacoesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/dashboard', dashboardRoutes);

sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });

export default app;
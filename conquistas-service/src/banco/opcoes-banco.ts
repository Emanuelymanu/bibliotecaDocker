import { DataSourceOptions } from 'typeorm';
import { ConquistaDoUsuario } from '../conquistas/entities/conquista-do-usuario.entity';
import { Conquista } from '../conquistas/entities/conquista.entity';
import { CriarTabelasGamificacao1793062185895 } from './migrations/1793062185895-CriarTabelasGamificacao';

export interface ConfigBanco {
  host: string;
  porta: number;
  usuario: string;
  senha: string;
  nome: string;
}


export const ENTIDADES = [Conquista, ConquistaDoUsuario];


export const MIGRACOES = [CriarTabelasGamificacao1793062185895];


export function opcoesBanco(config: ConfigBanco): DataSourceOptions {
  return {
    type: 'mysql',
    host: config.host,
    port: config.porta,
    username: config.usuario,
    password: config.senha,
    database: config.nome,
    entities: ENTIDADES,
    migrations: MIGRACOES,
    migrationsTableName: 'migracoes_typeorm',
    
    synchronize: false,
    charset: 'utf8mb4',
    
    dateStrings: ['DATE'],
    logging: ['error', 'warn', 'migration'],
  };
}

/** Lê a configuração do banco a partir das variáveis de ambiente (usado pela CLI). */
export function configBancoDoAmbiente(env: NodeJS.ProcessEnv): ConfigBanco {
  const usuario = env.DB_USER;
  const senha = env.DB_PASSWORD;
  if (!usuario || !senha) {
    throw new Error('Defina DB_USER e DB_PASSWORD (usuário do banco gamificacao) no .env');
  }
  return {
    host: env.DB_HOST || 'localhost',
    porta: Number(env.DB_PORT || 3306),
    usuario,
    senha,
    nome: env.DB_NAME || 'gamificacao',
  };
}
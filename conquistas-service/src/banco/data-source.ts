import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { configBancoDoAmbiente, opcoesBanco } from './opcoes-banco';


try {
  process.loadEnvFile('.env');
} catch {
  
}

export default new DataSource(opcoesBanco(configBancoDoAmbiente(process.env)));
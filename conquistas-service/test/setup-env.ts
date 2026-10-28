import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Carregado antes de cada arquivo de teste e2e/integração.
 *
 * Lê o .env do serviço (se existir) e preenche o mínimo para a validação
 * de variáveis passar nos testes que não usam banco.
 * (O Jest dá a cada teste uma cópia do process.env, por isso o .env é lido aqui
 * e copiado à mão, sem sobrescrever o que já veio do ambiente.)
 */
if (existsSync('.env')) {
  const doArquivo = parseEnv(readFileSync('.env', 'utf8'));
  for (const [chave, valor] of Object.entries(doArquivo)) {
    process.env[chave] ??= valor;
  }
}

process.env.NODE_ENV = 'test';
process.env.DB_USER ??= 'teste';
process.env.DB_PASSWORD ??= 'teste';
process.env.JWT_SECRET ??= 'segredo-de-teste';
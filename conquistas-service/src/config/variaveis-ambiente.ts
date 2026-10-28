import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

enum Ambiente {
  Desenvolvimento = 'development',
  Producao = 'production',
  Teste = 'test',
}

/** Variáveis de ambiente aceitas pelo serviço. Validadas na inicialização. */
export class VariaveisAmbiente {
  @IsOptional()
  @IsEnum(Ambiente)
  NODE_ENV: Ambiente = Ambiente.Desenvolvimento;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  // ---- Banco próprio "gamificacao" (GDL-66) ----

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  DB_HOST: string = 'localhost';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 3306;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  DB_NAME: string = 'gamificacao';

  @IsString()
  @IsNotEmpty({ message: 'DB_USER é obrigatória (usuário do banco gamificacao)' })
  DB_USER: string;

  @IsString()
  @IsNotEmpty({ message: 'DB_PASSWORD é obrigatória (senha do usuário do banco gamificacao)' })
  DB_PASSWORD: string;

  // ---- Autenticação (GDL-67) ----

  /** Mesmo segredo do backend principal, para aceitar o token do login. */
  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET é obrigatória (a mesma do backend principal)' })
  JWT_SECRET: string;
}

/**
 * Usada pelo ConfigModule: se alguma variável vier inválida,
 * o serviço não sobe e o log diz exatamente qual.
 */
export function validarAmbiente(config: Record<string, unknown>): VariaveisAmbiente {
  const variaveis = plainToInstance(VariaveisAmbiente, config, { enableImplicitConversion: true });
  const erros = validateSync(variaveis, { skipMissingProperties: false });

  if (erros.length > 0) {
    const detalhes = erros.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${detalhes}`);
  }
  return variaveis;
}
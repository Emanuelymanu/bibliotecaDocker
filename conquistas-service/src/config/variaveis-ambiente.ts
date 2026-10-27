import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

enum Ambiente {
  Desenvolvimento = 'development',
  Producao = 'production',
  Teste = 'test',
}

class VariaveisAmbiente {
  @IsOptional()
  @IsEnum(Ambiente)
  NODE_ENV: Ambiente = Ambiente.Desenvolvimento;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsOptional()
  @IsString()
  DB_HOST: string = 'localhost';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 3306;

  @IsOptional()
  @IsString()
  DB_NAME: string = 'gamificacao';

 
  @IsString({ message: 'DB_USER é obrigatória' })
  @IsNotEmpty({ message: 'DB_USER é obrigatória' })
  DB_USER: string;

  @IsString({ message: 'DB_PASSWORD é obrigatória' })
  @IsNotEmpty({ message: 'DB_PASSWORD é obrigatória' })
  DB_PASSWORD: string;
}

export function validarAmbiente(config: Record<string, unknown>): VariaveisAmbiente {
  const variaveis = plainToInstance(VariaveisAmbiente, config, { enableImplicitConversion: true });
  const erros = validateSync(variaveis, { skipMissingProperties: false, stopAtFirstError: true });

  if (erros.length > 0) {
    const detalhes = erros.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${detalhes}`);
  }
  return variaveis;
}

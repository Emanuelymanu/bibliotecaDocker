import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min, validateSync } from 'class-validator';

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
}

export function validarAmbiente(config: Record<string, unknown>): VariaveisAmbiente {
  const variaveis = plainToInstance(VariaveisAmbiente, config, { enableImplicitConversion: true });
  const erros = validateSync(variaveis, { skipMissingProperties: false });

  if (erros.length > 0) {
    const detalhes = erros.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${detalhes}`);
  }
  return variaveis;
}
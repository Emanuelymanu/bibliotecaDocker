import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { TIPOS_CONQUISTA, TipoConquista } from '../conquistas.tipos';
 
const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const maiusculas = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);


export class CriarConquistaDto{
   @Transform(aparar)
  @IsString({ message: 'Nome é obrigatório' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(150, { message: 'Nome deve ter no máximo 150 caracteres' })
  nome: string;
 
  @IsOptional()
  @IsString({ message: 'descricao deve ser um texto' })
  descricao?: string | null;
 
  @IsOptional()
  @IsString({ message: 'icone deve ser um texto' })
  @MaxLength(255, { message: 'icone deve ter no máximo 255 caracteres' })
  icone?: string | null;
 

  @IsOptional()
  @Transform(aparar)
  @IsString({ message: 'criterio deve ser um texto' })
  @MaxLength(255, { message: 'criterio deve ter no máximo 255 caracteres' })
  criterio?: string | null;
 
  @IsOptional()
  @Transform(maiusculas)
  @IsIn(TIPOS_CONQUISTA, { message: `Tipo inválido. Use um destes: ${TIPOS_CONQUISTA.join(', ')}` })
  tipo?: TipoConquista;
 
  @IsOptional()
  @IsInt({ message: 'valor_alvo deve ser um número inteiro maior que zero' })
  @Min(1, { message: 'valor_alvo deve ser um número inteiro maior que zero' })
  valor_alvo?: number;
 
  @IsOptional()
  @IsInt({ message: 'id_genero deve ser um número inteiro' })
  @Min(1, { message: 'id_genero deve ser um número inteiro' })
  id_genero?: number | null;  
}
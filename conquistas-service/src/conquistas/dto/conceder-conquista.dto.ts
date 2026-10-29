import { IsInt, Min } from 'class-validator';


export class ConcederConquistaDto {
  @IsInt({ message: 'id_usuario é obrigatório' })
  @Min(1, { message: 'id_usuario é obrigatório' })
  id_usuario: number;
}
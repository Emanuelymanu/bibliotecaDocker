import { PartialType } from '@nestjs/mapped-types';
import { CriarConquistaDto } from './criar-conquista.dto';


export class AtualizarConquistaDto extends PartialType(CriarConquistaDto) {}
import { Controller, Get } from '@nestjs/common';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { ConquistasService } from './conquistas.service';
import { CatalogoResposta, MinhasConquistasResposta } from './dto/respostas.dto';


@Controller('conquistas')
export class ConquistasController {
  constructor(private readonly conquistas: ConquistasService) {}


  @Get()
  listarMinhas(@UsuarioAtual('id') usuarioId: number): Promise<MinhasConquistasResposta> {
    return this.conquistas.listarMinhas(usuarioId);
  }


  @Get('catalogo')
  listarCatalogo(@UsuarioAtual('id') usuarioId: number): Promise<CatalogoResposta> {
    return this.conquistas.listarCatalogo(usuarioId);
  }
}
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
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
  async listarCatalogo(
    @UsuarioAtual('id') usuarioId: number,
    @Res({ passthrough: true }) resposta: Response,
  ): Promise<CatalogoResposta> {
    const { dados, origem } = await this.conquistas.listarCatalogo(usuarioId);
    resposta.setHeader('X-Cache', origem);
    return dados;
  }
}
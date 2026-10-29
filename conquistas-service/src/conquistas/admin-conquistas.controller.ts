import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApenasAdmin } from '../auth/decorators/apenas-admin.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import { AdminConquistasService } from './admin-conquistas.service';
import { AtualizarConquistaDto } from './dto/atualizar-conquista.dto';
import { ConcederConquistaDto } from './dto/conceder-conquista.dto';
import { CriarConquistaDto } from './dto/criar-conquista.dto';
import { TipoComExemplo } from './dto/respostas.dto';
import { Conquista } from './entities/conquista.entity';


const IdPipe = new ParseIntPipe({ exceptionFactory: () => new BadRequestException('id inválido') });


@ApenasAdmin()
@Controller('conquistas/admin')
export class AdminConquistasController {
  constructor(private readonly admin: AdminConquistasService) {}

  @Get('tipos')
  listarTipos(): { tipos: TipoComExemplo[] } {
    return { tipos: this.admin.listarTipos() };
  }

  @Get('todas')
  async listarTodas(): Promise<{ conquistas: Conquista[] }> {
    return { conquistas: await this.admin.listarTodas() };
  }

  @Post()
  async criar(@Body() dados: CriarConquistaDto): Promise<{ mensagem: string; conquista: Conquista }> {
    return { mensagem: 'Conquista criada com sucesso', conquista: await this.admin.criar(dados) };
  }

  @Put(':id')
  async editar(
    @Param('id', IdPipe) id: number,
    @Body() dados: AtualizarConquistaDto,
  ): Promise<{ mensagem: string; conquista: Conquista }> {
    return { mensagem: 'Conquista atualizada com sucesso', conquista: await this.admin.editar(id, dados) };
  }

  @Delete(':id')
  async apagar(@Param('id', IdPipe) id: number): Promise<{ mensagem: string }> {
    await this.admin.apagar(id);
    return { mensagem: 'Conquista removida com sucesso' };
  }

  @Post(':id/conceder')
  @HttpCode(HttpStatus.CREATED)
  async conceder(
    @Param('id', IdPipe) id: number,
    @Body() dados: ConcederConquistaDto,
    @UsuarioAtual('id') idAdmin: number,
  ): Promise<{ mensagem: string }> {
    await this.admin.conceder(id, dados.id_usuario, idAdmin);
    return { mensagem: 'Conquista concedida com sucesso' };
  }
}
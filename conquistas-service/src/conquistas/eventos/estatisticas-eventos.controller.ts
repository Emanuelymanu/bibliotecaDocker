import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Publica } from '../../auth/decorators/publica.decorator';
import { ConquistasService } from '../conquistas.service';
import {
  EVENTO_ESTATISTICAS_ATUALIZADAS,
  EventoInvalidoError,
  lerEventoEstatisticas,
  resumirEvento,
} from './estatisticas-atualizadas';


@Publica()
@Controller()
export class EstatisticasEventosController {
  private readonly logger = new Logger('EventoEstatisticas');

  constructor(private readonly conquistas: ConquistasService) {}

  @EventPattern(EVENTO_ESTATISTICAS_ATUALIZADAS)
  async aoAtualizarEstatisticas(@Payload() dados: unknown): Promise<void> {
    let evento;
    try {
      evento = lerEventoEstatisticas(dados);
    } catch (erro) {
      if (!(erro instanceof EventoInvalidoError)) throw erro;
      this.logger.warn(`evento ignorado (${erro.message}): ${JSON.stringify(dados)?.slice(0, 300)}`);
      return;
    }

    this.logger.log(`recebido ${EVENTO_ESTATISTICAS_ATUALIZADAS} ${resumirEvento(evento)}`);
    try {
      await this.conquistas.registrarEstatisticas(evento);
    } catch (erro) {
      this.logger.error(
        `falha ao processar o evento do usuario=${evento.usuarioId}: ${(erro as Error).message}`,
      );
    }
  }
}
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Publica } from '../decorators/publica.decorator';
import { RevogacaoTokensService } from '../revogacao-tokens.service';
import { EVENTO_PERMISSAO_ALTERADA, EventoPermissaoInvalidoError, lerEventoPermissao } from './permissao-alterada';


@Publica()
@Controller()
export class PermissaoEventosController {
  private readonly logger = new Logger('EventoPermissao');

  constructor(private readonly revogacao: RevogacaoTokensService) {}

  @EventPattern(EVENTO_PERMISSAO_ALTERADA)
  async aoAlterarPermissao(@Payload() dados: unknown): Promise<void> {
    let evento;
    try {
      evento = lerEventoPermissao(dados);
    } catch (erro) {
      if (!(erro instanceof EventoPermissaoInvalidoError)) throw erro;
      this.logger.warn(`evento ignorado (${erro.message}): ${JSON.stringify(dados)?.slice(0, 300)}`);
      return;
    }

    const quando = evento.alteradoEm.toISOString();
    this.logger.log(
      `recebido ${EVENTO_PERMISSAO_ALTERADA} usuario=${evento.usuarioId} agora é ${evento.tipo_usuario} (em ${quando})`,
    );
    try {
      await this.revogacao.revogarAte(evento.usuarioId, evento.alteradoEm);
      this.logger.log(`usuario=${evento.usuarioId}: tokens emitidos antes de ${quando} revogados por 5h`);
    } catch (erro) {
      this.logger.error(
        `falha ao revogar os tokens do usuario=${evento.usuarioId}: ${(erro as Error).message}`,
      );
    }
  }
}
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erros');

  catch(excecao: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const resposta = contexto.getResponse<Response>();
    const requisicao = contexto.getRequest<Request>();

    const status =
      excecao instanceof HttpException ? excecao.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const mensagem =
      excecao instanceof HttpException
        ? this.extrairMensagem(excecao)
        : 'Erro interno no serviço de conquistas';

    if (status >= 500) {
      const pilha = excecao instanceof Error ? excecao.stack : String(excecao);
      this.logger.error(`${requisicao.method} ${requisicao.originalUrl} -> ${status}`, pilha);
    }

    resposta.status(status).json({
      erro: mensagem,
      statusCode: status,
      caminho: requisicao.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  
  private extrairMensagem(excecao: HttpException): string {
    const corpo = excecao.getResponse();
    if (typeof corpo === 'string') return corpo;

    const mensagem = (corpo as { message?: string | string[] }).message;
    if (Array.isArray(mensagem)) return [...new Set(mensagem)].join('; ');
    return mensagem ?? excecao.message;
  }
}
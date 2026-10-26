import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const corpo = exception instanceof HttpException ? exception.getResponse() : null;
        const mensagem = typeof corpo === 'object' && corpo !== null && 'message' in corpo
            ? (corpo as { message: string | string[] }).message
            : exception instanceof HttpException ? exception.message : 'Erro interno do servidor';

        if (status >= 500) {
            this.logger.error(exception instanceof Error ? exception.stack : String(exception));
        }

        res.status(status).json({
            statusCode: status,
            erro: mensagem,
            caminho: req.originalUrl,
            timestamp: new Date().toISOString(),
        });
    }
}

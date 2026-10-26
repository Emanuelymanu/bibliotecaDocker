import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LogRequisicoesMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction): void {
        const inicio = Date.now();
        res.on('finish', () => {
            const duracao = Date.now() - inicio;
            this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duracao}ms`);
        });
        next();
    }
}

import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { Params } from 'nestjs-pino';

type RequisicaoComUsuario = IncomingMessage & { usuario?: { id: number }; originalUrl?: string };
const ehErroSintetico = (erro: Error) => erro.message.startsWith('failed with status code');
const rota = (req: IncomingMessage) => `${req.method} ${(req as RequisicaoComUsuario).originalUrl ?? req.url}`;


export function opcoesLogger(): Params {
  const emTeste = process.env.NODE_ENV === 'test';
  const formato = process.env.LOG_FORMATO ?? 'texto';

  return {
    pinoHttp: {
      level: process.env.LOG_NIVEL ?? (emTeste ? 'silent' : 'info'),
      base: { servico: 'conquistas' },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      redact: ['req.headers.authorization'],
      transport:
        formato === 'texto' && !emTeste
          ? {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname,servico,context',
                messageFormat: '[{servico}{if context}:{context}{end}] {msg}',
              },
            }
          : undefined,

      genReqId: (req, res) => {
        const existente = req.headers['x-request-id'];
        const id = typeof existente === 'string' && existente ? existente : randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === '/health' },
      quietReqLogger: true,
      quietResLogger: true,
      customLogLevel: (_req, res, erro) => {
        if (erro || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customProps: (req) => {
        const usuario = (req as RequisicaoComUsuario).usuario;
        return usuario ? { usuario: usuario.id } : {};
      },
      customSuccessMessage: (req, res, tempo) => `${rota(req)} ${res.statusCode} ${Math.round(tempo)}ms`,
      customErrorMessage: (req, res, erro) =>
        `${rota(req)} ${res.statusCode}` + (ehErroSintetico(erro) ? '' : ` - ${erro.message}`),
      customSuccessObject: () => ({}),
      customErrorObject: (_req, _res, erro) => (ehErroSintetico(erro) ? {} : { err: erro }),
    },
  };
}
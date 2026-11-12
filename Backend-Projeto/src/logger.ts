import { randomUUID } from "crypto";
import { IncomingMessage } from "http";
import pino, {Logger} from "pino";
import PinoHttp from "pino-http";

const emTeste = process.env.NODE_ENV === 'test'
const nivel = process.env.LOG_NIVEL ?? (emTeste ? 'silent' : 'info')
const formato = process.env.LOG_FORMATO ?? 'texto'

export const logger: Logger = pino(
    {
        level: nivel,
        base: {servico: 'backend'},
        timestamp: pino.stdTimeFunctions.isoTime,
        redact: ['req.headers.authorization', 'senha', '*.senha', 'token'],
    },

    formato === 'texto'&& !emTeste ? pino.transport({
        target: 'pino-pretty',
              options: {
                  singleLine: true,
                  translateTime: 'SYS:HH:MM:ss.l',
                  ignore: 'pid,hostname,servico,contexto',
                  messageFormat: '[{servico}{if contexto}:{contexto}{end}] {msg}',
                },
    })
    : undefined
);

export const logDe = (contexto: string): Logger => logger.child({contexto})
const ehErroSintetico = (erro: Error) => erro.message.startsWith('failed with status code');
 
type RequisicaoComUsuario = IncomingMessage & { usuario?: { id: number }; originalUrl?: string };

export function logErro(req: RequisicaoComUsuario, mensagem: string, erro: unknown): void {
    const log = (req as { log?: Logger }).log ?? logger;
    log.error(
        {
            err: erro,
            rota: `${req.method} ${req.originalUrl ?? req.url}`,
            ...(req.usuario && { usuario: req.usuario.id }),
        },
        mensagem,
    );
}

export const logRequisicoes = PinoHttp({
    logger,
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
    customSuccessMessage: (req, res, tempo) =>
        `${req.method} ${(req as RequisicaoComUsuario).originalUrl ?? req.url} ${res.statusCode} ${Math.round(tempo)}ms`,
    customErrorMessage: (req, res, erro) =>
        `${req.method} ${(req as RequisicaoComUsuario).originalUrl ?? req.url} ${res.statusCode}` +
        (ehErroSintetico(erro) ? '' : ` - ${erro.message}`),
    customSuccessObject: () => ({}),
    customErrorObject: (_req, _res, erro) => (ehErroSintetico(erro) ? {} : { err: erro }),
});
import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import { logDe } from '../logger';



export const logCache = logDe('cache');

export const chaveDashboard = (usuarioId: number) => `dashboard:usuario:${usuarioId}`;


export const chaveGeracao = (usuarioId: number) => `dashboard:geracao:${usuarioId}`;

const TTL_PADRAO_S = 300;

export function ttlDashboard(): number {
    const valor = Number(process.env.CACHE_DASHBOARD_TTL);
    return Number.isInteger(valor) && valor > 0 ? valor : TTL_PADRAO_S;
}

const GRAVAR_SE_MESMA_GERACAO = `
local atual = redis.call('GET', KEYS[2]) or '0'
if atual == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
  return 1
end
return 0
`;

const INVALIDAR = `
redis.call('DEL', KEYS[1])
redis.call('INCR', KEYS[2])
redis.call('EXPIRE', KEYS[2], ARGV[1])
return 1
`;

export interface ClienteCache {
    isReady: boolean;
    connect(): Promise<unknown>;
    get(chave: string): Promise<string | null>;
    eval(script: string, opcoes: { keys: string[]; arguments: string[] }): Promise<unknown>;
    quit(): Promise<unknown>;
    on(evento: string, ouvinte: (...args: any[]) => void): unknown;
}

type FabricaCliente = (url: string) => ClienteCache;

const fabricaPadrao: FabricaCliente = (url) =>
    createClient({
        url,
        disableOfflineQueue: true,
        socket: {
            connectTimeout: 2000,
            reconnectStrategy: (tentativas) => Math.min(tentativas * 500, 5000),
        },
    }) as unknown as ClienteCache;

let fabrica: FabricaCliente = fabricaPadrao;
let cliente: ClienteCache | null = null;
let redisDisponivel = true;

function marcarDisponibilidade(disponivel: boolean, motivo?: string): void {
    if (disponivel === redisDisponivel) return;
    redisDisponivel = disponivel;
    if (disponivel) {
        logCache.info('Redis disponível de novo, cache da dashboard reativado');
    } else {
        logCache.warn(`Redis indisponível, dashboard vai direto ao banco até ele voltar (${motivo ?? 'sem detalhe'})`);
    }
}

function clientePronto(): ClienteCache | null {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    if (!cliente) {
        cliente = fabrica(url);
        cliente.on('error', (erro: Error) => marcarDisponibilidade(false, erro?.message));
        cliente.on('ready', () => marcarDisponibilidade(true));
        cliente.connect().catch((erro: Error) => marcarDisponibilidade(false, erro?.message));
    }

    return cliente.isReady ? cliente : null;
}

export function iniciarCacheDashboard(): void {
    if (!process.env.REDIS_URL) {
        logCache.warn('REDIS_URL não definida, dashboard sem cache (sempre direto do banco)');
        return;
    }
    clientePronto();
}

export type ResultadoCache<T> = { dados: T; origem: 'HIT' | 'MISS' };

export async function obterDashboardComCache<T>(usuarioId: number, montar: () => Promise<T>): Promise<ResultadoCache<T>> {
    const redis = clientePronto();
    let geracao = '0';

    if (redis) {
        try {
            const [guardado, geracaoAtual] = await Promise.all([
                redis.get(chaveDashboard(usuarioId)),
                redis.get(chaveGeracao(usuarioId)),
            ]);
            if (guardado) {
                logCache.info(`HIT dashboard usuario=${usuarioId}`);
                return { dados: JSON.parse(guardado) as T, origem: 'HIT' };
            }
            geracao = geracaoAtual ?? '0';
        } catch (erro) {
            marcarDisponibilidade(false, (erro as Error).message);
        }
    }

    const dados = await montar();
    logCache.info(`MISS dashboard usuario=${usuarioId}`);

    if (redis?.isReady) {
        try {
            await redis.eval(GRAVAR_SE_MESMA_GERACAO, {
                keys: [chaveDashboard(usuarioId), chaveGeracao(usuarioId)],
                arguments: [geracao, JSON.stringify(dados), String(ttlDashboard())],
            });
        } catch (erro) {
            marcarDisponibilidade(false, (erro as Error).message);
        }
    }
    return { dados, origem: 'MISS' };
}

export async function invalidarDashboard(usuarioId: number, motivo: string): Promise<void> {
    const redis = clientePronto();
    if (!redis) return;
    try {
        await redis.eval(INVALIDAR, {
            keys: [chaveDashboard(usuarioId), chaveGeracao(usuarioId)],
            arguments: [String(ttlDashboard() * 2)],
        });
        logCache.info(`dashboard invalidada usuario=${usuarioId} (${motivo})`);
    } catch (erro) {
        marcarDisponibilidade(false, (erro as Error).message);
    }
}

const METODOS_DE_ESCRITA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);


export function invalidarDashboardAposEscrita(
    invalidar: (usuarioId: number, motivo: string) => Promise<void> = invalidarDashboard,
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (METODOS_DE_ESCRITA.has(req.method)) {
            res.on('finish', () => {
                const usuarioId = req.usuario?.id;
                if (usuarioId && res.statusCode >= 200 && res.statusCode < 300) {
                    void invalidar(usuarioId, `${req.method} ${req.originalUrl}`);
                }
            });
        }
        next();
    };
}

export async function encerrarCacheDashboard(): Promise<void> {
    const atual = cliente;
    cliente = null;
    if (atual?.isReady) await atual.quit().catch(() => undefined);
}

export function definirFabricaCacheParaTestes(nova: FabricaCliente | null): void {
    fabrica = nova ?? fabricaPadrao;
    cliente = null;
    redisDisponivel = true;
}
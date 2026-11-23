import express from 'express';
import request from 'supertest';
import {
    chaveDashboard,
    chaveGeracao,
    ClienteCache,
    definirFabricaCacheParaTestes,
    encerrarCacheDashboard,
    invalidarDashboard,
    invalidarDashboardAposEscrita,
    logCache,
    obterDashboardComCache,
    ttlDashboard,
} from '../../cache/cacheDashboard';


function redisFalso(opcoes: { pronto?: boolean; falhar?: boolean } = {}) {
    const dados = new Map<string, string>();
    const ttls = new Map<string, number>();
    const falha = () => Promise.reject(new Error('conexão recusada'));

    const cliente = {
        dados,
        ttls,
        isReady: opcoes.pronto ?? true,
        connect: jest.fn().mockResolvedValue(undefined),
        quit: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        get: jest.fn(async (chave: string) => (opcoes.falhar ? falha() : dados.get(chave) ?? null)),
        eval: jest.fn(async (script: string, { keys, arguments: args }: { keys: string[]; arguments: string[] }) => {
            if (opcoes.falhar) return falha();
            const [chave, chaveGer] = keys;
            if (script.includes('INCR')) {
                dados.delete(chave);
                dados.set(chaveGer, String(Number(dados.get(chaveGer) ?? '0') + 1));
                ttls.set(chaveGer, Number(args[0]));
                return 1;
            }
            const [geracao, valor, ttl] = args;
            if ((dados.get(chaveGer) ?? '0') !== geracao) return 0;
            dados.set(chave, valor);
            ttls.set(chave, Number(ttl));
            return 1;
        }),
    };
    return cliente as typeof cliente & ClienteCache;
}

const DASHBOARD = { estatisticas: { livros_lidos: 2 }, avaliacao_media: 4.5 };

describe('cache da dashboard (GDL-12)', () => {
    const urlOriginal = process.env.REDIS_URL;
    const ttlOriginal = process.env.CACHE_DASHBOARD_TTL;

    beforeEach(() => {
        process.env.REDIS_URL = 'redis://teste:6379';
        delete process.env.CACHE_DASHBOARD_TTL;
        jest.spyOn(logCache, 'warn').mockImplementation(() => undefined);
        jest.spyOn(logCache, 'info').mockImplementation(() => undefined);
    });

    afterEach(async () => {
        await encerrarCacheDashboard();
        definirFabricaCacheParaTestes(null);
        process.env.REDIS_URL = urlOriginal;
        process.env.CACHE_DASHBOARD_TTL = ttlOriginal;
        jest.restoreAllMocks();
    });

    it('primeira vez vai ao banco (MISS) e guarda com TTL; a segunda vem do cache (HIT)', async () => {
        const redis = redisFalso();
        definirFabricaCacheParaTestes(() => redis);
        const montar = jest.fn().mockResolvedValue(DASHBOARD);

        const primeira = await obterDashboardComCache(7, montar);
        const segunda = await obterDashboardComCache(7, montar);

        expect(primeira).toEqual({ dados: DASHBOARD, origem: 'MISS' });
        expect(segunda).toEqual({ dados: DASHBOARD, origem: 'HIT' });
        expect(montar).toHaveBeenCalledTimes(1);
        expect(redis.ttls.get(chaveDashboard(7))).toBe(300);
    });

    it('a chave é por usuário: um leitor não recebe a dashboard do outro', async () => {
        definirFabricaCacheParaTestes(() => redisFalso());
        await obterDashboardComCache(1, async () => ({ dono: 1 }));

        const doOutro = await obterDashboardComCache(2, async () => ({ dono: 2 }));

        expect(doOutro).toEqual({ dados: { dono: 2 }, origem: 'MISS' });
    });

    it('TTL vem de CACHE_DASHBOARD_TTL, e valor inválido cai no padrão', () => {
        process.env.CACHE_DASHBOARD_TTL = '60';
        expect(ttlDashboard()).toBe(60);
        process.env.CACHE_DASHBOARD_TTL = 'abc';
        expect(ttlDashboard()).toBe(300);
    });

    it('invalidar apaga a dashboard e o próximo GET vai ao banco', async () => {
        definirFabricaCacheParaTestes(() => redisFalso());
        await obterDashboardComCache(7, async () => DASHBOARD);

        await invalidarDashboard(7, 'teste');
        const depois = await obterDashboardComCache(7, async () => ({ ...DASHBOARD, avaliacao_media: 5 }));

        expect(depois).toEqual({ dados: { ...DASHBOARD, avaliacao_media: 5 }, origem: 'MISS' });
    });

    it('GET lento não grava dado velho por cima de uma escrita que aconteceu no meio', async () => {
        const redis = redisFalso();
        definirFabricaCacheParaTestes(() => redis);

        const lento = obterDashboardComCache(7, async () => {
            await invalidarDashboard(7, 'nova leitura enquanto o GET montava');
            return { velho: true };
        });

        expect(await lento).toEqual({ dados: { velho: true }, origem: 'MISS' });
        expect(redis.dados.has(chaveDashboard(7))).toBe(false);
        expect(redis.dados.get(chaveGeracao(7))).toBe('1');
    });

    it('Redis fora do ar: dashboard vem do banco sem erro e avisa no log uma vez só', async () => {
        definirFabricaCacheParaTestes(() => redisFalso({ falhar: true }));
        const montar = jest.fn().mockResolvedValue(DASHBOARD);

        await expect(obterDashboardComCache(7, montar)).resolves.toEqual({ dados: DASHBOARD, origem: 'MISS' });
        await expect(obterDashboardComCache(7, montar)).resolves.toEqual({ dados: DASHBOARD, origem: 'MISS' });
        await expect(invalidarDashboard(7, 'teste')).resolves.toBeUndefined();
        expect(logCache.warn).toHaveBeenCalledTimes(1);
    });

    it('Redis ainda conectando ou sem REDIS_URL: vai direto ao banco', async () => {
        definirFabricaCacheParaTestes(() => redisFalso({ pronto: false }));
        expect((await obterDashboardComCache(7, async () => DASHBOARD)).origem).toBe('MISS');

        delete process.env.REDIS_URL;
        await encerrarCacheDashboard();
        expect((await obterDashboardComCache(7, async () => DASHBOARD)).origem).toBe('MISS');
    });
});

describe('invalidarDashboardAposEscrita (GDL-12)', () => {
    function appDeTeste(status: number) {
        const invalidar = jest.fn().mockResolvedValue(undefined);
        const app = express();
        app.use((req, _res, next) => {
            req.usuario = { id: 7 } as typeof req.usuario;
            next();
        });
        app.use('/api/leituras', invalidarDashboardAposEscrita(invalidar));
        app.all('/api/leituras', (_req, res) => {
            res.status(status).json({});
        });
        return { app, invalidar };
    }

    it('nova leitura com sucesso: invalida a dashboard do leitor', async () => {
        const { app, invalidar } = appDeTeste(201);
        await request(app).post('/api/leituras').expect(201);
        expect(invalidar).toHaveBeenCalledWith(7, 'POST /api/leituras');
    });

    it('escrita que falhou ou só leitura: não invalida', async () => {
        const falhou = appDeTeste(400);
        await request(falhou.app).post('/api/leituras').expect(400);
        const leitura = appDeTeste(200);
        await request(leitura.app).get('/api/leituras').expect(200);

        expect(falhou.invalidar).not.toHaveBeenCalled();
        expect(leitura.invalidar).not.toHaveBeenCalled();
    });
});
import express from 'express';
import request from 'supertest';
import {
    ClienteRedis,
    definirFabricaParaTestes,
    encerrarPublicador,
    guardarPendente,
    logEventos,
    publicarEvento,
} from '../../eventos/publicadorEventos';
import {
    CHAVE_ESTATISTICAS_PENDENTES,
    EVENTO_ESTATISTICAS_ATUALIZADAS,
    notificarEstatisticasAtualizadas,
    publicarEstatisticasAposEscrita,
} from '../../eventos/estatisticasEventos';
import { EstatisticasLeitor } from '../../eventos/estatisticasLeitor';

const estatisticas: EstatisticasLeitor = {
    livrosLidos: 3,
    livrosCadastrados: 5,
    paginasLidas: 900,
    totalSessoes: 4,
    totalAnotacoes: 2,
    totalAvaliacoes: 1,
    possuiMeta: true,
    livrosLidosPorGenero: { 2: 3 },
};

function clienteFalso(opcoes: { pronto?: boolean; publish?: jest.Mock; hSet?: jest.Mock } = {}) {
    const cliente = {
        isReady: opcoes.pronto ?? true,
        connect: jest.fn().mockResolvedValue(undefined),
        publish: opcoes.publish ?? jest.fn().mockResolvedValue(1),
        hSet: opcoes.hSet ?? jest.fn().mockResolvedValue(1),
        quit: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
    };
    return cliente as typeof cliente & ClienteRedis;
}

describe('publicarEvento (GDL-70)', () => {
    const urlOriginal = process.env.REDIS_URL;

    beforeEach(() => {
        process.env.REDIS_URL = 'redis://teste:6379';
        jest.spyOn(logEventos, 'info').mockImplementation(() => undefined);
        jest.spyOn(logEventos, 'error').mockImplementation(() => undefined);
    });

    afterEach(async () => {
        await encerrarPublicador();
        definirFabricaParaTestes(null);
        process.env.REDIS_URL = urlOriginal;
        jest.restoreAllMocks();
    });

    it('publica no canal do pattern no formato do transporte Redis do NestJS', async () => {
        const cliente = clienteFalso();
        definirFabricaParaTestes(() => cliente);

        const assinantes = await publicarEvento('estatisticas.atualizadas', { usuarioId: 7 }, 'usuario=7');

        expect(assinantes).toBe(1);
        expect(cliente.publish).toHaveBeenCalledWith(
            'estatisticas.atualizadas',
            JSON.stringify({ pattern: 'estatisticas.atualizadas', data: { usuarioId: 7 } }),
        );
        expect(logEventos.info).toHaveBeenCalledWith(
            'publicado estatisticas.atualizadas usuario=7 (1 assinante(s))',
        );
    });

    it('reaproveita a mesma conexão entre publicações', async () => {
        const cliente = clienteFalso();
        const fabrica = jest.fn(() => cliente);
        definirFabricaParaTestes(fabrica);

        await publicarEvento('a', {});
        await publicarEvento('b', {});

        expect(fabrica).toHaveBeenCalledTimes(1);
        expect(cliente.connect).toHaveBeenCalledTimes(1);
        expect(cliente.publish).toHaveBeenCalledTimes(2);
    });

    it('registra a falha e não lança erro quando o Redis recusa a publicação', async () => {
        const cliente = clienteFalso({ publish: jest.fn().mockRejectedValue(new Error('conexão recusada')) });
        definirFabricaParaTestes(() => cliente);

        await expect(publicarEvento('estatisticas.atualizadas', {}, 'usuario=7')).resolves.toBeNull();
        expect(logEventos.error).toHaveBeenCalledWith(
            'falha ao publicar estatisticas.atualizadas usuario=7: conexão recusada',
        );
    });

    it('não tenta publicar quando o Redis não está conectado', async () => {
        const cliente = clienteFalso({ pronto: false });
        definirFabricaParaTestes(() => cliente);

        await expect(publicarEvento('x', {})).resolves.toBeNull();
        expect(cliente.publish).not.toHaveBeenCalled();
    });

    it('não faz nada sem REDIS_URL', async () => {
        delete process.env.REDIS_URL;
        const fabrica = jest.fn(() => clienteFalso());
        definirFabricaParaTestes(fabrica);

        await expect(publicarEvento('x', {})).resolves.toBeNull();
        expect(fabrica).not.toHaveBeenCalled();
    });
});

describe('notificarEstatisticasAtualizadas (GDL-70)', () => {
    beforeEach(() => jest.spyOn(logEventos, 'error').mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it('publica usuarioId, estatísticas e o momento do cálculo', async () => {
        const publicar = jest.fn().mockResolvedValue(1);

        await notificarEstatisticasAtualizadas(7, async () => estatisticas, publicar);

        expect(publicar).toHaveBeenCalledWith(
            EVENTO_ESTATISTICAS_ATUALIZADAS,
            { usuarioId: 7, estatisticas, geradoEm: expect.any(String) },
            'usuario=7',
        );
        const evento = publicar.mock.calls[0][1];
        expect(new Date(evento.geradoEm).toISOString()).toBe(evento.geradoEm);
    });

    it('não lança erro quando o cálculo falha (ex.: banco fora do ar)', async () => {
        const publicar = jest.fn();

        await expect(
            notificarEstatisticasAtualizadas(7, async () => { throw new Error('banco fora'); }, publicar),
        ).resolves.toBeUndefined();
        expect(publicar).not.toHaveBeenCalled();
        expect(logEventos.error).toHaveBeenCalledWith(
            'falha ao montar estatisticas.atualizadas usuario=7: banco fora',
        );
    });
});

describe('conquistas-service fora do ar (GDL-76)', () => {
    const urlOriginal = process.env.REDIS_URL;
    let avisos: jest.SpyInstance;

    beforeEach(() => {
        avisos = jest.spyOn(logEventos, 'warn').mockImplementation(() => undefined);
        jest.spyOn(logEventos, 'info').mockImplementation(() => undefined);
        jest.spyOn(logEventos, 'error').mockImplementation(() => undefined);
    });
    afterEach(async () => {
        jest.restoreAllMocks();
        await encerrarPublicador();
        definirFabricaParaTestes(null);
        process.env.REDIS_URL = urlOriginal;
    });

    it('ninguém ouvindo (0 assinantes): guarda o evento para o serviço processar quando voltar', async () => {
        const publicar = jest.fn().mockResolvedValue(0);
        const guardar = jest.fn().mockResolvedValue(true);

        await notificarEstatisticasAtualizadas(7, async () => estatisticas, publicar, guardar);

        expect(guardar).toHaveBeenCalledWith(
            CHAVE_ESTATISTICAS_PENDENTES,
            '7',
            { usuarioId: 7, estatisticas, geradoEm: expect.any(String) },
        );
        expect(avisos).toHaveBeenCalledWith(
            'ninguém recebeu estatisticas.atualizadas usuario=7: guardado para o conquistas-service processar quando voltar',
        );
    });

    it('serviço ouvindo: não guarda nada', async () => {
        const guardar = jest.fn();
        await notificarEstatisticasAtualizadas(7, async () => estatisticas, jest.fn().mockResolvedValue(1), guardar);
        expect(guardar).not.toHaveBeenCalled();
    });

    it('Redis fora (publicação falhou): não tenta guardar', async () => {
        const guardar = jest.fn();
        await notificarEstatisticasAtualizadas(7, async () => estatisticas, jest.fn().mockResolvedValue(null), guardar);
        expect(guardar).not.toHaveBeenCalled();
    });

    it('guardarPendente grava o JSON do evento no hash, com o usuário como campo', async () => {
        process.env.REDIS_URL = 'redis://teste:6379';
        const cliente = clienteFalso();
        definirFabricaParaTestes(() => cliente);

        await expect(guardarPendente(CHAVE_ESTATISTICAS_PENDENTES, '7', { usuarioId: 7 })).resolves.toBe(true);
        expect(cliente.hSet).toHaveBeenCalledWith(CHAVE_ESTATISTICAS_PENDENTES, '7', '{"usuarioId":7}');
    });

    it('guardarPendente nunca lança: devolve false e registra a falha', async () => {
        process.env.REDIS_URL = 'redis://teste:6379';
        definirFabricaParaTestes(() => clienteFalso({ hSet: jest.fn().mockRejectedValue(new Error('OOM')) }));

        await expect(guardarPendente(CHAVE_ESTATISTICAS_PENDENTES, '7', {})).resolves.toBe(false);
        expect(logEventos.error).toHaveBeenCalledWith(
            'falha ao guardar evento pendente em eventos:pendentes:estatisticas.atualizadas (7): OOM',
        );
    });
});

describe('publicarEstatisticasAposEscrita (GDL-70)', () => {
    function montarApp(notificar: jest.Mock, logado = true) {
        const app = express();
        app.use(publicarEstatisticasAposEscrita(notificar));
        app.use((req, _res, next) => {
            if (logado) req.usuario = { id: 7 } as any;
            next();
        });
        app.post('/ok', (_req, res) => { res.status(201).json({ ok: true }); });
        app.post('/erro', (_req, res) => { res.status(400).json({ erro: 'inválido' }); });
        app.get('/ok', (_req, res) => { res.json({ ok: true }); });
        return app;
    }

    
    const aguardarFinish = () => new Promise((resolve) => setImmediate(resolve));

    it('notifica o usuário logado depois de uma escrita bem-sucedida', async () => {
        const notificar = jest.fn().mockResolvedValue(undefined);

        const resposta = await request(montarApp(notificar)).post('/ok');
        await aguardarFinish();

        expect(resposta.status).toBe(201);
        expect(resposta.body).toEqual({ ok: true });
        expect(notificar).toHaveBeenCalledWith(7);
    });

    it('não notifica em leitura (GET)', async () => {
        const notificar = jest.fn();
        await request(montarApp(notificar)).get('/ok');
        await aguardarFinish();
        expect(notificar).not.toHaveBeenCalled();
    });

    it('não notifica quando a escrita falha', async () => {
        const notificar = jest.fn();
        await request(montarApp(notificar)).post('/erro');
        await aguardarFinish();
        expect(notificar).not.toHaveBeenCalled();
    });

    it('não notifica sem usuário logado', async () => {
        const notificar = jest.fn();
        await request(montarApp(notificar, false)).post('/ok');
        await aguardarFinish();
        expect(notificar).not.toHaveBeenCalled();
    });
});
import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import {
    estadoCircuitoGoogle,
    fetchFromGoogle,
    GoogleBooksIndisponivelError,
    logGoogle,
    MENSAGEM_INDISPONIVEL,
    reiniciarGoogleBooksParaTestes,
} from '../../services/googleBooksService';
import { HttpError } from '../../utils/HttpError';

const timeout = () => new AxiosError('timeout of 4000ms exceeded', 'ECONNABORTED');
const http = (status: number) =>
    new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', undefined, undefined, { status, data: {} } as AxiosResponse);
const ok = (items: unknown[]) => ({ data: { items } });

const LIVRO = { id: 'abc', volumeInfo: { title: 'Duna', imageLinks: { thumbnail: 'http://books.google.com/capa' } } };

describe('googleBooksService: timeout, retry e circuit breaker (GDL-32)', () => {
    let get: jest.Mock;
    let esperas: number[];

    beforeEach(() => {
        get = jest.fn();
        esperas = [];
        reiniciarGoogleBooksParaTestes({
            cliente: { get } as unknown as AxiosInstance,
            esperar: async (ms) => {
                esperas.push(ms);
            },
        });
        delete process.env.GOOGLE_BOOKS_TENTATIVAS;
        jest.spyOn(logGoogle, 'warn').mockImplementation(() => undefined);
        jest.spyOn(logGoogle, 'info').mockImplementation(() => undefined);
        jest.spyOn(logGoogle, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
        reiniciarGoogleBooksParaTestes();
    });

    it('sucesso: devolve os livros com a capa em https', async () => {
        get.mockResolvedValue(ok([LIVRO]));

        const livros = await fetchFromGoogle('duna');

        expect(livros[0].volumeInfo.imageLinks.thumbnail).toBe('https://books.google.com/capa');
        expect(get).toHaveBeenCalledWith('', { params: { q: 'duna' } });
    });

    it('timeout na primeira tentativa: tenta de novo e responde', async () => {
        get.mockRejectedValueOnce(timeout()).mockResolvedValueOnce(ok([LIVRO]));

        await expect(fetchFromGoogle('duna')).resolves.toHaveLength(1);
        expect(get).toHaveBeenCalledTimes(2);
        expect(esperas).toEqual([300]);
    });

    it('falha temporária em todas as tentativas: para no limite e lança o erro de indisponível (503)', async () => {
        process.env.GOOGLE_BOOKS_TENTATIVAS = '3';
        get.mockRejectedValue(http(503));

        const erro = await fetchFromGoogle('duna').catch((e) => e);

        expect(erro).toBeInstanceOf(GoogleBooksIndisponivelError);
        expect(erro).toMatchObject({ status: 503, message: MENSAGEM_INDISPONIVEL });
        expect(get).toHaveBeenCalledTimes(3);
        expect(esperas).toEqual([300, 600]);
    });

    it('429 (limite de uso) não tenta de novo e responde 429 com mensagem amigável', async () => {
        get.mockRejectedValue(http(429));

        const erro = await fetchFromGoogle('duna').catch((e) => e);

        expect(erro).toBeInstanceOf(HttpError);
        expect(erro.status).toBe(429);
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('4xx como chave inválida não tenta de novo, mas o usuário recebe o mesmo fallback', async () => {
        get.mockRejectedValue(http(403));

        await expect(fetchFromGoogle('duna')).rejects.toBeInstanceOf(GoogleBooksIndisponivelError);
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('3 buscas seguidas falhando abrem o circuito: as próximas nem chamam o Google por 30 s', async () => {
        jest.useFakeTimers({ now: new Date('2026-11-23T15:00:00Z') });
        get.mockRejectedValue(timeout());

        for (let i = 0; i < 3; i++) {
            await expect(fetchFromGoogle('duna')).rejects.toBeInstanceOf(GoogleBooksIndisponivelError);
        }
        expect(estadoCircuitoGoogle()).toEqual({ aberto: true, falhasSeguidas: 3 });
        const chamadasAteAbrir = get.mock.calls.length;

        await expect(fetchFromGoogle('duna')).rejects.toBeInstanceOf(GoogleBooksIndisponivelError);
        expect(get).toHaveBeenCalledTimes(chamadasAteAbrir);
        expect(logGoogle.warn).toHaveBeenCalledWith(expect.stringContaining('circuito aberto por 30s'));
    });

    it('depois dos 30 s, uma busca que dá certo fecha o circuito', async () => {
        jest.useFakeTimers({ now: new Date('2026-11-23T15:00:00Z') });
        get.mockRejectedValue(timeout());
        for (let i = 0; i < 3; i++) await fetchFromGoogle('duna').catch(() => undefined);

        jest.setSystemTime(new Date('2026-11-23T15:00:31Z'));
        get.mockReset().mockResolvedValue(ok([LIVRO]));

        await expect(fetchFromGoogle('duna')).resolves.toHaveLength(1);
        expect(estadoCircuitoGoogle()).toEqual({ aberto: false, falhasSeguidas: 0 });
        expect(logGoogle.info).toHaveBeenCalledWith('Google Books respondeu de novo: circuito fechado');
    });

    it('um sucesso no meio zera a contagem de falhas', async () => {
        get.mockRejectedValueOnce(http(500)).mockRejectedValueOnce(http(500));
        await fetchFromGoogle('a').catch(() => undefined);
        get.mockResolvedValueOnce(ok([]));
        await fetchFromGoogle('b');

        expect(estadoCircuitoGoogle()).toEqual({ aberto: false, falhasSeguidas: 0 });
    });
});

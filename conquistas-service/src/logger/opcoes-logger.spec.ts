import { opcoesLogger } from './opcoes-logger';

type Opcoes = Record<string, (...args: unknown[]) => unknown> & { autoLogging: { ignore: (req: unknown) => boolean } };

describe('opcoesLogger (GDL-34)', () => {
  const opcoes = opcoesLogger().pinoHttp as unknown as Opcoes;
  const req = (extra: object = {}) => ({ method: 'GET', url: '/api/conquistas', originalUrl: '/api/conquistas/catalogo', headers: {}, ...extra });
  const res = (statusCode: number) => ({ statusCode, setHeader: jest.fn() });

  it('nível pelo status: 2xx info, 4xx warn, 5xx ou erro = error', () => {
    expect(opcoes.customLogLevel(req(), res(200))).toBe('info');
    expect(opcoes.customLogLevel(req(), res(401))).toBe('warn');
    expect(opcoes.customLogLevel(req(), res(500))).toBe('error');
    expect(opcoes.customLogLevel(req(), res(200), new Error('x'))).toBe('error');
  });

  it('linha da requisição: método, rota completa, status e tempo', () => {
    expect(opcoes.customSuccessMessage(req(), res(200), 12.4)).toBe('GET /api/conquistas/catalogo 200 12ms');
  });

  it('inclui o usuário logado (preenchido pelo guard)', () => {
    expect(opcoes.customProps(req({ usuario: { id: 7 } }))).toEqual({ usuario: 7 });
    expect(opcoes.customProps(req())).toEqual({});
  });

  it('não registra o healthcheck', () => {
    expect(opcoes.autoLogging.ignore({ url: '/health' })).toBe(true);
    expect(opcoes.autoLogging.ignore({ url: '/api/conquistas' })).toBe(false);
  });

  it('reaproveita o X-Request-Id que chegar (ex.: do Nginx) e devolve no cabeçalho', () => {
    const resposta = res(200);
    expect(opcoes.genReqId(req({ headers: { 'x-request-id': 'abc-123' } }), resposta)).toBe('abc-123');
    expect(resposta.setHeader).toHaveBeenCalledWith('X-Request-Id', 'abc-123');
    expect(opcoes.genReqId(req(), res(200))).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('500 sem exceção: não repete o erro inventado pelo pino-http', () => {
    const sintetico = new Error('failed with status code 500');
    expect(opcoes.customErrorMessage(req(), res(500), sintetico)).toBe('GET /api/conquistas/catalogo 500');
    expect(opcoes.customErrorObject(req(), res(500), sintetico)).toEqual({});
    const real = new Error('banco fora');
    expect(opcoes.customErrorMessage(req(), res(500), real)).toBe('GET /api/conquistas/catalogo 500 - banco fora');
    expect(opcoes.customErrorObject(req(), res(500), real)).toEqual({ err: real });
  });
});
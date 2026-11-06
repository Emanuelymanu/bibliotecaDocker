import { Cache } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { DURACAO_TOKEN_MS, RevogacaoIndisponivelError, RevogacaoTokensService } from './revogacao-tokens.service';

class RedisFalso {
  dados = new Map<string, { valor: unknown; ttl?: number }>();
  modo: 'ok' | 'fora' | 'travado' = 'ok';

  private async operar<T>(fazer: () => T): Promise<T> {
    if (this.modo === 'fora') throw new Error('The client is offline');
    if (this.modo === 'travado') return new Promise<T>(() => undefined);
    return fazer();
  }

  get = (chave: string) => this.operar(() => this.dados.get(chave)?.valor);
  set = (chave: string, valor: unknown, ttl?: number) => this.operar(() => !!this.dados.set(chave, { valor, ttl }));
}

describe('RevogacaoTokensService', () => {
  let redis: RedisFalso;
  let servico: RevogacaoTokensService;
  let avisos: string[];

  beforeEach(() => {
    redis = new RedisFalso();
    servico = new RevogacaoTokensService({ stores: [redis] } as unknown as Cache);
    avisos = [];
    jest.spyOn(Logger.prototype, 'warn').mockImplementation((m: string) => void avisos.push(m));
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('grava auth:revogado:<id> com o momento da mudança e TTL de 5h (a duração do token)', async () => {
    const quando = new Date('2026-11-05T21:00:00.000Z');

    await servico.revogarAte(9, quando);

    expect(redis.dados.get('auth:revogado:9')).toEqual({ valor: quando.getTime(), ttl: DURACAO_TOKEN_MS });
    expect(DURACAO_TOKEN_MS).toBe(5 * 60 * 60 * 1000);
    await expect(servico.revogadoEm(9)).resolves.toBe(quando.getTime());
  });

  it('sem mudança recente: null', async () => {
    await expect(servico.revogadoEm(9)).resolves.toBeNull();
  });

  it('evento atrasado não volta o relógio: fica a mudança mais nova', async () => {
    await servico.revogarAte(9, new Date('2026-11-05T21:10:00.000Z'));
    await servico.revogarAte(9, new Date('2026-11-05T21:00:00.000Z'));

    await expect(servico.revogadoEm(9)).resolves.toBe(new Date('2026-11-05T21:10:00.000Z').getTime());
  });

  it.each(['fora', 'travado'] as const)('Redis %s: lança RevogacaoIndisponivelError e avisa uma vez só', async (modo) => {
    redis.modo = modo;

    await expect(servico.revogadoEm(9)).rejects.toThrow(RevogacaoIndisponivelError);
    await expect(servico.revogadoEm(9)).rejects.toThrow(RevogacaoIndisponivelError);
    await expect(servico.revogarAte(9, new Date())).rejects.toThrow(RevogacaoIndisponivelError);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/rotas de admin respondem 503/);
  });

  describe('emitidoAntes', () => {
    const mudanca = new Date('2026-11-05T21:00:00.400Z').getTime();
    const seg = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

    it('token de antes da mudança: sim', () => {
      expect(RevogacaoTokensService.emitidoAntes(seg('2026-11-05T20:59:59Z'), mudanca)).toBe(true);
    });

    it('token do mesmo segundo: não dá para saber se é de antes, então recusa', () => {
      expect(RevogacaoTokensService.emitidoAntes(seg('2026-11-05T21:00:00Z'), mudanca)).toBe(true);
    });

    it('token de um segundo depois em diante: não', () => {
      expect(RevogacaoTokensService.emitidoAntes(seg('2026-11-05T21:00:01Z'), mudanca)).toBe(false);
      expect(RevogacaoTokensService.emitidoAntes(seg('2026-11-05T21:05:00Z'), mudanca)).toBe(false);
    });

    it('token sem iat: trata como antigo (recusa)', () => {
      expect(RevogacaoTokensService.emitidoAntes(undefined, mudanca)).toBe(true);
    });
  });
});
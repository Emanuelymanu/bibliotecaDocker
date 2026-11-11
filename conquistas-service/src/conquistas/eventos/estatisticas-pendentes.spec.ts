import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConquistasService } from '../conquistas.service';
import { CHAVE_ESTATISTICAS_PENDENTES, EstatisticasPendentesService } from './estatisticas-pendentes.service';


class RedisFalso {
  hash = new Map<string, string>();
  fora = false;

  async hgetall(chave: string) {
    if (this.fora) throw new Error('Connection is closed.');
    expect(chave).toBe(CHAVE_ESTATISTICAS_PENDENTES);
    return Object.fromEntries(this.hash);
  }

  async eval(_script: string, _n: number, _chave: string, campo: string, valor: string) {
    if (this.hash.get(campo) === valor) return this.hash.delete(campo) ? 1 : 0;
    return 0;
  }

  async quit() {}
}

const evento = (usuarioId: number, livrosLidos: number, geradoEm = '2026-11-10T20:00:00.000Z') =>
  JSON.stringify({
    usuarioId,
    geradoEm,
    estatisticas: {
      livrosLidos,
      livrosCadastrados: livrosLidos,
      paginasLidas: 100 * livrosLidos,
      totalSessoes: 0,
      totalAnotacoes: 0,
      totalAvaliacoes: 0,
      possuiMeta: false,
      livrosLidosPorGenero: {},
    },
  });

describe('EstatisticasPendentesService (GDL-76)', () => {
  let redis: RedisFalso;
  let registrar: jest.Mock;
  let servico: EstatisticasPendentesService;
  let logs: string[];

  beforeEach(() => {
    redis = new RedisFalso();
    registrar = jest.fn().mockResolvedValue({ aplicado: true, novas: [{ id_conquista: 1 }] });
    servico = new EstatisticasPendentesService(
      new ConfigService({}),
      { registrarEstatisticas: registrar } as unknown as ConquistasService,
    );
    (servico as unknown as { redis: RedisFalso }).redis = redis;
    logs = [];
    for (const nivel of ['log', 'warn', 'error'] as const) {
      jest.spyOn(Logger.prototype, nivel).mockImplementation((...args: unknown[]) => void logs.push(String(args[0])));
    }
  });

  afterEach(() => jest.restoreAllMocks());

  it('sem nada guardado: não faz nada', async () => {
    await expect(servico.processar()).resolves.toBe(0);
    expect(registrar).not.toHaveBeenCalled();
    expect(logs).toEqual([]);
  });

  it('processa cada leitor guardado, concede as conquistas e apaga do Redis', async () => {
    redis.hash.set('7', evento(7, 1));
    redis.hash.set('8', evento(8, 2));

    await expect(servico.processar()).resolves.toBe(2);

    expect(registrar).toHaveBeenCalledTimes(2);
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 7 }));
    expect(redis.hash.size).toBe(0);
    expect(logs[0]).toBe('processando 2 evento(s) guardado(s) enquanto o serviço estava fora do ar');
    expect(logs).toContain('usuario=7: evento pendente aplicado, 1 conquista(s) concedida(s)');
  });

  it('se o backend guardou uma versão mais nova durante o processamento, ela não é apagada', async () => {
    redis.hash.set('7', evento(7, 1));
    registrar.mockImplementation(async () => {
      redis.hash.set('7', evento(7, 2, '2026-11-10T20:05:00.000Z')); // chegou enquanto processava
      return { aplicado: true, novas: [] };
    });

    await servico.processar();

    expect(redis.hash.get('7')).toBe(evento(7, 2, '2026-11-10T20:05:00.000Z'));
  });

  it('banco fora na hora de processar: mantém guardado para a próxima conferência', async () => {
    redis.hash.set('7', evento(7, 1));
    registrar.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(servico.processar()).resolves.toBe(0);

    expect(redis.hash.has('7')).toBe(true);
    expect(logs).toContain('falha ao processar o evento pendente do usuario=7: connect ECONNREFUSED');
  });

  it('valor quebrado no hash: ignora, apaga e segue com os outros', async () => {
    redis.hash.set('6', 'isso-nao-e-json');
    redis.hash.set('7', evento(7, 1));

    await expect(servico.processar()).resolves.toBe(1);

    expect(redis.hash.size).toBe(0);
    expect(logs).toContain('evento pendente do usuario=6 ignorado (JSON inválido)');
  });

  it('Redis fora: avisa uma vez só e não lança', async () => {
    redis.fora = true;

    await expect(servico.processar()).resolves.toBe(0);
    await expect(servico.processar()).resolves.toBe(0);

    expect(logs).toEqual(['não foi possível ler os eventos pendentes: Connection is closed.']);
  });

  it('sem REDIS_URL: não liga nada', async () => {
    const semRedis = new EstatisticasPendentesService(new ConfigService({}), {} as ConquistasService);
    semRedis.onApplicationBootstrap();
    await expect(semRedis.processar()).resolves.toBe(0);
    await semRedis.onApplicationShutdown();
  });
});
import { Cache } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheCatalogoService } from './cache-catalogo.service';


class CacheFalso {
  dados = new Map<string, { valor: unknown; ttl?: number }>();
  modo: 'ok' | 'fora' | 'travado' = 'ok';

  private async operar<T>(fazer: () => T): Promise<T> {
    if (this.modo === 'fora') throw new Error('The client is offline');
    if (this.modo === 'travado') return new Promise<T>(() => undefined);
    return fazer();
  }

  get = (chave: string) => this.operar(() => this.dados.get(chave)?.valor);
  set = (chave: string, valor: unknown, ttl?: number) => this.operar(() => !!this.dados.set(chave, { valor, ttl }));
  delete = (chave: string) => this.operar(() => this.dados.delete(chave));
}

describe('CacheCatalogoService', () => {
  let falso: CacheFalso;
  let servico: CacheCatalogoService;
  let logs: string[];
  let avisos: string[];
  const config = { getOrThrow: () => 300 } as unknown as ConfigService;

  beforeEach(() => {
    falso = new CacheFalso();
    servico = new CacheCatalogoService({ stores: [falso] } as unknown as Cache, config);
    logs = [];
    avisos = [];
    jest.spyOn(Logger.prototype, 'log').mockImplementation((m: string) => void logs.push(m));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation((m: string) => void avisos.push(m));
  });

  afterEach(() => jest.restoreAllMocks());

  it('primeira consulta vai ao banco (MISS) e grava com TTL de 5 minutos', async () => {
    const calcular = jest.fn().mockResolvedValue({ total: 3 });

    const resultado = await servico.obterOuCalcular(7, calcular);

    expect(resultado).toEqual({ dados: { total: 3 }, origem: 'MISS' });
    expect(calcular).toHaveBeenCalledTimes(1);
    expect(falso.dados.get('conquistas:catalogo:v0:7')).toEqual({ valor: { total: 3 }, ttl: 300_000 });
    expect(logs).toContainEqual(expect.stringContaining('cache miss conquistas:catalogo:v0:7'));
  });

  it('consultas seguintes vêm do cache (HIT) sem tocar no banco', async () => {
    const calcular = jest.fn().mockResolvedValue({ total: 3 });
    await servico.obterOuCalcular(7, calcular);

    const resultado = await servico.obterOuCalcular(7, calcular);

    expect(resultado).toEqual({ dados: { total: 3 }, origem: 'HIT' });
    expect(calcular).toHaveBeenCalledTimes(1);
    expect(logs).toContainEqual(expect.stringContaining('cache hit  conquistas:catalogo:v0:7'));
  });

  it('cada leitor tem a sua chave', async () => {
    await servico.obterOuCalcular(7, async () => 'do 7');
    const doOito = await servico.obterOuCalcular(8, async () => 'do 8');

    expect(doOito).toEqual({ dados: 'do 8', origem: 'MISS' });
  });

  describe('invalidação (GDL-11)', () => {
    it('invalidarUsuario apaga só a chave daquele leitor', async () => {
      await servico.obterOuCalcular(7, async () => 'antigo');
      await servico.obterOuCalcular(8, async () => 'outro');

      await servico.invalidarUsuario(7, 'ganhou conquista');

      expect(await servico.obterOuCalcular(7, async () => 'novo')).toEqual({ dados: 'novo', origem: 'MISS' });
      expect(await servico.obterOuCalcular(8, async () => 'x')).toEqual({ dados: 'outro', origem: 'HIT' });
      expect(logs).toContainEqual(expect.stringContaining('cache invalidado conquistas:catalogo:v0:7 (ganhou conquista)'));
    });

    it('invalidarTodos troca a versão: todos os leitores voltam a consultar o banco', async () => {
      await servico.obterOuCalcular(7, async () => 'antigo 7');
      await servico.obterOuCalcular(8, async () => 'antigo 8');

      await servico.invalidarTodos('conquista criada');

      expect(await servico.obterOuCalcular(7, async () => 'novo 7')).toMatchObject({ dados: 'novo 7', origem: 'MISS' });
      expect(await servico.obterOuCalcular(8, async () => 'novo 8')).toMatchObject({ dados: 'novo 8', origem: 'MISS' });
      expect(falso.dados.get('conquistas:catalogo:versao')?.ttl).toBeUndefined(); // a versão nunca expira
      expect(logs).toContainEqual(expect.stringMatching(/invalidado para todos os leitores: versão \d+ \(conquista criada\)/));
    });
  });

  describe('Redis fora do ar', () => {
    it('responde direto do banco (SEM_CACHE) e avisa uma vez só', async () => {
      falso.modo = 'fora';
      const calcular = jest.fn().mockResolvedValue('do banco');

      const primeira = await servico.obterOuCalcular(7, calcular);
      const segunda = await servico.obterOuCalcular(7, calcular);

      expect(primeira).toEqual({ dados: 'do banco', origem: 'SEM_CACHE' });
      expect(segunda.origem).toBe('SEM_CACHE');
      expect(avisos).toHaveLength(1);
      expect(avisos[0]).toContain('Redis indisponível');
    });

    it('Redis travado: desiste em 300ms e responde do banco', async () => {
      falso.modo = 'travado';
      const inicio = Date.now();

      const resultado = await servico.obterOuCalcular(7, async () => 'do banco');

      expect(resultado.origem).toBe('SEM_CACHE');
      expect(Date.now() - inicio).toBeLessThan(1000);
    });

    it('invalidar com o Redis fora não quebra a operação do admin', async () => {
      falso.modo = 'fora';

      await expect(servico.invalidarTodos('conquista editada')).resolves.toBeUndefined();
      await expect(servico.invalidarUsuario(7, 'concedida')).resolves.toBeUndefined();
    });

    it('avisa quando o Redis volta e reativa o cache', async () => {
      falso.modo = 'fora';
      await servico.obterOuCalcular(7, async () => 'x');

      falso.modo = 'ok';
      const resultado = await servico.obterOuCalcular(7, async () => 'y');

      expect(resultado.origem).toBe('MISS');
      expect(logs).toContainEqual('Redis disponível de novo: cache do catálogo reativado');
    });
  });
});
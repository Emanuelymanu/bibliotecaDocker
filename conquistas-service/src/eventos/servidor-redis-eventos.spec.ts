import { opcoesRedisDaUrl } from './servidor-redis-eventos';

describe('opcoesRedisDaUrl', () => {
  it('URL do docker-compose', () => {
    expect(opcoesRedisDaUrl('redis://redis:6379')).toEqual({ host: 'redis', port: 6379 });
  });

  it('porta padrão quando a URL não informa', () => {
    expect(opcoesRedisDaUrl('redis://localhost')).toEqual({ host: 'localhost', port: 6379 });
  });

  it('usuário, senha (com caracteres especiais) e banco', () => {
    expect(opcoesRedisDaUrl('redis://app:s%40nha%2F1@cache.interno:6380/2')).toEqual({
      host: 'cache.interno',
      port: 6380,
      username: 'app',
      password: 's@nha/1',
      db: 2,
    });
  });

  it('rediss:// liga o TLS', () => {
    expect(opcoesRedisDaUrl('rediss://:segredo@host:6380')).toEqual({
      host: 'host',
      port: 6380,
      password: 'segredo',
      tls: {},
    });
  });

  it('recusa outro protocolo', () => {
    expect(() => opcoesRedisDaUrl('http://redis:6379')).toThrow('REDIS_URL deve começar com redis://');
  });
});
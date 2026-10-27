import { ConquistaDoUsuario } from '../conquistas/entities/conquista-do-usuario.entity';
import { Conquista } from '../conquistas/entities/conquista.entity';
import { configBancoDoAmbiente, opcoesBanco } from './opcoes-banco';

describe('opcoesBanco', () => {
  const config = { host: 'banco', porta: 3306, usuario: 'gamificacao', senha: 'x', nome: 'gamificacao' };

  it('conecta no banco gamificacao com o usuário próprio', () => {
    const opcoes = opcoesBanco(config);

    expect(opcoes).toMatchObject({
      type: 'mysql',
      host: 'banco',
      username: 'gamificacao',
      database: 'gamificacao',
    });
  });

  it('nunca altera o banco a partir das entities (só por migração)', () => {
    expect(opcoesBanco(config).synchronize).toBe(false);
  });

  it('registra as duas entities e a migração inicial', () => {
    const opcoes = opcoesBanco(config);

    expect(opcoes.entities).toEqual([Conquista, ConquistaDoUsuario]);
    expect(opcoes.migrations).toHaveLength(1);
  });
});

describe('configBancoDoAmbiente', () => {
  it('lê as variáveis e aplica padrões', () => {
    const config = configBancoDoAmbiente({ DB_USER: 'gamificacao', DB_PASSWORD: 'x' });

    expect(config).toEqual({ host: 'localhost', porta: 3306, usuario: 'gamificacao', senha: 'x', nome: 'gamificacao' });
  });

  it('explica o que falta quando não há usuário ou senha', () => {
    expect(() => configBancoDoAmbiente({})).toThrow(/DB_USER e DB_PASSWORD/);
  });
});
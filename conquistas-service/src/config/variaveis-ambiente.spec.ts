import { validarAmbiente } from './variaveis-ambiente';

describe('validarAmbiente', () => {
  const banco = { DB_USER: 'gamificacao', DB_PASSWORD: 'segredo', JWT_SECRET: 'segredo-jwt' };

  it('aplica os valores padrão quando só o obrigatório é informado', () => {
    const variaveis = validarAmbiente({ ...banco });

    expect(variaveis.PORT).toBe(3001);
    expect(variaveis.DB_HOST).toBe('localhost');
    expect(variaveis.DB_PORT).toBe(3306);
    expect(variaveis.DB_NAME).toBe('gamificacao');
  });

  it('converte portas vindas como texto do .env', () => {
    const variaveis = validarAmbiente({ ...banco, PORT: '4000', DB_PORT: '3307' });

    expect(variaveis.PORT).toBe(4000);
    expect(variaveis.DB_PORT).toBe(3307);
  });

  it('não sobe sem usuário e senha do banco', () => {
    expect(() => validarAmbiente({})).toThrow(/DB_USER é obrigatória/);
    expect(() => validarAmbiente({ DB_USER: 'gamificacao', JWT_SECRET: 'x' })).toThrow(/DB_PASSWORD é obrigatória/);
  });

  it('não sobe sem o JWT_SECRET', () => {
    expect(() => validarAmbiente({ DB_USER: 'gamificacao', DB_PASSWORD: 'segredo' })).toThrow(/JWT_SECRET é obrigatória/);
  });

  it('rejeita porta do banco inválida', () => {
    expect(() => validarAmbiente({ ...banco, DB_PORT: '70000' })).toThrow(/Variáveis de ambiente inválidas/);
  });
});
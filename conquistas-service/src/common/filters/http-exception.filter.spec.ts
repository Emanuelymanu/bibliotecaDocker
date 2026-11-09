import { ArgumentsHost, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function criarHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', originalUrl: '/api/teste' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filtro = new HttpExceptionFilter();

  it('responde erros HTTP no formato { erro }', () => {
    const { host, status, json } = criarHost();

    filtro.catch(new NotFoundException('Conquista não encontrada'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: 'Conquista não encontrada', statusCode: 404, caminho: '/api/teste' }),
    );
  });

  it('junta as mensagens de validação numa frase só', () => {
    const { host, json } = criarHost();

    filtro.catch(new BadRequestException(['nome é obrigatório', 'valor_alvo deve ser maior que zero']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: 'nome é obrigatório; valor_alvo deve ser maior que zero' }),
    );
  });

  it('não repete a mesma mensagem duas vezes', () => {
    const { host, json } = criarHost();

    filtro.catch(new BadRequestException(['id_usuario é obrigatório', 'id_usuario é obrigatório']), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ erro: 'id_usuario é obrigatório' }));
  });

  it('esconde detalhes de erros inesperados e responde 500', () => {
    const { host, status, json } = criarHost();
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filtro.catch(new Error('senha do banco: 123'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ erro: 'Erro interno no serviço de conquistas' }));
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
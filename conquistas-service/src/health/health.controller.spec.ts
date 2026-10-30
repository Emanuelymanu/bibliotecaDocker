import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = modulo.get(HealthController);
  });

  it('informa que o serviço está ok', () => {
    const resposta = controller.verificar();

    expect(resposta.status).toBe('ok');
    expect(resposta.servico).toBe('conquistas-service');
  });

  it('retorna um timestamp válido', () => {
    const { timestamp } = controller.verificar();

    expect(Number.isNaN(Date.parse(timestamp))).toBe(false);
  });
});
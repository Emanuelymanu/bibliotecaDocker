import { Logger } from '@nestjs/common';
import { PATTERN_HANDLER_METADATA, PATTERN_METADATA } from '@nestjs/microservices/constants';
import { PatternHandler } from '@nestjs/microservices/enums/pattern-handler.enum';
import { ROTA_PUBLICA } from '../../auth/decorators/publica.decorator';
import { ConquistasService } from '../conquistas.service';
import { EstatisticasEventosController } from './estatisticas-eventos.controller';

const evento = {
  usuarioId: 7,
  geradoEm: '2026-11-04T14:00:00.000Z',
  estatisticas: {
    livrosLidos: 1,
    livrosCadastrados: 1,
    paginasLidas: 310,
    totalSessoes: 0,
    totalAnotacoes: 0,
    totalAvaliacoes: 0,
    possuiMeta: false,
    livrosLidosPorGenero: { '3': 1 },
  },
};

describe('EstatisticasEventosController', () => {
  let registrar: jest.Mock;
  let controller: EstatisticasEventosController;
  let log: jest.SpyInstance;
  let aviso: jest.SpyInstance;
  let erro: jest.SpyInstance;

  beforeEach(() => {
    registrar = jest.fn().mockResolvedValue({ aplicado: true, novas: [] });
    controller = new EstatisticasEventosController({ registrarEstatisticas: registrar } as unknown as ConquistasService);
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    aviso = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    erro = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('assina o canal estatisticas.atualizadas como evento e dispensa o JWT', () => {
    const handler = EstatisticasEventosController.prototype.aoAtualizarEstatisticas;

    expect(Reflect.getMetadata(PATTERN_METADATA, handler)).toEqual(['estatisticas.atualizadas']);
    expect(Reflect.getMetadata(PATTERN_HANDLER_METADATA, handler)).toBe(PatternHandler.EVENT);
    expect(Reflect.getMetadata(ROTA_PUBLICA, EstatisticasEventosController)).toBe(true);
  });

  it('loga a mensagem recebida e repassa o evento tipado ao serviço', async () => {
    await controller.aoAtualizarEstatisticas(evento);

    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 7, geradoEm: new Date(evento.geradoEm) }),
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining('recebido estatisticas.atualizadas usuario=7'));
  });

  it('evento fora do formato: registra aviso e não chama o serviço', async () => {
    await controller.aoAtualizarEstatisticas({ ...evento, usuarioId: 'abc' });

    expect(registrar).not.toHaveBeenCalled();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('evento ignorado (usuarioId deve ser'));
  });

  it('falha no serviço (ex.: banco fora): registra erro sem derrubar o consumidor', async () => {
    registrar.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(controller.aoAtualizarEstatisticas(evento)).resolves.toBeUndefined();
    expect(erro).toHaveBeenCalledWith('falha ao processar o evento do usuario=7: connect ECONNREFUSED');
  });
});
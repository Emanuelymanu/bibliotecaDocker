import { Logger } from '@nestjs/common';
import { PATTERN_HANDLER_METADATA, PATTERN_METADATA } from '@nestjs/microservices/constants';
import { PatternHandler } from '@nestjs/microservices/enums/pattern-handler.enum';
import { ROTA_PUBLICA } from '../decorators/publica.decorator';
import { RevogacaoTokensService } from '../revogacao-tokens.service';
import { EventoPermissaoInvalidoError, lerEventoPermissao } from './permissao-alterada';
import { PermissaoEventosController } from './permissao-eventos.controller';


const doBackend = { usuarioId: 9, tipo_usuario: 'usuario', alteradoEm: '2026-11-05T21:00:00.000Z' };

describe('lerEventoPermissao', () => {
  it('aceita o evento do backend', () => {
    expect(lerEventoPermissao(doBackend)).toEqual({
      usuarioId: 9,
      tipo_usuario: 'usuario',
      alteradoEm: new Date('2026-11-05T21:00:00.000Z'),
    });
  });

  it.each([
    ['corpo nulo', null, 'não é um objeto'],
    ['usuarioId em texto', { ...doBackend, usuarioId: '9' }, 'usuarioId'],
    ['tipo desconhecido', { ...doBackend, tipo_usuario: 'root' }, 'tipo_usuario'],
    ['sem alteradoEm', { ...doBackend, alteradoEm: undefined }, 'alteradoEm'],
    ['alteradoEm inválido', { ...doBackend, alteradoEm: 'ontem' }, 'alteradoEm'],
  ])('recusa %s', (_, dados, mensagem) => {
    expect(() => lerEventoPermissao(dados)).toThrow(EventoPermissaoInvalidoError);
    expect(() => lerEventoPermissao(dados)).toThrow(mensagem);
  });
});

describe('PermissaoEventosController', () => {
  let revogarAte: jest.Mock;
  let controller: PermissaoEventosController;
  let logs: string[];
  let avisos: string[];
  let erros: string[];

  beforeEach(() => {
    revogarAte = jest.fn().mockResolvedValue(0);
    controller = new PermissaoEventosController({ revogarAte } as unknown as RevogacaoTokensService);
    logs = [];
    avisos = [];
    erros = [];
    jest.spyOn(Logger.prototype, 'log').mockImplementation((m: string) => void logs.push(m));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation((m: string) => void avisos.push(m));
    jest.spyOn(Logger.prototype, 'error').mockImplementation((m: string) => void erros.push(m));
  });

  afterEach(() => jest.restoreAllMocks());

  it('assina usuario.permissao_alterada como evento e dispensa o JWT', () => {
    const handler = PermissaoEventosController.prototype.aoAlterarPermissao;

    expect(Reflect.getMetadata(PATTERN_METADATA, handler)).toEqual(['usuario.permissao_alterada']);
    expect(Reflect.getMetadata(PATTERN_HANDLER_METADATA, handler)).toBe(PatternHandler.EVENT);
    expect(Reflect.getMetadata(ROTA_PUBLICA, PermissaoEventosController)).toBe(true);
  });

  it('revoga os tokens do usuário e registra o recebimento no log', async () => {
    await controller.aoAlterarPermissao(doBackend);

    expect(revogarAte).toHaveBeenCalledWith(9, new Date('2026-11-05T21:00:00.000Z'));
    expect(logs[0]).toBe(
      'recebido usuario.permissao_alterada usuario=9 agora é usuario (em 2026-11-05T21:00:00.000Z)',
    );
    expect(logs[1]).toMatch(/usuario=9: tokens emitidos antes de .* revogados por 5h/);
  });

  it('evento fora do formato: aviso e nada é revogado', async () => {
    await controller.aoAlterarPermissao({ usuarioId: 9 });

    expect(revogarAte).not.toHaveBeenCalled();
    expect(avisos[0]).toMatch(/^evento ignorado \(tipo_usuario/);
  });

  it('Redis fora na hora de gravar: registra erro sem derrubar o consumidor', async () => {
    revogarAte.mockRejectedValue(new Error('The client is offline'));

    await expect(controller.aoAlterarPermissao(doBackend)).resolves.toBeUndefined();
    expect(erros).toEqual(['falha ao revogar os tokens do usuario=9: The client is offline']);
  });
});
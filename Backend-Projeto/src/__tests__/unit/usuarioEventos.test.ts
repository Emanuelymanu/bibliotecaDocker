import { Request, Response } from 'express';

jest.mock('../../models-auto/usuarios', () => ({ usuarios: { findByPk: jest.fn() } }));
jest.mock('../../eventos/publicadorEventos', () => ({ publicarEvento: jest.fn() }));

import { usuarios } from '../../models-auto/usuarios';
import { publicarEvento } from '../../eventos/publicadorEventos';
import { EVENTO_PERMISSAO_ALTERADA, notificarPermissaoAlterada } from '../../eventos/usuarioEventos';
import { AdminUsuariosController } from '../../controller/AdminUsuariosController';

const buscar = usuarios.findByPk as jest.Mock;
const publicar = publicarEvento as jest.Mock;

function usuarioDoBanco(tipo: 'usuario' | 'admin') {
    return { id_usuario: 9, nome: 'Ana', email: 'ana@teste.com', tipo_usuario: tipo, save: jest.fn().mockResolvedValue(undefined) };
}

function resposta() {
    const res = { statusCode: 200, corpo: undefined as unknown } as Response & { corpo: unknown };
    res.status = jest.fn((codigo: number) => { res.statusCode = codigo; return res; }) as never;
    res.json = jest.fn((corpo: unknown) => { res.corpo = corpo; return res; }) as never;
    return res;
}

const requisicao = (id: number, idAdmin = 1) => ({ params: { id: String(id) }, usuario: { id: idAdmin } }) as unknown as Request;

beforeEach(() => {
    buscar.mockReset();
    publicar.mockReset().mockResolvedValue(1);
});

describe('notificarPermissaoAlterada (GDL-79)', () => {
    it('publica usuario.permissao_alterada com usuarioId, tipo_usuario e alteradoEm', async () => {
        const quando = new Date('2026-11-05T21:00:00.000Z');

        await expect(notificarPermissaoAlterada(9, 'usuario', quando)).resolves.toBe(true);

        expect(publicar).toHaveBeenCalledWith(
            EVENTO_PERMISSAO_ALTERADA,
            { usuarioId: 9, tipo_usuario: 'usuario', alteradoEm: '2026-11-05T21:00:00.000Z' },
            'usuario=9 tipo=usuario',
        );
        expect(EVENTO_PERMISSAO_ALTERADA).toBe('usuario.permissao_alterada');
    });

    it('devolve false quando não conseguiu publicar (Redis fora), sem lançar erro', async () => {
        publicar.mockResolvedValue(null);
        await expect(notificarPermissaoAlterada(9, 'admin')).resolves.toBe(false);
    });
});

describe('AdminUsuariosController: promover e rebaixar publicam o evento', () => {
    const controller = new AdminUsuariosController();

    it('rebaixar: grava a permissão e só depois publica', async () => {
        const ana = usuarioDoBanco('admin');
        buscar.mockResolvedValue(ana);
        const res = resposta();

        await controller.rebaixar(requisicao(9), res);

        expect(res.statusCode).toBe(200);
        expect(ana.tipo_usuario).toBe('usuario');
        expect(ana.save.mock.invocationCallOrder[0]).toBeLessThan(publicar.mock.invocationCallOrder[0]);
        expect(publicar).toHaveBeenCalledWith(
            'usuario.permissao_alterada',
            expect.objectContaining({ usuarioId: 9, tipo_usuario: 'usuario' }),
            expect.any(String),
        );
    });

    it('promover: publica com tipo admin', async () => {
        buscar.mockResolvedValue(usuarioDoBanco('usuario'));

        await controller.promover(requisicao(9), resposta());

        expect(publicar).toHaveBeenCalledWith(
            'usuario.permissao_alterada',
            expect.objectContaining({ usuarioId: 9, tipo_usuario: 'admin' }),
            expect.any(String),
        );
    });

    it('promover quem já é admin: nada muda, nada é publicado', async () => {
        const ana = usuarioDoBanco('admin');
        buscar.mockResolvedValue(ana);

        const res = resposta();
        await controller.promover(requisicao(9), res);

        expect(res.statusCode).toBe(200);
        expect(ana.save).not.toHaveBeenCalled();
        expect(publicar).not.toHaveBeenCalled();
    });

    it('Redis fora: a mudança vale no backend e a resposta é 200', async () => {
        publicar.mockResolvedValue(null);
        buscar.mockResolvedValue(usuarioDoBanco('admin'));

        const res = resposta();
        await controller.rebaixar(requisicao(9), res);

        expect(res.statusCode).toBe(200);
    });

    it('rebaixar a si mesmo continua proibido e não publica nada', async () => {
        const res = resposta();
        await controller.rebaixar(requisicao(9, 9), res);

        expect(res.statusCode).toBe(400);
        expect(publicar).not.toHaveBeenCalled();
    });

    it('usuário inexistente: 404 e nenhum evento', async () => {
        buscar.mockResolvedValue(null);
        const res = resposta();

        await controller.rebaixar(requisicao(404), res);

        expect(res.statusCode).toBe(404);
        expect(publicar).not.toHaveBeenCalled();
    });
});
import { Request } from 'express';
import { logErro } from '../../logger';

describe('logErro (GDL-34)', () => {
    it('registra o erro com a rota e o usuário da requisição', () => {
        const error = jest.fn();
        const req = {
            method: 'POST',
            originalUrl: '/api/metas',
            usuario: { id: 7 },
            log: { error },
        } as unknown as Request;
        const falha = new Error('banco fora');

        logErro(req, 'Erro ao salvar meta', falha);

        expect(error).toHaveBeenCalledWith({ err: falha, rota: 'POST /api/metas', usuario: 7 }, 'Erro ao salvar meta');
    });

    it('sem usuário logado (ex.: login), não inclui o campo', () => {
        const error = jest.fn();
        logErro({ method: 'POST', originalUrl: '/api/auth/login', log: { error } } as unknown as Request, 'Erro no login', 'x');
        expect(error).toHaveBeenCalledWith({ err: 'x', rota: 'POST /api/auth/login' }, 'Erro no login');
    });
});
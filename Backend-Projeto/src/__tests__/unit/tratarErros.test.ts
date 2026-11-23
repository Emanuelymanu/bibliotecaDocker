import express from 'express';
import multer from 'multer';
import request from 'supertest';
import { logger } from '../../logger';
import { converterErro, rotaNaoEncontrada, tratarErros } from '../../middleware/tratarErros';
import { HttpError } from '../../utils/HttpError';

function erroComNome(name: string, mensagens: string[] = []) {
    return Object.assign(new Error('detalhe interno do banco'), { name, errors: mensagens.map((message) => ({ message })) });
}


function appQueLanca(erro: unknown) {
    const app = express();
    app.use(express.json());
    app.get('/api/sincrono', () => {
        throw erro;
    });
    app.get('/api/async', async () => {
        await Promise.resolve();
        throw erro;
    });
    app.post('/api/json', (req, res) => {
        res.json(req.body);
    });
    app.use('/api', rotaNaoEncontrada);
    app.use(tratarErros);
    return app;
}

describe('tratamento central de erros (GDL-35)', () => {
    let aviso: jest.SpyInstance;
    let erro: jest.SpyInstance;

    beforeEach(() => {
        aviso = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
        erro = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('HttpError lançado no controller vira a resposta padrão, com status e mensagem', async () => {
        const r = await request(appQueLanca(new HttpError(409, 'Este livro já está na sua estante!'))).get('/api/sincrono');

        expect(r.status).toBe(409);
        expect(r.body).toEqual({ erro: 'Este livro já está na sua estante!', statusCode: 409 });
    });

    it('erro lançado dentro de função async também chega ao tratamento central', async () => {
        const r = await request(appQueLanca(new HttpError(404, 'Livro não encontrado'))).get('/api/async');

        expect(r.status).toBe(404);
        expect(r.body.erro).toBe('Livro não encontrado');
    });

    it('erro inesperado: 500 com mensagem genérica, sem vazar a mensagem interna, e log com a pilha', async () => {
        const r = await request(appQueLanca(new Error('ECONNREFUSED 10.0.0.5:3306'))).get('/api/async');

        expect(r.status).toBe(500);
        expect(r.body).toEqual({ erro: 'Erro interno do servidor. Tente novamente em instantes.', statusCode: 500 });
        expect(JSON.stringify(r.body)).not.toContain('ECONNREFUSED');
        expect(erro).toHaveBeenCalledWith(
            expect.objectContaining({ err: expect.any(Error), rota: 'GET /api/async' }),
            'Erro não tratado',
        );
    });

    it('erro do cliente (4xx) vai para o log como aviso, não como erro', async () => {
        await request(appQueLanca(new HttpError(400, 'CPF inválido'))).get('/api/sincrono');

        expect(aviso).toHaveBeenCalledWith(expect.objectContaining({ status: 400, rota: 'GET /api/sincrono' }), 'CPF inválido');
        expect(erro).not.toHaveBeenCalled();
    });

    it('JSON malformado no corpo: 400 em JSON (antes saía a página de erro HTML do Express)', async () => {
        const r = await request(appQueLanca(null))
            .post('/api/json')
            .set('Content-Type', 'application/json')
            .send('{"titulo": ');

        expect(r.status).toBe(400);
        expect(r.body).toEqual({ erro: 'JSON inválido no corpo da requisição', statusCode: 400 });
    });

    it('rota /api que não existe: 404 em JSON', async () => {
        const r = await request(appQueLanca(null)).get('/api/nao-existe');

        expect(r.status).toBe(404);
        expect(r.body).toEqual({ erro: 'Rota não encontrada: GET /api/nao-existe', statusCode: 404 });
    });

    describe('converterErro', () => {
        it.each([
            ['validação do Sequelize', erroComNome('SequelizeValidationError', ['email inválido']), 400, ['email inválido']],
            ['chave única do Sequelize', erroComNome('SequelizeUniqueConstraintError', ['email must be unique']), 409, ['email must be unique']],
            ['chave estrangeira do Sequelize', erroComNome('SequelizeForeignKeyConstraintError'), 409, undefined],
        ])('%s', (_nome, entrada, status, detalhes) => {
            const resposta = converterErro(entrada);
            expect(resposta.statusCode).toBe(status);
            expect(resposta.detalhes).toEqual(detalhes);
            expect(resposta.erro).not.toContain('detalhe interno');
        });

        it('arquivo grande demais no upload: 400 com o limite', () => {
            expect(converterErro(new multer.MulterError('LIMIT_FILE_SIZE'))).toEqual({
                erro: 'Arquivo maior que o limite permitido (5MB)',
                statusCode: 400,
            });
        });

        it('qualquer coisa que não é Error (ex.: string lançada) vira 500', () => {
            expect(converterErro('falhou').statusCode).toBe(500);
        });
    });
});
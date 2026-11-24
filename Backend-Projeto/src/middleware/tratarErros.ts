import { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { logErro, logger } from '../logger';
import { HttpError } from '../utils/HttpError';


export interface RespostaErro {
    erro: string;
    statusCode: number;
    detalhes?: string[];
}

const MENSAGEM_ERRO_INTERNO = 'Erro interno do servidor. Tente novamente em instantes.';

type ErroSequelize = Error & { errors?: { message: string }[] };
type ErroBodyParser = Error & { type?: string; status?: number };

export function converterErro(erro: unknown): RespostaErro {
    if (erro instanceof HttpError) {
        return { erro: erro.message, statusCode: erro.status };
    }

    if (erro instanceof multer.MulterError) {
        if (erro.code === 'LIMIT_FILE_SIZE') {
            return { erro: 'Arquivo maior que o limite permitido (5MB)', statusCode: 400 };
        }
        return { erro: `Erro no upload: ${erro.message}`, statusCode: 400 };
    }

    if (erro instanceof Error) {
        const { type } = erro as ErroBodyParser;
        if (type === 'entity.parse.failed') {
            return { erro: 'JSON inválido no corpo da requisição', statusCode: 400 };
        }
        if (type === 'entity.too.large') {
            return { erro: 'Corpo da requisição muito grande', statusCode: 413 };
        }

        const detalhes = (erro as ErroSequelize).errors?.map((e) => e.message);
        switch (erro.name) {
            case 'SequelizeValidationError':
                return { erro: 'Dados inválidos', statusCode: 400, detalhes };
            case 'SequelizeUniqueConstraintError':
                return { erro: 'Registro já existe', statusCode: 409, detalhes };
            case 'SequelizeForeignKeyConstraintError':
                return { erro: 'Registro relacionado não encontrado ou em uso', statusCode: 409 };
        }
    }

    return { erro: MENSAGEM_ERRO_INTERNO, statusCode: 500 };
}

export const tratarErros: ErrorRequestHandler = (erro, req, res, next) => {
    if (res.headersSent) {
        next(erro);
        return;
    }

    const resposta = converterErro(erro);

    if (resposta.statusCode >= 500) {
        logErro(req, 'Erro não tratado', erro);
    } else {
        (req.log ?? logger).warn(
            { rota: `${req.method} ${req.originalUrl}`, status: resposta.statusCode, ...(req.usuario && { usuario: req.usuario.id }) },
            resposta.erro,
        );
    }

    res.status(resposta.statusCode).json(resposta);
};


export const rotaNaoEncontrada: RequestHandler = (req, _res, next) => {
    next(new HttpError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));
};
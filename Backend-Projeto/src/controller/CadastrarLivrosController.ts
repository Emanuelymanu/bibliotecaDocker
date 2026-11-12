import { Request, Response } from 'express';
import { LivrosService } from '../services/livrosService';
import { HttpError } from '../utils/HttpError';
import { logErro } from '../logger';

const livrosService = new LivrosService();

export class CadastrarLivrosController {

    async cadastrarLivro(req: Request, res: Response) {
        try {
            const livro = await livrosService.cadastrarLivro(
                req.body,
                req.usuario?.id,
                req.file?.filename,
                `${req.protocol}://${req.get('host')}`
            );

            req.log.info({ livro: livro.id_livro, usuario: req.usuario?.id }, 'Livro vinculado à estante');

            return res.status(201).json({
                mensagem: 'Livro adicionado à sua estante com sucesso!',
                livro
            });
        } catch (error: any) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ message: error.message });
            }
            logErro(req, 'Erro ao cadastrar livro', error);
            return res.status(500).json({ message: 'Erro interno ao cadastrar livro' });
        }
    }
}
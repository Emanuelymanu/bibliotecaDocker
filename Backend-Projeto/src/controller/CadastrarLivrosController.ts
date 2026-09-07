import { Request, Response } from 'express';
import { LivrosService } from '../services/livrosService';
import { HttpError } from '../utils/HttpError';

const livrosService = new LivrosService();

export class CadastrarLivrosController {

    async cadastrarLivro(req: Request, res: Response) {
        try {
            const livro = await livrosService.cadastrarLivro(req.body, req.usuario?.id, req.file?.filename);

            console.log('Livro vinculado com sucesso. ID Local:', livro.id_livro);

            return res.status(201).json({
                mensagem: 'Livro adicionado à sua estante com sucesso!',
                livro
            });
        } catch (error: any) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Erro ao cadastrar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao cadastrar livro' });
        }
    }
}

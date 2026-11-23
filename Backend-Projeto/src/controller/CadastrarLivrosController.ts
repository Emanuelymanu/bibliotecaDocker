import { Request, Response } from 'express';
import { LivrosService } from '../services/livrosService';

const livrosService = new LivrosService();


export class CadastrarLivrosController {

    async cadastrarLivro(req: Request, res: Response) {
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
    }
}
import { Request, Response } from 'express';
import fs from 'fs';
import { LivrosService } from '../services/livrosService';
import { HttpError } from '../utils/HttpError';

const livrosService = new LivrosService();

export class EditarLivrosController {

    async atualizarLivro(req: Request, res: Response): Promise<Response> {
        const file = req.file;
        try {
            const id = Number(req.params.id);
            const livro = await livrosService.atualizarLivro(
                id,
                req.body,
                req.usuario,
                file,
                `${req.protocol}://${req.get('host')}`
            );

            return res.json({ mensagem: 'Livro atualizado com sucesso', livro });
        } catch (error) {
            if (file) {
                try { fs.unlinkSync(file.path); } catch (err) { console.error('Erro ao remover arquivo:', err); }
            }
            if (error instanceof HttpError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Erro ao atualizar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao atualizar livro' });
        }
    }

    async deletarLivro(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            await livrosService.deletarLivro(id);
            return res.json({ message: 'Livro deletado com sucesso' });
        } catch (error) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('Erro ao deletar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao deletar livro' });
        }
    }
}

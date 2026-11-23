import { Request, Response } from 'express';
import fs from 'fs';
import { LivrosService } from '../services/livrosService';
import { logErro } from '../logger';

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
                try { fs.unlinkSync(file.path); } catch (err) { logErro(req, 'Erro ao remover arquivo', err); }
            }
            throw error;
        }
    }

    async deletarLivro(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        await livrosService.deletarLivro(id, req.usuario);
        return res.json({ message: 'Livro deletado com sucesso' });
    }
}
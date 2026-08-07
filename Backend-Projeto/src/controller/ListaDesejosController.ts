import { Request, Response } from 'express';
import { lista_livros } from '../models-auto/lista_livros';
import { livros } from '../models-auto/livros';
import { autores } from '../models-auto/autores';
import { editoras } from '../models-auto/editoras';

export class ListaDesejosController {


    async adicionar(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;
            const { id_livro } = req.body;

            if (!id_livro) {
                return res.status(400).json({ erro: 'id_livro é obrigatório' });
            }

            const livro = await livros.findByPk(id_livro);
            if (!livro) {
                return res.status(404).json({ erro: 'Livro não encontrado' });
            }

            const [item, criado] = await lista_livros.findOrCreate({
                where: { id_usuario: usuarioId, id_livro },
                defaults: {
                    id_usuario: usuarioId,
                    id_livro,
                    data_adicao: new Date().toISOString().split('T')[0]
                }
            });

            if (!criado) {
                return res.status(409).json({ erro: 'Este livro já está na sua lista de desejos' });
            }

            return res.status(201).json({ mensagem: 'Livro adicionado à lista de desejos', item });
        } catch (error) {
            console.error('Erro ao adicionar à lista de desejos:', error);
            return res.status(500).json({ erro: 'Erro interno ao adicionar à lista de desejos' });
        }
    }

    
    async listar(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;

            const itens = await lista_livros.findAll({
                where: { id_usuario: usuarioId },
                order: [['data_adicao', 'DESC']],
                include: [{
                    model: livros,
                    as: 'livro',
                    include: [
                        { model: autores, as: 'autores', attributes: ['nome'] },
                        { model: editoras, as: 'editora', attributes: ['nome'] }
                    ]
                }]
            });

            const resposta = itens.map((item: any) => {
                const livro = item.livro?.get ? item.livro.get({ plain: true }) : item.livro;
                return {
                    data_adicao: item.data_adicao,
                    livro: livro ? {
                        ...livro,
                        autores: (livro.autores || []).map((a: any) => a.nome),
                        editora: livro.editora?.nome ?? null
                    } : null
                };
            });

            return res.json({ total: resposta.length, lista_desejos: resposta });
        } catch (error) {
            console.error('Erro ao listar lista de desejos:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar lista de desejos' });
        }
    }

    
    async remover(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;
            const idLivro = Number(req.params.id_livro);

            if (isNaN(idLivro)) {
                return res.status(400).json({ erro: 'ID de livro inválido' });
            }

            const item = await lista_livros.findOne({ where: { id_usuario: usuarioId, id_livro: idLivro } });
            if (!item) {
                return res.status(404).json({ erro: 'Este livro não está na sua lista de desejos' });
            }

            await item.destroy();
            return res.json({ mensagem: 'Livro removido da lista de desejos' });
        } catch (error) {
            console.error('Erro ao remover da lista de desejos:', error);
            return res.status(500).json({ erro: 'Erro interno ao remover da lista de desejos' });
        }
    }
}

import { Request, Response } from 'express';
import { conquistas } from '../models-auto/conquistas';
import { usuario_conquistas } from '../models-auto/usuario_conquistas';
import { usuarios } from '../models-auto/usuarios';

export class AdminConquistasController {
    async listarTodas(req: Request, res: Response): Promise<Response> {
        try {
            const lista = await conquistas.findAll({ order: [['id_conquista', 'ASC']] });
            return res.json({ conquistas: lista });
        } catch (error) {
            console.error('Erro ao listar conquistas (admin):', error);
            return res.status(500).json({ erro: 'Erro interno ao listar conquistas' });
        }
    }

    async criar(req: Request, res: Response): Promise<Response> {
        try {
            const { nome, descricao, icone, criterio } = req.body;
            if (!nome || !criterio) {
                return res.status(400).json({ erro: 'Nome e critério são obrigatórios' });
            }

            const conquista = await conquistas.create({ nome, descricao, icone, criterio });
            return res.status(201).json({ mensagem: 'Conquista criada com sucesso', conquista });
        } catch (error) {
            console.error('Erro ao criar conquista:', error);
            return res.status(500).json({ erro: 'Erro interno ao criar conquista' });
        }
    }

    async editar(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const conquista = await conquistas.findByPk(id);
            if (!conquista) {
                return res.status(404).json({ erro: 'Conquista não encontrada' });
            }

            const { nome, descricao, icone, criterio } = req.body;
            if (nome !== undefined) conquista.nome = nome;
            if (descricao !== undefined) conquista.descricao = descricao;
            if (icone !== undefined) conquista.icone = icone;
            if (criterio !== undefined) conquista.criterio = criterio;
            await conquista.save();

            return res.json({ mensagem: 'Conquista atualizada com sucesso', conquista });
        } catch (error) {
            console.error('Erro ao editar conquista:', error);
            return res.status(500).json({ erro: 'Erro interno ao editar conquista' });
        }
    }

    async apagar(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const conquista = await conquistas.findByPk(id);
            if (!conquista) {
                return res.status(404).json({ erro: 'Conquista não encontrada' });
            }

            await usuario_conquistas.destroy({ where: { id_conquista: id } });
            await conquista.destroy();

            return res.json({ mensagem: 'Conquista removida com sucesso' });
        } catch (error) {
            console.error('Erro ao apagar conquista:', error);
            return res.status(500).json({ erro: 'Erro interno ao apagar conquista' });
        }
    }

    async conceder(req: Request, res: Response): Promise<Response> {
        try {
            const idConquista = Number(req.params.id);
            const idUsuario = Number(req.body.id_usuario);
            if (!idUsuario) {
                return res.status(400).json({ erro: 'id_usuario é obrigatório' });
            }

            const [conquista, usuario] = await Promise.all([
                conquistas.findByPk(idConquista),
                usuarios.findByPk(idUsuario)
            ]);
            if (!conquista) {
                return res.status(404).json({ erro: 'Conquista não encontrada' });
            }
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            const jaPossui = await usuario_conquistas.findOne({
                where: { id_usuario: idUsuario, id_conquista: idConquista }
            });
            if (jaPossui) {
                return res.status(409).json({ erro: 'Usuário já possui esta conquista' });
            }

            await usuario_conquistas.create({
                id_usuario: idUsuario,
                id_conquista: idConquista,
                data_conquista: new Date().toISOString().slice(0, 10)
            });

            return res.status(201).json({ mensagem: 'Conquista concedida com sucesso' });
        } catch (error) {
            console.error('Erro ao conceder conquista:', error);
            return res.status(500).json({ erro: 'Erro interno ao conceder conquista' });
        }
    }
}

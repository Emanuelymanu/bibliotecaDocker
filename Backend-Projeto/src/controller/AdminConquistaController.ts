import { Request, Response } from 'express'
import { conquistas } from '../models-auto/conquistas'
import { usuarios } from '../models-auto/usuarios'
import { usuario_conquistas } from '../models-auto/usuario_conquistas'

export class AdminConquistaController {

    async listarConquistas(req: Request, res: Response): Promise<Response> {
        try {
            const lista = await conquistas.findAll({
                order: [[
                    'id_conquista', 'ASC'
                ]]
            })
            return res.json({ conquistas: lista })
        } catch (error) {
            console.error('Erro ao listar conquistas', error)
            return res.status(500).json({
                erro: 'Erro interno ao listar conquistas'
            })
        }
    }

    async criarConquista(req: Request, res: Response): Promise<Response> {
        try {
            const { nome, descricao, icone, criterio } = req.body;
            if (!nome || !criterio) {
                return res.status(400).json({
                    erro: 'Nome e critério são obrigatórios'
                })
            }
            const novaConquista = await conquistas.create({
                nome,
                descricao,
                icone,
                criterio
            })
            return res.status(201).json({
                mensagem: 'Conquista criada com sucesso', novaConquista
            })
        } catch (error) {
            console.error('Erro ao criar conquista', error)
            return res.status(500).json({
                erro: "Erro interno ao criar conquista"
            })
        }
    }

    async editarConquista(req: Request, res: Response): Promise<Response>{
        try{
            const id = Number(req.params.id);
            const conquista = await conquistas.findByPk(id)
            if(!conquista){
                return res.status(404).json({
                    erro: "Conquista não encontrada"
                })
            }

            const {nome, descricao, icone, criterio} = req.body
              if (nome !== undefined) conquista.nome = nome;
            if (descricao !== undefined) conquista.descricao = descricao;
            if (icone !== undefined) conquista.icone = icone;
            if (criterio !== undefined) conquista.criterio = criterio;
            await conquista.save();
 
            return res.json({ 
                mensagem: 'Conquista atualizada com sucesso', conquista 
            });
        }catch(error){
            console.error('Erro ao editar conquista', error)
            return res.status(500).json({
                erro: "Erro interno ao editar conquista"
            })
        }
    }

      async deletar(req: Request, res: Response): Promise<Response> {
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
            console.error('Erro ao deletar conquista:', error);
            return res.status(500).json({ erro: 'Erro interno ao deletar conquista' });
        }
    }

    async concederManualmente(req: Request, res: Response): Promise<Response> {
        try {
            const idConquista = Number(req.params.id);
            const { id_usuario } = req.body;
 
            if (!id_usuario) {
                return res.status(400).json({ erro: 'id_usuario é obrigatório' });
            }
 
            const [conquista, usuario] = await Promise.all([
                conquistas.findByPk(idConquista),
                usuarios.findByPk(id_usuario)
            ]);
            if (!conquista) {
                return res.status(404).json({ erro: 'Conquista não encontrada' });
            }
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
 
            const [registro, criado] = await usuario_conquistas.findOrCreate({
                where: { id_usuario, id_conquista: idConquista },
                defaults: {
                    id_usuario,
                    id_conquista: idConquista,
                    data_conquista: new Date().toISOString().split('T')[0]
                }
            });
 
            if (!criado) {
                return res.status(409).json({ erro: 'Este usuário já possui essa conquista' });
            }
 
            return res.status(201).json({ mensagem: `Conquista "${conquista.nome}" concedida a ${usuario.nome}`, registro });
        } catch (error) {
            console.error('Erro ao conceder conquista manualmente:', error);
            return res.status(500).json({ erro: 'Erro interno ao conceder conquista' });
        }
    }
}
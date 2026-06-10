import { Request, Response } from 'express';
import { anotacoes } from '../models-auto/anotacoes';
import { leituras } from '../models-auto/leituras';
import { AtualizarAnotacaoDTO } from '../types/anotacoesTypes';
import { Op } from 'sequelize';

export class AtualizarAnotacao {
    async atualizarAnotacao(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = req.usuario.id;

            const id = Number(req.params.id);

            const { pagina, titulo, conteudo } = req.body;

            if (isNaN(id)) {
                return res.status(400).json({
                    erro: 'ID inválido'
                })
            }

            const anotacao = await anotacoes.findOne({
                where: {
                    id_anotacao: id
                },
                include: [{
                    model: leituras,
                    as: 'id_leitura_leitura',
                    where: { id_usuario: usuarioId }
                }]
            })

            if (!anotacao) {
                return res.status(404).json({
                    erro: 'Anotação não encontrada'
                })
            }

            const dadosAtualizados: AtualizarAnotacaoDTO = {};
            if (pagina !== undefined) dadosAtualizados.pagina = pagina;
            if (titulo !== undefined) dadosAtualizados.titulo = titulo;
            if (conteudo !== undefined) dadosAtualizados.conteudo = conteudo;

            await anotacao.update(dadosAtualizados);

            return res.json({
                mensagem: 'Anotação atualizada com sucesso',
                anotacao
            })
        } catch (error) {
            console.error('Erro ao atualizar anotação:', error);
            return res.status(500).json({
                erro: 'Erro interno ao atualizar anotações'
            })
        }
    }
}
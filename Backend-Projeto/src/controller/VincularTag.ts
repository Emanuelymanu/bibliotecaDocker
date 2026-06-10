import { Request, Response } from "express";
import { tags } from "../models-auto/tags";
import { leitura_tags } from "../models-auto/leitura_tags";
import { leituras } from "../models-auto/leituras";
import { Op } from "sequelize";

export class VincularTag {
    async vincularTagLeitura(req: Request<{ id_tag: string; id_leitura: string }>, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }

            const id_tag = Number(req.params.id_tag);
            const id_leitura = Number(req.params.id_leitura);

            if (isNaN(id_tag) || isNaN(id_leitura)) {
                return res.status(400).json({ erro: 'IDs inválidos' });
            }

            const tag = await tags.findOne({
                where: {
                    id_tag,
                    id_usuario: req.usuario.id
                }
            });

            if (!tag) {
                return res.status(404).json({
                    erro: "Tag não encontrada"
                })
            }

            const leitura = await leituras.findOne({
                where: {
                    id_leitura,
                    id_usuario: req.usuario.id
                }
            });

            if (!leitura) {
                return res.status(404).json({
                    erro: "Leitura não encontrada"
                })
            }

            const vinculoExiste = await leitura_tags.findOne({
                where: {
                    id_tag,
                    id_leitura
                }
            });

            if (vinculoExiste) {
                return res.status(400).json({
                    erro: "Essa tag já está vinculada a esta leitura"
                })
            }

            await leitura_tags.create({
                id_tag,
                id_leitura
            });

            return res.status(201).json({
                mensagem: 'Tag vinculada à leitura com sucesso'
            });
        } catch (error) {
            console.error('Erro ao vincular tag:', error);
            return res.status(500).json({ erro: 'Erro interno ao vincular tag' });
        }
    }

    async removerTagLeitura( req: Request<{ id_tag: string; id_leitura: string }>,res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }

            const id_tag = Number(req.params.id_tag);
            const id_leitura = Number(req.params.id_leitura);

            if (isNaN(id_tag) || isNaN(id_leitura)) {
                return res.status(400).json({ erro: 'IDs inválidos' });
            }

            const vinculo = await leitura_tags.findOne({
                where: {
                    id_tag,
                    id_leitura
                },
                include: [{
                    model: tags,
                    as: 'id_tag_tag',
                    where: { id_usuario: req.usuario.id }
                }]
            });

            if (!vinculo) {
                return res.status(404).json({
                    erro: 'Vínculo não encontrado'
                });
            }

            await vinculo.destroy();

            return res.json({
                mensagem: 'Tag removida da leitura com sucesso'
            });

        } catch (error) {
            console.error('Erro ao remover tag:', error);
            return res.status(500).json({ erro: 'Erro interno ao remover tag' });
        }
    }
}
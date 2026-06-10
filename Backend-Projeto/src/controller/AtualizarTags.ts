import { Request, Response } from "express";
import { tags } from "../models-auto/tags";
import { leitura_tags } from "../models-auto/leitura_tags";
import { leituras } from "../models-auto/leituras";
import { Op } from "sequelize";
import { AtualizarTagDTO, TagResponse } from "../types/tagTypes";

export class AtualizarTags {
    async atializarTag(req: Request<{ id: string }, {}, AtualizarTagDTO>, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                })
            }

            const id = Number(req.params.id);
            const { nome, cor } = req.body;

            if (isNaN(id)) {
                return res.status(400).json({
                    erro: "ID inválido"
                })
            }

            const tag = await tags.findOne({
                where: {
                    id_tag: id,
                    id_usuario: req.usuario.id
                }
            });

            if (!tag) {
                return res.status(404).json({
                    erro: "Tag não encontrada"
                })
            }

            if (nome !== undefined) {
                if (nome.length < 2 || nome.length > 20) {
                    return res.status(400).json({
                        erro: "Nome da tag deve ter entre 2 e 20 caracteres"
                    })
                }
            }

            if (nome !== tag.nome) {
                const tagExiste = await tags.findOne({
                    where: {
                        id_usuario: req.usuario.id,
                        nome: nome.trim(),
                        id_tag: { [Op.ne]: id }
                    }
                });

                if (tagExiste) {
                    return res.status(400).json({
                        erro: "Você já possui uma tag com esse nome"
                    })
                }
            }

            if (cor && !/^#[0-9A-F]{6}$/i.test(cor)) {
                return res.status(400).json({
                    erro: "Cor deve estar no formato hexadecimal (#RRGGBB)"
                })
            }

            const dadosAtualizados: AtualizarTagDTO = {
                ...(nome !== undefined && { nome: nome.trim() }),
                ...(cor !== undefined && { cor })
            }

            await tag.update(dadosAtualizados);

            const response: TagResponse = {
                id_tag: tag.id_tag,
                nome: tag.nome,
                cor: tag.cor || "#808080"
            }

            return res.json({
                mensagem: "Tag atualizada com sucesso",
                tag: response
            })


        } catch (error) {
            console.error("Erro ao atualizar tag:", error);
            return res.status(500).json({ erro: 'Erro interno ao atualizar tag' });
        }
    }
}
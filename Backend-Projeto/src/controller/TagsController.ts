import { Request, Response } from "express";
import { tags } from "../models-auto/tags";
import { leitura_tags } from "../models-auto/leitura_tags";
import { leituras } from "../models-auto/leituras";
import { Op } from "sequelize";

import { Tag, CriarTagDTO, TagResponse, ListarTagQuery } from "../types/tagTypes";

export class TagsController {
    async criarTag(req: Request<{}, {}, CriarTagDTO>, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    erro: 'Usuário não autenticado'
                })
            }

            const { nome, cor } = req.body;

            if (!nome) {
                return res.status(400).json({
                    erro: 'O nome da tag é obrigatório'
                })
            }

            if (nome.length < 2 || nome.length > 20) {
                return res.status(400).json({
                    erro: 'O nome da tag deve ter entre 2 e 20 caracteres'
                })
            }

            if (cor && !/^#[0-9A-F]{6}$/i.test(cor)) {
                return res.status(400).json({
                    erro: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
                })
            }

            const tagExiste = await tags.findOne({
                where: {
                    id_usuario: req.usuario.id,
                    nome: nome.trim()
                }
            });

            if (tagExiste) {
                return res.status(400).json({
                    erro: 'Você já possui uma tag com esse nome'
                })
            }

            const tag = await tags.create({
                id_usuario: req.usuario.id,
                nome: nome.trim(),
                cor: cor || '#a69a9a'
            });

            const response: TagResponse = {
                id_tag: tag.id_tag,
                nome: tag.nome,
                cor: tag.cor || '#a69a9a'
            };

            return res.status(201).json({
                mensagem: 'Tag criada com sucesso',
                tag: response
            })
        } catch (error) {
            console.error('Erro ao criar tag:', error)
            return res.status(500).json({
                erro: 'Erro interno ao criar tag'
            })
        }
    }


    async deletarTag(req: Request<{ id: string }>, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }

            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ erro: 'ID inválido' });
            }

            const tag = await tags.findOne({
                where: {
                    id_tag: id,
                    id_usuario: req.usuario.id
                },
                include: [{
                    model: leitura_tags,
                    as: 'leitura_tags'
                }]
            });

            if (!tag) {
                return res.status(404).json({ erro: 'Tag não encontrada' });
            }

            if (tag.leitura_tags && tag.leitura_tags.length > 0) {
                return res.status(400).json({
                    erro: 'Não é possível deletar uma tag vinculada a leituras',
                    total_vinculos: tag.leitura_tags.length
                });
            }

            await tag.destroy();

            return res.json({
                mensagem: 'Tag deletada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao deletar tag: ', error);
            return res.status(500).json({
                erro: 'Erro interno ao deletar tag'
            })
        }
    }


    async listarTags(req: Request<{}, {}, {}, ListarTagQuery>, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                })
            }

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const buscar = req.query.buscar;

           
            const offset = (page - 1) * limit

            const where: any = { id_usuario: req.usuario.id };
            if (buscar) {
                where.nome = { [Op.like]: `%${buscar}%` }
            }

            const { count, rows } = await tags.findAndCountAll({
                where,
                limit: Number(limit),
                offset,
                order: [["nome", "ASC"]],
                include: [{
                    model: leitura_tags,
                    as: "leitura_tags",
                    required: false
                }]
            });

            const tagsResponse: TagResponse[] = rows.map(tag => ({
                id_tag: tag.id_tag,
                nome: tag.nome,
                cor: tag.cor || "#808080",
                total_leituras: tag.leitura_tags?.length || 0
            }));

            return res.json({
                total: count,
                pagina: Number(page),
                totalPaginas: Math.ceil(count / Number(limit)),
                tags: tagsResponse
            })
        } catch (error) {
            console.error("Erro ao listar tags:", error);
            return res.status(500).json({
                erro: "Erro interno ao listar tags"
            })
        }
    }
}
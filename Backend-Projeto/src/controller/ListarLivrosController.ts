import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { Op, Sequelize } from 'sequelize';
import { ListarLivrosQuery, LivroResponse } from '../types/livroTypes';
import { fetchFromGoogle } from '../services/googleBooksService';

export class ListarLivrosController {
    async listarLivros(req: Request<{}, {}, {}, ListarLivrosQuery>, res: Response): Promise<Response> {
        try {


            const {
                page = 1,
                limit = 100,
                busca,
                genero,
                editora,
                tipo_obra,
                nome_serie,
                avaliacao_min,
                avaliacao_max,
                ordenar_por = 'titulo',
                ordem = 'ASC'
            } = req.query;


            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) {
                return res.status(400).json({
                    erro: 'Página inválida. Deve ser um número maior que 0.'
                });
            }

            if (isNaN(limite) || limite < 1 || limite > 100) {
                return res.status(400).json({
                    erro: 'Limite inválido. Deve ser entre 1 e 100.'
                });
            }

            const offset = (pagina - 1) * limite;


            const camposOrdenacao: string[] = ['titulo', 'autor', 'ano_publicacao', 'num_paginas', 'created_at'];
            if (!camposOrdenacao.includes(ordenar_por)) {
                return res.status(400).json({
                    erro: `Campo de ordenação inválido. Use: ${camposOrdenacao.join(', ')}`
                });
            }

            const direcao = ordem === 'DESC' ? 'DESC' : 'ASC';


            const where: any = {};


            if (busca) {
                where[Op.or] = [
                    { titulo: { [Op.like]: `%${busca}%` } },
                    { autor: { [Op.like]: `%${busca}%` } },
                    { nome_serie: { [Op.like]: `%${busca}%` } },
                    { subtitulo: { [Op.like]: `%${busca}%` } }
                ];
            }


            if (genero) {
                where.genero = { [Op.like]: `%${genero}%` };
            }


            if (editora) {
                where.editora = { [Op.like]: `%${editora}%` };
            }


            if (tipo_obra) {
                const tiposValidos = ['unico', 'trilogia', 'serie', 'colecao'];
                if (!tiposValidos.includes(tipo_obra as string)) {
                    return res.status(400).json({
                        erro: 'Tipo de obra inválido. Valores: unico, trilogia, serie, colecao'
                    });
                }
                where.tipo_obra = tipo_obra;
            }


            if (nome_serie) {
                where.nome_serie = { [Op.like]: `%${nome_serie}%` };
            }


            let avaliacaoWhere = {};
            if (avaliacao_min || avaliacao_max) {
                const min = avaliacao_min ? Number(avaliacao_min) : 0;
                const max = avaliacao_max ? Number(avaliacao_max) : 5;

                if (min < 0 || min > 5 || max < 0 || max > 5 || min > max) {
                    return res.status(400).json({
                        erro: 'Avaliação deve estar entre 0 e 5, e min não pode ser maior que max'
                    });
                }

                avaliacaoWhere = {
                    avaliacao: {
                        [Op.between]: [min, max]
                    }
                };
            }



            const usuarioId = (req as any).usuario?.id;


            let leiturasInclude: any = {
                model: leituras,
                as: 'leituras',
                attributes: ['id_leitura', 'id_usuario', 'id_livro', 'status', 'data_inicio', 'data_conclusao', 'avaliacao', 'resenha', 'pagina_atual', 'vezes_lido'],
                required: false
            };
            if (usuarioId) {
                leiturasInclude.where = { id_usuario: usuarioId };
            }
            if (avaliacao_min || avaliacao_max) {
                leiturasInclude.where = { ...(leiturasInclude.where || {}), ...avaliacaoWhere };
                leiturasInclude.required = true;
            }


            const { count, rows } = await livros.findAndCountAll({
                where,
                limit: limite,
                offset,
                order: [[ordenar_por, direcao]],
                attributes: { exclude: ['created_at', 'updated_at'] },
                include: [leiturasInclude]
            });

            let livrosResponse = await Promise.all(rows.map(async (livro) => {
                const avaliacaoObj = await leituras.findOne({
                    where: {
                        id_livro: livro.id_livro,
                        avaliacao: { [Op.not]: null }
                    },
                    attributes: [[Sequelize.fn('AVG', Sequelize.col('avaliacao')), 'media']],
                    raw: true
                });
                const mediaAvaliacao = avaliacaoObj?.media
                    ? Number(avaliacaoObj.media).toFixed(1)
                    : null;
                const livroData = livro.get({ plain: true });
                return {
                    ...livroData,
                    avaliacao_media: mediaAvaliacao
                };
            }));

            // Se não houver resultados locais e houver busca, tenta buscar na Google Books API
            if (livrosResponse.length === 0 && busca) {
                try {
                    const items = await fetchFromGoogle(busca);
                    if (items && items.length > 0) {
                        livrosResponse = items.map((item: any) => {
                            const info = item.volumeInfo;
                            return {
                                id_livro: null,
                                id_google: item.id,
                                titulo: info.title,
                                subtitulo: info.subtitle || null,
                                autor: info.authors ? info.authors.join(', ') : '',
                                tipo_obra: 'unico',
                                nome_serie: null,
                                volume: null,
                                total_volumes: null,
                                ano_publicacao: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : null,
                                num_paginas: info.pageCount || 0,
                                editora: info.publisher || null,
                                genero: info.categories ? info.categories.join(', ') : null,
                                capa: info.imageLinks?.thumbnail || null,
                                avaliacao_media: info.averageRating || null
                            };
                        });
                    }
                } catch (err) {
                    console.error('Erro ao buscar na Google Books API:', err);
                }
            }

            return res.json({
                total: count,
                pagina,
                limite,
                totalPaginas: Math.ceil(count / limite),
                filtros_aplicados: {
                    busca: busca || null,
                    genero: genero || null,
                    editora: editora || null,
                    tipo_obra: tipo_obra || null,
                    avaliacao: avaliacao_min || avaliacao_max ? `${avaliacao_min || 0} - ${avaliacao_max || 5}` : null
                },
                ordenacao: {
                    campo: ordenar_por,
                    direcao
                },
                livros: livrosResponse
            });

        } catch (error) {
            console.error('Erro ao listar livros:', error);
            return res.status(500).json({
                erro: 'Erro interno ao listar livros'
            });
        }
    }

    async listarTopAvaliados(req: Request, res: Response): Promise<Response> {
        try {

            const livrosList = await livros.findAll({
                attributes: [
                    'id_livro', 'titulo', 'subtitulo', 'autor', 'tipo_obra', 'nome_serie', 'ano_publicacao', 'num_paginas', 'editora', 'genero', 'capa',
                ]
            });


            const livrosComMediaArray = await Promise.all(livrosList.map(async (livro) => {
                const avaliacaoObj = await leituras.findOne({
                    where: {
                        id_livro: livro.id_livro,
                        avaliacao: { [Op.not]: null }
                    },
                    attributes: [[Sequelize.fn('AVG', Sequelize.col('avaliacao')), 'media']],
                    raw: true
                });
                return {
                    ...livro.get(),
                    avaliacao_media: avaliacaoObj?.media ? Number(avaliacaoObj.media).toFixed(1) : null
                };
            }));


            const top5 = livrosComMediaArray
                .sort((a, b) => (Number(b.avaliacao_media) || 0) - (Number(a.avaliacao_media) || 0))
                .slice(0, 5);

            return res.json({ livros: top5 });
        } catch (error) {
            console.error('Erro ao listar top avaliados:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar top avaliados' });
        }
    }



}
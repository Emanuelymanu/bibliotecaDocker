import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { Op, Sequelize } from 'sequelize';
import { ListarLivrosQuery, LivroResponse } from '../types/livroTypes';
import { fetchFromGoogle } from '../services/googleBooksService';

export class FiltroLivros {
    async obterOpcoesFiltro(req: Request<{}, {}, {}, ListarLivrosQuery>, res: Response): Promise<Response> {
        try {

            const generos = await livros.findAll({
                attributes: ['genero'],
                where: {
                    genero: { [Op.not]: null }
                },
                group: ['genero'],
                order: [['genero', 'ASC']]
            });

            const editoras = await livros.findAll({
                attributes: ['editora'],
                where: {
                    editora: { [Op.not]: null }
                },
                group: ['editora'],
                order: [['editora', 'ASC']]
            });


            const autores = await livros.findAll({
                attributes: ['autor'],
                where: {
                    autor: { [Op.not]: null }
                },
                group: ['autor'],
                order: [['autor', 'ASC']],
                limit: 50
            });

            return res.json({
                generos: generos.map(g => g.genero).filter(Boolean),
                editoras: editoras.map(e => e.editora).filter(Boolean),
                autores: autores.map(a => a.autor).filter(Boolean),
                tipos_obra: ['unico', 'trilogia', 'serie', 'colecao'],
                avaliacoes: {
                    min: 0,
                    max: 5,
                    step: 0.5
                },
                ordenacao: {
                    campos: ['titulo', 'autor', 'ano_publicacao', 'num_paginas'],
                    direcoes: ['ASC', 'DESC']
                }
            });

        } catch (error) {
            console.error('Erro ao obter opções:', error);
            return res.status(500).json({
                erro: 'Erro interno ao carregar opções'
            });
        }
    }
    async buscarPorStatusLeitura(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }

            const usuarioId = req.usuario.id;
            const { status, page = 1, limit = 10 } = req.query;
            const pagina = Number(page);
            const limite = Number(limit);
            const offset = (pagina - 1) * limite;

            const statusValidos = ['quero_ler', 'lendo', 'lido', 'abandonado', 'relendo'];
            if (status && !statusValidos.includes(status as string)) {
                return res.status(400).json({ erro: 'Status inválido' });
            }

            const { count, rows } = await livros.findAndCountAll({
                include: [{
                    model: leituras,
                    as: 'leituras',
                    where: {
                        id_usuario: usuarioId,
                        ...(status && { status })
                    },
                    required: true,
                    attributes: ['status', 'avaliacao', 'pagina_atual', 'data_inicio', 'data_conclusao']
                }],
                limit: limite,
                offset,
                order: [['titulo', 'ASC']]
            });

            return res.json({
                total: count,
                pagina,
                totalPaginas: Math.ceil(count / limite),
                status_filtrado: status || 'todos',
                livros: rows
            });

        } catch (error) {
            console.error('Erro ao buscar por status:', error);
            return res.status(500).json({
                erro: 'Erro interno ao buscar livros'
            });
        }
    }

    async buscarPorGenero(req: Request, res: Response): Promise<Response> {
        try {
            let { genero } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) {
                return res.status(400).json({ erro: 'Página inválida' });
            }
            if (isNaN(limite) || limite < 1 || limite > 100) {
                return res.status(400).json({ erro: 'Limite inválido' });
            }

            const offset = (pagina - 1) * limite;

            const { count, rows } = await livros.findAndCountAll({
                where: {
                    genero: { [Op.like]: `%${genero}%` }
                },
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] }
            });

            let livrosResponse = rows;
            
            if (livrosResponse.length === 0) {
                try {
                    if (Array.isArray(genero)) genero = genero[0];
                    const items = await fetchFromGoogle(genero);
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
                                capa: info.imageLinks?.thumbnail || null
                            };
                        });
                    }
                } catch (err) {
                    console.error('Erro ao buscar na Google Books API:', err);
                }
            }

            return res.json({
                genero,
                total: count,
                pagina,
                totalPaginas: Math.ceil(count / limite),
                livros: livrosResponse
            });

        } catch (error) {
            console.error('Erro ao buscar por gênero:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar livros' });
        }
    }

    async buscarPorAutor(req: Request, res: Response): Promise<Response> {
        try {
            let { autor } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) {
                return res.status(400).json({ erro: 'Página inválida' });
            }
            if (isNaN(limite) || limite < 1 || limite > 100) {
                return res.status(400).json({ erro: 'Limite inválido' });
            }

            const offset = (pagina - 1) * limite;

            const { count, rows } = await livros.findAndCountAll({
                where: {
                    autor: { [Op.like]: `%${autor}%` }
                },
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] }
            });

            let livrosResponse = rows;
            // Se não houver resultados locais, busca na Google Books API
            if (livrosResponse.length === 0) {
                try {
                    if (Array.isArray(autor)) autor = autor[0];
                    const items = await fetchFromGoogle(autor);
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
                                capa: info.imageLinks?.thumbnail || null
                            };
                        });
                    }
                } catch (err) {
                    console.error('Erro ao buscar na Google Books API:', err);
                }
            }

            return res.json({
                autor,
                total: count,
                pagina,
                totalPaginas: Math.ceil(count / limite),
                livros: livrosResponse
            });

        } catch (error) {
            console.error('Erro ao buscar por autor:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar livros' });
        }

    }

    async buscarSerie(req: Request, res: Response): Promise<Response> {
        try {
            const { nome_serie } = req.params;

            const livrosDaSerie = await livros.findAll({
                where: {
                    nome_serie: nome_serie
                },
                order: [['nome_serie', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] }
            });

            if (livrosDaSerie.length === 0) {
                return res.status(404).json({ erro: 'Série não encontrada' });
            }

            const tipo = livrosDaSerie[0]?.tipo_obra || 'serie';
            return res.json({
                nome_serie,
                tipo,
                livros: livrosDaSerie
            });

        } catch (error) {
            console.error('Erro ao buscar série:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar série' });
        }
    }

}
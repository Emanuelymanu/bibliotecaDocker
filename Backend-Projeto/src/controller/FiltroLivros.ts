import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { generos } from '../models-auto/generos';
import { editoras } from '../models-auto/editoras';
import { autores } from '../models-auto/autores';
import { Op, Sequelize } from 'sequelize';
import { ListarLivrosQuery, LivroResponse } from '../types/livroTypes';
import { fetchFromGoogle } from '../services/googleBooksService';

export class FiltroLivros {
    async obterOpcoesFiltro(req: Request<{}, {}, {}, ListarLivrosQuery>, res: Response): Promise<Response> {
        try {

            const listaGeneros = await generos.findAll({
                attributes: ['nome'],
                where: {
                    nome: { [Op.not]: null }
                },
                order: [['nome', 'ASC']]
            });

            const listaEditoras = await editoras.findAll({
                attributes: ['nome'],
                where: {
                    nome: { [Op.not]: null }
                },
                order: [['nome', 'ASC']]
            });


            const listaAutores = await autores.findAll({
                attributes: ['nome'],
                where: {
                    nome: { [Op.not]: null }
                },
                order: [['nome', 'ASC']],
                limit: 50
            });

            return res.json({
                generos: listaGeneros.map(g => g.nome).filter(Boolean),
                editoras: listaEditoras.map(e => e.nome).filter(Boolean),
                autores: listaAutores.map(a => a.nome).filter(Boolean),
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
                include: [{
                    model: generos,
                    as: 'generos',
                    attributes: ['nome'],
                    through: { attributes: [] },
                    where: {
                        nome: { [Op.like]: `%${genero}%` }
                    },
                    required: true
                }],
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] },
                distinct: true
            });

            let livrosResponse: any[] = rows.map((livro) => livro.get({ plain: true }));

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
                include: [{
                    model: autores,
                    as: 'autores',
                    attributes: ['nome'],
                    through: { attributes: [] },
                    where: {
                        nome: { [Op.like]: `%${autor}%` }
                    },
                    required: true
                }],
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] },
                distinct: true
            });

            let livrosResponse: any[] = rows.map((livro) => livro.get({ plain: true }));
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
                    tipo_obra: 'serie',
                    [Op.or]: [
                        { titulo: { [Op.like]: `%${nome_serie}%` } },
                        { subtitulo: { [Op.like]: `%${nome_serie}%` } }
                    ]
                },
                order: [['titulo', 'ASC']],
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
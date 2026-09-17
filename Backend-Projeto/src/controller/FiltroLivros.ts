import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { autores } from '../models-auto/autores';
import { editoras } from '../models-auto/editoras';
import { generos } from '../models-auto/generos';
import { Op } from 'sequelize';
import { fetchFromGoogle } from '../services/googleBooksService';

function formatarLivro(livro: any) {
    const dados = livro.get ? livro.get({ plain: true }) : livro;
    return {
        ...dados,
        autores: (dados.autores || []).map((a: any) => a.nome),
        generos: (dados.generos || []).map((g: any) => g.nome),
        editora: dados.editora?.nome ?? null
    };
}

function formatarItemGoogle(item: any) {
    const info = item.volumeInfo;
    return {
        id_livro: null,
        id_google: item.id,
        titulo: info.title,
        subtitulo: info.subtitle || null,
        autores: info.authors || [],
        tipo_obra: 'unico',
        ano_publicacao: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : null,
        num_paginas: info.pageCount || 0,
        editora: info.publisher || null,
        generos: info.categories ? info.categories.flatMap((c: string) => c.split('/').map((s) => s.trim())) : [],
        capa: info.imageLinks?.thumbnail || null
    };
}

export class FiltroLivros {
    async obterOpcoesFiltro(req: Request, res: Response): Promise<Response> {
        try {
            const [listaGeneros, listaEditoras, listaAutores] = await Promise.all([
                generos.findAll({ attributes: ['nome'], order: [['nome', 'ASC']] }),
                editoras.findAll({ attributes: ['nome'], order: [['nome', 'ASC']] }),
                autores.findAll({ attributes: ['nome'], order: [['nome', 'ASC']], limit: 50 })
            ]);

            return res.json({
                generos: listaGeneros.map(g => g.nome),
                editoras: listaEditoras.map(e => e.nome),
                autores: listaAutores.map(a => a.nome),
                tipos_obra: ['unico', 'trilogia', 'serie', 'colecao'],
                avaliacoes: { min: 0, max: 5, step: 0.5 },
                ordenacao: {
                    campos: ['titulo', 'ano_publicacao', 'num_paginas'],
                    direcoes: ['ASC', 'DESC']
                }
            });
        } catch (error) {
            console.error('Erro ao obter opções:', error);
            return res.status(500).json({ erro: 'Erro interno ao carregar opções' });
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
                    where: { id_usuario: usuarioId, ...(status && { status }) },
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
            return res.status(500).json({ erro: 'Erro interno ao buscar livros' });
        }
    }

    async buscarPorGenero(req: Request, res: Response): Promise<Response> {
        try {
            let { genero } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) return res.status(400).json({ erro: 'Página inválida' });
            if (isNaN(limite) || limite < 1 || limite > 100) return res.status(400).json({ erro: 'Limite inválido' });

            const offset = (pagina - 1) * limite;

            const { count, rows } = await livros.findAndCountAll({
                include: [
                    { model: generos, as: 'generos', where: { nome: { [Op.like]: `%${genero}%` } }, required: true },
                    { model: autores, as: 'autores', attributes: ['nome'] },
                    { model: editoras, as: 'editora', attributes: ['nome'] }
                ],
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] },
                distinct: true
            });

            const livrosResponse: any[] = rows.map(formatarLivro);

        
            try {
                if (Array.isArray(genero)) genero = genero[0];
                const items = await fetchFromGoogle(`insubject:${genero}`);
                if (items && items.length > 0) {
                    const idsGoogleLocais = new Set(livrosResponse.map((l) => l.id_google));
                    const extras = items
                        .filter((item: any) => !idsGoogleLocais.has(item.id))
                        .map(formatarItemGoogle);
                    livrosResponse.push(...extras);
                }
            } catch (err) {
                console.error('Erro ao buscar na Google Books API:', err);
            }

            return res.json({ genero, total: livrosResponse.length, pagina, totalPaginas: Math.ceil(count / limite), livros: livrosResponse });
        } catch (error) {
            console.error('Erro ao buscar por gênero:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar livros' });
        }
    }

    async buscarPorEditora(req: Request, res: Response): Promise<Response> {
        try {
            let { editora } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) return res.status(400).json({ erro: 'Página inválida' });
            if (isNaN(limite) || limite < 1 || limite > 100) return res.status(400).json({ erro: 'Limite inválido' });

            const offset = (pagina - 1) * limite;

            const { count, rows } = await livros.findAndCountAll({
                include: [
                    { model: editoras, as: 'editora', where: { nome: { [Op.like]: `%${editora}%` } }, required: true },
                    { model: autores, as: 'autores', attributes: ['nome'] },
                    { model: generos, as: 'generos', attributes: ['nome'] }
                ],
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] },
                distinct: true
            });

            const livrosResponse: any[] = rows.map(formatarLivro);

           
            try {
                if (Array.isArray(editora)) editora = editora[0];
                const items = await fetchFromGoogle(`inpublisher:${editora}`);
                if (items && items.length > 0) {
                    const idsGoogleLocais = new Set(livrosResponse.map((l) => l.id_google));
                    const extras = items
                        .filter((item: any) => !idsGoogleLocais.has(item.id))
                        .map(formatarItemGoogle);
                    livrosResponse.push(...extras);
                }
            } catch (err) {
                console.error('Erro ao buscar na Google Books API:', err);
            }

            return res.json({ editora, total: livrosResponse.length, pagina, totalPaginas: Math.ceil(count / limite), livros: livrosResponse });
        } catch (error) {
            console.error('Erro ao buscar por editora:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar livros' });
        }
    }

    async buscarPorAutor(req: Request, res: Response): Promise<Response> {
        try {
            let { autor } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) return res.status(400).json({ erro: 'Página inválida' });
            if (isNaN(limite) || limite < 1 || limite > 100) return res.status(400).json({ erro: 'Limite inválido' });

            const offset = (pagina - 1) * limite;

            const { count, rows } = await livros.findAndCountAll({
                include: [
                    { model: autores, as: 'autores', where: { nome: { [Op.like]: `%${autor}%` } }, required: true },
                    { model: editoras, as: 'editora', attributes: ['nome'] },
                    { model: generos, as: 'generos', attributes: ['nome'] }
                ],
                limit: limite,
                offset,
                order: [['titulo', 'ASC']],
                attributes: { exclude: ['created_at', 'updated_at'] },
                distinct: true
            });

            const livrosResponse: any[] = rows.map(formatarLivro);

          
            try {
                if (Array.isArray(autor)) autor = autor[0];
                const items = await fetchFromGoogle(`inauthor:${autor}`);
                if (items && items.length > 0) {
                    const idsGoogleLocais = new Set(livrosResponse.map((l) => l.id_google));
                    const extras = items
                        .filter((item: any) => !idsGoogleLocais.has(item.id))
                        .map(formatarItemGoogle);
                    livrosResponse.push(...extras);
                }
            } catch (err) {
                console.error('Erro ao buscar na Google Books API:', err);
            }

            return res.json({ autor, total: livrosResponse.length, pagina, totalPaginas: Math.ceil(count / limite), livros: livrosResponse });
        } catch (error) {
            console.error('Erro ao buscar por autor:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar livros' });
        }
    }
}

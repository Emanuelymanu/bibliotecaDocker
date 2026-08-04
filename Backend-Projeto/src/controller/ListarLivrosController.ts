import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { autores } from '../models-auto/autores';
import { editoras } from '../models-auto/editoras';
import { generos } from '../models-auto/generos';
import { Op, Sequelize } from 'sequelize';
import { ListarLivrosQuery } from '../types/livroTypes';
import { fetchFromGoogle } from '../services/googleBooksService';

/** Achata as relações (autores/generos/editora) num formato simples pro frontend consumir. */
function formatarLivro(livro: any) {
    const dados = livro.get ? livro.get({ plain: true }) : livro;
    return {
        ...dados,
        autores: (dados.autores || []).map((a: any) => a.nome),
        generos: (dados.generos || []).map((g: any) => g.nome),
        editora: dados.editora?.nome ?? null
    };
}

/** Monta o resultado "cru" vindo do Google Books, no mesmo formato que formatarLivro devolveria. */
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
        capa: info.imageLinks?.thumbnail || null,
        avaliacao_media: info.averageRating || null
    };
}

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
                autor,
                avaliacao_min,
                avaliacao_max,
                ordenar_por = 'titulo',
                ordem = 'ASC'
            } = req.query;

            const pagina = Number(page);
            const limite = Number(limit);

            if (isNaN(pagina) || pagina < 1) {
                return res.status(400).json({ erro: 'Página inválida. Deve ser um número maior que 0.' });
            }
            if (isNaN(limite) || limite < 1 || limite > 100) {
                return res.status(400).json({ erro: 'Limite inválido. Deve ser entre 1 e 100.' });
            }

            const offset = (pagina - 1) * limite;

            const camposOrdenacao: string[] = ['titulo', 'ano_publicacao', 'num_paginas', 'created_at'];
            if (!camposOrdenacao.includes(ordenar_por)) {
                return res.status(400).json({ erro: `Campo de ordenação inválido. Use: ${camposOrdenacao.join(', ')}` });
            }
            const direcao = ordem === 'DESC' ? 'DESC' : 'ASC';

            const where: any = {};
            if (busca) {
                where[Op.or] = [
                    { titulo: { [Op.like]: `%${busca}%` } },
                    { subtitulo: { [Op.like]: `%${busca}%` } }
                ];
            }
            if (tipo_obra) {
                const tiposValidos = ['unico', 'trilogia', 'serie', 'colecao'];
                if (!tiposValidos.includes(tipo_obra as string)) {
                    return res.status(400).json({ erro: 'Tipo de obra inválido. Valores: unico, trilogia, serie, colecao' });
                }
                where.tipo_obra = tipo_obra;
            }

            let avaliacaoWhere = {};
            if (avaliacao_min || avaliacao_max) {
                const min = avaliacao_min ? Number(avaliacao_min) : 0;
                const max = avaliacao_max ? Number(avaliacao_max) : 5;
                if (min < 0 || min > 5 || max < 0 || max > 5 || min > max) {
                    return res.status(400).json({ erro: 'Avaliação deve estar entre 0 e 5, e min não pode ser maior que max' });
                }
                avaliacaoWhere = { avaliacao: { [Op.between]: [min, max] } };
            }

            const usuarioId = req.usuario?.id;

            const leiturasInclude: any = {
                model: leituras,
                as: 'leituras',
                attributes: ['id_leitura', 'id_usuario', 'id_livro', 'status', 'data_inicio', 'data_conclusao', 'avaliacao', 'resenha', 'pagina_atual', 'vezes_lido'],
                required: false
            };
            if (usuarioId) leiturasInclude.where = { id_usuario: usuarioId };
            if (avaliacao_min || avaliacao_max) {
                leiturasInclude.where = { ...(leiturasInclude.where || {}), ...avaliacaoWhere };
                leiturasInclude.required = true;
            }

            // Autor/gênero/editora agora são relações -> filtra via include, não via where direto em livros
            const autoresInclude: any = { model: autores, as: 'autores', attributes: ['id_autor', 'nome'] };
            if (autor) {
                autoresInclude.where = { nome: { [Op.like]: `%${autor}%` } };
                autoresInclude.required = true;
            }

            const generosInclude: any = { model: generos, as: 'generos', attributes: ['id_genero', 'nome'] };
            if (genero) {
                generosInclude.where = { nome: { [Op.like]: `%${genero}%` } };
                generosInclude.required = true;
            }

            const editorasInclude: any = { model: editoras, as: 'editora', attributes: ['id_editora', 'nome'] };
            if (editora) {
                editorasInclude.where = { nome: { [Op.like]: `%${editora}%` } };
                editorasInclude.required = true;
            }

            const { count, rows } = await livros.findAndCountAll({
                where,
                limit: limite,
                offset,
                order: [[ordenar_por, direcao]],
                attributes: { exclude: ['created_at', 'updated_at'] },
                distinct: true, // evita contagem duplicada por causa dos includes N:N
                include: [leiturasInclude, autoresInclude, generosInclude, editorasInclude]
            });

            let livrosResponse = await Promise.all(rows.map(async (livro) => {
                const avaliacaoObj = await leituras.findOne({
                    where: { id_livro: livro.id_livro, avaliacao: { [Op.not]: null } },
                    attributes: [[Sequelize.fn('AVG', Sequelize.col('avaliacao')), 'media']],
                    raw: true
                });
                const mediaAvaliacao = avaliacaoObj?.media ? Number(avaliacaoObj.media).toFixed(1) : null;
                return { ...formatarLivro(livro), avaliacao_media: mediaAvaliacao };
            }));

            // Se não houver resultados locais e houver busca, tenta buscar na Google Books API
            if (livrosResponse.length === 0 && busca) {
                try {
                    const items = await fetchFromGoogle(busca);
                    if (items && items.length > 0) {
                        livrosResponse = items.map(formatarItemGoogle);
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
                    autor: autor || null,
                    tipo_obra: tipo_obra || null,
                    avaliacao: avaliacao_min || avaliacao_max ? `${avaliacao_min || 0} - ${avaliacao_max || 5}` : null
                },
                ordenacao: { campo: ordenar_por, direcao },
                livros: livrosResponse
            });

        } catch (error) {
            console.error('Erro ao listar livros:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar livros' });
        }
    }

    async listarTopAvaliados(req: Request, res: Response): Promise<Response> {
        try {
            const livrosList = await livros.findAll({
                attributes: ['id_livro', 'titulo', 'subtitulo', 'tipo_obra', 'ano_publicacao', 'num_paginas', 'capa'],
                include: [
                    { model: autores, as: 'autores', attributes: ['nome'] },
                    { model: editoras, as: 'editora', attributes: ['nome'] },
                    { model: generos, as: 'generos', attributes: ['nome'] }
                ]
            });

            const livrosComMediaArray = await Promise.all(livrosList.map(async (livro) => {
                const avaliacaoObj = await leituras.findOne({
                    where: { id_livro: livro.id_livro, avaliacao: { [Op.not]: null } },
                    attributes: [[Sequelize.fn('AVG', Sequelize.col('avaliacao')), 'media']],
                    raw: true
                });
                return {
                    ...formatarLivro(livro),
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

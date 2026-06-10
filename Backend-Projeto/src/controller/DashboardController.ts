import { Request, Response } from 'express';
import { usuarios } from '../models-auto/usuarios';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { Op, Sequelize } from 'sequelize';
import { DashboardEstatisticas, DashboardResponse } from '../types/dashoboardTypes';

export class DashboardController {


    async obterDashboard(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;

            
            const totalUsuarios = await usuarios.count();
            const totalLivros = await livros.count();
            const totalLeituras = await leituras.count({ where: { id_usuario: usuarioId } });
            const livrosLidos = await leituras.count({ where: { id_usuario: usuarioId, status: 'lido' } });
            const livrosLendo = await leituras.count({ where: { id_usuario: usuarioId, status: 'lendo' } });
            const livrosQueroLer = await leituras.count({ where: { id_usuario: usuarioId, status: 'quero_ler' } });
            const leiturasConcluidas = await leituras.findAll({
                where: { id_usuario: usuarioId, status: 'lido' },
                include: [{ model: livros, as: 'id_livro_livro', attributes: ['num_paginas'] }]
            });
            const totalPaginas = leiturasConcluidas.reduce((total, leitura) => {
                return total + (leitura.id_livro_livro?.num_paginas || 0);
            }, 0);
            const estatisticas: DashboardEstatisticas = {
                total_usuarios: totalUsuarios,
                total_livros: totalLivros,
                total_leituras: totalLeituras,
                total_paginas_lidas: totalPaginas,
                livros_lidos: livrosLidos,
                livros_lendo: livrosLendo,
                livros_quero_ler: livrosQueroLer
            };

            
            const generos = await leituras.findAll({
                where: { id_usuario: usuarioId, status: 'lido' },
                include: [{ model: livros, as: 'id_livro_livro', attributes: ['genero'] }],
                attributes: []
            });
            const contagem: { [key: string]: number } = {};
            generos.forEach(leitura => {
                const genero = leitura.id_livro_livro?.genero;
                if (genero) {
                    contagem[genero] = (contagem[genero] || 0) + 1;
                }
            });
            const generosMaisLidos = Object.entries(contagem)
                .map(([genero, quantidade]) => ({ genero, quantidade }))
                .sort((a, b) => b.quantidade - a.quantidade)
                .slice(0, 5);

           
            const ultimosLivros = await leituras.findAll({
                where: { id_usuario: usuarioId, status: 'lido' },
                include: [{ model: livros, as: 'id_livro_livro' }],
                order: [['data_conclusao', 'DESC']],
                limit: 5
            });
            const ultimosLivrosFormatados = ultimosLivros.map(l => l.id_livro_livro);

          
            const avaliacaoObj = await leituras.findOne({
                where: { id_usuario: usuarioId, status: 'lido', avaliacao: { [Op.not]: null } },
                attributes: [[Sequelize.fn('AVG', Sequelize.col('avaliacao')), 'media']],
                raw: true
            });
            const avaliacaoMedia = avaliacaoObj?.media ? Number(avaliacaoObj.media) : 0;

            const dashboard: DashboardResponse = {
                estatisticas,
                ultimos_livros: ultimosLivrosFormatados,
                generos_mais_lidos: generosMaisLidos,
                avaliacao_media: avaliacaoMedia
            };

            return res.json(dashboard);
        } catch (error) {
            console.error('Erro ao obter dashboard:', error);
            return res.status(500).json({ erro: 'Erro interno ao carregar dashboard' });
        }
    }




}
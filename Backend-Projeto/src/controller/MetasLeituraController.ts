import { Request, Response } from 'express';
import { metas_leituras } from '../models-auto/metas_leituras';
import { leituras } from '../models-auto/leituras';
import { livros } from '../models-auto/livros';
import { Op, Sequelize } from 'sequelize';
import { verificarConquistas } from './ConquistasController';

export class MetasLeituraController {


    async criarOuAtualizarMeta(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;
            const { ano, qtd_livros_alvo, qtd_paginas_alvo } = req.body;

            if (!ano || isNaN(Number(ano))) {
                return res.status(400).json({ erro: 'Ano é obrigatório e deve ser um número' });
            }
            if (!qtd_livros_alvo && !qtd_paginas_alvo) {
                return res.status(400).json({ erro: 'Informe ao menos qtd_livros_alvo ou qtd_paginas_alvo' });
            }

            const [meta] = await metas_leituras.findOrCreate({
                where: { id_usuario: usuarioId, ano: Number(ano) },
                defaults: {
                    id_usuario: usuarioId,
                    ano: Number(ano),
                    qtd_livros_alvo: qtd_livros_alvo ?? null,
                    qtd_paginas_alvo: qtd_paginas_alvo ?? null
                }
            });

            if (qtd_livros_alvo !== undefined) meta.qtd_livros_alvo = qtd_livros_alvo;
            if (qtd_paginas_alvo !== undefined) meta.qtd_paginas_alvo = qtd_paginas_alvo;
            await meta.save();

            const novasConquistas = await verificarConquistas(usuarioId);

            return res.status(201).json({ mensagem: 'Meta salva com sucesso', meta, novasConquistas });
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            return res.status(500).json({ erro: 'Erro interno ao salvar meta' });
        }
    }

    
    async buscarMetaPorAno(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;
            const ano = Number(req.params.ano);

            if (isNaN(ano)) {
                return res.status(400).json({ erro: 'Ano inválido' });
            }

            const meta = await metas_leituras.findOne({ where: { id_usuario: usuarioId, ano } });
            if (!meta) {
                return res.status(404).json({ erro: 'Nenhuma meta cadastrada para esse ano' });
            }

            const progresso = await this.calcularProgresso(usuarioId, ano);

            return res.json({ meta, progresso });
        } catch (error) {
            console.error('Erro ao buscar meta:', error);
            return res.status(500).json({ erro: 'Erro interno ao buscar meta' });
        }
    }

   
    async listarMinhasMetas(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;

            const metas = await metas_leituras.findAll({ where: { id_usuario: usuarioId }, order: [['ano', 'DESC']] });

            const metasComProgresso = await Promise.all(
                metas.map(async (meta) => ({
                    meta,
                    progresso: await this.calcularProgresso(usuarioId, meta.ano)
                }))
            );

            return res.json({ metas: metasComProgresso });
        } catch (error) {
            console.error('Erro ao listar metas:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar metas' });
        }
    }

   
    private async calcularProgresso(usuarioId: number, ano: number) {
        const inicioAno = `${ano}-01-01`;
        const fimAno = `${ano}-12-31`;

        const livrosLidosNoAno = await leituras.count({
            where: {
                id_usuario: usuarioId,
                status: 'lido',
                data_conclusao: { [Op.between]: [inicioAno, fimAno] }
            }
        });

        const somaPaginas = await leituras.findAll({
            where: {
                id_usuario: usuarioId,
                status: 'lido',
                data_conclusao: { [Op.between]: [inicioAno, fimAno] }
            },
            include: [{ model: livros, as: 'id_livro_livro', attributes: [] }],
            attributes: [[Sequelize.fn('SUM', Sequelize.col('id_livro_livro.num_paginas')), 'total']],
            raw: true
        }) as any;

        return {
            livros_lidos: livrosLidosNoAno,
            paginas_lidas: Number(somaPaginas?.[0]?.total || 0)
        };
    }
}

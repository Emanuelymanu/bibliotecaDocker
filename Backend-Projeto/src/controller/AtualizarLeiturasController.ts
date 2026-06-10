import { Request, Response } from 'express';
import { leituras } from '../models-auto/leituras';
import { livros } from '../models-auto/livros';
import { AtualizarLeituraDTO, LeituraResponse, StatusLeitura } from '../types/leituraTypes';
import { Op } from 'sequelize';

export class AtualizarLeituraController {
    async atualizarProgresso(req: Request, res: Response): Promise<Response> {
        try {
            const valid = await this.validarAtualizarProgresso(req, res);
            if (valid) return valid;

            const leitura = await this.atualizarLeituraNoBanco(req);
            const resposta = this.montarRespostaLeitura(leitura);

            return res.json({
                mensagem: 'Progresso atualizado com sucesso', leitura: resposta
            });
        } catch (error) {
            console.error('Erro ao atualizar progresso', error);
            return res.status(500).json({
                erro: 'Erro interno ao atualizar progresso'
            });
        }
    }

    private async validarAtualizarProgresso(req: Request, res: Response) {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }

        const usuarioId = req.usuario.id || req.usuario.id_usuario;
        const { id } = req.params as { id: string };
        const idNumero = Number(id);
        const { pagina_atual, status } = req.body as AtualizarLeituraDTO;

        if (isNaN(idNumero)) {
            return res.status(400).json({
                erro: 'ID inválido'
            });
        }

        const leitura = await leituras.findOne({
            where: {
                id_leitura: id, id_usuario: usuarioId
            },
            include: [{
                model: livros,
                as: 'id_livro_livro'
            }]
        });
        if (!leitura) {
            return res.status(404).json({
                erro: 'Leitura não encontrada'
            });
        }
        
        const livro = leitura.id_livro_livro;

        if (pagina_atual !== undefined) {
            // ALTERAÇÃO: Avalia se num_paginas existe no banco local. 
            // Se o Google Books retornou nulo, não aplicamos a validação de limite máximo para não travar o app.
            if (livro && livro.num_paginas !== null && livro.num_paginas !== undefined) {
                const numPaginas = Number(livro.num_paginas);

                if (pagina_atual < 0 || pagina_atual > numPaginas) {
                    return res.status(400).json({
                        erro: `Página atual deve estar entre 0 e ${numPaginas}`
                    });
                }
            } else if (pagina_atual < 0) {
                return res.status(400).json({
                    erro: 'Página atual não pode ser um número negativo'
                });
            }
        }
        
        const statusValidos: StatusLeitura[] = ['nao_lido', 'quero_ler', 'lendo', 'lido', 'abandonado', 'relendo'];
        if (status && !statusValidos.includes(status)) {
            return res.status(400).json({
                erro: 'Status inválido'
            });
        }
        return null;
    }

    private async atualizarLeituraNoBanco(req: Request) {
        const usuarioId = req.usuario.id || req.usuario.id_usuario;
        const { id } = req.params as { id: string };
        const { pagina_atual, status } = req.body as AtualizarLeituraDTO;

        const leitura = await leituras.findOne({
            where: {
                id_leitura: id,
                id_usuario: usuarioId
            },
            include: [{
                model: livros,
                as: 'id_livro_livro'
            }]
        });
        
        const livro = leitura.id_livro_livro;

        if (pagina_atual !== undefined && livro && livro.num_paginas) {
            const numPaginas = Number(livro.num_paginas);

            if (pagina_atual === numPaginas) {
                leitura.status = 'lido';
                leitura.data_conclusao = new Date().toISOString().split('T')[0];
                leitura.vezes_lido = (leitura.vezes_lido || 0) + 1;
            }
        }
        
        if (status === 'lendo' && !leitura.data_inicio) {
            leitura.data_inicio = new Date().toISOString().split('T')[0];
        }
        
        if (status === 'lido' && leitura.status !== 'lido') {
            leitura.data_conclusao = new Date().toISOString().split('T')[0];
            leitura.vezes_lido = (leitura.vezes_lido || 0) + 1;
            
            // ALTERAÇÃO: Só iguala a página atual ao total se o total de páginas for conhecido no banco local
            if (livro && livro.num_paginas) {
                leitura.pagina_atual = livro.num_paginas;
            }
        }
        
        if (pagina_atual !== undefined) leitura.pagina_atual = pagina_atual;
        if (status) leitura.status = status;
        
        await leitura.save();
        return leitura;
    }

    private montarRespostaLeitura(leitura: any): LeituraResponse {
        const livro = leitura.id_livro_livro;
        return {
            id_leitura: leitura.id_leitura,
            id_usuario: leitura.id_usuario,
            id_livro: leitura.id_livro,
            status: leitura.status,
            data_inicio: leitura.data_inicio,
            data_conclusao: leitura.data_conclusao,
            avaliacao: leitura.avaliacao,
            resenha: leitura.resenha,
            pagina_atual: leitura.pagina_atual,
            vezes_lido: leitura.vezes_lido,
            livro: livro ? {
                id_livro: livro.id_livro,
                titulo: livro.titulo,
                autor: livro.autor,
                num_paginas: livro.num_paginas,
                capa: livro.capa
            } : undefined
        };
    }

    async avaliarLeitura(req: Request<{ id: string }, {}, { avaliacao: number; resenha?: string }>, res: Response): Promise<Response> {
        try {
            const valid = await this.validarAvaliarLeitura(req, res);
            if (valid) return valid;
            const leitura = await this.atualizarAvaliacaoNoBanco(req);
            const resposta = this.montarRespostaAvaliacao(leitura);
            return res.json({ mensagem: 'Avaliação registrada com sucesso', leitura: resposta });
        } catch (error) {
            console.error('Erro ao avaliar leitura', error);
            return res.status(500).json({ erro: 'Erro interno ao avaliar leitura' });
        }
    }

    private async validarAvaliarLeitura(req: Request, res: Response) {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }
        const usuarioId = req.usuario.id || req.usuario.id_usuario;
        const id = Number(req.params.id);
        const { avaliacao } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({
                erro: 'ID inválido'
            });
        }
        if (avaliacao !== undefined && (avaliacao < 0 || avaliacao > 5)) {
            return res.status(400).json({
                erro: 'Avaliação deve estar entre 0 e 5'
            });
        }
        const leitura = await leituras.findOne({
            where: {
                id_leitura: id,
                id_usuario: usuarioId
            }
        });
        if (!leitura) {
            return res.status(404).json({
                erro: 'Leitura não encontrada'
            });
        }
        if (leitura.status !== 'lido') {
            return res.status(400).json({
                erro: 'Apenas livros com status "lido" podem ser avaliados'
            });
        }
        return null;
    }

    private async atualizarAvaliacaoNoBanco(req: Request) {
        const usuarioId = req.usuario.id || req.usuario.id_usuario;
        const id = Number(req.params.id);
        const { avaliacao, resenha } = req.body;
        const leitura = await leituras.findOne({ where: { id_leitura: id, id_usuario: usuarioId } });
        if (avaliacao !== undefined) leitura.avaliacao = avaliacao;
        if (resenha !== undefined) leitura.resenha = resenha;
        await leitura.save();
        
        return leitura;
    }

    private montarRespostaAvaliacao(leitura: any) {
        return {
            id_leitura: leitura.id_leitura,
            avaliacao: leitura.avaliacao,
            resenha: leitura.resenha
        };
    }
}
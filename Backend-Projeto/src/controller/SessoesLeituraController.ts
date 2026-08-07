import { Request, Response } from 'express';
import { sessoes_leitura } from '../models-auto/sessoes_leitura';
import { leituras } from '../models-auto/leituras';
import { verificarConquistas } from './ConquistasController';

export class SessoesLeituraController {


    async registrarSessao(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;

            const { id_leitura, data, pagina_inicial, pagina_final, duracao_minutos } = req.body;

            if (!id_leitura || !data) {
                return res.status(400).json({ erro: 'id_leitura e data são obrigatórios' });
            }

            if (pagina_inicial !== undefined && pagina_final !== undefined && Number(pagina_final) < Number(pagina_inicial)) {
                return res.status(400).json({ erro: 'pagina_final não pode ser menor que pagina_inicial' });
            }

            const leitura = await leituras.findOne({ where: { id_leitura, id_usuario: usuarioId } });
            if (!leitura) {
                return res.status(404).json({ erro: 'Leitura não encontrada' });
            }

            const sessao = await sessoes_leitura.create({
                id_leitura,
                data,
                pagina_inicial: pagina_inicial ?? null,
                pagina_final: pagina_final ?? null,
                duracao_minutos: duracao_minutos ?? null
            });


            if (pagina_final !== undefined && Number(pagina_final) > (leitura.pagina_atual || 0)) {
                leitura.pagina_atual = Number(pagina_final);
                await leitura.save();
            }

            const novasConquistas = await verificarConquistas(usuarioId);

            return res.status(201).json({
                mensagem: 'Sessão de leitura registrada com sucesso',
                sessao,
                novasConquistas
            });
        } catch (error) {
            console.error('Erro ao registrar sessão de leitura:', error);
            return res.status(500).json({ erro: 'Erro interno ao registrar sessão' });
        }
    }


    async listarSessoesPorLeitura(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;
            const idLeitura = Number(req.params.id);

            if (isNaN(idLeitura)) {
                return res.status(400).json({ erro: 'ID de leitura inválido' });
            }

            const leitura = await leituras.findOne({ where: { id_leitura: idLeitura, id_usuario: usuarioId } });
            if (!leitura) {
                return res.status(404).json({ erro: 'Leitura não encontrada' });
            }

            const sessoes = await sessoes_leitura.findAll({
                where: { id_leitura: idLeitura },
                order: [['data', 'DESC']]
            });

            const totalMinutos = sessoes.reduce((soma, s) => soma + (s.duracao_minutos || 0), 0);

            return res.json({ sessoes, total_sessoes: sessoes.length, total_minutos: totalMinutos });
        } catch (error) {
            console.error('Erro ao listar sessões:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar sessões' });
        }
    }

    async listarSessoesDoUsuario(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }

            const usuarioId = req.usuario.id;

            const sessoes = await sessoes_leitura.findAll({
                include: [{
                    model: leituras,
                    as: 'leitura',
                    where: { id_usuario: usuarioId },
                    attributes: ['id_leitura', 'id_livro', 'status', 'pagina_atual']
                }],
                order: [['data', 'DESC'], ['id_sessao', 'DESC']]
            });

            const totalMinutos = sessoes.reduce((soma, s) => soma + (s.duracao_minutos || 0), 0);

            return res.json({
                sessoes,
                total_sessoes: sessoes.length,
                total_minutos: totalMinutos
            });
        } catch (error) {
            console.error('Erro ao listar sessões do usuário:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar sessões do usuário' });
        }
    }


    async deletarSessao(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }
            const usuarioId = req.usuario.id;
            const idSessao = Number(req.params.id);

            if (isNaN(idSessao)) {
                return res.status(400).json({ erro: 'ID de sessão inválido' });
            }

            const sessao = await sessoes_leitura.findByPk(idSessao, {
                include: [{ model: leituras, as: 'leitura', where: { id_usuario: usuarioId } }]
            });

            if (!sessao) {
                return res.status(404).json({ erro: 'Sessão não encontrada' });
            }

            await sessao.destroy();
            return res.json({ mensagem: 'Sessão removida com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar sessão:', error);
            return res.status(500).json({ erro: 'Erro interno ao deletar sessão' });
        }
    }
}

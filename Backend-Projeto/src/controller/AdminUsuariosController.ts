import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { usuarios } from '../models-auto/usuarios';
import { notificarPermissaoAlterada, TipoUsuario } from '../eventos/usuarioEventos';
import { logErro } from '../logger';


async function alterarPermissao(usuario: usuarios, novoTipo: TipoUsuario): Promise<void> {
    if (usuario.tipo_usuario === novoTipo) return; 
    usuario.tipo_usuario = novoTipo;
    await usuario.save();
    await notificarPermissaoAlterada(usuario.id_usuario, novoTipo);
}

export class AdminUsuariosController {
    async listar(req: Request, res: Response): Promise<Response> {
        try {
            const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';

            const where = busca
                ? {
                    [Op.or]: [
                        { nome: { [Op.like]: `%${busca}%` } },
                        { email: { [Op.like]: `%${busca}%` } },
                    ],
                }
                : undefined;

            const lista = await usuarios.findAll({
                where,
                attributes: ['id_usuario', 'nome', 'email', 'tipo_usuario'],
                order: [['nome', 'ASC']],
            });

            return res.json({ usuarios: lista });
        } catch (error) {
            logErro(req, 'Erro ao listar usuários (admin)', error);
            return res.status(500).json({ erro: 'Erro interno ao listar usuários' });
        }
    }

    async promover(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const usuario = await usuarios.findByPk(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            await alterarPermissao(usuario, 'admin');

            return res.json({
                mensagem: 'Usuário promovido a administrador',
                usuario: { id_usuario: usuario.id_usuario, nome: usuario.nome, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
            });
        } catch (error) {
            logErro(req, 'Erro ao promover usuário', error);
            return res.status(500).json({ erro: 'Erro interno ao promover usuário' });
        }
    }

    async rebaixar(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (req.usuario?.id === id) {
                return res.status(400).json({ erro: 'Você não pode remover seu próprio acesso de administrador' });
            }

            const usuario = await usuarios.findByPk(id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            await alterarPermissao(usuario, 'usuario');

            return res.json({
                mensagem: 'Acesso de administrador removido',
                usuario: { id_usuario: usuario.id_usuario, nome: usuario.nome, email: usuario.email, tipo_usuario: usuario.tipo_usuario },
            });
        } catch (error) {
            logErro(req, 'Erro ao rebaixar usuário', error);
            return res.status(500).json({ erro: 'Erro interno ao rebaixar usuário' });
        }
    }
}
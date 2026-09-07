import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { HttpError } from '../utils/HttpError';

const authService = new AuthService();

export class PerfilController {

    async perfil(req: Request, res: Response): Promise<Response> {
        try {
            const usuario = await authService.buscarPerfil(req.usuario!.id);
            return res.json(usuario);
        } catch (error) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ erro: error.message });
            }
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async editarPerfil(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({ erro: 'Usuário não autenticado' });
            }

            const usuarioAtualizado = await authService.editarPerfil(req.usuario.id, req.body);

            return res.json({
                mensagem: 'Perfil atualizado com sucesso',
                usuario: usuarioAtualizado
            });
        } catch (error) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ erro: error.message });
            }
            console.error('Erro ao atualizar perfil:', error);
            return res.status(500).json({ erro: 'Erro interno ao atualizar perfil' });
        }
    }
}

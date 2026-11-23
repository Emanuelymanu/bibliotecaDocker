import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { HttpError } from '../utils/HttpError';

const authService = new AuthService();


export class PerfilController {

    async perfil(req: Request, res: Response): Promise<Response> {
        const usuario = await authService.buscarPerfil(req.usuario!.id);
        return res.json(usuario);
    }

    async editarPerfil(req: Request, res: Response): Promise<Response> {
        if (!req.usuario) {
            throw new HttpError(401, 'Usuário não autenticado');
        }

        const usuarioAtualizado = await authService.editarPerfil(req.usuario.id, req.body);

        return res.json({
            mensagem: 'Perfil atualizado com sucesso',
            usuario: usuarioAtualizado
        });
    }
}
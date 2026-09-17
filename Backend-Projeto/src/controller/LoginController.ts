import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { HttpError } from '../utils/HttpError';

const authService = new AuthService();

export class LoginController {

    async login(req: Request, res: Response) {
        try {
            const { email, senha } = req.body;
            const { token, usuario } = await authService.login(email, senha);
            return res.status(200).json({
                message: 'Login bem-sucedido',
                token,
                usuario
            });
        } catch (error) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ erro: error.message });
            }
            console.error('Erro no login:', error);
            return res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}

import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();


export class LoginController {

    async login(req: Request, res: Response) {
        const { email, senha } = req.body;
        const { token, usuario } = await authService.login(email, senha);
        return res.status(200).json({
            message: 'Login bem-sucedido',
            token,
            usuario
        });
    }
}
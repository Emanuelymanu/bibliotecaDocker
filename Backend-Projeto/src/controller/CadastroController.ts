import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { HttpError } from '../utils/HttpError';

const authService = new AuthService();

export class CadastroController {

    async cadastro(req: Request, res: Response) {
        try {
            const usuario = await authService.cadastrar(req.body);
            return res.status(201).json({
                message: 'Usuário cadastrado com sucesso',
                usuario
            });
        } catch (error: any) {
            if (error instanceof HttpError) {
                return res.status(error.status).json({ erro: error.message });
            }
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ erro: error.errors.map((e: any) => e.message) });
            }
            console.error('Erro no cadastro:', error);
            return res.status(500).json({ erro: error.message });
        }
    }
}

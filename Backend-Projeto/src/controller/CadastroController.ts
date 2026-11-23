import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();


export class CadastroController {

    async cadastro(req: Request, res: Response) {
        const usuario = await authService.cadastrar(req.body);
        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            usuario
        });
    }
}
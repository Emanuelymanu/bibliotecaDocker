import { Request, Response } from 'express';
import { usuarios } from '../models-auto/usuarios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
}

export class LoginController {

    async login(req: Request, res: Response) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({
                    erro: 'Email e senha são obrigatórios'
                });
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    erro: 'Formato de email inválido'
                });

            }

            const usuario = await usuarios.findOne({
                where: { email }
            });
            if (!usuario) {
                return res.status(401).json({
                    erro: 'Email ou senha inválidos'
                });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({
                    erro: 'Email ou senha inválidos'
                });
            }

            const token = jwt.sign({
                id: usuario.id_usuario,
                email: usuario.email,
                nome: usuario.nome
            },
                JWT_SECRET,
                {
                    expiresIn: '5h'
                });

            const usuarioSemSenha = usuario.toJSON();
            delete usuarioSemSenha.senha;

            res.status(200).json({
                message: 'Login bem-sucedido',
                token,
                usuario: usuarioSemSenha
            });

        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({
                erro: 'Erro interno do servidor'
            });
        }
    }




}
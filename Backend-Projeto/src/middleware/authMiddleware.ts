import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
}

export interface UsuarioAutenticado {
    id: number;
    email: string;
    nome: string;
    tipo_usuario: 'usuario' | 'admin';
}

declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioAutenticado;
        }
    }
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                erro: 'Token de autenticação ausente'
            });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2) {
            return res.status(401).json({
                erro: 'Token mal formatado'
            });

        }

        const [scheme, token] = parts;
        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({
                erro: 'Token mal formatado'
            });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    erro: 'Token inválido ou expirado'
                })
            }

            req.usuario = decoded as UsuarioAutenticado;
            return next();
        })
    } catch (error) {
        return res.status(401).json({
            erro: 'Erro na autenticação'
        });
    }
}
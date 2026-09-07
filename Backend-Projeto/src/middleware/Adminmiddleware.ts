import {Request, Response, NextFunction} from 'express';
import { usuarios } from '../models-auto/usuarios';

export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(!req.usuario){
        return res.status(401).json({
            erro: 'Usuário não autenticado'
        });
    }

    try {
        const usuario = await usuarios.findByPk(req.usuario.id, {
            attributes: ['tipo_usuario']
        });

        if (!usuario || usuario.tipo_usuario !== 'admin') {
            return res.status(403).json({
                erro: 'Acesso restrito a adminstradores'
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({
            erro: 'Erro ao verificar permissões do usuário'
        });
    }
}
import {Request, Response, NextFunction} from 'express';

export const adminMiddleware =(
    req: Request,
    res: Response,
    next: NextFunction
)=> {
    if(!req.usuario){
        return res.status(401).json({
            erro: 'Usuário não autenticado'
        });
    }
    if (req.usuario.tipo_usuario !== 'admin'){
        return res.status(403).json({
            erro: 'Acesso restrito a adminstradores'
        })
    }
    return next();
}
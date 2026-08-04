import { Router } from 'express';
import { conquistas } from '../models-auto/conquistas';
import { usuario_conquistas } from '../models-auto/usuario_conquistas';
import { authMiddleware } from '../middleware/authMiddleware';
import { verificarConquistas } from '../controller/ConquistasController';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }

        await verificarConquistas(req.usuario.id);

        const registros = await usuario_conquistas.findAll({
            where: { id_usuario: req.usuario.id },
            include: [{ model: conquistas, as: 'conquista' }],
            order: [['data_conquista', 'DESC']]
        });

        return res.json({
            conquistas: registros.map((registro) => ({
                id_conquista: registro.id_conquista,
                data_conquista: registro.data_conquista,
                conquista: registro.conquista
            }))
        });
    } catch (error) {
        console.error('Erro ao listar conquistas:', error);
        return res.status(500).json({ erro: 'Erro interno ao listar conquistas' });
    }
});

export default router;
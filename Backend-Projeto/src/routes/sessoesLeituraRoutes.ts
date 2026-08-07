import { Router } from 'express';
import { SessoesLeituraController } from '../controller/SessoesLeituraController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const sessoesLeituraController = new SessoesLeituraController();

router.get('/', authMiddleware, (req, res) => sessoesLeituraController.listarSessoesDoUsuario(req, res));
router.post('/', authMiddleware, (req, res) => sessoesLeituraController.registrarSessao(req, res));
router.get('/leitura/:id', authMiddleware, (req, res) => sessoesLeituraController.listarSessoesPorLeitura(req, res));
router.delete('/:id', authMiddleware, (req, res) => sessoesLeituraController.deletarSessao(req, res));

export default router;

import { Router } from 'express';
import { MetasLeituraController } from '../controller/MetasLeituraController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const metasLeituraController = new MetasLeituraController();

router.post('/', authMiddleware, (req, res) => metasLeituraController.criarOuAtualizarMeta(req, res));
router.get('/', authMiddleware, (req, res) => metasLeituraController.listarMinhasMetas(req, res));
router.get('/:ano', authMiddleware, (req, res) => metasLeituraController.buscarMetaPorAno(req, res));

export default router;

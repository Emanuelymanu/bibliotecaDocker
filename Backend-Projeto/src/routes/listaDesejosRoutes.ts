import { Router } from 'express';
import { ListaDesejosController } from '../controller/ListaDesejosController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const listaDesejosController = new ListaDesejosController();

router.post('/', authMiddleware, (req, res) => listaDesejosController.adicionar(req, res));
router.get('/', authMiddleware, (req, res) => listaDesejosController.listar(req, res));
router.delete('/:id_livro', authMiddleware, (req, res) => listaDesejosController.remover(req, res));

export default router;

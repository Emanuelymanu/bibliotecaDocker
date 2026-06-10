import { Router } from 'express';
import { PerfilController } from '../controller/PerfilController';
import { authMiddleware } from '../middleware/authMiddleware';


const router = Router();
const perfilController = new PerfilController();

router.use(authMiddleware);

router.get('/', (req, res) => perfilController.perfil(req, res));
router.put('/', (req, res) => perfilController.editarPerfil(req, res));

export default router;
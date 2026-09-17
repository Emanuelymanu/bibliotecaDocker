import { Router } from 'express';
import { AdmincatalogoController } from '../controller/AdmincatalogoController';
import { AdminUsuariosController } from '../controller/AdminUsuariosController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/Adminmiddleware';

const router = Router();
const controller = new AdmincatalogoController();
const usuariosController = new AdminUsuariosController();


router.use(authMiddleware, adminMiddleware);


router.get('/autores', (req, res) => controller.listarAutores(req, res));
router.put('/autores/:id', (req, res) => controller.editarAutor(req, res));
router.delete('/autores/:id', (req, res) => controller.deletarAutor(req, res));
router.post('/autores/mesclar', (req, res) => controller.mesclarAutores(req, res));


router.get('/editoras', (req, res) => controller.listarEditoras(req, res));
router.put('/editoras/:id', (req, res) => controller.editarEditora(req, res));
router.delete('/editoras/:id', (req, res) => controller.deletarEditora(req, res));
router.post('/editoras/mesclar', (req, res) => controller.mesclarEditoras(req, res));


router.get('/generos', (req, res) => controller.listarGeneros(req, res));
router.put('/generos/:id', (req, res) => controller.editarGenero(req, res));
router.delete('/generos/:id', (req, res) => controller.deletarGenero(req, res));
router.post('/generos/mesclar', (req, res) => controller.mesclarGeneros(req, res));

router.get('/usuarios', (req, res) => usuariosController.listar(req, res));
router.put('/usuarios/:id/promover', (req, res) => usuariosController.promover(req, res));
router.put('/usuarios/:id/rebaixar', (req, res) => usuariosController.rebaixar(req, res));

export default router;
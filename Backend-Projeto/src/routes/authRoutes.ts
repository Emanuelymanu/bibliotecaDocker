import {Router} from 'express';
import { LoginController } from '../controller/LoginController';
import {CadastroController} from '../controller/CadastroController';
import { PerfilController } from '../controller/PerfilController';
import { authMiddleware } from '../middleware/authMiddleware';



const router = Router();

const loginController = new LoginController();
const cadastroController = new CadastroController();
const perfilController = new PerfilController();

router.post('/login', (req, res) => loginController.login(req, res));
router.post('/cadastro', (req, res) => cadastroController.cadastro(req, res));
router.get('/perfil', authMiddleware, (req, res) => perfilController.perfil(req, res));
router.put('/perfil', authMiddleware, (req, res) => perfilController.editarPerfil(req, res));



export default router;
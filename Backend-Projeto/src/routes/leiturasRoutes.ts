import { Router } from "express";
import { LeiturasController } from "../controller/LeiturasController";
import { AtualizarLeituraController } from "../controller/AtualizarLeiturasController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const leiturasController = new LeiturasController();
const atualizarLeitura = new AtualizarLeituraController();

router.use(authMiddleware);


router.post('/iniciar', authMiddleware, (req, res) => leiturasController.iniciarLeitura(req, res));
router.get('/listar', authMiddleware, (req, res) => leiturasController.listarLeituras(req, res));
router.get('/:id', authMiddleware, (req, res) => leiturasController.buscarLeitura(req, res));
router.delete('/:id', authMiddleware, (req, res) => leiturasController.deletarLeitura(req, res));
router.post('/:id/avaliar', (req, res) => atualizarLeitura.avaliarLeitura(req, res));
router.put('/:id/progresso', authMiddleware, (req, res) => atualizarLeitura.atualizarProgresso(req, res));


export default router;
import { Router } from 'express';
import { AnotacoesController } from '../controller/AnotacoesController';
import { AtualizarAnotacao } from '../controller/AtualizarAnotacao';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const anotacoesController = new AnotacoesController;
const atualizarAnotacao = new AtualizarAnotacao;

router.use(authMiddleware);


router.post('/', (req, res) => anotacoesController.criarAnotacao(req, res));
router.get('/leitura/:id_leitura', (req, res) => anotacoesController.buscarTodasPorLeitura(req, res));
router.get('/leitura/:id_leitura/pagina/:pagina', (req, res) => anotacoesController.buscarPorPagina(req, res));
router.delete('/:id', (req, res) => anotacoesController.deletarAnotacao(req, res));

router.put('/:id', (req, res) => atualizarAnotacao.atualizarAnotacao(req, res));

export default router;
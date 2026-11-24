import { Router } from 'express';
import { CadastrarLivrosController } from '../controller/CadastrarLivrosController';
import { authMiddleware } from '../middleware/authMiddleware';
import { EditarLivrosController } from '../controller/EditarLivrosController';
import { ListarLivrosController } from '../controller/ListarLivrosController';
import { upload } from '../config/multer';
import { FiltroLivros } from '../controller/FiltroLivros';
import { logErro } from '../logger';
import { fetchFromGoogle, MENSAGEM_INDISPONIVEL } from '../services/googleBooksService';
import { HttpError } from '../utils/HttpError';


const router = Router();
const cadastrarLivrosController = new CadastrarLivrosController();
const editarLivrosController = new EditarLivrosController();
const listarLivros = new ListarLivrosController();
const filtroLivros = new FiltroLivros();

router.post('/cadastrar', authMiddleware, upload.single('capa'), (req, res) => cadastrarLivrosController.cadastrarLivro(req, res));
router.post('/cadastrar-com-google', authMiddleware, upload.single('capa'), (req, res) => cadastrarLivrosController.cadastrarLivro(req, res));

router.put('/editar/:id', authMiddleware, upload.single('capa'), (req, res) => editarLivrosController.atualizarLivro(req, res));
router.delete('/deletar/:id', authMiddleware, (req, res) => editarLivrosController.deletarLivro(req, res));

router.get('/listar', authMiddleware, (req, res) => listarLivros.listarLivros(req, res));
router.get('/top-avaliados', authMiddleware, (req, res) => listarLivros.listarTopAvaliados(req, res));
router.get('/', authMiddleware, (req, res) => listarLivros.listarLivros(req, res));
router.get('/filtros/opcoes', (req, res) => filtroLivros.obterOpcoesFiltro(req, res));
router.get('/genero/:genero', (req, res) => filtroLivros.buscarPorGenero(req, res));
router.get('/autor/:autor', (req, res) => filtroLivros.buscarPorAutor(req, res));
router.get('/editora/:editora', (req, res) => filtroLivros.buscarPorEditora(req, res));


router.get('/status/leitura', authMiddleware, (req, res) => filtroLivros.buscarPorStatusLeitura(req, res));


// GDL-32: timeout, retry e circuit breaker ficam no googleBooksService. Se o Google
// não responder, a busca devolve 503 com mensagem amigável (o app mostra o campo `erro`).
router.get('/buscar', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ erro: 'Query obrigatória' });
    }
    try {
        const items = await fetchFromGoogle(query as string);
        return res.json({ livros: items });
    } catch (err) {
        if (err instanceof HttpError) {
            return res.status(err.status).json({ erro: err.message });
        }
        logErro(req, 'Erro ao buscar na Google Books API', err);
        return res.status(503).json({ erro: MENSAGEM_INDISPONIVEL });
    }
});


export default router;
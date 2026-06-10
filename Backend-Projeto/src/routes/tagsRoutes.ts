import {Router} from "express";
import { TagsController } from "../controller/TagsController";
import { AtualizarTags } from "../controller/AtualizarTags";
import { VincularTag } from "../controller/VincularTag";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const tagsController = new TagsController();
const atualizarTags = new AtualizarTags();
const vincularTag = new VincularTag();
router.use(authMiddleware);

router.post('/', (req,res)=> tagsController.criarTag(req,res));
router.get('/', (req,res)=>tagsController.listarTags(req,res));
router.delete('/:id', (req,res)=> tagsController.deletarTag(req,res));

router.put('/:id', (req,res)=> atualizarTags.atializarTag(req,res));

router.post('/:id_tag/leituras/:id_leitura', (req,res)=> vincularTag.vincularTagLeitura(req,res));
router.delete('/:id_tag/leituras/:id_leitura',(req,res)=> vincularTag.removerTagLeitura(req,res));


export default router;
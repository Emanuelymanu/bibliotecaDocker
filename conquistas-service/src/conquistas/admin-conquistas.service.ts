import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { dataHojeBrasil } from '../common/utils/datas';
import { inserirSeNovo } from '../common/utils/inserir-se-novo';
import { gerarTextoCriterio } from './conquistas.regras';
import { TIPOS_CONQUISTA } from './conquistas.tipos';
import { AtualizarConquistaDto } from './dto/atualizar-conquista.dto';
import { CriarConquistaDto } from './dto/criar-conquista.dto';
import { TipoComExemplo } from './dto/respostas.dto';
import { ConquistaDoUsuario } from './entities/conquista-do-usuario.entity';
import { Conquista } from './entities/conquista.entity';
import { CriterioMontado, DadosCriterio, montarCriterio } from './montar-criterio';

@Injectable()
export class AdminConquistasService{
    private readonly logger = new Logger(AdminConquistasService.name)

    constructor(
        @InjectRepository(Conquista) private readonly conquistas: Repository<Conquista>,
        @InjectRepository(ConquistaDoUsuario) private readonly desbloqueios: Repository<ConquistaDoUsuario>,
    ){}

    listarTipos(): TipoComExemplo[]{
        return TIPOS_CONQUISTA.map((tipo)=> ({tipo, exemplo: gerarTextoCriterio(tipo, 10, 'fantasia')}))
    }

    listarTodas(): Promise<Conquista[]> {
        return this.conquistas.find({
            order: { id_conquista: 'ASC'}
        })
    }

    async criar(dados: CriarConquistaDto): Promise<Conquista>{
        const criterio = this.montar(dados)
        const conquista = await this.conquistas.save(
            this.conquistas.create({
                nome: dados.nome,
                descricao: dados.descricao ?? null,
                ...criterio
            })
        )
        this.logger.log(`criada #${conquista.id_conquista} ${conquista.nome} ${conquista.tipo} ${conquista.valor_alvo}`)
           return conquista
    }

      async editar(id: number, dados: AtualizarConquistaDto): Promise<Conquista> {
    const conquista = await this.buscar(id);
 
    if (dados.nome !== undefined) conquista.nome = dados.nome;
    if (dados.descricao !== undefined) conquista.descricao = dados.descricao;
    if (dados.icone !== undefined) conquista.icone = dados.icone;
 
    const mexeuNoCriterio = (['tipo', 'valor_alvo', 'id_genero', 'criterio'] as const).some((c) => dados[c] !== undefined);
    if (mexeuNoCriterio) {
      Object.assign(conquista, this.montar(dados, conquista));
    }
 
    await this.conquistas.save(conquista);
    this.logger.log(`editada #${conquista.id_conquista} "${conquista.nome}"`);
    return conquista;
  }
 

  async apagar(id: number): Promise<void> {
    const conquista = await this.buscar(id);
    await this.conquistas.remove(conquista);
    this.logger.log(`apagada #${id} "${conquista.nome}"`);
  }
 
  
  async conceder(idConquista: number, idUsuario: number, idAdmin: number): Promise<void> {
    await this.buscar(idConquista);
    const gravou = await inserirSeNovo(this.desbloqueios, {
      id_usuario: idUsuario,
      id_conquista: idConquista,
      data_conquista: dataHojeBrasil(),
    });
    if (!gravou) throw new ConflictException('Usuário já possui esta conquista');
    this.logger.log(`admin=${idAdmin} concedeu #${idConquista} ao usuario=${idUsuario}`);
  }
 
  private async buscar(id: number): Promise<Conquista> {
    const conquista = await this.conquistas.findOneBy({ id_conquista: id });
    if (!conquista) throw new NotFoundException('Conquista não encontrada');
    return conquista;
  }
 

  private montar(dados: DadosCriterio, atual?: Conquista): CriterioMontado {
    try {
      return montarCriterio(dados, atual);
    } catch (erro) {
      throw new BadRequestException((erro as Error).message);
    }
  }
}
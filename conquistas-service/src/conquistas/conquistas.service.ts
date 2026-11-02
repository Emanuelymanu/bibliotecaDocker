import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { dataHojeBrasil } from '../common/utils/datas';
import { inserirSeNovo } from '../common/utils/inserir-se-novo';
import { CacheCatalogoService, OrigemCatalogo } from './cache-catalogo.service';
import { atingiuCriterio, calcularProgresso } from './conquistas.regras';
import { EstatisticasLeitor } from './conquistas.tipos';
import { CatalogoResposta, MinhasConquistasResposta } from './dto/respostas.dto';
import { ConquistaDoUsuario } from './entities/conquista-do-usuario.entity';
import { Conquista } from './entities/conquista.entity';
import { EstatisticasLeitorEntity } from './entities/estatisticas-leitor.entity';


@Injectable()
export class ConquistasService {
  private readonly logger = new Logger(ConquistasService.name);

  constructor(
    @InjectRepository(Conquista) private readonly conquistas: Repository<Conquista>,
    @InjectRepository(ConquistaDoUsuario) private readonly desbloqueios: Repository<ConquistaDoUsuario>,
    @InjectRepository(EstatisticasLeitorEntity) private readonly estatisticas: Repository<EstatisticasLeitorEntity>,
    private readonly cache: CacheCatalogoService,
  ) {}

  
  async listarCatalogo(usuarioId: number): Promise<{ dados: CatalogoResposta; origem: OrigemCatalogo }> {
    return this.cache.obterOuCalcular(usuarioId, () => this.calcularCatalogo(usuarioId));
  }

  
  private async calcularCatalogo(usuarioId: number): Promise<CatalogoResposta> {
    const registro = await this.estatisticas.findOneBy({ id_usuario: usuarioId });
    const numeros = registro?.paraRegras() ?? null;

    if (numeros) {
      await this.concederAtingidas(usuarioId, numeros);
    }

    const [todas, desbloqueadas] = await Promise.all([
      this.conquistas.find({ order: { id_conquista: 'ASC' } }),
      this.desbloqueios.findBy({ id_usuario: usuarioId }),
    ]);
    const dataPorConquista = new Map(desbloqueadas.map((d) => [d.id_conquista, d.data_conquista]));

    const lista = todas.map((c) => {
      const progresso = numeros ? calcularProgresso(c, numeros) : null;
      return {
        id_conquista: c.id_conquista,
        nome: c.nome,
        descricao: c.descricao,
        criterio: c.criterio,
        icone: c.icone,
        tipo: c.tipo,
        valor_alvo: c.valor_alvo,
        progresso: progresso === null ? null : Math.min(progresso, c.valor_alvo),
        desbloqueada: dataPorConquista.has(c.id_conquista),
        data_conquista: dataPorConquista.get(c.id_conquista) ?? null,
      };
    });

    return {
      conquistas: lista,
      total: lista.length,
      total_desbloqueadas: lista.filter((c) => c.desbloqueada).length,
    };
  }

  
  async listarMinhas(usuarioId: number): Promise<MinhasConquistasResposta> {
    const registros = await this.desbloqueios.find({
      where: { id_usuario: usuarioId },
      relations: { conquista: true },
      order: { data_conquista: 'DESC', id_conquista: 'ASC' },
    });

    return {
      conquistas: registros.map((r) => ({
        id_conquista: r.id_conquista,
        data_conquista: r.data_conquista,
        conquista: r.conquista,
      })),
    };
  }

 
  async concederAtingidas(usuarioId: number, numeros: EstatisticasLeitor): Promise<Conquista[]> {
    const [automaticas, jaTem] = await Promise.all([
      this.conquistas.find({ where: { tipo: Not('MANUAL') }, order: { id_conquista: 'ASC' } }),
      this.desbloqueios.findBy({ id_usuario: usuarioId }),
    ]);
    const idsJaTem = new Set(jaTem.map((d) => d.id_conquista));
    const candidatas = automaticas.filter((c) => !idsJaTem.has(c.id_conquista) && atingiuCriterio(c, numeros));

    const novas: Conquista[] = [];
    const hoje = dataHojeBrasil();
    for (const conquista of candidatas) {
      const gravou = await inserirSeNovo(this.desbloqueios, {
        id_usuario: usuarioId,
        id_conquista: conquista.id_conquista,
        data_conquista: hoje,
      });
      if (gravou) novas.push(conquista);
    }

    if (novas.length > 0) {
      this.logger.log(
        `usuario=${usuarioId} desbloqueou: ${novas.map((c) => `#${c.id_conquista} ${c.nome}`).join(', ')}`,
      );
      await this.cache.invalidarUsuario(usuarioId, 'ganhou conquista automática');
    }
    return novas;
  }
}
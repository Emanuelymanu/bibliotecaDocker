import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { dataHojeBrasil } from '../common/utils/datas';
import { inserirSeNovo } from '../common/utils/inserir-se-novo';
import { CacheCatalogoService, OrigemCatalogo } from './cache-catalogo.service';
import { atingiuCriterio, calcularProgresso } from './conquistas.regras';
import { EstatisticasLeitor } from './conquistas.tipos';
import { CatalogoResposta, MinhasConquistasResposta, NovasConquistasResposta } from './dto/respostas.dto';
import { ConquistaDoUsuario } from './entities/conquista-do-usuario.entity';
import { Conquista } from './entities/conquista.entity';
import { EstatisticasLeitorEntity } from './entities/estatisticas-leitor.entity';
import { EventoEstatisticasAtualizadas } from './eventos/estatisticas-atualizadas';

export interface ResultadoEvento {

  aplicado: boolean;
  novas: Conquista[];
}

const COLUNAS_ESTATISTICAS = [
  'livros_lidos',
  'livros_cadastrados',
  'paginas_lidas',
  'total_sessoes',
  'total_anotacoes',
  'total_avaliacoes',
  'possui_meta',
  'livros_lidos_por_genero',
] as const;


const MAIS_NOVO = 'estatisticas_leitor.gerado_em IS NULL OR novo.gerado_em >= estatisticas_leitor.gerado_em';
const SQL_GRAVAR_ESTATISTICAS = `
  INSERT INTO estatisticas_leitor (id_usuario, ${COLUNAS_ESTATISTICAS.join(', ')}, gerado_em)
  VALUES (?, ${COLUNAS_ESTATISTICAS.map(() => '?').join(', ')}, ?) AS novo
  ON DUPLICATE KEY UPDATE
    ${[...COLUNAS_ESTATISTICAS, 'gerado_em']
      .map((c) => `${c} = IF(${MAIS_NOVO}, novo.${c}, estatisticas_leitor.${c})`)
      .join(',\n    ')}`;


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

 
  async buscarNovas(usuarioId: number): Promise<NovasConquistasResposta> {
    const pendentes = await this.desbloqueios.manager.transaction(async (transacao) => {
      const repositorio = transacao.getRepository(ConquistaDoUsuario);
      const naoVistas = await repositorio
        .createQueryBuilder('uc')
        .innerJoinAndSelect('uc.conquista', 'c')
        .where('uc.id_usuario = :usuarioId AND uc.visualizada = :vista', { usuarioId, vista: false })
        .orderBy('uc.data_conquista', 'ASC')
        .addOrderBy('uc.id_conquista', 'ASC')
        .setLock('pessimistic_write')
        .getMany();

      if (naoVistas.length > 0) {
        await repositorio.update(
          { id_usuario: usuarioId, id_conquista: In(naoVistas.map((r) => r.id_conquista)) },
          { visualizada: true },
        );
      }
      return naoVistas;
    });

    if (pendentes.length > 0) {
      this.logger.log(
        `usuario=${usuarioId} foi avisado de ${pendentes.length} conquista(s) nova(s): ` +
          pendentes.map((r) => `#${r.id_conquista} ${r.conquista.nome}`).join(', '),
      );
    }
    return {
      conquistas: pendentes.map((r) => ({
        id_conquista: r.id_conquista,
        nome: r.conquista.nome,
        descricao: r.conquista.descricao,
        icone: r.conquista.icone,
        data_conquista: r.data_conquista,
      })),
    };
  }

  async registrarEstatisticas(evento: EventoEstatisticasAtualizadas): Promise<ResultadoEvento> {
    const { usuarioId, estatisticas: e, geradoEm } = evento;
    await this.estatisticas.query(SQL_GRAVAR_ESTATISTICAS, [
      usuarioId,
      e.livrosLidos,
      e.livrosCadastrados,
      e.paginasLidas,
      e.totalSessoes,
      e.totalAnotacoes,
      e.totalAvaliacoes,
      e.possuiMeta,
      JSON.stringify(e.livrosLidosPorGenero),
      geradoEm,
    ]);

    const gravado = await this.estatisticas.findOneBy({ id_usuario: usuarioId });
    if (!gravado || (gravado.gerado_em && gravado.gerado_em.getTime() > geradoEm.getTime())) {
      this.logger.warn(
        `usuario=${usuarioId}: evento de ${geradoEm.toISOString()} descartado, ` +
          `já existe um mais novo (${gravado?.gerado_em?.toISOString()})`,
      );
      return { aplicado: false, novas: [] };
    }

    const novas = await this.concederAtingidas(usuarioId, gravado.paraRegras());
    if (novas.length === 0) {
      this.logger.log(`usuario=${usuarioId}: estatísticas gravadas, nenhuma conquista nova`);
      
      await this.cache.invalidarUsuario(usuarioId, 'estatísticas atualizadas');
    }
    return { aplicado: true, novas };
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
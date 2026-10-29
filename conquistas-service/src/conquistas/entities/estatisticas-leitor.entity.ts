import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EstatisticasLeitor as Estatisticas } from '../conquistas.tipos';


@Entity({ name: 'estatisticas_leitor' })
export class EstatisticasLeitorEntity {
  @PrimaryColumn({ type: 'int' })
  id_usuario: number;

  @Column({ type: 'int', default: 0 })
  livros_lidos: number;

  @Column({ type: 'int', default: 0 })
  livros_cadastrados: number;

  @Column({ type: 'int', default: 0 })
  paginas_lidas: number;

  @Column({ type: 'int', default: 0 })
  total_sessoes: number;

  @Column({ type: 'int', default: 0 })
  total_anotacoes: number;

  @Column({ type: 'int', default: 0 })
  total_avaliacoes: number;

  @Column({ type: 'boolean', default: false })
  possui_meta: boolean;


  @Column({ type: 'json' })
  livros_lidos_por_genero: Record<string, number>;

  @UpdateDateColumn({ type: 'datetime' })
  atualizado_em: Date;


  paraRegras(): Estatisticas {
    const porGenero: Record<number, number> = {};
    for (const [idGenero, quantidade] of Object.entries(this.livros_lidos_por_genero ?? {})) {
      porGenero[Number(idGenero)] = Number(quantidade);
    }
    return {
      livrosLidos: this.livros_lidos,
      livrosCadastrados: this.livros_cadastrados,
      paginasLidas: this.paginas_lidas,
      totalSessoes: this.total_sessoes,
      totalAnotacoes: this.total_anotacoes,
      totalAvaliacoes: this.total_avaliacoes,
      possuiMeta: Boolean(this.possui_meta),
      livrosLidosPorGenero: porGenero,
    };
  }
}
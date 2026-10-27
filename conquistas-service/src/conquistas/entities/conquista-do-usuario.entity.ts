import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Conquista } from './conquista.entity';


@Entity({ name: 'usuario_conquistas' })
export class ConquistaDoUsuario {
  @PrimaryColumn({ type: 'int' })
  id_usuario: number;

  @PrimaryColumn({ type: 'int' })
  id_conquista: number;

  @Column({ type: 'date', nullable: true })
  data_conquista: string | null;

  @ManyToOne(() => Conquista, (conquista) => conquista.desbloqueios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_conquista', foreignKeyConstraintName: 'fk_usuario_conquistas_conquista' })
  conquista: Conquista;
}